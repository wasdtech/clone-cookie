import React, { useState, useCallback, useEffect } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { BigCookie } from './components/BigCookie';
import { BuildingStore } from './components/BuildingStore';
import { UpgradesPanel } from './components/UpgradesPanel';
import { FloatingTextOverlay } from './components/FloatingText';
import { EffectTimer } from './components/EffectTimer';
import { AchievementsModal } from './components/AchievementsModal';
import { FloatingText } from './types';
import { Save, Trash2, Github, Trophy } from 'lucide-react';

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
    updateBakeryName
  } = useGameEngine();

  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);

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
    <div className="h-screen w-full bg-black text-white flex overflow-hidden font-sans relative">
      
      {/* Save Notification Toast */}
      {isSaving && (
        <div className="fixed bottom-12 right-1/2 translate-x-1/2 md:right-8 md:translate-x-0 bg-green-900/90 border border-green-500 text-green-100 px-4 py-2 rounded shadow-2xl flex items-center gap-2 animate-[floatUp_0.5s_ease-out] z-[100] backdrop-blur-md">
           <Save size={18} className="animate-bounce" />
           <span className="font-bold">Jogo Salvo!</span>
        </div>
      )}

      {/* Achievements Modal */}
      <AchievementsModal 
         isOpen={isAchievementsOpen} 
         onClose={() => setIsAchievementsOpen(false)} 
         gameState={gameState} 
      />

      {/* Visual Effects Overlay */}
      <FloatingTextOverlay items={floatingTexts} onComplete={handleFloatingTextComplete} />
      
      {/* Background ambient particles (simplified) */}
      <div className="absolute inset-0 bg-pattern pointer-events-none z-0"></div>

      {/* Left Panel: The Cookie */}
      <div className="w-1/3 md:w-5/12 lg:w-4/12 h-full z-10 bg-gray-900 relative">
        <div className="absolute top-2 left-2 text-xs text-gray-500 z-50 hover:text-white transition-colors cursor-pointer flex gap-4 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm select-none">
            <span onClick={() => window.open('https://github.com/google/genai', '_blank')} className="flex items-center gap-1 hover:text-white text-gray-400 group" title="Ver no GitHub">
               <Github size={14} className="group-hover:scale-110 transition-transform"/>
               <span className="font-mono opacity-50">v1.2</span>
            </span>
            <span onClick={() => setIsAchievementsOpen(true)} className="flex items-center gap-1 hover:text-amber-400 text-amber-600 font-bold" title="Conquistas">
                <Trophy size={12} /> Conquistas
            </span>
            <span onClick={saveGame} className="flex items-center gap-1 hover:text-green-400 text-green-600 font-bold" title="Salvar Agora">
                <Save size={12} /> Salvar
            </span>
            <span onClick={resetGame} className="flex items-center gap-1 hover:text-red-500" title="Apagar Save">
                <Trash2 size={12} /> Reset
            </span>
        </div>

        {/* Effect Timers */}
        <EffectTimer effects={activeEffects} />

        {/* Golden Cookie */}
        {goldenCookie && (
            <button
                onClick={handleGoldenCookieClick}
                className="absolute w-24 h-24 z-50 cursor-pointer animate-bounce hover:scale-110 transition-transform"
                style={{ 
                    left: `${goldenCookie.x}%`, 
                    top: `${goldenCookie.y}%`,
                    animation: 'spin 4s linear infinite, floatUp 2s ease-in-out infinite alternate' 
                }}
            >
                <div className="w-full h-full rounded-full bg-yellow-400 border-4 border-yellow-200 shadow-[0_0_30px_rgba(255,215,0,0.6)] relative overflow-hidden">
                     {/* Shine effect */}
                     <div className="absolute inset-0 bg-white/40 animate-[shine_2s_infinite]"></div>
                     <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl">🌟</span>
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

      {/* Right Panel: Store */}
      <div className="flex-1 flex flex-col h-full bg-gray-800 z-10 relative">
        {/* Top Bar / Upgrades */}
        <div className="h-auto z-20 shadow-xl">
             <div className="bg-gray-900 text-center py-2 text-amber-500 font-bold cookie-font tracking-wider border-b border-gray-700 flex justify-center relative">
                {gameState.bakeryName.toUpperCase()}
             </div>
             <UpgradesPanel gameState={gameState} buyUpgrade={buyUpgrade} />
        </div>

        {/* Buildings List */}
        <BuildingStore gameState={gameState} buyBuilding={buyBuilding} />

        {/* Bottom decorative bar */}
        <button 
          onClick={saveGame}
          className="h-8 bg-gray-900 border-t border-gray-700 flex items-center justify-between px-4 text-xs text-gray-500 hover:bg-gray-800 transition-colors cursor-pointer w-full"
          title="Clique para Salvar Manualmente"
        >
             <span>Salvamento Automático (a cada 30s)</span>
             <div className="flex items-center gap-2">
                 <span>Salvar Agora</span>
                 <Save size={14} className={`${isSaving ? 'text-green-400 animate-spin' : 'text-gray-600'}`}/>
             </div>
        </button>
      </div>
    </div>
  );
};

export default App;