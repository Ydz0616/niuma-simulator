
import React, { useState, useEffect } from 'react';
import { UserProfile, AgentStatus, GlobalLog } from '../types';
import Badge from './Badge';
import { fetchLeaderboard, fetchLobbyFeed, LeaderboardItemApi } from '../services/apiService';
import { getLevelTitle } from '../utils/levelTitles';

interface HallProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onStartAgent: () => void;
}

const Hall: React.FC<HallProps> = ({ profile, setProfile, onStartAgent }) => {
  const [logs, setLogs] = useState<GlobalLog[]>([]);
  const [board, setBoard] = useState<LeaderboardItemApi[]>([]);

  useEffect(() => {
    let mounted = true;
    let latestId = 0;

    const poll = async () => {
      try {
        const feed = await fetchLobbyFeed(latestId);
        if (!mounted) return;

        if (feed.length > 0) {
          latestId = Math.max(...feed.map(x => x.id), latestId);
          const mapped = feed.map(item => ({
            id: String(item.id),
            message: item.content,
            timestamp: new Date(item.created_at).getTime(),
            type: 'drama' as const
          }));
          setLogs(prev => [...mapped, ...prev].slice(0, 30));
        }
      } catch (error) {
        console.error(error);
      }
    };

    poll();
    const interval = setInterval(poll, 2500);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const pollBoard = async () => {
      try {
        const list = await fetchLeaderboard();
        if (mounted) setBoard(list);
      } catch (error) {
        console.error(error);
      }
    };
    pollBoard();
    const interval = setInterval(pollBoard, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const isCooldown = profile.status === AgentStatus.COOLDOWN && Date.now() < profile.cooldownUntil;
  const cooldownSecs = isCooldown ? Math.ceil((profile.cooldownUntil - Date.now()) / 1000) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 w-full max-w-7xl">
      <div className="lg:col-span-4 flex flex-col items-center gap-6">
        <Badge profile={profile} setProfile={setProfile} isEditable={true} />
        
        <button 
          onClick={onStartAgent}
          disabled={isCooldown}
          className={`w-full max-w-sm py-5 rounded-2xl font-black uppercase italic transition-all shadow-xl text-lg ${
            isCooldown ? 'bg-neutral-800 text-gray-500' : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20 active:scale-95'
          }`}
        >
          {isCooldown ? `核心正在停机 (${cooldownSecs}S)` : '进入疯狂工单市场'}
        </button>
      </div>

      <div className="lg:col-span-5 flex flex-col gap-6">
        <section className="bg-black/40 border border-white/5 h-[400px] rounded-3xl flex flex-col overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-white/5 bg-neutral-900/50 flex justify-between items-center">
            <span className="text-xs font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              职场实时动态 (DRAMA)
            </span>
            <span className="text-[10px] font-mono text-gray-500 uppercase">Node Stream</span>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-sm custom-scrollbar">
            {logs.map(log => (
              <div key={log.id} className="flex gap-3 animate-in slide-in-from-left-2 duration-300">
                <span className="text-gray-600">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span className="text-gray-300"> <span className="text-amber-500">❯</span> {log.message}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-4">
           <StatusBox label="当前薪资" value={`¥ ${profile.gold}k`} sub="月度总包" color="text-amber-500" />
           <StatusBox label="KPI 总值" value={`${profile.attributes.kpi}`} sub={`P${profile.level} 阶层`} color="text-blue-500" />
        </div>
      </div>

      <div className="lg:col-span-3">
        <section className="bg-neutral-900/80 border border-white/5 p-6 rounded-3xl shadow-xl h-full flex flex-col">
          <div className="flex justify-between items-end mb-6 border-b border-white/5 pb-4">
             <div>
               <h3 className="text-base font-black text-white uppercase tracking-widest flex items-center gap-4">
                  🏆 牛马光荣榜
               </h3>
               <div className="text-xs font-black text-white/30 uppercase tracking-widest mt-1">
                  Rank: <span className="text-white">#{profile.rank > 999 ? '999+' : profile.rank}</span>
               </div>
             </div>
             <div className="text-[10px] text-amber-500 font-black uppercase tracking-widest">
                KPI SCORE ↴
             </div>
          </div>

          <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
            {board.slice(0, 8).map((item, idx) => {
              const isMe = item.nickname === profile.name;
              return (
                <div key={idx} className={`flex items-center gap-4 group ${isMe ? 'bg-white/5 p-2 rounded-lg -mx-2' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-amber-500 text-black' : isMe ? 'bg-amber-500/20 text-amber-500' : 'bg-neutral-800 text-gray-500'}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm font-black group-hover:text-amber-500 ${isMe ? 'text-amber-500' : 'text-gray-200'}`}>
                      {item.nickname} {isMe && <span className="text-white/30 ml-1">(我)</span>}
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold">{getLevelTitle(item.level)}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-black ${isMe ? 'text-amber-500' : 'text-amber-500'}`}>{item.kpi_score}</div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Sticky footer for my rank if not in top 8 */}
          {board.length > 0 && !board.slice(0, 8).find(i => i.nickname === profile.name) && (
            <div className="mt-auto">
               <div className="flex justify-center text-white/10 text-xl font-black leading-none mb-2 pb-2">. . .</div>
               <div className="pt-4 border-t border-white/10">
                <div className="flex items-center gap-4 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs bg-amber-500 text-black">
                    {profile.rank <= 10 ? profile.rank : '?'}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-black text-amber-500">
                      {profile.rank <= 10 ? '我的排名' : '还需努力'} <span className="text-amber-500/50 ml-1">(我)</span>
                    </div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold">{getLevelTitle(profile.level)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-amber-500">{profile.attributes.kpi}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const StatusBox = ({ label, value, sub, color }: { label: string, value: string, sub: string, color: string }) => (
  <div className="bg-neutral-900/50 border border-white/5 p-4 rounded-2xl">
    <div className="text-[10px] text-gray-600 font-black uppercase mb-1">{label}</div>
    <div className={`text-2xl font-black ${color}`}>{value}</div>
    <div className="text-[10px] text-gray-700 mt-1 uppercase">{sub}</div>
  </div>
);

export default Hall;
