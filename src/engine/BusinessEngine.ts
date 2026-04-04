import { WorldState } from './WorldState';
import { Player } from '../models/Player';
import { Business } from '../models/Business';
import { Employee } from '../models/Employee';
import { BUSINESS_TEMPLATES, BusinessSensitivity } from '../data/businesses';
import { CONFIG } from '../data/config';
import { clamp, chance, vary } from '../utils/random';

/**
 * Moteur de calcul des revenus/couts par entreprise.
 *
 * Le revenu quotidien d'un business est :
 *   base * level_bonus * weather_impact * season_impact * economy_impact
 *   * employee_bonus * reputation_factor * price_factor * event_modifiers
 *
 * Les couts quotidiens sont :
 *   base_cost * inflation_impact * raw_material_impact * employee_salaries
 *   * event_modifiers
 */

export interface DailyReport {
  businessId: string;
  businessName: string;
  revenue: number;
  costs: number;
  profit: number;
  details: string[];
}

export class BusinessEngine {

  /**
   * Calcule le P&L quotidien de chaque business du joueur.
   */
  tick(world: WorldState, player: Player): DailyReport[] {
    const reports: DailyReport[] = [];

    for (const business of player.businesses) {
      if (!business.isOpen) continue;

      business.daysSinceOpening++;
      const report = this.calculateDaily(world, player, business);
      reports.push(report);

      // Appliquer le resultat
      player.cash += report.profit;
      if (report.revenue > 0) player.totalEarned += report.revenue;
      if (report.costs > 0) player.totalSpent += report.costs;

      business.lastDailyRevenue = report.revenue;
      business.lastDailyCost = report.costs;

      // Gerer les employes
      this.tickEmployees(business, world);
    }

    return reports;
  }

  private calculateDaily(world: WorldState, player: Player, biz: Business): DailyReport {
    const template = BUSINESS_TEMPLATES[biz.type];
    const sens = template.sensitivity;
    const details: string[] = [];

    // --- REVENU ---
    let revenue = biz.dailyBaseRevenue;

    // Bonus de niveau (chaque niveau = +20%)
    const levelBonus = 1 + (biz.level - 1) * 0.2;
    revenue *= levelBonus;

    // Impact meteo
    const weatherImpact = this.getWeatherMultiplier(world.weather, sens);
    revenue *= weatherImpact;
    if (weatherImpact < 0.9) details.push(`Meteo defavorable (x${weatherImpact.toFixed(2)})`);
    if (weatherImpact > 1.1) details.push(`Bonne meteo (x${weatherImpact.toFixed(2)})`);

    // Impact saison
    const seasonImpact = this.getSeasonMultiplier(world.season, sens);
    revenue *= seasonImpact;

    // Impact consommation (pouvoir d'achat)
    const consumptionImpact = 1 + (world.consumption - 1) * sens.consumption * 0.5;
    revenue *= clamp(consumptionImpact, 0.3, 2.0);

    // Impact chomage (moins de clients si chomage haut)
    const unemploymentImpact = 1 - (world.unemployment - CONFIG.ECONOMY.BASE_UNEMPLOYMENT) * sens.unemployment;
    revenue *= clamp(unemploymentImpact, 0.5, 1.3);

    // Bonus employes
    const employeeBonus = this.getEmployeeBonus(biz);
    revenue *= employeeBonus;

    // Facteur reputation (0..100 -> 0.5..1.5)
    const reputationFactor = 0.5 + (biz.reputation / 100);
    revenue *= reputationFactor;

    // Prix fixe par le joueur
    // Prix haut = plus de revenu par client mais moins de clients
    const priceDemandEffect = 1 + (biz.priceMultiplier - 1) * 0.6; // revenu
    const priceVolumeEffect = 1 - (biz.priceMultiplier - 1) * 0.4; // volume
    revenue *= priceDemandEffect * priceVolumeEffect;

    // Evenements actifs sur ce business
    const eventRevMultiplier = this.getActiveEventMultiplier(world, biz.id, 'revenueMultiplier');
    revenue *= eventRevMultiplier;
    if (eventRevMultiplier !== 1) details.push(`Evenement en cours (rev x${eventRevMultiplier.toFixed(2)})`);

    // Variation quotidienne naturelle (+/- 10%)
    revenue = vary(revenue, 0.1);

    // Revenu minimum garanti (anti-frustration)
    revenue = Math.max(revenue, CONFIG.BALANCE.MIN_DAILY_REVENUE_FLOOR);

    // --- COUTS ---
    let costs = biz.dailyBaseCost;

    // Inflation sur les couts
    costs *= 1 + world.inflation * sens.inflation;

    // Cout des matieres premieres
    costs *= 1 + (world.rawMaterialCost - 1) * sens.rawMaterials * 0.5;

    // Salaires des employes
    const salaries = biz.employees.reduce((sum, e) => sum + e.salary / 30, 0);
    costs += salaries;

    // Evenements actifs sur les couts
    const eventCostMultiplier = this.getActiveEventMultiplier(world, biz.id, 'costMultiplier');
    costs *= eventCostMultiplier;

    costs = vary(costs, 0.05);

    // Arrondir
    revenue = Math.round(revenue * 100) / 100;
    costs = Math.round(costs * 100) / 100;

    return {
      businessId: biz.id,
      businessName: biz.name,
      revenue,
      costs,
      profit: revenue - costs,
      details,
    };
  }

