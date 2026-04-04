import { STARTING_CASH, DAYS_PER_SEASON, FIRST_NAMES, LAST_NAMES } from '../data/constants';
import { BUSINESS_TEMPLATES } from '../data/businesses';
import { ALL_EVENTS, GameEventDef, EventChoice } from '../data/events';
import { rand, randInt, chance, clamp, lerp, vary, weightedPick } from '../utils/random';

// ====================== TYPES ======================

export interface Employee {
  id: number;
  name: string;
  salary: number;
  perf: number;    // 0.5-1.5
  morale: number;  // 0-100
}

export interface Business {
  id: number;
  name: string;
  type: string;
  level: number;
  employees: Employee[];
  baseRev: number;
  baseCost: number;
  reputation: number;
  price: number;     // 0.5-2.0
  open: boolean;
  days: number;
  city: string;
  lastRev: number;
  lastCost: number;
}

export interface Loan {
  id: number;
  amount: number;
  remaining: number;
  rate: number;
  monthly: number;
  monthsLeft: number;
  totalMonths: number;
}

export interface ActiveEvent {
  id: string;
  name: string;
  emoji: string;
  daysLeft: number;
  effects: Record<string, number>;
  targetBizId?: number;
  impact: string;
}

export interface PendingChoice {
  event: GameEventDef;
  targetBizId?: number;
}

export interface WorldState {
  day: number;
  season: string;
  dayInSeason: number;
  weather: string;
  weatherDaysLeft: number;
  extreme: boolean;
  inflation: number;
  consumption: number;
  unemployment: number;
  interestRate: number;
  rawMat: number;
  ecoCycle: string;
  cycleDaysLeft: number;
  activeEvents: ActiveEvent[];
  cooldowns: Record<string, number>;
  lastEventDay: number;
  eventLog: Array<{ day: number; name: string; desc: string; impact: string; emoji: string }>;
}

export interface GameState {
  started: boolean;
  paused: boolean;  // paused when a choice is pending
  speed: number;    // 1x, 2x, 3x
  player: {
    name: string;
    cash: number;
    totalEarned: number;
    totalSpent: number;
    reputation: number;
    xp: number;
    level: number;
    negStreak: number;
    posStreak: number;
  };
  businesses: Business[];
  loans: Loan[];
  world: WorldState;
  pendingChoice: PendingChoice | null;
  nextId: number;
  // Idle tracking
  lastTickTime: number;
}

// ====================== INITIAL STATE ======================

export function createInitialState(name: string): GameState {
  return {
    started: true,
    paused: false,
    speed: 1,
    player: {
      name,
      cash: STARTING_CASH,
      totalEarned: 0,
      totalSpent: 0,
      reputation: 50,
      xp: 0,
      level: 1,
      negStreak: 0,
      posStreak: 0,
    },
    businesses: [],
    loans: [],
    world: {
      day: 1, season: 'spring', dayInSeason: 1,
      weather: 'sun', weatherDaysLeft: 3, extreme: false,
      inflation: 0.02, consumption: 1, unemployment: 0.08,
      interestRate: 0.05, rawMat: 1,
      ecoCycle: 'stable', cycleDaysLeft: 90,
      activeEvents: [], cooldowns: {}, lastEventDay: 0, eventLog: [],
    },
    pendingChoice: null,
    nextId: 1,
    lastTickTime: Date.now(),
  };
}

// ====================== WEATHER ======================

const WEATHER_BY_SEASON: Record<string, Array<{ type: string; weight: number }>> = {
  spring: [{ type: 'sun', weight: 35 }, { type: 'rain', weight: 30 }, { type: 'cloudy', weight: 25 }, { type: 'storm', weight: 8 }, { type: 'heatwave', weight: 2 }],
  summer: [{ type: 'sun', weight: 50 }, { type: 'cloudy', weight: 15 }, { type: 'rain', weight: 10 }, { type: 'heatwave', weight: 15 }, { type: 'storm', weight: 8 }, { type: 'flood', weight: 2 }],
  autumn: [{ type: 'rain', weight: 35 }, { type: 'cloudy', weight: 25 }, { type: 'sun', weight: 20 }, { type: 'storm', weight: 12 }, { type: 'flood', weight: 5 }, { type: 'snow', weight: 3 }],
  winter: [{ type: 'cloudy', weight: 25 }, { type: 'snow', weight: 25 }, { type: 'rain', weight: 20 }, { type: 'sun', weight: 15 }, { type: 'storm', weight: 10 }, { type: 'flood', weight: 3 }],
};

