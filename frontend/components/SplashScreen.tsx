
import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [loadingStep, setLoadingStep] = useState(0);
  const [showButton, setShowButton] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const logs = [
    "正在载入 OX-HORSE 系统内核 v6.0.0...",
    "正在扫描生物指纹 (DNA Scan: 匹配成功)...",
    "正在加载 PUA 语义解析插件...",
    "正在连接疯狂工单市场实时总线...",
    "正在初始化职场黑话库 (3.2M 词条)...",
    "正在模拟 996 会议环境...",
    "牛马代理人 A1-01 准备就绪。"
  ];

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      if (current < logs.length) {
        setLoadingStep(prev => prev + 1);
        current++;
      } else {
        clearInterval(interval);
        setShowButton(true);
      }
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async () => {
    setIsAuthenticating(true);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const resp = await fetch(`${apiBase}/api/auth/secondme/start`);
      if (!resp.ok) {
        throw new Error(`OAuth init failed: ${resp.status}`);
      }
      const data = await resp.json();
      if (!data.authorize_url) {
        throw new Error('Missing authorize_url');
      }
      window.location.href = data.authorize_url;
    } catch (error) {
      console.error(error);
      setIsAuthenticating(false);
      alert('登录初始化失败，请检查后端配置');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden">
      {/* 背景动态扫描线 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/20 shadow-[0_0_20px_#fbbf24] animate-[scan_4s_linear_infinite]"></div>
      </div>

      <style>
        {`
          @keyframes scan {
            from { top: -10%; }
            to { top: 110%; }
          }
        `}
      </style>

      <div className="relative z-20 flex flex-col items-center max-w-2xl px-6">
        {/* Logo 区域 */}
        <div className="mb-12 relative animate-in zoom-in duration-1000">
           <div className="w-32 h-32 ox-gradient rounded-[2.5rem] flex items-center justify-center text-7xl shadow-[0_0_50px_rgba(251,191,36,0.2)]">🐄</div>
           <div className="absolute -top-4 -right-4 bg-white text-black text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-xl">Alpha v6</div>
        </div>

        {/* 标题 */}
        <div className="text-center mb-10 space-y-2">
           <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white leading-none">
             牛马<span className="text-amber-500">模拟器</span>
           </h1>
           <p className="text-amber-500/60 font-black uppercase tracking-[0.5em] text-sm md:text-base">Ox-Horse Logic Wars</p>
        </div>

        {/* 载入日志 */}
        <div className="w-full bg-black/40 border border-white/5 p-6 rounded-3xl font-mono text-[10px] md:text-xs text-gray-500 h-48 flex flex-col justify-end space-y-1 mb-12 shadow-inner">
           {logs.slice(0, loadingStep).map((log, idx) => (
             <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="text-amber-500/50">❯</span>
                <span>{log}</span>
             </div>
           ))}
           {loadingStep < logs.length && (
             <div className="animate-pulse">_</div>
           )}
        </div>

        {/* 登录按钮区域 */}
        <div className={`w-full transition-all duration-1000 transform ${showButton ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <button 
            onClick={handleLogin}
            disabled={isAuthenticating}
            className="w-full py-6 bg-amber-500 text-black font-black uppercase italic text-xl rounded-2xl shadow-[0_0_30px_rgba(251,191,36,0.3)] hover:bg-amber-400 hover:scale-[1.02] active:scale-95 transition-all relative overflow-hidden group"
          >
            {isAuthenticating ? (
              <div className="flex items-center justify-center gap-3">
                 <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                 正在接入神经突触...
              </div>
            ) : (
              "身份验证并开始游玩"
            )}
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 italic"></div>
          </button>
          
          <div className="mt-6 flex justify-between px-2 text-[9px] font-black text-gray-700 uppercase tracking-widest">
             <span>© 2024 OX-HORSE KERNEL</span>
             <span>加密协议: PROD-778X</span>
          </div>
        </div>
      </div>

      {/* 底部点阵装饰 */}
      <div className="absolute bottom-10 opacity-10 flex gap-4">
         {[...Array(20)].map((_, i) => (
           <div key={i} className="w-1 h-1 bg-white rounded-full"></div>
         ))}
      </div>
    </div>
  );
};

export default SplashScreen;
