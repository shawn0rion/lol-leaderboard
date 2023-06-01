const key = 'RGAPI-1e4606c2-21c9-450c-b34b-8fda57e35d07';
const naRegion = 'https://na1.api.riotgames.com'
const rankedQuery = '/lol/league-exp/v4/entries/RANKED_SOLO_5x5/CHALLENGER/I?page=1';
const playerQuery = '/lol/summoner/v4/summoners/by-name/'
const championQuery = '/lol/champion-mastery/v4/champion-masteries/by-summoner/'
const headersData = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9,pt;q=0.8,ar;q=0.7",
    "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
    "Origin": "https://developer.riotgames.com"
}
const characterImageUrl = 'http://ddragon.leagueoflegends.com/cdn/13.11.1/img/champion/';
// append '.png' to pfp
const profilePicUrl = 'http://ddragon.leagueoflegends.com/cdn/13.11.1/img/profileicon/'
const backupProfilePic = '28.png';
// get every champions data
const champions = [];
async function getArrayOfChampions(){
    const response = await fetch(`http://ddragon.leagueoflegends.com/cdn/13.11.1/data/en_US/champion.json`, {
        headers: headersData
    })
    const data = await response.json();
    for (let champ in data.data){
        champions.push(data.data[champ])
    }
}
getArrayOfChampions();


async function getImage(dragonLink, imageUrl){
    const response = await fetch(dragonLink+imageUrl);
    const data = await response.json();
    return data;
}

async function getTopPlayers(){
    let fullLeaderboardUrl = naRegion + rankedQuery + "&api_key=" + key;
    const response = await fetch(fullLeaderboardUrl, {
        headers: headersData
    });
    const data = await response.json();
    // simplify data
    let topTenSummoners = data.slice(0,10);
    topTenSummoners = topTenSummoners.map(summoner => summoner = {
            name: summoner.summonerName, 
            id: summoner.summonerId,
            position: topTenSummoners.indexOf(summoner) + 1,
            elo: summoner.leaguePoints,
            wins: summoner.wins,
            losses: summoner.losses,
            hotStreak: summoner.hotStreak,
    })
    // add image data to each summoner object
    for (let summoner of topTenSummoners){
        summoner['recentChampImages'] = [];
        summoner['pfp'] = '';

        // get profile pic and handle error
        let summonerData = await getSummoner(summoner);
        if (summonerData !== undefined){
            summoner['pfp'] = profilePicUrl+summonerData.profileIconId + '.png';        
        } else{
            summoner['pfp'] = profilePicUrl+ backupProfilePic;
        }
        // copy this array and sort by recently played.
        let summonerChamps = await getSummonerChampions(summoner.id);
        let recentlyPlayedChamps = summonerChamps.slice().sort((a,b) => b.lastPlayTime - a.lastPlayTime);
        recentlyPlayedChamps = recentlyPlayedChamps.slice(0,3);

        // get champ images
        recentlyPlayedChamps.forEach(recentChamp => {
            const champion = champions.find(champ => champ.key == recentChamp.championId);
            const champImage = characterImageUrl + champion.image.full;
            summoner['recentChampImages'].push(champImage);
        })
    }
    console.log(topTenSummoners)
    return topTenSummoners;
}

async function getSummoner(summoner){
    let summonerNameUrl = playerQuery + summoner.name;
    let fullSummonerNameUrl = naRegion + summonerNameUrl + "?api_key=" + key;
    try{
        const response = await fetch(fullSummonerNameUrl,{
            headers: headersData
        })
        const data = await response.json()
        return data;
    }catch(error){
        console.log(error);
    }
}

async function getSummonerChampions(encryptedId){
    let fullChampionMasteryUrl = naRegion + championQuery + encryptedId + "?api_key=" + key;
    const response = await fetch(fullChampionMasteryUrl,{
        headers: headersData
    })
    const data = await response.json();
    return data;
}



