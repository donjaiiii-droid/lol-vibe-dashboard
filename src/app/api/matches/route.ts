import { NextResponse } from 'next/server';

const API_KEY = process.env.RIOT_API_KEY;

const REGION_MAPPING: Record<string, { routing: string; platform: string }> = {
  kr: { routing: 'asia', platform: 'kr' },
  tw2: { routing: 'asia', platform: 'tw2' },
  na1: { routing: 'americas', platform: 'na1' },
  euw1: { routing: 'europe', platform: 'euw1' },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const riotId = searchParams.get('riotId');
  const region = searchParams.get('region') || 'kr';

  if (!riotId || !riotId.includes('#')) {
    return NextResponse.json({ error: '請輸入有效的 Riot ID (範例: Name#TAG)' }, { status: 400 });
  }

  const [gameName, tagLine] = riotId.split('#');
  const regionConfig = REGION_MAPPING[region.toLowerCase()] || REGION_MAPPING['kr'];

  try {
    // 1. 取得 Account (PUUID)
    const accountRes = await fetch(
      `https://${regionConfig.routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}?api_key=${API_KEY}`
    );

    if (!accountRes.ok) {
      return NextResponse.json({ error: `找不到玩家 (HTTP ${accountRes.status})` }, { status: accountRes.status });
    }
    const accountData = await accountRes.json();
    const puuid = accountData.puuid;

    // 2. 直接透過 PUUID 取得階級資訊
    const leagueRes = await fetch(
      `https://${regionConfig.platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}?api_key=${API_KEY}`
    );
    
    // 💡 顯式宣告 ranks 的型態，解決 TypeScript TS2322 報錯
    let ranks: { solo: any; flex: any } = { solo: null, flex: null };

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

    // 3. 取得近期 20 場對戰 IDs
    const matchesListRes = await fetch(
      `https://${regionConfig.routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=20&api_key=${API_KEY}`
    );
    const matchIds = matchesListRes.ok ? await matchesListRes.json() : [];

    return NextResponse.json({
      player: {
        gameName: accountData.gameName,
        tagLine: accountData.tagLine,
        puuid: puuid
      },
      ranks: ranks,
      matches: matchIds
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || '伺服器內部錯誤' }, { status: 500 });
  }
}