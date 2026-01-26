
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
      if (upgrade?.type === 'global') newCps *= upgrade.multiplier;
    });

    if (state.purchasedSkills.includes('heavenly_gates')) newCps *= 1.10;
    if (state.purchasedSkills.includes('synergy_1')) {
        const uniqueBuildings = Object.keys(state.buildings).filter(k => state.buildings[k] > 0).length;
        newCps *= (1 + (uniqueBuildings * 0.01));
    }
    if (state.purchasedSkills.includes('meta_1')) newCps *= 1.5;
    if (state.purchasedSkills.includes('omega')) newCps *= 2.0;

    const crystalEffectiveness = state.purchasedSkills.includes('cookie_galaxy') ? 0.02 : 0.01;
    const prestigeMultiplier = 1 + (state.prestigeLevel * crystalEffectiveness);
    newCps *= prestigeMultiplier;

    let newClickValue = 1;
    const clickPercent = state.purchasedSkills.includes('meta_2') ? 0.10 : (state.purchasedSkills.includes('click_god') ? 0.05 : 0.01);
    newClickValue += newCps * clickPercent;

    state.upgrades.forEach((uId) => {
        const upgrade = UPGRADES.find(u => u.id === uId);
        if (upgrade?.type === 'click') newClickValue *= upgrade.multiplier;
    });
    
    newClickValue *= prestigeMultiplier;

    effects.forEach(effect => {
      if (effect.type === 'frenzy') newCps *= effect.multiplier;
      if (effect.type === 'clickfrenzy') newClickValue *= effect.multiplier;
    });

    return { calculatedCps: newCps, calculatedClickValue: newClickValue };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      try {
        const parsed: GameState = JSON.parse(saved);
        const merged: GameState = {
            ...INITIAL_STATE,
            ...parsed,
            buildings: { ...INITIAL_STATE.buildings, ...(parsed.buildings || {}) },
            purchasedSkills: parsed.purchasedSkills || [],
            achievements: parsed.achievements || [],
            upgrades: parsed.upgrades || []
        };
        const now = Date.now();
        const secondsOffline = (now - merged.lastSaveTime) / 1000;
        const stats = calculateStats(merged, []);
        if (secondsOffline > 60) {
            const hasAngel = merged.purchasedSkills.includes('angel_investor');
            const maxSeconds = hasAngel ? 172800 : 86400;
            const efficiency = hasAngel ? 0.9 : 0.5;
            const effectiveSeconds = Math.min(secondsOffline, maxSeconds); 
            const earned = stats.calculatedCps * effectiveSeconds * efficiency;
            merged.cookies += earned;
            merged.totalCookies += earned;
            merged.lifetimeCookies += earned;
        }
        setGameState({ ...merged, lastSaveTime: now });
      } catch (e) { console.error("Erro ao carregar save", e); setGameState(INITIAL_STATE); }
    }
    lastTickRef.current = Date.now();
  }, [calculateStats]);

  const saveGame = useCallback(() => {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(gameStateRef.current));
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 2000);
    } catch (e) { console.error("Falha ao salvar", e); }
  }, []);

  const resetGame = useCallback(() => {
      if (confirm("TEM CERTEZA? Isso apagará TODO o seu progresso permanentemente!")) {
          localStorage.removeItem(SAVE_KEY);
          setGameState(INITIAL_STATE);
          setActiveEffects([]);
          setGoldenCookie(null);
          window.location.reload();
      }
  }, []);

  const calculatePrestigeGain = (lifetimeCookies: number) => {
      if (lifetimeCookies < 1000000) return 0;
      return Math.floor(Math.sqrt(lifetimeCookies / 1000000));
  };

  const getBuildingPrice = (buildingId: string, currentCount: number, skills: string[]) => {
      const building = BUILDINGS.find(b => b.id === buildingId);
      if (!building) return 0;
      let cost = Math.floor(building.baseCost * Math.pow(1.15, currentCount));
      if (skills.includes('divine_discount')) cost = Math.floor(cost * 0.9);
      skills.forEach(sid => {
          if (sid.startsWith('eco_')) {
              const val = parseInt(sid.split('_')[1]);
              cost *= (1 - (val * 0.02));
          }
      });
      return Math.floor(cost);
  };

  const getCumulativePrice = (buildingId: string, currentCount: number, skills: string[], amount: number) => {
      let total = 0;
      for (let i = 0; i < amount; i++) {
          total += getBuildingPrice(buildingId, currentCount + i, skills);
      }
      return total;
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

      const hasTimeWarp = gameStateRef.current.purchasedSkills.includes('time_warp');
      const startCookies = hasTimeWarp ? 50000 : 0; 
      const hasLegacy = gameStateRef.current.purchasedSkills.includes('legacy_starter');
      const startBuildings = { ...INITIAL_STATE.buildings };
      if (hasLegacy) { startBuildings['cursor'] = 10; startBuildings['grandma'] = 5; }

      if (confirm(`Você ascenderá e ganhará ${levelsToGain} Cristais. Habilidades mantidas.`)) {
          setGameState(prev => ({
              ...INITIAL_STATE,
              cookies: startCookies,
              buildings: startBuildings,
              prestigeLevel: prev.prestigeLevel + levelsToGain,
              purchasedSkills: prev.purchasedSkills,
              achievements: prev.achievements,
              lifetimeCookies: prev.lifetimeCookies, 
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
      if (!skill || gameState.purchasedSkills.includes(skillId) || gameState.prestigeLevel < skill.cost) return;
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
      setActiveEffects(prev => prev.filter(e => e.endTime > now));

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
        const newAchievements: string[] = [];
        ACHIEVEMENTS.forEach(ach => {
            if (!newState.achievements.includes(ach.id) && ach.trigger(newState)) {
                newAchievements.push(ach.id);
                setNotificationQueue(q => [...q, ach]);
            }
        });
        if (newAchievements.length > 0) newState.achievements = [...newState.achievements, ...newAchievements];
        return newState;
      });

      goldenCookieTimerRef.current += safeDelta;
      let luckBonus = 1;
      gameStateRef.current.purchasedSkills.forEach(sid => {
          if (sid.startsWith('luck_')) luckBonus += (parseInt(sid.split('_')[1]) * 0.05);
      });
      const hasLuckyStars = gameStateRef.current.purchasedSkills.includes('lucky_stars');
      const baseTime = (hasLuckyStars ? 96000 : 120000) / luckBonus;
      if (goldenCookieTimerRef.current >= baseTime + Math.random() * baseTime) { spawnGoldenCookie(); goldenCookieTimerRef.current = 0; }
      autoSaveTimerRef.current += safeDelta;
      if (autoSaveTimerRef.current >= 30000) { saveGame(); autoSaveTimerRef.current = 0; }
    }, 100);
    return () => clearInterval(interval);
  }, [calculateStats, saveGame]);

  useEffect(() => {
    if (goldenCookie) {
        const timer = setInterval(() => {
            setGoldenCookie(prev => (prev && prev.life > 0) ? { ...prev, life: prev.life - 0.1 } : null);
        }, 100);
        return () => clearInterval(timer);
    }
  }, [!!goldenCookie]);

  const spawnGoldenCookie = () => {
     setGoldenCookie({ active: true, x: Math.random() * 80 + 10, y: Math.random() * 80 + 10, type: Math.random() > 0.9 ? 'clickfrenzy' : (Math.random() > 0.5 ? 'frenzy' : 'lucky'), life: 13 });
  };

  const clickGoldenCookie = () => {
    if (!goldenCookie) return;
    let message = "";
    const now = Date.now();
    const multiplierBonus = gameState.purchasedSkills.includes('golden_longevity') ? 1.3 : 1.0;

    if (goldenCookie.type === 'lucky') {
        const gain = Math.min(gameState.cookies * 0.15 + 13, cps * 900 + 13);
        setGameState(prev => ({ ...prev, cookies: prev.cookies + gain, totalCookies: prev.totalCookies + gain, lifetimeCookies: prev.lifetimeCookies + gain }));
        message = `Sortudo! +${Math.floor(gain)}`;
    } else {
        const type = goldenCookie.type;
        const baseDuration = type === 'frenzy' ? 77000 : 13000;
        const baseMult = type === 'frenzy' ? 7 : 777;
        const labelBase = type === 'frenzy' ? 'Frenesi' : 'Click Power';
        const dur = baseDuration * multiplierBonus;

        setActiveEffects(prev => {
            const existingIndex = prev.findIndex(e => e.type === type);
            if (existingIndex !== -1) {
                const updated = [...prev];
                const old = updated[existingIndex];
                // Acumular: Multiplicar o poder e somar o tempo restante
                const newMult = old.multiplier * baseMult;
                updated[existingIndex] = {
                    ...old,
                    multiplier: newMult,
                    endTime: old.endTime + dur,
                    duration: old.duration + dur,
                    label: `${labelBase} (x${newMult})`
                };
                return updated;
            }
            return [...prev, { type, label: `${labelBase} (x${baseMult})`, multiplier: baseMult, endTime: now + dur, duration: dur }];
        });
        message = type === 'frenzy' ? "Frenesi Acumulado!" : "Poder Acumulado!";
    }
    setGoldenCookie(null);
    return message;
  };

  const buyBuilding = (buildingId: string, amount: number = 1) => {
    const count = gameState.buildings[buildingId] || 0;
    const price = getCumulativePrice(buildingId, count, gameState.purchasedSkills, amount);
    if (gameState.cookies >= price) {
      setGameState((prev) => ({ 
          ...prev, 
          cookies: prev.cookies - price, 
          buildings: { ...prev.buildings, [buildingId]: count + amount } 
      }));
    }
  };

  const buyUpgrade = (upgradeId: string) => {
    const upgrade = UPGRADES.find((u) => u.id === upgradeId);
    let cost = upgrade ? upgrade.cost : 0;
    if (gameState.purchasedSkills.includes('pure_magic')) cost = Math.floor(cost * 0.8);
    if (upgrade && gameState.cookies >= cost && !gameState.upgrades.includes(upgradeId)) {
      setGameState((prev) => ({ ...prev, cookies: prev.cookies - cost, upgrades: [...prev.upgrades, upgradeId] }));
    }
  };

  const manualClick = () => {
    setGameState((prev) => ({ ...prev, cookies: prev.cookies + clickValue, totalCookies: prev.totalCookies + clickValue, lifetimeCookies: prev.lifetimeCookies + clickValue, manualClicks: (prev.manualClicks || 0) + 1 }));
    return clickValue;
  };

  return { gameState, cps, clickValue, activeEffects, notificationQueue, isSaving, saveGame, buyBuilding, buyUpgrade, manualClick, resetGame, goldenCookie, clickGoldenCookie, getCumulativePrice, updateBakeryName: (n:string) => setGameState(p=>({...p, bakeryName:n})), dismissNotification: (id:string)=>setNotificationQueue(q=>q.filter(n=>n.id!==id)), ascend, calculatePrestigeGain, buySkill };
};
