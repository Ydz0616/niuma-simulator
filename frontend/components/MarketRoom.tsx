
import React, { useState, useEffect } from 'react';
import { UserProfile, WorkOrder, AgentStatus, GlobalLog, ChatMessage } from '../types';
import { MOCK_WORK_ORDERS, BATTLE_PHRASES } from '../constants';
import MeetingRoom from './MeetingRoom';
import MatchingRoom from './MatchingRoom';

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
  const [spectateTarget, setSpectateTarget] = useState<{a: string, b: string, topic: string} | null>(null);

  useEffect(() => {
    // 模拟摸鱼吐槽
    const gossip = [
      { author: "摸鱼大师", msg: "刚才那个 PPT 颗粒度没对齐，老板炸了" },
      { author: "带薪如厕侠", msg: "已经蹲了半小时了，还没刷到好的工单" },
      { author: "卷王小李", msg: "凌晨两点对齐了一下，感觉这波稳了" },
      { author: "老板秘书", msg: "告诉大家一个好消息，今年全员...自愿加班" },
    ];
    // 优化后的观战动态：具体的 vs 格式和职场问题
    const spectateCases = [
      { a: "卷王小李", b: "PPT大神_老李", topic: "关于周报颗粒度是否需要精确到秒的拉锯战" },
      { a: "00后整顿侠", b: "老油条张姐", topic: "周五下午5点半临时增加的‘紧急对齐’拒绝权争端" },
      { a: "逻辑怪小陈", b: "甩锅专家王哥", topic: "到底谁该为昨晚服务器凌晨2点的崩溃买单？" },
      { a: "格子衫码农", b: "产品经理阿强", topic: "这是一个‘哪怕五彩斑斓的黑也能实现’的逻辑悖论对线" },
      { a: "深夜咖啡机", b: "行政部小刘", topic: "下午茶拼单满减优惠券归属权的底层逻辑重构" },
    ];

    const dramaInterval = setInterval(() => {
      const item = gossip[Math.floor(Math.random() * gossip.length)];
      setDramaLogs(prev => [{ id: Math.random().toString(), author: item.author, message: item.msg, timestamp: Date.now() }, ...prev.slice(0, 10)]);
    }, 5000);

    const spectateInterval = setInterval(() => {
      const item = spectateCases[Math.floor(Math.random() * spectateCases.length)];
      setBattleSpectate(prev => [
        { 
          id: Math.random().toString(), 
          author: `${item.a} vs ${item.b}`, 
          message: item.topic, 
          timestamp: Date.now() 
        }, 
        ...prev.slice(0, 8)
      ]);
    }, 7000);

    return () => {
      clearInterval(dramaInterval);
      clearInterval(spectateInterval);
    };
  }, []);

  // 自动派单逻辑
  useEffect(() => {
    if (profile.status === AgentStatus.IDLE && marketView === 'idle' && !activeTicket) {
      const dispatchTimer = setTimeout(() => {
        const order = MOCK_WORK_ORDERS[Math.floor(Math.random() * MOCK_WORK_ORDERS.length)];
        setActiveTicket(order);
        setMarketView('matching');
      }, 3000);
      return () => clearTimeout(dispatchTimer);
    }
  }, [profile.status, marketView, activeTicket]);

  // 模拟观战流逻辑
  useEffect(() => {
    if (marketView === 'spectating' && spectateTarget) {
      const interval = setInterval(() => {
        const isA = Math.random() > 0.5;
        const msg: ChatMessage = {
          role: isA ? 'agent_a' : 'agent_b',
          senderName: isA ? spectateTarget.a : spectateTarget.b,
          content: BATTLE_PHRASES[Math.floor(Math.random() * BATTLE_PHRASES.length)],
          timestamp: Date.now()
        };
        setSpectatedMessages(prev => [...prev, msg].slice(-8));
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [marketView, spectateTarget]);

  const handleStartBattle = () => {
    setMarketView('battle');
  };

  const handleTogglePause = async () => {
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
    const [a, b] = log.author?.split(' vs ') || ["未知牛马", "神秘对手"];
    setSpectateTarget({ a, b, topic: log.message });
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
            className={`ml-4 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
              profile.status === AgentStatus.PAUSED ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-neutral-800 text-gray-400 hover:bg-neutral-700'
            }`}
          >
            {profile.status === AgentStatus.PAUSED ? '结束偷懒，回位工作' : '进厕所偷懒'}
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
                {profile.status !== AgentStatus.PAUSED && <span className="text-[8px] text-red-500 font-normal">工作中禁止围观</span>}
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
                   <div className="text-[10px] text-gray-500 font-mono mt-1">围观话题: {spectateTarget.topic}</div>
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
          ) : marketView === 'idle' ? (
            <div className="h-full flex flex-col items-center justify-center p-10 animate-in fade-in duration-500 text-center">
               <div className="w-20 h-20 mb-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(251,191,36,0.2)]"></div>
               <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter mb-2">老板正在派单...</h2>
               <p className="text-gray-500 text-sm">正在根据您的核心能力匹配最具“性价比”的任务。</p>
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
                 onExit={() => {
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
