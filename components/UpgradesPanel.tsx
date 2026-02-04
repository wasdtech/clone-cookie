
import React from 'react';
import { UPGRADES } from '../constants';
import { GameState } from '../types';
import { formatNumber } from '../utils/formatting';

interface Props {
  gameState: GameState;
  buyUpgrade: (id: string) => void;
}

export const UpgradesPanel: React.FC<Props> = ({ gameState, buyUpgrade }) => {
  const availableUpgrades = UPGRADES.filter(
    (u) => 
      !gameState.upgrades.includes(u.id) && 
      u.trigger(gameState.totalCookies, gameState.buildings)
  );

  const purchasedUpgrades = UPGRADES.filter(
    (u) => gameState.upgrades.includes(u.id)
  );

  const hasUpgrades = availableUpgrades.length > 0 || purchasedUpgrades.length > 0;

  if (!hasUpgrades) return null;

  return (
    <div className="p-3 min-h-[60px] flex flex-col gap-3 relative bg-gray-900/50">
        
        {availableUpgrades.length > 0 && (
          <div className="relative z-10">
            <div className="text-[10px] text-amber-500/80 uppercase tracking-widest mb-2 font-bold flex justify-between border-b border-amber-900/30 pb-1">
              <span>Melhorias ({availableUpgrades.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
            {availableUpgrades.map((upgrade) => {
                const canAfford = gameState.cookies >= upgrade.cost;
                return (
                    <div key={upgrade.id} className="relative group">
                        <button
                            onClick={() => buyUpgrade(upgrade.id)}
                            disabled={!canAfford}
                            className={`
                                w-10 h-10 rounded-md flex items-center justify-center
                                transition-all duration-200 border
                                ${canAfford 
                                    ? 'bg-gray-800 border-amber-600/50 hover:bg-gray-700 hover:border-amber-400 cursor-pointer shadow-lg hover:-translate-y-0.5' 
                                    : 'bg-gray-900 border-gray-800 opacity-40 cursor-not-allowed'}
                            `}
                        >
                            <span className="text-lg filter drop-shadow-md">
                              {upgrade.type === 'click' && "👆"}
                              {upgrade.type === 'building' && "⚡"}
                              {upgrade.type === 'global' && "💎"}
                            </span>
                        </button>

                        {/* Enhanced Tooltip */}
                        <div className="absolute top-full mt-2 left-0 w-56 bg-gray-900 border border-amber-500/30 p-3 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100]">
                            <div className="font-bold text-xs text-amber-400 mb-1 border-b border-gray-800 pb-1 flex justify-between">
                              <span>{upgrade.name}</span>
                            </div>
                            <div className="text-[11px] text-gray-300 mb-2 leading-relaxed opacity-90">{upgrade.description}</div>
                            <div className={`text-[10px] font-mono font-bold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                                Custo: {formatNumber(upgrade.cost)}
                            </div>
                        </div>
                    </div>
                );
            })}
            </div>
          </div>
        )}

        {purchasedUpgrades.length > 0 && (
          <div className="relative z-10 pt-1">
             <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-1 font-semibold flex items-center gap-2">
                <span>Adquiridas</span>
                <span className="bg-gray-800 px-1.5 rounded text-gray-500">{purchasedUpgrades.length}</span>
             </div>
             <div className="flex flex-wrap gap-1 opacity-50 hover:opacity-100 transition-opacity">
                {purchasedUpgrades.slice(-10).map((upgrade) => (
                  <div key={upgrade.id} className="w-5 h-5 rounded bg-gray-800 border border-gray-700 flex items-center justify-center" title={upgrade.name}>
                       <span className="text-[10px] grayscale">
                          {upgrade.type === 'click' && "👆"}
                          {upgrade.type === 'building' && "⚡"}
                          {upgrade.type === 'global' && "💎"}
                       </span>
                  </div>
                ))}
                {purchasedUpgrades.length > 10 && (
                    <div className="w-5 h-5 flex items-center justify-center text-[9px] text-gray-600">...</div>
                )}
             </div>
          </div>
        )}
    </div>
  );
};
