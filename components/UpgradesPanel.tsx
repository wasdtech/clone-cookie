import React from 'react';
import { UPGRADES } from '../constants';
import { GameState } from '../types';

interface Props {
  gameState: GameState;
  buyUpgrade: (id: string) => void;
}

export const UpgradesPanel: React.FC<Props> = ({ gameState, buyUpgrade }) => {
  // Filter available upgrades: Not bought AND trigger condition met
  const availableUpgrades = UPGRADES.filter(
    (u) => 
      !gameState.upgrades.includes(u.id) && 
      u.trigger(gameState.totalCookies, gameState.buildings)
  );

  if (availableUpgrades.length === 0) return null;

  return (
    <div className="bg-gray-800 border-b-8 border-gray-900 p-2 min-h-[80px]">
        <div className="text-xs text-gray-400 uppercase tracking-widest mb-2 px-2">Melhorias</div>
        <div className="flex flex-wrap gap-2 px-2">
        {availableUpgrades.map((upgrade) => {
            const canAfford = gameState.cookies >= upgrade.cost;
            return (
                <div key={upgrade.id} className="relative group">
                    <button
                        onClick={() => buyUpgrade(upgrade.id)}
                        disabled={!canAfford}
                        className={`
                            w-12 h-12 rounded bg-slate-700 border-2 flex items-center justify-center
                            transition-all duration-200
                            ${canAfford 
                                ? 'border-amber-400 hover:brightness-110 cursor-pointer shadow-[0_0_10px_rgba(251,191,36,0.3)]' 
                                : 'border-gray-600 opacity-60 grayscale cursor-not-allowed'}
                        `}
                    >
                        {upgrade.type === 'click' && <span className="text-xl">👆</span>}
                        {upgrade.type === 'building' && <span className="text-xl">⚡</span>}
                        {upgrade.type === 'global' && <span className="text-xl">🌟</span>}
                    </button>

                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-black border border-white/20 p-3 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        <div className="font-bold text-sm text-amber-400 mb-1">{upgrade.name}</div>
                        <div className="text-xs text-white mb-2">{upgrade.description}</div>
                        <div className={`text-xs font-mono ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                            Custo: {upgrade.cost.toLocaleString()}
                        </div>
                    </div>
                </div>
            );
        })}
        </div>
    </div>
  );
};