import React from 'react';
import { BUILDINGS } from '../constants';
import { GameState } from '../types';
import { Lock } from 'lucide-react';

interface Props {
  gameState: GameState;
  buyBuilding: (id: string) => void;
}

export const BuildingStore: React.FC<Props> = ({ gameState, buyBuilding }) => {
  return (
    <div className="flex-1 overflow-y-auto bg-gray-800 border-l-0 border-t-4 border-indigo-600/50 scrollbar-thin scrollbar-thumb-indigo-900 scrollbar-track-gray-800 relative">
      <h3 className="text-center py-3 text-sm font-bold border-b border-indigo-900/50 bg-gray-900/95 sticky top-0 z-10 shadow-md uppercase tracking-tighter text-indigo-400 backdrop-blur-sm">
        Construções
      </h3>
      
      <div className="flex flex-col pb-10">
        {BUILDINGS.map((building) => {
          const count = gameState.buildings[building.id] || 0;
          // Updated exponent to 1.22 to match engine
          const cost = Math.floor(building.baseCost * Math.pow(1.22, count));
          const canAfford = gameState.cookies >= cost;
          
          return (
            <button
              key={building.id}
              onClick={() => buyBuilding(building.id)}
              disabled={!canAfford}
              className={`
                flex items-center p-3 border-b border-gray-700/50 transition-all duration-200 relative overflow-hidden group
                ${canAfford 
                  ? 'hover:bg-indigo-900/20 cursor-pointer' 
                  : 'opacity-50 grayscale cursor-not-allowed bg-gray-800/30'}
              `}
            >
              {canAfford && (
                <div className="absolute inset-0 bg-indigo-500/5 w-0 group-hover:w-full transition-all duration-300" />
              )}

              {/* Icon Container */}
              <div className="w-14 h-14 bg-gray-700/50 rounded-lg flex items-center justify-center mr-4 shadow-inner relative shrink-0 border border-white/5 group-hover:border-indigo-400/30 transition-colors">
                 <building.icon size={28} className="text-amber-100 drop-shadow-md" />
                 <div className="absolute -top-2 -right-2 bg-indigo-600 border border-indigo-400 rounded-full w-6 h-6 flex items-center justify-center text-[11px] font-bold text-white z-10 shadow-lg">
                   {count}
                 </div>
              </div>

              {/* Info */}
              <div className="flex-1 text-left">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-base font-bold text-shadow-sm text-gray-100 group-hover:text-white">{building.name}</span>
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