function tickWeatherAndSeason(w: WorldState) {
  w.dayInSeason++;
  if (w.dayInSeason > DAYS_PER_SEASON) {
    w.dayInSeason = 1;
    const order = ['spring', 'summer', 'autumn', 'winter'];
    w.season = order[(order.indexOf(w.season) + 1) % 4];
  }
  w.weatherDaysLeft--;
  if (w.weatherDaysLeft <= 0) {
    const pick = weightedPick(WEATHER_BY_SEASON[w.season]);
    w.weather = pick.type;
    const extreme = ['storm', 'heatwave', 'flood'].includes(pick.type);
    w.extreme = extreme;
    w.weatherDaysLeft = extreme
      ? (pick.type === 'heatwave' ? randInt(3, 7) : randInt(1, 4))
      : randInt(1, 4);
  }
}

// ====================== ECONOMY ======================

function tickEconomy(w: WorldState) {
  w.cycleDaysLeft--;
  if (w.cycleDaysLeft <= 0) {
    const trans: Record<string, Array<{ cycle: string; weight: number }>> = {
      growth: [{ cycle: 'growth', weight: 30 }, { cycle: 'stable', weight: 50 }, { cycle: 'recession', weight: 20 }],
      stable: [{ cycle: 'growth', weight: 35 }, { cycle: 'stable', weight: 30 }, { cycle: 'recession', weight: 35 }],
      recession: [{ cycle: 'growth', weight: 20 }, { cycle: 'stable', weight: 50 }, { cycle: 'recession', weight: 30 }],
    };
    w.ecoCycle = weightedPick(trans[w.ecoCycle]).cycle;
    w.cycleDaysLeft = randInt(60, 180);
  }
  const targets: Record<string, { inf: number; con: number; un: number }> = {
    growth: { inf: 0.03, con: 1.2, un: 0.056 },
    stable: { inf: 0.02, con: 1.0, un: 0.08 },
    recession: { inf: 0.006, con: 0.7, un: 0.144 },
  };
  const t = targets[w.ecoCycle];
  w.inflation = clamp(lerp(w.inflation, vary(t.inf, 0.1), 0.05), -0.03, 0.1);
  let conTarget = t.con - (w.unemployment - 0.08) * 2;
  w.consumption = clamp(lerp(w.consumption, vary(conTarget, 0.05), 0.05), 0.5, 1.5);
  w.unemployment = clamp(lerp(w.unemployment, vary(t.un, 0.05), 0.025), 0.03, 0.25);
  let irTarget = 0.05 + (w.inflation - 0.02) * 2;
  if (w.ecoCycle === 'recession') irTarget *= 0.7;
  w.interestRate = clamp(lerp(w.interestRate, vary(irTarget, 0.03), 0.015), 0.01, 0.15);
  w.rawMat = clamp(lerp(w.rawMat, vary(1 + w.inflation * 3, 0.05), 0.04), 0.5, 2);

  for (const e of w.activeEvents) {
    if (e.effects.consumptionChange) w.consumption = clamp(w.consumption + e.effects.consumptionChange * 0.01, 0.5, 1.5);
    if (e.effects.inflationChange) w.inflation = clamp(w.inflation + e.effects.inflationChange * 0.01, -0.03, 0.1);
    if (e.effects.interestRateChange) w.interestRate = clamp(w.interestRate + e.effects.interestRateChange * 0.01, 0.01, 0.15);
  }
}

// ====================== EVENTS ======================

