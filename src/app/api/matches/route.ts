import { NextResponse } from 'next/server';

const API_KEY = process.env.RIOT_API_KEY;

// 1. 正確的區域映射表
const REGION_MAPPING: Record<string, { routing: string; platform: string }> = {
  kr: { routing: 'asia', platform: 'kr' },
  tw2: { routing: 'asia', platform: 'tw2' }, // 若抓不到可試著改成 routing: 'sea'
  na1: { routing: 'americas', platform: 'na1' },
  euw1: { routing: 'europe', platform: 'euw1' },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const riotId = searchParams.get('riotId');
  const region = searchParams.get('region') || 'kr';

  if (!riotId || !riotId.includes('#')) {
    return NextResponse.json({ error: '請輸入有效的 Riot ID (例: Name#TAG)' }, { status: 400 });
  }

  const [gameName, tagLine] = riotId.split('#');
  const regionConfig = REGION_MAPPING[region.toLowerCase()] || REGION_MAPPING['kr'];

  try {
    // 1. 抓取 Account (PUUID)
    const accountRes = await fetch(
      `https://${regionConfig.routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}?api_key=${API_KEY}`
    );

    if (!accountRes.ok) {
      return NextResponse.json({ error: `找不到玩家 (HTTP ${accountRes.status})` }, { status: accountRes.status });
    }

    const accountData = await accountRes.json();
    const puuid = accountData.puuid;

    // 2. 抓取段位 (League-v4)
    const leagueRes = await fetch(
      `https://${regionConfig.platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}?api_key=${API_KEY}`
    );

    let ranks = { solo: null, flex: null };

    if (leagueRes.ok) {
      const leagueData = await leagueRes.json();
      const solo = leagueData.find((item: any) => item.queueType === 'RANKED_SOLO_5x5');
      const flex = leagueData.find((item: any) => item.queueType === 'RANKED_FLEX_SR');

      ranks = {
        solo: solo ? {
          tier: solo.tier,
          rank: solo.rank,
          leaguePoints: solo.leaguePoints,
          wins: solo.wins,
          losses: solo.losses,
          winRate: Math.round((solo.wins / (solo.wins + solo.losses)) * 100)
        } : null,
        flex: flex ? {
          tier: flex.tier,
          rank: flex.rank,
          leaguePoints: flex.leaguePoints,
          wins: flex.wins,
          losses: flex.losses,
          winRate: Math.round((flex.wins / (flex.wins + flex.losses)) * 100)
        } : null
      };
    }

    // 3. 抓取對戰 ID 列表 (Match-v5 IDs) - 之前漏掉的部分！
    const matchIdsRes = await fetch(
      `https://${regionConfig.routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=10&api_key=${API_KEY}`
    );

    let matches = [];
    if (matchIdsRes.ok) {
      const matchIds: string[] = await matchIdsRes.json();

      // 4. 平行抓取前 10 場對戰的詳細資料
      const matchPromises = matchIds.map(async (matchId) => {
        const detailRes = await fetch(
          `https://${regionConfig.routing}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${API_KEY}`
        );
        if (!detailRes.ok) return null;
        const detail = await detailRes.json();
        
        // 找到當前玩家在該對戰中的資料
        const playerParticipant = detail.info.participants.find((p: any) => p.puuid === puuid);
        
        return {
          matchId: detail.metadata.matchId,
          gameMode: detail.info.gameMode,
          gameDuration: detail.info.gameDuration,
          win: playerParticipant?.win || false,
          championName: playerParticipant?.championName || '',
          kills: playerParticipant?.kills || 0,
          deaths: playerParticipant?.deaths || 0,
          assists: playerParticipant?.assists || 0,
          kda: playerParticipant?.challenges?.kda || 0,
          totalDamageDealtToChampions: playerParticipant?.totalDamageDealtToChampions || 0,
          totalMinionsKilled: playerParticipant?.totalMinionsKilled || 0,
          summoner1Id: playerParticipant?.summoner1Id,
          summoner2Id: playerParticipant?.summoner2Id,
          item0: playerParticipant?.item0,
          item1: playerParticipant?.item1,
          item2: playerParticipant?.item2,
          item3: playerParticipant?.item3,
          item4: playerParticipant?.item4,
          item5: playerParticipant?.item5,
          item6: playerParticipant?.item6,
          participants: detail.info.participants // 傳回 10 位玩家資料供展開使用
        };
      });

      const fetchedMatches = await Promise.all(matchPromises);
      matches = fetchedMatches.filter((m) => m !== null);
    }

    // 回傳完整結果給前端
    return NextResponse.json({
      player: {
        gameName: accountData.gameName,
        tagLine: accountData.tagLine,
        puuid: accountData.puuid,
      },
      ranks,
      matches,
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: '內部伺服器錯誤' }, { status: 500 });
  }
}