
import { 
  MousePointer2, User, Wheat, Pickaxe, Factory, Landmark, Sparkles, Atom, Trophy, Zap, Scroll, 
  FlaskConical, DoorOpen, Hourglass, Rocket, Crown, Clock, PiggyBank, Dna, Gem, Briefcase,
  Cpu, Activity, Ghost, Heart, Stars, Infinity, UserCircle, Microscope, ZapOff, Cloud, Shield,
  Search, Map, Mail, Phone, Camera, Music, Video, Settings, Key, Wrench
} from 'lucide-react';
import { Building, Upgrade, Achievement, Skill } from './types';

// --- CONSTRUÇÕES (20 TOTAL) ---
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
  { id: 'antimatter', name: 'Cond. Antimatéria', baseCost: 2100000000000000, baseCps: 3100000000, description: 'Condensa o nada em biscoitos.', icon: Cpu },
  { id: 'javascript', name: 'Console JS', baseCost: 26000000000000000, baseCps: 21000000000, description: 'Cria biscoitos com código puro.', icon: Activity },
  { id: 'fractal', name: 'Motor Fractal', baseCost: 310000000000000000, baseCps: 150000000000, description: 'Biscoitos que fazem biscoitos.', icon: Infinity },
  { id: 'chance', name: 'Gerador de Sorte', baseCost: 3800000000000000000, baseCps: 1100000000000, description: 'Manipula a probabilidade doce.', icon: Sparkles },
  { id: 'idleverse', name: 'Ocioso-verso', baseCost: 46000000000000000000, baseCps: 8300000000000, description: 'Universos inteiros de biscoito.', icon: Stars },
  { id: 'cortex', name: 'Padeiro Córtex', baseCost: 540000000000000000000, baseCps: 64000000000000, description: 'Sonha com biscoitos infinitos.', icon: Dna },
  { id: 'you', name: 'Você', baseCost: 6500000000000000000000, baseCps: 510000000000000, description: 'Literalmente você fazendo biscoitos.', icon: UserCircle },
];

// --- ARVORE DE HABILIDADES (ESPAÇAMENTO ÉPICO) ---
const generateSkills = (): Skill[] => {
    // Escala: x 0-100 (horizontal), y 0-100 (vertical, onde 98 é o fundo e 2 é o topo)
    const skills: Skill[] = [
        { id: 'heavenly_gates', name: 'Portões Celestiais', description: 'Desbloqueia o poder dos cristais. +10% CpS global.', cost: 1, icon: DoorOpen, x: 50, y: 95 },
    ];

    const branchLength = 12;
    const startY = 88;
    const gapY = 5.5; // Distância vertical entre nós
    const curveIntensity = 30; // O quão "larga" a árvore fica

    // Ícones para cada ramo
    const economyIcons = [PiggyBank, Gem, Briefcase, Key, Shield, Clock, Wrench, Settings, Crown, Heart, Ghost, Microscope];
    const luckIcons = [Sparkles, Stars, Zap, Search, Map, Mail, Phone, Camera, Music, Video, Activity, Cpu];
    const prodIcons = [Zap, Infinity, Rocket, FlaskConical, Atom, Dna, Crown, UserCircle, Microscope, Cloud, Heart, Ghost];

    for (let i = 1; i <= branchLength; i++) {
        // Cálculo de Curva: Math.sin para criar um arco suave
        // Normalizamos 'i' entre 0 e 1 para aplicar na curva
        const progress = i / branchLength;
        const widthOffset = Math.sin(progress * Math.PI * 0.8) * curveIntensity;
        const currentY = startY - ((i - 1) * gapY);

        // Branch Esquerda: Economia (X < 50)
        skills.push({
            id: `eco_${i}`,
            name: `Poder Econômico ${i}`,
            description: `Reduz custos em ${i * 2}%.`,
            cost: i * 5,
            icon: economyIcons[i-1] || PiggyBank,
            x: 50 - 10 - widthOffset, // Começa um pouco a esquerda e abre
            y: currentY,
            parent: i === 1 ? 'heavenly_gates' : `eco_${i-1}`
        });

        // Branch Direita: Sorte (X > 50)
        skills.push({
            id: `luck_${i}`,
            name: `Caminho da Sorte ${i}`,
            description: `Aumenta spawn de Cookies Dourados em ${i * 5}%.`,
            cost: i * 5,
            icon: luckIcons[i-1] || Sparkles,
            x: 50 + 10 + widthOffset, // Começa um pouco a direita e abre
            y: currentY,
            parent: i === 1 ? 'heavenly_gates' : `luck_${i-1}`
        });

        // Branch Central: Produção Pura (X = 50) - Sobe reto
        skills.push({
            id: `prod_${i}`,
            name: `Fluxo Vital ${i}`,
            description: `Aumenta produção global em +${i * 3}%.`,
            cost: i * 8,
            icon: prodIcons[i-1] || Zap,
            x: 50,
            y: currentY - 2, // Ligeiramente deslocado para cima para criar um padrão de diamante com os lados
            parent: i === 1 ? 'heavenly_gates' : `prod_${i-1}`
        });
    }

    // --- ESPECIAIS (INTERSTÍCIOS) ---
    // Colocados estrategicamente entre os ramos para conectar visualmente
    
    // Nível Baixo (Entre os ramos iniciais)
    skills.push({ id: 'divine_discount', name: 'Desconto Divino', description: 'Prédios custam 10% menos.', cost: 3, icon: PiggyBank, x: 38, y: 82, parent: 'heavenly_gates' });
    skills.push({ id: 'lucky_stars', name: 'Sorte Celestial', description: 'Cookies Dourados 20% mais frequentes.', cost: 3, icon: Sparkles, x: 62, y: 82, parent: 'heavenly_gates' });
    
    // Nível Médio (Conexões cruzadas)
    skills.push({ id: 'pure_magic', name: 'Magia Pura', description: 'Upgrades custam 20% menos.', cost: 10, icon: Gem, x: 30, y: 60, parent: 'eco_4' });
    skills.push({ id: 'time_warp', name: 'Dobra Temporal', description: 'Começa ascensões com 50k cookies.', cost: 15, icon: Clock, x: 70, y: 60, parent: 'luck_4' });
    
    // Nível Alto (Perto do topo dos ramos)
    skills.push({ id: 'click_god', name: 'Toque de Midas', description: 'Cliques valem +5% do CpS.', cost: 10, icon: MousePointer2, x: 35, y: 40, parent: 'eco_8' });
    skills.push({ id: 'golden_longevity', name: 'Era Dourada', description: 'Efeitos dourados +30% tempo.', cost: 15, icon: Hourglass, x: 65, y: 40, parent: 'luck_8' });
    
    // --- ENDGAME (Topo da Árvore - Centralizado) ---
    const topY = 15;
    
    skills.push({ id: 'angel_investor', name: 'Investidor Anjo', description: 'Offline 90% eficiente por 48h.', cost: 50, icon: Crown, x: 50, y: topY + 8, parent: 'prod_12' });
    
    skills.push({ id: 'cookie_galaxy', name: 'Galáxia Doce', description: 'Bônus de Cristais sobe de 1% para 2%.', cost: 100, icon: Dna, x: 50, y: topY, parent: 'angel_investor' });
    
    skills.push({ id: 'omega', name: 'Ponto Ômega', description: 'Produção global x2.0.', cost: 500, icon: ZapOff, x: 50, y: topY - 10, parent: 'cookie_galaxy' });

    return skills;
};

