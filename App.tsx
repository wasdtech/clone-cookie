
import React, { useState, useCallback, useEffect } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { BigCookie } from './components/BigCookie';
import { BuildingStore } from './components/BuildingStore';
import { UpgradesPanel } from './components/UpgradesPanel';
import { FloatingTextOverlay } from './components/FloatingText';
import { EffectTimer } from './components/EffectTimer';
import { AchievementsModal } from './components/AchievementsModal';
import { PrestigeModal } from './components/PrestigeModal';
import { FloatingText } from './types';
import { Save, Github, Trophy, Sparkles, Settings, Trash2 } from 'lucide-react';

interface BurstEffect {
    id: number;
    x: number;
    y: number;
}

const App: React.FC = () => {
  const { 
    gameState, cps, buyBuilding, buyUpgrade, manualClick, saveGame, resetGame,
    goldenCookie, clickGoldenCookie, activeEffects, isSaving, updateBakeryName,
    ascend, calculatePrestigeGain, buySkill
  } = useGameEngine();

  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [gcEffects, setGcEffects] = useState<BurstEffect[]>([]); // Estado para efeitos visuais do GC
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isPrestigeOpen, setIsPrestigeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarWidth, setSidebarWidth] = useState(350);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startResizing = useCallback(() => {
      setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
      setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
      if (isResizing) {
          const newWidth = e.clientX;
          if (newWidth > 200 && newWidth < window.innerWidth * 0.7) {
              setSidebarWidth(newWidth);
          }
      }
  }, [isResizing]);

  useEffect(() => {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      return () => {
          window.removeEventListener('mousemove', resize);
          window.removeEventListener('mouseup', stopResizing);
      };
  }, [resize, stopResizing]);

  const addFloatingText = useCallback((x: number, y: number, text: string, color?: string) => {
    const id = Date.now() + Math.random();
    setFloatingTexts((prev) => [...prev, { id, x, y, text, color }]);
  }, []);

  const handleGoldenCookieClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      const msg = clickGoldenCookie();
      
      // Visual Effects Logic
      const burstId = Date.now();
      setGcEffects(prev => [...prev, { id: burstId, x: e.clientX, y: e.clientY }]);
      // Remover efeito após a animação (1s)
      setTimeout(() => {
          setGcEffects(prev => prev.filter(eff => eff.id !== burstId));
      }, 1000);

      if (msg) addFloatingText(e.clientX, e.clientY, msg, '#ffd700');
  }

  return (
    <div className={`h-[100dvh] w-full bg-black text-white flex flex-col md:flex-row overflow-hidden font-sans relative ${isResizing ? 'cursor-col-resize select-none' : ''}`}>
      
      {/* Golden Cookie Burst Effects Layer */}
      {gcEffects.map(effect => (
          <div key={effect.id} className="fixed pointer-events-none z-[100]" style={{ left: effect.x, top: effect.y }}>
              {/* Shockwave Ring */}
              <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-4 border-amber-300 animate-[shockwave-expand_0.6s_ease-out_forwards]"></div>
              
              {/* Particles */}
              {Array.from({ length: 12 }).map((_, i) => {
                  const angle = (i / 12) * 360;
                  const rad = angle * (Math.PI / 180);
                  const distance = 100 + Math.random() * 50;
                  const tx = Math.cos(rad) * distance;
                  const ty = Math.sin(rad) * distance;
                  
                  return (
                      <div 
                        key={i}
                        className="absolute top-0 left-0 w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_10px_gold]"
                        style={{
                            '--tx': `${tx}px`,
                            '--ty': `${ty}px`,
                            animation: `particle-explode 0.8s ease-out forwards ${Math.random() * 0.1}s`
                        } as React.CSSProperties}
                      >
                         {/* Optional Star Shape inside particle */}
                         <div className="w-full h-full bg-white opacity-50 rounded-full animate-ping"></div>
                      </div>
                  );
              })}
          </div>
      ))}

      {isSaving && (
        <div className="fixed bottom-16 right-1/2 translate-x-1/2 md:right-8 md:translate-x-0 bg-green-900/90 border border-green-500 text-green-100 px-3 py-1 rounded shadow-2xl flex items-center gap-2 animate-[floatUp_0.5s_ease-out] z-[100] backdrop-blur-md text-xs">
           <Save size={12} className="animate-bounce" />
           <span className="font-bold">Salvo!</span>
        </div>
      )}

      {/* Settings Modal Simplificado */}
      {isSettingsOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-gray-800 border-2 border-indigo-600 rounded-lg shadow-2xl w-full max-w-sm p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">Configurações <Settings size={20}/></h2>
                  <p className="text-sm text-gray-400 mb-6">Gerencie seu progresso e opções do jogo.</p>
                  
                  <div className="space-y-4">
                      <button 
                        onClick={resetGame}
                        className="w-full flex items-center justify-center gap-2 bg-red-900/40 hover:bg-red-900 border border-red-500 text-red-100 py-3 rounded-lg transition-colors font-bold"
                      >
                        <Trash2 size={18} /> Apagar Tudo (Reset)
                      </button>
                      <button 
                        onClick={() => setIsSettingsOpen(false)}
                        className="w-full bg-gray-700 hover:bg-gray-600 py-2 rounded-lg transition-colors"
                      >
                        Voltar
                      </button>
                  </div>
              </div>
          </div>
      )}

      <AchievementsModal isOpen={isAchievementsOpen} onClose={() => setIsAchievementsOpen(false)} gameState={gameState} />
      <PrestigeModal isOpen={isPrestigeOpen} onClose={() => setIsPrestigeOpen(false)} gameState={gameState} calculatePrestigeGain={calculatePrestigeGain} onAscend={ascend} buySkill={buySkill} />
      <FloatingTextOverlay items={floatingTexts} onComplete={(id) => setFloatingTexts(prev => prev.filter(i => i.id !== id))} />
      <div className="absolute inset-0 bg-pattern pointer-events-none z-0"></div>

      <div 
        className="flex-none z-10 bg-gray-900 relative shadow-[5px_0_20px_rgba(0,0,0,0.6)] flex flex-col border-b md:border-b-0 md:border-r border-gray-800 pt-[var(--sat)]"
        style={!isMobile ? { width: `${sidebarWidth}px` } : { height: '38%' }}
      >
        <div className="absolute top-2 left-2 text-[10px] text-gray-500 z-50 flex gap-2 flex-wrap bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm select-none mt-[var(--sat)]">
            <span onClick={() => window.open('https://github.com/google/genai', '_blank')} className="hover:text-white cursor-pointer"><Github size={12}/></span>
            <span onClick={() => setIsAchievementsOpen(true)} className="text-amber-600 cursor-pointer hover:scale-110 transition-transform"><Trophy size={10} /></span>
            <span onClick={() => setIsPrestigeOpen(true)} className="text-purple-600 cursor-pointer hover:scale-110 transition-transform"><Sparkles size={10} /></span>
            <span onClick={() => setIsSettingsOpen(true)} className="text-indigo-400 cursor-pointer hover:scale-110 transition-transform"><Settings size={10} /></span>
            <span onClick={saveGame} className="text-green-600 cursor-pointer hover:scale-110 transition-transform"><Save size={10} /></span>
        </div>

        <EffectTimer effects={activeEffects} />

        {goldenCookie && (
            <button onClick={handleGoldenCookieClick} className="absolute w-12 h-12 md:w-16 md:h-16 z-50 cursor-pointer animate-bounce" style={{ left: `${goldenCookie.x}%`, top: `${goldenCookie.y}%`, animation: 'spin 4s linear infinite' }}>
                <div className="w-full h-full rounded-full bg-yellow-400 border-2 border-yellow-200 shadow-[0_0_20px_rgba(255,215,0,0.6)] flex items-center justify-center text-xl hover:bg-yellow-300 transition-colors">
                    🌟
                </div>
                {/* Glow behind cookie */}
                <div className="absolute inset-0 bg-yellow-500 rounded-full blur-xl opacity-50 animate-pulse -z-10"></div>
            </button>
        )}

        <BigCookie onCookieClick={manualClick} gameState={gameState} cps={cps} addFloatingText={addFloatingText} updateBakeryName={updateBakeryName} />

        {/* Resizer Handle */}
        {!isMobile && (
            <div 
              onMouseDown={startResizing}
              className={`absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-500/50 transition-colors z-50 ${isResizing ? 'bg-indigo-600' : ''}`}
            />
        )}
      </div>

      <div className="flex-1 flex flex-col h-full bg-gray-800 z-10 relative min-w-0 overflow-hidden">
        {/* Container das Melhorias com Z-INDEX ALTO para a tooltip flutuar sobre a loja */}
        <div className="h-auto z-30 shadow-xl border-b-2 border-amber-700 bg-gray-800 shrink-0">
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

        {/* Container da Loja com Z-INDEX MENOR que as melhorias */}
        <div className="flex-1 min-h-0 z-10">
          <BuildingStore gameState={gameState} buyBuilding={buyBuilding} />
        </div>

        <div className="h-8 md:h-6 bg-gray-900 border-t border-gray-700 flex items-center justify-between px-3 text-[9px] text-gray-500 shrink-0 pb-[var(--sab)]">
             <span>Auto-save: 30s</span>
             <span onClick={saveGame} className="cursor-pointer hover:text-white flex items-center gap-1">Salvar Agora <Save size={10}/></span>
        </div>
      </div>
    </div>
  );
};

export default App;
