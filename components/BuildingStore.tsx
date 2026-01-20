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
    <div className="flex-1 overflow-y-auto bg-gray-800 border-l-8 border-gray-900 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
      <h3 className="text-center py-4 text-xl font-bold border-b border-gray-700 bg-gray-900 sticky top-0 z-10 shadow-md">
        Loja
      </h3>
      
      <div className="flex flex-col pb-20">
        {BUILDINGS.map((building) => {
          const count = gameState.buildings[building.id] || 0;
          const cost = Math.floor(building.baseCost * Math.pow(1.15, count));
          const canAfford = gameState.cookies >= cost;
          
          return (
            <button
              key={building.id}
              onClick={() => buyBuilding(building.id)}
              disabled={!canAfford}
              className={`
                flex items-center p-4 border-b border-gray-700 transition-all duration-200 relative overflow-hidden group
                ${canAfford 
                  ? 'hover:bg-gray-700 cursor-pointer' 
                  : 'opacity-50 grayscale cursor-not-allowed bg-gray-800/50'}
              `}
            >
              {/* Background fill for progress (visual flare) */}
              {canAfford && (
                <div className="absolute inset-0 bg-white/5 w-0 group-hover:w-full transition-all duration-300" />
              )}

              <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center mr-4 shadow-inner relative shrink-0">
                 <building.icon size={32} className="text-amber-200" />
                 <div className="absolute -top-2 -right-2 bg-black border border-gray-500 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-white z-10">
                   {count}
                 </div>
              </div>

              <div className="flex-1 text-left">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-lg font-bold text-shadow-sm">{building.name}</span>
                  <span className={`text-sm font-mono ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                    {cost.toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  +{building.baseCps} CpS
                </div>
                <div className="text-xs text-gray-500 mt-1 italic line-clamp-1">
                    {building.description}
                </div>
              </div>
            </button>
          );
        })}
        
        {/* Fill empty space */}
        <div className="h-24 flex items-center justify-center text-gray-600 text-sm">
            <Lock className="w-4 h-4 mr-2" /> Mais construções em breve
        </div>
      </div>
    </div>
  );
};