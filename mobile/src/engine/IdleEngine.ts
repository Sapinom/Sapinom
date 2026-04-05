/**
 * Idle/Incremental game engine.
 * Inspired by Universal Paperclips / AdVenture Capitalist.
 *
 * Core loop:
 * - Tap the business to earn money manually
 * - Buy upgrades to earn more per tap
 * - Buy managers to auto-earn
 * - Unlock new businesses as you grow
 * - Weather, seasons, events modify your income
 * - Each business has a fill bar — when it fills, you collect
 */

import { rand, randInt, chance, clamp, weightedPick, vary } from '../utils/random';

// ============ TYPES ============

export interface BusinessDef {
  id: string;
  name: string;
  emoji: string;
  baseCost: number;
  baseRevenue: number;     // revenue per cycle
  baseCycleTime: number;   // seconds to fill the bar
  costMultiplier: number;  // cost increases by this per owned
  unlockAt: number;        // total cash earned to unlock
  managerCost: number;     // cost to auto-run this business
  weatherSensitivity: Record<string, number>; // weather -> multiplier
  seasonBonus: Record<string, number>;
}

export interface OwnedBusiness {
  defId: string;
  count: number;         // how many of this type you own
  level: number;         // upgrade level (multiplies revenue)
  progress: number;      // 0..1 fill bar
  hasManager: boolean;   // auto-collects
  running: boolean;      // currently filling
}

export interface Upgrade {
  id: string;
  name: string;
  emoji: string;
  description: string;
  cost: number;
  targetBiz: string;     // which business it affects, or 'all'
  multiplier: number;    // revenue multiplier
  unlockAt: number;      // total earned to show this upgrade
  purchased: boolean;
}

export interface GameEvent {
  id: string;
  name: string;
  emoji: string;
  description: string;
  effect: string;        // description of effect
  revenueMultiplier: number;
  duration: number;      // seconds
  impact: 'positive' | 'negative' | 'neutral';
}

export interface ActiveGameEvent extends GameEvent {
  timeLeft: number;
}

export interface IdleState {
  // Player
  cash: number;
  totalEarned: number;
  totalTaps: number;
  cashPerTap: number;

  // Time
  day: number;
  season: string;
  weather: string;
  weatherTimer: number;
  dayTimer: number;
  ecoCycle: string;

  // Businesses
  businesses: OwnedBusiness[];

  // Upgrades
  upgrades: Upgrade[];

  // Events
  activeEvents: ActiveGameEvent[];
  eventCooldown: number;
  eventLog: Array<{ day: number; name: string; emoji: string; impact: string }>;

  // Meta
  started: boolean;
  playerName: string;
  lifetimeEarned: number;
  lastTick: number;
}

// ============ BUSINESS DEFINITIONS ============

