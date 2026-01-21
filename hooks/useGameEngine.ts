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

  // Refs para acesso estável dentro do setInterval sem causar re-renders infinitos
  const gameStateRef = useRef(gameState);
  const activeEffectsRef = useRef(activeEffects);
  const goldenCookieTimer = useRef(0);
  const autoSaveTimer = useRef(0);
  const lastTickRef = useRef(Date.now());

  // Sincroniza refs quando o estado muda
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    activeEffectsRef.current = activeEffects;
  }, [activeEffects]);

  const calculateStats = useCallback((state: GameState, effects: ActiveEffect[]) => {
    let newCps = 0;
    
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

    state.upgrades.forEach((uId) => {
      const upgrade = UPGRADES.find(u => u.id === uId);
      if (upgrade?.type === 'global') {
        newCps *= upgrade.multiplier;
      }
    });

    let newClickValue = 1;
    state.upgrades.forEach((uId) => {
        const upgrade = UPGRADES.find(u => u.id === uId);
        if (upgrade?.type === 'click') {
            newClickValue *= upgrade.multiplier;
        }
    });

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

  // Carregar Jogo
  useEffect(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      try {
        const parsed: GameState = JSON.parse(saved);
        if (!parsed.achievements) parsed.achievements = [];
        if (!parsed.manualClicks) parsed.manualClicks = 0;
        if (!parsed.bakeryName) parsed.bakeryName = "Padaria do Jogador";

        const now = Date.now();
        const secondsOffline = (now - parsed.lastSaveTime) / 1000;
        
        const stats = calculateStats(parsed, []);
        if (secondsOffline > 60) {
            const earned = stats.calculatedCps * secondsOffline * 0.5;
            parsed.cookies += earned;
            parsed.totalCookies += earned;
        }
        
        setGameState({ ...parsed, lastSaveTime: now });
      } catch (e) {
        console.error("Erro ao carregar save", e);
        setGameState(INITIAL_STATE);
      }
    }
    lastTickRef.current = Date.now();
  }, [calculateStats]);

  // Atualizar Título
  useEffect(() => {
    const count = Math.floor(gameState.cookies).toLocaleString();
    document.title = `${count} biscoitos - Biscoito Clicker`;
  }, [gameState.cookies]);

  const saveGame = useCallback(() => {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(gameStateRef.current));
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 2000);
    } catch (e) {
        console.error("Falha ao salvar", e);
    }
  }, []);

  // Loop Principal
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      // Limpar efeitos expirados
      setActiveEffects(prev => {
        const filtered = prev.filter(e => e.endTime > now);
        if (filtered.length !== prev.length) return filtered;
        return prev;
      });

      const { calculatedCps, calculatedClickValue } = calculateStats(gameStateRef.current, activeEffectsRef.current);
      setCps(calculatedCps);
      setClickValue(calculatedClickValue);

      setGameState((prev) => {
        const cookiesEarned = (calculatedCps / 1000) * delta;
        const newState = {
          ...prev,
          cookies: prev.cookies + cookiesEarned,
          totalCookies: prev.totalCookies + cookiesEarned,
          lastSaveTime: now,
        };

        // Conquistas
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

      // Cookie Dourado
      if (!goldenCookie) { 
         goldenCookieTimer.current += delta;
         if (goldenCookieTimer.current >= 120000) { // 2 minutos
             spawnGoldenCookie();
             goldenCookieTimer.current = 0;
         }
      }

      // Auto Save
      autoSaveTimer.current += delta;
      if (autoSaveTimer.current >= 30000) {
          saveGame();
          autoSaveTimer.current = 0;
      }

    }, 100);

    return () => clearInterval(interval);
  }, [calculateStats, saveGame, !!goldenCookie]);

  const spawnGoldenCookie = () => {
     const typeRoll = Math.random();
     const type = typeRoll > 0.9 ? 'clickfrenzy' : (typeRoll > 0.5 ? 'frenzy' : 'lucky');
     
     setGoldenCookie({
        active: true,
        x: Math.random() * 70 + 15,
        y: Math.random() * 70 + 15,
        type: type as any,
        life: 13,
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
        const duration = 77000;
        setActiveEffects(prev => [...prev, { 
            type: 'frenzy', 
            label: 'Frenesi (x15 CpS)',
            multiplier: 15,
            endTime: now + duration,
            duration: duration
        }]);
        message = "Frenesi! Produção x15";
    } else if (goldenCookie.type === 'clickfrenzy') {
        const duration = 13000;
        setActiveEffects(prev => [...prev, { 
            type: 'clickfrenzy', 
            label: 'Click Frenesi (x777)',
            multiplier: 777, 
            endTime: now + duration,
            duration: duration
        }]);
        message = "Poder de Clique! x777";
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
          [buildingId]: (prev.buildings[buildingId] || 0) + 1,
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
          lastTickRef.current = Date.now();
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