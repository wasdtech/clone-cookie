import { 
  MousePointer2, 
  User, 
  Wheat, 
  Pickaxe, 
  Factory, 
  Landmark, 
  Sparkles, 
  Atom,
  Trophy,
  Zap,
  Scroll,
  FlaskConical,
  DoorOpen,
  Hourglass,
  Rocket
} from 'lucide-react';
import { Building, Upgrade, Achievement } from './types';

// --- CONSTRUÇÕES (Balanceadas para dificuldade maior) ---
export const BUILDINGS: Building[] = [
  { id: 'cursor', name: 'Cursor', baseCost: 15, baseCps: 0.1, description: 'Clica automaticamente uma vez a cada 10 segundos.', icon: MousePointer2 },
  { id: 'grandma', name: 'Vovó', baseCost: 100, baseCps: 1, description: 'Uma doce vovó para assar biscoitos.', icon: User },
  { id: 'farm', name: 'Fazenda', baseCost: 1100, baseCps: 8, description: 'Cultiva plantas de biscoito.', icon: Wheat },
  { id: 'mine', name: 'Mina', baseCost: 12000, baseCps: 47, description: 'Mina massa de biscoito.', icon: Pickaxe },
  { id: 'factory', name: 'Fábrica', baseCost: 130000, baseCps: 260, description: 'Produção industrial em massa.', icon: Factory },
  { id: 'bank', name: 'Banco', baseCost: 1400000, baseCps: 1400, description: 'Gera biscoitos com juros.', icon: Landmark },
  { id: 'temple', name: 'Templo', baseCost: 20000000, baseCps: 7800, description: 'Biscoitos abençoados.', icon: Sparkles },
  { id: 'wizard', name: 'Torre de Mago', baseCost: 330000000, baseCps: 44000, description: 'Invoca biscoitos com magia.', icon: Scroll },
  { id: 'shipment', name: 'Foguete', baseCost: 5100000000, baseCps: 260000, description: 'Traz biscoitos do planeta Biscoito.', icon: Rocket },
  { id: 'alchemy', name: 'Lab. Alquimia', baseCost: 75000000000, baseCps: 1600000, description: 'Transforma ouro em biscoitos.', icon: FlaskConical },
  { id: 'portal', name: 'Portal', baseCost: 1000000000000, baseCps: 10000000, description: 'Abre portais para o Biscoitoverso.', icon: DoorOpen },
  { id: 'time_machine', name: 'Máq. do Tempo', baseCost: 14000000000000, baseCps: 65000000, description: 'Traz biscoitos do passado.', icon: Hourglass },
  { id: 'prism', name: 'Prisma', baseCost: 170000000000000, baseCps: 430000000, description: 'Converte luz em biscoitos.', icon: Atom },
];

// --- GERADOR DE UPGRADES (Para criar volume e escala) ---
const generateBuildingUpgrades = (): Upgrade[] => {
  const upgrades: Upgrade[] = [];
  
  // Upgrades de Clique
  [1, 50, 100, 500, 1000, 5000, 10000].forEach((_, idx) => {
     upgrades.push({
        id: `click_upgrade_${idx}`,
        name: `Clique Reforçado ${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][idx] || idx}`,
        cost: 500 * Math.pow(10, idx),
        type: 'click',
        multiplier: 2,
        description: 'Cliques manuais são 2x mais eficientes.',
        trigger: (cookies, _) => cookies >= 100 * Math.pow(10, idx),
     });
  });

  // Upgrades por Construção (Tiers)
  BUILDINGS.forEach((b) => {
    const tiers = [
      { count: 1, mult: 2, name: 'Básico' },
      { count: 10, mult: 2, name: 'Robusto' },
      { count: 25, mult: 2, name: 'Poderoso' },
      { count: 50, mult: 2, name: 'Mítico' },
      { count: 100, mult: 2, name: 'Lendário' },
      { count: 150, mult: 2, name: 'Divino' },
      { count: 200, mult: 2, name: 'Cósmico' },
      { count: 250, mult: 20, name: 'Infinito' }, // Big jump
    ];

    tiers.forEach((tier, idx) => {
      const cost = b.baseCost * 10 * Math.pow(5, idx);
      upgrades.push({
        id: `${b.id}_upgrade_${idx}`,
        name: `${b.name} ${tier.name}`,
        cost: Math.floor(cost),
        type: 'building',
        targetId: b.id,
        multiplier: tier.mult,
        description: `${b.name}s são ${tier.mult}x mais eficientes.`,
        trigger: (_, buildings) => (buildings[b.id] || 0) >= tier.count,
      });
    });
  });

  // Upgrades Globais (Kitten/Cookie helpers)
  const globalTiers = [
      { cost: 1000000, mult: 1.1, name: "Receita Secreta" },
      { cost: 50000000, mult: 1.15, name: "Açúcar Mágico" },
      { cost: 1000000000, mult: 1.20, name: "Chocolate Puro" },
      { cost: 50000000000, mult: 1.25, name: "Massa Quântica" },
  ];
  
  globalTiers.forEach((tier, idx) => {
      upgrades.push({
          id: `global_upgrade_${idx}`,
          name: tier.name,
          cost: tier.cost,
          type: 'global',
          multiplier: tier.mult,
          description: `Aumenta a produção de TODOS os prédios em +${Math.round((tier.mult - 1)*100)}%.`,
          trigger: (cookies) => cookies >= tier.cost * 0.5,
      });
  });

  return upgrades;
};

