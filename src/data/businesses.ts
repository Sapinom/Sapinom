import { BusinessType } from '../models/Business';

/**
 * Sensibilites de chaque type d'entreprise aux variables du monde.
 *
 * Chaque valeur est un multiplicateur d'impact :
 * - 0   = pas d'impact
 * - 0.5 = impact faible
 * - 1.0 = impact normal
 * - 1.5 = impact fort
 * - 2.0 = impact tres fort
 *
 * Valeurs negatives = impact inverse (ex: un hotel profite de la pluie en station thermale)
 */
export interface BusinessSensitivity {
  // Meteo
  sun: number;
  rain: number;
  storm: number;
  heatwave: number;
  snow: number;
  flood: number;

  // Saisons
  spring: number;
  summer: number;
  autumn: number;
  winter: number;

  // Economie
  consumption: number;     // sensibilite au niveau de consommation
  inflation: number;       // sensibilite a l'inflation (impact sur les couts)
  interestRate: number;    // sensibilite aux taux d'interet
  unemployment: number;    // sensibilite au chomage (moins de clients)
  rawMaterials: number;    // sensibilite au cout des matieres premieres
}

export interface BusinessTemplate {
  type: BusinessType;
  displayName: string;
  description: string;
  baseCost: number;         // cout d'ouverture
  dailyBaseRevenue: number;
  dailyBaseCost: number;
  minEmployees: number;
  maxEmployees: number;
  sensitivity: BusinessSensitivity;
  upgradeCostMultiplier: number; // cout d'amelioration = baseCost * level * multiplier
}