export const BUSINESS_DEFS: BusinessDef[] = [
  {
    id: 'food_truck', name: 'Food Truck', emoji: '🚚',
    baseCost: 5, baseRevenue: 1, baseCycleTime: 0.6,
    costMultiplier: 1.07, unlockAt: 0, managerCost: 1000,
    weatherSensitivity: { sun: 1.3, rain: 0.6, storm: 0.3, heatwave: 1.1, snow: 0.4, flood: 0.2, cloudy: 0.9 },
    seasonBonus: { spring: 1.1, summer: 1.5, autumn: 0.8, winter: 0.5 },
  },
  {
    id: 'boutique', name: 'Boutique', emoji: '🛍️',
    baseCost: 60, baseRevenue: 6, baseCycleTime: 3,
    costMultiplier: 1.15, unlockAt: 50, managerCost: 15000,
    weatherSensitivity: { sun: 1.1, rain: 0.8, storm: 0.6, heatwave: 0.9, snow: 0.7, flood: 0.4, cloudy: 1.0 },
    seasonBonus: { spring: 1.1, summer: 0.9, autumn: 1.0, winter: 1.3 },
  },
  {
    id: 'restaurant', name: 'Restaurant', emoji: '🍽️',
    baseCost: 720, baseRevenue: 54, baseCycleTime: 6,
    costMultiplier: 1.14, unlockAt: 500, managerCost: 100000,
    weatherSensitivity: { sun: 1.2, rain: 0.7, storm: 0.5, heatwave: 0.8, snow: 0.6, flood: 0.3, cloudy: 0.95 },
    seasonBonus: { spring: 1.0, summer: 1.2, autumn: 0.9, winter: 0.8 },
  },
  {
    id: 'garage', name: 'Garage Auto', emoji: '🔧',
    baseCost: 8640, baseRevenue: 432, baseCycleTime: 12,
    costMultiplier: 1.13, unlockAt: 5000, managerCost: 500000,
    weatherSensitivity: { sun: 0.9, rain: 1.1, storm: 1.2, heatwave: 1.0, snow: 1.3, flood: 1.1, cloudy: 1.0 },
    seasonBonus: { spring: 0.9, summer: 0.9, autumn: 1.1, winter: 1.3 },
  },
  {
    id: 'startup', name: 'Startup', emoji: '💻',
    baseCost: 103680, baseRevenue: 2592, baseCycleTime: 24,
    costMultiplier: 1.12, unlockAt: 50000, managerCost: 10000000,
    weatherSensitivity: { sun: 1.0, rain: 1.0, storm: 0.9, heatwave: 0.95, snow: 1.0, flood: 0.8, cloudy: 1.0 },
    seasonBonus: { spring: 1.0, summer: 0.95, autumn: 1.0, winter: 1.0 },
  },
  {
    id: 'ferme', name: 'Ferme', emoji: '🌾',
    baseCost: 1244160, baseRevenue: 31104, baseCycleTime: 48,
    costMultiplier: 1.11, unlockAt: 500000, managerCost: 100000000,
    weatherSensitivity: { sun: 1.3, rain: 1.1, storm: 0.4, heatwave: 0.3, snow: 0.3, flood: 0.2, cloudy: 0.9 },
    seasonBonus: { spring: 1.4, summer: 1.2, autumn: 1.3, winter: 0.3 },
  },
  {
    id: 'immobilier', name: 'Agence Immo', emoji: '🏠',
    baseCost: 14929920, baseRevenue: 248832, baseCycleTime: 96,
    costMultiplier: 1.10, unlockAt: 5000000, managerCost: 1000000000,
    weatherSensitivity: { sun: 1.05, rain: 0.95, storm: 0.9, heatwave: 1.0, snow: 0.9, flood: 0.7, cloudy: 1.0 },
    seasonBonus: { spring: 1.2, summer: 1.0, autumn: 1.0, winter: 0.8 },
  },
  {
    id: 'hotel', name: 'Hôtel', emoji: '🏨',
    baseCost: 179159040, baseRevenue: 4478976, baseCycleTime: 192,
    costMultiplier: 1.09, unlockAt: 100000000, managerCost: 50000000000,
    weatherSensitivity: { sun: 1.4, rain: 0.7, storm: 0.5, heatwave: 1.1, snow: 1.1, flood: 0.4, cloudy: 0.9 },
    seasonBonus: { spring: 1.1, summer: 1.6, autumn: 0.7, winter: 1.1 },
  },
];

// ============ UPGRADES ============

function generateUpgrades(): Upgrade[] {
  const ups: Upgrade[] = [];
  for (const biz of BUSINESS_DEFS) {
    // x3 at 25 owned
    ups.push({ id: `${biz.id}_x3`, name: `${biz.emoji} Meilleur ${biz.name}`, emoji: '⚡', description: `x3 revenus du ${biz.name}`, cost: biz.baseCost * 50, targetBiz: biz.id, multiplier: 3, unlockAt: biz.unlockAt * 3 || 25, purchased: false });
    // x5 at 50 owned
    ups.push({ id: `${biz.id}_x5`, name: `${biz.emoji} ${biz.name} Premium`, emoji: '💎', description: `x5 revenus du ${biz.name}`, cost: biz.baseCost * 500, targetBiz: biz.id, multiplier: 5, unlockAt: biz.unlockAt * 10 || 500, purchased: false });
    // x10 at 100 owned
    ups.push({ id: `${biz.id}_x10`, name: `${biz.emoji} ${biz.name} Empire`, emoji: '👑', description: `x10 revenus du ${biz.name}`, cost: biz.baseCost * 10000, targetBiz: biz.id, multiplier: 10, unlockAt: biz.unlockAt * 50 || 10000, purchased: false });
  }
  // Global upgrades
  ups.push({ id: 'all_x2', name: 'Marketing Global', emoji: '📢', description: 'x2 tous les revenus', cost: 50000, targetBiz: 'all', multiplier: 2, unlockAt: 10000, purchased: false });
  ups.push({ id: 'all_x3', name: 'Franchise Empire', emoji: '🌍', description: 'x3 tous les revenus', cost: 5000000, targetBiz: 'all', multiplier: 3, unlockAt: 1000000, purchased: false });
  ups.push({ id: 'all_x5', name: 'Monopole', emoji: '🏆', description: 'x5 tous les revenus', cost: 500000000, targetBiz: 'all', multiplier: 5, unlockAt: 100000000, purchased: false });
  ups.push({ id: 'tap_x2', name: 'Double Tap', emoji: '👆', description: 'x2 revenus par tap', cost: 100, targetBiz: 'tap', multiplier: 2, unlockAt: 30, purchased: false });
  ups.push({ id: 'tap_x5', name: 'Mega Tap', emoji: '🖐️', description: 'x5 revenus par tap', cost: 10000, targetBiz: 'tap', multiplier: 5, unlockAt: 3000, purchased: false });
  ups.push({ id: 'tap_x10', name: 'Ultra Tap', emoji: '💥', description: 'x10 revenus par tap', cost: 1000000, targetBiz: 'tap', multiplier: 10, unlockAt: 300000, purchased: false });
  return ups;
}

