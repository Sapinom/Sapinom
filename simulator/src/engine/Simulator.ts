/**
 * Life Decision Simulator Engine
 * 
 * Simule les consequences d'une decision de vie sur 3 scenarios:
 * - Optimiste
 * - Realiste
 * - Pessimiste
 * 
 * Categories de decisions:
 * - voyage: budget, duree, destination
 * - logement: demenagement, achat vs location
 * - carriere: quitter son job, freelance, reconversion
 * - achat: voiture, tech, gros achat
 * - finance: investissement, epargne, credit
 * - education: formation, reprise d'etudes
 */

export type DecisionCategory = 'voyage' | 'logement' | 'carriere' | 'achat' | 'finance' | 'education';

export interface UserProfile {
  monthlyIncome: number;      // revenu mensuel net
  monthlySavings: number;     // epargne mensuelle actuelle
  totalSavings: number;       // epargne totale
  monthlyExpenses: number;    // charges fixes mensuelles
  city: string;
  age: number;
  situation: 'etudiant' | 'salarie' | 'freelance' | 'chomage' | 'entrepreneur';
}

export interface VoyageParams {
  destination: string;
  duration: number;         // jours
  budget: number;
  travelers: number;
  style: 'backpacker' | 'standard' | 'confort' | 'luxe';
}

export interface LogementParams {
  type: 'achat' | 'location';
  cityTo: string;
  currentRent: number;
  newRent?: number;
  purchasePrice?: number;
  apport?: number;
  loanDuration?: number;    // annees
}

export interface CarriereParams {
  type: 'quitter' | 'freelance' | 'reconversion' | 'negociation';
  currentSalary: number;
  expectedIncome?: number;
  transitionMonths?: number; // mois sans revenu
  formationCost?: number;
}

export interface AchatParams {
  item: string;
  price: number;
  credit: boolean;
  creditDuration?: number;  // mois
  creditRate?: number;      // taux annuel
  monthlyUse?: number;      // cout mensuel d'utilisation
}

export interface FinanceParams {
  type: 'investissement' | 'epargne' | 'credit';
  amount: number;
  duration: number;         // mois
  expectedReturn?: number;  // % annuel
  risk: 'faible' | 'moyen' | 'eleve';
}

export type DecisionParams = {
  category: 'voyage'; params: VoyageParams;
} | {
  category: 'logement'; params: LogementParams;
} | {
  category: 'carriere'; params: CarriereParams;
} | {
  category: 'achat'; params: AchatParams;
} | {
  category: 'finance'; params: FinanceParams;
};

// ============ RESULT TYPES ============

export interface TimelinePoint {
  month: number;
  label: string;
  savings: number;
  monthlyBalance: number;  // revenu - depenses ce mois-la
  event?: string;          // evenement notable
}

export interface RiskFactor {
  name: string;
  emoji: string;
  probability: number;     // 0..1
  impact: string;
  severity: 'low' | 'medium' | 'high';
}

export interface Scenario {
  name: string;
  emoji: string;
  probability: number;     // chance que ce scenario arrive
  timeline: TimelinePoint[];
  totalCost: number;
  monthlyCostImpact: number;
  savingsAfter: number;
  monthsToRecover: number; // mois pour retrouver le niveau d'epargne actuel
  verdict: string;
  score: number;           // 0..100
}

export interface SimulationResult {
  decision: string;
  category: DecisionCategory;
  scenarios: {
    optimiste: Scenario;
    realiste: Scenario;
    pessimiste: Scenario;
  };
  risks: RiskFactor[];
  keyInsight: string;
  canAfford: boolean;
  recommendation: 'go' | 'wait' | 'no';
  recommendationText: string;
}

// ============ COST DATABASES ============

