/**
 * Idle/Incremental game engine v2 — ADDICTIVE EDITION
 *
 * Design rules:
 * 1. First purchase in 3 taps
 * 2. Something new every 15 seconds
 * 3. Numbers go up FAST
 * 4. Bonus bubbles for surprise dopamine
 * 5. Combo multiplier for rapid tapping
 * 6. Achievements every minute
 */

import { rand, randInt, chance, clamp, weightedPick } from '../utils/random';

// ============ TYPES ============

export interface BusinessDef {
  id: string;
  name: string;
  emoji: string;
  baseCost: number;
  baseRevenue: number;
  baseCycleTime: number;
  costMultiplier: number;
  unlockAt: number;
  managerCost: number;
}

export interface OwnedBusiness {
  defId: string;
  count: number;
  progress: number;
  hasManager: boolean;
  running: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  emoji: string;
  description: string;
  condition: (s: IdleState) => boolean;
  reward: number;
  unlocked: boolean;
}

export interface BonusBubble {
  id: number;
  x: number;        // 0..1 screen position
  y: number;
  emoji: string;
  multiplier: number;
  lifetime: number;  // seconds remaining
  type: 'cash' | 'multiplier' | 'frenzy';
}

export interface ActiveBuff {
  name: string;
  emoji: string;
  multiplier: number;
  timeLeft: number;
}

export interface IdleState {
  cash: number;
  totalEarned: number;
  totalTaps: number;
  tapValue: number;

  // Combo
  comboCount: number;
  comboTimer: number;     // seconds since last tap
  comboMultiplier: number;

  // Time
  day: number;
  season: string;
  weather: string;
  weatherTimer: number;
  dayTimer: number;

  // Businesses
  businesses: OwnedBusiness[];

  // Bonuses
  bubbles: BonusBubble[];
  bubbleTimer: number;
  buffs: ActiveBuff[];

  // Achievements
  achievements: Achievement[];
  lastAchievement: string | null;  // for popup

  // Events
  eventLog: Array<{ day: number; text: string; emoji: string }>;

  // Meta
  started: boolean;
  playerName: string;
  lastTick: number;
  globalMultiplier: number;
  nextBubbleId: number;
  prestigeCount: number;
  prestigeMultiplier: number;
}

// ============ BUSINESS DEFINITIONS ============
// Balanced so first buy = 3 taps, constant unlocks

export const BUSINESS_DEFS: BusinessDef[] = [
  { id: 'limonade', name: 'Limonade', emoji: '🍋', baseCost: 15, baseRevenue: 1, baseCycleTime: 0.5, costMultiplier: 1.08, unlockAt: 0, managerCost: 200 },
  { id: 'food_truck', name: 'Food Truck', emoji: '🚚', baseCost: 100, baseRevenue: 5, baseCycleTime: 1.5, costMultiplier: 1.10, unlockAt: 50, managerCost: 2000 },
  { id: 'boutique', name: 'Boutique', emoji: '🛍️', baseCost: 500, baseRevenue: 20, baseCycleTime: 3, costMultiplier: 1.12, unlockAt: 300, managerCost: 15000 },
  { id: 'restaurant', name: 'Restaurant', emoji: '🍽️', baseCost: 3000, baseRevenue: 100, baseCycleTime: 5, costMultiplier: 1.11, unlockAt: 2000, managerCost: 100000 },
  { id: 'garage', name: 'Garage', emoji: '🔧', baseCost: 15000, baseRevenue: 400, baseCycleTime: 8, costMultiplier: 1.10, unlockAt: 10000, managerCost: 500000 },
  { id: 'startup', name: 'Startup', emoji: '💻', baseCost: 100000, baseRevenue: 2500, baseCycleTime: 12, costMultiplier: 1.09, unlockAt: 60000, managerCost: 5000000 },
  { id: 'immobilier', name: 'Immo', emoji: '🏠', baseCost: 750000, baseRevenue: 15000, baseCycleTime: 20, costMultiplier: 1.08, unlockAt: 500000, managerCost: 50000000 },
  { id: 'hotel', name: 'Hôtel', emoji: '🏨', baseCost: 5000000, baseRevenue: 80000, baseCycleTime: 30, costMultiplier: 1.07, unlockAt: 3000000, managerCost: 500000000 },
  { id: 'banque', name: 'Banque', emoji: '🏦', baseCost: 50000000, baseRevenue: 500000, baseCycleTime: 45, costMultiplier: 1.06, unlockAt: 30000000, managerCost: 5000000000 },
  { id: 'empire', name: 'Empire', emoji: '👑', baseCost: 500000000, baseRevenue: 5000000, baseCycleTime: 60, costMultiplier: 1.05, unlockAt: 300000000, managerCost: 100000000000 },
];

