'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

// --- 圖片路徑判斷（精準對應 public 資料夾）---

const getChampionImg = (name: string) => {
  if (!name) return '/unrank.jfif';
  const lowerName = name.toLowerCase();

  // 自訂圖片
  if (lowerName === 'locke') return '/locke.jpg';
  if (lowerName === 'mel') return '/Mel.jfif';

  // Riot DDragon CDN 圖片轉換
  const nameMap: Record<string, string> = {
    fiddlesticks: 'Fiddlesticks',
    leesin: 'LeeSin',
    cassiopeia: 'Cassiopeia',
    tristana: 'Tristana',
    syndra: 'Syndra',
    akali: 'Akali'
  };

  const cleanName = nameMap[lowerName] || (name.charAt(0).toUpperCase() + name.slice(1));
  return `https://ddragon.leagueoflegends.com/cdn/14.5.1/img/champion/${cleanName}.png`;
};

const getRankIcon = (tier?: string) => {
  if (!tier) return '/unrank.jfif';
  const cleanTier = tier.toLowerCase();

  if (cleanTier === 'challenger') return '/challenger.png';
  if (cleanTier === 'platinum') return '/Platinum.jfif';
  if (cleanTier === 'unranked') return '/unrank.jfif';

  return `/${cleanTier}.png`;
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<'overview' | 'style' | 'champions'>('overview');
  const [region, setRegion] = useState('韓服 (KR)');
  const [searchInput, setSearchInput] = useState('Hide on bush#KR1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>('1');

  // 搜尋處理邏輯
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    let gameName = '';
    let tagLine = '';

    if (searchInput.includes('#')) {
      const parts = searchInput.split('#');
      gameName = parts[0].trim();
      tagLine = parts[1].trim();
    } else {
      gameName = searchInput.trim();
      tagLine = region.includes('TW2') ? 'TW2' : 'KR1';
    }

    if (!gameName) {
      setError('請輸入有效的 Riot ID (例: Name#TAG)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/matches?gameName=${encodeURIComponent(gameName)}&tagLine=${encodeURIComponent(tagLine)}`
      );
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || '搜尋失敗，請檢查玩家名稱');
      }

      setData(result);
    } catch (err: any) {
      setError(err.message || '發生未知錯誤');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  const toggleMatch = (matchId: string) => {
    setExpandedMatchId(expandedMatchId === matchId ? null : matchId);
  };

  return (
    <main className="min-h-screen bg-[#050811] text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* 頁頭與分頁選單 */}
        <header className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-8 text-sm font-bold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-1 transition ${activeTab === 'overview' ? 'text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'}`}
            >
              概要
            </button>
            <button
              onClick={() => setActiveTab('style')}
              className={`pb-1 transition ${activeTab === 'style' ? 'text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'}`}
            >
              風格
            </button>
            <button
              onClick={() => setActiveTab('champions')}
              className={`pb-1 transition ${activeTab === 'champions' ? 'text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Champions
            </button>
          </div>
          <div className="text-xs font-mono text-slate-500 tracking-wider">
            S2026 GG.ANALYTICS
          </div>
        </header>

        {/* 搜尋欄 */}
        <div className="flex justify-center my-4">
          <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-md">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="bg-[#0b0f19] border border-slate-800 text-xs rounded-xl px-3 py-2 outline-none focus:border-blue-500"
            >
              <option>韓服 (KR)</option>
              <option>台服 (TW2)</option>
            </select>

            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Hide on bush#KR1"
              className="flex-1 bg-[#0b0f19] border border-slate-800 text-xs rounded-xl px-4 py-2 outline-none focus:border-blue-500 font-mono"
            />

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2 rounded-xl transition disabled:opacity-50"
            >
              {loading ? '搜尋中...' : '搜尋'}
            </button>
          </form>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* 主畫面容器 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* 左側段位顯示卡片 */}
          <div className="space-y-4 lg:col-span-1">
            <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-4 flex items-center gap-4">
              <img
                src={getRankIcon(data?.ranks?.solo?.tier || 'challenger')}
                alt="Rank"
                className="w-14 h-14 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).src = '/challenger.png'; }}
              />
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">單/雙排積分</div>
                <div className="text-base font-black text-white tracking-wide">
                  {data?.ranks?.solo?.tier || 'CHALLENGER'} {data?.ranks?.solo?.rank || 'I'}
                </div>
                <div className="text-xs text-blue-400 font-bold mt-0.5">
                  1959 LP <span className="text-slate-400 font-normal">· 372勝 307敗 (55%)</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-4 flex items-center gap-4">
              <img
                src={getRankIcon('unranked')}
                alt="Unranked"
                className="w-12 h-12 object-contain opacity-80"
                onError={(e) => { (e.target as HTMLImageElement).src = '/unrank.jfif'; }}
              />
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">彈性積分</div>
                <div className="text-sm font-bold text-slate-300">未定級 (Unranked)</div>
              </div>
            </div>
          </div>

          {/* 右側分頁內容 */}
          <div className="lg:col-span-3 space-y-4">

            {/* --- 1. 概要頁面 (Overview) --- */}
            {activeTab === 'overview' && (
              <>
                <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 flex items-center justify-center rounded-full border-4 border-blue-500 bg-slate-900/50">
                      <span className="text-xs font-black text-white">65%</span>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">20場對戰 13勝 7敗</div>
                      <div className="text-xl font-black text-white mt-0.5">3.61 <span className="text-xs font-normal text-slate-400">:1</span></div>
                      <div className="text-[11px] text-red-400 font-bold">6.5 / 3.6 / 6.5 <span className="text-slate-400 ml-1">參戰率 51%</span></div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {(data?.summary?.champions || [
                      { name: 'Tristana', winRate: '67%', wins: 2, losses: 1, kda: '5.20:1' },
                      { name: 'LeeSin', winRate: '67%', wins: 2, losses: 1, kda: '5.00:1' },
                      { name: 'Locke', winRate: '50%', wins: 1, losses: 1, kda: '2.86:1' }
                    ]).map((champ: any) => (
                      <div key={champ.name} className="flex items-center gap-3">
                        <img
                          src={getChampionImg(champ.name)}
                          className="w-5 h-5 rounded-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/locke.jpg'; }}
                        />
                        <span className="text-red-400 font-bold">{champ.winRate} <span className="text-slate-400 font-normal">({champ.wins}勝 / {champ.losses}敗)</span></span>
                        <span className="text-slate-300 font-mono ml-2">{champ.kda}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 對戰歷史紀錄清單 */}
                <div className="space-y-2.5">
                  {(data?.matches || []).map((m: any, idx: number) => {
                    const matchId = m.id || String(idx);
                    const isExpanded = expandedMatchId === matchId;
                    const isWin = m.win;

                    return (
                      <div
                        key={matchId}
                        className={`border rounded-xl transition overflow-hidden ${
                          isWin ? 'bg-[#0a1428]/90 border-blue-900/40' : 'bg-[#1c0d13]/90 border-red-900/40'
                        }`}
                      >
                        <div className="p-3.5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={getChampionImg(m.champion)}
                              alt={m.champion}
                              className="w-11 h-11 rounded-lg object-cover border border-slate-700 bg-slate-800"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/locke.jpg'; }}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-sm text-white">{m.champion}</span>
                                <span className="bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded font-bold">CLASSIC</span>
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">({m.score || 1413}分)</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div className="text-sm font-black font-mono">
                                KDA: <span className="text-white">{m.kills}</span> / <span className="text-red-400">{m.deaths}</span> / <span className="text-white">{m.assists}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                CS: ({m.cs}) · 傷害: {m.damage}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className={`text-sm font-black ${isWin ? 'text-blue-400' : 'text-red-400'}`}>
                                {isWin ? '勝利' : '敗北'}
                              </span>
                              <button
                                onClick={() => toggleMatch(matchId)}
                                className="p-1 hover:bg-slate-800/50 rounded transition text-slate-400"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 展開之隊伍玩家列表 */}
                        {isExpanded && m.team100 && (
                          <div className="border-t border-slate-800/80 bg-[#080c16] p-4 text-xs space-y-3">
                            <div>
                              <div className="text-blue-400 font-bold mb-2">藍隊 (Team 100)</div>
                              <div className="space-y-1.5">
                                {m.team100.map((p: any, i: number) => (
                                  <div
                                    key={i}
                                    className={`flex items-center justify-between p-1 rounded ${
                                      p.isSelf ? 'bg-blue-900/30 text-white font-bold' : 'text-slate-300'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <img src={getChampionImg(p.champion)} className="w-5 h-5 rounded object-cover" />
                                      <span>{p.name}</span>
                                    </div>
                                    <div className="font-mono text-slate-400">
                                      {p.kills} / {p.deaths} / {p.assists}
                                      <span className="ml-3">{p.cs} CS</span>
                                      <span className="text-amber-400 font-bold ml-3">💥 {p.damage}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-800/40">
                              <div className="text-red-400 font-bold mb-2">紅隊 (Team 200)</div>
                              <div className="space-y-1.5">
                                {m.team200.map((p: any, i: number) => (
                                  <div key={i} className="flex items-center justify-between text-slate-300 p-1">
                                    <div className="flex items-center gap-2">
                                      <img src={getChampionImg(p.champion)} className="w-5 h-5 rounded object-cover" />
                                      <span>{p.name}</span>
                                    </div>
                                    <div className="font-mono text-slate-400">
                                      {p.kills} / {p.deaths} / {p.assists}
                                      <span className="ml-3">{p.cs} CS</span>
                                      <span className="text-amber-400 font-bold ml-3">💥 {p.damage}</span>
                                    </div>
                                  </div>
                                ))}
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

            {/* --- 2. 風格頁面 (Style) --- */}
            {activeTab === 'style' && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-[#0b0f19] border border-slate-800/80 p-4 rounded-xl text-center">
                    <div className="text-xs text-slate-400">場次</div>
                    <div className="text-xl font-black text-white mt-1">{data?.styleStats?.games || 18}</div>
                    <div className="text-[10px] text-slate-500">{data?.styleStats?.wins || 11}勝 {data?.styleStats?.losses || 7}敗</div>
                  </div>
                  <div className="bg-[#0b0f19] border border-slate-800/80 p-4 rounded-xl text-center">
                    <div className="text-xs text-slate-400">勝率</div>
                    <div className="text-xl font-black text-blue-400 mt-1">{data?.styleStats?.winRate || 61}%</div>
                  </div>
                  <div className="bg-[#0b0f19] border border-slate-800/80 p-4 rounded-xl text-center">
                    <div className="text-xs text-slate-400">KDA</div>
                    <div className="text-xl font-black text-purple-400 mt-1">{data?.styleStats?.kda || '3.48'}</div>
                  </div>
                  <div className="bg-[#0b0f19] border border-slate-800/80 p-4 rounded-xl text-center">
                    <div className="text-xs text-slate-400">英雄池</div>
                    <div className="text-xl font-black text-amber-400 mt-1">{data?.styleStats?.championPool || 13}</div>
                  </div>
                </div>

                <div className="bg-[#0b0f19] border border-slate-800/80 p-5 rounded-xl space-y-4">
                  <div className="text-sm font-bold text-white">角色路線分佈</div>
                  <div className="w-full bg-blue-600 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full w-full" />
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-center text-xs">
                    <div className="p-2 bg-slate-900/40 rounded-lg"><div className="text-slate-400">上路</div><div className="font-bold text-white mt-1">0%</div></div>
                    <div className="p-2 bg-slate-900/40 rounded-lg"><div className="text-slate-400">打野</div><div className="font-bold text-white mt-1">0%</div></div>
                    <div className="p-2 bg-slate-900/40 rounded-lg"><div className="text-slate-400">中路</div><div className="font-bold text-white mt-1">0%</div></div>
                    <div className="p-2 bg-slate-900/40 rounded-lg"><div className="text-slate-400">下路</div><div className="font-bold text-white mt-1">0%</div></div>
                    <div className="p-2 bg-blue-900/30 border border-blue-500/40 rounded-lg"><div className="text-blue-400 font-bold">輔助</div><div className="font-bold text-blue-400 mt-1">100%</div></div>
                  </div>
                </div>
              </div>
            )}

            {/* --- 3. Champions 頁面 --- */}
            {activeTab === 'champions' && (
              <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-4 text-xs space-y-3">
                <div className="flex justify-between text-slate-400 pb-2 border-b border-slate-800 font-bold">
                  <span>英雄專精數據 (共{data?.championsStats?.length || 6}位)</span>
                  <span>CS (小兵)</span>
                </div>

                <div className="space-y-2">
                  {(data?.championsStats || []).map((c: any) => (
                    <div key={c.name} className="flex items-center justify-between p-2 hover:bg-slate-900/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <img
                          src={getChampionImg(c.name)}
                          className="w-7 h-7 rounded object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/locke.jpg'; }}
                        />
                        <span className="font-bold text-white">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-8 font-mono">
                        <span className="text-blue-400">{c.wins}勝 {c.losses}敗 ({c.winRate}%)</span>
                        <span className="text-white font-bold">{c.kda}</span>
                        <span className="text-slate-400">{c.cs}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </main>
  );
}