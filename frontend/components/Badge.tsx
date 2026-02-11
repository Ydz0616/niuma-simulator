
import React, { useState } from 'react';
import { UserProfile, AgentStatus, LogicUpgrade } from '../types';

interface BadgeProps {
  profile: UserProfile;
  setProfile?: React.Dispatch<React.SetStateAction<UserProfile>>;
  isEditable?: boolean;
}

const Badge: React.FC<BadgeProps> = ({ profile, setProfile, isEditable = false }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDetail, setNewDetail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const addLogic = async () => {
    if (!setProfile || !newTitle || !newDetail) return;
    const userId = localStorage.getItem('ox_horse_user_id');
    if (!userId) {
      alert('未找到用户登录态，请重新登录');
      return;
    }

    setIsSaving(true);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const resp = await fetch(`${apiBase}/api/me/evolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          title: newTitle,
          new_trait: newDetail
        })
      });
      if (!resp.ok) {
        throw new Error(`evolve failed: ${resp.status}`);
      }

      const upgrade: LogicUpgrade = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        title: newTitle,
        detail: newDetail
      };
      setProfile(prev => ({
        ...prev,
        logicHistory: [upgrade, ...prev.logicHistory],
        promptLayer: { ...prev.promptLayer, logic: newDetail }
      }));
      setNewTitle('');
      setNewDetail('');
    } catch (error) {
      console.error(error);
      alert('注入失败，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  };

  const isIdle = profile.status === AgentStatus.IDLE;

  return (
    <div className="relative w-full max-w-sm h-[560px] perspective-1000 group">
      <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* 正面: 员工工牌 */}
        <div className="absolute inset-0 backface-hidden bg-neutral-900 rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col">
          <div className="h-14 ox-gradient flex items-center px-6 justify-between">
            <span className="font-black italic text-black tracking-tighter text-xl">🐄 OX-HORSE</span>
            <span className="text-[14px] text-black font-black uppercase bg-white/20 px-2 py-0.5 rounded">P{profile.level}</span>
          </div>

          <div className="flex-1 p-6 flex flex-col items-center">
            <div className="relative w-36 h-36 mb-6 rounded-2xl border-2 border-amber-500/30 overflow-hidden bg-black/50 p-2 shadow-[0_0_20px_rgba(251,191,36,0.1)]">
              <img 
                src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${profile.name}`} 
                alt="Avatar" 
                className="w-full h-full"
              />
              <div className="absolute bottom-1 right-1 bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded shadow">
                LEVEL {profile.level}
              </div>
            </div>

            <h3 className="text-2xl font-black text-white uppercase tracking-widest text-center">{profile.name}</h3>
            <p className="text-xs text-amber-500/80 font-mono mb-6">{profile.idNumber}</p>

            <div className="w-full space-y-4">
              <AttributeRow label="内卷指数 (压力)" value={profile.attributes.involution} color={profile.attributes.involution > 80 ? 'bg-red-500' : 'bg-amber-500'} sub="100% 将强制休息" />
              <AttributeRow label="KPI 进度" value={profile.attributes.kpi % 100} color="bg-green-500" max={100} sub={`距离 P${profile.level + 1} 还差 ${100 - (profile.attributes.kpi % 100)}`} />
              <div className="flex justify-between items-center pt-2 border-t border-white/5">
                 <div className="text-center">
                    <div className="text-[9px] text-gray-500 font-black uppercase">抗压等级</div>
                    <div className="text-xs font-black text-white">{profile.attributes.resistance}</div>
                 </div>
                 <div className="text-center">
                    <div className="text-[9px] text-gray-500 font-black uppercase">摸鱼技巧</div>
                    <div className="text-xs font-black text-white">{profile.attributes.slacking}</div>
                 </div>
                 <div className="text-center">
                    <div className="text-[9px] text-gray-500 font-black uppercase">总财富</div>
                    <div className="text-xs font-black text-amber-500">¥{profile.gold}k</div>
                 </div>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsFlipped(true)}
            className="m-4 py-2.5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all text-gray-400 hover:text-white"
          >
            翻转查看生存逻辑 ➔
          </button>
        </div>

        {/* 背面: 逻辑升级盒 */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-neutral-900 rounded-3xl border border-amber-500/20 overflow-hidden shadow-2xl flex flex-col">
          <div className="h-14 bg-amber-500/10 border-b border-amber-500/20 flex items-center px-6 justify-between">
            <span className="font-black italic text-amber-500 tracking-tighter text-sm uppercase">牛马生存逻辑进化录</span>
            <button onClick={() => setIsFlipped(false)} className="text-gray-500 hover:text-white">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {isEditable && isIdle && (
              <div className="space-y-3 bg-black/40 p-4 rounded-2xl border border-white/5">
                <input 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="注入新逻辑标题..."
                  className="w-full bg-transparent border-b border-white/10 py-1 text-xs outline-none text-amber-500"
                />
                <textarea 
                  value={newDetail}
                  onChange={e => setNewDetail(e.target.value)}
                  placeholder="详细逻辑描述 (例: 在汇报中加入50%的废话)..."
                  className="w-full bg-transparent text-xs text-gray-400 h-20 outline-none resize-none"
                />
                <button 
                  onClick={addLogic}
                  disabled={isSaving}
                  className="w-full py-2 bg-amber-500 text-black text-[10px] font-black uppercase rounded-lg hover:bg-amber-400"
                >
                  {isSaving ? '注入中...' : '注入逻辑'}
                </button>
              </div>
            )}

            {profile.status !== AgentStatus.IDLE && isEditable && (
              <div className="text-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-[10px] text-red-500 font-black uppercase">
                   {profile.status === AgentStatus.COOLDOWN ? '核心过热：正在停机休息' : '逻辑锁定：正在会议中'}
                </p>
              </div>
            )}

            <div className="space-y-4">
              {profile.logicHistory.map((logic, idx) => (
                <div key={logic.id} className="relative pl-4 border-l border-amber-500/30">
                  <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-amber-500"></div>
                  <div className="text-[10px] text-gray-600 font-mono mb-1">
                    {new Date(logic.timestamp).toLocaleDateString()}
                  </div>
                  <div className="text-xs font-black text-amber-500 uppercase">{logic.title}</div>
                  <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{logic.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const AttributeRow = ({ label, value, color, max = 100, sub }: { label: string, value: number, color: string, max?: number, sub?: string }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[9px] font-black uppercase">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-300">{value}%</span>
    </div>
    <div className="h-1.5 w-full bg-black rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all duration-1000 shadow-[0_0_8px_currentColor]`} style={{ width: `${(value/max)*100}%` }}></div>
    </div>
    {sub && <div className="text-[8px] text-gray-600 italic text-right">{sub}</div>}
  </div>
);

export default Badge;
