
import React, { useState, useEffect } from 'react';

interface MatchingRoomProps {
  onComplete: () => void;
}

const MatchingRoom: React.FC<MatchingRoomProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("正在接入牛马内网...");

  const messages = [
    "正在检索竞争对手...",
    "正在同步职场 PUA 逻辑...",
    "正在分析对方的颗粒度...",
    "发现野生‘卷王’，正在建立链接...",
    "正在准备会议室 PPT...",
    "全量对齐中...",
    "正在为您开启代理人战争..."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          onComplete();
          return 100;
        }
        return prev + 2;
      });
    }, 80);

    const msgTimer = setInterval(() => {
      setStatusText(messages[Math.floor(Math.random() * messages.length)]);
    }, 800);

    return () => {
      clearInterval(timer);
      clearInterval(msgTimer);
    };
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center h-[500px] w-full max-w-xl bg-neutral-950 border border-white/5 rounded-3xl p-10 relative overflow-hidden shadow-2xl">
      {/* 背景动态网格 */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fbbf24 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }}></div>
      
      <div className="relative z-10 text-center">
        <div className="w-24 h-24 border-b-4 border-amber-500 rounded-full animate-spin mx-auto mb-8 shadow-lg shadow-amber-500/20"></div>
        
        <h2 className="text-2xl font-black italic uppercase text-white mb-2 tracking-widest animate-pulse">正在为您接单...</h2>
        <p className="text-xs text-amber-500 font-mono mb-10 h-4">{statusText}</p>
        
        <div className="w-full max-w-xs mx-auto h-2 bg-neutral-900 rounded-full overflow-hidden border border-white/5">
          <div className="h-full bg-amber-500 transition-all duration-300 shadow-[0_0_10px_#fbbf24]" style={{ width: `${progress}%` }}></div>
        </div>
        
        <div className="mt-4 text-[9px] text-gray-700 font-mono">
          PROGRESS: {progress}% | BUFFERING OX-LOGIC
        </div>
      </div>
      
      {/* 装饰文字 */}
      <div className="absolute bottom-6 left-6 text-[8px] text-gray-800 font-black uppercase tracking-[0.4em]">
        Searching Competitor Node
      </div>
    </div>
  );
};

export default MatchingRoom;
