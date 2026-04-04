import { Employee } from './Employee';

export type BusinessType =
  | 'restaurant'
  | 'boutique'
  | 'immobilier'
  | 'startup'
  | 'food_truck'
  | 'garage'
  | 'hotel'
  | 'ferme';

export interface Business {
  id: string;
  name: string;
  type: BusinessType;
  level: number;            // 1..10 — niveau d'amelioration
  employees: Employee[];
  dailyBaseRevenue: number; // revenu de base par jour
  dailyBaseCost: number;    // cout de base par jour (loyer, charges)
  reputation: number;       // 0..100
  priceMultiplier: number;  // 0.5..2.0 — reglable par le joueur
  isOpen: boolean;
  daysSinceOpening: number;
  city: string;
  lastDailyRevenue: number;
  lastDailyCost: number;
}

let nextBusinessId = 1;

export function createBusiness(
  name: string,
  type: BusinessType,
  city: string,
  baseRevenue: number,
  baseCost: number,
): Business {
  return {
    id: `biz_${nextBusinessId++}`,
    name,
    type,
    level: 1,
    employees: [],
    dailyBaseRevenue: baseRevenue,
    dailyBaseCost: baseCost,
    reputation: 50,
    priceMultiplier: 1.0,
    isOpen: true,
    daysSinceOpening: 0,
    city,
    lastDailyRevenue: 0,
    lastDailyCost: 0,
  };
}