function tickEvents(state: GameState): GameEventDef | null {
  const w = state.world;
  const p = state.player;

  // Tick active events
  w.activeEvents = w.activeEvents.filter(e => { e.daysLeft--; return e.daysLeft > 0; });

  if (w.activeEvents.length >= 3) return null;
  if (w.day - w.lastEventDay < 3) return null;
  if (p.cash < 1500 && p.level <= 1 && w.day < 30) return null;

  const totalEmp = state.businesses.reduce((s, b) => s + b.employees.length, 0);
  const bizTypes = new Set(state.businesses.map(b => b.type));

  const eligible = ALL_EVENTS.filter(ev => {
    if (w.cooldowns[ev.id] && w.day < w.cooldowns[ev.id]) return false;
    const c = ev.conditions;
    if (c.minDay && w.day < c.minDay) return false;
    if (c.minLevel && p.level < c.minLevel) return false;
    if (c.minBiz && state.businesses.length < c.minBiz) return false;
    if (c.minCash && p.cash < c.minCash) return false;
    if (c.minEmp && totalEmp < c.minEmp) return false;
    if (c.bizTypes && !c.bizTypes.some(t => bizTypes.has(t))) return false;
    return true;
  });

  if (eligible.length === 0 || !chance(0.3)) return null;

  const adjusted = eligible.map(ev => {
    let wt = ev.baseWeight;
    if (p.negStreak >= 3 && ev.impact === 'positive') wt *= 1 + 0.15 * p.negStreak;
    if (p.negStreak >= 3 && ev.impact === 'negative') wt *= 0.5;
    if (p.posStreak >= 3 && ev.impact === 'positive') wt *= 1 - 0.1 * p.posStreak;
    if (p.cash < 2500 && ev.impact === 'negative') {
      const eff = ev.choices ? ev.choices[0]?.effects : ev.effects;
      if (eff && ((eff.cashChange ?? 0) < 0 || (eff.cashChangePct ?? 0) < 0)) wt *= 0.3;
    }
    return { ...ev, weight: Math.max(wt, 0.1) };
  });

  return weightedPick(adjusted);
}

// ====================== BUSINESS CALC ======================

function calcBizDaily(biz: Business, w: WorldState): { rev: number; cost: number } {
  const tmpl = BUSINESS_TEMPLATES[biz.type];
  const sens = tmpl.sensitivity;

  let rev = biz.baseRev * (1 + (biz.level - 1) * 0.2);
  rev *= clamp(1 + ((sens as any)[w.weather] ?? 0) * 0.1, 0.1, 2);
  rev *= clamp((sens as any)[w.season] ?? 1, 0.3, 2);
  rev *= clamp(1 + (w.consumption - 1) * sens.consumption * 0.5, 0.3, 2);
  rev *= clamp(1 - (w.unemployment - 0.08) * sens.unemployment, 0.5, 1.3);

  if (biz.employees.length > 0) {
    const avgP = biz.employees.reduce((s, e) => s + e.perf, 0) / biz.employees.length;
    const avgM = biz.employees.reduce((s, e) => s + e.morale, 0) / biz.employees.length;
    rev *= clamp(avgP * (0.5 + avgM / 100), 0.3, 2);
  }
  rev *= (0.5 + biz.reputation / 100);
  rev *= (1 + (biz.price - 1) * 0.6) * (1 - (biz.price - 1) * 0.4);

  let revMult = 1, costMult = 1;
  for (const e of w.activeEvents) {
    if (e.targetBizId != null && e.targetBizId !== biz.id) continue;
    if (e.effects.revenueMultiplier) revMult *= e.effects.revenueMultiplier;
    if (e.effects.costMultiplier) costMult *= e.effects.costMultiplier;
  }
  rev *= revMult;
  rev = Math.max(vary(rev, 0.1), 10);

  let cost = biz.baseCost * (1 + w.inflation * sens.inflation);
  cost *= (1 + (w.rawMat - 1) * sens.rawMaterials * 0.5);
  cost += biz.employees.reduce((s, e) => s + e.salary / 30, 0);
  cost *= costMult;
  cost = vary(cost, 0.05);

  return { rev: Math.round(rev * 100) / 100, cost: Math.round(cost * 100) / 100 };
}

// ====================== MAIN TICK ======================

