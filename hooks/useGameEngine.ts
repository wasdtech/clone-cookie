import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, GoldenCookieState, ActiveEffect, Achievement } from '../types';
import { BUILDINGS, UPGRADES, ACHIEVEMENTS, INITIAL_STATE, SKILLS } from '../constants';

const SAVE_KEY = 'biscoito_clicker_save_v2'; 

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

    // --- SKILL TREE EFFECTS ---
    // 1. Heavenly Gates (+10% global)
    if (state.purchasedSkills.includes('heavenly_gates')) {
        newCps *= 1.10;
    }
    
    // Skill: Synergy (1% per unique building type owned)
    if (state.purchasedSkills.includes('synergy_1')) {
        const uniqueBuildings = Object.keys(state.buildings).filter(k => state.buildings[k] > 0).length;
        newCps *= (1 + (uniqueBuildings * 0.01));
    }

    // 2. Prestige Bonus (Default 5% per level, or 7% with 'cookie_galaxy')
    const crystalEffectiveness = state.purchasedSkills.includes('cookie_galaxy') ? 0.07 : 0.05;
    const prestigeMultiplier = 1 + (state.prestigeLevel * crystalEffectiveness);
    newCps *= prestigeMultiplier;

    // Click Value
    let newClickValue = 1;
    // Base click depends on CpS
    // 3. Click God Skill (Add 5% of CpS to click instead of 1%)
    const clickPercent = state.purchasedSkills.includes('click_god') ? 0.05 : 0.01;
    newClickValue += newCps * clickPercent;

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
        
        // --- SAFE LOAD / MERGE LOGIC ---
        // This ensures new fields in INITIAL_STATE are present even if loading an old save
        const merged: GameState = {
            ...INITIAL_STATE,
            ...parsed,
            buildings: { ...INITIAL_STATE.buildings, ...(parsed.buildings || {}) },
            purchasedSkills: parsed.purchasedSkills || [],
            achievements: parsed.achievements || [],
            upgrades: parsed.upgrades || []
        };
        
        // Migration logic specifically for logic changes
        if (typeof merged.prestigeLevel === 'undefined') merged.prestigeLevel = 0;
        if (typeof merged.lifetimeCookies === 'undefined') merged.lifetimeCookies = merged.totalCookies;

        const now = Date.now();
        const secondsOffline = (now - merged.lastSaveTime) / 1000;
        
        const stats = calculateStats(merged, []);
        if (secondsOffline > 60) {
            // Skill: Angel Investor (Offline cap 48h, 90% efficiency)
            const hasAngel = merged.purchasedSkills.includes('angel_investor');
            const maxSeconds = hasAngel ? 172800 : 86400; // 48h vs 24h
            const efficiency = hasAngel ? 0.9 : 0.5;

            const effectiveSeconds = Math.min(secondsOffline, maxSeconds); 
            const earned = stats.calculatedCps * effectiveSeconds * efficiency;
            
            merged.cookies += earned;
            merged.totalCookies += earned;
            merged.lifetimeCookies += earned;
        }
        
        setGameState({ ...merged, lastSaveTime: now });
      } catch (e) {
        console.error("Erro ao carregar save", e);
        // Fallback to initial state if save is corrupted, but don't overwrite local storage yet
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
      if (lifetimeCookies < 1000000) return 0;
      return Math.floor(Math.sqrt(lifetimeCookies / 1000000));
  };

  const getBuildingPrice = (buildingId: string, currentCount: number, skills: string[]) => {
      const building = BUILDINGS.find(b => b.id === buildingId);
      if (!building) return 0;
      
      let cost = Math.floor(building.baseCost * Math.pow(1.22, currentCount));
      
      // Skill: Divine Discount
      if (skills.includes('divine_discount')) {
          cost = Math.floor(cost * 0.9);
      }
      return cost;
  };

  const ascend = () => {
      const totalPotentialLevel = calculatePrestigeGain(gameStateRef.current.lifetimeCookies);
      const spentOnSkills = gameStateRef.current.purchasedSkills.reduce((acc, skillId) => {
          const s = SKILLS.find(sk => sk.id === skillId);
          return acc + (s ? s.cost : 0);
      }, 0);

      const totalOwned = gameStateRef.current.prestigeLevel + spentOnSkills;
      const levelsToGain = Math.max(0, totalPotentialLevel - totalOwned);

      if (levelsToGain <= 0) return false;

      // Skill: Time Warp (Start with bonus cookies)
      const hasTimeWarp = gameStateRef.current.purchasedSkills.includes('time_warp');
      const startCookies = hasTimeWarp ? 50000 : 0; 

      // Skill: Legacy Starter (Start with free buildings)
      const hasLegacy = gameStateRef.current.purchasedSkills.includes('legacy_starter');
      const startBuildings = { ...INITIAL_STATE.buildings };
      if (hasLegacy) {
          startBuildings['cursor'] = 10;
          startBuildings['grandma'] = 5;
      }

      if (confirm(`Você ascenderá e ganhará ${levelsToGain} Cristais de Açúcar. Progresso resetado. Habilidades mantidas.`)) {
          setGameState(prev => ({
              ...INITIAL_STATE,
              cookies: startCookies,
              buildings: startBuildings,
              prestigeLevel: prev.prestigeLevel + levelsToGain,
              purchasedSkills: prev.purchasedSkills, // PERMANENTE
              achievements: prev.achievements, // PERMANENTE
              lifetimeCookies: prev.lifetimeCookies, 
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

  const buySkill = (skillId: string) => {
      const skill = SKILLS.find(s => s.id === skillId);
      if (!skill) return;

      if (gameState.purchasedSkills.includes(skillId)) return;
      if (gameState.prestigeLevel < skill.cost) return;
      
      if (skill.parent && !gameState.purchasedSkills.includes(skill.parent)) return;

      setGameState(prev => ({
          ...prev,
          prestigeLevel: prev.prestigeLevel - skill.cost,
          purchasedSkills: [...prev.purchasedSkills, skillId]
      }));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
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

        // Achievement check
        const newAchievements: string[] = [];
        ACHIEVEMENTS.forEach(ach => {
            if (!newState.achievements.includes(ach.id)) {
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
      
      // Golden Cookie Spawn Rate
      const hasLuckyStars = gameStateRef.current.purchasedSkills.includes('lucky_stars');
      const baseTime = hasLuckyStars ? 96000 : 120000;
      
      if (goldenCookieTimerRef.current >= baseTime + Math.random() * baseTime) {
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
    const hasLongerEffects = gameState.purchasedSkills.includes('golden_longevity');
    const multiplier = hasLongerEffects ? 1.3 : 1.0;

    if (goldenCookie.type === 'lucky') {
        const gain = Math.min(gameState.cookies * 0.15 + 13, cps * 900 + 13);
        setGameState(prev => ({ 
            ...prev, 
            cookies: prev.cookies + gain, 
            totalCookies: prev.totalCookies + gain,
            lifetimeCookies: prev.lifetimeCookies + gain
        }));
        message = `Sortudo! +${Math.floor(gain)}`;
    } else if (goldenCookie.type === 'frenzy') {
        const dur = 77000 * multiplier;
        setActiveEffects(prev => [...prev, { type: 'frenzy', label: 'Frenesi (x7)', multiplier: 7, endTime: now + dur, duration: dur }]);
        message = "Frenesi x7!";
    } else if (goldenCookie.type === 'clickfrenzy') {
        const dur = 13000 * multiplier;
        setActiveEffects(prev => [...prev, { type: 'clickfrenzy', label: 'Click Power (x777)', multiplier: 777, endTime: now + dur, duration: dur }]);
        message = "Poder de Clique!";
    }

    setGoldenCookie(null);
    return message;
  };

  const buyBuilding = (buildingId: string) => {
    const count = gameState.buildings[buildingId] || 0;
    const price = getBuildingPrice(buildingId, count, gameState.purchasedSkills);

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
    let cost = upgrade ? upgrade.cost : 0;
    
    // Skill: Pure Magic (Cheaper Upgrades)
    if (gameState.purchasedSkills.includes('pure_magic')) {
        cost = Math.floor(cost * 0.8);
    }

    if (upgrade && gameState.cookies >= cost && !gameState.upgrades.includes(upgradeId)) {
      setGameState((prev) => ({
        ...prev,
        cookies: prev.cookies - cost,
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
    ascend, calculatePrestigeGain, buySkill
  };
};