export const SKILLS: Skill[] = generateSkills();

// --- GERADOR DE UPGRADES ---
const generateBuildingUpgrades = (): Upgrade[] => {
  const upgrades: Upgrade[] = [];
  [1, 50, 100, 500, 1000, 5000, 10000, 50000, 100000].forEach((_, idx) => {
     upgrades.push({
        id: `click_upgrade_${idx}`,
        name: `Clique Reforçado ${idx + 1}`,
        cost: 500 * Math.pow(15, idx),
        type: 'click',
        multiplier: 2,
        description: 'Cliques manuais são 2x mais eficientes.',
        trigger: (cookies, _) => cookies >= 100 * Math.pow(10, idx),
     });
  });

  BUILDINGS.forEach((b) => {
    const tiers = [{ count: 1, mult: 2, name: 'Básico' }, { count: 10, mult: 2, name: 'Robusto' }, { count: 25, mult: 2, name: 'Poderoso' }, { count: 50, mult: 2, name: 'Mítico' }, { count: 100, mult: 2, name: 'Lendário' }, { count: 150, mult: 2, name: 'Divino' }, { count: 200, mult: 5, name: 'Cósmico' }, { count: 300, mult: 10, name: 'Absoluto' }];
    tiers.forEach((tier, idx) => {
      const cost = b.baseCost * 10 * Math.pow(8, idx);
      upgrades.push({ id: `${b.id}_upgrade_${idx}`, name: `${b.name} ${tier.name}`, cost: Math.floor(cost), type: 'building', targetId: b.id, multiplier: tier.mult, description: `${b.name}s são ${tier.mult}x mais eficientes.`, trigger: (_, buildings) => (buildings[b.id] || 0) >= tier.count });
    });
  });
  return upgrades;
};

export const UPGRADES: Upgrade[] = generateBuildingUpgrades();

const generateAchievements = (): Achievement[] => {
    const list: Achievement[] = [];
    [1, 1e3, 1e6, 1e9, 1e12, 1e15, 1e18, 1e21].forEach((amount, idx) => {
        list.push({ id: `ach_cookie_${idx}`, name: `Milestone ${idx + 1}`, description: `Faça ${amount.toLocaleString()} biscoitos.`, icon: Trophy, trigger: (state) => state.totalCookies >= amount });
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
  purchasedSkills: [],
  lastSaveTime: Date.now(),
  startTime: Date.now(),
  bakeryName: "Padaria do Jogador",
  prestigeLevel: 0,
};
