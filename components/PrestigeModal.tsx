import React from 'react';
import { GameState } from '../types';
import { Sparkles, ArrowUpCircle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  calculatePrestigeGain: (lifetime: number) => number;
  onAscend: () => void;
}

export const PrestigeModal: React.FC<Props> = ({ isOpen, onClose, gameState, calculatePrestigeGain, onAscend }) => {
  if (!isOpen) return null;

  const currentLevel = gameState.prestigeLevel;
  const potentialLevel = calculatePrestigeGain(gameState.lifetimeCookies);
  const levelsToGain = Math.max(0, potentialLevel - currentLevel);
  // Simple approximation for next level cost just for the progress bar visualization
  // Current logic implies levels ~ sqrt(cookies/1M). So cookies ~ level^2 * 1M.
  const nextLevelRaw = potentialLevel + 1;
  const nextLevelCookiesReq = Math.pow(nextLevelRaw, 2) * 1000000;
  const currentLevelCookiesReq = Math.pow(potentialLevel, 2) * 1000000;
  
  // Progress within current level bracket
  const progress = Math.min(100, Math.max(0, ((gameState.lifetimeCookies - currentLevelCookiesReq) / (nextLevelCookiesReq - currentLevelCookiesReq)) * 100));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-gradient-to-br from-indigo-900 to-purple-950 border-2 border-indigo-400 rounded-xl shadow-2xl w-full max-w-lg flex flex-col items-center p-6 text-center animate-in zoom-in-95 relative overflow-hidden">
        
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none"></div>
        <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>

        <button onClick={onClose} className="absolute top-4 right-4 text-indigo-300 hover:text-white transition-colors">
            <X size={24} />
        </button>

        <Sparkles size={48} className="text-indigo-300 mb-4 animate-pulse" />
        
        <h2 className="text-3xl font-bold text-white mb-2 font-serif tracking-widest">ASCENSÃO</h2>
        <p className="text-indigo-200 text-sm mb-6 max-w-xs">
            Renuncie sua padaria mortal para renascer com poder cósmico.
        </p>

        <div className="bg-black/40 rounded-lg p-6 w-full border border-indigo-500/30 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col">
                    <span className="text-xs text-indigo-400 uppercase">Nível Atual</span>
                    <span className="text-2xl font-bold text-white">{currentLevel}</span>
                </div>
                <div className="flex flex-col">
                     <span className="text-xs text-indigo-400 uppercase">Bônus Atual</span>
                     <span className="text-2xl font-bold text-green-400">+{currentLevel * 5}% CpS</span>
                </div>
            </div>

            <div className="w-full h-px bg-indigo-500/30 my-2"></div>

            <div className="py-4">
                {levelsToGain > 0 ? (
                    <>
                        <div className="text-lg text-indigo-200 mb-1">Cristais Disponíveis:</div>
                        <div className="text-4xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] mb-2">
                            +{levelsToGain}
                        </div>
                         <div className="text-sm text-green-400 font-mono">
                            Novo Bônus: +{(currentLevel + levelsToGain) * 5}%
                        </div>
                    </>
                ) : (
                    <div className="text-gray-400 italic py-2 flex flex-col gap-2">
                        <span>Produza mais biscoitos para ganhar cristais.</span>
                        {/* Progress Bar for next crystal */}
                        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden relative mt-2">
                             <div 
                                className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" 
                                style={{ width: `${progress}%` }}
                             />
                        </div>
                        <span className="text-[10px] text-indigo-300">{Math.floor(progress)}% para o próximo</span>
                    </div>
                )}
            </div>
        </div>

        <button 
            onClick={() => {
                if(levelsToGain > 0) {
                    onAscend();
                    onClose();
                }
            }}
            disabled={levelsToGain <= 0}
            className={`
                group relative px-8 py-3 rounded-full font-bold uppercase tracking-widest transition-all duration-300
                ${levelsToGain > 0 
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:shadow-[0_0_30px_rgba(79,70,229,0.8)] scale-100 hover:scale-105' 
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'}
            `}
        >
            {levelsToGain > 0 ? (
                <span className="flex items-center gap-2">
                    Ascender <ArrowUpCircle size={18} />
                </span>
            ) : (
                "Insuficiente"
            )}
        </button>
        
        <p className="text-[10px] text-indigo-400/60 mt-4">
            Isso resetará suas construções, biscoitos e melhorias. Conquistas e Cristais permanecem.
        </p>
      </div>
    </div>
  );
};