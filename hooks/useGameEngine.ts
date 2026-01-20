import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, GoldenCookieState, ActiveEffect, Achievement } from '../types';
import { BUILDINGS, UPGRADES, ACHIEVEMENTS, INITIAL_STATE } from '../constants';

const SAVE_KEY = 'biscoito_clicker_save_v1';

export const useGameEngine = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [cps, setCps] = useState(0);
  const [clickValue, setClickValue] = useState(1);
  const [goldenCookie, setGoldenCookie] = useState<GoldenCookieState | null>(null);
  const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);
  const [notificationQueue, setNotificationQueue] = useState<Achievement[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Refs for stable access in intervals
  const gameStateRef = useRef(gameState);
  const goldenCookieTimer = useRef(0);
  const autoSaveTimer = useRef(0);

  // Update ref when state changes
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Calculate current production stats
  const calculateStats = useCallback((state: GameState, effects: typeof activeEffects) => {
    let newCps = 0;
    
    // Base CpS from buildings
    BUILDINGS.forEach((b) => {
      let buildingCps = b.baseCps;
      const count = state.buildings[b.id] || 0;
      
      // Apply building upgrades
      state.upgrades.forEach((uId) => {
        const upgrade = UPGRADES.find(u => u.id === uId);
        if (upgrade?.type === 'building' && upgrade.targetId === b.id) {
          buildingCps *= upgrade.multiplier;
        }
      });

      newCps += buildingCps * count;
    });

    // Apply global upgrades
    state.upgrades.forEach((uId) => {
      const upgrade = UPGRADES.find(u => u.id === uId);
      if (upgrade?.type === 'global') {
        newCps *= upgrade.multiplier;
      }
    });

    // Base Click Value
    let newClickValue = 1;
    // Apply Click Upgrades
    state.upgrades.forEach((uId) => {
        const upgrade = UPGRADES.find(u => u.id === uId);
        if (upgrade?.type === 'click') {
            newClickValue *= upgrade.multiplier;
        }
    });

    // Apply Active Golden Cookie Effects
    effects.forEach(effect => {
      if (effect.type === 'frenzy') {
        newCps *= effect.multiplier;
      }
      if (effect.type === 'clickfrenzy') {
        newClickValue *= effect.multiplier;
      }
    });

    return { calculatedCps: newCps, calculatedClickValue: newClickValue };
  }, []);

  // Initialize & Load Save
  useEffect(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      try {
        const parsed: GameState = JSON.parse(saved);
        // Migration: Ensure new fields exist
        if (!parsed.achievements) parsed.achievements = [];
        if (!parsed.manualClicks) parsed.manualClicks = 0;
        if (!parsed.bakeryName) parsed.bakeryName = "Padaria do Jogador";

        // Calculate offline progress
        const now = Date.now();
        const secondsOffline = (now - parsed.lastSaveTime) / 1000;
        
        // Need to calculate CpS for offline earnings
        let offlineCps = 0;
        BUILDINGS.forEach((b) => {
           let bCps = b.baseCps;
           // Naive check for upgrades on load to calculate offline
           parsed.upgrades.forEach(uId => {
             const u = UPGRADES.find(up => up.id === uId);
             if (u?.type === 'building' && u.targetId === b.id) bCps *= u.multiplier;
             if (u?.type === 'global') offlineCps *= u.multiplier; 
           });
           offlineCps += bCps * (parsed.buildings[b.id] || 0);
        });

        if (secondsOffline > 60) {
            const earned = offlineCps * secondsOffline * 0.5; // 50% efficiency offline
            parsed.cookies += earned;
            parsed.totalCookies += earned;
        }
        
        setGameState({ ...parsed, lastSaveTime: now });
      } catch (e) {
        console.error("Save file corrupted", e);
        // Fallback if safe fails significantly
        setGameState(INITIAL_STATE);
      }
    }
  }, []);

  // UPDATE TITLE WITH COOKIE COUNT
  useEffect(() => {
    const count = Math.floor(gameState.cookies).toLocaleString();
    document.title = `${count} biscoitos - Biscoito Clicker`;
  }, [gameState.cookies]);

  // SAVE ON WINDOW CLOSE/RELOAD
  useEffect(() => {
    const handleUnload = () => {
        // Use ref to get the absolute latest state without triggering re-renders
        localStorage.setItem(SAVE_KEY, JSON.stringify(gameStateRef.current));
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  // Manual Save Function
  const saveGame = useCallback(() => {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(gameStateRef.current));
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 2000);
    } catch (e) {
        console.error("Failed to save game", e);
    }
  }, []);

  // Main Game Loop (10 ticks per second)
  useEffect(() => {
    const tickRate = 100; // ms
    const interval = setInterval(() => {
      const now = Date.now();

      // Filter expired effects
      setActiveEffects(prev => prev.filter(e => e.endTime > now));

      const { calculatedCps, calculatedClickValue } = calculateStats(gameState, activeEffects);
      setCps(calculatedCps);
      setClickValue(calculatedClickValue);

      setGameState((prev) => {
        const cookiesEarned = calculatedCps / (1000 / tickRate);
        const newState = {
          ...prev,
          cookies: prev.cookies + cookiesEarned,
          totalCookies: prev.totalCookies + cookiesEarned,
          lastSaveTime: now,
        };

        // Check Achievements
        const newAchievements: string[] = [];
        ACHIEVEMENTS.forEach(ach => {
            if (!newState.achievements.includes(ach.id) && ach.trigger(newState)) {
                newAchievements.push(ach.id);
                setNotificationQueue(q => [...q, ach]);
            }
        });
        
        if (newAchievements.length > 0) {
            newState.achievements = [...newState.achievements, ...newAchievements];
        }

        return newState;
      });

      // Golden Cookie Logic
      if (!goldenCookie) { 
         // Fixed timer for golden cookie spawn (150 seconds = 150000ms)
         goldenCookieTimer.current += tickRate;
         if (goldenCookieTimer.current >= 150000) {
             spawnGoldenCookie();
             goldenCookieTimer.current = 0;
         }
      } else {
         // Reset timer while active
         goldenCookieTimer.current = 0;

         setGoldenCookie(prev => {
            if (!prev) return null;
            if (prev.life <= 0) return null;
            return { ...prev, life: prev.life - (tickRate/1000) };
         });
      }

      // Auto Save Logic (Integrated into game loop)
      autoSaveTimer.current += tickRate;
      if (autoSaveTimer.current >= 30000) { // Every 30 seconds
          saveGame();
          autoSaveTimer.current = 0;
      }

    }, tickRate);

    return () => clearInterval(interval);
  }, [gameState.buildings, gameState.upgrades, activeEffects, goldenCookie, calculateStats, saveGame]);

  const spawnGoldenCookie = () => {
     const typeRoll = Math.random();
     const type = typeRoll > 0.9 ? 'clickfrenzy' : (typeRoll > 0.5 ? 'frenzy' : 'lucky');
     
     setGoldenCookie({
        active: true,
        x: Math.random() * 80 + 10, // 10% to 90%
        y: Math.random() * 80 + 10,
        type: type as any,
        life: 13, // seconds
     });
  };

  const clickGoldenCookie = () => {
    if (!goldenCookie) return;
    
    let message = "";
    const now = Date.now();

    if (goldenCookie.type === 'lucky') {
        const gain = Math.min(gameState.cookies * 0.15 + 13, cps * 900 + 13);
        setGameState(prev => ({
            ...prev,
            cookies: prev.cookies + gain,
            totalCookies: prev.totalCookies + gain
        }));
        message = `Sortudo! +${Math.floor(gain)} cookies`;
    } else if (goldenCookie.type === 'frenzy') {
        const duration = 50000;
        setActiveEffects(prev => [...prev, { 
            type: 'frenzy', 
            label: 'Frenesi (x15 CpS)',
            multiplier: 15,
            endTime: now + duration,
            duration: duration
        }]);
        message = "Frenesi! Produção x15 por 50s";
    } else if (goldenCookie.type === 'clickfrenzy') {
        const duration = 13000;
        setActiveEffects(prev => [...prev, { 
            type: 'clickfrenzy', 
            label: 'Click Frenesi (x777)',
            multiplier: 777, 
            endTime: now + duration,
            duration: duration
        }]);
        message = "Poder de Clique! Cliques x777 por 13s";
    }

    setGoldenCookie(null);
    return message;
  };

  const buyBuilding = (buildingId: string) => {
    const building = BUILDINGS.find((b) => b.id === buildingId);
    if (!building) return;

    const currentCount = gameState.buildings[buildingId] || 0;
    const price = Math.floor(building.baseCost * Math.pow(1.15, currentCount));

    if (gameState.cookies >= price) {
      setGameState((prev) => ({
        ...prev,
        cookies: prev.cookies - price,
        buildings: {
          ...prev.buildings,
          [buildingId]: currentCount + 1,
        },
      }));
    }
  };

  const buyUpgrade = (upgradeId: string) => {
    const upgrade = UPGRADES.find((u) => u.id === upgradeId);
    if (!upgrade) return;

    if (gameState.cookies >= upgrade.cost && !gameState.upgrades.includes(upgradeId)) {
      setGameState((prev) => ({
        ...prev,
        cookies: prev.cookies - upgrade.cost,
        upgrades: [...prev.upgrades, upgradeId],
      }));
    }
  };

  const updateBakeryName = (name: string) => {
      setGameState(prev => ({
          ...prev,
          bakeryName: name
      }));
  };

  const manualClick = () => {
    setGameState((prev) => ({
      ...prev,
      cookies: prev.cookies + clickValue,
      totalCookies: prev.totalCookies + clickValue,
      manualClicks: (prev.manualClicks || 0) + 1,
    }));
    return clickValue;
  };

  const resetGame = () => {
      if(confirm("Tem certeza que deseja apagar todo o progresso?")) {
          localStorage.removeItem(SAVE_KEY);
          setGameState(INITIAL_STATE);
          window.location.reload();
      }
  }

  const dismissNotification = (id: string) => {
      setNotificationQueue(prev => prev.filter(n => n.id !== id));
  }

  return {
    gameState,
    cps,
    clickValue,
    activeEffects,
    notificationQueue,
    isSaving,
    saveGame,
    dismissNotification,
    buyBuilding,
    buyUpgrade,
    manualClick,
    resetGame,
    goldenCookie,
    clickGoldenCookie,
    updateBakeryName
  };
};