const DESTINATION_DAILY_COSTS: Record<string, Record<string, number>> = {
  japon: { backpacker: 50, standard: 100, confort: 180, luxe: 350 },
  thailande: { backpacker: 25, standard: 50, confort: 100, luxe: 200 },
  usa: { backpacker: 60, standard: 120, confort: 200, luxe: 400 },
  europe: { backpacker: 40, standard: 80, confort: 150, luxe: 300 },
  maroc: { backpacker: 20, standard: 40, confort: 80, luxe: 160 },
  canada: { backpacker: 55, standard: 110, confort: 190, luxe: 380 },
  australie: { backpacker: 55, standard: 110, confort: 200, luxe: 400 },
  bresil: { backpacker: 30, standard: 60, confort: 120, luxe: 250 },
  default: { backpacker: 45, standard: 90, confort: 160, luxe: 300 },
};

const FLIGHT_COSTS: Record<string, number> = {
  japon: 700, thailande: 550, usa: 500, europe: 150,
  maroc: 150, canada: 450, australie: 900, bresil: 600, default: 400,
};

const CITY_COST_INDEX: Record<string, number> = {
  paris: 1.3, lyon: 1.0, marseille: 0.95, toulouse: 0.92,
  bordeaux: 1.05, nantes: 0.95, lille: 0.90, strasbourg: 0.95,
  montpellier: 0.95, nice: 1.15, rennes: 0.92, default: 1.0,
};

// ============ SIMULATORS ============