// ============ EVENTS ============

const EVENT_POOL: GameEvent[] = [
  { id: 'rush_hour', name: 'Rush hour !', emoji: '🏃', description: 'Affluence record !', effect: 'x2 revenus 30s', revenueMultiplier: 2, duration: 30, impact: 'positive' },
  { id: 'food_fest', name: 'Festival culinaire', emoji: '🎪', description: 'La ville fait la fête.', effect: 'x3 revenus 20s', revenueMultiplier: 3, duration: 20, impact: 'positive' },
  { id: 'tax_break', name: 'Réduction fiscale', emoji: '📜', description: 'Le gouvernement baisse les taxes.', effect: 'x2 revenus 45s', revenueMultiplier: 2, duration: 45, impact: 'positive' },
  { id: 'viral', name: 'Buzz viral !', emoji: '📱', description: 'Tout le monde parle de vous.', effect: 'x4 revenus 15s', revenueMultiplier: 4, duration: 15, impact: 'positive' },
  { id: 'strike', name: 'Grève générale', emoji: '✊', description: 'Les employés protestent.', effect: 'x0.5 revenus 20s', revenueMultiplier: 0.5, duration: 20, impact: 'negative' },
  { id: 'inspection', name: 'Contrôle fiscal', emoji: '📋', description: 'L\'inspecteur débarque.', effect: 'x0.3 revenus 15s', revenueMultiplier: 0.3, duration: 15, impact: 'negative' },
  { id: 'blackout', name: 'Coupure de courant', emoji: '🔌', description: 'Panne générale dans la ville.', effect: 'x0.4 revenus 25s', revenueMultiplier: 0.4, duration: 25, impact: 'negative' },
  { id: 'influencer', name: 'Visite d\'influenceur', emoji: '🌟', description: 'Un influenceur teste vos business.', effect: 'x2.5 revenus 25s', revenueMultiplier: 2.5, duration: 25, impact: 'positive' },
];

// ============ WEATHER ============

const WEATHER_BY_SEASON: Record<string, Array<{ type: string; weight: number }>> = {
  spring: [{ type: 'sun', weight: 35 }, { type: 'rain', weight: 30 }, { type: 'cloudy', weight: 25 }, { type: 'storm', weight: 8 }, { type: 'heatwave', weight: 2 }],
  summer: [{ type: 'sun', weight: 50 }, { type: 'cloudy', weight: 15 }, { type: 'rain', weight: 10 }, { type: 'heatwave', weight: 15 }, { type: 'storm', weight: 8 }, { type: 'flood', weight: 2 }],
  autumn: [{ type: 'rain', weight: 35 }, { type: 'cloudy', weight: 25 }, { type: 'sun', weight: 20 }, { type: 'storm', weight: 12 }, { type: 'flood', weight: 5 }, { type: 'snow', weight: 3 }],
  winter: [{ type: 'cloudy', weight: 25 }, { type: 'snow', weight: 25 }, { type: 'rain', weight: 20 }, { type: 'sun', weight: 15 }, { type: 'storm', weight: 10 }, { type: 'flood', weight: 3 }],
};

const SEASONS = ['spring', 'summer', 'autumn', 'winter'];

// ============ STATE CREATION ============

export function createIdleState(name: string): IdleState {
  return {
    cash: 0,
    totalEarned: 0,
    totalTaps: 0,
    cashPerTap: 1,
    day: 1,
    season: 'spring',
    weather: 'sun',
    weatherTimer: 15,
    dayTimer: 60,
    ecoCycle: 'stable',
    businesses: BUSINESS_DEFS.map(def => ({
      defId: def.id,
      count: def.id === 'food_truck' ? 1 : 0,
      level: 1,
      progress: 0,
      hasManager: false,
      running: false,
    })),
    upgrades: generateUpgrades(),
    activeEvents: [],
    eventCooldown: 30,
    eventLog: [],
    started: true,
    playerName: name,
    lifetimeEarned: 0,
    lastTick: Date.now(),
  };
}

// ============ GAME LOGIC ============

export function getBusinessCost(def: BusinessDef, owned: number): number {
  return Math.round(def.baseCost * Math.pow(def.costMultiplier, owned));
}

