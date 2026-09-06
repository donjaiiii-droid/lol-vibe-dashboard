'use client';

import { useState } from 'react';

const SPELL_MAP: Record<number, string> = {
  1: 'SummonerBoost',
  3: 'SummonerExhaust',
  4: 'SummonerFlash',
  6: 'SummonerHaste',
  7: 'SummonerHeal',
  11: 'SummonerSmite',
  12: 'SummonerTeleport',
  13: 'SummonerMana',
  14: 'SummonerDot',
  21: 'SummonerBarrier',
  32: 'SummonerSnowball',
};

const RUNE_MAP: Record<number, string> = {
  8005: 'perk-images/Styles/Precision/PressTheAttack/PressTheAttack.png',
  8008: 'perk-images/Styles/Precision/LethalTempo/LethalTempoTemp.png',
  8021: 'perk-images/Styles/Precision/FleetFootwork/FleetFootwork.png',
  8010: 'perk-images/Styles/Precision/Conqueror/Conqueror.png',
  8112: 'perk-images/Styles/Domination/Electrocute/Electrocute.png',
  8124: 'perk-images/Styles/Domination/Predator/Predator.png',
  8128: 'perk-images/Styles/Domination/DarkHarvest/DarkHarvest.png',
  9923: 'perk-images/Styles/Domination/HailOfBlades/HailOfBlades.png',
  8214: 'perk-images/Styles/Sorcery/SummonAery/SummonAery.png',
  8229: 'perk-images/Styles/Sorcery/ArcaneComet/ArcaneComet.png',
  8230: 'perk-images/Styles/Sorcery/PhaseRush/PhaseRush.png',
  8437: 'perk-images/Styles/Resolve/GraspOfTheUndying/GraspOfTheUndying.png',
  8439: 'perk-images/Styles/Resolve/VeteranAftershock/VeteranAftershock.png',
  8465: 'perk-images/Styles/Resolve/Guardian/Guardian.png',
  8351: 'perk-images/Styles/Inspiration/GlacialAugment/GlacialAugment.png',
  8360: 'perk-images/Styles/Inspiration/UnsealedSpellbook/UnsealedSpellbook.png',
  8369: 'perk-images/Styles/Inspiration/FirstStrike/FirstStrike.png',
};

const POSITION_MAP: Record<string, { label: string; color: string }> = {
  TOP: { label: '上路', color: 'bg-blue-500 shadow-blue-500/50' },
  JUNGLE: { label: '打野', color: 'bg-emerald-500 shadow-emerald-500/50' },
  MIDDLE: { label: '中路', color: 'bg-amber-500 shadow-amber-500/50' },
  BOTTOM: { label: '下路', color: 'bg-indigo-500 shadow-indigo-500/50' },
  UTILITY: { label: '輔助', color: 'bg-purple-500 shadow-purple-500/50' },
};

const DAYS = ['日', '一', '二', '三', '四', '五', '六'];