// ============ ACHIEVEMENTS ============

function createAchievements(): Achievement[] {
  return [
    { id: 'first_tap', name: 'Premier pas', emoji: '👆', description: 'Fais ton premier tap', condition: s => s.totalTaps >= 1, reward: 5, unlocked: false },
    { id: 'tap_10', name: 'Rapide !', emoji: '⚡', description: '10 taps', condition: s => s.totalTaps >= 10, reward: 20, unlocked: false },
    { id: 'tap_100', name: 'Frénétique', emoji: '🔥', description: '100 taps', condition: s => s.totalTaps >= 100, reward: 200, unlocked: false },
    { id: 'tap_500', name: 'Machine', emoji: '🤖', description: '500 taps', condition: s => s.totalTaps >= 500, reward: 2000, unlocked: false },
    { id: 'tap_1000', name: 'Légende', emoji: '🏆', description: '1000 taps', condition: s => s.totalTaps >= 1000, reward: 20000, unlocked: false },
    { id: 'earn_100', name: 'Débutant', emoji: '💵', description: 'Gagne 100$', condition: s => s.totalEarned >= 100, reward: 50, unlocked: false },
    { id: 'earn_1k', name: 'En route', emoji: '💰', description: 'Gagne 1K$', condition: s => s.totalEarned >= 1000, reward: 500, unlocked: false },
    { id: 'earn_10k', name: 'Businessman', emoji: '💼', description: 'Gagne 10K$', condition: s => s.totalEarned >= 10000, reward: 5000, unlocked: false },
    { id: 'earn_100k', name: 'Riche', emoji: '🤑', description: 'Gagne 100K$', condition: s => s.totalEarned >= 100000, reward: 50000, unlocked: false },
    { id: 'earn_1m', name: 'Millionnaire', emoji: '💎', description: 'Gagne 1M$', condition: s => s.totalEarned >= 1000000, reward: 500000, unlocked: false },
    { id: 'earn_1b', name: 'Milliardaire', emoji: '🌟', description: 'Gagne 1B$', condition: s => s.totalEarned >= 1000000000, reward: 500000000, unlocked: false },
    { id: 'combo_5', name: 'Combo !', emoji: '🔥', description: 'Combo x5', condition: s => s.comboMultiplier >= 5, reward: 100, unlocked: false },
    { id: 'combo_10', name: 'Méga Combo', emoji: '💥', description: 'Combo x10', condition: s => s.comboMultiplier >= 10, reward: 1000, unlocked: false },
    { id: 'combo_20', name: 'Ultra Combo', emoji: '🌈', description: 'Combo x20', condition: s => s.comboMultiplier >= 20, reward: 10000, unlocked: false },
    { id: 'biz_5', name: 'Entrepreneur', emoji: '📈', description: '5 business différents', condition: s => s.businesses.filter(b => b.count > 0).length >= 5, reward: 5000, unlocked: false },
    { id: 'biz_all', name: 'Magnat', emoji: '👑', description: 'Tous les business', condition: s => s.businesses.filter(b => b.count > 0).length >= 10, reward: 10000000, unlocked: false },
    { id: 'manager_3', name: 'Délégation', emoji: '🤵', description: '3 managers', condition: s => s.businesses.filter(b => b.hasManager).length >= 3, reward: 10000, unlocked: false },
    { id: 'bubble_pop', name: 'Chasseur', emoji: '🫧', description: 'Éclate un bonus', condition: s => s.totalEarned > 0 && s.bubbles.length < 3, reward: 50, unlocked: false },
  ];
}

// ============ WEATHER ============

const WEATHER_TYPES = ['sun', 'rain', 'storm', 'snow', 'cloudy', 'heatwave'];
const WEATHER_MULT: Record<string, number> = {
  sun: 1.2, rain: 0.8, storm: 0.5, snow: 0.7, cloudy: 1.0, heatwave: 1.1,
};
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const SEASON_MULT: Record<string, number> = {
  spring: 1.1, summer: 1.3, autumn: 0.9, winter: 0.7,
};

