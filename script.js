// =======================================================
//        SCRIPT.JS FINAL - CONECTADO AO BACKEND
// =======================================================

const BACKEND_API_URL = "https://script.google.com/macros/s/AKfycbw-Rk8BwCem03SDiVAEPulu7FKFOAHu6WsiRWd9RS3tWBIZxwA1iOoMScA_OxGrGNxH/exec"; 

const tierValues = { "CHALLENGER": 10, "GRANDMASTER": 9, "MASTER": 8, "DIAMOND": 7, "EMERALD": 6, "PLATINUM": 5, "GOLD": 4, "SILVER": 3, "BRONZE": 2, "IRON": 1 };
const rankValues = { "I": 4, "II": 3, "III": 2, "IV": 1 };
const tierImages = {
    "CHALLENGER": "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-challenger.png",
    "GRANDMASTER": "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-grandmaster.png",
    "MASTER": "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-master.png",
    "DIAMOND": "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-diamond.png",
    "EMERALD": "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-emerald.png",
    "PLATINUM": "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-platinum.png",
    "GOLD": "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-gold.png",
    "SILVER": "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-silver.png",
    "BRONZE": "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-bronze.png",
    "IRON": "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-iron.png"
};

async function fetchAndDisplayRanks() {
    const skeletonLoader = document.getElementById('skeleton-loader');
    const container = document.getElementById('ranking-container');
    
    if (skeletonLoader) skeletonLoader.style.display = 'block';
    container.innerHTML = '';

    try {
        const response = await fetch(BACKEND_API_URL);
        if (!response.ok) throw new Error("Falha ao buscar dados do backend.");
        let playerData = await response.json();

        playerData.sort((a, b) => {
            const lpA = (tierValues[a.tier] * 400) + (rankValues[a.rank] * 100) + a.leaguePoints;
            const lpB = (tierValues[b.tier] * 400) + (rankValues[b.rank] * 100) + b.leaguePoints;
            return lpB - lpA;
        });

        if (skeletonLoader) skeletonLoader.style.display = 'none';
        displayRanking(playerData);
    } catch (error) {
        console.error("Erro ao carregar o ranking:", error);
        if (skeletonLoader) skeletonLoader.style.display = 'none';
        container.innerHTML = `<div class="player-row" style="justify-content: center; color: #e74c3c;"><p>Erro ao carregar o ranking. Verifique o console.</p></div>`;
    }
}

function displayRanking(playerData) {
    const container = document.getElementById('ranking-container');
    container.innerHTML = ""; 

    if (playerData.length === 0) {
        container.innerHTML = `<div class="player-row" style="justify-content: center;"><p>Nenhum dado de jogador encontrado. O backend pode estar a coletar os dados iniciais.</p></div>`;
        return;
    }

    playerData.forEach((player, index) => {
        const playerLink = document.createElement('a');
        playerLink.href = `https://www.op.gg/summoners/br/puuid-${player.puuid}`;
        playerLink.target = "_blank";
        playerLink.rel = "noopener noreferrer";
        
        const playerDiv = document.createElement('div');
        playerDiv.className = `player-row tier-${player.tier.toLowerCase()}`;
        
        const totalGames = player.wins + player.losses;
        const winRate = totalGames > 0 ? ((player.wins / totalGames) * 100).toFixed(1) : 0;
        
        const weeklyChangeText = player.weeklyChange > 0 ? `<span class="lp-gain">+${player.weeklyChange} PDL</span>` : (player.weeklyChange < 0 ? `<span class="lp-loss">${player.weeklyChange} PDL</span>` : `<span>= ${player.weeklyChange} PDL</span>`);
        const monthlyChangeText = player.monthlyChange > 0 ? `<span class="lp-gain">+${player.monthlyChange} PDL</span>` : (player.monthlyChange < 0 ? `<span class="lp-loss">${player.monthlyChange} PDL</span>` : `<span>= ${player.monthlyChange} PDL</span>`);

        playerDiv.innerHTML = `
            <img class="rank-emblem" src="${tierImages[player.tier] || ''}" alt="Emblema do Elo ${player.tier}">
            <div class="player-rank">#${index + 1}</div>
            <div class="player-info">
                <h3>${player.gameName}</h3>
                <p>${player.tier} ${player.rank} - ${player.leaguePoints} PDL</p>
                <p>Vitórias: ${player.wins} | Derrotas: ${player.losses} | Win Rate: <strong>${winRate}%</strong></p>
                <p>Saldo Semanal: ${weeklyChangeText} | Saldo Mensal: ${monthlyChangeText}</p>
            </div>
        `;
        
        playerLink.appendChild(playerDiv);
        container.appendChild(playerLink);
    });
}

const refreshBtn = document.getElementById('refresh-button');
refreshBtn.addEventListener('click', fetchAndDisplayRanks);
fetchAndDisplayRanks();