
import React, { useState } from 'react';
import { GameState } from '../types';
import { Pencil } from 'lucide-react';

interface Props {
  onCookieClick: () => number;
  gameState: GameState;
  cps: number;
  addFloatingText: (x: number, y: number, text: string) => void;
  updateBakeryName: (name: string) => void;
}

export const BigCookie: React.FC<Props> = ({ onCookieClick, gameState, cps, addFloatingText, updateBakeryName }) => {
  const [isClicking, setIsClicking] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

  const handleClick = (e: React.MouseEvent) => {
    const earned = onCookieClick();
    setIsClicking(true);
    setTimeout(() => setIsClicking(false), 50);

    const x = e.clientX + (Math.random() * 20 - 10);
    const y = e.clientY - 20 + (Math.random() * 20 - 10);
    
    addFloatingText(x, y, `+${Math.floor(earned * 10) / 10}`);
  };

  const handleStartEdit = () => {
      setTempName(gameState.bakeryName);
      setIsEditingName(true);
  };

  const handleSaveName = () => {
      if (tempName.trim()) updateBakeryName(tempName);
      setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSaveName();
      if (e.key === 'Escape') setIsEditingName(false);
  };

  // SVG de onda refinado para melhor visualização
  const waveSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23ffffff' fill-opacity='1' d='M0,160 C120,200 240,120 360,160 C480,200 600,240 720,160 C840,80 960,160 1080,160 C1200,160 1320,240 1440,160 L1440,320 L0,320 Z'%3E%3C/path%3E%3C/svg%3E";

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gray-900 relative z-10 overflow-hidden pb-[var(--sab)]">
      
      <div className="relative z-10 flex flex-col items-center w-full px-4">
        <div className="text-center mb-4 md:mb-8 select-none">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-1 bg-black/40 px-5 py-2 rounded-full border border-white/5 backdrop-blur-sm shadow-lg inline-block">
            {Math.floor(gameState.cookies).toLocaleString()}
          </h2>
          <div className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">Biscoitos</div>
          <p className="text-xs md:text-sm text-green-400 font-mono drop-shadow-md mt-2 bg-black/20 inline-block px-2 rounded">
             {cps.toFixed(1)} / seg
          </p>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-amber-500/10 rounded-full filter blur-3xl scale-110 animate-pulse pointer-events-none"></div>
          
          <button
            onClick={handleClick}
            className={`
              relative w-32 h-32 md:w-48 md:h-48 
              transition-transform duration-75 outline-none select-none 
              cursor-pointer
              ${isClicking ? 'scale-90' : 'hover:scale-105 active:scale-95'}
            `}
          >
            <img 
               src="https://cdn-icons-png.flaticon.com/512/1047/1047711.png"
               alt="Big Cookie"
               className="w-full h-full object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.6)]"
               draggable={false}
            />
          </button>
        </div>
        
        <div className="mt-6 md:mt-8 text-center text-white drop-shadow-sm h-8 flex items-center justify-center">
          {isEditingName ? (
              <input 
                 autoFocus
                 type="text" 
                 value={tempName}
                 onChange={(e) => setTempName(e.target.value)}
                 onBlur={handleSaveName}
                 onKeyDown={handleKeyDown}
                 maxLength={25}
                 className="bg-black/50 border border-amber-500/50 rounded px-2 py-0.5 text-center font-bold text-amber-200 focus:outline-none focus:border-amber-400 w-48 text-sm"
              />
          ) : (
              <div 
                 className="group flex items-center gap-2 px-3 py-1 rounded-full hover:bg-white/5 cursor-pointer transition-colors"
                 onClick={handleStartEdit}
              >
                  <p className="opacity-50 text-[9px] md:text-[10px] font-medium uppercase tracking-widest">{gameState.bakeryName}</p>
                  <Pencil size={10} className="opacity-0 group-hover:opacity-60 transition-opacity" />
              </div>
          )}
        </div>
      </div>

      {/* Container das ondas com altura aumentada para maior visibilidade */}
      <div className="absolute bottom-0 left-0 right-0 h-48 md:h-64 w-full z-0 pointer-events-none overflow-hidden">
        {/* Camadas de ondas com posições bottom mais elevadas para preencher o fundo */}
        <div className="absolute bottom-16 w-[400%] h-full animate-wave bg-repeat-x bg-bottom" style={{ backgroundImage: `url("${waveSvg}")`, backgroundSize: '25% 100%', animationDuration: '25s', opacity: 0.05 }} />
        <div className="absolute bottom-10 w-[300%] h-[95%] animate-wave bg-repeat-x bg-bottom" style={{ backgroundImage: `url("${waveSvg}")`, backgroundSize: '33% 100%', animationDuration: '18s', animationDelay: '-3s', opacity: 0.1 }} />
        <div className="absolute bottom-4 w-[250%] h-[90%] animate-wave bg-repeat-x bg-bottom" style={{ backgroundImage: `url("${waveSvg}")`, backgroundSize: '40% 100%', animationDuration: '12s', animationDelay: '-7s', opacity: 0.2 }} />
        <div className="absolute bottom-0 w-[200%] h-[85%] animate-wave bg-repeat-x bg-bottom" style={{ backgroundImage: `url("${waveSvg}")`, backgroundSize: '50% 100%', animationDuration: '8s', animationDelay: '-1s', opacity: 0.35 }} />
      </div>

    </div>
  );
};
