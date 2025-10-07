// =======================================================
//        SCRIPT.JS - VERSÃO FINAL E FUNCIONAL
//        (Usando o método /entries/by-puuid/)
// =======================================================

// --- ÁREA DE CONFIGURAÇÃO ---
const RIOT_API_KEY = "RGAPI-474658c4-2fe0-4f31-9f85-fc0ea4d94a7c"; 

const riotIds = [
    "Atziluth#537",
    "gordaker#prata",
    "Dorrows#0488"
    // Adicione aqui outros Riot IDs que você queira ranquear
];

const region = "br1"; 
// --- FIM DA ÁREA DE CONFIGURAÇÃO ---

const tierValues = {
    "CHALLENGER": 10, "GRANDMASTER": 9, "MASTER": 8, "DIAMOND": 7,
    "EMERALD": 6, "PLATINUM": 5, "GOLD": 4, "SILVER": 3, "BRONZE": 2, "IRON": 1
};
const rankValues = { "I": 4, "II": 3, "III": 2, "IV": 1 };

const tierImages = {
    "CHALLENGER": "https://raw.communitydragon.org/14.18/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-challenger.png",
    "GRANDMASTER": "https://raw.communitydragon.org/14.18/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-grandmaster.png",
    "MASTER": "https://raw.communitydragon.org/14.18/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-master.png",
    "DIAMOND": "https://raw.communitydragon.org/14.18/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-diamond.png",
    "EMERALD": "https://raw.communitydragon.org/14.18/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-emerald.png",
    "PLATINUM": "https://raw.communitydragon.org/14.18/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-platinum.png",
    "GOLD": "https://raw.communitydragon.org/14.18/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-gold.png",
    "SILVER": "https://raw.communitydragon.org/14.18/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-silver.png",
    "BRONZE": "https://raw.communitydragon.org/14.18/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-bronze.png",
    "IRON": "https://raw.communitydragon.org/14.18/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-iron.png"
};

async function main() {
    const playerData = [];
    const loadingElement = document.getElementById('loading');
    
    for (const id of riotIds) {
        await new Promise(resolve => setTimeout(resolve, 250)); 
        const data = await getSummonerRank(id);
        if (data) {
            playerData.push(data);
        }
    }

    playerData.sort((a, b) => {
        if (a.tierValue !== b.tierValue) return b.tierValue - a.tierValue;
        if (a.rankValue !== b.rankValue) return b.rankValue - a.rankValue;
        return b.leaguePoints - a.leaguePoints;
    });

    loadingElement.style.display = 'none';
    displayRanking(playerData);
}

// Função de busca de ranking, agora simplificada para 2 passos
async function getSummonerRank(fullRiotId) {
    try {
        const parts = fullRiotId.split('#');
        const gameName = encodeURIComponent(parts[0]);
        const tagLine = encodeURIComponent(parts[1]);

        if (!gameName || !tagLine) {
            throw new Error(`Riot ID inválido no array: '${fullRiotId}'`);
        }

        // ETAPA 1: Converte o Riot ID para um PUUID. (Continua igual)
        const accountUrl = `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}?api_key=${RIOT_API_KEY}`;
        const accountResponse = await fetch(accountUrl);
        if (!accountResponse.ok) throw new Error(`Riot ID não encontrado: ${fullRiotId}`);
        const accountData = await accountResponse.json();
        
        // ETAPA 2: Usa o PUUID para buscar o ELO diretamente (NOVO MÉTODO!)
        const rankUrl = `https://${region}.api.riotgames.com/lol/league/v4/entries/by-puuid/${accountData.puuid}?api_key=${RIOT_API_KEY}`;
        const rankResponse = await fetch(rankUrl);
        if (!rankResponse.ok) throw new Error(`Dados de ranking não encontrados para o PUUID: ${accountData.puuid}`);
        const rankData = await rankResponse.json();
        
        if (!Array.isArray(rankData)) {
            console.log(`Dados de ranking para '${fullRiotId}' não retornaram uma lista.`);
            return null;
        }
        
        const soloQueueData = rankData.find(q => q.queueType === "RANKED_SOLO_5x5");
        
        if (soloQueueData) {
            // Precisamos adicionar o summonerName manualmente, pois este método não o retorna.
            // Usamos o gameName do Riot ID como substituto.
            return { 
                ...soloQueueData, 
                summonerName: gameName, // Adicionando o nome do jogador
                tierValue: tierValues[soloQueueData.tier] || 0, 
                rankValue: rankValues[soloQueueData.rank] || 0 
            };
        }

        return null; 

    } catch (error) {
        console.error(`Falha no processo para '${fullRiotId}':`, error);
        return null;
    }
}

// SUBSTITUA A SUA FUNÇÃO displayRanking INTEIRA POR ESTA
function displayRanking(playerData) {
    const container = document.getElementById('ranking-container');
    container.innerHTML = ""; 

    if (playerData.length === 0) {
        container.innerHTML = `<div class="player-row" style="justify-content: center;"><p>Nenhum jogador com ranking encontrado. Verifique os nomes e a chave de API.</p></div>`;
        return;
    }

    playerData.forEach((player, index) => {
        const playerDiv = document.createElement('div');
        // Adiciona a classe CSS para a cor da borda dinâmica
        playerDiv.className = `player-row tier-${player.tier.toLowerCase()}`;
        
        // O HTML agora inclui a tag <img> para o emblema do elo
        playerDiv.innerHTML = `
            <img class="rank-emblem" src="${tierImages[player.tier] || ''}" alt="Emblema do Elo ${player.tier}">
            <div class="player-rank">#${index + 1}</div>
            <div class="player-info">
                <h3>${decodeURIComponent(player.summonerName)}</h3>
                <p>${player.tier} ${player.rank} - ${player.leaguePoints} PDL</p>
                <p>Vitórias: ${player.wins} | Derrotas: ${player.losses}</p>
            </div>
        `;
        container.appendChild(playerDiv);
    });
}

main();