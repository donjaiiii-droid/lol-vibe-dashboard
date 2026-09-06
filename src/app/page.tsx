'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';

// --- 本地與線上圖片對應邏輯 ---

// 1. 英雄頭像：優先讀取 public/ 裡的 Locke 與 Mel，其餘維持 DDragon
const getChampionImg = (name: string) => {
  if (!name) return '/unrank.jfif';
  
  const lowerName = name.toLowerCase();
  if (lowerName === 'locke') return '/locke.jpg';
  if (lowerName === 'mel') return '/Mel.jfif';

  const nameMap: Record<string, string> = {
    FiddleSticks: 'Fiddlesticks',
    Galio: 'Galio',
  };
  const cleanName = nameMap[name] || name;
  return `https://ddragon.leagueoflegends.com/cdn/14.5.1/img/champion/${cleanName}.png`;
};

// 2. 段位圖示：讀取 public/ 裡的自訂圖片
const getRankIcon = (tier?: string) => {
  if (!tier) return '/unrank.jfif';
  
  const cleanTier = tier.toLowerCase();
  if (cleanTier === 'platinum') return '/Platinum.jfif';
  if (cleanTier === 'unranked') return '/unrank.jfif';
  
  return `/${cleanTier}.png`;
};

// 3. 召喚師技能圖示
const getSummonerSpellImg = (spellId: number) => {
  const spellMap: Record<number, string> = {
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
  const spellName = spellMap[spellId];
  return spellName
    ? `https://ddragon.leagueoflegends.com/cdn/14.5.1/img/spell/${spellName}.png`
    : '';
};

// 4. 裝備圖示
const getItemImg = (itemId: number) => {
  if (!itemId || itemId === 0) return null;
  return `https://ddragon.leagueoflegends.com/cdn/14.5.1/img/item/${itemId}.png`;
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<'overview' | 'style' | 'champions'>('overview');
  const [region, setRegion] = useState('韓服 (KR)');
  const [searchInput, setSearchInput] = useState('Hide on bush #KR1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  // 初始載入預設資料
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const parts = searchInput.split('#');
    const gameName = parts[0]?.trim();
    const tagLine = parts[1]?.trim() || 'TW2';

    if (!gameName) {
      setError('請輸入遊戲名稱');
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
    <main className="min-h-screen bg-[#070a12] text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 頂部 Header & 分頁導覽 */}
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

        {/* 搜尋欄位 */}
        <div className="flex justify-center my-6">
          <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-xl">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="bg-[#0f1422] border border-slate-800 text-sm rounded-xl px-3 py-2.5 outline-none focus:border-blue-500"
            >
              <option>韓服 (KR)</option>
              <option>台服 (TW2)</option>
            </select>

            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="名稱 #TAG"
              className="flex-1 bg-[#0f1422] border border-slate-800 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition disabled:opacity-50"
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

        {/* 核心區域：左側段位卡片 + 右側主數據區 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* 左側：單雙排 & 彈性積分卡片 */}
          <div className="space-y-4 lg:col-span-1">
            {/* 單雙排 */}
            <div className="bg-[#0d111d] border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4">
              <img
                src={getRankIcon(data?.ranks?.solo?.tier || 'CHALLENGER')}
                alt="Rank"
                className="w-14 h-14 object-contain"
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

            {/* 彈性積分 */}
            <div className="bg-[#0d111d] border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4">
              <img
                src={getRankIcon('unranked')}
                alt="Unranked"
                className="w-12 h-12 object-contain opacity-80"
              />
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">彈性積分</div>
                <div className="text-sm font-bold text-slate-300">未定級 (Unranked)</div>
              </div>
            </div>
          </div>

          {/* 右側內容：依據 Active Tab 切換頁面內容 */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* 分頁 1：概要 (Overview) */}
            {activeTab === 'overview' && (
              <>
                {/* 20場統計圖表卡片 */}
                <div className="bg-[#0d111d] border border-slate-800/80 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    {/* 勝率圓環 */}
                    <div className="relative w-16 h-16 flex items-center justify-center rounded-full border-4 border-blue-500 bg-slate-900/50">
                      <span className="text-xs font-black text-white">65%</span>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">20場對戰 13勝 7敗</div>
                      <div className="text-xl font-black text-white mt-0.5">3.61 <span className="text-xs font-normal text-slate-400">:1</span></div>
                      <div className="text-[11px] text-red-400 font-bold">6.5 / 3.6 / 6.5 <span className="text-slate-400 ml-1">參戰率 51%</span></div>
                    </div>
                  </div>

                  {/* 最近英雄表現 */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-3">
                      <img src={getChampionImg('Tristana')} className="w-5 h-5 rounded-full" />
                      <span className="text-red-400 font-bold">67% <span className="text-slate-400 font-normal">(2勝 / 1敗)</span></span>
                      <span className="text-slate-300 font-mono ml-2">5.20:1</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <img src={getChampionImg('LeeSin')} className="w-5 h-5 rounded-full" />
                      <span className="text-red-400 font-bold">67% <span className="text-slate-400 font-normal">(2勝 / 1敗)</span></span>
                      <span className="text-slate-300 font-mono ml-2">5.00:1</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <img src={getChampionImg('Locke')} className="w-5 h-5 rounded-full" />
                      <span className="text-blue-400 font-bold">50% <span className="text-slate-400 font-normal">(1勝 / 1敗)</span></span>
                      <span className="text-slate-300 font-mono ml-2">2.86:1</span>
                    </div>
                  </div>
                </div>

                {/* 對戰清單 */}
                <div className="space-y-2.5">
                  {(data?.matches || [
                    { id: '1', champion: 'Tristana', kills: 7, deaths: 3, assists: 5, win: true, cs: '11/m', damage: '27,698' },
                    { id: '2', champion: 'LeeSin', kills: 5, deaths: 6, assists: 10, win: false, cs: '6/m', damage: '18,200' },
                    { id: '3', champion: 'Locke', kills: 11, deaths: 2, assists: 4, win: true, cs: '8.3/m', damage: '22,100' },
                    { id: '4', champion: 'Locke', kills: 15, deaths: 0, assists: 5, win: true, cs: '10.4/m', damage: '31,500' },
                    { id: '5', champion: 'Cassiopeia', kills: 2, deaths: 0, assists: 1, win: true, cs: '10/m', damage: '14,200' },
                    { id: '6', champion: 'Syndra', kills: 3, deaths: 1, assists: 3, win: false, cs: '7.9/m', damage: '19,800' },
                  ]).map((m: any, idx: number) => {
                    const matchId = m.matchId || m.id || String(idx);
                    const isExpanded = expandedMatchId === matchId;
                    const isWin = m.targetParticipant ? m.targetParticipant.win : m.win;
                    const champName = m.targetParticipant ? m.targetParticipant.championName : (m.champion || 'Tristana');
                    const kills = m.targetParticipant ? m.targetParticipant.kills : m.kills;
                    const deaths = m.targetParticipant ? m.targetParticipant.deaths : m.deaths;
                    const assists = m.targetParticipant ? m.targetParticipant.assists : m.assists;

                    return (
                      <div
                        key={matchId}
                        className={`border rounded-xl transition overflow-hidden ${
                          isWin ? 'bg-[#0a1428]/90 border-blue-900/40' : 'bg-[#1c0d13]/90 border-red-900/40'
                        }`}
                      >
                        {/* 對戰列 */}
                        <div className="p-3.5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={getChampionImg(champName)}
                              alt={champName}
                              className="w-11 h-11 rounded-lg object-cover border border-slate-700"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-sm text-white">{champName}</span>
                                <span className="bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded font-bold">CLASSIC</span>
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">(1413分)</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div className="text-sm font-black font-mono">
                                KDA: <span className="text-white">{kills}</span> / <span className="text-red-400">{deaths}</span> / <span className="text-white">{assists}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                CS: ({m.cs || '11/m'}) · 傷害: {m.damage || '27,698'}
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

                        {/* 展開 10 人數據列表 (圖片 4 樣式) */}
                        {isExpanded && (
                          <div className="p-4 bg-[#080b13] border-t border-slate-800/80 space-y-4 text-xs">
                            {/* 藍隊 */}
                            <div>
                              <div className="text-blue-400 font-bold mb-2">藍隊 (Team 100)</div>
                              <div className="space-y-1">
                                {[
                                  { name: 'aierlanxiaozhu', champ: 'Galio', kda: '16 / 4 / 7', cs: '236 CS', damage: '38,871' },
                                  { name: 'dylzg', champ: 'LeeSin', kda: '9 / 3 / 8', cs: '218 CS', damage: '17,789' },
                                  { name: 'Hide on bush', champ: 'Tristana', kda: '7 / 3 / 5', cs: '260 CS', damage: '27,698' },
                                ].map((p, pIdx) => (
                                  <div key={pIdx} className="flex items-center justify-between py-1 border-b border-slate-800/40 text-slate-300">
                                    <div className="flex items-center gap-2">
                                      <img src={getChampionImg(p.champ)} className="w-6 h-6 rounded" />
                                      <span className="font-bold">{p.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4 font-mono text-[11px]">
                                      <span>{p.kda}</span>
                                      <span className="text-slate-500">{p.cs}</span>
                                      <span className="text-amber-400 font-bold">💥 {p.damage}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* 紅隊 */}
                            <div>
                              <div className="text-red-400 font-bold mb-2">紅隊 (Team 200)</div>
                              <div className="space-y-1">
                                {[
                                  { name: 'Frog', champ: 'Akali', kda: '4 / 12 / 1', cs: '137 CS', damage: '16,231' },
                                  { name: 'KRX Winner', champ: 'Sylas', kda: '6 / 8 / 7', cs: '126 CS', damage: '12,616' },
                                ].map((p, pIdx) => (
                                  <div key={pIdx} className="flex items-center justify-between py-1 border-b border-slate-800/40 text-slate-300">
                                    <div className="flex items-center gap-2">
                                      <img src={getChampionImg(p.champ)} className="w-6 h-6 rounded" />
                                      <span className="font-bold">{p.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4 font-mono text-[11px]">
                                      <span>{p.kda}</span>
                                      <span className="text-slate-500">{p.cs}</span>
                                      <span className="text-amber-400 font-bold">💥 {p.damage}</span>
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

            {/* 分頁 2：風格 (Style Analysis) */}
            {activeTab === 'style' && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-[#0d111d] border border-slate-800 p-4 rounded-xl text-center">
                    <div className="text-xs text-slate-400">場次</div>
                    <div className="text-xl font-black text-white mt-1">18</div>
                    <div className="text-[10px] text-slate-500">11勝 7敗</div>
                  </div>
                  <div className="bg-[#0d111d] border border-slate-800 p-4 rounded-xl text-center">
                    <div className="text-xs text-slate-400">勝率</div>
                    <div className="text-xl font-black text-blue-400 mt-1">61%</div>
                  </div>
                  <div className="bg-[#0d111d] border border-slate-800 p-4 rounded-xl text-center">
                    <div className="text-xs text-slate-400">KDA</div>
                    <div className="text-xl font-black text-purple-400 mt-1">3.48</div>
                  </div>
                  <div className="bg-[#0d111d] border border-slate-800 p-4 rounded-xl text-center">
                    <div className="text-xs text-slate-400">英雄池</div>
                    <div className="text-xl font-black text-amber-400 mt-1">13</div>
                  </div>
                </div>

                <div className="bg-[#0d111d] border border-slate-800 p-5 rounded-2xl">
                  <div className="text-sm font-bold text-white mb-4">角色路線分佈</div>
                  <div className="w-full bg-blue-600 h-3 rounded-full mb-4" />
                  <div className="grid grid-cols-5 gap-2 text-center text-xs">
                    <div className="bg-slate-900/60 p-2 rounded-lg"><div className="text-slate-400">上路</div><div className="font-bold text-white mt-1">0%</div></div>
                    <div className="bg-slate-900/60 p-2 rounded-lg"><div className="text-slate-400">打野</div><div className="font-bold text-white mt-1">0%</div></div>
                    <div className="bg-slate-900/60 p-2 rounded-lg"><div className="text-slate-400">中路</div><div className="font-bold text-white mt-1">0%</div></div>
                    <div className="bg-slate-900/60 p-2 rounded-lg"><div className="text-slate-400">下路</div><div className="font-bold text-white mt-1">0%</div></div>
                    <div className="bg-slate-900/60 p-2 rounded-lg border border-blue-500/50"><div className="text-blue-400 font-bold">輔助</div><div className="font-bold text-white mt-1">100%</div></div>
                  </div>
                </div>
              </div>
            )}

            {/* 分頁 3：Champions (英雄專精數據) */}
            {activeTab === 'champions' && (
              <div className="bg-[#0d111d] border border-slate-800 rounded-2xl overflow-hidden text-xs">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between font-bold text-slate-400">
                  <span>英雄專精數據 (共13位)</span>
                  <span>CS (小兵)</span>
                </div>
                <div className="divide-y divide-slate-800/60">
                  {[
                    { name: 'Locke', wins: '2勝 1敗', rate: '67%', kda: '5.20:1' },
                    { name: 'Tristana', wins: '1勝 1敗', rate: '50%', kda: '2.86:1' },
                    { name: 'Syndra', wins: '1勝 1敗', rate: '50%', kda: '5.67:1' },
                    { name: 'Akali', wins: '1勝 1敗', rate: '50%', kda: '2.10:1' },
                    { name: 'LeeSin', wins: '0勝 1敗', rate: '0%', kda: '2.50:1' },
                    { name: 'Mel', wins: '1勝 0敗', rate: '100%', kda: ' Perfect:1' },
                  ].map((c, i) => (
                    <div key={i} className="p-3.5 flex items-center justify-between hover:bg-slate-900/40 transition">
                      <div className="flex items-center gap-3">
                        <img src={getChampionImg(c.name)} className="w-8 h-8 rounded-lg object-cover" />
                        <span className="font-bold text-white text-sm">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-8 font-mono">
                        <span className="text-blue-400">{c.wins} ({c.rate})</span>
                        <span className="text-slate-200 font-bold">{c.kda}</span>
                        <span className="text-slate-500">0.0 CS</span>
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