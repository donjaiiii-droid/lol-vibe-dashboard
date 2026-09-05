import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const riotId = searchParams.get('riotId');

    if (!riotId || !riotId.includes('#')) {
      return NextResponse.json({ error: '格式錯誤 (例: Fungz#TW2)' }, { status: 400 });
    }

    const [gameName, tagLine] = riotId.split('#');
    const apiKey = process.env.RIOT_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: '未設定 API Key' }, { status: 500 });
    }

    const headers = { 'X-Riot-Token': apiKey };

    // 1. ACCOUNT-V1
    const accountRes = await fetch(
      `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      { headers, cache: 'no-store' }
    );

    if (!accountRes.ok) {
      return NextResponse.json({ error: '找不到該玩家' }, { status: accountRes.status });
    }

    const accountData = await accountRes.json();
    const puuid = accountData.puuid;

    // 2. SUMMONER-V4
    let summonerData: any = null;
    const regions = ['tw2', 'sg2', 'kr'];

    for (const reg of regions) {
      const res = await fetch(`https://${reg}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`, {
        headers,
        cache: 'no-store',
      });
      if (res.ok) {
        summonerData = { ...(await res.json()), region: reg };
        break;
      }
    }

    let rankedData: any[] = [];
    if (summonerData?.id) {
      const leagueRes = await fetch(
        `https://${summonerData.region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerData.id}`,
        { headers, cache: 'no-store' }
      );
      if (leagueRes.ok) {
        rankedData = await leagueRes.json();
      }
    }

    const soloQueue = rankedData.find((q: any) => q.queueType === 'RANKED_SOLO_5x5');
    const flexQueue = rankedData.find((q: any) => q.queueType === 'RANKED_FLEX_SR');

    const ranks = {
      solo: soloQueue
        ? {
            tier: soloQueue.tier,
            rank: soloQueue.rank,
            leaguePoints: soloQueue.leaguePoints,
            wins: soloQueue.wins,
            losses: soloQueue.losses,
            winRate: Math.round((soloQueue.wins / (soloQueue.wins + soloQueue.losses)) * 100),
          }
        : null,
      flex: flexQueue
        ? {
            tier: flexQueue.tier,
            rank: flexQueue.rank,
            leaguePoints: flexQueue.leaguePoints,
            wins: flexQueue.wins,
            losses: flexQueue.losses,
            winRate: Math.round((flexQueue.wins / (flexQueue.wins + flexQueue.losses)) * 100),
          }
        : null,
    };

    // 3. MATCH-V5 (抓取最多 50 場)
    const ninetyDaysAgoInSeconds = Math.floor((Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000);
    const queueUrls = [
      `https://sea.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?startTime=${ninetyDaysAgoInSeconds}&queue=420&start=0&count=50`,
      `https://sea.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?startTime=${ninetyDaysAgoInSeconds}&queue=440&start=0&count=50`,
    ];

    const responses = await Promise.all(
      queueUrls.map((url) => fetch(url, { headers, cache: 'no-store' }).then((r) => (r.ok ? r.json() : [])))
    );

    const rawMatchIds = Array.from(new Set(responses.flat())) as string[];
    const targetIds = rawMatchIds.slice(0, 35);

    const matchDetailsPromises = targetIds.map(async (matchId) => {
      const region = matchId.startsWith('TW2') || matchId.startsWith('SG') || matchId.startsWith('SEA') ? 'sea' : 'asia';
      const res = await fetch(`https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}`, { headers, cache: 'no-store' });
      return res.ok ? res.json() : null;
    });

    const matchesRaw = await Promise.all(matchDetailsPromises);
    const validMatches = matchesRaw.filter((m) => m !== null);
    validMatches.sort((a, b) => Number(b.info.gameCreation) - Number(a.info.gameCreation));

    const matches = validMatches.map((m) => {
      const participant = m.info.participants.find((p: any) => p.puuid === puuid);
      const dateObj = new Date(m.info.gameCreation);
      const gameDate = `${dateObj.getFullYear()}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}`;
      const queueId = m.info.queueId;
      const gameDurationSeconds = m.info.gameDuration || 1;
      const gameDurationMinutes = gameDurationSeconds / 60;

      let modeName = m.info.gameMode;
      if (queueId === 420) modeName = '單/雙排積分';
      else if (queueId === 440) modeName = '彈性積分';

      const teamId = participant?.teamId; // 100: Blue, 200: Red
      const teamKills = m.info.participants
        .filter((p: any) => p.teamId === teamId)
        .reduce((sum: number, p: any) => sum + p.kills, 0);

      const userKills = participant?.kills ?? 0;
      const userAssists = participant?.assists ?? 0;
      const killParticipation = teamKills > 0 ? Math.round(((userKills + userAssists) / teamKills) * 100) : 0;

      const totalCs = (participant?.totalMinionsKilled ?? 0) + (participant?.neutralMinionsKilled ?? 0);
      const csPerMin = (totalCs / gameDurationMinutes).toFixed(1);

      return {
        matchId: m.metadata.matchId,
        gameCreation: m.info.gameCreation,
        gameDurationSeconds,
        gameDuration: Math.floor(gameDurationMinutes),
        gameMode: modeName,
        isRanked: queueId === 420 || queueId === 440,
        gameDate,
        dayOfWeek: dateObj.getDay(), // 0: Sun, 1: Mon...
        win: participant?.win ?? false,
        side: teamId === 100 ? 'blue' : 'red',
        championName: participant?.championName ?? 'Unknown',
        kills: userKills,
        deaths: participant?.deaths ?? 0,
        assists: userAssists,
        kda: participant?.deaths === 0 ? 'Perfect' : ((userKills + userAssists) / participant.deaths).toFixed(2),
        killParticipation,
        position: participant?.individualPosition || 'UTILITY',
        totalCs,
        csPerMin,
        totalDamage: participant?.totalDamageDealtToChampions ?? 0,
        summoner1Id: participant?.summoner1Id ?? 0,
        summoner2Id: participant?.summoner2Id ?? 0,
        primaryStyle: participant?.perks?.styles?.[0]?.selections?.[0]?.perk ?? 0,
        items: [
          participant?.item0,
          participant?.item1,
          participant?.item2,
          participant?.item3,
          participant?.item4,
          participant?.item5,
          participant?.item6,
        ],
        teams: m.info.participants.map((p: any) => ({
          puuid: p.puuid,
          summonerName: p.riotIdGameName || p.summonerName,
          championName: p.championName,
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
          totalCs: (p.totalMinionsKilled ?? 0) + (p.neutralMinionsKilled ?? 0),
          totalDamage: p.totalDamageDealtToChampions ?? 0,
          win: p.win,
        })),
      };
    });

    return NextResponse.json({ player: accountData, ranks, matches });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || '伺服器錯誤' }, { status: 500 });
  }
}