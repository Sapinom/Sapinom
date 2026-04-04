import { WorldState, createWorldState } from './WorldState';
import { SeasonWeatherEngine } from './SeasonWeatherEngine';
import { EconomyEngine } from './EconomyEngine';
import { EventEngine } from './EventEngine';
import { BusinessEngine, DailyReport } from './BusinessEngine';
import { Player, createPlayer } from '../models/Player';
import { Business, createBusiness, BusinessType } from '../models/Business';
import { createEmployee, Employee } from '../models/Employee';
import { Loan, createLoan } from '../models/Loan';
import { BUSINESS_TEMPLATES } from '../data/businesses';
import { CONFIG } from '../data/config';
import { clamp } from '../utils/random';

/**
 * Boucle de jeu principale.
 * Orchestre tous les moteurs et fournit l'API pour l'UI.
 *
 * 1 tick = 1 jour in-game
 *
 * Ordre de traitement par tick :
 * 1. Avancer saisons/meteo
 * 2. Avancer l'economie
 * 3. Tenter un evenement
 * 4. Calculer revenus/couts des businesses
 * 5. Traiter les emprunts
 * 6. Mettre a jour XP/level
 */

export interface DayResult {
  day: number;
  season: string;
  weather: string;
  economyCycle: string;
  reports: DailyReport[];
  newEvent: { name: string; description: string; impact: string } | null;
  playerCash: number;
  activeEventsCount: number;
}

export class GameLoop {
  readonly world: WorldState;
  readonly player: Player;

  private seasonWeather: SeasonWeatherEngine;
  private economy: EconomyEngine;
  private events: EventEngine;
  private business: BusinessEngine;

  constructor(playerName: string) {
    this.world = createWorldState();
    this.player = createPlayer(playerName);
    this.seasonWeather = new SeasonWeatherEngine();
    this.economy = new EconomyEngine();
    this.events = new EventEngine();
    this.business = new BusinessEngine();
  }

  /**
   * Avance d'un jour. Retourne le rapport de la journee.
   */
  tick(): DayResult {
    // 1. Saisons et meteo
    this.seasonWeather.tick(this.world);

    // 2. Economie
    this.economy.tick(this.world);

    // 3. Evenements
    const triggeredEvent = this.events.tick(this.world, this.player);

    // 4. Businesses
    const reports = this.business.tick(this.world, this.player);

    // 5. Emprunts (remboursement mensuel = chaque 30 jours)
    if (this.world.day % 30 === 0) {
      this.processLoans();
    }

    // 6. XP et level
    this.updatePlayerProgression(reports);

    // 7. Avancer le compteur
    this.world.day++;
    this.player.daysSinceStart++;

    return {
      day: this.world.day - 1,
      season: this.world.season,
      weather: this.world.weather,
      economyCycle: this.world.economyCycle,
      reports,
      newEvent: triggeredEvent
        ? { name: triggeredEvent.name, description: triggeredEvent.description, impact: triggeredEvent.impact }
        : null,
      playerCash: Math.round(this.player.cash * 100) / 100,
      activeEventsCount: this.world.activeEvents.length,
    };
  }

  /**
   * Avance de N jours d'un coup.
   */
  tickMultiple(days: number): DayResult[] {
    const results: DayResult[] = [];
    for (let i = 0; i < days; i++) {
      results.push(this.tick());
    }
    return results;
  }

  // =============================================
  // API JOUEUR — Actions disponibles
  // =============================================

  /** Ouvrir un nouveau business. */
  openBusiness(name: string, type: BusinessType, city: string): Business | string {
    const template = BUSINESS_TEMPLATES[type];
    if (!template) return `Type inconnu: ${type}`;

    const cost = template.baseCost;
    if (this.player.cash < cost) {
      return `Fonds insuffisants. Il faut ${cost}$, vous avez ${Math.round(this.player.cash)}$.`;
    }

    this.player.cash -= cost;
    this.player.totalSpent += cost;

    const biz = createBusiness(name, type, city, template.dailyBaseRevenue, template.dailyBaseCost);
    this.player.businesses.push(biz);
    return biz;
  }

  /** Embaucher un employe pour un business. */
  hireEmployee(businessId: string): Employee | string {
    const biz = this.player.businesses.find(b => b.id === businessId);
    if (!biz) return 'Business introuvable.';

    const template = BUSINESS_TEMPLATES[biz.type];
    if (biz.employees.length >= template.maxEmployees) {
      return `Maximum d'employes atteint (${template.maxEmployees}).`;
    }

    const salaryLevel = 1 + (biz.level - 1) * 0.15;
    const emp = createEmployee(salaryLevel);
    biz.employees.push(emp);
    return emp;
  }

