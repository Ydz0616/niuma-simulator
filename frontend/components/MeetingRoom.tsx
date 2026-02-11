
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, WorkOrder, BattleState, ChatMessage, AgentStatus } from '../types';
import { BATTLE_PHRASES, BOSS_JUDGMENTS } from '../constants';

interface MeetingRoomProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  workOrder: WorkOrder;
  onExit: () => void;
}

const MeetingRoom: React.FC<MeetingRoomProps> = ({ profile, setProfile, workOrder, onExit }) => {
  // 生成更丰富的随机竞争对手
  const [competitor] = useState(() => {
    const names = ["卷王_阿强", "PPT大神_老李", "逻辑怪_小陈", "甩锅专家_张姐", "00后_整顿侠", "深夜咖啡机", "格子衫_码农", "架构师_阿牛", "汇报天才_小周"];
    const name = names[Math.floor(Math.random() * names.length)];
    const seed = Math.random().toString(36).substring(7);
    return { name, seed };
  });

  const [battle, setBattle] = useState<BattleState>({
    isActive: true,
    workOrder,
    messages: [],
    turnCount: 0,
    isEvaluating: false,
    result: null
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [battle.messages, isProcessing]);

  useEffect(() => {
    if (!battle.isActive || battle.result || isProcessing) return;

    const runTurn = async () => {
      setIsProcessing(true);
      await new Promise(r => setTimeout(r, 1200));

      if (battle.messages.length === 0) {
        setBattle(prev => ({
          ...prev,
          messages: [{ role: 'system', senderName: '系统', content: `会议已锁定: ${workOrder.title}`, timestamp: Date.now() }]
        }));
        await new Promise(r => setTimeout(r, 600));
        setBattle(prev => ({
          ...prev,
          messages: [...prev.messages, { role: 'boss', senderName: workOrder.bossType, content: `针对“${workOrder.title}”，你们两个谁先汇报一下目前的进度和逻辑闭环？`, timestamp: Date.now() }]
        }));
      } else if (battle.turnCount < 10) {
        const isUserTurn = battle.turnCount % 2 === 0;
        const senderName = isUserTurn ? profile.name : competitor.name;
        
        const phrase = BATTLE_PHRASES[Math.floor(Math.random() * BATTLE_PHRASES.length)];
        const content = isUserTurn 
          ? `基于我注入的生存逻辑，我认为${phrase}` 
          : `哼，我的认知深度和你不在一个维度，${phrase}`;

        setBattle(prev => ({
          ...prev,
          turnCount: prev.turnCount + 1,
          messages: [...prev.messages, { 
            role: isUserTurn ? 'agent_a' : 'agent_b', 
            senderName: senderName, 
            content: content, 
            timestamp: Date.now() 
          }]
        }));
      } else {
        setBattle(prev => ({ ...prev, isEvaluating: true }));
        await new Promise(r => setTimeout(r, 2000));
        
        const win = Math.random() > 0.4;
        const bossText = BOSS_JUDGMENTS[Math.floor(Math.random() * BOSS_JUDGMENTS.length)];
        finalizeBattle(win, bossText);
      }
      setIsProcessing(false);
    };

    runTurn();
  }, [battle.turnCount, battle.messages.length]);

  const finalizeBattle = (win: boolean, summary: string) => {
    const kpi = Math.floor(workOrder.rewardKpi * (win ? 1 : 0.3));
    const invGained = Math.floor(20 + Math.random() * 20);

    setBattle(prev => ({
      ...prev,
      isActive: false,
      isEvaluating: false,
      result: {
        winner: win ? profile.name : competitor.name,
        summary,
        kpiGained: kpi,
        involutionGained: invGained
      }
    }));

    setProfile(prev => {
      const newInv = prev.attributes.involution + invGained;
      const isBurnedOut = newInv >= 100;
      return {
        ...prev,
        status: isBurnedOut ? AgentStatus.COOLDOWN : AgentStatus.IDLE,
        cooldownUntil: isBurnedOut ? Date.now() + 60000 : 0,
        attributes: {
          ...prev.attributes,
          kpi: prev.attributes.kpi + kpi,
          involution: Math.min(newInv, 100)
        }
      };
    });
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950/20 relative">
      <div className="p-4 bg-black/40 border-b border-white/5 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <div className="flex -space-x-3">
            <div className="w-10 h-10 rounded-full border border-amber-500 bg-black flex items-center justify-center text-xs overflow-hidden">
               <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${profile.name}`} alt="user" />
            </div>
            <div className="w-10 h-10 rounded-full border border-blue-500 bg-black flex items-center justify-center text-xs overflow-hidden">
               <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${competitor.seed}`} alt="competitor" />
            </div>
          </div>
          <div>
            <div className="text-[11px] font-black text-white uppercase italic tracking-widest">{profile.name} vs {competitor.name}</div>
            <div className="text-[9px] text-gray-600 font-mono uppercase tracking-tighter">电子逗蛐蛐中...</div>
          </div>
        </div>
        <div className="flex gap-4">
           <HudStat label="当前回合" value={`${battle.turnCount}/10`} />
           <HudStat label="对线逻辑" value="Agent-to-Agent" />
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar font-mono text-sm">
        {battle.messages.map((m, idx) => (
          <div key={idx} className={`animate-in fade-in slide-in-from-bottom-2 duration-500 ${m.role === 'system' ? 'text-center' : ''}`}>
             {m.role === 'system' ? (
               <span className="text-[9px] bg-white/5 text-gray-500 px-4 py-1 rounded-full border border-white/5 uppercase tracking-widest">{m.content}</span>
             ) : (
               <div className={`max-w-[85%] space-y-1 ${m.role === 'agent_a' ? 'ml-auto text-right' : ''}`}>
                 <div className={`text-[10px] font-black uppercase tracking-widest ${m.role === 'agent_a' ? 'text-amber-500' : m.role === 'boss' ? 'text-red-500' : 'text-blue-500'}`}>
                   {m.role === 'agent_a' ? '' : '❯'} {m.senderName} {m.role === 'agent_a' ? '❮' : ''}
                 </div>
                 <div className={`p-4 rounded-2xl border leading-relaxed shadow-lg ${
                    m.role === 'agent_a' 
                      ? 'bg-amber-500/5 border-amber-500/20 text-amber-100 rounded-tr-none' 
                      : m.role === 'boss'
                        ? 'bg-red-500/10 border-red-500/30 text-red-100 mx-auto text-center font-bold italic'
                        : 'bg-blue-500/5 border-blue-500/20 text-blue-100 rounded-tl-none'
                  }`}>
                   {m.content}
                 </div>
               </div>
             )}
          </div>
        ))}
        
        {isProcessing && !battle.isEvaluating && (
          <div className="text-amber-500 animate-pulse font-black uppercase text-[10px] flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
            正在解析对手逻辑闭环...
          </div>
        )}

        {battle.result && (
          <div className="bg-neutral-900 border border-amber-500/30 p-10 rounded-3xl animate-in zoom-in-95 duration-500 shadow-2xl relative overflow-hidden mt-10">
            <h2 className={`text-4xl font-black italic uppercase text-center mb-4 ${battle.result.winner === profile.name ? 'text-green-500' : 'text-red-500'}`}>
              {battle.result.winner === profile.name ? '逻辑碾压' : '惨遭毒打'}
            </h2>
            <p className="text-center text-gray-400 italic mb-8 border-y border-white/5 py-4 max-w-lg mx-auto">
              "{battle.result.summary}"
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-10">
               <div className="bg-black/50 p-4 rounded-2xl border border-white/5 text-center">
                 <div className="text-[9px] text-gray-500 uppercase font-black mb-1">获得 KPI</div>
                 <div className="text-2xl font-black text-green-500">+{battle.result.kpiGained}</div>
               </div>
               <div className="bg-black/50 p-4 rounded-2xl border border-white/5 text-center">
                 <div className="text-[9px] text-gray-500 uppercase font-black">压力上升</div>
                 <div className="text-2xl font-black text-red-500">+{battle.result.involutionGained}%</div>
               </div>
            </div>

            <button 
              onClick={onExit}
              className="w-full py-5 bg-amber-500 text-black font-black uppercase italic rounded-2xl hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 active:scale-95 text-lg"
            >
              结算并继续待命
            </button>
          </div>
        )}
      </div>

      {battle.isEvaluating && (
         <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50">
           <div className="text-center">
             <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-[0_0_15px_#fbbf24]"></div>
             <div className="text-2xl font-black italic uppercase tracking-widest text-white animate-pulse">老板正在核实汇报数据...</div>
           </div>
         </div>
      )}
    </div>
  );
};

const HudStat = ({ label, value }: { label: string, value: string }) => (
  <div className="text-right">
    <div className="text-[9px] text-gray-600 uppercase font-black mb-0.5">{label}</div>
    <div className="text-[11px] text-amber-500 font-mono font-bold tracking-tighter">{value}</div>
  </div>
);

export default MeetingRoom;
