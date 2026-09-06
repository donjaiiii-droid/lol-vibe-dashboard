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
  Sparkles,
  AlertCircle
} from 'lucide-react';

// --- Helper Functions ---

// 1. 英雄頭像 (優先讀取 public 本地圖檔，其餘使用 DDragon CDN)
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

// 2. 段位圖示 (完全讀取 public 資料夾內的本地圖片)
const getRankIcon = (tier?: string) => {
  if (!tier) return '/unrank.jfif';
  
  const cleanTier = tier.toLowerCase();
  
  // 處理 .jfif 格式
  if (cleanTier === 'platinum') return '/Platinum.jfif';
  if (cleanTier === 'unranked') return '/unrank.jfif';
  
  // 其餘段位 (.png 格式)
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

// --- TypeScript Interfaces ---
interface Participant {
  puuid: string;
  summonerName: string;
  riotIdGameName?: string;
  riotIdTagline?: string;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  summoner1Id: number;
  summoner2Id: number;
  totalDamageDealtToChampions: number;
}

interface Match {
  matchId: string;
  gameMode: string;
  gameDuration: number;
  gameCreation: number;
  participants: Participant[];
  targetParticipant: Participant;
}

interface LeagueEntry {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

interface SummonerData {
  account: {
    puuid: string;
    gameName: string;

    tagLine: string;
  };
  summoner: {
    id: string;
    accountId: string;
    puuid: string;
    profileIconId: number;
    summonerLevel: number;
  };
  leagues: LeagueEntry[];
  matches: Match[];
}

export default function Home() {
  const [gameName, setGameName] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SummonerData | null>(null);
  const [expandedMatches, setExpandedMatches] = useState<Record<string, boolean>>({});

  // 預設載入範例資料 (可自行調整)
  useEffect(() => {
    setGameName('Hide on bush');
    setTagLine('KR1');
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!gameName || !tagLine) {
      setError('請輸入完整的遊戲名字與 Tag (例如: Hide on bush #KR1)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/summoner?gameName=${encodeURIComponent(gameName)}&tagLine=${encodeURIComponent(tagLine)}`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || '搜尋失敗，請檢查名稱是否正確');
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

  const soloQueue = data?.leagues?.find((l) => l.queueType === 'RANKED_SOLO_5x5');
  const flexQueue = data?.leagues?.find((l) => l.queueType === 'RANKED_FLEX_SR');

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* 搜尋欄位 */}
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="遊戲名字 (例: Hide on bush)"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition"
              />
              <div className="flex items-center text-slate-500 font-bold">#</div>
              <input
                type="text"
                placeholder="Tag (例: KR1)"
                value={tagLine}
                onChange={(e) => setTagLine(e.target.value)}
                className="w-28 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              搜尋戰績
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 左側：玩家資訊 & 段位 */}
            <div className="space-y-6">
              
              {/* 個人資料 */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={`https://ddragon.leagueoflegends.com/cdn/14.5.1/img/profileicon/${data.summoner.profileIconId}.png`}
                      alt="Icon"
                      className="w-20 h-20 rounded-2xl border-2 border-cyan-500/50"
                    />
                    <span className="absolute -bottom-2 -right-2 bg-slate-950 text-cyan-400 text-xs px-2 py-0.5 rounded-full border border-slate-800 font-mono">
                      Lv.{data.summoner.summonerLevel}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                      {data.account.gameName}
                      <span className="text-slate-500 text-lg font-normal">#{data.account.tagLine}</span>
                    </h1>
                  </div>
                </div>
              </div>

              {/* 單/雙排段位 */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                <div className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  單/雙人積分
                </div>
                {soloQueue ? (
                  <div className="flex items-center gap-4">
                    <img
                      src={getRankIcon(soloQueue.tier)}
                      alt={soloQueue.tier}
                      className="w-16 h-16 object-contain"
                    />
                    <div>
                      <div className="font-bold text-lg text-slate-100">
                        {soloQueue.tier} {soloQueue.rank}
                      </div>
                      <div className="text-sm text-cyan-400 font-mono">{soloQueue.leaguePoints} LP</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {soloQueue.wins}勝 {soloQueue.losses}敗 (勝率 {Math.round((soloQueue.wins / (soloQueue.wins + soloQueue.losses)) * 100)}%)
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <img src={getRankIcon('unranked')} alt="Unranked" className="w-16 h-16 object-contain opacity-60" />
                    <div className="text-slate-500 text-sm">未排名</div>
                  </div>
                )}
              </div>

              {/* 彈性積分 */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                <div className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-400" />
                  彈性積分
                </div>
                {flexQueue ? (
                  <div className="flex items-center gap-4">
                    <img
                      src={getRankIcon(flexQueue.tier)}
                      alt={flexQueue.tier}
                      className="w-16 h-16 object-contain"
                    />
                    <div>
                      <div className="font-bold text-lg text-slate-100">
                        {flexQueue.tier} {flexQueue.rank}
                      </div>
                      <div className="text-sm text-cyan-400 font-mono">{flexQueue.leaguePoints} LP</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {flexQueue.wins}勝 {flexQueue.losses}敗 (勝率 {Math.round((flexQueue.wins / (flexQueue.wins + flexQueue.losses)) * 100)}%)
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <img src={getRankIcon('unranked')} alt="Unranked" className="w-16 h-16 object-contain opacity-60" />
                    <div className="text-slate-500 text-sm">未排名</div>
                  </div>
                )}
              </div>

            </div>

            {/* 右側：近期對戰紀錄 */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                近期對戰
              </h2>

              {data.matches && data.matches.length > 0 ? (
                data.matches.map((match) => {
                  const p = match.targetParticipant;
                  if (!p) return null;

                  const isWin = p.win;
                  const kda = p.deaths === 0 ? 'Perfect' : ((p.kills + p.assists) / p.deaths).toFixed(2);
                  const durationMin = Math.floor(match.gameDuration / 60);
                  const durationSec = match.gameDuration % 60;
                  const isExpanded = expandedMatches[match.matchId];

                  return (
                    <div
                      key={match.matchId}
                      className={`border rounded-2xl overflow-hidden transition ${
                        isWin
                          ? 'bg-blue-950/20 border-blue-500/30 hover:border-blue-500/50'
                          : 'bg-red-950/20 border-red-500/30 hover:border-red-500/50'
                      }`}
                    >
                      {/* 對戰概要 */}
                      <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                        
                        {/* 英雄頭像與模式 */}
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={getChampionImg(p.championName)}
                              alt={p.championName}
                              className="w-14 h-14 rounded-xl object-cover border border-slate-700"
                            />
                          </div>
                          <div>
                            <div className={`font-bold ${isWin ? 'text-blue-400' : 'text-red-400'}`}>
                              {isWin ? '勝利' : '敗北'}
                            </div>
                            <div className="text-xs text-slate-400">{match.gameMode}</div>
                            <div className="text-xs text-slate-500 font-mono">
                              {durationMin}分 {durationSec}秒
                            </div>
                          </div>
                        </div>

                        {/* KDA & 召喚師技能 */}
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="font-bold text-slate-100">
                              {p.kills} / <span className="text-red-400">{p.deaths}</span> / {p.assists}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">
                              KDA: <span className="text-cyan-400 font-bold">{kda}</span>
                            </div>
                          </div>

                          <div className="flex gap-1">
                            {p.summoner1Id > 0 && (
                              <img
                                src={getSummonerSpellImg(p.summoner1Id)}
                                alt="Spell1"
                                className="w-6 h-6 rounded border border-slate-800"
                              />
                            )}
                            {p.summoner2Id > 0 && (
                              <img
                                src={getSummonerSpellImg(p.summoner2Id)}
                                alt="Spell2"
                                className="w-6 h-6 rounded border border-slate-800"
                              />
                            )}
                          </div>
                        </div>

                        {/* 裝備列表 */}
                        <div className="grid grid-cols-4 gap-1">
                          {[p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6].map((item, idx) => (
                            <div key={idx} className="w-7 h-7 bg-slate-900 border border-slate-800 rounded overflow-hidden">
                              {getItemImg(item) && (
                                <img src={getItemImg(item)!} alt="item" className="w-full h-full object-cover" />
                              )}
                            </div>
                          ))}
                        </div>

                        {/* 展開按鈕 */}
                        <button
                          onClick={() => toggleMatch(match.matchId)}
                          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 transition"
                        >
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>

                      {/* 展開細節：同場所有玩家 */}
                      {isExpanded && (
                        <div className="border-t border-slate-800/60 p-4 bg-slate-950/40">
                          <div className="text-xs font-semibold text-slate-400 mb-2">同場玩家數據</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {match.participants.map((part, idx) => (
                              <div
                                key={idx}
                                className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                                  part.puuid === data.account.puuid
                                    ? 'bg-cyan-950/30 border-cyan-500/40'
                                    : 'bg-slate-900/50 border-slate-800/50'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <img
                                    src={getChampionImg(part.championName)}
                                    alt={part.championName}
                                    className="w-6 h-6 rounded object-cover"
                                  />
                                  <span className="truncate max-w-[100px] text-slate-200">
                                    {part.riotIdGameName || part.summonerName}
                                  </span>
                                </div>
                                <div className="font-mono text-slate-400">
                                  {part.kills}/{part.deaths}/{part.assists}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                  尚無近期對戰紀錄
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </main>
  );
}