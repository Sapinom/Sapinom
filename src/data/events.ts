import { BusinessType } from '../models/Business';

/**
 * Systeme d'evenements aleatoires ponderes.
 * Chaque evenement a :
 * - une probabilite de base
 * - des conditions de declenchement
 * - des consequences chiffrees
 * - une duree
 */

export type EventCategory = 'business' | 'economy' | 'weather' | 'personal';
export type EventImpact = 'positive' | 'negative' | 'neutral';

export interface GameEventCondition {
  minDay?: number;                    // jour minimum pour declencher
  minPlayerLevel?: number;
  requiredBusinessTypes?: BusinessType[];
  minBusinessCount?: number;
  maxBusinessCount?: number;
  minCash?: number;
  maxCash?: number;
  requiredSeason?: string;
  requiredWeather?: string;
  minEmployeeCount?: number;
  economyPhase?: string;              // 'growth' | 'recession' | 'stable'
}

export interface GameEventEffect {
  // Effets sur le business cible
  revenueMultiplier?: number;         // multiplicateur temporaire de revenu
  costMultiplier?: number;            // multiplicateur temporaire de cout
  reputationChange?: number;          // +/- reputation
  employeeMoraleChange?: number;      // +/- moral des employes

  // Effets sur le joueur
  cashChange?: number;                // +/- cash direct
  cashChangePercent?: number;         // +/- % du cash actuel

  // Effets sur l'economie (evenements macro)
  inflationChange?: number;
  consumptionChange?: number;
  interestRateChange?: number;
}

export interface GameEventDef {
  id: string;
  name: string;
  description: string;
  category: EventCategory;
  impact: EventImpact;
  baseWeight: number;                 // poids de base pour la selection ponderee
  conditions: GameEventCondition;
  effects: GameEventEffect;
  durationDays: number;               // 0 = instantane
  affectsBusinessTypes?: BusinessType[]; // si vide, affecte le business au hasard
  cooldownDays: number;               // jours avant de pouvoir se reproduire
}

// ============================================================
// EVENEMENTS D'ENTREPRISE
// ============================================================

