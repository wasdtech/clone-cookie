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

    // Randomize position slightly around the click
    const x = e.clientX + (Math.random() * 20 - 10);
    const y = e.clientY - 20 + (Math.random() * 20 - 10);
    
    addFloatingText(x, y, `+${Math.floor(earned * 10) / 10}`);
  };

  const handleStartEdit = () => {
      setTempName(gameState.bakeryName);
      setIsEditingName(true);
  };

  const handleSaveName = () => {
      if (tempName.trim()) {
          updateBakeryName(tempName);
      }
      setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSaveName();
      if (e.key === 'Escape') setIsEditingName(false);
  };

  // SVG wave path data
  const waveSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23ffffff' fill-opacity='1' d='M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,202.7C1248,181,1344,171,1392,165.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E";

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gray-900 border-r-8 border-gray-800 relative shadow-2xl z-10 overflow-hidden">
      
      {/* Content Container (z-10 to sit above waves) */}
      <div className="relative z-10 flex flex-col items-center w-full">
        <div className="text-center mb-12 select-none">
          <h2 className="text-4xl font-bold text-white mb-2 bg-black/30 px-6 py-2 rounded-full border border-white/10 backdrop-blur-sm">
            {Math.floor(gameState.cookies).toLocaleString()} <span className="text-xl text-gray-400">biscoitos</span>
          </h2>
          <p className="text-lg text-green-400 font-mono drop-shadow-md">por segundo: {cps.toFixed(1)}</p>
        </div>

        <div className="relative group">
          {/* Glow effect behind cookie */}
          <div className="absolute inset-0 bg-amber-500/10 rounded-full filter blur-3xl scale-125 animate-pulse pointer-events-none"></div>
          
          <button
            onClick={handleClick}
            className={`
              relative w-64 h-64 
              transition-transform duration-75 outline-none select-none 
              cursor-pointer
              ${isClicking ? 'scale-95' : 'hover:scale-105 active:scale-95'}
            `}
          >
            <img 
               src="https://cdn-icons-png.flaticon.com/512/1047/1047711.png"
               alt="Big Cookie"
               className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
               draggable={false}
            />
          </button>
        </div>
        
        <div className="mt-12 text-center text-white drop-shadow-sm h-10 flex items-center justify-center">
          {isEditingName ? (
              <input 
                 autoFocus
                 type="text" 
                 value={tempName}
                 onChange={(e) => setTempName(e.target.value)}
                 onBlur={handleSaveName}
                 onKeyDown={handleKeyDown}
                 maxLength={25}
                 className="bg-black/50 border border-amber-500/50 rounded px-2 py-1 text-center font-bold text-amber-200 focus:outline-none focus:border-amber-400 w-64"
              />
          ) : (
              <div 
                 className="group flex items-center gap-2 px-3 py-1 rounded-full hover:bg-white/5 cursor-pointer transition-colors"
                 onClick={handleStartEdit}
                 title="Clique para renomear"
              >
                  <p className="opacity-60 text-sm font-medium">{gameState.bakeryName}</p>
                  <Pencil size={12} className="opacity-0 group-hover:opacity-60 transition-opacity" />
              </div>
          )}
        </div>
      </div>

      {/* Milk Waves Container */}
      <div className="absolute bottom-0 left-0 right-0 h-48 w-full z-0 pointer-events-none">
        {/* Wave 1: Back, Slow, Low Opacity */}
        <div 
          className="absolute bottom-0 w-[200%] h-full animate-wave bg-repeat-x bg-bottom"
          style={{ 
            backgroundImage: `url("${waveSvg}")`,
            backgroundSize: '50% 100%',
            animationDuration: '20s',
            opacity: 0.1
          }} 
        />
        
        {/* Wave 2: Middle, Medium Speed, Medium Opacity, Offset */}
        <div 
          className="absolute -bottom-2 w-[200%] h-[90%] animate-wave bg-repeat-x bg-bottom"
          style={{ 
            backgroundImage: `url("${waveSvg}")`,
            backgroundSize: '50% 100%',
            animationDuration: '15s',
            animationDelay: '-2s',
            opacity: 0.2
          }} 
        />

        {/* Wave 3: Front, Fast, Higher Opacity */}
        <div 
          className="absolute -bottom-4 w-[200%] h-[80%] animate-wave bg-repeat-x bg-bottom"
          style={{ 
            backgroundImage: `url("${waveSvg}")`,
            backgroundSize: '50% 100%',
            animationDuration: '10s',
            animationDelay: '-5s',
            opacity: 0.3
          }} 
        />
      </div>

    </div>
  );
};