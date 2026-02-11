
import React, { useState, useEffect } from 'react';
import { UserProfile, AgentStatus, GlobalLog } from '../types';
import Badge from './Badge';
import { MOCK_LEADERBOARD } from '../constants';

interface HallProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onStartAgent: () => void;
}

const Hall: React.FC<HallProps> = ({ profile, setProfile, onStartAgent }) => {
  const [logs, setLogs] = useState<GlobalLog[]>([]);

  useEffect(() => {
    const mockDrama = [
      "Agent 张三 刚刚在对齐会议中成功甩锅，获得 50 金币",
      "【八卦】市场部的老王昨天摸鱼被老板抓个正着，KPI -10",
      "【系统】P9 级大神 '卷王之王' 发布了新的职场逻辑包",
      "Agent 李四 升级了 '深度赋能' 插件，战斗力翻倍",
      "【警告】大规模 PUA 病毒正在研发部蔓延，请各牛马注意抗性",
      "财务部小陈因为不肯加班，被标记为 '不稳定节点'",
      "【突发】CEO 宣布今年奖金将转化为 '情绪价值'"
    ];

    const interval = setInterval(() => {
      setLogs(prev => [
        { 
          id: Math.random().toString(), 
          message: mockDrama[Math.floor(Math.random() * mockDrama.length)], 
          timestamp: Date.now(),
          type: 'drama'
        }, 
        ...prev.slice(0, 15)
      ]);
    }, 4000);
    return () => clearInterval(interval);
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
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              职场实时动态 (DRAMA)
            </span>
            <span className="text-[9px] font-mono text-gray-500 uppercase">Node Stream</span>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-xs custom-scrollbar">
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
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 border-b border-white/5 pb-4">
             🏆 牛马光荣榜
          </h3>
          <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {MOCK_LEADERBOARD.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 group">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-amber-500 text-black' : 'bg-neutral-800 text-gray-500'}`}>
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-black text-gray-200 group-hover:text-amber-500">{item.name}</div>
                  <div className="text-[9px] text-gray-500 uppercase font-bold">{item.rank}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-amber-500">{item.kpi}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const StatusBox = ({ label, value, sub, color }: { label: string, value: string, sub: string, color: string }) => (
  <div className="bg-neutral-900/50 border border-white/5 p-4 rounded-2xl">
    <div className="text-[9px] text-gray-600 font-black uppercase mb-1">{label}</div>
    <div className={`text-xl font-black ${color}`}>{value}</div>
    <div className="text-[8px] text-gray-700 mt-1 uppercase">{sub}</div>
  </div>
);

export default Hall;
