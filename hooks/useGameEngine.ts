
import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, GoldenCookieState, ActiveEffect, Achievement } from '../types';
import { BUILDINGS, UPGRADES, ACHIEVEMENTS, INITIAL_STATE, SKILLS } from '../constants';

const SAVE_KEY = 'biscoito_clicker_save_v3_fixed'; 

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

  // Refs para prevenir loops em dependências do useEffect
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { activeEffectsRef.current = activeEffects; }, [activeEffects]);

  const calculateStats = useCallback((state: GameState, effects: ActiveEffect[]) => {
    let newCps = 0;
    
    // 1. Base Building CPS
    BUILDINGS.forEach((b) => {
      let buildingCps = b.baseCps;
      const count = state.buildings[b.id] || 0;
      
      // Upgrade Multipliers for Buildings
      state.upgrades.forEach((uId) => {
        const upgrade = UPGRADES.find(u => u.id === uId);
        if (upgrade?.type === 'building' && upgrade.targetId === b.id) {
          buildingCps *= upgrade.multiplier;
        }
      });
      newCps += buildingCps * count;
    });

    // 2. Global Multipliers
    state.upgrades.forEach((uId) => {
      const upgrade = UPGRADES.find(u => u.id === uId);
      if (upgrade?.type === 'global') newCps *= upgrade.multiplier;
    });

    // 3. Skill Tree Multipliers
    if (state.purchasedSkills.includes('heavenly_gates')) newCps *= 1.10;
    
    // Synergy Logic
    state.purchasedSkills.forEach(sid => {
         if (sid.startsWith('prod_')) {
             const level = parseInt(sid.split('_')[1]);
             newCps *= (1 + (level * 0.03)); // +3% per node
         }
    });

    if (state.purchasedSkills.includes('angel_investor')) newCps *= 1.05;
    if (state.purchasedSkills.includes('omega')) newCps *= 2.0;

    // Prestige Multiplier
    const crystalEffectiveness = state.purchasedSkills.includes('cookie_galaxy') ? 0.02 : 0.01;
    const prestigeMultiplier = 1 + (state.prestigeLevel * crystalEffectiveness);
    newCps *= prestigeMultiplier;

    // 4. Click Value Calculation
    let baseClick = 1;
    
    // Click scaling with CPS
    const clickPercent = state.purchasedSkills.includes('click_god') ? 0.05 : 0.01; // Nerfed slightly for balance
    baseClick += newCps * clickPercent;

    // Click Upgrades
    state.upgrades.forEach((uId) => {
        const upgrade = UPGRADES.find(u => u.id === uId);
        if (upgrade?.type === 'click') baseClick *= upgrade.multiplier;
    });
    
    baseClick *= prestigeMultiplier;

    // 5. Apply Active Temporary Effects (Golden Cookie)
    // Separation of multipliers prevents exponential stacking bugs
    let frenzyMult = 1;
    let clickFrenzyMult = 1;

    effects.forEach(effect => {
      if (effect.type === 'frenzy') frenzyMult *= effect.multiplier;
      if (effect.type === 'clickfrenzy') clickFrenzyMult *= effect.multiplier;
    });

    newCps *= frenzyMult;
    baseClick *= clickFrenzyMult;
    
    // Se tiver frenzy normal, o clique também é afetado pelo frenzy normal (mecânica padrão)
    baseClick *= frenzyMult;

    return { calculatedCps: newCps, calculatedClickValue: baseClick };
  }, []);

  // Load Save
  useEffect(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Deep merge seguro
        const merged: GameState = {
            ...INITIAL_STATE,
            ...parsed,
            buildings: { ...INITIAL_STATE.buildings, ...(parsed.buildings || {}) },
            // Garante arrays
            purchasedSkills: Array.isArray(parsed.purchasedSkills) ? parsed.purchasedSkills : [],
            achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
            upgrades: Array.isArray(parsed.upgrades) ? parsed.upgrades : []
        };
        
        // Offline Gains Logic
        const now = Date.now();
        const lastSave = merged.lastSaveTime || now;
        const secondsOffline = (now - lastSave) / 1000;
        
        if (secondsOffline > 60) {
            const stats = calculateStats(merged, []);
            const hasAngel = merged.purchasedSkills.includes('angel_investor');
            const maxSeconds = hasAngel ? 172800 : 86400; // 48h vs 24h
            const efficiency = hasAngel ? 0.9 : 0.5;
            
            const effectiveSeconds = Math.min(secondsOffline, maxSeconds); 
            const earned = stats.calculatedCps * effectiveSeconds * efficiency;
            
            if (earned > 0) {
                merged.cookies += earned;
                merged.totalCookies += earned;
                merged.lifetimeCookies += earned;
                console.log(`Offline: Ganhou ${earned} biscoitos por ${effectiveSeconds}s ausente.`);
            }
        }
        setGameState({ ...merged, lastSaveTime: now });
      } catch (e) { 
          console.error("Save corrompido, resetando.", e); 
          setGameState(INITIAL_STATE); 
      }
    }
    lastTickRef.current = Date.now();
  }, [calculateStats]);

  // Main Loop
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      // Delta time capping to prevent huge jumps if browser freezes
      const delta = Math.min(now - lastTickRef.current, 1000); 
      lastTickRef.current = now;

      // Filter expired effects
      setActiveEffects(prev => prev.filter(e => e.endTime > now));

      // Calculate stats based on current state
      const { calculatedCps, calculatedClickValue } = calculateStats(gameStateRef.current, activeEffectsRef.current);
      
      setCps(calculatedCps);
      setClickValue(calculatedClickValue);

      // Add Cookies
      const cookiesEarned = (calculatedCps / 1000) * delta;
      
      setGameState((prev) => {
        const newState = {
          ...prev,
          cookies: prev.cookies + cookiesEarned,
          totalCookies: prev.totalCookies + cookiesEarned,
          lifetimeCookies: (prev.lifetimeCookies || prev.totalCookies) + cookiesEarned,
          lastSaveTime: now,
        };

        // Achievement Check (Throttled inside loop, but okay for this scale)
        ACHIEVEMENTS.forEach(ach => {
            if (!newState.achievements.includes(ach.id) && ach.trigger(newState)) {
                newState.achievements = [...newState.achievements, ach.id];
                setNotificationQueue(q => [...q, ach]);
            }
        });
        
        return newState;
      });

      // Timers
      goldenCookieTimerRef.current += delta;
      autoSaveTimerRef.current += delta;

      // Golden Cookie Spawn Logic
      let spawnRateDivisor = 1;
      gameStateRef.current.purchasedSkills.forEach(sid => {
          if (sid.startsWith('luck_')) spawnRateDivisor += (parseInt(sid.split('_')[1]) * 0.05);
      });
      if (gameStateRef.current.purchasedSkills.includes('lucky_stars')) spawnRateDivisor *= 1.2;

      // Base time: ~2 a 4 minutos (reduzido por skills)
      const baseTime = (120000 + Math.random() * 120000) / spawnRateDivisor; 
      
      if (!goldenCookie && goldenCookieTimerRef.current >= baseTime) { 
          spawnGoldenCookie(); 
          goldenCookieTimerRef.current = 0; 
      }

      if (autoSaveTimerRef.current >= 30000) { // 30s autosave
          saveGame(); 
          autoSaveTimerRef.current = 0; 
      }

    }, 100); // 10 ticks per second for smoothness

    return () => clearInterval(interval);
  }, [calculateStats]);

  // Golden Cookie Despawn Timer
  useEffect(() => {
    let timer: any;
    if (goldenCookie) {
        timer = setInterval(() => {
            setGoldenCookie(prev => {
                if (!prev) return null;
                if (prev.life <= 0) return null;
                return { ...prev, life: prev.life - 0.1 };
            });
        }, 100);
    }
    return () => clearInterval(timer);
  }, [!!goldenCookie]);

  const saveGame = useCallback(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameStateRef.current));
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 2000);
  }, []);

  const resetGame = useCallback(() => {
      if (confirm("TEM CERTEZA? Isso apagará TODO o seu progresso permanentemente!")) {
          localStorage.removeItem(SAVE_KEY);
          window.location.reload();
      }
  }, []);

  const spawnGoldenCookie = () => {
     // Probabilidades ajustadas
     const rng = Math.random();
     let type: 'frenzy' | 'lucky' | 'clickfrenzy' = 'lucky';
     
     if (rng > 0.95) type = 'clickfrenzy'; // 5% chance
     else if (rng > 0.6) type = 'frenzy';  // 35% chance
     else type = 'lucky';                  // 60% chance

     const lifeTime = gameStateRef.current.purchasedSkills.includes('golden_longevity') ? 18 : 13;

     setGoldenCookie({ 
         active: true, 
         x: Math.random() * 80 + 10, 
         y: Math.random() * 80 + 10, 
         type, 
         life: lifeTime 
     });
  };

  const clickGoldenCookie = () => {
    if (!goldenCookie) return;
    
    let message = "";
    const now = Date.now();
    // Bônus de duração de efeito
    const durationMult = gameState.purchasedSkills.includes('golden_longevity') ? 1.5 : 1.0;

    if (goldenCookie.type === 'lucky') {
        // "Lucky" dá biscoitos baseados no banco atual ou CpS (o menor dos dois, pra evitar exploit)
        // 15% do banco ou 15 minutos de CpS
        const bankCap = gameState.cookies * 0.15;
        const cpsCap = cps * 900; // 15 min
        let gain = Math.min(bankCap, cpsCap) + 13; // +13 base
        
        // Se CpS for 0 ou muito baixo, garante um mínimo baseado no clique
        if (gain < clickValue * 10) gain = clickValue * 10 + 13;

        setGameState(prev => ({ 
            ...prev, 
            cookies: prev.cookies + gain, 
            totalCookies: prev.totalCookies + gain, 
            lifetimeCookies: prev.lifetimeCookies + gain 
        }));
        message = `Sortudo!`;
    } else {
        // Lógica de Efeitos CORRIGIDA
        const type = goldenCookie.type;
        const isFrenzy = type === 'frenzy';
        
        const baseMult = isFrenzy ? 7 : 777;
        const baseDuration = (isFrenzy ? 77000 : 13000) * durationMult;
        const label = isFrenzy ? 'Frenesi (x7)' : 'Click Power (x777)';

        setActiveEffects(prev => {
            const existing = prev.find(e => e.type === type);
            
            if (existing) {
                // Se já existe, APENAS RESETA O TEMPO para o máximo. 
                // NÃO SOMA TEMPO, NÃO MULTIPLICA O MULTIPLICADOR.
                return prev.map(e => 
                    e.type === type 
                    ? { ...e, endTime: now + baseDuration, duration: baseDuration } 
                    : e
                );
            } else {
                // Novo efeito
                return [...prev, { 
                    type, 
                    label, 
                    multiplier: baseMult, 
                    endTime: now + baseDuration, 
                    duration: baseDuration 
                }];
            }
        });
        message = isFrenzy ? "Frenesi!" : "Clickstorm!";
    }
    setGoldenCookie(null);
    return message;
  };

  const calculatePrestigeGain = (lifetimeCookies: number) => {
      if (lifetimeCookies < 10000000) return 0;
      return Math.floor(Math.sqrt(lifetimeCookies / 10000000));
  };

  const getCumulativePrice = (buildingId: string, currentCount: number, skills: string[], amount: number) => {
      const building = BUILDINGS.find(b => b.id === buildingId);
      if (!building) return 0;
      
      let total = 0;
      let costMultiplier = 1;
      
      if (skills.includes('divine_discount')) costMultiplier *= 0.9;
      skills.forEach(sid => {
          if (sid.startsWith('eco_')) {
              const val = parseInt(sid.split('_')[1]);
              costMultiplier *= (1 - (val * 0.02));
          }
      });

      for (let i = 0; i < amount; i++) {
          const basePrice = building.baseCost * Math.pow(1.15, currentCount + i);
          total += Math.floor(basePrice * costMultiplier);
      }
      return total;
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
      setGameState((prev) => ({ 
          ...prev, 
          cookies: prev.cookies - cost, 
          upgrades: [...prev.upgrades, upgradeId] 
      }));
    }
  };

  const manualClick = () => {
    setGameState((prev) => ({ 
        ...prev, 
        cookies: prev.cookies + clickValue, 
        totalCookies: prev.totalCookies + clickValue, 
        lifetimeCookies: prev.lifetimeCookies + clickValue, 
        manualClicks: (prev.manualClicks || 0) + 1 
    }));
    return clickValue;
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
      
      if (confirm(`ASCENSÃO: Você ganhará ${levelsToGain} Cristais. Seu progresso de prédios será resetado, mas conquistas e habilidades serão mantidas.`)) {
          setGameState(prev => ({
              ...INITIAL_STATE,
              cookies: startCookies,
              prestigeLevel: prev.prestigeLevel + levelsToGain,
              purchasedSkills: prev.purchasedSkills,
              achievements: prev.achievements,
              lifetimeCookies: prev.lifetimeCookies, 
              bakeryName: prev.bakeryName,
              // Mantém estatísticas totais, mas reseta o resto
              totalCookies: 0
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
      
      // Check parent requirement
      if (skill.parent && !gameState.purchasedSkills.includes(skill.parent)) return;
      
      setGameState(prev => ({
          ...prev,
          prestigeLevel: prev.prestigeLevel - skill.cost,
          purchasedSkills: [...prev.purchasedSkills, skillId]
      }));
  };

  const updateBakeryName = (name: string) => setGameState(p => ({...p, bakeryName: name}));
  const dismissNotification = (id: string) => setNotificationQueue(q => q.filter(n => n.id !== id));

  return { 
      gameState, cps, clickValue, activeEffects, notificationQueue, isSaving, goldenCookie, 
      saveGame, buyBuilding, buyUpgrade, manualClick, resetGame, clickGoldenCookie, 
      getCumulativePrice, updateBakeryName, dismissNotification, ascend, calculatePrestigeGain, buySkill 
  };
};