const BUBBLE_EMOJIS = ['💰', '💎', '🌟', '🎁', '🔥', '⚡', '🎯', '🫧'];

// ============ STATE ============

export function createIdleState(name: string): IdleState {
  return {
    cash: 0,
    totalEarned: 0,
    totalTaps: 0,
    tapValue: 5,   // Start at 5$ per tap — first buy in 3 taps
    comboCount: 0,
    comboTimer: 0,
    comboMultiplier: 1,
    day: 1,
    season: 'spring',
    weather: 'sun',
    weatherTimer: 15,
    dayTimer: 60,
    businesses: BUSINESS_DEFS.map(def => ({
      defId: def.id, count: 0, progress: 0, hasManager: false, running: false,
    })),
    bubbles: [],
    bubbleTimer: 8, // first bubble in 8 seconds
    buffs: [],
    achievements: createAchievements(),
    lastAchievement: null,
    eventLog: [],
    started: true,
    playerName: name,
    lastTick: Date.now(),
    globalMultiplier: 1,
    nextBubbleId: 1,
    prestigeCount: 0,
    prestigeMultiplier: 1,
  };
}

// ============ HELPERS ============

export function getBusinessCost(def: BusinessDef, owned: number): number {
  return Math.round(def.baseCost * Math.pow(def.costMultiplier, owned));
}

export function getRevenue(state: IdleState, biz: OwnedBusiness): number {
  const def = BUSINESS_DEFS.find(d => d.id === biz.defId)!;
  let rev = def.baseRevenue * biz.count;
  rev *= WEATHER_MULT[state.weather] ?? 1;
  rev *= SEASON_MULT[state.season] ?? 1;
  rev *= state.globalMultiplier;
  rev *= state.prestigeMultiplier;
  for (const buff of state.buffs) rev *= buff.multiplier;
  return rev;
}

function getTotalMultiplier(state: IdleState): number {
  let m = state.globalMultiplier * state.prestigeMultiplier;
  for (const buff of state.buffs) m *= buff.multiplier;
  return m;
}

export function getIncomePerSecond(state: IdleState): number {
  let ips = 0;
  for (const biz of state.businesses) {
    if (biz.count === 0 || !biz.hasManager) continue;
    const def = BUSINESS_DEFS.find(d => d.id === biz.defId)!;
    ips += getRevenue(state, biz) / def.baseCycleTime;
  }
  return ips;
}

// ============ ACTIONS ============

export function tap(state: IdleState): number {
  // Combo: tapping within 0.4s increases combo
  state.comboCount++;
  state.comboTimer = 0.4;
  state.comboMultiplier = Math.min(50, 1 + Math.floor(state.comboCount / 3));

  let amount = state.tapValue * state.comboMultiplier;
  amount *= getTotalMultiplier(state);

  state.cash += amount;
  state.totalEarned += amount;
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
  // Auto-start first one
  if (biz.count === 1 && !biz.running) {
    biz.running = true;
    biz.progress = 0;
  }
  return true;
}

export function buyManager(state: IdleState, defId: string): boolean {
  const def = BUSINESS_DEFS.find(d => d.id === defId)!;
  const biz = state.businesses.find(b => b.defId === defId)!;
  if (state.cash < def.managerCost || biz.hasManager || biz.count === 0) return false;
  state.cash -= def.managerCost;
  biz.hasManager = true;
  return true;
}

export function popBubble(state: IdleState, bubbleId: number): { amount: number; type: string } | null {
  const idx = state.bubbles.findIndex(b => b.id === bubbleId);
  if (idx === -1) return null;
  const bubble = state.bubbles[idx];
  state.bubbles.splice(idx, 1);

  if (bubble.type === 'cash') {
    const amount = Math.max(state.tapValue * 20, state.totalEarned * 0.05) * bubble.multiplier;
    state.cash += amount;
    state.totalEarned += amount;
    return { amount, type: 'cash' };
  } else if (bubble.type === 'frenzy') {
    state.buffs.push({ name: 'Frenzy !', emoji: '🔥', multiplier: bubble.multiplier, timeLeft: 15 });
    return { amount: bubble.multiplier, type: 'frenzy' };
  } else {
    state.buffs.push({ name: 'Boost !', emoji: '⚡', multiplier: bubble.multiplier, timeLeft: 10 });
    return { amount: bubble.multiplier, type: 'multiplier' };
  }
}

