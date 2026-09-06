import { NextResponse } from 'next/server';

export const maxDuration = 30;

const API_KEY = process.env.RIOT_API_KEY;

const REGION_MAPPING: Record<string, { accountRouting: string; matchRouting: string; platform: string }> = {
  kr: { accountRouting: 'asia', matchRouting: 'asia', platform: 'kr' },
  tw2: { accountRouting: 'asia', matchRouting: 'sea', platform: 'tw2' },
  na1: { accountRouting: 'americas', matchRouting: 'americas', platform: 'na1' },
  euw1: { accountRouting: 'europe', matchRouting: 'europe', platform: 'euw1' },
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
    // 1. Account-v1
    const accountRes = await fetch(
      `https://${regionConfig.accountRouting}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}?api_key=${API_KEY}`,
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

    // 2. League-v4
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
      console.warn('League fetch error:', e);
    }

    // 3. Match-v5 IDs
    const matchIdsRes = await fetch(
      `https://${regionConfig.matchRouting}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?type=ranked&start=0&count=20&api_key=${API_KEY}`,
      { cache: 'no-store' }
    );

    let matches: any[] = [];

    if (matchIdsRes.ok) {
      const matchIds: string[] = await matchIdsRes.json();

      const fetchMatchDetail = async (matchId: string) => {
        try {
          const detailRes = await fetch(
            `https://${regionConfig.matchRouting}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${API_KEY}`,
            { cache: 'no-store' }
          );
          if (!detailRes.ok) return null;
          const detail = await detailRes.json();

          const info = detail.info || {};
          const participants = info.participants || [];
          const playerParticipant = participants.find((p: any) => p.puuid === puuid);

          if (!playerParticipant) return null;

          // 計算玩家隊伍總擊殺數 (用於計算參戰率)
          const teamId = playerParticipant.teamId;
          const teamTotalKills = participants
            .filter((p: any) => p.teamId === teamId)
            .reduce((sum: number, p: any) => sum + (p.kills || 0), 0);

          // 計算小兵數 (CS)
          const cs = (playerParticipant.totalMinionsKilled || 0) + (playerParticipant.neutralMinionsKilled || 0);
          const gameDurationMin = (info.gameDuration || 1) / 60;
          const totalDamage = playerParticipant.totalDamageDealtToChampions || 0;

          // 格式化 10 位參與者資料
          const formattedParticipants = participants.map((p: any) => {
            const pCs = (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0);
            return {
              puuid: p.puuid,
              summonerName: p.summonerName || p.riotIdGameName || '未知玩家',
              riotIdTagline: p.riotIdTagline || '',
              teamId: p.teamId,
              championName: p.championName || 'Fiddlesticks',
              kills: p.kills || 0,
              deaths: p.deaths || 0,
              assists: p.assists || 0,
              win: p.win || false,
              cs: pCs,
              totalMinionsKilled: pCs,
              totalDamageDealtToChampions: p.totalDamageDealtToChampions || 0,
              item0: p.item0 || 0,
              item1: p.item1 || 0,
              item2: p.item2 || 0,
              item3: p.item3 || 0,
              item4: p.item4 || 0,
              item5: p.item5 || 0,
              item6: p.item6 || 0,
              summoner1Id: p.summoner1Id,
              summoner2Id: p.summoner2Id,
            };
          });

          // 位置相容修正 (中路有時會被錯判成 UTILITY)
          let position = playerParticipant.individualPosition || playerParticipant.teamPosition || 'MIDDLE';
          if (position === 'Invalid' || position === 'UTILITY') {
            position = playerParticipant.lane === 'MIDDLE' ? 'MIDDLE' : position;
          }

          return {
            matchId: detail.metadata?.matchId,
            queueId: info.queueId,
            gameMode: info.gameMode,
            gameDuration: info.gameDuration || 0,
            gameCreation: info.gameCreation || 0,
            win: playerParticipant.win || false,
            teamId: playerParticipant.teamId, // 100 為藍方, 200 為紅方
            isBlueSide: playerParticipant.teamId === 100,
            championName: playerParticipant.championName || '',
            kills: playerParticipant.kills || 0,
            deaths: playerParticipant.deaths || 0,
            assists: playerParticipant.assists || 0,
            kda: playerParticipant.challenges?.kda || 0,
            cs,
            totalMinionsKilled: cs,
            csPerMin: Number((cs / gameDurationMin).toFixed(1)),
            dpm: Math.round(totalDamage / gameDurationMin),
            totalDamageDealtToChampions: totalDamage,
            teamTotalKills,
            killParticipation: teamTotalKills > 0 
              ? Math.round(((playerParticipant.kills + playerParticipant.assists) / teamTotalKills) * 100) 
              : 0,
            position,
            summoner1Id: playerParticipant.summoner1Id,
            summoner2Id: playerParticipant.summoner2Id,
            items: [
              playerParticipant.item0 || 0,
              playerParticipant.item1 || 0,
              playerParticipant.item2 || 0,
              playerParticipant.item3 || 0,
              playerParticipant.item4 || 0,
              playerParticipant.item5 || 0,
              playerParticipant.item6 || 0,
            ],
            participants: formattedParticipants,
          };
        } catch (err) {
          return null;
        }
      };

      const chunk1 = matchIds.slice(0, 10);
      const chunk2 = matchIds.slice(10, 20);

      const batch1 = await Promise.all(chunk1.map(fetchMatchDetail));
      const batch2 = await Promise.all(chunk2.map(fetchMatchDetail));

      matches = [...batch1, ...batch2].filter((m) => m !== null);
    }

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
    console.error('API Error:', error);
    return NextResponse.json({ error: error?.message || '伺服器內部錯誤' }, { status: 500 });
  }
}