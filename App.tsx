import React, { useState, useCallback, useRef } from 'react';
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
    gameState, 
    cps, 
    buyBuilding, 
    buyUpgrade, 
    manualClick, 
    resetGame,
    saveGame,
    goldenCookie,
    clickGoldenCookie,
    activeEffects,
    isSaving,
    updateBakeryName,
    ascend,
    calculatePrestigeGain
  } = useGameEngine();

  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isPrestigeOpen, setIsPrestigeOpen] = useState(false);
  
  // Resizable Sidebar Logic
  const [sidebarWidth, setSidebarWidth] = useState(300); // Initial width
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';

    const doResize = (e: MouseEvent) => {
        // Limits: Min 220px, Max 600px
        const newWidth = Math.max(220, Math.min(600, e.clientX));
        setSidebarWidth(newWidth);
    };

    const stopResizing = () => {
        setIsResizing(false);
        document.body.style.cursor = '';
        document.removeEventListener('mousemove', doResize);
        document.removeEventListener('mouseup', stopResizing);
    };

    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResizing);
  }, []);

  const addFloatingText = useCallback((x: number, y: number, text: string, color?: string) => {
    const id = Date.now() + Math.random();
    setFloatingTexts((prev) => [...prev, { id, x, y, text, color }]);
  }, []);

  const handleFloatingTextComplete = useCallback((id: number) => {
    setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleGoldenCookieClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      const msg = clickGoldenCookie();
      if (msg) {
          addFloatingText(e.clientX, e.clientY, msg, '#ffd700');
      }
  }

  return (
    <div 
      className={`h-screen w-full bg-black text-white flex overflow-hidden font-sans relative ${isResizing ? 'select-none' : ''}`}
    >
      
      {/* Save Notification Toast */}
      {isSaving && (
        <div className="fixed bottom-12 right-1/2 translate-x-1/2 md:right-8 md:translate-x-0 bg-green-900/90 border border-green-500 text-green-100 px-3 py-1 rounded shadow-2xl flex items-center gap-2 animate-[floatUp_0.5s_ease-out] z-[100] backdrop-blur-md text-sm">
           <Save size={14} className="animate-bounce" />
           <span className="font-bold">Jogo Salvo!</span>
        </div>
      )}

      {/* Modals */}
      <AchievementsModal 
         isOpen={isAchievementsOpen} 
         onClose={() => setIsAchievementsOpen(false)} 
         gameState={gameState} 
      />

      <PrestigeModal
          isOpen={isPrestigeOpen}
          onClose={() => setIsPrestigeOpen(false)}
          gameState={gameState}
          calculatePrestigeGain={calculatePrestigeGain}
          onAscend={ascend}
      />

      {/* Visual Effects Overlay */}
      <FloatingTextOverlay items={floatingTexts} onComplete={handleFloatingTextComplete} />
      
      {/* Background ambient particles (simplified) */}
      <div className="absolute inset-0 bg-pattern pointer-events-none z-0"></div>

      {/* Left Panel: The Cookie (Resizable) */}
      <div 
        ref={sidebarRef}
        className="flex-none h-full z-10 bg-gray-900 relative shadow-[5px_0_20px_rgba(0,0,0,0.6)] flex flex-col border-r border-gray-800"
        style={{ width: sidebarWidth }}
      >
        <div className="absolute top-2 left-2 text-[10px] text-gray-500 z-50 hover:text-white transition-colors cursor-pointer flex gap-2 flex-wrap bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm select-none">
            <span onClick={() => window.open('https://github.com/google/genai', '_blank')} className="flex items-center gap-1 hover:text-white text-gray-400 group" title="Ver no GitHub">
               <Github size={12} className="group-hover:scale-110 transition-transform"/>
            </span>
            <span onClick={() => setIsAchievementsOpen(true)} className="flex items-center gap-1 hover:text-amber-400 text-amber-600 font-bold" title="Conquistas">
                <Trophy size={10} />
            </span>
            <span onClick={() => setIsPrestigeOpen(true)} className="flex items-center gap-1 hover:text-purple-400 text-purple-600 font-bold" title="Ascensão">
                <Sparkles size={10} />
            </span>
            <span onClick={saveGame} className="flex items-center gap-1 hover:text-green-400 text-green-600 font-bold" title="Salvar Agora">
                <Save size={10} />
            </span>
            <span onClick={resetGame} className="flex items-center gap-1 hover:text-red-500" title="Hard Reset (Apaga tudo)">
                <Trash2 size={10} />
            </span>
        </div>

        {/* Effect Timers */}
        <EffectTimer effects={activeEffects} />

        {/* Golden Cookie */}
        {goldenCookie && (
            <button
                onClick={handleGoldenCookieClick}
                className="absolute w-16 h-16 z-50 cursor-pointer animate-bounce hover:scale-110 transition-transform"
                style={{ 
                    left: `${goldenCookie.x}%`, 
                    top: `${goldenCookie.y}%`,
                    animation: 'spin 4s linear infinite, floatUp 2s ease-in-out infinite alternate' 
                }}
            >
                <div className="w-full h-full rounded-full bg-yellow-400 border-2 border-yellow-200 shadow-[0_0_20px_rgba(255,215,0,0.6)] relative overflow-hidden">
                     <div className="absolute inset-0 bg-white/40 animate-[shine_2s_infinite]"></div>
                     <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl">🌟</span>
                </div>
            </button>
        )}

        <BigCookie 
            onCookieClick={manualClick} 
            gameState={gameState} 
            cps={cps} 
            addFloatingText={addFloatingText}
            updateBakeryName={updateBakeryName}
        />
      </div>

      {/* Resizer Handle */}
      <div
        className={`w-1.5 h-full cursor-col-resize z-50 flex items-center justify-center transition-colors hover:bg-blue-500 active:bg-blue-600 ${isResizing ? 'bg-blue-600' : 'bg-black/50 hover:bg-gray-600'}`}
        onMouseDown={startResizing}
      >
          {/* Visual Grip dots */}
          <div className="flex flex-col gap-1 opacity-50 pointer-events-none">
              <div className="w-0.5 h-0.5 bg-gray-400 rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-gray-400 rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-gray-400 rounded-full"></div>
          </div>
      </div>

      {/* Right Panel: Store (Área Vermelha - Flex-1 ocupa todo o resto) */}
      <div className="flex-1 flex flex-col h-full bg-gray-800 z-10 relative min-w-0">
        {/* Top Bar / Upgrades (Área Laranja) */}
        <div className="h-auto z-20 shadow-xl border-b-2 border-amber-700 bg-gray-800 shrink-0">
             <div className="bg-amber-950/30 text-center py-2 text-amber-500 text-lg font-bold cookie-font tracking-widest flex justify-center relative shadow-inner border-b border-amber-900/50">
                {gameState.bakeryName.toUpperCase()}
                {gameState.prestigeLevel > 0 && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] bg-purple-900/50 px-2 py-0.5 rounded border border-purple-500/50 text-purple-200 flex items-center gap-1" title="Nível de Ascensão">
                        <Sparkles size={10} /> {gameState.prestigeLevel}
                    </div>
                )}
             </div>
             <UpgradesPanel gameState={gameState} buyUpgrade={buyUpgrade} />
        </div>

        {/* Buildings List (Área Azul) */}
        <BuildingStore gameState={gameState} buyBuilding={buyBuilding} />

        {/* Bottom decorative bar */}
        <button 
          onClick={saveGame}
          className="h-6 bg-gray-900 border-t border-gray-700 flex items-center justify-between px-3 text-[10px] text-gray-500 hover:bg-gray-800 transition-colors cursor-pointer w-full shrink-0"
          title="Clique para Salvar Manualmente"
        >
             <span>Auto-save: 30s</span>
             <div className="flex items-center gap-1">
                 <span>Salvar Agora</span>
                 <Save size={10} className={`${isSaving ? 'text-green-400 animate-spin' : 'text-gray-600'}`}/>
             </div>
        </button>
      </div>
    </div>
  );
};

export default App;