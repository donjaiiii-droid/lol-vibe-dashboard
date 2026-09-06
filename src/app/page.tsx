'use client';

import React, { useState, useEffect } from 'react';

// Helper: 處理英雄頭像 CDN 連結與新英雄/拼字相容
const getChampionImg = (name: string) => {
  if (!name || name === 'Locke' || name === 'Unknown') {
    return 'https://ddragon.leagueoflegends.com/cdn/14.5.1/img/champion/Square.png';
  }
  const nameMap: Record<string, string> = {
    FiddleSticks: 'Fiddlesticks',
    Galio: 'Galio',
  };
  const cleanName = nameMap[name] || name;
  return `https://ddragon.leagueoflegends.com/cdn/14.5.1/img/champion/${cleanName}.png`;
};

// Helper: 處理裝備圖片 CDN
const getItemImg = (itemId: number) => {
  if (!itemId || itemId === 0) return null;
  return `https://ddragon.leagueoflegends.com/cdn/14.5.1/img/item/${itemId}.png`;
};

// 時間格式化 Helper (秒 -> MM:SS)
const formatDuration = (seconds: number) => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<'概要' | '風格' | 'Champions'>('Champions');
  const [region, setRegion] = useState('kr');
  const [riotId, setRiotId] = useState('Hide on bush#KR1');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // 控制點擊展開每場對戰細節
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  const fetchPlayerData = async () => {
    if (!riotId.includes('#')) {
      setError('請輸入完整的 Riot ID (例如: Hide on bush#KR1)');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/matches?riotId=${encodeURIComponent(riotId)}&region=${region}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || '抓取資料失敗');
      }
      setData(json);
    } catch (err: any) {
      setError(err.message || '發生未知錯誤');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayerData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPlayerData();
  };

  const toggleExpand = (matchId: string) => {
    setExpandedMatchId(expandedMatchId === matchId ? null : matchId);
  };

  // 取得單雙排與彈性積分資料
  const soloRank = data?.ranks?.find((r: any) => r.queueType === 'RANKED_SOLO_5x5');
  const flexRank = data?.ranks?.find((r: any) => r.queueType === 'RANKED_FLEX_SR');

  // 1. 計算風格分析數據
  const getStyleAnalytics = () => {
    const matches = data?.matches || [];
    const totalGames = matches.length;
    if (totalGames === 0) {
      return {
        avgDuration: '0:00',
        blueGames: 0,
        redGames: 0,
        blueWinRate: 0,
        redWinRate: 0,
        bluePickRate: 0,
        redPickRate: 0,
        weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
      };
    }

    const totalDurationSec = matches.reduce((sum: number, m: any) => sum + (m.gameDuration || 0), 0);
    const avgDuration = formatDuration(Math.round(totalDurationSec / totalGames));

    const blueMatches = matches.filter((m: any) => m.teamId === 100 || m.isBlueSide);
    const redMatches = matches.filter((m: any) => m.teamId === 200 || (!m.isBlueSide && m.teamId !== 100));

    const blueGames = blueMatches.length;
    const redGames = redMatches.length;

    const blueWins = blueMatches.filter((m: any) => m.win).length;
    const redWins = redMatches.filter((m: any) => m.win).length;

    const blueWinRate = blueGames > 0 ? Math.round((blueWins / blueGames) * 100) : 0;
    const redWinRate = redGames > 0 ? Math.round((redWins / redGames) * 100) : 0;

    const bluePickRate = Math.round((blueGames / totalGames) * 100);
    const redPickRate = Math.round((redGames / totalGames) * 100);

    const weeklyActivity = [0, 0, 0, 0, 0, 0, 0];
    matches.forEach((m: any) => {
      if (m.gameCreation) {
        const day = new Date(m.gameCreation).getDay();
        weeklyActivity[day] += 1;
      }
    });

    return {
      avgDuration,
      blueGames,
      redGames,
      blueWinRate,
      redWinRate,
      bluePickRate,
      redPickRate,
      weeklyActivity,
    };
  };

  const styleStats = getStyleAnalytics();

  // 2. 精準計算英雄專精數據 (Champions 頁面用，修復 DPM / CS 0 的問題)
  const getChampionStats = () => {
    if (!data?.matches || data.matches.length === 0) return [];
    const statsMap: Record<string, any> = {};

    data.matches.forEach((m: any) => {
      const name = m.championName || 'Unknown';
      if (!statsMap[name]) {
        statsMap[name] = {
          name,
          games: 0,
          wins: 0,
          losses: 0,
          kills: 0,
          deaths: 0,
          assists: 0,
          totalDamage: 0,
          totalCs: 0,
          totalGameDurationMin: 0,
          kpSum: 0,
        };
      }

      // 時間計算 fallback
      const matchDurationMin = (m.gameDuration || 1) / 60;
      
      // CS fallback: cs / totalMinionsKilled / neutralMinionsKilled
      const matchCs =
        m.cs ??
        (m.totalMinionsKilled || 0) + (m.neutralMinionsKilled || 0);

      // Damage fallback: totalDamageDealtToChampions / dpm
      const matchDamage =
        m.totalDamageDealtToChampions ??
        (m.dpm ? m.dpm * matchDurationMin : 0);

      statsMap[name].games += 1;
      if (m.win) statsMap[name].wins += 1;
      else statsMap[name].losses += 1;

      statsMap[name].kills += m.kills || 0;
      statsMap[name].deaths += m.deaths || 0;
      statsMap[name].assists += m.assists || 0;
      statsMap[name].totalDamage += matchDamage;
      statsMap[name].totalCs += matchCs;
      statsMap[name].totalGameDurationMin += matchDurationMin;
      statsMap[name].kpSum += m.killParticipation || 0;
    });

    return Object.values(statsMap)
      .map((champ: any) => {
        const avgKills = champ.kills / champ.games;
        const avgDeaths = champ.deaths / champ.games;
        const avgAssists = champ.assists / champ.games;
        const kdaRatio =
          avgDeaths === 0
            ? 'Perfect'
            : ((avgKills + avgAssists) / avgDeaths).toFixed(2);

        const totalMin = champ.totalGameDurationMin || 1;
        const avgDpm = Math.round(champ.totalDamage / totalMin);
        const avgCs = (champ.totalCs / champ.games).toFixed(1);
        const avgCsPerMin = (champ.totalCs / totalMin).toFixed(1);
        const avgKp = Math.round(champ.kpSum / champ.games);

        return {
          ...champ,
          avgKills: avgKills.toFixed(1),
          avgDeaths: avgDeaths.toFixed(1),
          avgAssists: avgAssists.toFixed(1),
          kdaRatio,
          avgDpm,
          avgCs,
          avgCsPerMin,
          avgKp,
          winRate: Math.round((champ.wins / champ.games) * 100),
        };
      })
      .filter((champ: any) =>
        champ.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a: any, b: any) => b.games - a.games);
  };

  const championStats = getChampionStats();

  return (
    <main className="min-h-screen bg-[#090d16] text-slate-100 p-4 md:p-8 font-sans">
      {/* 頂部 Tab 導覽 */}
      <header className="max-w-6xl mx-auto flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex gap-6">
          {(['概要', '風格', 'Champions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm font-bold pb-2 transition-colors relative ${
                activeTab === tab ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-500 tracking-wider">S2026 GG.ANALYTICS</div>
      </header>

      {/* 搜尋欄 */}
      <section className="max-w-6xl mx-auto mb-8">
        <form onSubmit={handleSearch} className="flex gap-3 justify-center">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="kr">韓服 (KR)</option>
            <option value="tw2">台服 (TW)</option>
            <option value="na1">美服 (NA)</option>
            <option value="euw1">西歐 (EUW)</option>
          </select>

          <input
            type="text"
            value={riotId}
            onChange={(e) => setRiotId(e.target.value)}
            placeholder="Riot ID #TAG (例如 Hide on bush#KR1)"
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm w-80 focus:outline-none focus:border-blue-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 font-medium px-6 py-2 rounded-lg text-sm transition-colors"
          >
            {loading ? '載入中...' : '搜尋'}
          </button>
        </form>
        {error && <p className="text-red-400 text-xs text-center mt-2">{error}</p>}
      </section>

      {/* 主要內容區 */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* 左側：段位資訊 */}
        <div className="space-y-4">
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-900/30 rounded-full flex items-center justify-center text-xl">🏆</div>
            <div>
              <div className="text-xs text-slate-400 font-bold">單/雙排積分</div>
              <div className="text-sm font-black text-slate-100">
                {soloRank ? `${soloRank.tier} ${soloRank.rank}` : '未定級 (Unranked)'}
              </div>
              {soloRank && (
                <div className="text-xs text-slate-400">
                  <span className="text-blue-400 font-bold">{soloRank.leaguePoints} LP</span> · {soloRank.wins}勝 {soloRank.losses}敗 ({Math.round((soloRank.wins / (soloRank.wins + soloRank.losses)) * 100)}%)
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-xl">🛡️</div>
            <div>
              <div className="text-xs text-slate-400 font-bold">彈性積分</div>
              <div className="text-sm font-black text-slate-100">
                {flexRank ? `${flexRank.tier} ${flexRank.rank}` : '未定級 (Unranked)'}
              </div>
              {flexRank && (
                <div className="text-xs text-slate-400">
                  <span className="text-blue-400 font-bold">{flexRank.leaguePoints} LP</span> · {flexRank.wins}勝 {flexRank.losses}敗
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右側：頁面切換 */}
        <div className="md:col-span-3 space-y-4">
          {/* 1. 概要分頁 */}
          {activeTab === '概要' && (
            <>
              {data?.matches && data.matches.length > 0 && (
                <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold">{data.matches.length} 場對戰</span>{' '}
                    <span className="text-blue-400 font-bold">{data.matches.filter((m: any) => m.win).length}勝</span>{' '}
                    <span className="text-red-400 font-bold">{data.matches.filter((m: any) => !m.win).length}敗</span>
                  </div>
                  <div>
                    平均 KDA:{' '}
                    <span className="font-bold text-slate-100">
                      {(
                        data.matches.reduce((sum: number, m: any) => sum + (m.kda || 0), 0) / data.matches.length
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* 對戰清單 */}
              <div className="space-y-3">
                {data?.matches?.map((match: any) => {
                  const isExpanded = expandedMatchId === match.matchId;

                  return (
                    <div
                      key={match.matchId}
                      className={`border rounded-xl transition-all overflow-hidden ${
                        match.win
                          ? 'bg-blue-950/20 border-blue-800/40'
                          : 'bg-red-950/20 border-red-800/40'
                      }`}
                    >
                      <div className="p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getChampionImg(match.championName)}
                            alt={match.championName}
                            className="w-12 h-12 rounded-lg border border-slate-700 object-cover"
                          />
                          <div>
                            <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                              {match.championName}
                              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                                {match.gameMode}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                              CS: {match.cs ?? (match.totalMinionsKilled || 0) + (match.neutralMinionsKilled || 0)} ({match.csPerMin || 0}/m)
                            </div>
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-sm font-bold">
                            {match.kills} / <span className="text-red-400">{match.deaths}</span> / {match.assists}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            傷害: {match.totalDamageDealtToChampions?.toLocaleString() || 0}
                          </div>
                        </div>

                        <div className="hidden sm:flex gap-1">
                          {match.items?.map((item: number, idx: number) => (
                            <div key={idx} className="w-6 h-6 bg-slate-800/60 rounded border border-slate-700/50 overflow-hidden">
                              {item > 0 && (
                                <img src={getItemImg(item)!} alt="item" className="w-full h-full object-cover" />
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold ${match.win ? 'text-blue-400' : 'text-red-400'}`}>
                            {match.win ? '勝利' : '敗北'}
                          </span>
                          <button
                            onClick={() => toggleExpand(match.matchId)}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 transition-transform"
                          >
                            <span className={`inline-block transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                              ▼
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* 展開詳情：包含 10 人裝備/傷害/金幣與詳細戰績 */}
                      {isExpanded && match.participants && (
                        <div className="border-t border-slate-800/80 bg-slate-900/90 p-4 space-y-4">
                          {/* 藍隊 */}
                          <div>
                            <div className="text-xs font-bold text-blue-400 mb-2 flex justify-between items-center">
                              <span>藍隊 (Team 100)</span>
                              <span className="text-slate-500 font-normal">KDA / 傷害 / 金幣 / 裝備</span>
                            </div>
                            <div className="space-y-1.5">
                              {match.participants
                                .filter((p: any) => p.teamId === 100)
                                .map((p: any, idx: number) => {
                                  const playerItems = [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6];
                                  const pCs = p.cs ?? (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0);

                                  return (
                                    <div key={idx} className="flex flex-wrap md:flex-nowrap items-center justify-between text-xs py-2 px-3 rounded bg-slate-800/40 gap-2">
                                      {/* 玩家名稱與英雄 */}
                                      <div className="flex items-center gap-2 w-44 shrink-0">
                                        <img src={getChampionImg(p.championName)} className="w-6 h-6 rounded-md object-cover border border-slate-700" alt="" />
                                        <span className="font-medium text-slate-200 truncate">{p.summonerName || p.riotIdGameName || '玩家'}</span>
                                      </div>

                                      {/* KDA & CS */}
                                      <div className="flex items-center gap-3 text-slate-300 w-36 shrink-0 justify-center">
                                        <div>{p.kills} / <span className="text-red-400">{p.deaths}</span> / {p.assists}</div>
                                        <div className="text-slate-400 text-[11px]">{pCs} CS</div>
                                      </div>

                                      {/* 傷害與金幣 */}
                                      <div className="text-center w-28 shrink-0 text-[11px]">
                                        <div className="text-slate-200 font-medium">💥 {p.totalDamageDealtToChampions?.toLocaleString() || 0}</div>
                                        <div className="text-amber-400">💰 {p.goldEarned?.toLocaleString() || 0}</div>
                                      </div>

                                      {/* 玩家裝備 */}
                                      <div className="flex gap-1 shrink-0">
                                        {playerItems.map((itemId: number, itemIdx: number) => (
                                          <div key={itemIdx} className="w-5 h-5 bg-slate-900/80 rounded border border-slate-700/60 overflow-hidden">
                                            {itemId > 0 && getItemImg(itemId) && (
                                              <img src={getItemImg(itemId)!} alt="" className="w-full h-full object-cover" />
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>

                          {/* 紅隊 */}
                          <div>
                            <div className="text-xs font-bold text-red-400 mb-2 flex justify-between items-center">
                              <span>紅隊 (Team 200)</span>
                              <span className="text-slate-500 font-normal">KDA / 傷害 / 金幣 / 裝備</span>
                            </div>
                            <div className="space-y-1.5">
                              {match.participants
                                .filter((p: any) => p.teamId === 200)
                                .map((p: any, idx: number) => {
                                  const playerItems = [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6];
                                  const pCs = p.cs ?? (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0);

                                  return (
                                    <div key={idx} className="flex flex-wrap md:flex-nowrap items-center justify-between text-xs py-2 px-3 rounded bg-slate-800/40 gap-2">
                                      {/* 玩家名稱與英雄 */}
                                      <div className="flex items-center gap-2 w-44 shrink-0">
                                        <img src={getChampionImg(p.championName)} className="w-6 h-6 rounded-md object-cover border border-slate-700" alt="" />
                                        <span className="font-medium text-slate-200 truncate">{p.summonerName || p.riotIdGameName || '玩家'}</span>
                                      </div>

                                      {/* KDA & CS */}
                                      <div className="flex items-center gap-3 text-slate-300 w-36 shrink-0 justify-center">
                                        <div>{p.kills} / <span className="text-red-400">{p.deaths}</span> / {p.assists}</div>
                                        <div className="text-slate-400 text-[11px]">{pCs} CS</div>
                                      </div>

                                      {/* 傷害與金幣 */}
                                      <div className="text-center w-28 shrink-0 text-[11px]">
                                        <div className="text-slate-200 font-medium">💥 {p.totalDamageDealtToChampions?.toLocaleString() || 0}</div>
                                        <div className="text-amber-400">💰 {p.goldEarned?.toLocaleString() || 0}</div>
                                      </div>

                                      {/* 玩家裝備 */}
                                      <div className="flex gap-1 shrink-0">
                                        {playerItems.map((itemId: number, itemIdx: number) => (
                                          <div key={itemIdx} className="w-5 h-5 bg-slate-900/80 rounded border border-slate-700/60 overflow-hidden">
                                            {itemId > 0 && getItemImg(itemId) && (
                                              <img src={getItemImg(itemId)!} alt="" className="w-full h-full object-cover" />
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* 2. 風格分頁 */}
          {activeTab === '風格' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 績效指標 */}
                <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5">
                  <div className="text-xs font-bold text-slate-400 mb-4">績效指標</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900/60 p-3 rounded-lg text-center">
                      <div className="text-xs text-slate-400">勝率</div>
                      <div className="text-xl font-black text-slate-100 mt-1">
                        {data?.matches?.length
                          ? `${Math.round((data.matches.filter((m: any) => m.win).length / data.matches.length) * 100)}%`
                          : '0%'}
                      </div>
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded-lg text-center">
                      <div className="text-xs text-slate-400">平均 KDA</div>
                      <div className="text-xl font-black text-blue-400 mt-1">
                        {data?.matches?.length
                          ? (
                              data.matches.reduce((sum: number, m: any) => sum + (m.kda || 0), 0) /
                              data.matches.length
                            ).toFixed(2)
                          : '0.00'}
                      </div>
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded-lg text-center">
                      <div className="text-xs text-slate-400">擊殺參與率</div>
                      <div className="text-xl font-black text-red-400 mt-1">
                        {data?.matches?.length
                          ? `${Math.round(
                              data.matches.reduce((sum: number, m: any) => sum + (m.killParticipation || 0), 0) /
                                data.matches.length
                            )}%`
                          : '0%'}
                      </div>
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded-lg text-center">
                      <div className="text-xs text-slate-400">平均遊戲時間</div>
                      <div className="text-xl font-black text-emerald-400 mt-1">{styleStats.avgDuration}</div>
                    </div>
                  </div>
                </div>

                {/* 藍紅方勝率與選角率 */}
                <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5">
                  <div className="text-xs font-bold text-slate-400 mb-4">藍紅方勝率與選角率</div>
                  <div className="space-y-4 text-xs">
                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span className="text-blue-400">藍色勝率 {styleStats.blueWinRate}%</span>
                        <span className="text-red-400">紅色勝率 {styleStats.redWinRate}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden flex">
                        <div className="bg-blue-500 h-full" style={{ width: `${styleStats.blueWinRate}%` }}></div>
                        <div className="bg-red-500 h-full" style={{ width: `${styleStats.redWinRate}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span className="text-blue-400">藍選角率 {styleStats.bluePickRate}%</span>
                        <span className="text-red-400">紅選角率 {styleStats.redPickRate}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden flex">
                        <div className="bg-blue-500 h-full" style={{ width: `${styleStats.bluePickRate}%` }}></div>
                        <div className="bg-red-500 h-full" style={{ width: `${styleStats.redPickRate}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 每週活動場次 */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5">
                <div className="text-xs font-bold text-slate-400 mb-4">每週活動場次</div>
                <div className="grid grid-cols-7 gap-2 items-end h-32">
                  {['日', '一', '二', '三', '四', '五', '六'].map((dayName, idx) => {
                    const count = styleStats.weeklyActivity[idx];
                    const maxCount = Math.max(...styleStats.weeklyActivity, 1);
                    const heightPercent = Math.round((count / maxCount) * 100);

                    return (
                      <div key={dayName} className="flex flex-col items-center gap-2 h-full justify-end">
                        <span className="text-xs text-slate-300 font-bold">{count}</span>
                        <div className="w-full bg-slate-700/50 rounded-t-md flex items-end h-20 overflow-hidden">
                          <div
                            className="w-full bg-blue-500 rounded-t-md transition-all duration-300"
                            style={{ height: `${heightPercent}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-slate-400">{dayName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 3. Champions 英雄專精數據分頁 */}
          {activeTab === 'Champions' && (
            <div className="bg-slate-800/30 border border-slate-800 rounded-xl overflow-hidden p-4 space-y-4">
              {/* 控制列：數量與搜尋 */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200">英雄專精數據</span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                    共 {championStats.length} 位
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="搜尋英雄..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-900 border border-slate-700/60 rounded px-3 py-1 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 英雄列表 (保持原版排版與欄位) */}
              <div className="divide-y divide-slate-800/60">
                {championStats.map((champ: any) => (
                  <div key={champ.name} className="py-3 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded-lg transition-colors">
                    {/* 英雄名稱與頭像 */}
                    <div className="flex items-center gap-3 w-40">
                      <img
                        src={getChampionImg(champ.name)}
                        alt={champ.name}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-700/50"
                      />
                      <div>
                        <div className="font-bold text-sm text-slate-100">{champ.name}</div>
                      </div>
                    </div>

                    {/* 已遊玩與勝率 */}
                    <div className="text-center w-28">
                      <div className="text-xs">
                        <span className="text-blue-400 font-bold">{champ.wins}勝</span>{' '}
                        <span className="text-red-400 font-bold">{champ.losses}敗</span>{' '}
                        <span className="font-bold text-slate-200">{champ.winRate}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-700 rounded-full mt-1.5 overflow-hidden flex">
                        <div className="bg-blue-500 h-full" style={{ width: `${champ.winRate}%` }}></div>
                        <div className="bg-red-500 h-full" style={{ width: `${100 - champ.winRate}%` }}></div>
                      </div>
                    </div>

                    {/* KDA / 參戰率 */}
                    <div className="text-center w-36">
                      <div className="text-xs font-bold text-blue-400">
                        {champ.kdaRatio}:1 <span className="text-slate-400 font-normal">({champ.avgKp}% 參戰)</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {champ.avgKills} / <span className="text-red-400">{champ.avgDeaths}</span> / {champ.assists ? champ.avgAssists : champ.avgAssists}
                      </div>
                    </div>

                    {/* DPM (傷害) */}
                    <div className="text-center w-28">
                      <div className="text-xs font-bold text-slate-100">{champ.avgDpm} /m</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">每分鐘傷害</div>
                    </div>

                    {/* CS (小兵) */}
                    <div className="text-center w-28">
                      <div className="text-xs font-bold text-slate-100">{champ.avgCs} CS</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">({champ.avgCsPerMin}/m)</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}