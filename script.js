// =======================================================
//        SCRIPT.JS - VERSÃO COM NOVAS FUNCIONALIDADES
// =======================================================

// --- ÁREA DE CONFIGURAÇÃO ---
const RIOT_API_KEY = "RGAPI-474658c4-2fe0-4f31-9f85-fc0ea4d94a7c"; 

const riotIds = [
    "Atziluth#537",
    "gordaker#prata",
    "Dorrows#0488"
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

// Função principal, agora chamada para buscar e exibir os dados
async function fetchAndDisplayRanks() {
    const loadingElement = document.getElementById('loading');
    const container = document.getElementById('ranking-container');
    
    loadingElement.style.display = 'block';
    container.innerHTML = '';

    // Usamos Promise.all para buscar os dados de todos os jogadores em paralelo, o que é mais rápido
    const playerDataPromises = riotIds.map(id => getSummonerRank(id));
    const playerData = (await Promise.all(playerDataPromises)).filter(p => p !== null);

    playerData.sort((a, b) => {
        if (a.tierValue !== b.tierValue) return b.tierValue - a.tierValue;
        if (a.rankValue !== b.rankValue) return b.rankValue - a.rankValue;
        return b.leaguePoints - a.leaguePoints;
    });

    loadingElement.style.display = 'none';
    displayRanking(playerData);
}

// Função de busca de ranking com a adição da verificação de Jogo Ao Vivo
async function getSummonerRank(fullRiotId) {
    try {
        const parts = fullRiotId.split('#');
        const gameName = parts[0];
        const tagLine = parts[1];

        if (!gameName || !tagLine) {
            throw new Error(`Riot ID inválido no array: '${fullRiotId}'`);
        }

        const encodedGameName = encodeURIComponent(gameName);
        const encodedTagLine = encodeURIComponent(tagLine);

        // ETAPA 1: Converte o Riot ID para um PUUID.
        const accountUrl = `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodedGameName}/${encodedTagLine}?api_key=${RIOT_API_KEY}`;
        const accountResponse = await fetch(accountUrl);
        if (!accountResponse.ok) throw new Error(`Riot ID não encontrado: ${fullRiotId}`);
        const accountData = await accountResponse.json();
        
        // ETAPA 2: Usa o PUUID para buscar o ELO diretamente
        const rankUrl = `https://br1.api.riotgames.com/lol/league/v4/entries/by-puuid/${accountData.puuid}?api_key=${RIOT_API_KEY}`;
        const rankResponse = await fetch(rankUrl);
        if (!rankResponse.ok) throw new Error(`Dados de ranking não encontrados para o PUUID: ${accountData.puuid}`);
        const rankData = await rankResponse.json();
        
        if (!Array.isArray(rankData) || rankData.length === 0) {
            console.log(`Dados de ranking para '${fullRiotId}' não retornaram uma lista.`);
            return null;
        }
        
        const soloQueueData = rankData.find(q => q.queueType === "RANKED_SOLO_5x5");
        
        if (!soloQueueData) return null;

        // ETAPA 3 (BÓNUS): Verificar se o jogador está em partida
        let isLive = false;
        try {
            // Este endpoint precisa do 'summonerId', que vem nos dados do ranking (soloQueueData)
            const spectatorUrl = `https://${region}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${soloQueueData.summonerId}?api_key=${RIOT_API_KEY}`;
            const spectatorResponse = await fetch(spectatorUrl);
            if (spectatorResponse.ok) {
                isLive = true;
            }
        } catch (e) {
            // Se der erro (normalmente 404), o jogador não está em jogo. Não fazemos nada.
        }

        return { 
            ...soloQueueData, 
            summonerName: fullRiotId, 
            isLive: isLive, // Adiciona o status de "em jogo"
            tierValue: tierValues[soloQueueData.tier] || 0, 
            rankValue: rankValues[soloQueueData.rank] || 0 
        };

    } catch (error) {
        console.error(`Falha no processo para '${fullRiotId}':`, error);
        return null;
    }
}

// Função de exibição com as novas informações
function displayRanking(playerData) {
    const container = document.getElementById('ranking-container');
    container.innerHTML = ""; 

    if (playerData.length === 0) {
        container.innerHTML = `<div class="player-row" style="justify-content: center;"><p>Nenhum jogador com ranking encontrado. Verifique os nomes e a chave de API.</p></div>`;
        return;
    }

    playerData.forEach((player, index) => {
        const playerLink = document.createElement('a');
        const opggName = player.summonerName.replace('#', '-');
        playerLink.href = `https://www.op.gg/summoners/br/${encodeURIComponent(opggName)}`;
        playerLink.target = "_blank";
        playerLink.rel = "noopener noreferrer";
        
        const playerDiv = document.createElement('div');
        playerDiv.className = `player-row tier-${player.tier.toLowerCase()}`;
        
        // Calcular Win Rate
        const totalGames = player.wins + player.losses;
        const winRate = totalGames > 0 ? ((player.wins / totalGames) * 100).toFixed(1) : 0;

        playerDiv.innerHTML = `
            <img class="rank-emblem" src="${tierImages[player.tier] || ''}" alt="Emblema do Elo ${player.tier}">
            <div class="player-rank">#${index + 1}</div>
            <div class="player-info">
                <h3>
                    ${player.summonerName.split('#')[0]}
                    ${player.hotStreak ? '<span class="hot-streak" title="Em sequência de vitórias!">🔥</span>' : ''}
                    ${player.isLive ? '<span class="live-indicator" title="Em partida!"></span>' : ''}
                </h3>
                <p>${player.tier} ${player.rank} - ${player.leaguePoints} PDL</p>
                <p>Vitórias: ${player.wins} | Derrotas: ${player.losses}</p>
                <p>Win Rate: <strong>${winRate}%</strong> (${totalGames} jogos)</p>
            </div>
        `;
        
        playerLink.appendChild(playerDiv);
        container.appendChild(playerLink);
    });
}

// --- LÓGICA DE INICIALIZAÇÃO E BOTÃO ---

// Pega o botão do HTML
const refreshBtn = document.getElementById('refresh-button');

// Quando o botão for clicado, executa a função de busca
refreshBtn.addEventListener('click', fetchAndDisplayRanks);

// Chama a função uma vez quando a página carrega pela primeira vez
fetchAndDisplayRanks();
