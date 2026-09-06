import { NextResponse } from 'next/server';

// 允許這支 API 最多執行 30 秒（避免 Vercel 超時崩潰）
export const maxDuration = 30;

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

  if (!API_KEY) {
    return NextResponse.json({ error: '伺服器未設定 RIOT_API_KEY' }, { status: 500 });
  }

  if (!riotId || !riotId.includes('#')) {
    return NextResponse.json({ error: '請輸入有效的 Riot ID (例: Name#TAG)' }, { status: 400 });
  }

  const [gameName, tagLine] = riotId.split('#');
  const regionConfig = REGION_MAPPING[region.toLowerCase()] || REGION_MAPPING['kr'];

  try {
    // 1. 抓取 Account (PUUID)
    const accountRes = await fetch(
      `https://${regionConfig.routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}?api_key=${API_KEY}`,
      { cache: 'no-store' }
    );

    if (!accountRes.ok) {
      return NextResponse.json(
        { error: `找不到玩家或 API Key 無法使用 (HTTP ${accountRes.status})` },
        { status: accountRes.status }
      );
    }

    const accountData = await accountRes.json();
    const puuid = accountData.puuid;

    // 2. 抓取段位 (League-v4) - 回傳陣列以相容前端 .find() 語法
    let ranks: any[] = [];
    
    try {
      const leagueRes = await fetch(
        `https://${regionConfig.platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}?api_key=${API_KEY}`,
        { cache: 'no-store' }
      );

      if (leagueRes.ok) {
        ranks = await leagueRes.json();
      }
    } catch (e) {
      console.warn('League fetch ignored error:', e);
    }

    // 3. 抓取 20 場對戰 ID 列表
    const matchIdsRes = await fetch(
      `https://${regionConfig.routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=20&api_key=${API_KEY}`,
      { cache: 'no-store' }
    );

    let matches: any[] = [];

    if (matchIdsRes.ok) {
      const matchIds: string[] = await matchIdsRes.json();

      // 定義抓取單場詳細資料的函式
      const fetchMatchDetail = async (matchId: string) => {
        try {
          const detailRes = await fetch(
            `https://${regionConfig.routing}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${API_KEY}`,
            { cache: 'no-store' }
          );
          if (!detailRes.ok) return null;
          const detail = await detailRes.json();
          
          const playerParticipant = detail.info?.participants?.find((p: any) => p.puuid === puuid);
          
          return {
            matchId: detail.metadata?.matchId,
            gameMode: detail.info?.gameMode,
            gameDuration: detail.info?.gameDuration,
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
            participants: detail.info?.participants || []
          };
        } catch (err) {
          return null;
        }
      };

      // 分兩批處理以避免請求頻率過高觸發限流
      const chunk1 = matchIds.slice(0, 10);
      const chunk2 = matchIds.slice(10, 20);

      const batch1 = await Promise.all(chunk1.map(fetchMatchDetail));
      const batch2 = await Promise.all(chunk2.map(fetchMatchDetail));

      matches = [...batch1, ...batch2].filter((m) => m !== null);
    }

    // 回傳結果給前端
    return NextResponse.json({
      player: {
        gameName: accountData.gameName,
        tagLine: accountData.tagLine,
        puuid: accountData.puuid,
      },
      ranks,
      matches,
    });

  } catch (error: any) {
    console.error('API Final Catch Error:', error);
    return NextResponse.json({ error: error?.message || '內部伺服器錯誤' }, { status: 500 });
  }
}