const BUSINESS_EVENTS: GameEventDef[] = [
  // --- POSITIFS ---
  {
    id: 'marketing_success',
    name: 'Campagne marketing reussie',
    description: 'Votre derniere campagne fait le buzz ! Les clients affluent.',
    category: 'business',
    impact: 'positive',
    baseWeight: 15,
    conditions: { minDay: 10, minCash: 500 },
    effects: { revenueMultiplier: 1.4, reputationChange: 10 },
    durationDays: 7,
    cooldownDays: 30,
  },
  {
    id: 'star_employee',
    name: 'Employe performant',
    description: 'Un de vos employes se revele etre une star. Productivite en hausse !',
    category: 'business',
    impact: 'positive',
    baseWeight: 12,
    conditions: { minEmployeeCount: 1 },
    effects: { revenueMultiplier: 1.2, employeeMoraleChange: 10 },
    durationDays: 14,
    cooldownDays: 20,
  },
  {
    id: 'subsidy',
    name: 'Subvention obtenue',
    description: 'Vous recevez une aide publique pour votre activite.',
    category: 'business',
    impact: 'positive',
    baseWeight: 8,
    conditions: { minDay: 30, minBusinessCount: 1 },
    effects: { cashChange: 3000, reputationChange: 5 },
    durationDays: 0,
    cooldownDays: 60,
  },
  {
    id: 'buyout_opportunity',
    name: 'Opportunite de rachat',
    description: 'Un concurrent en difficulte vous propose un rachat avantageux.',
    category: 'business',
    impact: 'positive',
    baseWeight: 5,
    conditions: { minDay: 60, minCash: 10000, minPlayerLevel: 3 },
    effects: { cashChangePercent: -0.15, revenueMultiplier: 1.5 },
    durationDays: 30,
    cooldownDays: 90,
  },
  {
    id: 'viral_review',
    name: 'Avis viral positif',
    description: 'Un influenceur publie un avis elogieux. Votre reputation explose !',
    category: 'business',
    impact: 'positive',
    baseWeight: 10,
    conditions: { minDay: 7 },
    effects: { revenueMultiplier: 1.3, reputationChange: 15 },
    durationDays: 5,
    cooldownDays: 25,
  },
  {
    id: 'bulk_order',
    name: 'Commande en gros',
    description: 'Un gros client passe une commande exceptionnelle.',
    category: 'business',
    impact: 'positive',
    baseWeight: 10,
    conditions: { minDay: 14, minBusinessCount: 1 },
    effects: { cashChange: 2000 },
    durationDays: 0,
    cooldownDays: 15,
  },

  // --- NEGATIFS ---
  {
    id: 'employee_quit',
    name: 'Demission',
    description: 'Un employe cle demissionne sans prevenir.',
    category: 'business',
    impact: 'negative',
    baseWeight: 12,
    conditions: { minEmployeeCount: 2 },
    effects: { revenueMultiplier: 0.85, employeeMoraleChange: -10 },
    durationDays: 7,
    cooldownDays: 14,
  },
  {
    id: 'strike',
    name: 'Greve',
    description: 'Vos employes se mettent en greve pour de meilleures conditions.',
    category: 'business',
    impact: 'negative',
    baseWeight: 8,
    conditions: { minEmployeeCount: 3 },
    effects: { revenueMultiplier: 0.3, costMultiplier: 1.2, employeeMoraleChange: -20 },
    durationDays: 5,
    cooldownDays: 30,
  },
  {
    id: 'equipment_failure',
    name: 'Panne d\'equipement',
    description: 'Un equipement essentiel tombe en panne. Reparation couteuse.',
    category: 'business',
    impact: 'negative',
    baseWeight: 14,
    conditions: { minDay: 5 },
    effects: { cashChange: -1500, revenueMultiplier: 0.7 },
    durationDays: 3,
    cooldownDays: 20,
  },
  {
    id: 'bad_buzz',
    name: 'Bad buzz',
    description: 'Un scandale eclate sur les reseaux sociaux. Votre image en prend un coup.',
    category: 'business',
    impact: 'negative',
    baseWeight: 10,
    conditions: { minDay: 14 },
    effects: { revenueMultiplier: 0.6, reputationChange: -20 },
    durationDays: 10,
    cooldownDays: 30,
  },
  {
    id: 'tax_audit',
    name: 'Controle fiscal',
    description: 'L\'administration fiscale lance un controle. Stress et penalites possibles.',
    category: 'business',
    impact: 'negative',
    baseWeight: 7,
    conditions: { minDay: 30, minBusinessCount: 1 },
    effects: { cashChangePercent: -0.08, reputationChange: -5 },
    durationDays: 0,
    cooldownDays: 60,
  },
  {
    id: 'theft',
    name: 'Vol',
    description: 'Un cambriolage a eu lieu dans votre etablissement.',
    category: 'business',
    impact: 'negative',
    baseWeight: 8,
    conditions: { minDay: 10 },
    effects: { cashChange: -2000, reputationChange: -5 },
    durationDays: 0,
    cooldownDays: 30,
  },
  {
    id: 'logistics_delay',
    name: 'Retard logistique',
    description: 'Vos fournisseurs ont du retard. Production ralentie.',
    category: 'business',
    impact: 'negative',
    baseWeight: 12,
    conditions: { minDay: 7 },
    effects: { revenueMultiplier: 0.75, costMultiplier: 1.1 },
    durationDays: 4,
    cooldownDays: 14,
    affectsBusinessTypes: ['restaurant', 'boutique', 'food_truck', 'ferme'],
  },
  {
    id: 'health_inspection',
    name: 'Controle sanitaire',
    description: 'Un inspecteur sanitaire debarque. Fermez le temps de la mise en conformite.',
    category: 'business',
    impact: 'negative',
    baseWeight: 6,
    conditions: { minDay: 20 },
    effects: { revenueMultiplier: 0.0, cashChange: -800, reputationChange: -10 },
    durationDays: 2,
    cooldownDays: 45,
    affectsBusinessTypes: ['restaurant', 'food_truck', 'hotel'],
  },

  // --- NEUTRES ---
  {
    id: 'competitor_opens',
    name: 'Nouveau concurrent',
    description: 'Un concurrent ouvre dans votre zone. La competition s\'intensifie.',
    category: 'business',
    impact: 'neutral',
    baseWeight: 10,
    conditions: { minDay: 20 },
    effects: { revenueMultiplier: 0.9, reputationChange: -3 },
    durationDays: 14,
    cooldownDays: 30,
  },
];