export default function Home() {
  const [riotId, setRiotId] = useState('Faker#TW2');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'style' | 'champions'>('overview');
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [searchChampFilter, setSearchChampFilter] = useState('');
 const [region, setRegion] = useState('tw2');

  const handleSearch = async () => {
    if (!riotId.includes('#')) {
      setError('請輸入完整的 Riot ID (例如: Faker#KR1)');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const searchId = riotId.trim();
const res = await fetch(`/api/matches?riotId=${encodeURIComponent(searchId)}&region=${region}`);
      const result = await res.json();
      console.log("【API 回傳資料】", result);
      if (!res.ok) throw new Error(result.error || '連線失敗');
      setData(result);
    } catch (err: any) {
      setError(err.message || '發生錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const matches = data?.matches || [];
  const filteredMatches = matches;

  // 概要數據
  const totalGames = filteredMatches.length;
  const wins = filteredMatches.filter((m: any) => m.win).length;
  const losses = totalGames - wins;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  const totalKills = filteredMatches.reduce((acc: number, m: any) => acc + m.kills, 0);
  const totalDeaths = filteredMatches.reduce((acc: number, m: any) => acc + m.deaths, 0);
  const totalAssists = filteredMatches.reduce((acc: number, m: any) => acc + m.assists, 0);

  const avgKills = totalGames > 0 ? (totalKills / totalGames).toFixed(1) : '0.0';
  const avgDeaths = totalGames > 0 ? (totalDeaths / totalGames).toFixed(1) : '0.0';
  const avgAssists = totalGames > 0 ? (totalAssists / totalGames).toFixed(1) : '0.0';
  const kdaRatio = totalDeaths > 0 ? ((totalKills + totalAssists) / totalDeaths).toFixed(2) : 'Perfect';

  const avgKP = totalGames > 0 
    ? Math.round(filteredMatches.reduce((acc: number, m: any) => acc + (m.killParticipation || 0), 0) / totalGames) 
    : 0;

  const avgGameTimeSeconds = totalGames > 0
    ? Math.round(filteredMatches.reduce((acc: number, m: any) => acc + (m.gameDurationSeconds || 0), 0) / totalGames)
    : 0;
  const avgGameTimeStr = `${Math.floor(avgGameTimeSeconds / 60)}:${String(avgGameTimeSeconds % 60).padStart(2, '0')}`;

  // 風格數據
  const blueGames = filteredMatches.filter((m: any) => m.side === 'blue');
  const redGames = filteredMatches.filter((m: any) => m.side === 'red');
  const blueWins = blueGames.filter((m: any) => m.win).length;
  const redWins = redGames.filter((m: any) => m.win).length;

  const blueWinRate = blueGames.length > 0 ? ((blueWins / blueGames.length) * 100).toFixed(1) : '0.0';
  const redWinRate = redGames.length > 0 ? ((redWins / redGames.length) * 100).toFixed(1) : '0.0';
  const bluePickPct = totalGames > 0 ? ((blueGames.length / totalGames) * 100).toFixed(1) : '0.0';
  const redPickPct = totalGames > 0 ? ((redGames.length / totalGames) * 100).toFixed(1) : '0.0';

  const uniqueChamps = Array.from(new Set(filteredMatches.map((m: any) => m.championName))).length;
  const champPoolPct = Math.round((uniqueChamps / 173) * 100);

  const positionCounts: Record<string, number> = { TOP: 0, JUNGLE: 0, MIDDLE: 0, BOTTOM: 0, UTILITY: 0 };
  filteredMatches.forEach((m: any) => {
    const pos = m.position && positionCounts[m.position] !== undefined ? m.position : 'UTILITY';
    positionCounts[pos] += 1;
  });

  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  filteredMatches.forEach((m: any) => {
    if (m.dayOfWeek !== undefined) dayCounts[m.dayOfWeek] += 1;
  });
  const maxDayCount = Math.max(...dayCounts, 1);

  // Champions 表格計算
  const champStatsMap: Record<string, { 
    name: string; 
    games: number; 
    wins: number; 
    kills: number; 
    deaths: number; 
    assists: number;
    kpSum: number;
    damageSum: number;
    csSum: number;
    durationMinutesSum: number;
  }> = {};

  filteredMatches.forEach((m: any) => {
    if (!champStatsMap[m.championName]) {
      champStatsMap[m.championName] = { 
        name: m.championName, 
        games: 0, 
        wins: 0, 
        kills: 0, 
        deaths: 0, 
        assists: 0,
        kpSum: 0,
        damageSum: 0,
        csSum: 0,
        durationMinutesSum: 0,
      };
    }
    const c = champStatsMap[m.championName];
    c.games += 1;
    if (m.win) c.wins += 1;
    c.kills += m.kills;
    c.deaths += m.deaths;
    c.assists += m.assists;
    c.kpSum += m.killParticipation || 0;
    c.damageSum += m.totalDamage || 0;
    c.csSum += m.totalCs || 0;
    c.durationMinutesSum += (m.gameDurationSeconds || 1) / 60;
  });

  const allChampionList = Object.values(champStatsMap).sort((a, b) => b.games - a.games);
  const filteredChampList = allChampionList.filter((c) => 
    c.name.toLowerCase().includes(searchChampFilter.toLowerCase())
  );

  const topChampions = allChampionList.slice(0, 3);

  const getRankBadge = (tier: string) => {
    if (!tier) return null;
    return `https://opgg-static.akamaized.net/images/medals_new/${tier.toLowerCase()}.png`;
  };
// 將 API 回傳的 league 陣列轉為 UI 讀取的 ranks 結構
const soloRank = data?.ranks?.find((item: any) => item.queueType === 'RANKED_SOLO_5x5');
const flexRank = data?.ranks?.find((item: any) => item.queueType === 'RANKED_FLEX_SR');

const ranks = {
  solo: soloRank ? {
    tier: soloRank.tier,
    rank: soloRank.rank,
    leaguePoints: soloRank.leaguePoints,
    wins: soloRank.wins,
    losses: soloRank.losses,
    winRate: Math.round((soloRank.wins / (soloRank.wins + soloRank.losses)) * 100)
  } : null,
  flex: flexRank ? {
    tier: flexRank.tier,
    rank: flexRank.rank,
    leaguePoints: flexRank.leaguePoints,
    wins: flexRank.wins,
    losses: flexRank.losses,
    winRate: Math.round((flexRank.wins / (flexRank.wins + flexRank.losses)) * 100)
  } : null
};
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans antialiased">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* 頂部 Tag 導覽列 */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
          <div className="flex gap-6 text-sm font-black tracking-wider uppercase">
            <button
              onClick={() => setActiveTab('overview')}
              className={`relative pb-2 transition-all ${
                activeTab === 'overview'
                  ? 'text-blue-400 font-black after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-400'
                  : 'text-slate-300 hover:text-white font-bold'
              }`}
            >
              概要
            </button>
            <button
              onClick={() => setActiveTab('style')}
              className={`relative pb-2 transition-all ${
                activeTab === 'style'
                  ? 'text-blue-400 font-black after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-400'
                  : 'text-slate-300 hover:text-white font-bold'
              }`}
            >
              風格
            </button>
            <button
              onClick={() => setActiveTab('champions')}
              className={`relative pb-2 transition-all ${
                activeTab === 'champions'
                  ? 'text-blue-400 font-black after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-400'
                  : 'text-slate-300 hover:text-white font-bold'
              }`}
            >
              Champions
            </button>
          </div>
          <span className="text-xs text-slate-400 font-extrabold tracking-wide">S2026 GG.ANALYTICS</span>
        </div>

        {/* 搜尋列 */}
        <div className="flex gap-3 max-w-md mx-auto">
          <select 
  value={region} 
  onChange={(e) => setRegion(e.target.value)}
  className="bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:outline-none mr-2"
>
  <option value="tw2">台服 (TW)</option>
<option value="kr">韓服 (KR)</option>
<option value="na1">美服 (NA)</option>
<option value="euw1">歐服 (EUW)</option>
</select>
          <input
            type="text"
            value={riotId}
            onChange={(e) => setRiotId(e.target.value)}
            placeholder="Riot ID#Tag (例如: Fungz#TW2)"
            className="flex-1 bg-slate-900 border border-slate-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 rounded-xl px-5 py-3 text-slate-100 placeholder-slate-400 outline-none transition-all shadow-md text-sm font-semibold"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 text-white font-black px-6 py-3 rounded-xl transition-all shadow-md text-sm tracking-wide"
          >
            {loading ? '搜尋中...' : '搜尋'}
          </button>
        </div>

        {error && (
          <div className="bg-red-950/80 border border-red-500 text-red-200 p-4 rounded-xl text-center text-xs font-bold">
            {error}
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 左側：段位面板 */}
            <div className="space-y-4 md:col-span-1">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
                {getRankBadge(ranks?.solo?.tier) ? (
                  <img
                    src={getRankBadge(ranks?.solo?.tier)!}
                    alt="Solo Rank"
                    className="w-16 h-16 object-contain filter drop-shadow"
                    onError={(e: any) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-400 text-[10px] text-center uppercase tracking-wider">
                    Unranked
                  </div>
                )}
                <div className="space-y-1">
                  <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider">單/雙排積分</span>
                  <div className="text-base font-black text-white capitalize">
                    {ranks?.solo ? `${ranks.solo.tier} ${ranks.solo.rank}` : '未定級 (Unranked)'}
                  </div>
                  {ranks?.solo && (
                    <div className="text-xs text-slate-300 font-semibold">
                      <span className="font-black text-blue-400">{ranks.solo.leaguePoints} LP</span> · {ranks.solo.wins}勝 {ranks.solo.losses}敗 ({ranks.solo.winRate}%)
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
                {getRankBadge(ranks?.flex?.tier) ? (
                  <img
                    src={getRankBadge(ranks?.flex?.tier)!}
                    alt="Flex Rank"
                    className="w-16 h-16 object-contain filter drop-shadow"
                    onError={(e: any) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-400 text-[10px] text-center uppercase tracking-wider">
                    Unranked
                  </div>
                )}
                <div className="space-y-1">
                  <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider">彈性積分</span>
                  <div className="text-base font-black text-white capitalize">
                    {ranks?.flex ? `${ranks.flex.tier} ${ranks.flex.rank}` : '未定級 (Unranked)'}
                  </div>
                  {ranks?.flex && (
                    <div className="text-xs text-slate-300 font-semibold">
                      <span className="font-black text-blue-400">{ranks.flex.leaguePoints} LP</span> · {ranks.flex.wins}勝 {ranks.flex.losses}敗 ({ranks.flex.winRate}%)
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 右側：內容區 (依 Tag 切換) */}
            <div className="space-y-6 md:col-span-2">

              {/* 切換三：Champions (英雄專精) */}
              {activeTab === 'champions' && (
                <div className="space-y-6">
                  
                  {/* 工具列 */}
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white tracking-wide">英雄專精數據</span>
                      <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        共 {allChampionList.length} 位
                      </span>
                    </div>

                    <div className="relative">
                      <select 
  value={region} 
  onChange={(e) => setRegion(e.target.value)}
  className="bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:outline-none mr-2"
>
  <option value="tw2">台服 (TW)</option>
  <option value="kr">韓服 (KR)</option>
  <option value="na1">美服 (NA)</option>
  <option value="euw1">歐服 (EUW)</option>
</select>
                      <input
                        type="text"
                        value={searchChampFilter}
                        onChange={(e) => setSearchChampFilter(e.target.value)}
                        placeholder="搜尋英雄..."
                        className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-400 w-44 font-semibold"
                      />
                    </div>
                  </div>

                  {/* 表格 */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-200">
                        <thead className="bg-slate-950 text-slate-300 text-[11px] uppercase tracking-wider font-black border-b border-slate-800">
                          <tr>
                            <th className="py-3.5 px-4">英雄</th>
                            <th className="py-3.5 px-3 text-center">已遊玩</th>
                            <th className="py-3.5 px-3">KDA / 參戰</th>
                            <th className="py-3.5 px-3 text-right">DPM (傷害)</th>
                            <th className="py-3.5 px-3 text-right">CS (小兵)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {filteredChampList.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-10 text-center text-slate-400 font-bold">
                                未找到符合條件的英雄數據
                              </td>
                            </tr>
                          ) : (
                            filteredChampList.map((c) => {
                              const losses = c.games - c.wins;
                              const cWinRate = Math.round((c.wins / c.games) * 100);
                              const avgK = (c.kills / c.games).toFixed(1);
                              const avgD = (c.deaths / c.games).toFixed(1);
                              const avgA = (c.assists / c.games).toFixed(1);
                              const cKda = c.deaths > 0 ? ((c.kills + c.assists) / c.deaths).toFixed(2) : 'Perfect';
                              const avgKp = Math.round(c.kpSum / c.games);
                              const avgDpm = Math.round(c.damageSum / c.durationMinutesSum);
                              const avgCs = (c.csSum / c.games).toFixed(1);
                              const csPerMin = (c.csSum / c.durationMinutesSum).toFixed(1);

                              return (
                                <tr key={c.name} className="hover:bg-slate-800/50 transition-colors">
                                  <td className="py-3 px-4 font-black text-white">
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${c.name}.png`}
                                        alt={c.name}
                                        className="w-10 h-10 rounded-xl border border-slate-700 object-cover shadow"
                                        onError={(e: any) => { e.target.src = 'https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/Square_0.png'; }}
                                      />
                                      <span className="tracking-wide text-sm">{c.name}</span>
                                    </div>
                                  </td>

                                  <td className="py-3 px-3 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                      <div className="flex items-center gap-1.5 font-black text-[11px]">
                                        <span className="text-blue-400">{c.wins}勝</span>
                                        <span className="text-red-400">{losses}敗</span>
                                        <span className={`ml-1 ${cWinRate >= 50 ? 'text-blue-400' : 'text-red-400'}`}>{cWinRate}%</span>
                                      </div>
                                      <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                                        <div style={{ width: `${cWinRate}%` }} className="bg-blue-500 h-full" />
                                        <div style={{ width: `${100 - cWinRate}%` }} className="bg-red-500 h-full" />
                                      </div>
                                    </div>
                                  </td>

                                  <td className="py-3 px-3">
                                    <div>
                                      <div className="font-black text-white flex items-center gap-1">
                                        <span className="text-indigo-400">{cKda}:1</span>
                                        <span className="text-[11px] text-slate-300 font-semibold">({avgKp}% 參戰)</span>
                                      </div>
                                      <div className="text-[11px] text-slate-300 font-bold">
                                        {avgK} / <span className="text-red-400 font-black">{avgD}</span> / {avgA}
                                      </div>
                                    </div>
                                  </td>

                                  <td className="py-3 px-3 text-right">
                                    <div className="font-black text-amber-300 text-xs">{avgDpm.toLocaleString()} /m</div>
                                    <div className="text-[10px] text-slate-400 font-bold">每分鐘傷害</div>
                                  </td>

                                  <td className="py-3 px-3 text-right">
                                    <div className="font-black text-white">{avgCs} CS</div>
                                    <div className="text-[10px] text-slate-300 font-bold">({csPerMin}/m)</div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* 切換二：風格 (Style) */}
              {activeTab === 'style' && (
                <div className="space-y-6">
                  
                  {/* 數據卡片 */}
                  <div className="grid grid-cols-4 gap-2 bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center shadow-lg">
                    <div>
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">場次</span>
                      <p className="text-2xl font-black text-white mt-0.5">{totalGames}</p>
                      <span className="text-[10px] text-slate-300 font-bold">{wins}勝 {losses}敗</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">勝率</span>
                      <p className={`text-2xl font-black mt-0.5 ${winRate >= 50 ? 'text-blue-400' : 'text-red-400'}`}>{winRate}%</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">KDA</span>
                      <p className="text-2xl font-black text-indigo-400 mt-0.5">{kdaRatio}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">英雄池</span>
                      <p className="text-2xl font-black text-amber-300 mt-0.5">{uniqueChamps}</p>
                      <span className="text-[10px] text-slate-300 font-bold">{champPoolPct}% 涵蓋率</span>
                    </div>
                  </div>

                  {/* 績效與側面 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-lg">
                      <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">績效指標</h3>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[11px] font-extrabold">勝率</span>
                          <p className="text-xl font-black text-white mt-1">{winRate}%</p>
                        </div>
                        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[11px] font-extrabold">平均 KDA</span>
                          <p className="text-xl font-black text-indigo-400 mt-1">{kdaRatio}</p>
                        </div>
                        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[11px] font-extrabold">擊殺參與率</span>
                          <p className="text-xl font-black text-red-400 mt-1">{avgKP}%</p>
                        </div>
                        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[11px] font-extrabold">平均遊戲時間</span>
                          <p className="text-xl font-black text-emerald-400 mt-1">{avgGameTimeStr}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-lg">
                      <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">藍紅方勝率與選角率</h3>
                      <div className="space-y-4 text-xs font-bold">
                        <div>
                          <div className="flex justify-between mb-1.5 text-[11px]">
                            <span className="text-blue-400 font-black">藍色勝率 {blueWinRate}%</span>
                            <span className="text-red-400 font-black">紅色勝率 {redWinRate}%</span>
                          </div>
                          <div className="h-3 bg-slate-800 rounded-full overflow-hidden flex">
                            <div style={{ width: `${blueWinRate}%` }} className="bg-blue-500 h-full" />
                            <div style={{ width: `${redWinRate}%` }} className="bg-red-500 h-full" />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1.5 text-[11px]">
                            <span className="text-slate-200 font-bold">藍選角率 {bluePickPct}%</span>
                            <span className="text-slate-200 font-bold">紅選角率 {redPickPct}%</span>
                          </div>
                          <div className="h-3 bg-slate-800 rounded-full overflow-hidden flex">
                            <div style={{ width: `${bluePickPct}%` }} className="bg-blue-400 h-full" />
                            <div style={{ width: `${redPickPct}%` }} className="bg-red-400 h-full" />
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* 路線分佈 */}
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-lg">
                    <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">角色路線分佈</h3>
                    <div className="h-4 rounded-full overflow-hidden flex bg-slate-800">
                      {Object.keys(POSITION_MAP).map((posKey) => {
                        const count = positionCounts[posKey] || 0;
                        const pct = totalGames > 0 ? (count / totalGames) * 100 : 0;
                        if (pct === 0) return null;
                        return (
                          <div
                            key={posKey}
                            style={{ width: `${pct}%` }}
                            className={`${POSITION_MAP[posKey].color} h-full transition-all duration-500`}
                          />
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-center text-xs pt-1">
                      {Object.keys(POSITION_MAP).map((posKey) => {
                        const count = positionCounts[posKey] || 0;
                        const pct = totalGames > 0 ? Math.round((count / totalGames) * 100) : 0;
                        return (
                          <div key={posKey} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                            <span className="text-slate-300 block text-[10px] font-black">{POSITION_MAP[posKey].label}</span>
                            <span className="font-black text-white text-base">{pct}%</span>
                            <span className="text-[10px] text-slate-400 block font-bold">{count}場</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 每週活動 */}
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-lg">
                    <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">每週活動場次</h3>
                    <div className="flex items-end justify-between h-32 pt-4 px-4 bg-slate-950 rounded-xl border border-slate-800">
                      {DAYS.map((day, idx) => {
                        const count = dayCounts[idx];
                        const heightPct = Math.round((count / maxDayCount) * 100);
                        return (
                          <div key={day} className="flex flex-col items-center gap-2 h-full justify-end">
                            <span className="text-[11px] text-slate-300 font-extrabold">{count}</span>
                            <div className="w-6 bg-slate-800 rounded-t h-20 relative overflow-hidden flex items-end">
                              <div
                                style={{ height: `${heightPct}%` }}
                                className="w-full bg-blue-500 transition-all rounded-t"
                              />
                            </div>
                            <span className="text-[11px] text-slate-300 font-black">{day}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

              {/* 切換一：概要 (Overview) */}
              {activeTab === 'overview' && (
                <>
                  {totalGames > 0 && (
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
                      <div className="flex justify-between items-center text-xs text-slate-300 font-black border-b border-slate-800 pb-3">
                        <span>{totalGames}場對戰 {wins}勝 {losses}敗</span>
                        <span>最近{totalGames}場英雄表現</span>
                        <span>首選角色與勝率</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                        
                        <div className="flex items-center gap-4 border-b sm:border-b-0 sm:border-r border-slate-800 pb-4 sm:pb-0 pr-0 sm:pr-2">
                          <div className="relative w-20 h-20 flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              <path
                                className="text-red-500"
                                strokeWidth="4"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <path
                                className="text-blue-500"
                                strokeDasharray={`${winRate}, 100`}
                                strokeWidth="4"
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center font-black text-blue-400 text-sm">
                              {winRate}%
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <p className="text-xs text-slate-200 font-bold">
                              {avgKills} / <span className="text-red-400 font-black">{avgDeaths}</span> / {avgAssists}
                            </p>
                            <p className="text-2xl font-black text-white">
                              {kdaRatio} <span className="text-slate-400 text-xs font-semibold">: 1</span>
                            </p>
                            <p className="text-xs text-red-400 font-black">
                              參戰率 {avgKP}%
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 border-b sm:border-b-0 sm:border-r border-slate-800 pb-4 sm:pb-0 pr-0 sm:pr-2">
                          {topChampions.map((c) => {
                            const cWinRate = Math.round((c.wins / c.games) * 100);
                            const cKda = c.deaths > 0 ? ((c.kills + c.assists) / c.deaths).toFixed(2) : '4.00';

                            return (
                              <div key={c.name} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${c.name}.png`}
                                    alt={c.name}
                                    className="w-6 h-6 rounded-full border border-slate-700"
                                    onError={(e: any) => { e.target.src = 'https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/Square_0.png'; }}
                                  />
                                  <span className={`font-black ${cWinRate >= 60 ? 'text-red-400' : 'text-blue-400'}`}>
                                    {cWinRate}%
                                  </span>
                                  <span className="text-slate-300 text-[11px] font-bold">({c.wins}勝 / {c.games - c.wins}敗)</span>
                                </div>
                                <span className="font-black text-white">{cKda}:1</span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex items-end justify-between px-2 h-16 pt-2">
                          {Object.keys(POSITION_MAP).map((posKey) => {
                            const count = positionCounts[posKey] || 0;
                            const pct = totalGames > 0 ? Math.round((count / totalGames) * 100) : 0;

                            return (
                              <div key={posKey} className="flex flex-col items-center gap-1.5 h-full justify-end">
                                <div className="w-4 bg-slate-800 rounded-t h-12 relative overflow-hidden flex items-end">
                                  <div
                                    style={{ height: `${pct}%` }}
                                    className="w-full bg-blue-500 transition-all duration-500 rounded-t"
                                  />
                                </div>
                                <span className="text-[10px] text-slate-300 font-black">
                                  {POSITION_MAP[posKey].label.slice(0, 1)}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                      </div>
                    </div>
                  )}

                  {/* 戰績列表 */}
                  <div className="space-y-3">
                    {filteredMatches.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 bg-slate-900 rounded-2xl border border-slate-800 font-bold">
                        近 90 天內無積分對戰紀錄
                      </div>
                    ) : (
                      filteredMatches.slice(0, 20).map((m: any) => {
                        const isExpanded = expandedMatch === m.matchId;
                        const spell1 = SPELL_MAP[m.summoner1Id];
                        const spell2 = SPELL_MAP[m.summoner2Id];
                        const runePath = RUNE_MAP[m.primaryStyle];

                        return (
                          <div
                            key={m.matchId}
                            className={`border rounded-2xl overflow-hidden transition-all shadow-lg ${
                              m.win
                                ? 'bg-slate-900 border-blue-600/50 hover:border-blue-500'
                                : 'bg-slate-900 border-red-600/50 hover:border-red-500'
                            }`}
                          >
                            <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                              
                              <div className="flex items-center gap-3.5 w-full sm:w-auto">
                                <div className="relative flex items-center gap-1.5">
                                  <img
                                    src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${m.championName}.png`}
                                    alt={m.championName}
                                    className="w-13 h-13 rounded-2xl border-2 border-slate-700 object-cover shadow"
                                    onError={(e: any) => {
                                      e.target.src = 'https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/Square_0.png';
                                    }}
                                  />

                                  <div className="flex flex-col gap-1">
                                    {spell1 && (
                                      <img
                                        src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/spell/${spell1}.png`}
                                        className="w-5 h-5 rounded-md border border-slate-700"
                                        alt="Spell 1"
                                      />
                                    )}
                                    {spell2 && (
                                      <img
                                        src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/spell/${spell2}.png`}
                                        className="w-5 h-5 rounded-md border border-slate-700"
                                        alt="Spell 2"
                                      />
                                    )}
                                  </div>

                                  {runePath && (
                                    <div className="w-6 h-6 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center p-0.5">
                                      <img
                                        src={`https://ddragon.leagueoflegends.com/cdn/img/${runePath}`}
                                        className="w-full h-full object-contain"
                                        alt="Rune"
                                      />
                                    </div>
                                  )}
                                </div>
                                
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-base text-white tracking-wide">{m.championName}</span>
                                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                      {m.gameMode}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-300 font-bold">{m.gameDate} ({m.gameDuration}分)</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-5 w-full sm:w-auto justify-between sm:justify-end">
                                <div className="text-left sm:text-right space-y-1">
                                  <p className="text-xs font-black text-slate-100 tracking-wider">
                                    KDA: {m.kills} / <span className="text-red-400 font-black">{m.deaths}</span> / {m.assists}
                                  </p>

                                  <div className="flex items-center sm:justify-end gap-2 text-[11px] text-slate-300 font-bold">
                                    <span>CS: <strong className="text-white font-black">{m.totalCs}</strong> ({m.csPerMin}/m)</span>
                                    <span>·</span>
                                    <span>傷害: <strong className="text-amber-300 font-black">{m.totalDamage?.toLocaleString()}</strong></span>
                                  </div>
                                  
                                  <div className="flex gap-1 pt-0.5">
                                    {m.items?.map((item: number, idx: number) => (
                                      <div key={idx} className="w-5.5 h-5.5 bg-slate-950 rounded-md border border-slate-700 overflow-hidden">
                                        {item && item > 0 ? (
                                          <img
                                            src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/item/${item}.png`}
                                            alt={`item-${item}`}
                                            className="w-full h-full object-cover"
                                            onError={(e: any) => { e.target.style.display = 'none'; }}
                                          />
                                        ) : null}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2.5">
                                  <span className={`text-base font-black ${m.win ? 'text-blue-400' : 'text-red-400'}`}>
                                    {m.win ? '勝利' : '敗北'}
                                  </span>

                                  <button
                                    onClick={() => setExpandedMatch(isExpanded ? null : m.matchId)}
                                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-xl border border-slate-700 font-bold transition-all"
                                  >
                                    {isExpanded ? '▲' : '▼'}
                                  </button>
                                </div>

                              </div>

                            </div>

                            {/* 展開詳情 */}
                            {isExpanded && m.teams && (
                              <div className="border-t border-slate-800 bg-slate-950 p-3.5 space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                  {m.teams.map((p: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className={`flex items-center justify-between p-2.5 rounded-xl border ${
                                        p.win ? 'bg-blue-950/40 border-blue-800' : 'bg-red-950/40 border-red-800'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <img
                                          src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${p.championName}.png`}
                                          className="w-5.5 h-5.5 rounded-full border border-slate-700"
                                          alt={p.championName}
                                          onError={(e: any) => { e.target.src = 'https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/Square_0.png'; }}
                                        />
                                        <span className={`font-black ${p.puuid === data.player?.puuid ? 'text-blue-400' : 'text-slate-200'}`}>
                                          {p.summonerName || '未知玩家'}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-3 text-slate-300 text-[11px] font-bold">
                                        <span>{p.kills}/{p.deaths}/{p.assists}</span>
                                        <span>CS: {p.totalCs}</span>
                                        <span className="text-amber-300 font-black">{p.totalDamage?.toLocaleString()} 傷</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}

            </div>

          </div>
        )}

      </div>
    </main>
  );
}