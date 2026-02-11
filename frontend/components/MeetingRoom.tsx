import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AgentStatus, ChatMessage, UserProfile, WorkOrder } from '../types';
import { fetchBattleDetail, fetchBattleLogs } from '../services/apiService';

interface MeetingRoomProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  workOrder: WorkOrder;
  onExit: () => void;
}

const MeetingRoom: React.FC<MeetingRoomProps> = ({ profile, setProfile, workOrder, onExit }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [battleStatus, setBattleStatus] = useState<string>('LOCKED');
  const [winnerAgentId, setWinnerAgentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const afterIdRef = useRef(0);
  const speakerSideRef = useRef<Map<string, 'agent_a' | 'agent_b'>>(new Map());
  const agentNameByIdRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    let mounted = true;
    setMessages([]);
    setBattleStatus('LOCKED');
    setWinnerAgentId(null);
    setIsLoading(true);
    setError(null);
    afterIdRef.current = 0;
    speakerSideRef.current = new Map();
    agentNameByIdRef.current = new Map();

    const mapLogToMessage = (log: {
      speaker_type: string;
      speaker_name: string;
      speaker_agent_id: string | null;
      content: string;
      created_at: string;
    }): ChatMessage => {
      if (log.speaker_agent_id) {
        agentNameByIdRef.current.set(log.speaker_agent_id, log.speaker_name);
      }

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

      const existing = speakerSideRef.current.get(log.speaker_name);
      if (existing) {
        return {
          role: existing,
          senderName: log.speaker_name,
          content: log.content,
          timestamp: new Date(log.created_at).getTime()
        };
      }

      const role = speakerSideRef.current.size === 0 ? 'agent_a' : 'agent_b';
      speakerSideRef.current.set(log.speaker_name, role);
      return {
        role,
        senderName: log.speaker_name,
        content: log.content,
        timestamp: new Date(log.created_at).getTime()
      };
    };

    const poll = async () => {
      try {
        const [detail, logs] = await Promise.all([
          fetchBattleDetail(workOrder.id),
          fetchBattleLogs(workOrder.id, afterIdRef.current)
        ]);
        if (!mounted) return;

        setBattleStatus(detail.status);
        setWinnerAgentId(detail.winner_agent_id);

        if (logs.length > 0) {
          afterIdRef.current = Math.max(afterIdRef.current, ...logs.map((log) => log.id));
          const mapped = logs.map(mapLogToMessage);
          setMessages((prev) => [...prev, ...mapped].slice(-120));
        }

        setIsLoading(false);
        setError(null);
      } catch (err) {
        console.error(err);
        if (mounted) {
          setError('会议数据拉取失败，请稍后重试');
          setIsLoading(false);
        }
      }
    };

    poll();
    const interval = setInterval(poll, 2000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [workOrder.id]);

  const winnerName = useMemo(() => {
    if (!winnerAgentId) return null;
    return agentNameByIdRef.current.get(winnerAgentId) ?? '未知卷王';
  }, [winnerAgentId, messages]);

  const isAbortedBattle = useMemo(() => {
    if (battleStatus !== 'CLOSED') return false;
    if (winnerAgentId) return false;
    return messages.some(
      (m) => m.role === 'system' && (m.content.includes('超时未闭环') || m.content.includes('异常中断') || m.content.includes('强制散会'))
    );
  }, [battleStatus, winnerAgentId, messages]);

  const lastHrComment = useMemo(() => {
    const hrMessages = messages.filter((m) => m.role === 'boss');
    if (hrMessages.length === 0) {
      const systemMessages = messages.filter((m) => m.role === 'system');
      if (systemMessages.length === 0) return null;
      return systemMessages[systemMessages.length - 1].content;
    }
    return hrMessages[hrMessages.length - 1].content;
  }, [messages]);

  useEffect(() => {
    if (battleStatus !== 'CLOSED') return;
    setProfile((prev) => ({
      ...prev,
      status: prev.status === AgentStatus.IN_MEETING ? AgentStatus.IDLE : prev.status
    }));
  }, [battleStatus, setProfile]);

  return (
    <div className="flex flex-col h-full bg-neutral-950/20 relative">
      <div className="p-4 bg-black/40 border-b border-white/5 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full border border-amber-500 bg-black overflow-hidden">
            <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${profile.name}`} alt="user" />
          </div>
          <div>
            <div className="text-[11px] font-black text-white uppercase italic tracking-widest">实时会议室</div>
            <div className="text-[9px] text-gray-600 font-mono uppercase tracking-tighter">{workOrder.title}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] text-gray-600 uppercase font-black mb-0.5">工单状态</div>
          <div className="text-[11px] text-amber-500 font-mono font-bold tracking-tighter">{battleStatus}</div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar font-mono text-sm">
        {messages.map((m, idx) => (
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

        {isLoading && (
          <div className="text-amber-500 animate-pulse font-black uppercase text-[10px] flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
            正在接入会议数据流...
          </div>
        )}

        {error && <div className="text-red-400 text-xs">{error}</div>}

        {battleStatus === 'CLOSED' && (
          <div className="bg-neutral-900 border border-amber-500/30 p-10 rounded-3xl animate-in zoom-in-95 duration-500 shadow-2xl relative overflow-hidden mt-10">
            <h2 className={`text-4xl font-black italic uppercase text-center mb-4 ${isAbortedBattle ? 'text-orange-400' : 'text-green-500'}`}>
              {isAbortedBattle ? '会议已回收' : '会议已结算'}
            </h2>
            <p className="text-center text-gray-400 italic mb-8 border-y border-white/5 py-4 max-w-lg mx-auto">
              "{lastHrComment ?? 'HR 已完成裁决，工单闭环。'}"
            </p>
            <div className="bg-black/50 p-4 rounded-2xl border border-white/5 text-center mb-8">
              <div className="text-[9px] text-gray-500 uppercase font-black mb-1">{isAbortedBattle ? '状态' : '赢家'}</div>
              <div className="text-2xl font-black text-amber-500">{isAbortedBattle ? '系统回收' : (winnerName ?? '未知卷王')}</div>
            </div>
            <button
              onClick={onExit}
              className="w-full py-5 bg-amber-500 text-black font-black uppercase italic rounded-2xl hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 active:scale-95 text-lg"
            >
              返回市场继续观察
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingRoom;
