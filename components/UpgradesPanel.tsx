import React from 'react';
import { UPGRADES } from '../constants';
import { GameState } from '../types';

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
    <div className="bg-amber-900/10 p-2 min-h-[60px] flex flex-col gap-2 relative">
        {/* Decorative background accent */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />

        {availableUpgrades.length > 0 && (
          <div className="relative z-10">
            <div className="text-[10px] text-amber-500 uppercase tracking-widest mb-2 px-1 font-bold flex justify-between border-b border-amber-500/20 pb-1">
              <span>Melhorias Disponíveis</span>
            </div>
            <div className="flex flex-wrap gap-2 px-1">
            {availableUpgrades.map((upgrade) => {
                const canAfford = gameState.cookies >= upgrade.cost;
                return (
                    <div key={upgrade.id} className="relative group">
                        <button
                            onClick={() => buyUpgrade(upgrade.id)}
                            disabled={!canAfford}
                            className={`
                                w-11 h-11 rounded bg-slate-800 border flex items-center justify-center
                                transition-all duration-200
                                ${canAfford 
                                    ? 'border-amber-400 hover:scale-110 cursor-pointer shadow-[0_0_10px_rgba(251,191,36,0.3)]' 
                                    : 'border-gray-700 opacity-50 grayscale cursor-not-allowed'}
                            `}
                        >
                            {upgrade.type === 'click' && <span className="text-lg">👆</span>}
                            {upgrade.type === 'building' && <span className="text-lg">⚡</span>}
                            {upgrade.type === 'global' && <span className="text-lg">🌟</span>}
                        </button>

                        {/* Tooltip Ajustado: top-full (abaixo), left-0 (alinha esq), z-50 (frente) */}
                        <div className="absolute top-full mt-2 left-0 w-60 bg-black border border-amber-500/30 p-3 rounded shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-md">
                            <div className="font-bold text-sm text-amber-400 mb-1 border-b border-gray-700 pb-1">{upgrade.name}</div>
                            <div className="text-xs text-gray-300 mb-2 leading-tight">{upgrade.description}</div>
                            <div className={`text-xs font-mono font-bold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                                Custo: {upgrade.cost.toLocaleString()}
                            </div>
                        </div>
                    </div>
                );
            })}
            </div>
          </div>
        )}

        {purchasedUpgrades.length > 0 && (
          <div className="relative z-10 pt-2">
             <div className="text-[9px] text-amber-800/60 uppercase tracking-widest mb-1 px-1 font-semibold">Adquiridas ({purchasedUpgrades.length})</div>
             <div className="flex flex-wrap gap-1 px-1">
                {purchasedUpgrades.map((upgrade) => (
                  <div key={upgrade.id} className="relative group">
                    <div className="w-6 h-6 rounded bg-gray-900/50 border border-amber-900/30 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity cursor-help">
                       <span className="text-[10px] grayscale group-hover:grayscale-0">
                          {upgrade.type === 'click' && "👆"}
                          {upgrade.type === 'building' && "⚡"}
                          {upgrade.type === 'global' && "🌟"}
                       </span>
                    </div>
                    {/* Tooltip Ajustado: top-full (abaixo), left-0 (alinha esq) */}
                    <div className="absolute top-full mt-2 left-0 w-48 bg-gray-900 border border-white/10 p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-sm">
                        <div className="font-bold text-[10px] text-green-400 mb-0.5">{upgrade.name} [ATIVO]</div>
                        <div className="text-[9px] text-gray-300 leading-tight">{upgrade.description}</div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}
    </div>
  );
};