function simulateVoyage(profile: UserProfile, params: VoyageParams): SimulationResult {
  const dest = params.destination.toLowerCase();
  const dailyCosts = DESTINATION_DAILY_COSTS[dest] || DESTINATION_DAILY_COSTS.default;
  const dailyCost = dailyCosts[params.style] * params.travelers;
  const flightCost = (FLIGHT_COSTS[dest] || FLIGHT_COSTS.default) * params.travelers;
  
  const baseCost = dailyCost * params.duration + flightCost;
  const visaCost = dest === 'japon' || dest === 'usa' || dest === 'australie' ? 50 * params.travelers : 0;
  const insuranceCost = Math.ceil(params.duration / 7) * 15 * params.travelers;
  
  // 3 scenarios
  const costs = {
    optimiste: Math.round(baseCost * 0.85 + visaCost + insuranceCost),
    realiste: Math.round(baseCost * 1.05 + visaCost + insuranceCost),
    pessimiste: Math.round(baseCost * 1.3 + visaCost + insuranceCost + 200 * params.travelers),
  };

  const lostIncome = params.duration > 25 
    ? Math.round((params.duration / 30) * profile.monthlyIncome * (profile.situation === 'freelance' ? 1 : 0))
    : 0;

  function buildTimeline(totalCost: number, label: string): TimelinePoint[] {
    const timeline: TimelinePoint[] = [];
    const monthsBefore = 3;
    const tripMonth = monthsBefore;
    const monthsAfter = 6;
    
    let savings = profile.totalSavings;
    
    for (let m = 0; m < monthsBefore + 1 + monthsAfter; m++) {
      if (m < tripMonth) {
        savings += profile.monthlySavings;
        timeline.push({ month: m, label: `M-${tripMonth - m}`, savings, monthlyBalance: profile.monthlySavings, event: m === 0 ? 'Preparation' : undefined });
      } else if (m === tripMonth) {
        savings -= totalCost;
        savings -= lostIncome;
        timeline.push({ month: m, label: 'Voyage', savings, monthlyBalance: -(totalCost + lostIncome), event: `${params.destination} (${params.duration}j)` });
      } else {
        savings += profile.monthlySavings;
        timeline.push({ month: m, label: `M+${m - tripMonth}`, savings, monthlyBalance: profile.monthlySavings });
      }
    }
    return timeline;
  }

  function buildScenario(name: string, emoji: string, prob: number, cost: number): Scenario {
    const totalCost = cost + lostIncome;
    const timeline = buildTimeline(cost, name);
    const savingsAfter = profile.totalSavings - totalCost + profile.monthlySavings * 3;
    const monthsToRecover = profile.monthlySavings > 0 ? Math.ceil(totalCost / profile.monthlySavings) : 999;
    
    let score: number;
    const ratio = totalCost / profile.totalSavings;
    if (ratio < 0.2) score = 95;
    else if (ratio < 0.4) score = 80;
    else if (ratio < 0.6) score = 60;
    else if (ratio < 0.8) score = 40;
    else if (ratio < 1) score = 20;
    else score = 5;

    let verdict: string;
    if (score >= 80) verdict = 'Largement dans tes moyens. Fonce !';
    else if (score >= 60) verdict = 'Faisable mais ca va se sentir sur ton epargne.';
    else if (score >= 40) verdict = 'Serre. Tu vas devoir faire attention pendant quelques mois apres.';
    else if (score >= 20) verdict = 'Risque. Ca va taper fort dans ton epargne.';
    else verdict = 'Tres difficile avec ton budget actuel.';

    return { name, emoji, probability: prob, timeline, totalCost, monthlyCostImpact: 0, savingsAfter, monthsToRecover, verdict, score };
  }

  const scenarios = {
    optimiste: buildScenario('Optimiste', '🌟', 0.2, costs.optimiste),
    realiste: buildScenario('Realiste', '📊', 0.6, costs.realiste),
    pessimiste: buildScenario('Pessimiste', '⚠️', 0.2, costs.pessimiste),
  };

  const risks: RiskFactor[] = [
    { name: 'Depenses imprevues', emoji: '💸', probability: 0.6, impact: '+15-30% du budget', severity: 'medium' },
    { name: 'Probleme de sante', emoji: '🏥', probability: 0.05, impact: 'Frais medicaux non couverts', severity: 'high' },
    { name: 'Vol/perte', emoji: '🦹', probability: 0.1, impact: 'Remplacement materiel 200-500€', severity: 'medium' },
    { name: 'Annulation vol', emoji: '✈️', probability: 0.08, impact: 'Frais de rebooking', severity: 'low' },
  ];

  if (dest === 'japon') {
    risks.push({ name: 'Taux de change defavorable', emoji: '💱', probability: 0.3, impact: '+5-10% sur tout', severity: 'medium' });
  }

  const canAfford = costs.realiste < profile.totalSavings * 0.7;
  const score = scenarios.realiste.score;
  
  let recommendation: 'go' | 'wait' | 'no';
  let recommendationText: string;
  if (score >= 60) {
    recommendation = 'go';
    recommendationText = `Tu peux y aller. Cout realiste: ${costs.realiste}€. Tu recuperes en ${scenarios.realiste.monthsToRecover} mois.`;
  } else if (score >= 30) {
    recommendation = 'wait';
    const monthsToSave = Math.ceil((costs.realiste * 0.7 - profile.totalSavings) / profile.monthlySavings);
    recommendationText = `Attends ${monthsToSave > 0 ? monthsToSave : 2} mois de plus pour etre confortable. Ou reduis a ${Math.floor(params.duration * 0.7)} jours.`;
  } else {
    recommendation = 'no';
    recommendationText = `Trop serre. Il te faudrait ${Math.round(costs.realiste * 0.7)}€ d'epargne pour que ce soit confortable.`;
  }

  return {
    decision: `Voyage ${params.destination} - ${params.duration} jours (${params.style})`,
    category: 'voyage',
    scenarios,
    risks,
    keyInsight: `Ce voyage coute entre ${costs.optimiste}€ et ${costs.pessimiste}€, soit ${Math.round(costs.realiste / profile.monthlyIncome * 100)}% de ton salaire mensuel.`,
    canAfford,
    recommendation,
    recommendationText,
  };
}

