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

export default function Home() {
  const [activeTab, setActiveTab] = useState<'overview' | 'style' | 'champions'>('overview');
  const [gameName, setGameName] = useState('Fungz');
  const [tagLine, setTagLine] = useState('TW2');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  // 核心搜尋邏輯修復：精準傳遞 gameName 與 tagLine
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanName = gameName.trim();
    const cleanTag = tagLine.trim();

    if (!cleanName || !cleanTag) {
      setError('請輸入有效的 Riot ID (例: Name#TAG)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/matches?gameName=${encodeURIComponent(cleanName)}&tagLine=${encodeURIComponent(cleanTag)}`
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
        
        {/* 頂部 Header & 搜尋欄位 */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0d111d] border border-slate-800/80 p-6 rounded-2xl shadow-xl">
          <div>
            <h1 className="text-2xl font-black tracking-wider text-blue-500">
              LOL MATCH DASHBOARD
            </h1>
            <p className="text-xs text-slate-400 mt-1">英雄聯盟戰績搜尋與即時對戰分析</p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex bg-[#070a12] border border-slate-800 rounded-xl overflow-hidden focus-within:border-blue-500 transition">
              <input
                type="text"
                placeholder="Name"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                className="bg-transparent px-4 py-2.5 text-sm outline-none w-36 sm:w-44 placeholder:text-slate-600"
              />
              <span className="flex items-center text-slate-600 font-bold">#</span>
              <input
                type="text"
                placeholder="TAG"
                value={tagLine}
                onChange={(e) => setTagLine(e.target.value)}
                className="bg-transparent px-3 py-2.5 text-sm outline-none w-20 placeholder:text-slate-600"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              {loading ? '搜尋中...' : '搜尋戰績'}
            </button>
          </form>
        </header>

        {/* 導覽列 */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
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
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 核心區域：左側段位卡片 + 右側主數據區 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* 左側段位卡片 */}
          <div className="space-y-4 lg:col-span-1">
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

          {/* 右側分頁數據 */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* 分頁 1：概要 */}
            {activeTab === 'overview' && (
              <>
                <div className="bg-[#0d111d] border border-slate-800/80 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-6">
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

                {/* 對戰列表 */}
                <div className="space-y-2.5">
                  {(data?.matches || [
                    { id: '1', champion: 'Tristana', kills: 7, deaths: 3, assists: 5, win: true, cs: '11/m', damage: '27,698' },
                    { id: '2', champion: 'LeeSin', kills: 5, deaths: 6, assists: 10, win: false, cs: '6/m', damage: '18,200' },
                    { id: '3', champion: 'Locke', kills: 11, deaths: 2, assists: 4, win: true, cs: '8.3/m', damage: '22,100' },
                    { id: '4', champion: 'Locke', kills: 15, deaths: 0, assists: 5, win: true, cs: '10.4/m', damage: '31,500' },
                    { id: '5', champion: 'Cassiopeia', kills: 2, deaths: 0, assists: 1, win: true, cs: '10/m', damage: '14,200' },
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
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div className="text-sm font-black font-mono">
                                KDA: <span className="text-white">{kills}</span> / <span className="text-red-400">{deaths}</span> / <span className="text-white">{assists}</span>
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
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* 分頁 2：風格 */}
            {activeTab === 'style' && (
              <div className="bg-[#0d111d] border border-slate-800 p-5 rounded-2xl">
                <div className="text-sm font-bold text-white mb-4">角色路線分佈</div>
                <div className="w-full bg-blue-600 h-3 rounded-full mb-4" />
              </div>
            )}

            {/* 分頁 3：Champions */}
            {activeTab === 'champions' && (
              <div className="bg-[#0d111d] border border-slate-800 rounded-2xl p-4 text-xs">
                英雄專精數據列表
              </div>
            )}

          </div>

        </div>

      </div>
    </main>
  );
}