import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, GoldenCookieState, ActiveEffect, Achievement } from '../types';
import { BUILDINGS, UPGRADES, ACHIEVEMENTS, INITIAL_STATE } from '../constants';

const SAVE_KEY = 'biscoito_clicker_save_v2'; // Changed key to force reset/migration or handle appropriately

export const useGameEngine = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [cps, setCps] = useState(0);
  const [clickValue, setClickValue] = useState(1);
  const [goldenCookie, setGoldenCookie] = useState<GoldenCookieState | null>(null);
  const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);
  const [notificationQueue, setNotificationQueue] = useState<Achievement[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const gameStateRef = useRef(gameState);
  const activeEffectsRef = useRef(activeEffects);
  const goldenCookieTimerRef = useRef(0);
  const autoSaveTimerRef = useRef(0);
  const lastTickRef = useRef(Date.now());

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    activeEffectsRef.current = activeEffects;
  }, [activeEffects]);

  const calculateStats = useCallback((state: GameState, effects: ActiveEffect[]) => {
    let newCps = 0;
    
    // Base Calculation
    BUILDINGS.forEach((b) => {
      let buildingCps = b.baseCps;
      const count = state.buildings[b.id] || 0;
      
      state.upgrades.forEach((uId) => {
        const upgrade = UPGRADES.find(u => u.id === uId);
        if (upgrade?.type === 'building' && upgrade.targetId === b.id) {
          buildingCps *= upgrade.multiplier;
        }
      });

      newCps += buildingCps * count;
    });

    // Global Upgrades
    state.upgrades.forEach((uId) => {
      const upgrade = UPGRADES.find(u => u.id === uId);
      if (upgrade?.type === 'global') {
        newCps *= upgrade.multiplier;
      }
    });

    // Prestige Bonus (5% per level)
    const prestigeMultiplier = 1 + (state.prestigeLevel * 0.05);
    newCps *= prestigeMultiplier;

    // Click Value
    let newClickValue = 1;
    // Base click depends on CpS slightly to avoid becoming obsolete?
    // Let's keep it upgrading via Upgrades primarily, but add 1% of CpS to click
    newClickValue += newCps * 0.01;

    state.upgrades.forEach((uId) => {
        const upgrade = UPGRADES.find(u => u.id === uId);
        if (upgrade?.type === 'click') {
            newClickValue *= upgrade.multiplier;
        }
    });
    
    newClickValue *= prestigeMultiplier;

    // Active Effects (Temporary)
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

  useEffect(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      try {
        const parsed: GameState = JSON.parse(saved);
        // Migration logic for old saves
        if (typeof parsed.prestigeLevel === 'undefined') parsed.prestigeLevel = 0;
        if (typeof parsed.lifetimeCookies === 'undefined') parsed.lifetimeCookies = parsed.totalCookies;
        
        const now = Date.now();
        const secondsOffline = (now - parsed.lastSaveTime) / 1000;
        
        const stats = calculateStats(parsed, []);
        if (secondsOffline > 60) {
            // Cap offline earnings to 24 hours to prevent massive overflow exploits
            const effectiveSeconds = Math.min(secondsOffline, 86400); 
            const earned = stats.calculatedCps * effectiveSeconds * 0.5; // 50% efficiency offline
            parsed.cookies += earned;
            parsed.totalCookies += earned;
            parsed.lifetimeCookies += earned;
        }
        
        setGameState({ ...parsed, lastSaveTime: now });
      } catch (e) {
        console.error("Erro ao carregar save", e);
        setGameState(INITIAL_STATE);
      }
    }
    lastTickRef.current = Date.now();
  }, [calculateStats]);

  const saveGame = useCallback(() => {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(gameStateRef.current));
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 2000);
    } catch (e) {
        console.error("Falha ao salvar", e);
    }
  }, []);

  const calculatePrestigeGain = (lifetimeCookies: number) => {
      // Formula: 1 crystal per sqrt(lifetime / 1,000,000)
      // Needs 1M for 1, 4M for 2, 9M for 3...
      if (lifetimeCookies < 1000000) return 0;
      return Math.floor(Math.sqrt(lifetimeCookies / 1000000));
  };

  const ascend = () => {
      // Logic simplified: Calculate potential level based on all time cookies,
      // subtract current level to find gain.
      
      const potentialLevel = calculatePrestigeGain(gameStateRef.current.lifetimeCookies);
      const levelsToGain = Math.max(0, potentialLevel - gameStateRef.current.prestigeLevel);

      if (levelsToGain <= 0) return false;

      if (confirm(`Você ascenderá e ganhará ${levelsToGain} Cristais de Açúcar (+${levelsToGain * 5}% CpS). Todo o progresso atual será resetado, mas conquistas e cristais permanecem. Continuar?`)) {
          setGameState(prev => ({
              ...INITIAL_STATE,
              prestigeLevel: prev.prestigeLevel + levelsToGain,
              achievements: prev.achievements,
              lifetimeCookies: prev.lifetimeCookies, // Keep lifetime tracking
              startTime: Date.now(),
              bakeryName: prev.bakeryName
          }));
          setActiveEffects([]);
          setGoldenCookie(null);
          saveGame();
          return true;
      }
      return false;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      // Prevent huge jumps if tab was sleeping
      const safeDelta = Math.min(delta, 5000); 
      lastTickRef.current = now;

      setActiveEffects(prev => {
        const filtered = prev.filter(e => e.endTime > now);
        if (filtered.length !== prev.length) return filtered;
        return prev;
      });

      const { calculatedCps, calculatedClickValue } = calculateStats(gameStateRef.current, activeEffectsRef.current);
      setCps(calculatedCps);
      setClickValue(calculatedClickValue);

      setGameState((prev) => {
        const cookiesEarned = (calculatedCps / 1000) * safeDelta;
        const newState = {
          ...prev,
          cookies: prev.cookies + cookiesEarned,
          totalCookies: prev.totalCookies + cookiesEarned,
          lifetimeCookies: (prev.lifetimeCookies || prev.totalCookies) + cookiesEarned,
          lastSaveTime: now,
        };

        // Achievement check logic optimization: only check sometimes or check specific types
        const newAchievements: string[] = [];
        ACHIEVEMENTS.forEach(ach => {
            if (!newState.achievements.includes(ach.id)) {
                // Special handling for CpS achievement because it's not in state
                if (ach.id.startsWith('ach_cps_')) {
                    const req = parseInt(ach.description.replace(/\D/g,''));
                    if (calculatedCps >= req) {
                        newAchievements.push(ach.id);
                        setNotificationQueue(q => [...q, ach]);
                    }
                } else if (ach.trigger(newState)) {
                    newAchievements.push(ach.id);
                    setNotificationQueue(q => [...q, ach]);
                }
            }
        });
        
        if (newAchievements.length > 0) {
            newState.achievements = [...newState.achievements, ...newAchievements];
        }

        return newState;
      });

      if (!goldenCookieTimerRef.current) goldenCookieTimerRef.current = 0;
      
      goldenCookieTimerRef.current += safeDelta;
      // Random spawn window between 2 and 4 minutes (adjusted for difficulty)
      if (goldenCookieTimerRef.current >= 120000 + Math.random() * 120000) {
          spawnGoldenCookie();
          goldenCookieTimerRef.current = 0;
      }

      autoSaveTimerRef.current += safeDelta;
      if (autoSaveTimerRef.current >= 30000) {
          saveGame();
          autoSaveTimerRef.current = 0;
      }

    }, 100);

    return () => clearInterval(interval);
  }, [calculateStats, saveGame]);

  useEffect(() => {
    if (goldenCookie) {
        const timer = setInterval(() => {
            setGoldenCookie(prev => {
                if (!prev) return null;
                const newLife = prev.life - 0.1;
                return newLife <= 0 ? null : { ...prev, life: newLife };
            });
        }, 100);
        return () => clearInterval(timer);
    }
  }, [!!goldenCookie]);

  const spawnGoldenCookie = () => {
     setGoldenCookie({
        active: true,
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        type: Math.random() > 0.9 ? 'clickfrenzy' : (Math.random() > 0.5 ? 'frenzy' : 'lucky'),
        life: 13,
     });
  };

  const clickGoldenCookie = () => {
    if (!goldenCookie) return;
    
    let message = "";
    const now = Date.now();

    if (goldenCookie.type === 'lucky') {
        // Nerfed Lucky slightly: Max 15% of bank or 15 mins of CpS
        const gain = Math.min(gameState.cookies * 0.15 + 13, cps * 900 + 13);
        setGameState(prev => ({ 
            ...prev, 
            cookies: prev.cookies + gain, 
            totalCookies: prev.totalCookies + gain,
            lifetimeCookies: prev.lifetimeCookies + gain
        }));
        message = `Sortudo! +${Math.floor(gain)}`;
    } else if (goldenCookie.type === 'frenzy') {
        setActiveEffects(prev => [...prev, { type: 'frenzy', label: 'Frenesi (x7)', multiplier: 7, endTime: now + 77000, duration: 77000 }]);
        message = "Frenesi x7!";
    } else if (goldenCookie.type === 'clickfrenzy') {
        setActiveEffects(prev => [...prev, { type: 'clickfrenzy', label: 'Click Power (x777)', multiplier: 777, endTime: now + 13000, duration: 13000 }]);
        message = "Poder de Clique!";
    }

    setGoldenCookie(null);
    return message;
  };

  const buyBuilding = (buildingId: string) => {
    const building = BUILDINGS.find((b) => b.id === buildingId);
    if (!building) return;
    const count = gameState.buildings[buildingId] || 0;
    // Dificuldade Aumentada: Exponente 1.22
    const price = Math.floor(building.baseCost * Math.pow(1.22, count));

    if (gameState.cookies >= price) {
      setGameState((prev) => ({
        ...prev,
        cookies: prev.cookies - price,
        buildings: { ...prev.buildings, [buildingId]: count + 1 },
      }));
    }
  };

  const buyUpgrade = (upgradeId: string) => {
    const upgrade = UPGRADES.find((u) => u.id === upgradeId);
    if (upgrade && gameState.cookies >= upgrade.cost && !gameState.upgrades.includes(upgradeId)) {
      setGameState((prev) => ({
        ...prev,
        cookies: prev.cookies - upgrade.cost,
        upgrades: [...prev.upgrades, upgradeId],
      }));
    }
  };

  const updateBakeryName = (name: string) => {
    setGameState(prev => ({ ...prev, bakeryName: name }));
  };

  const manualClick = () => {
    setGameState((prev) => ({
      ...prev,
      cookies: prev.cookies + clickValue,
      totalCookies: prev.totalCookies + clickValue,
      lifetimeCookies: prev.lifetimeCookies + clickValue,
      manualClicks: (prev.manualClicks || 0) + 1,
    }));
    return clickValue;
  };

  const resetGame = () => {
    if(confirm("Reiniciar todo o progresso (hard reset)? Isso apaga tudo, incluindo conquistas.")) {
        localStorage.removeItem(SAVE_KEY);
        setGameState(INITIAL_STATE);
        window.location.reload();
    }
  };

  const dismissNotification = (id: string) => {
      setNotificationQueue(q => q.filter(n => n.id !== id));
  };

  return {
    gameState, cps, clickValue, activeEffects, notificationQueue, isSaving,
    saveGame, buyBuilding, buyUpgrade, manualClick, resetGame,
    goldenCookie, clickGoldenCookie, updateBakeryName, dismissNotification,
    ascend, calculatePrestigeGain
  };
};