
import React, { useState } from 'react';
import { BUILDINGS } from '../constants';
import { GameState } from '../types';
import { Lock } from 'lucide-react';
import { formatNumber } from '../utils/formatting';

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
    <div className="flex-1 h-full overflow-y-auto bg-gray-900 border-l-0 border-t-2 border-indigo-500/20 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent relative">
      <div className="sticky top-0 z-20 bg-gray-900/95 border-b border-gray-800 backdrop-blur-md shadow-lg flex items-center justify-between px-4 h-12">
          {/* Multiplier Toggle */}
          <div className="flex bg-gray-800/80 rounded-lg p-1 border border-gray-700">
              {[1, 10, 100].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setBuyAmount(amt as 1 | 10 | 100)}
                    className={`
                        px-3 py-1 rounded-md text-[10px] font-bold transition-all duration-200 uppercase tracking-wider
                        ${buyAmount === amt 
                            ? 'bg-indigo-600 text-white shadow-md' 
                            : 'text-gray-400 hover:text-white hover:bg-gray-700'}
                    `}
                  >
                    x{amt}
                  </button>
              ))}
          </div>

          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
            Loja
          </h3>
      </div>
      
      <div className="flex flex-col pb-12 gap-1 px-1 mt-1">
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
                flex items-center p-2 rounded-lg border border-transparent transition-all duration-200 relative overflow-hidden group w-full mx-auto
                ${canAfford 
                  ? 'hover:bg-gray-800 hover:border-gray-700 cursor-pointer active:scale-[0.99]' 
                  : 'opacity-40 grayscale cursor-not-allowed bg-gray-900'}
              `}
            >
              {canAfford && (
                <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}

              {/* Icon */}
              <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center mr-3 shadow-inner relative shrink-0 border border-gray-700 group-hover:border-indigo-500/30 transition-colors">
                 <building.icon size={24} className="text-gray-300 group-hover:text-amber-200 transition-colors" />
                 {count > 0 && (
                     <div className="absolute -top-2 -right-2 bg-gray-700 border border-gray-600 rounded text-[9px] px-1.5 font-bold text-white shadow-md z-10">
                       {count}
                     </div>
                 )}
              </div>

              {/* Info */}
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-sm font-bold text-gray-200 group-hover:text-white truncate">{building.name}</span>
                  <span className={`text-xs font-mono font-bold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                    {formatNumber(cost)}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 flex items-center gap-1.5 truncate">
                  <span className="text-indigo-400 font-semibold shrink-0">+{formatNumber(building.baseCps)}/s</span>
                  <span className="w-0.5 h-0.5 rounded-full bg-gray-600 shrink-0"></span>
                  <span className="italic opacity-60 truncate">{building.description}</span>
                </div>
              </div>
            </button>
          );
        })}
        
        <div className="py-8 flex flex-col items-center justify-center text-gray-700 text-[10px] uppercase tracking-widest gap-2 opacity-40">
            <Lock className="w-4 h-4" /> 
            <span>Continue jogando...</span>
        </div>
      </div>
    </div>
  );
};
