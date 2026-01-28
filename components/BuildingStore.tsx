
import React, { useState } from 'react';
import { BUILDINGS } from '../constants';
import { GameState } from '../types';
import { Lock } from 'lucide-react';

interface Props {
  gameState: GameState;
  buyBuilding: (id: string, amount: number) => void;
}

export const BuildingStore: React.FC<Props> = ({ gameState, buyBuilding }) => {
  const [buyAmount, setBuyAmount] = useState<1 | 10 | 100>(1);

  const getBuildingPrice = (buildingId: string, currentCount: number, skills: string[]) => {
      const building = BUILDINGS.find(b => b.id === buildingId);
      if (!building) return 0;
      let cost = Math.floor(building.baseCost * Math.pow(1.15, currentCount));
      if (skills.includes('divine_discount')) cost = Math.floor(cost * 0.9);
      skills.forEach(sid => {
          if (sid.startsWith('eco_')) {
              const val = parseInt(sid.split('_')[1]);
              cost *= (1 - (val * 0.02));
          }
      });
      return Math.floor(cost);
  };

  const getCumulativeDisplayPrice = (buildingId: string, currentCount: number, amount: number) => {
      let total = 0;
      for (let i = 0; i < amount; i++) {
          total += getBuildingPrice(buildingId, currentCount + i, gameState.purchasedSkills);
      }
      return total;
  };

  const isBuildingVisible = (building: typeof BUILDINGS[0]) => {
      const count = gameState.buildings[building.id] || 0;
      if (count > 0) return true;
      return (gameState.lifetimeCookies || 0) >= building.baseCost * 0.7;
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-gray-800 border-l-0 border-t-4 border-indigo-600/50 scrollbar-thin scrollbar-thumb-indigo-900 scrollbar-track-gray-800 relative">
      <div className="sticky top-0 z-20 bg-gray-900/95 border-b border-indigo-900/50 backdrop-blur-sm shadow-md flex items-center justify-between px-4 h-10">
          {/* Seletor de Quantidade de Compra - Estilo Texto Alinhado à Esquerda */}
          <div className="flex gap-4">
              {[1, 10, 100].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setBuyAmount(amt as 1 | 10 | 100)}
                    className={`
                        text-[11px] font-bold transition-all duration-300 uppercase tracking-tight
                        ${buyAmount === amt 
                            ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.9)] scale-110' 
                            : 'text-gray-500 hover:text-gray-300'}
                    `}
                  >
                    X{amt}
                  </button>
              ))}
          </div>

          <h3 className="absolute left-1/2 -translate-x-1/2 text-[11px] font-bold uppercase tracking-widest text-indigo-400 pointer-events-none">
            Construções
          </h3>
          
          <div className="w-16"></div> {/* Spacer para manter o título centralizado */}
      </div>
      
      <div className="flex flex-col pb-10">
        {BUILDINGS.map((building) => {
          if (!isBuildingVisible(building)) return null;

          const count = gameState.buildings[building.id] || 0;
          const cost = getCumulativeDisplayPrice(building.id, count, buyAmount);
          const canAfford = gameState.cookies >= cost;
          
          return (
            <button
              key={building.id}
              onClick={() => buyBuilding(building.id, buyAmount)}
              disabled={!canAfford}
              className={`
                flex items-center p-3 border-b border-gray-700/50 transition-all duration-200 relative overflow-hidden group
                ${canAfford 
                  ? 'hover:bg-indigo-900/20 cursor-pointer' 
                  : 'opacity-50 grayscale cursor-not-allowed bg-gray-800/30'}
              `}
            >
              {canAfford && (
                <>
                  <div className="absolute inset-0 bg-indigo-500/5 w-0 group-hover:w-full transition-all duration-300" />
                  {/* Smoke / Glow Animation */}
                  <div className="absolute bottom-2 right-1/4 w-8 h-8 bg-white/20 rounded-full blur-xl opacity-0 group-hover:animate-[smoke-rise_2s_infinite_ease-out] pointer-events-none"></div>
                  <div className="absolute bottom-4 right-1/3 w-6 h-6 bg-indigo-400/20 rounded-full blur-xl opacity-0 group-hover:animate-[smoke-rise_2.5s_infinite_ease-out] delay-75 pointer-events-none"></div>
                </>
              )}

              {/* Icon Container */}
              <div className="w-14 h-14 bg-gray-700/50 rounded-lg flex items-center justify-center mr-4 shadow-inner relative shrink-0 border border-white/5 group-hover:border-indigo-400/30 transition-colors z-10">
                 <building.icon size={28} className="text-amber-100 drop-shadow-md relative z-10" />
                 {count > 0 && (
                     <div className="absolute -top-2 -right-2 bg-indigo-600 border border-indigo-400 rounded-full w-6 h-6 flex items-center justify-center text-[11px] font-bold text-white z-20 shadow-lg">
                       {count}
                     </div>
                 )}
              </div>

              {/* Info */}
              <div className="flex-1 text-left relative z-10">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-base font-bold text-shadow-sm text-gray-100 group-hover:text-white group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)] transition-all">{building.name}</span>
                  <span className={`text-xs font-mono font-bold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                    {cost.toLocaleString()}
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 group-hover:text-gray-300 flex items-center gap-1">
                  <span className="text-indigo-300">+{building.baseCps} CpS</span>
                  <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                  <span className="italic opacity-70 truncate max-w-[150px]">{building.description}</span>
                </div>
              </div>
            </button>
          );
        })}
        
        <div className="h-24 flex flex-col items-center justify-center text-gray-600 text-[10px] uppercase tracking-widest gap-2 opacity-50">
            <Lock className="w-4 h-4" /> 
            <span>Mais em breve...</span>
        </div>
      </div>
    </div>
  );
};
