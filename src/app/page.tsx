'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  Trophy,
  Activity,
  Award,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ExternalLink,
  ShieldAlert
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

// 2. 段位圖示：優先讀取 public/ 裡的自訂圖片
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
  const [gameName, setGameName] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [expandedMatches, setExpandedMatches] = useState<Record<string, boolean>>({});

  // 預設載入 Fungz #TW2
  useEffect(() => {
    setGameName('Fungz');
    setTagLine('TW2');
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!gameName || !tagLine) {
      setError('請輸入完整的遊戲名字與 Tag');
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
        throw new Error(result.error || '搜尋失敗，請檢查名稱與 Tag 是否正確');
      }

      setData(result);
    } catch (err: any) {
      setError(err.message || '發生未知錯誤');
    } finally {
      setLoading(false);
    }
  };

  const toggleMatch = (matchId: string) => {
    setExpandedMatches((prev) => ({ ...prev, [matchId]: !prev[matchId] }));
  };

  // 計算平均勝率與 KDA
  const calculateStats = () => {
    if (!data?.matches || data.matches.length === 0) return null;

    let wins = 0;
    let totalKills = 0;
    let totalDeaths = 0;
    let totalAssists = 0;

    data.matches.forEach((m: any) => {
      const p = m.targetParticipant;
      if (p) {
        if (p.win) wins++;
        totalKills += p.kills || 0;
        totalDeaths += p.deaths || 0;
        totalAssists += p.assists || 0;
      }
    });

    const total = data.matches.length;
    const winRate = Math.round((wins / total) * 100);
    const kda = totalDeaths === 0 ? 'Perfect' : ((totalKills + totalAssists) / totalDeaths).toFixed(2);

    return {
      wins,
      losses: total - wins,
      winRate,
      avgKills: (totalKills / total).toFixed(1),
      avgDeaths: (totalDeaths / total).toFixed(1),
      avgAssists: (totalAssists / total).toFixed(1),
      kda,
    };
  };

  const stats = calculateStats();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* 頂部標題與搜尋列 */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 backdrop-blur p-6 rounded-2xl shadow-2xl">
          <div>
            <h1 className="text-2xl font-black tracking-wider bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              LOL MATCH DASHBOARD
            </h1>
            <p className="text-xs text-slate-400 mt-1">英雄聯盟戰績搜尋與即時對戰分析</p>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
            <div className="flex bg-slate-950 border border-slate-800 rounded-xl overflow-hidden focus-within:border-cyan-500 transition">
              <input
                type="text"
                placeholder="遊戲名字 (如: Fungz)"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                className="bg-transparent px-4 py-2.5 text-sm outline-none w-40 sm:w-48 placeholder:text-slate-600"
              />
              <span className="flex items-center text-slate-600 font-bold">#</span>
              <input
                type="text"
                placeholder="Tag (如: TW2)"
                value={tagLine}
                onChange={(e) => setTagLine(e.target.value)}
                className="bg-transparent px-3 py-2.5 text-sm outline-none w-20 placeholder:text-slate-600"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 text-sm shadow-lg shadow-cyan-500/20"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              搜尋戰績
            </button>
          </form>
        </header>

        {/* 錯誤訊息展示 */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center gap-3 text-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 主要內容區域 */}
        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 左側：玩家資訊與統計 */}
            <div className="space-y-6">
              
              {/* 玩家個人卡片 */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={`https://ddragon.leagueoflegends.com/cdn/14.5.1/img/profileicon/${data.summoner?.profileIconId || 6}.png`}
                      alt="Profile Icon"
                      className="w-16 h-16 rounded-2xl border-2 border-slate-700 object-cover"
                    />
                    <span className="absolute -bottom-2 -right-2 bg-slate-800 border border-slate-700 text-xs px-2 py-0.5 rounded-full text-slate-300 font-mono">
                      {data.summoner?.summonerLevel || 300}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      {data.player?.gameName || gameName}
                      <span className="text-sm font-normal text-slate-500">#{data.player?.tagLine || tagLine}</span>
                    </h2>
                    <p className="text-xs text-cyan-400 mt-1 flex items-center gap-1">
                      <Activity className="w-3 h-3" /> 近期戰績更新完畢
                    </p>
                  </div>
                </div>

                {/* 單雙排段位資訊 */}
                <div className="mt-6 pt-6 border-t border-slate-800 flex items-center gap-4">
                  <img
                    src={getRankIcon(data.ranks?.solo?.tier)}
                    alt="Rank Icon"
                    className="w-16 h-16 object-contain"
                  />
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">單雙排段位</div>
                    <div className="text-lg font-bold text-slate-200">
                      {data.ranks?.solo?.tier ? `${data.ranks.solo.tier} ${data.ranks.solo.rank}` : 'Unranked'}
                    </div>
                    {data.ranks?.solo?.leaguePoints !== undefined && (
                      <div className="text-xs text-slate-400 font-mono">
                        {data.ranks.solo.leaguePoints} LP / {data.ranks.solo.wins}勝 {data.ranks.solo.losses}敗
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 近期戰績數據統計 */}
              {stats && (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" /> 近期 {data.matches?.length || 0} 場表現
                  </h3>

                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <div className="text-2xl font-black text-slate-100">{stats.winRate}%</div>
                      <div className="text-xs text-slate-500">{stats.wins}勝 {stats.losses}敗</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-cyan-400">{stats.kda} KDA</div>
                      <div className="text-xs text-slate-500 font-mono">
                        {stats.avgKills} / {stats.avgDeaths} / {stats.avgAssists}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* 右側：對戰列表 */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Award className="w-4 h-4 text-cyan-400" /> 近期對戰紀錄
              </h3>

              {data.matches && data.matches.length > 0 ? (
                data.matches.map((m: any, idx: number) => {
                  const p = m.targetParticipant || {};
                  const isWin = p.win;
                  const isExpanded = expandedMatches[m.matchId || idx];

                  return (
                    <div
                      key={m.matchId || idx}
                      className={`border rounded-2xl transition overflow-hidden ${
                        isWin
                          ? 'bg-blue-950/20 border-blue-800/40 hover:border-blue-700/60'
                          : 'bg-red-950/20 border-red-800/40 hover:border-red-700/60'
                      }`}
                    >
                      {/* 對戰摘要條 */}
                      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        
                        <div className="flex items-center gap-4">
                          {/* 英雄頭像 */}
                          <div className="relative">
                            <img
                              src={getChampionImg(p.championName)}
                              alt={p.championName}
                              className="w-14 h-14 rounded-xl object-cover border border-slate-700"
                            />
                            <span className="absolute -bottom-1 -right-1 bg-slate-900 border border-slate-700 text-[10px] px-1 rounded text-slate-300">
                              {p.champLevel || 18}
                            </span>
                          </div>

                          {/* 技能與天賦圖示 */}
                          <div className="flex flex-col gap-1">
                            {getSummonerSpellImg(p.summoner1Id) && (
                              <img
                                src={getSummonerSpellImg(p.summoner1Id)}
                                alt="Spell 1"
                                className="w-6 h-6 rounded border border-slate-800"
                              />
                            )}
                            {getSummonerSpellImg(p.summoner2Id) && (
                              <img
                                src={getSummonerSpellImg(p.summoner2Id)}
                                alt="Spell 2"
                                className="w-6 h-6 rounded border border-slate-800"
                              />
                            )}
                          </div>

                          {/* KDA 與資訊 */}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold ${isWin ? 'text-blue-400' : 'text-red-400'}`}>
                                {isWin ? '勝利' : '敗北'}
                              </span>
                              <span className="text-xs text-slate-500 font-mono">{m.gameMode || 'Ranked'}</span>
                            </div>
                            <div className="text-lg font-black tracking-wide font-mono mt-0.5">
                              {p.kills || 0} / <span className="text-red-400">{p.deaths || 0}</span> / {p.assists || 0}
                            </div>
                          </div>
                        </div>

                        {/* 裝備列表與展開按鈕 */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-800/60 pt-3 sm:pt-0">
                          {/* 6 個裝備欄 */}
                          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                            {[p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6].map((item, i) => (
                              <div key={i} className="w-7 h-7 bg-slate-900/80 border border-slate-800 rounded flex items-center justify-center overflow-hidden">
                                {getItemImg(item) ? (
                                  <img src={getItemImg(item)!} alt="Item" className="w-full h-full object-cover" />
                                ) : null}
                              </div>
                            ))}
                          </div>

                          <button
                            onClick={() => toggleMatch(m.matchId || idx)}
                            className="p-2 hover:bg-slate-800/50 rounded-lg transition text-slate-400 hover:text-slate-200"
                          >
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                        </div>

                      </div>

                      {/* 點擊展開的詳細內容 */}
                      {isExpanded && (
                        <div className="p-4 bg-slate-950/60 border-t border-slate-800/60 space-y-2 text-xs">
                          <div className="font-bold text-slate-400 mb-2">對戰數據細節</div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-300">
                            <div>傷害輸出：<span className="font-mono text-cyan-400">{p.totalDamageDealtToChampions || 0}</span></div>
                            <div>擊殺視野：<span className="font-mono text-cyan-400">{p.visionScore || 0}</span></div>
                            <div>尾兵計數：<span className="font-mono text-cyan-400">{(p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0)}</span></div>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-500">
                  暫無對戰紀錄資料
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </main>
  );
}