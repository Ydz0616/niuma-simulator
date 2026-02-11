
import React, { useState, useEffect, useRef } from 'react';
// Fix: Removed Rank from imports as it doesn't exist in types.ts.
import { UserProfile, WorkOrder, BattleState, ChatMessage } from '../types';
import { MOCK_WORK_ORDERS, EMOJI_ACTIONS } from '../constants';
import { getBossResponse, evaluateBattle } from '../services/geminiService';

interface ChatRoomProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onExit: () => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ profile, setProfile, onExit }) => {
  const [battle, setBattle] = useState<BattleState>({
    isActive: false,
    workOrder: null,
    messages: [],
    turnCount: 0,
    isEvaluating: false,
    result: null
  });

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [battle.messages, isTyping]);

  const startBattle = async (order: WorkOrder) => {
    setBattle({
      isActive: true,
      workOrder: order,
      messages: [{ 
        role: 'system', 
        senderName: 'SYSTEM',
        content: `任务启动: ${order.title}\n对手: ${order.bossType}\n难度: ${order.difficulty}`, 
        timestamp: Date.now() 
      }],
      turnCount: 0,
      isEvaluating: false,
      result: null
    });

    setIsTyping(true);
    const initialBossMsg = await getBossResponse(profile, order, [], "开始对话");
    setBattle(prev => ({
      ...prev,
      messages: [...prev.messages, { 
        role: 'boss', 
        senderName: order.bossType,
        content: initialBossMsg, 
        timestamp: Date.now() 
      }]
    }));
    setIsTyping(false);
  };

  const handleAction = async (actionType: string) => {
    if (battle.turnCount >= 5 || battle.isEvaluating || isTyping) return;

    const userMsg: ChatMessage = { 
      role: 'user', 
      senderName: profile.name,
      content: `${actionType}: ${inputText || '...' }`, 
      timestamp: Date.now() 
    };
    
    setBattle(prev => ({
      ...prev,
      messages: [...prev.messages, userMsg],
      turnCount: prev.turnCount + 1
    }));
    setInputText('');

    setIsTyping(true);
    const bossResponse = await getBossResponse(profile, battle.workOrder!, battle.messages, actionType + ": " + (inputText || '默认回应'));
    setBattle(prev => ({
      ...prev,
      messages: [...prev.messages, { 
        role: 'boss', 
        senderName: battle.workOrder!.bossType,
        content: bossResponse, 
        timestamp: Date.now() 
      }]
    }));
    setIsTyping(false);

    if (battle.turnCount + 1 >= 5) {
      handleEvaluate();
    }
  };

  const handleEvaluate = async () => {
    setBattle(prev => ({ ...prev, isEvaluating: true }));
    const evaluation = await evaluateBattle(profile, battle.workOrder!, battle.messages);
    
    // Fix: Using rewardKpi instead of rewardXp as it doesn't exist on WorkOrder.
    const xpGained = Math.floor(battle.workOrder!.rewardKpi * evaluation.xpBonus);
    const goldGained = Math.floor(battle.workOrder!.rewardGold * evaluation.goldBonus);
    
    // Fix: Added kpiGained and involutionGained calculation to match BattleState interface.
    const kpiGained = evaluation.winner === 'user' ? 5 : 0;
    const involutionGained = evaluation.winner === 'boss' ? 5 : -2;

    setBattle(prev => ({
      ...prev,
      isEvaluating: false,
      result: {
        winner: evaluation.winner,
        summary: evaluation.summary,
        xpGained,
        goldGained,
        kpiGained,
        involutionGained,
        penalty: evaluation.winner === 'user' ? 1 : 10
      }
    }));

    // Update user profile
    setProfile(prev => ({
      ...prev,
      xp: prev.xp + xpGained,
      gold: prev.gold + goldGained,
      workOrdersCompleted: prev.workOrdersCompleted + 1,
      attributes: {
        ...prev.attributes,
        kpi: Math.min(prev.attributes.kpi + kpiGained, 200),
        // Fix: Changed oxLevel to involution as it's the correct property on UserAttributes.
        involution: Math.min(prev.attributes.involution + involutionGained, 100)
      }
    }));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] w-full max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-neutral-900/50 p-4 rounded-3xl border border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={onExit} className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors">
            ←
          </button>
          <div>
            <h2 className="text-lg font-black uppercase italic">疯狂工单市场</h2>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              LIVE: {Math.floor(Math.random() * 1000)} 牛马在线
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           {EMOJI_ACTIONS.map(e => (
             <button key={e.name} className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-amber-500/20 flex items-center justify-center grayscale hover:grayscale-0 transition-all text-sm">
                {e.emoji}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 overflow-hidden">
        {/* Left: Work Order List (Market) */}
        <div className="lg:col-span-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-4">Available Tasks</h3>
          {MOCK_WORK_ORDERS.map(order => (
            <button
              key={order.id}
              disabled={battle.isActive}
              onClick={() => startBattle(order)}
              className={`w-full text-left p-4 rounded-3xl border transition-all ${battle.workOrder?.id === order.id ? 'bg-amber-500 border-amber-600' : 'bg-neutral-900 border-white/5 hover:border-amber-500/50'} ${battle.isActive && battle.workOrder?.id !== order.id ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className={`text-xs font-black mb-1 ${battle.workOrder?.id === order.id ? 'text-black' : 'text-amber-500'}`}>{order.title}</div>
              <p className={`text-[10px] mb-3 line-clamp-2 ${battle.workOrder?.id === order.id ? 'text-black/70' : 'text-gray-400'}`}>{order.description}</p>
              <div className="flex justify-between items-center">
                 <span className={`text-[8px] px-2 rounded py-0.5 ${battle.workOrder?.id === order.id ? 'bg-black text-amber-500' : 'bg-neutral-800 text-gray-400'}`}>{order.difficulty}</span>
                 <span className={`text-[10px] font-bold ${battle.workOrder?.id === order.id ? 'text-black' : 'text-white'}`}>¥ {order.rewardGold}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Middle: Battle Stage */}
        <div className="lg:col-span-2 bg-neutral-900/50 rounded-3xl border border-white/5 flex flex-col overflow-hidden relative">
          {!battle.isActive ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="text-6xl mb-6 grayscale">💼</div>
              <h2 className="text-2xl font-black mb-2 italic">选择一个工单开始对决</h2>
              <p className="text-gray-500 text-sm max-w-xs">在这里，你可以尽情释放你的‘打工人’积怨，与AI老板一决高下。</p>
            </div>
          ) : (
            <>
              {/* Message Flow */}
              <div ref={scrollRef} className="flex-1 p-6 space-y-4 overflow-y-auto scroll-smooth">
                {battle.messages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : m.role === 'boss' ? 'justify-start' : 'justify-center'}`}>
                    {m.role === 'system' ? (
                      <div className="text-[10px] font-mono bg-neutral-800 text-gray-500 px-3 py-1 rounded-full uppercase">
                        {m.content}
                      </div>
                    ) : (
                      <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed shadow-lg transition-all ${m.role === 'user' ? 'bg-amber-500 text-black font-medium battle-msg-user' : 'bg-neutral-800 text-gray-200 battle-msg-boss'}`}>
                         {m.content}
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-neutral-800 text-gray-500 px-4 py-2 rounded-2xl text-xs flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce delay-75"></span>
                      <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce delay-150"></span>
                    </div>
                  </div>
                )}

                {/* Battle Result Modal */}
                {battle.result && (
                  <div className="bg-neutral-950 border border-amber-500/50 rounded-3xl p-6 my-8 animate-in zoom-in-95 duration-300">
                    <div className="text-center mb-6">
                      <div className="text-[10px] uppercase font-black text-amber-500 mb-2 tracking-widest">Battle Outcome</div>
                      <h2 className={`text-3xl font-black italic uppercase ${battle.result.winner === 'user' ? 'text-green-500' : 'text-red-500'}`}>
                        {battle.result.winner === 'user' ? 'SURVIVED' : 'PUA-ED'}
                      </h2>
                    </div>
                    <p className="text-center italic text-gray-400 text-sm mb-6 border-y border-white/5 py-4">
                      "{battle.result.summary}"
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-black/40 p-3 rounded-2xl text-center">
                        <div className="text-[10px] text-gray-500 font-bold uppercase">Reward XP</div>
                        {/* Fix: Accessing xpGained which is now part of the result type in BattleState */}
                        <div className="text-xl font-black text-white">+{battle.result.xpGained}</div>
                      </div>
                      <div className="bg-black/40 p-3 rounded-2xl text-center">
                        <div className="text-[10px] text-gray-500 font-bold uppercase">Reward Gold</div>
                        {/* Fix: Accessing goldGained which is now part of the result type in BattleState */}
                        <div className="text-xl font-black text-amber-500">¥{battle.result.goldGained}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setBattle({ isActive: false, workOrder: null, messages: [], turnCount: 0, isEvaluating: false, result: null })}
                      className="w-full mt-6 py-3 bg-amber-500 text-black font-black uppercase italic rounded-2xl hover:bg-amber-400 transition-colors"
                    >
                      回到市场
                    </button>
                  </div>
                )}
              </div>

              {/* Action Area */}
              {!battle.result && !battle.isEvaluating && (
                <div className="p-4 bg-neutral-950 border-t border-white/5">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['接受', '拒绝', '讨价还价', '摸鱼', '甩锅'].map(action => (
                      <button 
                        key={action}
                        onClick={() => handleAction(action)}
                        disabled={isTyping}
                        className="px-4 py-2 bg-neutral-800 hover:bg-amber-500 hover:text-black transition-all rounded-xl text-xs font-bold text-gray-400 disabled:opacity-50"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="输入你的职场吐槽..."
                      disabled={isTyping}
                      className="flex-1 bg-neutral-900 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                      onKeyDown={(e) => e.key === 'Enter' && handleAction('回复')}
                    />
                    <button 
                      onClick={() => handleAction('回复')}
                      disabled={isTyping || !inputText.trim()}
                      className="bg-amber-500 text-black px-6 rounded-2xl font-black uppercase text-xs hover:bg-amber-400 transition-colors disabled:opacity-50"
                    >
                      SEND
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-2 px-2">
                    <span className="text-[10px] text-gray-600 font-mono">BATTLE ROUND: {battle.turnCount}/5</span>
                    {battle.turnCount >= 4 && <span className="text-[10px] text-amber-500 animate-pulse font-bold">FINAL ROUND</span>}
                  </div>
                </div>
              )}
              
              {battle.isEvaluating && (
                <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center z-50">
                   <div className="text-center space-y-4">
                      <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <div className="text-xl font-black italic uppercase animate-pulse">职场判官正在评审...</div>
                   </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: Audience & Comments */}
        <div className="lg:col-span-1 flex flex-col gap-4 overflow-hidden">
           <section className="bg-neutral-900/50 p-4 rounded-3xl border border-white/5 flex-1 flex flex-col overflow-hidden">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Live Comments</h3>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {[
                  { user: '匿名牛马', text: '这老板真PUA啊', emoji: '😂' },
                  { user: '不卷就不舒服', text: '支持老板，建议开除！', emoji: '🧱' },
                  { user: '摸鱼达人', text: '学到了，明天就这么跟老板说', emoji: '👏' },
                  { user: 'P7老师', text: '这一招反客为主用得妙', emoji: '🔥' },
                  { user: '实习马骝', text: '只有我一个人在凌晨写代码吗', emoji: '💀' }
                ].map((c, idx) => (
                  <div key={idx} className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-neutral-800 flex-shrink-0"></div>
                    <div>
                      <div className="text-[10px] font-bold text-gray-500">{c.user}</div>
                      <div className="text-xs bg-black/40 p-2 rounded-xl mt-1 relative">
                        {c.text}
                        <span className="absolute -right-2 -bottom-2 text-lg">{c.emoji}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <input 
                   type="text" 
                   placeholder="说点什么..." 
                   className="flex-1 bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[10px] focus:outline-none"
                />
                <button className="bg-neutral-800 p-2 rounded-xl text-[10px] font-bold">发送</button>
              </div>
           </section>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