export function tapBusiness(state: IdleState, defId: string) {
  const biz = state.businesses.find(b => b.defId === defId)!;
  if (biz.count > 0 && !biz.running) {
    biz.running = true;
    biz.progress = 0;
  }
}

export function prestige(state: IdleState): boolean {
  if (state.totalEarned < 1000000) return false; // need 1M to prestige
  const bonus = Math.floor(Math.sqrt(state.totalEarned / 1000000));
  const name = state.playerName;
  const pCount = state.prestigeCount + 1;
  const pMult = 1 + bonus * 0.5;

  // Reset but keep prestige
  Object.assign(state, createIdleState(name));
  state.prestigeCount = pCount;
  state.prestigeMultiplier = pMult;
  state.tapValue = 5 * pMult;
  return true;
}

// ============ TICK ============

export function tickIdle(state: IdleState, dt: number) {
  // Combo decay
  state.comboTimer -= dt;
  if (state.comboTimer <= 0) {
    state.comboCount = 0;
    state.comboMultiplier = 1;
  }

  // Business progress bars
  for (const biz of state.businesses) {
    if (biz.count === 0) continue;

    // Auto-start if manager
    if (biz.hasManager && !biz.running) {
      biz.running = true;
      biz.progress = 0;
    }

    if (!biz.running) continue;

    const def = BUSINESS_DEFS.find(d => d.id === biz.defId)!;
    biz.progress += dt / def.baseCycleTime;

    if (biz.progress >= 1) {
      const rev = getRevenue(state, biz);
      state.cash += rev;
      state.totalEarned += rev;
      biz.progress = 0;
      biz.running = biz.hasManager;
    }
  }

  // Weather
  state.weatherTimer -= dt;
  if (state.weatherTimer <= 0) {
    state.weather = WEATHER_TYPES[randInt(0, WEATHER_TYPES.length - 1)];
    state.weatherTimer = 10 + rand(0, 20);
  }

  // Day
  state.dayTimer -= dt;
  if (state.dayTimer <= 0) {
    state.day++;
    state.dayTimer = 60;
    if (state.day % 30 === 0) {
      state.season = SEASONS[(SEASONS.indexOf(state.season) + 1) % 4];
    }
  }

  // Bonus bubbles — spawn regularly
  state.bubbleTimer -= dt;
  if (state.bubbleTimer <= 0 && state.bubbles.length < 3) {
    const types: Array<BonusBubble['type']> = ['cash', 'cash', 'cash', 'multiplier', 'frenzy'];
    const type = types[randInt(0, types.length - 1)];
    const mult = type === 'cash' ? randInt(2, 5) : type === 'frenzy' ? randInt(3, 7) : randInt(2, 4);

    state.bubbles.push({
      id: state.nextBubbleId++,
      x: rand(0.1, 0.9),
      y: rand(0.2, 0.7),
      emoji: type === 'cash' ? '💰' : type === 'frenzy' ? '🔥' : '⚡',
      multiplier: mult,
      lifetime: 5 + rand(0, 5),
      type,
    });

    state.bubbleTimer = 8 + rand(0, 15); // next bubble in 8-23 seconds
  }

  // Bubble lifetime
  state.bubbles = state.bubbles.filter(b => {
    b.lifetime -= dt;
    return b.lifetime > 0;
  });

  // Buffs decay
  state.buffs = state.buffs.filter(b => {
    b.timeLeft -= dt;
    return b.timeLeft > 0;
  });

  // Achievements
  for (const ach of state.achievements) {
    if (!ach.unlocked && ach.condition(state)) {
      ach.unlocked = true;
      state.cash += ach.reward;
      state.totalEarned += ach.reward;
      state.lastAchievement = ach.id;
    }
  }

  // Tap value scales slowly with total earned
  state.tapValue = Math.max(5, Math.floor(5 + Math.pow(state.totalEarned, 0.35))) * state.prestigeMultiplier;

  state.lastTick = Date.now();
}
