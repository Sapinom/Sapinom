import { CONFIG } from '../data/config';

/**
 * Etat global du monde — la "verite" du jeu a un instant T.
 * Toutes les variables macro sont centralisees ici.
 */

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type WeatherType = 'sun' | 'rain' | 'storm' | 'heatwave' | 'snow' | 'flood' | 'cloudy';
export type EconomyCycle = 'growth' | 'stable' | 'recession';

export interface ActiveEvent {
  eventId: string;
  name: string;
  daysRemaining: number;
  effects: Record<string, number>;
  targetBusinessId?: string;  // si l'event cible un business specifique
}

export interface WorldState {
  // Temps
  day: number;
  season: Season;
  dayInSeason: number;

  // Meteo
  weather: WeatherType;
  weatherDaysRemaining: number; // jours avant changement meteo
  extremeWeatherActive: boolean;

  // Economie
  inflation: number;          // taux annuel
  growth: number;             // taux de croissance
  consumption: number;        // multiplicateur 0.5..1.5
  unemployment: number;       // taux 0..1
  interestRate: number;       // taux annuel
  taxRate: number;            // taux d'imposition
  rawMaterialCost: number;    // multiplicateur
  economyCycle: EconomyCycle;
  cycleDaysRemaining: number;

  // Evenements actifs
  activeEvents: ActiveEvent[];
  eventCooldowns: Map<string, number>; // eventId -> jour de fin de cooldown
  lastEventDay: number;

  // Log des evenements pour l'UI
  eventLog: Array<{ day: number; message: string; impact: string }>;
}

export function createWorldState(): WorldState {
  const { ECONOMY } = CONFIG;
  return {
    day: 1,
    season: 'spring',
    dayInSeason: 1,

    weather: 'sun',
    weatherDaysRemaining: 3,
    extremeWeatherActive: false,

    inflation: ECONOMY.BASE_INFLATION,
    growth: ECONOMY.BASE_GROWTH,
    consumption: ECONOMY.BASE_CONSUMPTION,
    unemployment: ECONOMY.BASE_UNEMPLOYMENT,
    interestRate: ECONOMY.BASE_INTEREST_RATE,
    taxRate: ECONOMY.BASE_TAX_RATE,
    rawMaterialCost: ECONOMY.BASE_RAW_MATERIAL_COST,
    economyCycle: 'stable',
    cycleDaysRemaining: 90,

    activeEvents: [],
    eventCooldowns: new Map(),
    lastEventDay: 0,

    eventLog: [],
  };
}

export function getCurrentYear(world: WorldState): number {
  return Math.floor((world.day - 1) / (CONFIG.DAYS_PER_SEASON * CONFIG.SEASONS_PER_YEAR)) + 1;
}
