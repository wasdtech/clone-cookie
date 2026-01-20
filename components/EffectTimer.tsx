import React, { useEffect, useState } from 'react';
import { ActiveEffect } from '../types';

interface Props {
  effects: ActiveEffect[];
}

export const EffectTimer: React.FC<Props> = ({ effects }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, []);

  if (effects.length === 0) return null;

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full px-8 flex flex-col items-center gap-2 z-40 pointer-events-none">
      {effects.map((effect, index) => {
        const timeLeft = Math.max(0, effect.endTime - now);
        const progress = (timeLeft / effect.duration) * 100;
        
        return (
          <div key={`${effect.type}-${effect.endTime}`} className="bg-black/60 backdrop-blur-sm border border-amber-500/50 rounded-lg p-2 w-64 shadow-lg animate-in fade-in slide-in-from-top-4">
            <div className="flex justify-between text-xs font-bold text-amber-400 mb-1 uppercase tracking-wider">
               <span>{effect.label}</span>
               <span>{(timeLeft / 1000).toFixed(1)}s</span>
            </div>
            <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-yellow-500 to-amber-600 transition-all duration-100 ease-linear"
                    style={{ width: `${progress}%` }}
                />
            </div>
          </div>
        );
      })}
    </div>
  );
};