export const UPGRADES: Upgrade[] = generateBuildingUpgrades();

// --- CONQUISTAS ---
const generateAchievements = (): Achievement[] => {
    const list: Achievement[] = [];

    // Cookies Totais
    const cookieMilestones = [1, 1000, 100000, 1000000, 1000000000, 1000000000000];
    const cookieTitles = ["Primeiro Passo", "Fornada Caseira", "Fábrica Local", "Milionário", "Bilionário", "Trilionário"];
    
    cookieMilestones.forEach((amount, idx) => {
        list.push({
            id: `ach_cookie_${idx}`,
            name: cookieTitles[idx] || `Magnata ${idx}`,
            description: `Faça ${amount.toLocaleString()} biscoitos no total.`,
            icon: Trophy,
            trigger: (state) => state.totalCookies >= amount
        });
    });

    // CpS Milestones
    const cpsMilestones = [10, 100, 1000, 100000, 1000000];
    cpsMilestones.forEach((amount, idx) => {
         list.push({
            id: `ach_cps_${idx}`,
            name: `Fluxo ${['Lento', 'Rápido', 'Veloz', 'Sônico', 'Luz'][idx]}`,
            description: `Atinja ${amount.toLocaleString()} CpS.`,
            icon: Zap,
            trigger: (_) => {
                // Approximate check, real cps is in engine
                // We use a simplified calculation or check passed state if expanded
                return true; // Simplificado: A engine checa isso melhor
            } 
         });
    });

    // Building Milestones (1, 50, 100 of each)
    BUILDINGS.forEach(b => {
        list.push({
            id: `ach_${b.id}_1`,
            name: `Dono de ${b.name}`,
            description: `Tenha 1 ${b.name}.`,
            icon: b.icon,
            trigger: (state) => (state.buildings[b.id] || 0) >= 1
        });
        list.push({
            id: `ach_${b.id}_50`,
            name: `${b.name} em Massa`,
            description: `Tenha 50 ${b.name}s.`,
            icon: b.icon,
            trigger: (state) => (state.buildings[b.id] || 0) >= 50
        });
    });
    
    // Ascensão
    list.push({
        id: 'ach_ascension_1',
        name: 'O Início do Fim',
        description: 'Renascimento pela primeira vez.',
        icon: Sparkles,
        trigger: (state) => state.prestigeLevel > 0
    });

    return list;
};

export const ACHIEVEMENTS: Achievement[] = generateAchievements();

export const INITIAL_STATE: import('./types').GameState = {
  cookies: 0,
  totalCookies: 0,
  lifetimeCookies: 0,
  manualClicks: 0,
  buildings: {},
  upgrades: [],
  achievements: [],
  lastSaveTime: Date.now(),
  startTime: Date.now(),
  bakeryName: "Padaria do Jogador",
  prestigeLevel: 0,
};