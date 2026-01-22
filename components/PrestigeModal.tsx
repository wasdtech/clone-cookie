import React, { useState } from 'react';
import { GameState } from '../types';
import { SKILLS } from '../constants';
import { Sparkles, ArrowUpCircle, X, Lock } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  calculatePrestigeGain: (lifetime: number) => number;
  onAscend: () => void;
  buySkill: (id: string) => void;
}

export const PrestigeModal: React.FC<Props> = ({ isOpen, onClose, gameState, calculatePrestigeGain, onAscend, buySkill }) => {
  const [activeTab, setActiveTab] = useState<'ascend' | 'tree'>('ascend');
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Logic for Ascension Calculation
  const spentOnSkills = gameState.purchasedSkills.reduce((acc, skillId) => {
      const s = SKILLS.find(sk => sk.id === skillId);
      return acc + (s ? s.cost : 0);
  }, 0);
  const totalOwned = gameState.prestigeLevel + spentOnSkills;
  const potentialLevel = calculatePrestigeGain(gameState.lifetimeCookies);
  const levelsToGain = Math.max(0, potentialLevel - totalOwned);
  
  const nextLevelRaw = potentialLevel + 1;
  const nextLevelCookiesReq = Math.pow(nextLevelRaw, 2) * 1000000;
  const currentLevelCookiesReq = Math.pow(potentialLevel, 2) * 1000000;
  const progress = Math.min(100, Math.max(0, ((gameState.lifetimeCookies - currentLevelCookiesReq) / (nextLevelCookiesReq - currentLevelCookiesReq)) * 100));

  const selectedSkill = selectedSkillId ? SKILLS.find(s => s.id === selectedSkillId) : null;
  const canBuySelected = selectedSkill ? (!gameState.purchasedSkills.includes(selectedSkill.id) && (!selectedSkill.parent || gameState.purchasedSkills.includes(selectedSkill.parent)) && gameState.prestigeLevel >= selectedSkill.cost) : false;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-gradient-to-br from-indigo-950 to-slate-950 border-2 border-indigo-500/50 rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col relative overflow-hidden">
        
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none"></div>

        {/* Header / Tabs */}
        <div className="flex justify-between items-center p-4 border-b border-indigo-500/30 bg-black/40 z-10 shrink-0">
            <div className="flex gap-4">
                <button 
                    onClick={() => setActiveTab('ascend')}
                    className={`px-4 py-2 rounded-lg font-bold uppercase text-xs tracking-widest transition-colors ${activeTab === 'ascend' ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-900/30 text-indigo-300'}`}
                >
                    Reencarnação
                </button>
                <button 
                    onClick={() => setActiveTab('tree')}
                    className={`px-4 py-2 rounded-lg font-bold uppercase text-xs tracking-widest transition-colors ${activeTab === 'tree' ? 'bg-purple-600 text-white' : 'hover:bg-purple-900/30 text-purple-300'}`}
                >
                    Árvore Celestial
                </button>
            </div>
            <div className="flex items-center gap-3">
                 <div className="flex flex-col items-end mr-4">
                    <span className="text-[10px] text-indigo-400 uppercase">Cristais Disponíveis</span>
                    <span className="text-xl font-bold text-white flex items-center gap-1">
                        {gameState.prestigeLevel} <Sparkles size={14} className="text-purple-400" />
                    </span>
                 </div>
                 <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-indigo-300">
                    <X size={24} />
                 </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
            
            {activeTab === 'ascend' && (
                <div className="flex flex-col items-center justify-center h-full text-center animate-in zoom-in-95 p-6 overflow-y-auto">
                    <Sparkles size={64} className="text-indigo-300 mb-6 animate-pulse" />
                    <h2 className="text-4xl font-bold text-white mb-2 font-serif tracking-widest">ASCENSÃO</h2>
                    <p className="text-indigo-200 text-sm mb-8 max-w-md">
                        Renuncie sua padaria mortal para renascer com poder cósmico. Seus Cristais de Açúcar aumentam seu CpS passivamente se não forem gastos.
                    </p>

                    <div className="bg-black/40 rounded-lg p-8 w-full max-w-md border border-indigo-500/30 mb-8 backdrop-blur-md">
                        {levelsToGain > 0 ? (
                            <>
                                <div className="text-lg text-indigo-200 mb-1">Cristais a Receber:</div>
                                <div className="text-5xl font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] mb-4">
                                    +{levelsToGain}
                                </div>
                                <div className="text-xs text-green-400 font-mono mb-6">
                                    Bônus Potencial: +{(gameState.prestigeLevel + levelsToGain) * 5}% CpS
                                </div>
                                <button 
                                    onClick={() => { onAscend(); onClose(); }}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-lg font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:shadow-[0_0_30px_rgba(79,70,229,0.8)] transition-all transform hover:scale-105"
                                >
                                    Ascender Agora
                                </button>
                            </>
                        ) : (
                            <div className="py-4">
                                <div className="text-gray-400 italic mb-4">Você precisa de mais biscoitos.</div>
                                <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden relative">
                                    <div className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] transition-all duration-500" style={{ width: `${progress}%` }} />
                                </div>
                                <div className="text-[10px] text-indigo-400 mt-2 text-right">{Math.floor(progress)}% para o próximo</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'tree' && (
                <div className="w-full h-full flex flex-col">
                    {/* Tree Visualization */}
                    <div className="flex-1 relative bg-slate-900/50 overflow-hidden shadow-inner cursor-grab active:cursor-grabbing">
                        {/* Background Grid */}
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

                        {/* Connections */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-40">
                            {SKILLS.map(skill => {
                                if (!skill.parent) return null;
                                const parent = SKILLS.find(s => s.id === skill.parent);
                                if (!parent) return null;
                                
                                const isBought = gameState.purchasedSkills.includes(skill.id);
                                const isParentBought = gameState.purchasedSkills.includes(parent.id);
                                
                                return (
                                    <line 
                                        key={`line-${skill.id}`}
                                        x1={`${parent.x}%`} y1={`${parent.y}%`}
                                        x2={`${skill.x}%`} y2={`${skill.y}%`}
                                        stroke={isBought ? "#a855f7" : (isParentBought ? "#64748b" : "#334155")}
                                        strokeWidth="2"
                                        strokeDasharray={isBought ? "0" : "5,5"}
                                    />
                                );
                            })}
                        </svg>

                        {/* Nodes */}
                        {SKILLS.map(skill => {
                            const isBought = gameState.purchasedSkills.includes(skill.id);
                            const parentBought = !skill.parent || gameState.purchasedSkills.includes(skill.parent);
                            const canBuy = !isBought && parentBought && gameState.prestigeLevel >= skill.cost;
                            const isLocked = !isBought && !parentBought;
                            const isSelected = selectedSkillId === skill.id;

                            return (
                                <button
                                    key={skill.id}
                                    onClick={() => setSelectedSkillId(skill.id)}
                                    className={`
                                        absolute -translate-x-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-200
                                        ${isSelected ? 'scale-125 ring-4 ring-white/20' : 'hover:scale-110'}
                                        ${isBought 
                                            ? 'bg-purple-600 border-purple-300 text-white shadow-[0_0_15px_rgba(147,51,234,0.6)]' 
                                            : (isLocked 
                                                ? 'bg-slate-800 border-slate-700 text-slate-600 grayscale' 
                                                : (canBuy 
                                                    ? 'bg-slate-700 border-green-500 text-white animate-pulse' 
                                                    : 'bg-slate-700 border-red-900/50 text-slate-400 opacity-80'))}
                                    `}
                                    style={{ left: `${skill.x}%`, top: `${skill.y}%` }}
                                >
                                    {isLocked ? <Lock size={16} /> : <skill.icon size={20} />}
                                    
                                    {!isBought && !isLocked && (
                                        <div className={`absolute -bottom-5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${canBuy ? 'bg-green-900 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                                            {skill.cost}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Selected Skill Info Panel (Fixed at Bottom) */}
                    <div className="h-40 bg-gray-950 border-t border-indigo-500/30 p-4 flex items-start gap-4 shrink-0 z-20">
                        {selectedSkill ? (
                            <>
                                <div className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center shrink-0
                                    ${gameState.purchasedSkills.includes(selectedSkill.id) 
                                        ? 'bg-purple-900/30 border-purple-500 text-purple-300' 
                                        : 'bg-slate-800 border-slate-600 text-slate-400'}`}
                                >
                                    <selectedSkill.icon size={32} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        {selectedSkill.name}
                                        {gameState.purchasedSkills.includes(selectedSkill.id) && <span className="text-xs bg-purple-900 text-purple-300 px-2 py-0.5 rounded-full">ADQUIRIDO</span>}
                                    </h3>
                                    <p className="text-sm text-gray-400 mt-1">{selectedSkill.description}</p>
                                    
                                    {!gameState.purchasedSkills.includes(selectedSkill.id) && (
                                        <div className="mt-3 flex items-center gap-4">
                                            <span className={`text-sm font-bold ${canBuySelected ? 'text-green-400' : 'text-red-400'}`}>
                                                Custo: {selectedSkill.cost} Cristais
                                            </span>
                                            <button 
                                                onClick={() => buySkill(selectedSkill.id)}
                                                disabled={!canBuySelected}
                                                className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-widest transition-all
                                                    ${canBuySelected 
                                                        ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg' 
                                                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                                            >
                                                {canBuySelected ? 'Comprar Habilidade' : (gameState.prestigeLevel < selectedSkill.cost ? 'Cristais Insuficientes' : 'Requer Habilidade Anterior')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600 italic">
                                Selecione uma habilidade na árvore para ver os detalhes.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};