export function gameTick(state: GameState): { event: GameEventDef | null } {
  if (state.paused || !state.started) return { event: null };

  const w = state.world;

  // 1. Weather & Season
  tickWeatherAndSeason(w);

  // 2. Economy
  tickEconomy(w);

  // 3. Events
  const evt = tickEvents(state);
  if (evt) {
    // If event has choices, pause and ask player
    if (evt.choices && evt.choices.length > 0) {
      let targetBizId: number | undefined;
      if (evt.category === 'business' && state.businesses.length > 0) {
        let cands = state.businesses;
        if (evt.conditions.bizTypes) cands = cands.filter(b => evt.conditions.bizTypes!.includes(b.type));
        if (cands.length > 0) targetBizId = cands[randInt(0, cands.length - 1)].id;
      }
      state.pendingChoice = { event: evt, targetBizId };
      state.paused = true;
      w.eventLog.push({ day: w.day, name: evt.name, desc: evt.description, impact: evt.impact, emoji: evt.emoji });
      w.cooldowns[evt.id] = w.day + evt.cooldown;
      w.lastEventDay = w.day;
      // Update streaks
      if (evt.impact === 'negative') { state.player.negStreak++; state.player.posStreak = 0; }
      else if (evt.impact === 'positive') { state.player.posStreak++; state.player.negStreak = 0; }
    } else {
      // Auto-apply effects
      applyEffects(state, evt.effects || {}, evt);
    }
  }

  // 4. Business revenue
  for (const biz of state.businesses) {
    if (!biz.open) continue;
    biz.days++;
    const r = calcBizDaily(biz, w);
    state.player.cash += r.rev - r.cost;
    if (r.rev > 0) state.player.totalEarned += r.rev;
    state.player.totalSpent += r.cost;
    biz.lastRev = r.rev;
    biz.lastCost = r.cost;

    // Employee morale
    for (const emp of biz.employees) {
      if (chance(0.05)) emp.morale = clamp(emp.morale + (chance(0.6) ? 1 : -1), 0, 100);
    }
    biz.employees = biz.employees.filter(e => !(e.morale < 20 && chance(0.015)));
  }

  // 5. Loans (monthly)
  if (w.day % 30 === 0) {
    state.loans = state.loans.filter(l => {
      if (l.monthsLeft <= 0) return false;
      state.player.cash -= l.monthly;
      state.player.totalSpent += l.monthly;
      l.remaining -= l.monthly - (l.remaining * l.rate / 12);
      l.monthsLeft--;
      return l.monthsLeft > 0 && l.remaining > 0;
    });
  }

  // 6. XP
  const profit = state.businesses.reduce((s, b) => s + Math.max(b.lastRev - b.lastCost, 0), 0);
  state.player.xp += Math.floor(profit * 0.1) + state.businesses.length * 5;
  const needed = Math.floor(1000 * Math.pow(state.player.level, 1.5));
  if (state.player.xp >= needed) { state.player.xp -= needed; state.player.level++; }

  w.day++;
  state.lastTickTime = Date.now();

  return { event: evt };
}

function applyEffects(state: GameState, effects: Record<string, number>, evt: GameEventDef) {
  const w = state.world;
  const p = state.player;

  let targetBizId: number | undefined;
  if (evt.category === 'business' && state.businesses.length > 0) {
    let cands = state.businesses;
    if (evt.conditions.bizTypes) cands = cands.filter(b => evt.conditions.bizTypes!.includes(b.type));
    if (cands.length > 0) targetBizId = cands[randInt(0, cands.length - 1)].id;
  }

  if (effects.cashChange) p.cash += effects.cashChange;
  if (effects.cashChangePct) p.cash += p.cash * effects.cashChangePct;
  if (effects.reputationChange) p.reputation = clamp(p.reputation + effects.reputationChange, 0, 100);

  if (evt.impact === 'negative') { p.negStreak++; p.posStreak = 0; }
  else if (evt.impact === 'positive') { p.posStreak++; p.negStreak = 0; }

  if (evt.duration > 0) {
    w.activeEvents.push({
      id: evt.id, name: evt.name, emoji: evt.emoji,
      daysLeft: evt.duration, effects: { ...effects },
      targetBizId, impact: evt.impact,
    });
  }

  w.cooldowns[evt.id] = w.day + evt.cooldown;
  w.lastEventDay = w.day;
  w.eventLog.push({ day: w.day, name: evt.name, desc: evt.description, impact: evt.impact, emoji: evt.emoji });
}

// ====================== PLAYER ACTIONS ======================

