import { Business } from './Business';
import { Loan } from './Loan';
import { CONFIG } from '../data/config';

export interface Player {
  name: string;
  cash: number;
  totalEarned: number;
  totalSpent: number;
  businesses: Business[];
  loans: Loan[];
  reputation: number;       // 0..100 reputation globale
  xp: number;
  level: number;
  negativeStreak: number;   // compteur d'events negatifs consecutifs
  positiveStreak: number;   // compteur d'events positifs consecutifs
  daysSinceStart: number;
}

export function createPlayer(name: string): Player {
  return {
    name,
    cash: CONFIG.STARTING_CASH,
    totalEarned: 0,
    totalSpent: 0,
    businesses: [],
    loans: [],
    reputation: 50,
    xp: 0,
    level: 1,
    negativeStreak: 0,
    positiveStreak: 0,
    daysSinceStart: 0,
  };
}