  /** Ajuster le prix d'un business (0.5 a 2.0). */
  setPrice(businessId: string, multiplier: number): boolean {
    const biz = this.player.businesses.find(b => b.id === businessId);
    if (!biz) return false;
    biz.priceMultiplier = clamp(multiplier, 0.5, 2.0);
    return true;
  }

  /** Ameliorer un business (augmente le level). */
  upgradeBusiness(businessId: string): string | true {
    const biz = this.player.businesses.find(b => b.id === businessId);
    if (!biz) return 'Business introuvable.';
    if (biz.level >= 10) return 'Niveau maximum atteint.';

    const template = BUSINESS_TEMPLATES[biz.type];
    const cost = template.baseCost * biz.level * template.upgradeCostMultiplier;

    if (this.player.cash < cost) {
      return `Fonds insuffisants. Amelioration: ${Math.round(cost)}$.`;
    }

    this.player.cash -= cost;
    this.player.totalSpent += cost;
    biz.level++;
    biz.dailyBaseRevenue = template.dailyBaseRevenue * (1 + (biz.level - 1) * 0.25);
    return true;
  }

  /** Emprunter a la banque. */
  takeLoan(amount: number, durationMonths: number): Loan | string {
    const { LOAN } = CONFIG;
    amount = clamp(amount, LOAN.MIN_AMOUNT, LOAN.MAX_AMOUNT);
    durationMonths = clamp(durationMonths, LOAN.DURATION_MONTHS_MIN, LOAN.DURATION_MONTHS_MAX);

    // Verification de la capacite d'endettement
    const totalDebt = this.player.loans.reduce((s, l) => s + l.remainingAmount, 0);
    const monthlyRevenue = this.player.businesses.reduce(
      (s, b) => s + b.lastDailyRevenue * 30, 0,
    );
    if (totalDebt + amount > monthlyRevenue * LOAN.MAX_DEBT_RATIO && monthlyRevenue > 0) {
      return `Trop endette. Dette max: ${Math.round(monthlyRevenue * LOAN.MAX_DEBT_RATIO)}$.`;
    }

    const loan = createLoan(amount, this.world.interestRate, durationMonths);
    this.player.loans.push(loan);
    this.player.cash += amount;
    return loan;
  }

  // =============================================
  // INTERNE
  // =============================================

  private processLoans(): void {
    this.player.loans = this.player.loans.filter(loan => {
      if (loan.monthsRemaining <= 0) return false;

      this.player.cash -= loan.monthlyPayment;
      this.player.totalSpent += loan.monthlyPayment;
      loan.remainingAmount -= loan.monthlyPayment - (loan.remainingAmount * loan.interestRate / 12);
      loan.monthsRemaining--;

      return loan.monthsRemaining > 0;
    });
  }

  private updatePlayerProgression(reports: DailyReport[]): void {
    const totalProfit = reports.reduce((s, r) => s + Math.max(r.profit, 0), 0);

    // XP basee sur le profit et les actions
    this.player.xp += Math.floor(totalProfit * 0.1);
    this.player.xp += reports.length * 5; // XP juste pour avoir des business ouverts

    // Level up : XP necessaire = 1000 * level^1.5
    const xpNeeded = Math.floor(1000 * Math.pow(this.player.level, 1.5));
    if (this.player.xp >= xpNeeded) {
      this.player.xp -= xpNeeded;
      this.player.level++;
    }
  }

  // =============================================
  // GETTERS pour l'UI
  // =============================================

  getWorldSummary() {
    return {
      day: this.world.day,
      season: this.world.season,
      weather: this.world.weather,
      economyCycle: this.world.economyCycle,
      inflation: (this.world.inflation * 100).toFixed(1) + '%',
      consumption: this.world.consumption.toFixed(2),
      unemployment: (this.world.unemployment * 100).toFixed(1) + '%',
      interestRate: (this.world.interestRate * 100).toFixed(1) + '%',
      rawMaterialCost: this.world.rawMaterialCost.toFixed(2),
      activeEvents: this.world.activeEvents.map(e => ({
        name: e.name,
        daysLeft: e.daysRemaining,
      })),
    };
  }

  getPlayerSummary() {
    return {
      name: this.player.name,
      cash: Math.round(this.player.cash),
      level: this.player.level,
      xp: this.player.xp,
      reputation: this.player.reputation,
      businesses: this.player.businesses.length,
      totalEarned: Math.round(this.player.totalEarned),
      totalSpent: Math.round(this.player.totalSpent),
      totalDebt: Math.round(this.player.loans.reduce((s, l) => s + l.remainingAmount, 0)),
    };
  }

  getRecentEvents(count: number = 5) {
    return this.world.eventLog.slice(-count);
  }
}
