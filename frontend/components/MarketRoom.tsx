
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, WorkOrder, AgentStatus, GlobalLog, ChatMessage } from '../types';
import MeetingRoom from './MeetingRoom';
import MatchingRoom from './MatchingRoom';
import { fetchActiveBattles, fetchBattleLogs, fetchLobbyFeed, fetchMeCard, forceIdleAgent } from '../services/apiService';

interface MarketRoomProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onExit: () => void;
}

const MarketRoom: React.FC<MarketRoomProps> = ({ profile, setProfile, onExit }) => {
  const [activeTicket, setActiveTicket] = useState<WorkOrder | null>(null);
  const [marketView, setMarketView] = useState<'idle' | 'matching' | 'battle' | 'spectating'>('idle');
  const [dramaLogs, setDramaLogs] = useState<GlobalLog[]>([]);
  const [battleSpectate, setBattleSpectate] = useState<GlobalLog[]>([]);
  const [spectatedMessages, setSpectatedMessages] = useState<ChatMessage[]>([]);
  const [spectateTarget, setSpectateTarget] = useState<{ ticketId: string; title: string } | null>(null);
  const meetingSyncMissCount = useRef(0);
  const activeTicketRef = useRef(activeTicket);
  const isMeetingSyncing = profile.status === AgentStatus.IN_MEETING && marketView === 'idle' && !activeTicket;
  const pauseLocked = profile.status === AgentStatus.IN_MEETING || profile.status === AgentStatus.COOLDOWN || marketView === 'matching' || marketView === 'battle';
  const cooldownSecs = profile.status === AgentStatus.COOLDOWN ? Math.max(0, Math.ceil((profile.cooldownUntil - Date.now()) / 1000)) : 0;

  const mapAgentStatus = (status: string): AgentStatus => {
    switch (status) {
      case 'IN_MEETING':
        return AgentStatus.IN_MEETING;
      case 'COOLDOWN':
        return AgentStatus.COOLDOWN;
      case 'PAUSED':
        return AgentStatus.PAUSED;
      default:
        return AgentStatus.IDLE;
    }
  };

  useEffect(() => {
    let mounted = true;
    let latestFeedId = 0;

    const poll = async () => {
      try {
        const userId = localStorage.getItem('ox_horse_user_id');
        const [feed, activeBattles] = await Promise.all([
          fetchLobbyFeed(latestFeedId),
          fetchActiveBattles()
        ]);
        if (!mounted) return;

        if (feed.length > 0) {
          latestFeedId = Math.max(latestFeedId, ...feed.map((item) => item.id));
          const mappedFeed = feed.map((item) => ({
            id: String(item.id),
            author: '系统播报',
            message: item.content,
            timestamp: new Date(item.created_at).getTime()
          }));
          setDramaLogs((prev) => [...mappedFeed, ...prev].slice(0, 12));
        }

        const spectatorBattles = userId
          ? activeBattles.filter((item) => item.ticket_id !== activeTicket?.id)
          : activeBattles;
        const myBattles = userId ? await fetchActiveBattles(userId) : [];
        const myTicketIds = new Set(myBattles.map((x) => x.ticket_id));

        const mappedActive = spectatorBattles
          .filter((item) => !myTicketIds.has(item.ticket_id))
          .map((item) => ({
          id: item.ticket_id,
          author: `工单直播 #${item.ticket_id.slice(0, 6)}`,
          message: item.title,
          timestamp: item.started_at ? new Date(item.started_at).getTime() : new Date(item.created_at).getTime()
        }));
        setBattleSpectate(mappedActive);
      } catch (error) {
        console.error(error);
      }
    };

    poll();
    const pollInterval = setInterval(poll, 2500);
    return () => {
      mounted = false;
      clearInterval(pollInterval);
    };
  }, []);

  // 自动派单逻辑
  useEffect(() => {
    if (profile.status === AgentStatus.PAUSED || profile.status === AgentStatus.COOLDOWN || marketView !== 'idle' || activeTicket) return;

    let mounted = true;
    const tryAssign = async () => {
      try {
        const userId = localStorage.getItem('ox_horse_user_id');
        if (!userId) return;

        const activeBattles = await fetchActiveBattles(userId);
        if (!mounted) return;
        if (activeBattles.length > 0) {
          const picked = activeBattles[Math.floor(Math.random() * activeBattles.length)];
          const mapped: WorkOrder = {
            id: picked.ticket_id,
            title: picked.title,
            description: `系统工单预算 ${picked.budget} KPI，会议室已锁定。`,
            difficulty: picked.budget >= 120 ? '困难' : picked.budget >= 80 ? '中等' : '简单',
            rewardKpi: picked.budget,
            rewardGold: Math.max(20, Math.floor(picked.budget / 2)),
            bossType: 'HRBP'
          };
          setActiveTicket(mapped);
          setMarketView('matching');
        }
      } catch (error) {
        console.error(error);
      }
    };

    tryAssign();
    const dispatchInterval = setInterval(tryAssign, 2000);
    return () => {
      mounted = false;
      clearInterval(dispatchInterval);
    };
  }, [profile.status, marketView, activeTicket]);

  // Keep activeTicketRef in sync
  useEffect(() => {
    activeTicketRef.current = activeTicket;
  }, [activeTicket]);

  useEffect(() => {
    let mounted = true;
    const userId = localStorage.getItem('ox_horse_user_id');
    if (!userId) return;

    const syncMe = async () => {
      try {
        const card = await fetchMeCard(userId);
        if (!mounted) return;
        setProfile((prev) => ({
          ...prev,
          level: card.level,
          status: mapAgentStatus(card.status),
          cooldownUntil: card.cooldown_until ? new Date(card.cooldown_until).getTime() : 0,
          attributes: {
            ...prev.attributes,
            kpi: card.kpi_score,
            involution: card.involution,
            resistance: card.resistance,
            slacking: card.slacking
          }
        }));

        // Safety valve: if IN_MEETING but no activeTicket for too long, force reset
        if (card.status === 'IN_MEETING' && !activeTicketRef.current) {
          meetingSyncMissCount.current += 1;
          if (meetingSyncMissCount.current >= 5) {
            console.warn('[MarketRoom] IN_MEETING stuck for 5+ cycles, calling force-idle');
            try {
              await forceIdleAgent(userId);
            } catch (e) {
              console.error('[MarketRoom] force-idle failed:', e);
            }
            meetingSyncMissCount.current = 0;
          }
        } else {
          meetingSyncMissCount.current = 0;
        }
      } catch (error) {
        console.error(error);
      }
    };

    syncMe();
    const interval = setInterval(syncMe, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [setProfile]);

  useEffect(() => {
    if (marketView !== 'spectating' || !spectateTarget) return;

    let mounted = true;
    let afterId = 0;
    const speakerSides = new Map<string, 'agent_a' | 'agent_b'>();

    const mapLogToMessage = (log: {
      id: number;
      speaker_type: string;
      speaker_name: string;
      content: string;
      created_at: string;
    }): ChatMessage => {
      if (log.speaker_type === 'HR') {
        return {
          role: 'boss',
          senderName: log.speaker_name,
          content: log.content,
          timestamp: new Date(log.created_at).getTime()
        };
      }
      if (log.speaker_type === 'SYSTEM') {
        return {
          role: 'system',
          senderName: log.speaker_name,
          content: log.content,
          timestamp: new Date(log.created_at).getTime()
        };
      }

      const existing = speakerSides.get(log.speaker_name);
      if (existing) {
        return {
          role: existing,
          senderName: log.speaker_name,
          content: log.content,
          timestamp: new Date(log.created_at).getTime()
        };
      }

      const role = speakerSides.size === 0 ? 'agent_a' : 'agent_b';
      speakerSides.set(log.speaker_name, role);
      return {
        role,
        senderName: log.speaker_name,
        content: log.content,
        timestamp: new Date(log.created_at).getTime()
      };
    };

    const pollLogs = async () => {
      try {
        const logs = await fetchBattleLogs(spectateTarget.ticketId, afterId);
        if (!mounted || logs.length === 0) return;

        afterId = Math.max(afterId, ...logs.map((l) => l.id));
        const mapped = logs.map(mapLogToMessage);
        setSpectatedMessages((prev) => [...prev, ...mapped].slice(-80));
      } catch (error) {
        console.error(error);
      }
    };

    pollLogs();
    const interval = setInterval(pollLogs, 2000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [marketView, spectateTarget]);

  const handleStartBattle = () => {
    setMarketView('battle');
  };

  const handleTogglePause = async () => {
    if (pauseLocked) {
      alert('当前正在对战流程中，无法切换状态');
      return;
    }

    const userId = localStorage.getItem('ox_horse_user_id');
    if (!userId) {
      alert('未找到用户登录态，请重新登录');
      return;
    }

    const nextPaused = profile.status !== AgentStatus.PAUSED;
    const endpoint = nextPaused ? '/api/me/agent/pause' : '/api/me/agent/resume';
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    try {
      const resp = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      if (!resp.ok) {
        if (resp.status === 409) {
          alert('状态冲突：当前正在会议中，暂不可切换');
          return;
        }
        throw new Error(`toggle pause failed: ${resp.status}`);
      }

      setProfile(prev => ({
        ...prev,
        status: nextPaused ? AgentStatus.PAUSED : AgentStatus.IDLE
      }));
      if (nextPaused) {
        setActiveTicket(null);
        setMarketView('idle');
        setSpectatedMessages([]);
      }
    } catch (error) {
      console.error(error);
      alert('状态更新失败，请稍后重试');
    }
  };

  const startSpectating = (log: GlobalLog) => {
    if (profile.status !== AgentStatus.PAUSED) return;
    setSpectateTarget({ ticketId: log.id, title: log.message });
    setSpectatedMessages([]);
    setMarketView('spectating');
  };

  return (
    <div className="w-full max-w-7xl h-[85vh] flex flex-col bg-neutral-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-md">
      
      {/* 顶部状态栏 */}
      <div className="h-16 px-8 border-b border-white/5 flex justify-between items-center bg-black/40">
        <button 
          onClick={onExit}
          className="flex items-center gap-2 text-xs font-black uppercase text-gray-500 hover:text-amber-500 transition-colors"
        >
          <span className="text-lg">←</span> 返回职场大厅
        </button>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 pr-6 border-r border-white/5">
             <div className="w-8 h-8 rounded-full border border-amber-500 overflow-hidden bg-black">
                <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${profile.name}`} alt="avatar" />
             </div>
             <div className="text-right">
                <div className="text-[10px] font-black text-white leading-none">P{profile.level} {profile.name}</div>
                <div className="text-[8px] text-amber-500/80 font-mono mt-0.5 tracking-tighter uppercase">{profile.status}</div>
             </div>
          </div>

          <div className="flex gap-4">
            <MiniStat label="KPI" value={profile.attributes.kpi} color="text-green-500" />
            <div className="flex flex-col justify-center">
               <div className="text-[8px] text-gray-500 font-black uppercase mb-0.5">内卷压力</div>
               <div className="w-20 h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-red-500 shadow-[0_0_8px_#ef4444]" style={{ width: `${profile.attributes.involution}%` }}></div>
               </div>
            </div>
            <MiniStat label="抗性" value={profile.attributes.resistance} />
            <MiniStat label="摸鱼" value={profile.attributes.slacking} />
          </div>

          <button 
            onClick={handleTogglePause}
            disabled={pauseLocked}
            className={`ml-4 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
              pauseLocked
                ? 'bg-neutral-900 text-gray-600 cursor-not-allowed'
                : profile.status === AgentStatus.PAUSED
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-neutral-800 text-gray-400 hover:bg-neutral-700'
            }`}
          >
            {profile.status === AgentStatus.COOLDOWN ? `强制停机 ${cooldownSecs}s` : pauseLocked ? '对战中锁定' : profile.status === AgentStatus.PAUSED ? '结束偷懒，回位工作' : '进厕所偷懒'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* 左侧栏：动态与情报 */}
        <div className="w-80 border-r border-white/5 bg-black/20 flex flex-col">
          <div className="p-6 border-b border-white/5">
             <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">
               {profile.status === AgentStatus.PAUSED ? "✨ 偷懒模式已开启" : "💼 任务处理器"}
             </h3>
             {profile.status === AgentStatus.PAUSED ? (
               <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl animate-pulse">
                  <div className="text-xs font-black text-amber-500">正在观摩别人吵架...</div>
                  <div className="text-[9px] text-gray-400 mt-1">点击下方大厅条目即可进入围观</div>
               </div>
             ) : profile.status === AgentStatus.COOLDOWN ? (
               <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                  <div className="text-xs font-black text-red-400">强制停机中...</div>
                  <div className="text-[9px] text-gray-400 mt-1">内卷值过高，系统冷却剩余 {cooldownSecs}s</div>
               </div>
             ) : isMeetingSyncing ? (
               <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                  <div className="text-xs font-black text-blue-400">会议同步中...</div>
                  <div className="text-[9px] text-gray-400 mt-1 italic tracking-tighter text-center">状态已在开会，正在拉取你的工单会话</div>
               </div>
             ) : activeTicket ? (
               <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                  <div className="text-xs font-black text-amber-500">{activeTicket.title}</div>
                  <div className="text-[9px] text-gray-400 mt-1 uppercase italic tracking-tighter">派单中: {marketView}</div>
               </div>
             ) : (
               <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
                  <div className="text-xs font-black text-green-500">待命中...</div>
                  <div className="text-[9px] text-gray-400 mt-1 italic tracking-tighter text-center">老板正在为您精心挑选工单</div>
               </div>
             )}
          </div>

          <div className="flex-1 p-6 overflow-hidden flex flex-col">
             <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex justify-between items-center">
                <span>实时观战大厅</span>
                {profile.status !== AgentStatus.PAUSED && <span className="text-[8px] text-red-500 font-normal">仅偷懒模式可围观</span>}
             </h3>
             <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                {battleSpectate.map(log => (
                  <div 
                    key={log.id} 
                    onClick={() => startSpectating(log)}
                    className={`text-[10px] p-3 rounded-xl border transition-all ${
                      profile.status === AgentStatus.PAUSED 
                      ? 'bg-white/5 border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5 cursor-pointer' 
                      : 'bg-black/20 border-white/5 opacity-50 cursor-not-allowed'
                    }`}
                  >
                     <div className="font-black text-gray-200">{log.author}</div>
                     <div className="text-gray-500 mt-1 leading-relaxed italic">“{log.message}”</div>
                  </div>
                ))}
                {battleSpectate.length === 0 && (
                  <div className="text-[10px] text-gray-600">当前无开战工单，导演正在拉会...</div>
                )}
             </div>
          </div>

          <div className="h-48 p-6 bg-black/40 border-t border-white/5 flex flex-col">
             <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">摸鱼内幕吐槽</h3>
             <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                {dramaLogs.map(log => (
                  <div key={log.id} className="text-[9px] text-gray-500">
                    <span className="text-amber-500/50">[{log.author}]</span>: {log.message}
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* 右侧区域：主交互 */}
        <div className="flex-1 relative bg-black/10 overflow-hidden">
          {marketView === 'spectating' && spectateTarget ? (
            <div className="h-full flex flex-col animate-in fade-in duration-500 bg-black/40">
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                <div>
                   <div className="text-xs font-black text-amber-500 uppercase tracking-tighter">观战模式正在运行</div>
                   <div className="text-[10px] text-gray-500 font-mono mt-1">围观话题: {spectateTarget.title}</div>
                </div>
                <button 
                  onClick={() => setMarketView('idle')} 
                  className="px-4 py-2 bg-neutral-800 text-xs font-black uppercase rounded-lg hover:bg-red-500/20 hover:text-red-500 transition-all"
                >
                  退出围观
                </button>
              </div>
              <div className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar font-mono text-sm">
                 {spectatedMessages.map((m, idx) => (
                   <div key={idx} className={`max-w-[80%] space-y-1 ${m.role === 'agent_a' ? 'ml-auto text-right' : ''}`}>
                      <div className={`text-[10px] font-black uppercase ${m.role === 'agent_a' ? 'text-amber-500' : 'text-blue-500'}`}>
                         {m.senderName}
                      </div>
                      <div className={`p-4 rounded-2xl border ${m.role === 'agent_a' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-blue-500/5 border-blue-500/20'} text-gray-300 italic`}>
                        {m.content}
                      </div>
                   </div>
                 ))}
                 {spectatedMessages.length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4">
                      <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                      <div className="text-[10px] uppercase font-black">正在解析数据流...</div>
                   </div>
                 )}
              </div>
              <div className="p-4 bg-amber-500/5 border-t border-amber-500/10 text-center">
                 <span className="text-[9px] text-amber-500/50 font-black uppercase tracking-[0.2em] animate-pulse">
                   --- 本对战由系统自动匹配，您正在以隐身模式进行围观 ---
                 </span>
              </div>
            </div>
          ) : profile.status === AgentStatus.PAUSED ? (
            <div className="h-full flex flex-col items-center justify-center p-10 animate-in fade-in duration-500 text-center">
              <div className="text-8xl mb-8 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">🚽</div>
              <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter mb-4">正在厕所带薪偷懒</h2>
              <p className="text-gray-500 text-sm max-w-sm mb-8 leading-relaxed">
                这是牛马神圣不可侵犯的休息时刻。现在您可以点击左侧“实时观战大厅”看别人对线，学习更高级的职场黑话。
              </p>
              <div className="flex gap-4">
                <div className="px-4 py-2 bg-neutral-900 border border-white/5 rounded-xl text-[10px] text-amber-500 font-black animate-pulse">
                  自动派单: 已挂起
                </div>
                <div className="px-4 py-2 bg-neutral-900 border border-white/5 rounded-xl text-[10px] text-blue-500 font-black">
                  观战模式: 可用
                </div>
              </div>
            </div>
          ) : profile.status === AgentStatus.COOLDOWN && profile.cooldownUntil <= 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-10 animate-in fade-in duration-500 text-center">
              <div className="text-8xl mb-8 filter drop-shadow-[0_0_20px_rgba(251,191,36,0.3)]">🏆</div>
              <h2 className="text-3xl font-black italic text-amber-500 uppercase tracking-tighter mb-4">战报出炉！</h2>
              <p className="text-gray-400 text-sm max-w-sm mb-8 leading-relaxed">
                本轮会议已结算，你的 KPI 和属性已更新。<br/>准备好了就重新加入战场吧！
              </p>
              <button
                onClick={async () => {
                  const userId = localStorage.getItem('ox_horse_user_id');
                  if (!userId) return;
                  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
                  try {
                    await fetch(`${apiBase}/api/me/agent/resume`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ user_id: userId })
                    });
                    setProfile(prev => ({ ...prev, status: AgentStatus.IDLE }));
                    setActiveTicket(null);
                    setMarketView('idle');
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-sm font-black uppercase rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 transition-all duration-200"
              >
                ⚔️ 重新加入战场
              </button>
            </div>
          ) : profile.status === AgentStatus.COOLDOWN ? (
            <div className="h-full flex flex-col items-center justify-center p-10 animate-in fade-in duration-500 text-center">
              <div className="text-8xl mb-8 filter drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">🥵</div>
              <h2 className="text-3xl font-black italic text-red-400 uppercase tracking-tighter mb-4">内卷值爆表，强制停机</h2>
              <p className="text-gray-500 text-sm max-w-sm mb-8 leading-relaxed">
                你当前压力值过高，系统已强制休息。冷却结束后将自动恢复待命。
              </p>
              <div className="px-4 py-2 bg-neutral-900 border border-red-500/30 rounded-xl text-[10px] text-red-400 font-black">
                冷却倒计时: {cooldownSecs}s
              </div>
            </div>
          ) : marketView === 'idle' && profile.status === AgentStatus.IDLE ? (
            <div className="h-full flex flex-col items-center justify-center p-10 animate-in fade-in duration-500 text-center">
               <div className="w-20 h-20 mb-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(251,191,36,0.2)]"></div>
               <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter mb-2">老板正在派单...</h2>
               <p className="text-gray-500 text-sm">正在根据您的核心能力匹配最具“性价比”的任务。</p>
            </div>
          ) : marketView === 'idle' && profile.status === AgentStatus.IN_MEETING ? (
            <div className="h-full flex flex-col items-center justify-center p-10 animate-in fade-in duration-500 text-center">
               <div className="w-20 h-20 mb-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(59,130,246,0.2)]"></div>
               <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter mb-2">会议同步中...</h2>
               <p className="text-gray-500 text-sm">已检测到你在会议里，正在同步会议上下文。</p>
            </div>
          ) : marketView === 'matching' ? (
            <div className="h-full flex items-center justify-center p-10">
               <MatchingRoom onComplete={handleStartBattle} />
            </div>
          ) : marketView === 'battle' && activeTicket ? (
            <div className="h-full animate-in zoom-in-95 duration-500">
               <MeetingRoom 
                 profile={profile} 
                 setProfile={setProfile} 
                 workOrder={activeTicket} 
                 onExit={async () => {
                   const userId = localStorage.getItem('ox_horse_user_id');
                   if (userId) {
                     try {
                       const card = await fetchMeCard(userId);
                       setProfile((prev) => ({
                         ...prev,
                         level: card.level,
                         status: mapAgentStatus(card.status),
                         cooldownUntil: card.cooldown_until ? new Date(card.cooldown_until).getTime() : 0,
                         attributes: {
                           ...prev.attributes,
                           kpi: card.kpi_score,
                           involution: card.involution,
                           resistance: card.resistance,
                           slacking: card.slacking
                         }
                       }));
                     } catch (e) {
                       console.error(e);
                     }
                   }
                   setActiveTicket(null);
                   setMarketView('idle');
                 }} 
               />
            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
};

const MiniStat = ({ label, value, color = "text-white" }: { label: string, value: any, color?: string }) => (
  <div className="text-center flex flex-col justify-center">
    <div className="text-[8px] text-gray-500 font-black uppercase leading-none mb-1">{label}</div>
    <div className={`text-xs font-black ${color} leading-none`}>{value}</div>
  </div>
);

export default MarketRoom;
