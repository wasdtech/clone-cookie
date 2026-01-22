
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { BigCookie } from './components/BigCookie';
import { BuildingStore } from './components/BuildingStore';
import { UpgradesPanel } from './components/UpgradesPanel';
import { FloatingTextOverlay } from './components/FloatingText';
import { EffectTimer } from './components/EffectTimer';
import { AchievementsModal } from './components/AchievementsModal';
import { PrestigeModal } from './components/PrestigeModal';
import { FloatingText } from './types';
import { Save, Trash2, Github, Trophy, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const { 
    gameState, cps, buyBuilding, buyUpgrade, manualClick, resetGame, saveGame,
    goldenCookie, clickGoldenCookie, activeEffects, isSaving, updateBakeryName,
    ascend, calculatePrestigeGain, buySkill
  } = useGameEngine();

  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isPrestigeOpen, setIsPrestigeOpen] = useState(false);
  
  const [sidebarWidth, setSidebarWidth] = useState(350);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const addFloatingText = useCallback((x: number, y: number, text: string, color?: string) => {
    const id = Date.now() + Math.random();
    setFloatingTexts((prev) => [...prev, { id, x, y, text, color }]);
  }, []);

  const handleGoldenCookieClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      const msg = clickGoldenCookie();
      if (msg) addFloatingText(e.clientX, e.clientY, msg, '#ffd700');
  }

  return (
    <div className={`h-[100dvh] w-full bg-black text-white flex flex-col md:flex-row overflow-hidden font-sans relative ${isResizing ? 'select-none' : ''}`}>
      
      {isSaving && (
        <div className="fixed bottom-16 right-1/2 translate-x-1/2 md:right-8 md:translate-x-0 bg-green-900/90 border border-green-500 text-green-100 px-3 py-1 rounded shadow-2xl flex items-center gap-2 animate-[floatUp_0.5s_ease-out] z-[100] backdrop-blur-md text-xs">
           <Save size={12} className="animate-bounce" />
           <span className="font-bold">Salvo!</span>
        </div>
      )}

      <AchievementsModal isOpen={isAchievementsOpen} onClose={() => setIsAchievementsOpen(false)} gameState={gameState} />
      <PrestigeModal isOpen={isPrestigeOpen} onClose={() => setIsPrestigeOpen(false)} gameState={gameState} calculatePrestigeGain={calculatePrestigeGain} onAscend={ascend} buySkill={buySkill} />
      <FloatingTextOverlay items={floatingTexts} onComplete={(id) => setFloatingTexts(prev => prev.filter(i => i.id !== id))} />
      <div className="absolute inset-0 bg-pattern pointer-events-none z-0"></div>

      <div 
        className="flex-none z-10 bg-gray-900 relative shadow-[5px_0_20px_rgba(0,0,0,0.6)] flex flex-col border-b md:border-b-0 md:border-r border-gray-800 pt-[var(--sat)]"
        style={!isMobile ? { width: sidebarWidth } : { height: '38%' }}
      >
        <div className="absolute top-2 left-2 text-[10px] text-gray-500 z-50 flex gap-2 flex-wrap bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm select-none mt-[var(--sat)]">
            <span onClick={() => window.open('https://github.com/google/genai', '_blank')} className="hover:text-white cursor-pointer"><Github size={12}/></span>
            <span onClick={() => setIsAchievementsOpen(true)} className="text-amber-600 cursor-pointer"><Trophy size={10} /></span>
            <span onClick={() => setIsPrestigeOpen(true)} className="text-purple-600 cursor-pointer"><Sparkles size={10} /></span>
            <span onClick={saveGame} className="text-green-600 cursor-pointer"><Save size={10} /></span>
        </div>

        <EffectTimer effects={activeEffects} />

        {goldenCookie && (
            <button onClick={handleGoldenCookieClick} className="absolute w-12 h-12 md:w-16 md:h-16 z-50 cursor-pointer animate-bounce" style={{ left: `${goldenCookie.x}%`, top: `${goldenCookie.y}%`, animation: 'spin 4s linear infinite' }}>
                <div className="w-full h-full rounded-full bg-yellow-400 border-2 border-yellow-200 shadow-[0_0_20px_rgba(255,215,0,0.6)] flex items-center justify-center text-xl">🌟</div>
            </button>
        )}

        <BigCookie onCookieClick={manualClick} gameState={gameState} cps={cps} addFloatingText={addFloatingText} updateBakeryName={updateBakeryName} />
      </div>

      <div className="flex-1 flex flex-col h-full bg-gray-800 z-10 relative min-w-0 overflow-hidden">
        <div className="h-auto z-20 shadow-xl border-b-2 border-amber-700 bg-gray-800 shrink-0">
             <div className="bg-amber-950/30 text-center py-2 text-amber-500 text-base md:text-lg font-bold cookie-font tracking-widest flex justify-center relative shadow-inner border-b border-amber-900/50">
                {gameState.bakeryName.toUpperCase()}
                {gameState.prestigeLevel > 0 && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] bg-purple-900/50 px-2 py-0.5 rounded border border-purple-500/50 text-purple-200 flex items-center gap-1">
                        <Sparkles size={10} /> {gameState.prestigeLevel}
                    </div>
                )}
             </div>
             <UpgradesPanel gameState={gameState} buyUpgrade={buyUpgrade} />
        </div>

        <BuildingStore gameState={gameState} buyBuilding={buyBuilding} />

        <div className="h-8 md:h-6 bg-gray-900 border-t border-gray-700 flex items-center justify-between px-3 text-[9px] text-gray-500 shrink-0 pb-[var(--sab)]">
             <span>Auto-save: 30s</span>
             <span onClick={saveGame} className="cursor-pointer hover:text-white flex items-center gap-1">Salvar Agora <Save size={10}/></span>
        </div>
      </div>
    </div>
  );
};

export default App;
