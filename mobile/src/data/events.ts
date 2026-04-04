export interface EventChoice {
  label: string;
  emoji: string;
  effects: Record<string, number>;
  outcomeText: string;
}

export interface GameEventDef {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'economy' | 'personal';
  impact: 'positive' | 'negative' | 'neutral';
  emoji: string;
  baseWeight: number;
  conditions: {
    minDay?: number; minCash?: number; minBiz?: number;
    minEmp?: number; minLevel?: number;
    bizTypes?: string[]; // only trigger if player has these biz types
  };
  // If choices exist, player picks. Otherwise auto-applied.
  choices?: EventChoice[];
  // Auto-effects (when no choices)
  effects?: Record<string, number>;
  duration: number;  // 0 = instant
  cooldown: number;
}

export const ALL_EVENTS: GameEventDef[] = [
  // ---- POSITIVE BUSINESS ----
  {
    id: 'marketing_success', name: 'Campagne virale !', emoji: '📱',
    description: 'Votre dernière pub cartonne sur les réseaux. Les clients affluent !',
    category: 'business', impact: 'positive', baseWeight: 15,
    conditions: { minDay: 10, minCash: 500 },
    effects: { revenueMultiplier: 1.4, reputationChange: 10 },
    duration: 7, cooldown: 30,
  },
  {
    id: 'star_employee', name: 'Employé star', emoji: '⭐',
    description: 'Un de vos employés impressionne tout le monde. Productivité record !',
    category: 'business', impact: 'positive', baseWeight: 12,
    conditions: { minEmp: 1 },
    effects: { revenueMultiplier: 1.25, moraleChange: 15 },
    duration: 14, cooldown: 20,
  },
  {
    id: 'subsidy', name: 'Subvention !', emoji: '🏛️',
    description: 'L\'État accorde une aide à votre secteur.',
    category: 'business', impact: 'positive', baseWeight: 8,
    conditions: { minDay: 30, minBiz: 1 },
    effects: { cashChange: 3000, reputationChange: 5 },
    duration: 0, cooldown: 60,
  },
  {
    id: 'viral_review', name: 'Buzz positif', emoji: '🌟',
    description: 'Un influenceur poste un avis élogieux. Votre réputation explose !',
    category: 'business', impact: 'positive', baseWeight: 10,
    conditions: { minDay: 7 },
    effects: { revenueMultiplier: 1.3, reputationChange: 15 },
    duration: 5, cooldown: 25,
  },
  {
    id: 'bulk_order', name: 'Grosse commande', emoji: '📦',
    description: 'Un client important passe une commande massive.',
    category: 'business', impact: 'positive', baseWeight: 10,
    conditions: { minDay: 14, minBiz: 1 },
    effects: { cashChange: 2500 },
    duration: 0, cooldown: 15,
  },

  // ---- NEGATIVE BUSINESS (with choices!) ----
  {
    id: 'strike', name: 'Grève !', emoji: '✊',
    description: 'Vos employés menacent de se mettre en grève. Ils veulent de meilleures conditions.',
    category: 'business', impact: 'negative', baseWeight: 8,
    conditions: { minEmp: 3 },
    choices: [
      { label: 'Négocier (+salaires)', emoji: '🤝', effects: { costMultiplier: 1.15, moraleChange: 20 }, outcomeText: 'Vous augmentez les salaires. Le moral remonte.' },
      { label: 'Refuser', emoji: '✋', effects: { revenueMultiplier: 0.3, moraleChange: -25 }, outcomeText: 'La grève éclate. Production quasi à l\'arrêt pendant 5 jours.' },
      { label: 'Prime exceptionnelle', emoji: '💰', effects: { cashChange: -2000, moraleChange: 30 }, outcomeText: 'Vous distribuez des primes. Tout le monde est content.' },
    ],
    duration: 5, cooldown: 30,
  },
  {
    id: 'equipment_failure', name: 'Panne !', emoji: '🔧',
    description: 'Un équipement critique est tombé en panne.',
    category: 'business', impact: 'negative', baseWeight: 14,
    conditions: { minDay: 5 },
    choices: [
      { label: 'Réparer (cher)', emoji: '🛠️', effects: { cashChange: -2000 }, outcomeText: 'Réparation express. Tout repart.' },
      { label: 'Attendre (lent)', emoji: '⏳', effects: { revenueMultiplier: 0.5 }, outcomeText: 'Vous attendez un devis moins cher. Production au ralenti 5 jours.' },
      { label: 'Upgrader !', emoji: '🚀', effects: { cashChange: -4000, revenueMultiplier: 1.15 }, outcomeText: 'Vous profitez pour moderniser. Les performances augmentent !' },
    ],
    duration: 5, cooldown: 20,
  },
  {
    id: 'bad_buzz', name: 'Bad buzz', emoji: '💀',
    description: 'Un client mécontent poste une vidéo virale. Votre image en prend un coup.',
    category: 'business', impact: 'negative', baseWeight: 10,
    conditions: { minDay: 14 },
    choices: [
      { label: 'Excuses publiques', emoji: '🙏', effects: { reputationChange: -5 }, outcomeText: 'Vos excuses sont acceptées. L\'impact est limité.' },
      { label: 'Ignorer', emoji: '😤', effects: { reputationChange: -20, revenueMultiplier: 0.7 }, outcomeText: 'Le buzz s\'amplifie. 10 jours de galère.' },
      { label: 'Offrir un dédommagement', emoji: '🎁', effects: { cashChange: -1000, reputationChange: 5 }, outcomeText: 'Le client retourne sa veste. Votre geste est salué.' },
    ],
    duration: 10, cooldown: 30,
  },
  {
    id: 'tax_audit', name: 'Contrôle fiscal', emoji: '📋',
    description: 'L\'administration fiscale débarque pour un contrôle.',
    category: 'business', impact: 'negative', baseWeight: 7,
    conditions: { minDay: 30, minBiz: 1 },
    choices: [
      { label: 'Coopérer', emoji: '📂', effects: { cashChangePct: -0.05, reputationChange: 5 }, outcomeText: 'Contrôle propre. Petite amende mais bonne réputation.' },
      { label: 'Engager un avocat', emoji: '⚖️', effects: { cashChange: -3000 }, outcomeText: 'L\'avocat réduit l\'amende. Ça vous coûte ses honoraires.' },
    ],
    duration: 0, cooldown: 60,
  },
  {
    id: 'theft', name: 'Cambriolage !', emoji: '🦹',
    description: 'Votre établissement a été cambriolé cette nuit.',
    category: 'business', impact: 'negative', baseWeight: 8,
    conditions: { minDay: 10 },
    choices: [
      { label: 'Assurance', emoji: '🛡️', effects: { cashChange: -500 }, outcomeText: 'L\'assurance couvre le gros. Franchise de 500$.' },
      { label: 'Sécurité renforcée', emoji: '🔒', effects: { cashChange: -3000, reputationChange: 5 }, outcomeText: 'Vous installez alarmes et caméras. Plus jamais ça.' },
    ],
    duration: 0, cooldown: 30,
  },
  {
    id: 'health_inspection', name: 'Contrôle sanitaire', emoji: '🧪',
    description: 'Un inspecteur sanitaire débarque sans prévenir.',
    category: 'business', impact: 'negative', baseWeight: 6,
    conditions: { minDay: 20, bizTypes: ['restaurant', 'food_truck', 'hotel'] },
    choices: [
      { label: 'Tout est propre', emoji: '✨', effects: { cashChange: -300, reputationChange: 10 }, outcomeText: 'Inspection passée ! Votre hygiène est exemplaire.' },
      { label: 'Fermer pour nettoyer', emoji: '🧹', effects: { revenueMultiplier: 0, cashChange: -800 }, outcomeText: 'Fermeture 2 jours. Mise en conformité.' },
    ],
    duration: 2, cooldown: 45,
  },
  {
    id: 'shady_supplier', name: 'Deal louche', emoji: '🕶️',
    description: 'Un fournisseur vous propose des matières premières à -50%. Ça semble trop beau...',
    category: 'business', impact: 'neutral', baseWeight: 8,
    conditions: { minDay: 20, minBiz: 1 },
    choices: [
      { label: 'Accepter le deal', emoji: '🤑', effects: { costMultiplier: 0.5, reputationChange: -10 }, outcomeText: 'Coûts divisés par 2 ! Mais des rumeurs circulent...' },
      { label: 'Refuser poliment', emoji: '👋', effects: { reputationChange: 5 }, outcomeText: 'Vous restez clean. Votre réputation s\'améliore.' },
    ],
    duration: 14, cooldown: 30,
  },
  {
    id: 'investor_pitch', name: 'Investisseur intéressé', emoji: '💼',
    description: 'Un investisseur veut mettre de l\'argent dans votre affaire. Mais il veut du contrôle.',
    category: 'business', impact: 'neutral', baseWeight: 6,
    conditions: { minDay: 45, minBiz: 1, minLevel: 2 },
    choices: [
      { label: 'Accepter (gros cash)', emoji: '💎', effects: { cashChange: 15000, revenueMultiplier: 0.85 }, outcomeText: '+15 000$ mais il prend 15% de vos revenus.' },
      { label: 'Négocier (moins)', emoji: '🤝', effects: { cashChange: 8000, revenueMultiplier: 0.93 }, outcomeText: '+8 000$ et seulement 7% de revenus cédés.' },
      { label: 'Refuser', emoji: '✋', effects: { reputationChange: 3 }, outcomeText: 'Vous restez indépendant. Respect.' },
    ],
    duration: 30, cooldown: 90,
  },

  // ---- ECONOMY EVENTS ----
  {
    id: 'economic_boom', name: 'Boom économique !', emoji: '📈',
    description: 'L\'économie décolle. Les consommateurs dépensent sans compter !',
    category: 'economy', impact: 'positive', baseWeight: 8,
    conditions: { minDay: 30 },
    effects: { consumptionChange: 0.2, inflationChange: 0.01 },
    duration: 30, cooldown: 90,
  },
  {
    id: 'recession_evt', name: 'Récession', emoji: '📉',
    description: 'L\'économie plonge. Les ménages se serrent la ceinture.',
    category: 'economy', impact: 'negative', baseWeight: 6,
    conditions: { minDay: 60 },
    effects: { consumptionChange: -0.25, inflationChange: -0.01 },
    duration: 45, cooldown: 120,
  },
  {
    id: 'rate_hike', name: 'Hausse des taux', emoji: '🏦',
    description: 'La banque centrale augmente les taux directeurs.',
    category: 'economy', impact: 'negative', baseWeight: 7,
    conditions: { minDay: 30 },
    effects: { interestRateChange: 0.02 },
    duration: 60, cooldown: 90,
  },
  {
    id: 'rate_cut', name: 'Baisse des taux', emoji: '🎉',
    description: 'La banque centrale baisse les taux pour relancer l\'économie.',
    category: 'economy', impact: 'positive', baseWeight: 7,
    conditions: { minDay: 30 },
    effects: { interestRateChange: -0.02 },
    duration: 60, cooldown: 90,
  },
  {
    id: 'consumer_confidence', name: 'Confiance en hausse', emoji: '😊',
    description: 'Les ménages sont optimistes. La consommation repart !',
    category: 'economy', impact: 'positive', baseWeight: 10,
    conditions: { minDay: 14 },
    effects: { consumptionChange: 0.15 },
    duration: 20, cooldown: 40,
  },
];