// 
async function getPodium(topThree){
    const switchedArray = [topThree[1], topThree[0], topThree[2]];
    let podiumInnerHtml = '';
    switchedArray.forEach((summoner, idx) => {
        const recentChampImages = summoner.recentChampImages.map(x => `<img src="${x}" class="recent-champ">`).join('');
        podiumInnerHtml += `
        <div class="player-card ${idx === 1 ? 'peak' : ''}">
            <div class="pfp-wrapper">
                <img src="${summoner.pfp}" class="pfp">
                    <div class="position-wrapper"></div>
                <div class="position-text">${summoner.position}</div>
            </div>
            <div class="card-text">
                <div class="card-name">${summoner.name}</div>
                <div class="card-elo">${summoner.elo}</div>
                <div class="card-wl">${summoner.wins}/${summoner.losses}</div>
            </div>
            <div class="champs-container">
                <p>Recently-played:</p>
                <div class="recent-champs">
                    ${recentChampImages}
                </div>
            </div>
        </div>`
    })
    return podiumInnerHtml;
}


async function getSummonerCard(summoner){
    const recentChampImages = summoner.recentChampImages.map(x => `<img src="${x}" class="recent-champ">`).join('');
    const html = `
    <div class="player-row">    
        <div class="main">
            <div class="pfp-wrapper">
                <img src="${summoner.pfp}" alt="" class="pfp">
                <div class="streak">
                    <i class="fas fa-chevron-${summoner.hotStreak ? "up" : "down"}"></i>
                </div>
            </div>
            <div class="summoner-name">${summoner.name}</div>
            <div class="empty"></div>
            <div class="win-loss">
                <div class="wins">${summoner.wins}</div>
                /
                <div class="losses">${summoner.losses}</div>
            </div>
            <div class="league-points">${summoner.elo}</div>
        </div>
        <div class="champs-container">
            <p>Recently played:</p>
            <div class="recent-champs">
                ${recentChampImages}
            </div>
        </div>
    </div>
   `
   return html;
}



async function handleRowClick(){
    const playerRows = document.querySelectorAll('.player-row .main')
    playerRows.forEach(row => {
        row.addEventListener('click', e => {
            const {currentTarget} = e;
            const {parentElement} = currentTarget;
            const champsContainer =  parentElement.querySelector('.champs-container');;
            handleRecentChampsLogic(champsContainer);
        })
    })
}
async function handleCardClick(){
    const playerPodium = document.querySelector('.player-podium');
    const playerCards = document.querySelectorAll('.player-card');
    const podiumChamps = document.querySelector('#podium-champs-container');
    playerCards.forEach(card => {
        card.addEventListener('click', e => {
            const summonerChampsHTML = e.currentTarget.querySelector('.champs-container').innerHTML;
            // cancel a refresh of same summoner
            if (podiumChamps.innerHTML === summonerChampsHTML){
                podiumChamps.classList.remove('active');
                podiumChamps.innerHTML = '';
                return;
            // delay the data switch so the images can change off screen
            } else if (podiumChamps.innerHTML !== summonerChampsHTML && podiumChamps.classList.contains('active')){
                setTimeout(() => {
                    podiumChamps.innerHTML = summonerChampsHTML;
                },250)
            } else{
                podiumChamps.innerHTML = summonerChampsHTML;
            }
            handleRecentChampsLogic(podiumChamps);
        })
    })
}

function handleRecentChampsLogic(nextActiveElement){
    const activeElement = document.querySelector('.active');
    if (activeElement !== null && (nextActiveElement !== activeElement || 
        (nextActiveElement === activeElement &&
        activeElement.id === 'podium-champs-container'))){
        activeElement.classList.remove('active');
        setTimeout(() => {nextActiveElement.classList.add('active')}, 250)
    } else if(activeElement !== null){
        activeElement.classList.remove('active');
    } else{
        nextActiveElement.classList.add('active');
    }
}


async function main() {
    const topSummoners = await getTopPlayers();
    
    const remainingSummonersLeaderboard = document.querySelector('.summoners');
    const playerPodium = document.querySelector('.player-podium');

    playerPodium.innerHTML = await getPodium(topSummoners.slice(0,3));
    for (let summoner in topSummoners.slice(3)){
        remainingSummonersLeaderboard.innerHTML += await getSummonerCard(topSummoners.slice(3)[summoner]);
    }
    await handleCardClick();
    await handleRowClick();
}

main();