export function resolveChoice(state: GameState, choiceIndex: number) {
  if (!state.pendingChoice) return;
  const { event, targetBizId } = state.pendingChoice;
  const choice = event.choices![choiceIndex];

  const p = state.player;
  const w = state.world;
  const eff = choice.effects;

  if (eff.cashChange) p.cash += eff.cashChange;
  if (eff.cashChangePct) p.cash += p.cash * eff.cashChangePct;
  if (eff.reputationChange) p.reputation = clamp(p.reputation + eff.reputationChange, 0, 100);
  if (eff.moraleChange) {
    for (const biz of state.businesses) {
      if (targetBizId != null && biz.id !== targetBizId) continue;
      for (const emp of biz.employees) {
        emp.morale = clamp(emp.morale + eff.moraleChange, 0, 100);
      }
    }
  }

  if (event.duration > 0) {
    const activeEffects: Record<string, number> = {};
    if (eff.revenueMultiplier) activeEffects.revenueMultiplier = eff.revenueMultiplier;
    if (eff.costMultiplier) activeEffects.costMultiplier = eff.costMultiplier;
    w.activeEvents.push({
      id: event.id, name: event.name, emoji: event.emoji,
      daysLeft: event.duration, effects: activeEffects,
      targetBizId, impact: event.impact,
    });
  }

  state.pendingChoice = null;
  state.paused = false;
}

export function openBusiness(state: GameState, type: string, name: string, city: string): string | null {
  const tmpl = BUSINESS_TEMPLATES[type];
  if (!tmpl) return 'Type inconnu';
  if (state.player.cash < tmpl.cost) return `Il faut ${tmpl.cost}$`;

  state.player.cash -= tmpl.cost;
  state.player.totalSpent += tmpl.cost;
  state.businesses.push({
    id: state.nextId++, name: name || tmpl.name, type,
    level: 1, employees: [], baseRev: tmpl.dailyRevenue,
    baseCost: tmpl.dailyExpense, reputation: 50, price: 1,
    open: true, days: 0, city: city || 'Paris', lastRev: 0, lastCost: 0,
  });
  return null;
}

export function hireEmployee(state: GameState, bizId: number): string | null {
  const biz = state.businesses.find(b => b.id === bizId);
  if (!biz) return 'Introuvable';
  const tmpl = BUSINESS_TEMPLATES[biz.type];
  if (biz.employees.length >= tmpl.maxEmployees) return 'Équipe au complet';

  const salary = Math.round((1 + (biz.level - 1) * 0.15) * rand(800, 3000));
  biz.employees.push({
    id: state.nextId++,
    name: FIRST_NAMES[randInt(0, FIRST_NAMES.length - 1)] + ' ' + LAST_NAMES[randInt(0, LAST_NAMES.length - 1)],
    salary, perf: Math.round(rand(0.5, 1.5) * 100) / 100, morale: randInt(60, 90),
  });
  return null;
}

export function upgradeBusiness(state: GameState, bizId: number): string | null {
  const biz = state.businesses.find(b => b.id === bizId);
  if (!biz) return 'Introuvable';
  if (biz.level >= 10) return 'Niveau max';
  const tmpl = BUSINESS_TEMPLATES[biz.type];
  const cost = Math.round(tmpl.cost * biz.level * 1.5);
  if (state.player.cash < cost) return `Il faut ${cost}$`;
  state.player.cash -= cost;
  state.player.totalSpent += cost;
  biz.level++;
  biz.baseRev = tmpl.dailyRevenue * (1 + (biz.level - 1) * 0.25);
  return null;
}

export function takeLoan(state: GameState, amount: number, months: number): string | null {
  const totalDebt = state.loans.reduce((s, l) => s + l.remaining, 0);
  const monthlyRev = state.businesses.reduce((s, b) => s + b.lastRev * 30, 0);
  if (monthlyRev > 0 && totalDebt + amount > monthlyRev * 3) return 'Trop endetté';

  const rate = state.world.interestRate;
  const mr = rate / 12;
  const monthly = mr > 0 ? (amount * mr) / (1 - Math.pow(1 + mr, -months)) : amount / months;

  state.loans.push({
    id: state.nextId++, amount, remaining: amount, rate,
    monthly: Math.round(monthly * 100) / 100, monthsLeft: months, totalMonths: months,
  });
  state.player.cash += amount;
  return null;
}