  private getWeatherMultiplier(weather: string, sens: BusinessSensitivity): number {
    const key = weather as keyof BusinessSensitivity;
    const sensitivity = (sens as any)[key];
    if (typeof sensitivity !== 'number') return 1.0;
    // Convertir la sensibilite en multiplicateur
    // sensibilite 0 = pas d'impact, 1 = +10%, -1 = -10%, 2 = +20%, etc.
    return clamp(1.0 + sensitivity * 0.1, 0.1, 2.0);
  }

  private getSeasonMultiplier(season: string, sens: BusinessSensitivity): number {
    const key = season as keyof BusinessSensitivity;
    const value = (sens as any)[key];
    if (typeof value !== 'number') return 1.0;
    return clamp(value, 0.3, 2.0);
  }

  private getEmployeeBonus(biz: Business): number {
    if (biz.employees.length === 0) return 1.0;

    // Moyenne de performance * moral
    const avgPerformance = biz.employees.reduce((s, e) => s + e.performance, 0) / biz.employees.length;
    const avgMorale = biz.employees.reduce((s, e) => s + e.morale, 0) / biz.employees.length;

    // Performance : 0.5..1.5, Morale : 0..100 -> 0.5..1.5
    const moraleFactor = 0.5 + (avgMorale / 100);
    return clamp(avgPerformance * moraleFactor, 0.3, 2.0);
  }

  private getActiveEventMultiplier(world: WorldState, businessId: string, effectKey: string): number {
    let multiplier = 1.0;
    for (const event of world.activeEvents) {
      // L'event doit cibler ce business ou etre global (pas de cible)
      if (event.targetBusinessId && event.targetBusinessId !== businessId) continue;
      if (event.effects[effectKey]) {
        multiplier *= event.effects[effectKey];
      }
    }
    return multiplier;
  }

  private tickEmployees(biz: Business, world: WorldState): void {
    for (const emp of biz.employees) {
      emp.daysEmployed++;

      // Gestion greve
      if (emp.isOnStrike) {
        emp.strikeDaysLeft--;
        if (emp.strikeDaysLeft <= 0) {
          emp.isOnStrike = false;
          emp.morale = clamp(emp.morale + 10, 0, 100);
        }
        continue;
      }

      // Moral evolue lentement
      if (chance(0.05)) {
        emp.morale = clamp(emp.morale + (chance(0.6) ? 1 : -1), 0, 100);
      }

      // Evenement moral des employes par events actifs
      for (const event of world.activeEvents) {
        if (event.targetBusinessId === biz.id && event.effects['employeeMoraleChange']) {
          emp.morale = clamp(
            emp.morale + event.effects['employeeMoraleChange'] * 0.1,
            0,
            100,
          );
        }
      }
    }

    // Demissions possibles (employes a moral tres bas)
    biz.employees = biz.employees.filter(emp => {
      if (emp.morale < 20 && chance(CONFIG.EMPLOYEE.QUIT_BASE_CHANCE * 3)) {
        return false; // demissionne
      }
      return true;
    });
  }
}