// ============================================================
// EVENEMENTS ECONOMIQUES (affectent le monde entier)
// ============================================================

const ECONOMY_EVENTS: GameEventDef[] = [
  {
    id: 'economic_boom',
    name: 'Boom economique',
    description: 'L\'economie est en pleine expansion. Les consommateurs depensent !',
    category: 'economy',
    impact: 'positive',
    baseWeight: 8,
    conditions: { minDay: 30 },
    effects: { consumptionChange: 0.2, inflationChange: 0.01 },
    durationDays: 30,
    cooldownDays: 90,
  },
  {
    id: 'recession',
    name: 'Recession',
    description: 'L\'economie ralentit. Les consommateurs se serrent la ceinture.',
    category: 'economy',
    impact: 'negative',
    baseWeight: 6,
    conditions: { minDay: 60 },
    effects: { consumptionChange: -0.25, inflationChange: -0.01 },
    durationDays: 45,
    cooldownDays: 120,
  },
  {
    id: 'rate_hike',
    name: 'Hausse des taux',
    description: 'La banque centrale augmente les taux directeurs.',
    category: 'economy',
    impact: 'negative',
    baseWeight: 7,
    conditions: { minDay: 30 },
    effects: { interestRateChange: 0.02 },
    durationDays: 60,
    cooldownDays: 90,
  },
  {
    id: 'rate_cut',
    name: 'Baisse des taux',
    description: 'La banque centrale baisse les taux pour stimuler l\'economie.',
    category: 'economy',
    impact: 'positive',
    baseWeight: 7,
    conditions: { minDay: 30 },
    effects: { interestRateChange: -0.02 },
    durationDays: 60,
    cooldownDays: 90,
  },
  {
    id: 'raw_material_crisis',
    name: 'Crise des matieres premieres',
    description: 'Les prix des matieres premieres flambent suite a une penurie mondiale.',
    category: 'economy',
    impact: 'negative',
    baseWeight: 5,
    conditions: { minDay: 45 },
    effects: { inflationChange: 0.03, consumptionChange: -0.1 },
    durationDays: 30,
    cooldownDays: 60,
  },
  {
    id: 'consumer_confidence',
    name: 'Confiance des consommateurs',
    description: 'Les menages sont optimistes. La consommation augmente.',
    category: 'economy',
    impact: 'positive',
    baseWeight: 10,
    conditions: { minDay: 14 },
    effects: { consumptionChange: 0.15 },
    durationDays: 20,
    cooldownDays: 40,
  },
  {
    id: 'tax_reform',
    name: 'Reforme fiscale',
    description: 'Le gouvernement allegent les charges pour les petites entreprises.',
    category: 'economy',
    impact: 'positive',
    baseWeight: 4,
    conditions: { minDay: 60 },
    effects: { cashChangePercent: 0.05, consumptionChange: 0.05 },
    durationDays: 0,
    cooldownDays: 120,
  },
];

export const ALL_EVENTS: GameEventDef[] = [...BUSINESS_EVENTS, ...ECONOMY_EVENTS];

export function getEventsByCategory(category: EventCategory): GameEventDef[] {
  return ALL_EVENTS.filter(e => e.category === category);
}

export function getEventsByImpact(impact: EventImpact): GameEventDef[] {
  return ALL_EVENTS.filter(e => e.impact === impact);
}
