/**
 * Constantes d'equilibrage du jeu.
 * Toutes les valeurs sont centralisees ici pour faciliter le tuning.
 */

export const CONFIG = {
  // --- Temps ---
  STARTING_CASH: 5000,
  DAYS_PER_SEASON: 30,       // 1 saison = 30 jours in-game
  SEASONS_PER_YEAR: 4,

  // --- Economie globale ---
  ECONOMY: {
    BASE_INFLATION: 0.02,         // 2% annuel
    MIN_INFLATION: -0.03,
    MAX_INFLATION: 0.10,
    BASE_GROWTH: 0.03,            // 3% croissance
    MIN_GROWTH: -0.05,
    MAX_GROWTH: 0.08,
    BASE_CONSUMPTION: 1.0,       // multiplicateur de consommation
    MIN_CONSUMPTION: 0.5,
    MAX_CONSUMPTION: 1.5,
    BASE_UNEMPLOYMENT: 0.08,     // 8%
    MIN_UNEMPLOYMENT: 0.03,
    MAX_UNEMPLOYMENT: 0.25,
    BASE_INTEREST_RATE: 0.05,    // 5%
    MIN_INTEREST_RATE: 0.01,
    MAX_INTEREST_RATE: 0.15,
    BASE_TAX_RATE: 0.25,         // 25%
    MIN_TAX_RATE: 0.15,
    MAX_TAX_RATE: 0.40,
    BASE_RAW_MATERIAL_COST: 1.0, // multiplicateur
    CYCLE_CHANGE_SPEED: 0.05,    // vitesse de transition entre cycles
    CYCLE_DURATION_DAYS_MIN: 60,
    CYCLE_DURATION_DAYS_MAX: 180,
  },

  // --- Meteo ---
  WEATHER: {
    EXTREME_EVENT_BASE_CHANCE: 0.02,  // 2% par jour
    STORM_DURATION_MIN: 1,
    STORM_DURATION_MAX: 3,
    HEATWAVE_DURATION_MIN: 3,
    HEATWAVE_DURATION_MAX: 7,
    FLOOD_DURATION_MIN: 2,
    FLOOD_DURATION_MAX: 5,
  },

  // --- Employes ---
  EMPLOYEE: {
    BASE_SALARY_MIN: 800,
    BASE_SALARY_MAX: 3000,
    PERFORMANCE_MIN: 0.5,
    PERFORMANCE_MAX: 1.5,
    QUIT_BASE_CHANCE: 0.005,     // 0.5% par jour
    STRIKE_BASE_CHANCE: 0.002,   // 0.2% par jour
  },

  // --- Banque ---
  LOAN: {
    MAX_DEBT_RATIO: 3.0,         // dette max = 3x revenus mensuels
    MIN_AMOUNT: 1000,
    MAX_AMOUNT: 500000,
    DURATION_MONTHS_MIN: 6,
    DURATION_MONTHS_MAX: 60,
  },

  // --- Evenements ---
  EVENTS: {
    MAX_ACTIVE_EVENTS: 3,        // max evenements simultanes
    MIN_DAYS_BETWEEN_EVENTS: 3,
    LUCK_PROTECTION_THRESHOLD: 3, // apres 3 events negatifs de suite, boost les positifs
  },

  // --- Equilibrage adaptatif ---
  BALANCE: {
    BANKRUPTCY_PROTECTION_DAYS: 30,   // grace period au debut
    NEGATIVE_STREAK_BOOST: 0.15,      // +15% chance d'event positif apres serie noire
    POSITIVE_STREAK_DAMPER: 0.10,     // -10% chance d'event positif apres serie de chance
    MIN_DAILY_REVENUE_FLOOR: 10,      // revenu minimum garanti par business
  },
} as const;
