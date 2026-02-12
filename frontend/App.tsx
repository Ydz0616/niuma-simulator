
import React, { useState, useEffect } from 'react';
import { UserProfile, Personality, AgentStatus } from './types';
import { INITIAL_ATTRIBUTES } from './constants';
import Hall from './components/Hall';
import MarketRoom from './components/MarketRoom';
import SplashScreen from './components/SplashScreen';

interface MeCardResponse {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  level: number;
  title: string;
  kpi_score: number;
  involution: number;
  resistance: number;
  slacking: number;
  win_count: number;
  loss_count: number;
  status: string;
  rank: number;
  cooldown_until: string | null;
  prompt_layers: Array<{
    layer_no: number;
    trait: string;
    source: string;
    created_at: string;
  }>;
}

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

const App: React.FC = () => {
  const [view, setView] = useState<'splash' | 'hall' | 'market'>('splash');
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('ox_horse_v6');
    if (saved) return JSON.parse(saved);
    
    return {
      name: `牛马_${Math.floor(1000 + Math.random() * 9000)}`,
      idNumber: `SN-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      company: '疯狂大厂集团',
      level: 1,
      xp: 0,
      gold: 50,
      attributes: { ...INITIAL_ATTRIBUTES },
      personality: Personality.OLD_SLICK,
      logicHistory: [
        {
          id: 'init',
          timestamp: Date.now(),
          title: '初级生存逻辑',
          detail: '所有的活都是别人的，所有的功劳都是我的。遇事不决先甩锅。'
        }
      ],
      promptLayer: {
        logic: '所有的活都是别人的，所有的功劳都是我的。遇事不决先甩锅。',
        strategy: '表面勤奋，实际摸鱼，汇报时颗粒度拉满。',
        attitude: '客气但有刺，专业但甩锅。'
      },
      status: AgentStatus.IDLE,
      rank: 9999,
      cooldownUntil: 0,
      workOrdersCompleted: 0
    };
  });
  const [authChecked, setAuthChecked] = useState(false);

  const buildProfileFromMeCard = (card: MeCardResponse): UserProfile => {
    const logicHistory = card.prompt_layers.map((layer, idx) => ({
      id: `${layer.layer_no}`,
      timestamp: new Date(layer.created_at).getTime(),
      title: idx === 0 ? '初始人格导入' : `人格补丁 #${layer.layer_no}`,
      detail: layer.trait
    })).reverse();

    const latestTrait = card.prompt_layers.length > 0
      ? card.prompt_layers[card.prompt_layers.length - 1].trait
      : '高压环境高效输出，擅长对齐与闭环。';

    return {
      name: card.display_name,
      idNumber: `SM-${card.user_id.slice(0, 8).toUpperCase()}`,
      company: '疯狂大厂集团',
      level: card.level,
      xp: card.kpi_score,
      gold: Math.max(50, Math.floor(card.kpi_score / 2)),
      attributes: {
        ...INITIAL_ATTRIBUTES,
        kpi: card.kpi_score,
        involution: card.involution,
        resistance: card.resistance,
        slacking: card.slacking
      },
      personality: Personality.OLD_SLICK,
      logicHistory,
      promptLayer: {
        logic: latestTrait,
        strategy: '基于历史人格分层，动态对齐并形成闭环。',
        attitude: '客气但有刺，专业但甩锅。'
      },
      status: mapAgentStatus(card.status),
      rank: card.rank,
      cooldownUntil: card.cooldown_until ? new Date(card.cooldown_until).getTime() : 0,
      workOrdersCompleted: card.win_count + card.loss_count
    };
  };

  useEffect(() => {
    const loadMe = async (userId: string) => {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const resp = await fetch(`${apiBase}/api/me/card?user_id=${encodeURIComponent(userId)}`);
      if (!resp.ok) {
        throw new Error(`Load me/card failed: ${resp.status}`);
      }
      const card = await resp.json();
      const mapped = buildProfileFromMeCard(card);
      setProfile(mapped);
      localStorage.setItem('ox_horse_v6', JSON.stringify(mapped));
      localStorage.setItem('ox_horse_user_id', userId);
      setView('hall');
    };

    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const auth = params.get('auth');
      const callbackUserId = params.get('user_id');
      const cachedUserId = localStorage.getItem('ox_horse_user_id');
      const targetUserId = callbackUserId || cachedUserId;

      try {
        if (auth === 'success' && targetUserId) {
          await loadMe(targetUserId);
          window.history.replaceState({}, '', window.location.pathname);
        } else if (targetUserId) {
          await loadMe(targetUserId);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setAuthChecked(true);
      }
    };

    run();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (profile.status !== AgentStatus.COOLDOWN) return;
      const now = Date.now();
      const until = profile.cooldownUntil;
      // 已过期、或无效/未设置(cooldownUntil<=0/NaN) 则自动恢复待命
      if (!Number.isFinite(until) || until <= 0 || now >= until) {
        setProfile(prev => ({
          ...prev,
          status: AgentStatus.IDLE,
          attributes: { ...prev.attributes, involution: 0 }
        }));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [profile.status, profile.cooldownUntil]);

  useEffect(() => {
    const calculatedLevel = Math.min(Math.floor(profile.attributes.kpi / 100) + 1, 20);
    if (calculatedLevel !== profile.level) {
      setProfile(prev => ({ ...prev, level: calculatedLevel }));
    }
    localStorage.setItem('ox_horse_v6', JSON.stringify(profile));
  }, [profile.attributes.kpi, profile.level]);

  if (!authChecked || view === 'splash') {
    return <SplashScreen onComplete={() => setView('hall')} />;
  }

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col items-center bg-[#050505] selection:bg-amber-500/30 relative">
      {view === 'hall' && (
        <>
          <header className="w-full max-w-7xl flex justify-between items-center mt-8 mb-6 border-b border-white/5 pb-6 px-4 md:px-8 z-10 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 ox-gradient rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-amber-500/10">🐄</div>
              <div>
                <h1 className="text-3xl font-black italic tracking-tighter text-white leading-none underline decoration-amber-500">牛马模拟器</h1>
                <p className="text-xs text-amber-500 font-black uppercase tracking-[0.3em] mt-1.5">Agent-to-Agent Logic Wars</p>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="hidden md:flex gap-6">
                <StatItem label="在线牛马" value="10.2k" />
                <StatItem label="核心节点" value={`P${profile.level} 系统`} color="text-amber-500" />
              </div>
              <button 
                onClick={() => { if (window.confirm("确定重置核心？")) { localStorage.removeItem('ox_horse_v6'); window.location.reload(); } }}
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/20 transition-all opacity-50"
              >⟲</button>
            </div>
          </header>

          <main className="w-full flex-1 flex justify-center overflow-hidden animate-in fade-in duration-700 px-4 md:px-8 pb-32">
            <Hall profile={profile} setProfile={setProfile} onStartAgent={() => setView('market')} />
          </main>
        </>
      )}

      {view === 'market' && (
        <MarketRoom profile={profile} setProfile={setProfile} onExit={() => setView('hall')} />
      )}

      {view === 'hall' && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center fade-in duration-1000 z-50">
          <a 
            href="https://olajob.cn" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-center gap-3 px-6 py-3 bg-black/80 backdrop-blur-md hover:bg-white/10 border border-white/10 rounded-full transition-all hover:scale-105 hover:border-amber-500/50 shadow-2xl hover:shadow-amber-500/20 cursor-pointer"
          >
            <span className="text-gray-500 text-xs font-bold tracking-wider group-hover:text-gray-400 transition-colors">Ola 团队开发</span>
            <span className="text-white/10">|</span>
            <span className="text-amber-500 text-sm font-black italic tracking-tighter group-hover:underline decoration-amber-500 underline-offset-4 decoration-2">
              找工作，用 Ola 
            </span>
            <span className="text-amber-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 font-bold">↗</span>
          </a>
        </div>
      )}
    </div>
  );
};

const StatItem = ({ label, value, color = "text-white" }: { label: string, value: string, color?: string }) => (
  <div className="text-right">
    <div className="text-[10px] text-gray-600 font-black uppercase mb-0.5">{label}</div>
    <div className={`text-sm font-black italic ${color}`}>{value}</div>
  </div>
);

export default App;