export const BUSINESS_TEMPLATES: Record<BusinessType, BusinessTemplate> = {
  restaurant: {
    type: 'restaurant',
    displayName: 'Restaurant',
    description: 'Cuisine et service. Tres sensible a la meteo et au pouvoir d\'achat.',
    baseCost: 15000,
    dailyBaseRevenue: 800,
    dailyBaseCost: 350,
    minEmployees: 2,
    maxEmployees: 15,
    sensitivity: {
      sun: 1.2, rain: -0.8, storm: -1.5, heatwave: -0.5, snow: -1.0, flood: -2.0,
      spring: 1.0, summer: 1.3, autumn: 0.9, winter: 0.7,
      consumption: 1.5, inflation: 1.2, interestRate: 0.3, unemployment: 1.0, rawMaterials: 1.5,
    },
    upgradeCostMultiplier: 1.5,
  },

  boutique: {
    type: 'boutique',
    displayName: 'Boutique',
    description: 'Commerce de detail. Sensible aux saisons et a la frequentation.',
    baseCost: 10000,
    dailyBaseRevenue: 500,
    dailyBaseCost: 200,
    minEmployees: 1,
    maxEmployees: 8,
    sensitivity: {
      sun: 1.0, rain: -0.5, storm: -1.0, heatwave: -0.3, snow: -0.7, flood: -1.5,
      spring: 1.2, summer: 0.8, autumn: 1.1, winter: 1.4,  // soldes d'hiver
      consumption: 1.8, inflation: 1.0, interestRate: 0.2, unemployment: 1.3, rawMaterials: 0.8,
    },
    upgradeCostMultiplier: 1.3,
  },

  immobilier: {
    type: 'immobilier',
    displayName: 'Agence Immobiliere',
    description: 'Achat-vente de biens. Tres sensible aux taux d\'interet.',
    baseCost: 25000,
    dailyBaseRevenue: 1200,
    dailyBaseCost: 500,
    minEmployees: 2,
    maxEmployees: 10,
    sensitivity: {
      sun: 0.2, rain: -0.1, storm: -0.3, heatwave: 0.0, snow: -0.2, flood: -1.0,
      spring: 1.3, summer: 0.9, autumn: 1.0, winter: 0.7,
      consumption: 0.8, inflation: 0.5, interestRate: 2.0, unemployment: 1.5, rawMaterials: 0.3,
    },
    upgradeCostMultiplier: 2.0,
  },

  startup: {
    type: 'startup',
    displayName: 'Startup Tech',
    description: 'Innovation et tech. Sensible a la croissance et aux investisseurs.',
    baseCost: 8000,
    dailyBaseRevenue: 300,
    dailyBaseCost: 400,  // perd de l'argent au debut!
    minEmployees: 1,
    maxEmployees: 20,
    sensitivity: {
      sun: 0.0, rain: 0.0, storm: -0.2, heatwave: -0.1, snow: 0.0, flood: -0.5,
      spring: 1.0, summer: 0.9, autumn: 1.0, winter: 1.0,
      consumption: 0.5, inflation: 0.3, interestRate: 1.5, unemployment: -0.5, rawMaterials: 0.1,
    },
    upgradeCostMultiplier: 1.8,
  },

  food_truck: {
    type: 'food_truck',
    displayName: 'Food Truck',
    description: 'Cuisine mobile. Tres dependant de la meteo, mais peu de charges fixes.',
    baseCost: 5000,
    dailyBaseRevenue: 400,
    dailyBaseCost: 100,
    minEmployees: 0,
    maxEmployees: 3,
    sensitivity: {
      sun: 2.0, rain: -1.5, storm: -2.0, heatwave: 0.5, snow: -1.8, flood: -2.0,
      spring: 1.3, summer: 1.8, autumn: 0.8, winter: 0.4,
      consumption: 1.3, inflation: 1.0, interestRate: 0.1, unemployment: 0.8, rawMaterials: 1.8,
    },
    upgradeCostMultiplier: 1.0,
  },

  garage: {
    type: 'garage',
    displayName: 'Garage Auto',
    description: 'Reparation et entretien. Stable toute l\'annee, boost en hiver.',
    baseCost: 12000,
    dailyBaseRevenue: 600,
    dailyBaseCost: 250,
    minEmployees: 1,
    maxEmployees: 8,
    sensitivity: {
      sun: 0.1, rain: 0.3, storm: 0.5, heatwave: 0.3, snow: 0.8, flood: 1.0,
      spring: 0.9, summer: 0.8, autumn: 1.1, winter: 1.3,
      consumption: 0.7, inflation: 0.8, interestRate: 0.2, unemployment: 0.5, rawMaterials: 1.2,
    },
    upgradeCostMultiplier: 1.4,
  },

  hotel: {
    type: 'hotel',
    displayName: 'Hotel',
    description: 'Hebergement. Fort potentiel mais gros investissement.',
    baseCost: 50000,
    dailyBaseRevenue: 2000,
    dailyBaseCost: 1000,
    minEmployees: 3,
    maxEmployees: 25,
    sensitivity: {
      sun: 1.5, rain: -0.5, storm: -1.0, heatwave: 0.3, snow: 0.8, flood: -1.5,
      spring: 1.1, summer: 1.8, autumn: 0.7, winter: 1.2,  // ski
      consumption: 1.5, inflation: 0.8, interestRate: 0.5, unemployment: 1.2, rawMaterials: 0.5,
    },
    upgradeCostMultiplier: 2.5,
  },

  ferme: {
    type: 'ferme',
    displayName: 'Ferme',
    description: 'Agriculture. Tres dependante de la meteo et des saisons.',
    baseCost: 20000,
    dailyBaseRevenue: 700,
    dailyBaseCost: 300,
    minEmployees: 1,
    maxEmployees: 12,
    sensitivity: {
      sun: 1.5, rain: 0.5, storm: -1.5, heatwave: -1.8, snow: -1.5, flood: -2.0,
      spring: 1.5, summer: 1.2, autumn: 1.3, winter: 0.3,
      consumption: 0.8, inflation: 0.5, interestRate: 0.3, unemployment: 0.2, rawMaterials: 0.5,
    },
    upgradeCostMultiplier: 1.6,
  },
};
