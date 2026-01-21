import { LucideIcon } from 'lucide-react';

export interface Building {
  id: string;
  name: string;
  baseCost: number;
  baseCps: number;
  description: string;
  icon: LucideIcon;
}

export interface Upgrade {
  id: string;
  name: string;
  cost: number;
  type: 'click' | 'building' | 'global';
  targetId?: string; // ID of the building this affects
  multiplier: number; // Multiplier (e.g., 2 for x2)
  description: string;
  trigger: (cookies: number, buildings: Record<string, number>) => boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  trigger: (state: GameState) => boolean;
}

export interface GameState {
  cookies: number;
  totalCookies: number; // Lifetime cookies current run
  lifetimeCookies: number; // All time cookies (including past ascensions)
  manualClicks: number;
  buildings: Record<string, number>;
  upgrades: string[];
  achievements: string[];
  lastSaveTime: number;
  startTime: number;
  bakeryName: string;
  prestigeLevel: number; // Nível de ascensão (Cristais)
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color?: string;
}

export interface GoldenCookieState {
  active: boolean;
  x: number;
  y: number;
  type: 'frenzy' | 'lucky' | 'clickfrenzy';
  life: number;
}

export interface ActiveEffect {
  type: string;
  label: string;
  multiplier: number;
  endTime: number;
  duration: number;
}