export function getBusinessRevenue(state: IdleState, bizState: OwnedBusiness): number {
  const def = BUSINESS_DEFS.find(d => d.id === bizState.defId)!;
  let rev = def.baseRevenue * bizState.count;

  // Weather
  const weatherMult = def.weatherSensitivity[state.weather] ?? 1;
  rev *= weatherMult;

  // Season
  const seasonMult = def.seasonBonus[state.season] ?? 1;
  rev *= seasonMult;

  // Upgrades
  for (const up of state.upgrades) {
    if (!up.purchased) continue;
    if (up.targetBiz === bizState.defId || up.targetBiz === 'all') {
      rev *= up.multiplier;
    }
  }

  // Active events
  for (const evt of state.activeEvents) {
    rev *= evt.revenueMultiplier;
  }

  return rev;
}

export function tap(state: IdleState): number {
  let amount = state.cashPerTap;
  // Tap upgrades
  for (const up of state.upgrades) {
    if (!up.purchased) continue;
    if (up.targetBiz === 'tap') amount *= up.multiplier;
  }
  // Event multipliers
  for (const evt of state.activeEvents) {
    amount *= evt.revenueMultiplier;
  }
  state.cash += amount;
  state.totalEarned += amount;
  state.lifetimeEarned += amount;
  state.totalTaps++;
  return amount;
}

export function buyBusiness(state: IdleState, defId: string): boolean {
  const def = BUSINESS_DEFS.find(d => d.id === defId)!;
  const biz = state.businesses.find(b => b.defId === defId)!;
  const cost = getBusinessCost(def, biz.count);
  if (state.cash < cost) return false;
  state.cash -= cost;
  biz.count++;
  return true;
}

export function buyManager(state: IdleState, defId: string): boolean {
  const def = BUSINESS_DEFS.find(d => d.id === defId)!;
  const biz = state.businesses.find(b => b.defId === defId)!;
  if (state.cash < def.managerCost || biz.hasManager) return false;
  state.cash -= def.managerCost;
  biz.hasManager = true;
  return true;
}

export function buyUpgrade(state: IdleState, upgradeId: string): boolean {
  const up = state.upgrades.find(u => u.id === upgradeId);
  if (!up || up.purchased || state.cash < up.cost) return false;
  state.cash -= up.cost;
  up.purchased = true;
  return true;
}

export function startBusiness(state: IdleState, defId: string) {
  const biz = state.businesses.find(b => b.defId === defId)!;
  if (biz.count > 0 && !biz.running) {
    biz.running = true;
    biz.progress = 0;
  }
}

export function tickIdle(state: IdleState, deltaSeconds: number) {
  // Progress bars
  for (const biz of state.businesses) {
    if (biz.count === 0 || !biz.running) {
      // Auto-start if has manager
      if (biz.hasManager && biz.count > 0 && !biz.running) {
        biz.running = true;
        biz.progress = 0;
      }
      continue;
    }

    const def = BUSINESS_DEFS.find(d => d.id === biz.defId)!;
    const cycleTime = def.baseCycleTime;
    biz.progress += deltaSeconds / cycleTime;

    if (biz.progress >= 1) {
      // Collect revenue
      const rev = getBusinessRevenue(state, biz);
      state.cash += rev;
      state.totalEarned += rev;
      state.lifetimeEarned += rev;
      biz.progress = 0;
      biz.running = biz.hasManager; // auto-restart if manager
    }
  }

  // Weather timer
  state.weatherTimer -= deltaSeconds;
  if (state.weatherTimer <= 0) {
    const pick = weightedPick(WEATHER_BY_SEASON[state.season]);
    state.weather = pick.type;
    state.weatherTimer = 10 + rand(0, 20);
  }

  // Day timer (1 day = 60 seconds)
  state.dayTimer -= deltaSeconds;
  if (state.dayTimer <= 0) {
    state.day++;
    state.dayTimer = 60;
    // Season change every 30 days
    if (state.day % 30 === 0) {
      const idx = SEASONS.indexOf(state.season);
      state.season = SEASONS[(idx + 1) % 4];
    }
  }

  // Events
  state.eventCooldown -= deltaSeconds;
  if (state.eventCooldown <= 0 && state.activeEvents.length === 0 && state.totalEarned > 20) {
    if (chance(0.4)) {
      const evt = EVENT_POOL[randInt(0, EVENT_POOL.length - 1)];
      state.activeEvents.push({ ...evt, timeLeft: evt.duration });
      state.eventLog.push({ day: state.day, name: evt.name, emoji: evt.emoji, impact: evt.impact });
    }
    state.eventCooldown = 20 + rand(0, 40);
  }

  // Tick active events
  state.activeEvents = state.activeEvents.filter(e => {
    e.timeLeft -= deltaSeconds;
    return e.timeLeft > 0;
  });

  state.lastTick = Date.now();
}
