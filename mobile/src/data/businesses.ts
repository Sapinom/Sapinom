export interface BusinessSensitivity {
  sun: number; rain: number; storm: number; heatwave: number;
  snow: number; flood: number; cloudy: number;
  spring: number; summer: number; autumn: number; winter: number;
  consumption: number; inflation: number; interestRate: number;
  unemployment: number; rawMaterials: number;
}

export interface BusinessTemplate {
  type: string;
  name: string;
  emoji: string;
  cost: number;
  dailyRevenue: number;
  dailyExpense: number;
  maxEmployees: number;
  description: string;
  sensitivity: BusinessSensitivity;
  buildingColor: string;    // color for city view
  buildingHeight: number;   // relative height 1-5
}

export const BUSINESS_TEMPLATES: Record<string, BusinessTemplate> = {
  food_truck: {
    type: 'food_truck', name: 'Food Truck', emoji: '🚚',
    cost: 5000, dailyRevenue: 400, dailyExpense: 100, maxEmployees: 3,
    description: 'Cuisine mobile. Pas cher mais dépendant de la météo.',
    sensitivity: { sun: 2, rain: -1.5, storm: -2, heatwave: .5, snow: -1.8, flood: -2, cloudy: 0, spring: 1.3, summer: 1.8, autumn: .8, winter: .4, consumption: 1.3, inflation: 1, interestRate: .1, unemployment: .8, rawMaterials: 1.8 },
    buildingColor: '#ff9800', buildingHeight: 1,
  },
  restaurant: {
    type: 'restaurant', name: 'Restaurant', emoji: '🍽️',
    cost: 15000, dailyRevenue: 800, dailyExpense: 350, maxEmployees: 15,
    description: 'Cuisine et service. Le cœur de la gastronomie.',
    sensitivity: { sun: 1.2, rain: -.8, storm: -1.5, heatwave: -.5, snow: -1, flood: -2, cloudy: 0, spring: 1, summer: 1.3, autumn: .9, winter: .7, consumption: 1.5, inflation: 1.2, interestRate: .3, unemployment: 1, rawMaterials: 1.5 },
    buildingColor: '#e91e63', buildingHeight: 2,
  },
  boutique: {
    type: 'boutique', name: 'Boutique', emoji: '🛍️',
    cost: 10000, dailyRevenue: 500, dailyExpense: 200, maxEmployees: 8,
    description: 'Commerce de détail. Les soldes font la différence.',
    sensitivity: { sun: 1, rain: -.5, storm: -1, heatwave: -.3, snow: -.7, flood: -1.5, cloudy: 0, spring: 1.2, summer: .8, autumn: 1.1, winter: 1.4, consumption: 1.8, inflation: 1, interestRate: .2, unemployment: 1.3, rawMaterials: .8 },
    buildingColor: '#9c27b0', buildingHeight: 2,
  },
  startup: {
    type: 'startup', name: 'Startup Tech', emoji: '💻',
    cost: 8000, dailyRevenue: 300, dailyExpense: 400, maxEmployees: 20,
    description: 'Risqué mais potentiel énorme. Perd de l\'argent au début.',
    sensitivity: { sun: 0, rain: 0, storm: -.2, heatwave: -.1, snow: 0, flood: -.5, cloudy: 0, spring: 1, summer: .9, autumn: 1, winter: 1, consumption: .5, inflation: .3, interestRate: 1.5, unemployment: -.5, rawMaterials: .1 },
    buildingColor: '#2196f3', buildingHeight: 3,
  },
  garage: {
    type: 'garage', name: 'Garage Auto', emoji: '🔧',
    cost: 12000, dailyRevenue: 600, dailyExpense: 250, maxEmployees: 8,
    description: 'Réparation auto. Stable et profite du mauvais temps.',
    sensitivity: { sun: .1, rain: .3, storm: .5, heatwave: .3, snow: .8, flood: 1, cloudy: 0, spring: .9, summer: .8, autumn: 1.1, winter: 1.3, consumption: .7, inflation: .8, interestRate: .2, unemployment: .5, rawMaterials: 1.2 },
    buildingColor: '#607d8b', buildingHeight: 2,
  },
  ferme: {
    type: 'ferme', name: 'Ferme', emoji: '🌾',
    cost: 20000, dailyRevenue: 700, dailyExpense: 300, maxEmployees: 12,
    description: 'Agriculture. La terre ne ment pas... sauf quand il grêle.',
    sensitivity: { sun: 1.5, rain: .5, storm: -1.5, heatwave: -1.8, snow: -1.5, flood: -2, cloudy: 0, spring: 1.5, summer: 1.2, autumn: 1.3, winter: .3, consumption: .8, inflation: .5, interestRate: .3, unemployment: .2, rawMaterials: .5 },
    buildingColor: '#4caf50', buildingHeight: 1,
  },
  immobilier: {
    type: 'immobilier', name: 'Agence Immo', emoji: '🏠',
    cost: 25000, dailyRevenue: 1200, dailyExpense: 500, maxEmployees: 10,
    description: 'Achat-vente de biens. Les taux d\'intérêt sont tout.',
    sensitivity: { sun: .2, rain: -.1, storm: -.3, heatwave: 0, snow: -.2, flood: -1, cloudy: 0, spring: 1.3, summer: .9, autumn: 1, winter: .7, consumption: .8, inflation: .5, interestRate: 2, unemployment: 1.5, rawMaterials: .3 },
    buildingColor: '#ff5722', buildingHeight: 4,
  },
  hotel: {
    type: 'hotel', name: 'Hôtel', emoji: '🏨',
    cost: 50000, dailyRevenue: 2000, dailyExpense: 1000, maxEmployees: 25,
    description: 'Le palace. Gros investissement, gros revenus.',
    sensitivity: { sun: 1.5, rain: -.5, storm: -1, heatwave: .3, snow: .8, flood: -1.5, cloudy: 0, spring: 1.1, summer: 1.8, autumn: .7, winter: 1.2, consumption: 1.5, inflation: .8, interestRate: .5, unemployment: 1.2, rawMaterials: .5 },
    buildingColor: '#ffc107', buildingHeight: 5,
  },
};