function simulateAchat(profile: UserProfile, params: AchatParams): SimulationResult {
  const { price, credit, creditDuration = 24, creditRate = 0.05, monthlyUse = 0 } = params;
  
  let monthlyCreditPayment = 0;
  let totalCreditCost = price;
  if (credit && creditDuration > 0) {
    const mr = creditRate / 12;
    monthlyCreditPayment = mr > 0 ? (price * mr) / (1 - Math.pow(1 + mr, -creditDuration)) : price / creditDuration;
    monthlyCreditPayment = Math.round(monthlyCreditPayment);
    totalCreditCost = monthlyCreditPayment * creditDuration;
  }

  function buildTimeline(costMult: number): TimelinePoint[] {
    const timeline: TimelinePoint[] = [];
    let savings = profile.totalSavings;
    const months = credit ? creditDuration + 6 : 12;
    
    for (let m = 0; m < Math.min(months, 24); m++) {
      if (m === 0 && !credit) {
        savings -= price * costMult;
        timeline.push({ month: m, label: 'Achat', savings, monthlyBalance: -(price * costMult), event: `Achat ${params.item}` });
      } else {
        const monthlyCost = (credit ? monthlyCreditPayment * costMult : 0) + monthlyUse * costMult;
        savings += profile.monthlySavings - monthlyCost;
        timeline.push({ month: m, label: `M+${m}`, savings, monthlyBalance: profile.monthlySavings - monthlyCost });
      }
    }
    return timeline;
  }

  function buildScenario(name: string, emoji: string, prob: number, mult: number): Scenario {
    const totalCost = credit ? Math.round(totalCreditCost * mult + monthlyUse * 12 * mult) : Math.round(price * mult + monthlyUse * 12 * mult);
    const timeline = buildTimeline(mult);
    const monthlyCostImpact = (credit ? monthlyCreditPayment * mult : 0) + monthlyUse * mult;
    const savingsAfter = credit ? profile.totalSavings + profile.monthlySavings * creditDuration - totalCreditCost * mult : profile.totalSavings - price * mult;
    const monthsToRecover = profile.monthlySavings > 0 ? Math.ceil((credit ? 0 : price * mult) / profile.monthlySavings) : 999;

    const ratio = credit ? monthlyCostImpact / profile.monthlyIncome : price * mult / profile.totalSavings;
    let score: number;
    if (credit) {
      if (ratio < 0.1) score = 90;
      else if (ratio < 0.2) score = 70;
      else if (ratio < 0.3) score = 50;
      else if (ratio < 0.4) score = 30;
      else score = 10;
    } else {
      if (ratio < 0.2) score = 95;
      else if (ratio < 0.4) score = 75;
      else if (ratio < 0.6) score = 55;
      else if (ratio < 0.8) score = 30;
      else score = 10;
    }

    let verdict: string;
    if (score >= 80) verdict = 'Achat confortable, pas de stress.';
    else if (score >= 60) verdict = 'Faisable. Impact modere sur ton budget.';
    else if (score >= 40) verdict = 'Ca va se sentir. Reduis tes depenses quelques mois.';
    else verdict = 'Impact lourd sur ton budget. Reflechis bien.';

    return { name, emoji, probability: prob, timeline, totalCost, monthlyCostImpact: Math.round(monthlyCostImpact), savingsAfter: Math.round(savingsAfter), monthsToRecover, verdict, score };
  }

  const scenarios = {
    optimiste: buildScenario('Optimiste', '🌟', 0.2, 0.9),
    realiste: buildScenario('Realiste', '📊', 0.6, 1.0),
    pessimiste: buildScenario('Pessimiste', '⚠️', 0.2, 1.15),
  };

  const risks: RiskFactor[] = [
    { name: 'Frais caches', emoji: '💸', probability: 0.4, impact: '+5-15% du prix', severity: 'medium' },
    { name: 'Panne / reparation', emoji: '🔧', probability: 0.2, impact: 'Frais imprevus', severity: 'medium' },
  ];
  if (credit) {
    risks.push({ name: 'Hausse des taux', emoji: '📈', probability: 0.15, impact: 'Mensualites plus elevees', severity: 'low' });
  }
  if (price > 5000) {
    risks.push({ name: 'Depreciation', emoji: '📉', probability: 0.7, impact: 'Perte de valeur rapide', severity: 'medium' });
  }

  const score = scenarios.realiste.score;
  const canAfford = credit ? monthlyCreditPayment < profile.monthlyIncome * 0.3 : price < profile.totalSavings * 0.7;

  let recommendation: 'go' | 'wait' | 'no';
  let recommendationText: string;
  if (score >= 60) {
    recommendation = 'go';
    recommendationText = credit
      ? `Faisable. ${monthlyCreditPayment}€/mois pendant ${creditDuration} mois (cout total: ${Math.round(totalCreditCost)}€ soit ${Math.round(totalCreditCost - price)}€ d'interets).`
      : `Tu peux te le permettre. Il te restera ${Math.round(profile.totalSavings - price)}€ d'epargne.`;
  } else if (score >= 30) {
    recommendation = 'wait';
    const needed = Math.round(price / 0.5 - profile.totalSavings);
    recommendationText = `Epargne encore ${Math.ceil(needed / profile.monthlySavings)} mois, ou cherche moins cher.`;
  } else {
    recommendation = 'no';
    recommendationText = 'Trop lourd pour ton budget actuel.';
  }

  return {
    decision: `Acheter ${params.item} (${price}€${credit ? ' a credit' : ' comptant'})`,
    category: 'achat',
    scenarios, risks, canAfford, recommendation, recommendationText,
    keyInsight: credit
      ? `${monthlyCreditPayment}€/mois pendant ${creditDuration} mois = ${Math.round(monthlyCreditPayment / profile.monthlyIncome * 100)}% de ton revenu.`
      : `${price}€ = ${Math.round(price / profile.totalSavings * 100)}% de ton epargne totale.`,
  };
}

