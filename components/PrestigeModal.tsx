
import React, { useState, useRef, useEffect } from 'react';
import { GameState } from '../types';
import { SKILLS } from '../constants';
import { Sparkles, X, Lock, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  calculatePrestigeGain: (lifetime: number) => number;
  onAscend: () => void;
  buySkill: (id: string) => void;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

export const PrestigeModal: React.FC<Props> = ({ isOpen, onClose, gameState, calculatePrestigeGain, onAscend, buySkill }) => {
  const [activeTab, setActiveTab] = useState<'ascend' | 'tree'>('ascend');
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  
  // Transform State for Pan & Zoom
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 0.5 }); // Scale ajustado para 0.5 para ver mais da árvore
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize view: focus on the bottom (starting point)
  useEffect(() => {
    if (activeTab === 'tree' && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Centralizar na árvore (2500px de largura)
        // Árvore tem 4000px de altura. Queremos focar no fundo (y~100%).
        const initialScale = 0.5;
        setTransform({
            x: (rect.width / 2) - ((2500 * initialScale) / 2), // Centraliza horizontalmente o canvas da árvore
            y: rect.height - (4000 * initialScale) + 50, // Foca na parte inferior
            scale: initialScale
        });
    }
  }, [activeTab]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTab !== 'tree') return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || activeTab !== 'tree') return;
    setTransform(prev => ({
      ...prev,
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    }));
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    if (activeTab !== 'tree') return;
    const delta = -e.deltaY;
    const factor = delta > 0 ? 1.1 : 0.9;
    const newScale = Math.min(Math.max(transform.scale * factor, 0.15), 2);

    // Zoom towards mouse position
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newX = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
    const newY = mouseY - (mouseY - transform.y) * (newScale / transform.scale);

    setTransform({ x: newX, y: newY, scale: newScale });
  };

  const adjustZoom = (factor: number) => {
    setTransform(prev => {
        const newScale = Math.min(Math.max(prev.scale * factor, 0.15), 2);
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return prev;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const newX = centerX - (centerX - prev.x) * (newScale / prev.scale);
        const newY = centerY - (centerY - prev.y) * (newScale / prev.scale);
        return { x: newX, y: newY, scale: newScale };
    });
  };

  const resetView = () => {
    if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const initialScale = 0.5;
        setTransform({
            x: (rect.width / 2) - ((2500 * initialScale) / 2),
            y: rect.height - (4000 * initialScale) + 50,
            scale: initialScale
        });
    }
  };

  if (!isOpen) return null;

  const spentOnSkills = gameState.purchasedSkills.reduce((acc, skillId) => {
      const s = SKILLS.find(sk => sk.id === skillId);
      return acc + (s ? s.cost : 0);
  }, 0);
  const totalOwned = gameState.prestigeLevel + spentOnSkills;
  const potentialLevel = calculatePrestigeGain(gameState.lifetimeCookies);
  const levelsToGain = Math.max(0, potentialLevel - totalOwned);
  
  // FIX: Atualizado para 10.000.000 para corresponder ao hook useGameEngine
  const PRESTIGE_DIVISOR = 10000000;
  const nextLevelRaw = potentialLevel + 1;
  const nextLevelCookiesReq = Math.pow(nextLevelRaw, 2) * PRESTIGE_DIVISOR;
  const currentLevelCookiesReq = Math.pow(potentialLevel, 2) * PRESTIGE_DIVISOR;
  
  // Prevenir divisão por zero ou números negativos no primeiro nível
  const denominator = nextLevelCookiesReq - currentLevelCookiesReq;
  const progress = denominator > 0 
    ? Math.min(100, Math.max(0, ((gameState.lifetimeCookies - currentLevelCookiesReq) / denominator) * 100))
    : 0;

  const selectedSkill = selectedSkillId ? SKILLS.find(s => s.id === selectedSkillId) : null;
  const canBuySelected = selectedSkill ? (!gameState.purchasedSkills.includes(selectedSkill.id) && (!selectedSkill.parent || gameState.purchasedSkills.includes(selectedSkill.parent)) && gameState.prestigeLevel >= selectedSkill.cost) : false;

  const crystalBonusPerLevel = gameState.purchasedSkills.includes('cookie_galaxy') ? 2 : 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md md:p-4">
      <div className="bg-gradient-to-br from-indigo-950 to-slate-950 md:border-2 md:border-indigo-500/50 md:rounded-xl shadow-2xl w-full md:max-w-6xl h-full md:h-[95vh] flex flex-col relative overflow-hidden">
        
        {/* Header / Tabs */}
        <div className="flex justify-between items-center p-3 md:p-4 border-b border-indigo-500/30 bg-black/60 z-30 shrink-0 safe-top">
            <div className="flex gap-2 md:gap-4">
                <button 
                    onClick={() => setActiveTab('ascend')}
                    className={`px-3 py-2 rounded-lg font-bold uppercase text-[10px] md:text-xs tracking-widest transition-all ${activeTab === 'ascend' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'hover:bg-indigo-900/30 text-indigo-300'}`}
                >
                    Reencarnação
                </button>
                <button 
                    onClick={() => setActiveTab('tree')}
                    className={`px-3 py-2 rounded-lg font-bold uppercase text-[10px] md:text-xs tracking-widest transition-all ${activeTab === 'tree' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]' : 'hover:bg-purple-900/30 text-purple-300'}`}
                >
                    Árvore Cósmica
                </button>
            </div>
            <div className="flex items-center gap-2">
                 <div className="flex flex-col items-end mr-2">
                    <span className="text-[9px] md:text-[10px] text-indigo-400 uppercase font-bold tracking-tighter">Seus Cristais</span>
                    <span className="text-lg md:text-xl font-bold text-white flex items-center gap-1">
                        {gameState.prestigeLevel} <Sparkles size={14} className="text-purple-400 animate-pulse" />
                    </span>
                 </div>
                 <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-indigo-300">
                    <X size={24} />
                 </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
            
            {activeTab === 'ascend' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in-95 p-6 overflow-y-auto">
                    <Sparkles size={64} className="text-indigo-400 mb-6 animate-pulse md:w-20 md:h-20" />
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-2 font-serif tracking-tighter drop-shadow-lg">ASCENSÃO</h2>
                    <p className="text-indigo-200 text-xs md:text-sm mb-8 max-w-md opacity-80 leading-relaxed">
                        Ao ascender, você renasce com Cristais Cósmicos permanentes.
                    </p>

                    <div className="bg-black/60 rounded-2xl p-6 md:p-10 w-full max-w-md border-2 border-indigo-500/20 mb-8 backdrop-blur-xl shadow-inner">
                        {levelsToGain > 0 ? (
                            <>
                                <div className="text-indigo-300 uppercase text-[10px] font-bold tracking-widest mb-2">Prestígio disponível</div>
                                <div className="text-5xl md:text-7xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] mb-4">
                                    +{levelsToGain}
                                </div>
                                <div className="text-[11px] md:text-xs text-green-400 font-mono mb-8 bg-green-950/30 py-2 px-4 rounded-full inline-block">
                                    Bônus: +{(gameState.prestigeLevel + levelsToGain) * crystalBonusPerLevel}% CpS Global
                                </div>
                                <button 
                                    onClick={() => { onAscend(); onClose(); }}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-4 md:py-5 rounded-xl font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(79,70,229,0.4)] transition-all transform hover:-translate-y-1 active:scale-95"
                                >
                                    Ascender Agora
                                </button>
                            </>
                        ) : (
                            <div className="py-6">
                                <div className="text-gray-400 italic mb-6 text-sm">Energia insuficiente...</div>
                                <div className="w-full h-4 bg-gray-900 rounded-full overflow-hidden relative border border-white/5">
                                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_15px_rgba(99,102,241,0.6)] transition-all duration-700" style={{ width: `${progress}%` }} />
                                </div>
                                <div className="text-[10px] text-indigo-400 mt-3 font-bold uppercase tracking-widest">{Math.floor(progress)}% para o próximo cristal</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'tree' && (
                <div className="w-full h-full flex flex-col relative">
                    
                    {/* Zoom Controls UI */}
                    <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
                        <button onClick={() => adjustZoom(1.2)} className="w-10 h-10 bg-black/60 border border-indigo-500/40 rounded-full flex items-center justify-center text-white hover:bg-indigo-600 transition-colors shadow-lg backdrop-blur-md"><ZoomIn size={20} /></button>
                        <button onClick={() => adjustZoom(0.8)} className="w-10 h-10 bg-black/60 border border-indigo-500/40 rounded-full flex items-center justify-center text-white hover:bg-indigo-600 transition-colors shadow-lg backdrop-blur-md"><ZoomOut size={20} /></button>
                        <button onClick={resetView} className="w-10 h-10 bg-black/60 border border-indigo-500/40 rounded-full flex items-center justify-center text-white hover:bg-indigo-600 transition-colors shadow-lg backdrop-blur-md"><Maximize size={20} /></button>
                        <div className="mt-2 text-[10px] font-bold text-center bg-black/40 py-1 rounded-full text-indigo-300">{Math.round(transform.scale * 100)}%</div>
                    </div>

                    <div 
                        ref={containerRef}
                        className="flex-1 relative bg-slate-950 overflow-hidden cursor-move touch-none"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onWheel={handleWheel}
                    >
                        {/* THE TREE CANVAS with Transform */}
                        <div 
                            className="absolute transition-transform duration-75 ease-out origin-top-left"
                            style={{ 
                                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                                width: '2500px', 
                                height: '4000px' 
                            }}
                        >
                            {/* Background Atmosphere */}
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
                            
                            {/* Connections (SVG layer) */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                                <defs>
                                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="3" result="blur" />
                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                    </filter>
                                </defs>
                                {SKILLS.map(skill => {
                                    if (!skill.parent) return null;
                                    const parent = SKILLS.find(s => s.id === skill.parent);
                                    if (!parent) return null;
                                    
                                    const isBought = gameState.purchasedSkills.includes(skill.id);
                                    const isParentBought = gameState.purchasedSkills.includes(parent.id);
                                    
                                    return (
                                        <g key={`line-group-${skill.id}`}>
                                            <line 
                                                x1={`${parent.x}%`} y1={`${parent.y}%`}
                                                x2={`${skill.x}%`} y2={`${skill.y}%`}
                                                stroke={isBought ? "#a855f7" : (isParentBought ? "#4f46e5" : "#1e293b")}
                                                strokeWidth={isBought ? "4" : "2"}
                                                strokeDasharray={isBought ? "0" : "8,8"}
                                                filter={isBought ? "url(#glow)" : ""}
                                                opacity={isBought ? 0.8 : 0.4}
                                            />
                                        </g>
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
                                        onMouseDown={(e) => e.stopPropagation()} // Prevent dragging when clicking a skill
                                        onClick={(e) => { e.stopPropagation(); setSelectedSkillId(skill.id); }}
                                        className={`
                                            absolute -translate-x-1/2 -translate-y-1/2 z-10 w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all duration-300
                                            ${isSelected ? 'scale-125 ring-8 ring-white/20 z-20' : 'hover:scale-110 active:scale-95'}
                                            ${isBought 
                                                ? 'bg-gradient-to-br from-purple-500 to-indigo-600 border-purple-200 text-white shadow-[0_0_25px_rgba(168,85,247,0.5)]' 
                                                : (isLocked 
                                                    ? 'bg-slate-900 border-slate-800 text-slate-700 grayscale' 
                                                    : (canBuy 
                                                        ? 'bg-slate-800 border-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
                                                        : 'bg-slate-800 border-red-900 text-slate-500 opacity-60'))}
                                        `}
                                        style={{ left: `${skill.x}%`, top: `${skill.y}%` }}
                                    >
                                        {isLocked ? <Lock size={20} className="opacity-40" /> : <skill.icon size={28} />}
                                        
                                        {!isBought && !isLocked && (
                                            <div className={`absolute -bottom-8 text-xs font-black px-2 py-0.5 rounded-md shadow-md ${canBuy ? 'bg-green-600 text-white' : 'bg-red-950 text-red-400'}`}>
                                                {skill.cost}
                                            </div>
                                        )}
                                        {isBought && <div className="absolute -top-1 -right-1 bg-purple-400 w-5 h-5 rounded-full border border-white flex items-center justify-center text-[10px] text-white">✓</div>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Selected Skill Info Panel */}
                    <div className="h-auto min-h-[160px] md:h-44 bg-slate-950 border-t-2 border-indigo-500/40 p-4 md:p-6 flex flex-col md:flex-row items-center gap-4 md:gap-8 shrink-0 z-40 backdrop-blur-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)] safe-bottom">
                        {selectedSkill ? (
                            <>
                                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 flex items-center justify-center shrink-0 shadow-lg
                                    ${gameState.purchasedSkills.includes(selectedSkill.id) 
                                        ? 'bg-purple-900/40 border-purple-400 text-purple-300 shadow-purple-500/20' 
                                        : 'bg-slate-900 border-slate-700 text-slate-500'}`}
                                >
                                    <selectedSkill.icon size={32} className="md:w-10 md:h-10" />
                                </div>

                                <div className="flex-1 w-full text-center md:text-left">
                                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 mb-2">
                                        <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">{selectedSkill.name}</h3>
                                        {gameState.purchasedSkills.includes(selectedSkill.id) && (
                                            <span className="text-[10px] font-black bg-purple-900/80 text-purple-200 px-3 py-1 rounded-full border border-purple-500/50 uppercase tracking-widest self-center">Conquistado</span>
                                        )}
                                    </div>
                                    <p className="text-xs md:text-sm text-indigo-200/70 max-w-2xl leading-relaxed">{selectedSkill.description}</p>
                                </div>

                                {!gameState.purchasedSkills.includes(selectedSkill.id) && (
                                    <div className="flex flex-col items-center md:items-end gap-3 shrink-0">
                                        <div className={`text-sm font-black flex items-center gap-2 ${canBuySelected ? 'text-green-400' : 'text-red-400'}`}>
                                            Custo: {selectedSkill.cost} <Sparkles size={14} />
                                        </div>
                                        <button 
                                            onClick={() => buySkill(selectedSkill.id)}
                                            disabled={!canBuySelected}
                                            className={`px-8 py-3 rounded-xl text-xs md:text-sm font-black uppercase tracking-widest transition-all
                                                ${canBuySelected 
                                                    ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/40 transform hover:-translate-y-1' 
                                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'}`}
                                        >
                                            {canBuySelected ? 'Comprar Habilidade' : (gameState.prestigeLevel < selectedSkill.cost ? 'Energia Insuficiente' : 'Bloqueado')}
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-indigo-400/40 gap-2">
                                <Maximize size={32} className="opacity-20 mb-2" />
                                <p className="italic text-sm font-bold uppercase tracking-widest">Arraste para navegar • Use o scroll para Zoom</p>
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
