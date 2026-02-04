
import React, { useState } from 'react';
import { GameState } from '../types';
import { Pencil, MousePointer2 } from 'lucide-react';
import { AnimatedNumber } from './AnimatedNumber';
import { formatNumber } from '../utils/formatting';

interface Props {
  onCookieClick: () => number;
  gameState: GameState;
  cps: number;
  addFloatingText: (x: number, y: number, text: string) => void;
  updateBakeryName: (name: string) => void;
  clickValue: number; // Nova prop
}

export const BigCookie: React.FC<Props> = ({ onCookieClick, gameState, cps, addFloatingText, updateBakeryName, clickValue }) => {
  const [isClicking, setIsClicking] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

  const handleClick = (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
    // Prevent default para evitar double-tap zoom em mobiles e ghost clicks
    if (e.cancelable && e.type === 'touchstart') {
       e.preventDefault();
    }
    // Prevent selection on rapid mouse clicks
    if (e.type === 'mousedown') {
       e.preventDefault();
    }
    
    const earned = onCookieClick();
    setIsClicking(true);
    // Reset da animação rápido
    setTimeout(() => setIsClicking(false), 40);

    let clientX: number;
    let clientY: number;

    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX + (Math.random() * 30 - 15);
    const y = clientY - 30 + (Math.random() * 30 - 15);
    
    addFloatingText(x, y, `+${formatNumber(earned)}`);
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

  return (
    <div className="h-full flex flex-col items-center justify-center relative z-10 overflow-hidden pb-[var(--sab)] w-full">
      
      {/* Stats Display */}
      <div className="relative z-20 flex flex-col items-center w-full px-4 mb-4 select-none pointer-events-none">
        <div className="text-center mb-6">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2 opacity-80">Seu banco</div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
            {formatNumber(Math.floor(gameState.cookies))}
          </h2>
          <div className="flex gap-3 justify-center mt-2">
            <p className="text-xs md:text-sm text-green-400 font-mono font-bold bg-black/40 px-3 py-1 rounded-full border border-green-500/20 backdrop-blur-sm">
               {formatNumber(cps)} / s
            </p>
            <p className="text-xs md:text-sm text-indigo-400 font-mono font-bold bg-black/40 px-3 py-1 rounded-full border border-indigo-500/20 backdrop-blur-sm flex items-center gap-1">
               <MousePointer2 size={12} /> {formatNumber(clickValue)}
            </p>
          </div>
        </div>
      </div>

      {/* Cookie Button */}
      <div className="relative group z-20 touch-manipulation">
        {/* Glow de fundo */}
        <div className="absolute inset-0 bg-amber-500/20 rounded-full filter blur-3xl scale-125 animate-pulse pointer-events-none"></div>
        
        <button
          onMouseDown={handleClick}
          onTouchStart={handleClick}
          className={`
            relative w-40 h-40 md:w-64 md:h-64 
            transition-transform duration-[40ms] outline-none select-none 
            cursor-pointer active:scale-95 hover:scale-105
            ${isClicking ? 'scale-[0.98] brightness-110' : ''}
          `}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <img 
             src="https://cdn-icons-png.flaticon.com/512/1047/1047711.png"
             alt="Big Cookie"
             className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
             draggable={false}
          />
        </button>
      </div>
      
      {/* Bakery Name */}
      <div className="mt-8 relative z-20 h-8 flex items-center justify-center">
        {isEditingName ? (
            <input 
               autoFocus
               type="text" 
               value={tempName}
               onChange={(e) => setTempName(e.target.value)}
               onBlur={handleSaveName}
               onKeyDown={handleKeyDown}
               maxLength={25}
               className="bg-black/60 border border-amber-500/50 rounded px-3 py-1 text-center font-bold text-amber-200 focus:outline-none focus:border-amber-400 w-56 text-sm backdrop-blur-md"
            />
        ) : (
            <div 
               className="group flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/5 cursor-pointer transition-all border border-transparent hover:border-white/10"
               onClick={handleStartEdit}
            >
                <p className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">{gameState.bakeryName}</p>
                <Pencil size={12} className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        )}
      </div>

    </div>
  );
};