function simulateCarriere(profile: UserProfile, params: CarriereParams): SimulationResult {
  const { type, currentSalary, expectedIncome = currentSalary, transitionMonths = 3, formationCost = 0 } = params;

  function buildTimeline(incomeRatio: number, transExtra: number): TimelinePoint[] {
    const timeline: TimelinePoint[] = [];
    let savings = profile.totalSavings;
    const totalTrans = transitionMonths + transExtra;
    
    for (let m = 0; m < 18; m++) {
      let income: number, event: string | undefined;
      if (m < totalTrans) {
        income = type === 'negociation' ? currentSalary : 0;
        if (m === 0) event = type === 'quitter' ? 'Demission' : type === 'freelance' ? 'Lancement freelance' : type === 'reconversion' ? 'Debut formation' : 'Negociation';
        if (m === 0) savings -= formationCost;
      } else if (m < totalTrans + 3) {
        income = expectedIncome * incomeRatio * 0.5; // montee en charge
        if (m === totalTrans) event = 'Premiers revenus';
      } else {
        income = expectedIncome * incomeRatio;
        if (m === totalTrans + 3) event = 'Vitesse de croisiere';
      }
      
      const balance = income - profile.monthlyExpenses;
      savings += balance;
      timeline.push({ month: m, label: `M+${m}`, savings, monthlyBalance: Math.round(balance), event });
    }
    return timeline;
  }

  function buildScenario(name: string, emoji: string, prob: number, incomeRatio: number, transExtra: number): Scenario {
    const timeline = buildTimeline(incomeRatio, transExtra);
    const totalTrans = transitionMonths + transExtra;
    const lostIncome = currentSalary * totalTrans;
    const totalCost = lostIncome + formationCost;
    const finalIncome = expectedIncome * incomeRatio;
    const monthlyCostImpact = currentSalary - finalIncome;
    const savingsAfter = timeline[timeline.length - 1]?.savings ?? 0;
    const monthsToRecover = finalIncome > currentSalary ? Math.ceil(totalCost / (finalIncome - currentSalary)) : (finalIncome < currentSalary ? 999 : 0);

    const diff = finalIncome - currentSalary;
    let score: number;
    if (diff > currentSalary * 0.3) score = 90;
    else if (diff > currentSalary * 0.1) score = 75;
    else if (diff >= 0) score = 60;
    else if (diff > -currentSalary * 0.2) score = 40;
    else score = 20;
    // Adjust for risk of transition
    if (totalTrans > 6) score -= 15;
    if (profile.totalSavings < profile.monthlyExpenses * totalTrans) score -= 20;
    score = Math.max(5, Math.min(95, score));

    let verdict: string;
    if (score >= 75) verdict = 'Bon move. Le jeu en vaut la chandelle.';
    else if (score >= 55) verdict = 'Faisable mais prepare-toi a quelques mois difficiles.';
    else if (score >= 35) verdict = 'Risque. Assure-toi d\'avoir un filet de securite.';
    else verdict = 'Tres risque avec ta situation actuelle.';

    return { name, emoji, probability: prob, timeline, totalCost, monthlyCostImpact: Math.round(monthlyCostImpact), savingsAfter: Math.round(savingsAfter), monthsToRecover, verdict, score };
  }

  const scenarios = {
    optimiste: buildScenario('Optimiste', '🌟', 0.2, 1.3, 0),
    realiste: buildScenario('Realiste', '📊', 0.55, 1.0, 1),
    pessimiste: buildScenario('Pessimiste', '⚠️', 0.25, 0.7, 3),
  };

  const risks: RiskFactor[] = [
    { name: 'Transition plus longue', emoji: '⏳', probability: 0.4, impact: `${transitionMonths + 2}-${transitionMonths + 4} mois sans revenu`, severity: 'high' },
    { name: 'Revenus inferieurs', emoji: '📉', probability: 0.3, impact: '-20-30% vs attentes', severity: 'high' },
    { name: 'Stress / burnout', emoji: '😰', probability: 0.25, impact: 'Impact sante', severity: 'medium' },
    { name: 'Retour en arriere', emoji: '↩️', probability: 0.15, impact: 'Retour au salariat', severity: 'low' },
  ];

  const cushion = profile.totalSavings / profile.monthlyExpenses;
  const canAfford = cushion >= transitionMonths + 3;
  const score = scenarios.realiste.score;

  let recommendation: 'go' | 'wait' | 'no';
  let recommendationText: string;
  if (score >= 60 && canAfford) {
    recommendation = 'go';
    recommendationText = `Tu as ${Math.round(cushion)} mois de reserve. Assez pour la transition. Revenu attendu: ${expectedIncome}€/mois.`;
  } else if (score >= 35) {
    recommendation = 'wait';
    const monthsNeeded = Math.ceil((profile.monthlyExpenses * (transitionMonths + 3) - profile.totalSavings) / profile.monthlySavings);
    recommendationText = `Epargne encore ${Math.max(monthsNeeded, 3)} mois pour avoir un matelas confortable (${transitionMonths + 3} mois de charges).`;
  } else {
    recommendation = 'no';
    recommendationText = `Trop risque. Tu n'as que ${Math.round(cushion)} mois de reserve, il en faudrait ${transitionMonths + 3}.`;
  }

  const typeLabel = type === 'quitter' ? 'Quitter son job' : type === 'freelance' ? 'Passer freelance' : type === 'reconversion' ? 'Se reconvertir' : 'Negocier une augmentation';
  
  return {
    decision: typeLabel,
    category: 'carriere',
    scenarios, risks, canAfford, recommendation, recommendationText,
    keyInsight: `Tu as ${Math.round(cushion)} mois de reserve. La transition prendra ${transitionMonths}-${transitionMonths + 3} mois.`,
  };
}

// ============ MAIN SIMULATE FUNCTION ============

export function simulate(profile: UserProfile, decision: DecisionParams): SimulationResult {
  switch (decision.category) {
    case 'voyage': return simulateVoyage(profile, decision.params);
    case 'achat': return simulateAchat(profile, decision.params);
    case 'carriere': return simulateCarriere(profile, decision.params);
    default: return simulateVoyage(profile, { destination: 'default', duration: 7, budget: 1000, travelers: 1, style: 'standard' });
  }
}
