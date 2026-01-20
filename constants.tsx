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
  Cookie,
  Zap
} from 'lucide-react';
import { Building, Upgrade, Achievement } from './types';

export const BUILDINGS: Building[] = [
  {
    id: 'cursor',
    name: 'Cursor',
    baseCost: 15,
    baseCps: 0.1,
    description: 'Clica automaticamente uma vez a cada 10 segundos.',
    icon: MousePointer2,
  },
  {
    id: 'grandma',
    name: 'Vovó',
    baseCost: 100,
    baseCps: 1,
    description: 'Uma doce vovó para assar biscoitos para você.',
    icon: User,
  },
  {
    id: 'farm',
    name: 'Fazenda',
    baseCost: 1100,
    baseCps: 8,
    description: 'Cultiva plantas de biscoito a partir de sementes.',
    icon: Wheat,
  },
  {
    id: 'mine',
    name: 'Mina',
    baseCost: 12000,
    baseCps: 47,
    description: 'Mina massa de biscoito e gotas de chocolate.',
    icon: Pickaxe,
  },
  {
    id: 'factory',
    name: 'Fábrica',
    baseCost: 130000,
    baseCps: 260,
    description: 'Produz grandes quantidades de biscoitos industrializados.',
    icon: Factory,
  },
  {
    id: 'bank',
    name: 'Banco',
    baseCost: 1400000,
    baseCps: 1400,
    description: 'Gera biscoitos a partir de juros compostos.',
    icon: Landmark,
  },
  {
    id: 'temple',
    name: 'Templo',
    baseCost: 20000000,
    baseCps: 7800,
    description: 'Cheio de biscoitos preciosos e chocolate antigo.',
    icon: Sparkles,
  },
  {
    id: 'prism',
    name: 'Prisma',
    baseCost: 330000000,
    baseCps: 44000,
    description: 'Converte a própria luz em biscoitos.',
    icon: Atom,
  },
];

export const UPGRADES: Upgrade[] = [
  {
    id: 'click_1',
    name: 'Dedo Reforçado',
    cost: 500,
    type: 'click',
    multiplier: 2,
    description: 'O cursor e os cliques são duas vezes mais eficientes.',
    trigger: (cookies) => cookies >= 100,
  },
  {
    id: 'cursor_1',
    name: 'Mouse de Titânio',
    cost: 1000,
    type: 'building',
    targetId: 'cursor',
    multiplier: 2,
    description: 'Cursores são duas vezes mais eficientes.',
    trigger: (_, buildings) => (buildings['cursor'] || 0) >= 1,
  },
  {
    id: 'grandma_1',
    name: 'Rolo de Massa',
    cost: 1000,
    type: 'building',
    targetId: 'grandma',
    multiplier: 2,
    description: 'Vovós são duas vezes mais eficientes.',
    trigger: (_, buildings) => (buildings['grandma'] || 0) >= 1,
  },
  {
    id: 'farm_1',
    name: 'Fertilizante de Açúcar',
    cost: 11000,
    type: 'building',
    targetId: 'farm',
    multiplier: 2,
    description: 'Fazendas são duas vezes mais eficientes.',
    trigger: (_, buildings) => (buildings['farm'] || 0) >= 1,
  },
  {
    id: 'mine_1',
    name: 'Broca de Diamante',
    cost: 120000,
    type: 'building',
    targetId: 'mine',
    multiplier: 2,
    description: 'Minas são duas vezes mais eficientes.',
    trigger: (_, buildings) => (buildings['mine'] || 0) >= 1,
  },
  {
    id: 'click_2',
    name: 'Tunel do Carpo',
    cost: 50000,
    type: 'click',
    multiplier: 2,
    description: 'O cursor e os cliques são duas vezes mais eficientes.',
    trigger: (cookies) => cookies >= 10000,
  },
  {
    id: 'global_1',
    name: 'Cookies Dourados',
    cost: 77777,
    type: 'global',
    multiplier: 1.1, // Small global boost
    description: 'Aumenta a produção de todos os prédios em 10%.',
    trigger: (cookies) => cookies >= 50000,
  }
];

export const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'ach_1',
        name: 'Primeiro Passo',
        description: 'Faça 1 biscoito.',
        icon: Cookie,
        trigger: (state) => state.totalCookies >= 1,
    },
    {
        id: 'ach_click_100',
        name: 'Dedo Cansado',
        description: 'Clique no biscoitão 100 vezes.',
        icon: MousePointer2,
        trigger: (state) => state.manualClicks >= 100,
    },
    {
        id: 'ach_100',
        name: 'Padaria Caseira',
        description: 'Faça 100 biscoitos.',
        icon: Wheat,
        trigger: (state) => state.totalCookies >= 100,
    },
    {
        id: 'ach_grandma',
        name: 'Amor de Vó',
        description: 'Compre uma vovó.',
        icon: User,
        trigger: (state) => (state.buildings['grandma'] || 0) >= 1,
    },
    {
        id: 'ach_1000',
        name: 'Produção em Massa',
        description: 'Faça 1.000 biscoitos.',
        icon: Factory,
        trigger: (state) => state.totalCookies >= 1000,
    },
    {
        id: 'ach_fast',
        name: 'Velocidade da Luz',
        description: 'Alcance 100 biscoitos por segundo.',
        icon: Zap,
        trigger: (state) => {
            return state.totalCookies >= 100000; // Simplified for now
        },
    },
    {
        id: 'ach_million',
        name: 'Milionário',
        description: 'Faça 1.000.000 biscoitos.',
        icon: Trophy,
        trigger: (state) => state.totalCookies >= 1000000,
    }
];

export const INITIAL_STATE: import('./types').GameState = {
  cookies: 0,
  totalCookies: 0,
  manualClicks: 0,
  buildings: {},
  upgrades: [],
  achievements: [],
  lastSaveTime: Date.now(),
  startTime: Date.now(),
  bakeryName: "Padaria do Jogador",
};