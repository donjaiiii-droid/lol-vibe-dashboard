import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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
      return NextResponse.json({ error: '未設定 RIOT_API_KEY，請檢查 .env.local 檔案' }, { status: 500 });
    }

    const headers = { 'X-Riot-Token': apiKey };

    // 1. 取得 PUUID
    const resAccount = await fetch(
      `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      { headers, cache: 'no-store' }
    );

    if (!resAccount.ok) {
      const errText = await resAccount.text();
      return NextResponse.json({ error: `Riot 帳號查詢失敗 (${resAccount.status}): ${errText}` }, { status: resAccount.status });
    }

    const accountData = await resAccount.json();
    const puuid = accountData.puuid;

    // 2. 抓取 Match ID 列表
    const resMatches = await fetch(
      `https://sea.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=20`,
      { headers, cache: 'no-store' }
    );

    if (!resMatches.ok) {
      const errText = await resMatches.text();
      return NextResponse.json({ error: `對戰紀錄查詢失敗 (${resMatches.status}): ${errText}` }, { status: resMatches.status });
    }

    const matchIds: string[] = await resMatches.json();

    if (matchIds.length === 0) {
      return NextResponse.json({ player: accountData, matches: [] });
    }

    // 3. 批次抓取對戰詳細資料
    const matchDetails = await Promise.all(
      matchIds.map(async (id) => {
        try {
          const res = await fetch(`https://sea.api.riotgames.com/lol/match/v5/matches/${id}`, { headers, cache: 'no-store' });
          return res.ok ? await res.json() : null;
        } catch {
          return null;
        }
      })
    );

    const validMatches = matchDetails.filter((m) => m !== null);

    // 4. 排序與整理資料
    const sortedMatches = validMatches.sort((a, b) => Number(b.info.gameCreation) - Number(a.info.gameCreation));

    const matches = sortedMatches.map((m) => {
      const participant = m.info.participants.find((p: any) => p.puuid === puuid);
      const dateObj = new Date(m.info.gameCreation);
      const gameDate = `${dateObj.getFullYear()}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}`;

      const queueId = m.info.queueId;
      let modeName = m.info.gameMode;
      if (queueId === 420) modeName = '單/雙排積分';
      else if (queueId === 440) modeName = '彈性積分';
      else if (queueId === 450 || modeName === 'ARAM' || m.info.mapId === 12 || m.info.mapId === 14) modeName = '咆哮深淵 / 大混戰';

      return {
        matchId: m.metadata.matchId,
        gameCreation: m.info.gameCreation,
        gameMode: modeName,
        isRanked: queueId === 420 || queueId === 440,
        gameDate,
        win: participant?.win ?? false,
        championName: participant?.championName ?? 'Unknown',
        kills: participant?.kills ?? 0,
        deaths: participant?.deaths ?? 0,
        assists: participant?.assists ?? 0,
        kda: participant?.deaths === 0 ? 'Perfect' : (((participant?.kills ?? 0) + (participant?.assists ?? 0)) / participant.deaths).toFixed(2),
        items: [
          participant?.item0,
          participant?.item1,
          participant?.item2,
          participant?.item3,
          participant?.item4,
          participant?.item5,
          participant?.item6,
        ],
      };
    });

    return NextResponse.json({ player: accountData, matches });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || '伺服器發生未預期錯誤' }, { status: 500 });
  }
}