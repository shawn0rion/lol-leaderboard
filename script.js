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
async function getLeaderboard(){
    let fullLeaderboardUrl = naRegion + rankedQuery + "&api_key=" + key;
    const response = await fetch(fullLeaderboardUrl, {
        headers: headersData
    });
    const data = await response.json();
    const topTenSummoners = data.slice(0,10);
    for (let summoner of topTenSummoners){

        const summonerData = await getSummoner(summoner)
        const summonerChamps = await getChampions(summoner.summonerId);

        console.log('lb data: ', summoner);
        console.log('summ data: ', summonerData);
        console.log('summ champs', summonerChamps )
        break;

    }

    // console.log(getSummoner(data[0].summonerName))
}

async function getSummoner(summoner){
    let summonerNameUrl = playerQuery + summoner.name;
    let fullSummonerNameUrl = naRegion + summonerNameUrl + "?api_key=" + key;
    const response = await fetch(fullSummonerNameUrl,{
        headers: headersData
    })
    const data = await response.json();
    return data;
}

async function getChampions(encryptedId){
    let fullChampionMasteryUrl = naRegion + championQuery + encryptedId + "?api_key=" + key;
    const response = await fetch(fullChampionMasteryUrl,{
        headers: headersData
    })
    const data = await response.json();
    return data;
}
const summonerNameTest = 'twtv Gryffinn';
getLeaderboard();
