import { WorldState, ActiveEvent } from './WorldState';
import { Player } from '../models/Player';
import { Business } from '../models/Business';
import { ALL_EVENTS, GameEventDef, GameEventEffect } from '../data/events';
import { CONFIG } from '../data/config';
import { weightedPick, chance, randInt, clamp } from '../utils/random';

/**
 * Moteur d'evenements aleatoires ponderes.
 *
 * Fonctionnement :
 * 1. Filtre les evenements eligibles (conditions remplies + pas en cooldown)
 * 2. Ajuste les poids selon l'equilibrage adaptatif (serie noire / serie de chance)
 * 3. Selection ponderee
 * 4. Application des effets
 * 5. Gestion des durees et cooldowns
 */

export class EventEngine {

  /**
   * Tente de declencher un evenement ce jour.
   * Retourne l'evenement declenche ou null.
   */
  tick(world: WorldState, player: Player): GameEventDef | null {
    // Decremente les durees des evenements actifs
    this.tickActiveEvents(world);

    // Verifie si on peut declencher un nouvel evenement
    if (!this.canTriggerEvent(world, player)) {
      return null;
    }

    // Filtre les evenements eligibles
    const eligible = this.getEligibleEvents(world, player);
    if (eligible.length === 0) return null;

    // Ajuste les poids pour l'equilibrage
    const adjusted = this.applyBalancing(eligible, player);

    // Selection ponderee — seulement 30% de chance qu'un event se declenche par jour eligible
    if (!chance(0.3)) return null;

    const picked = weightedPick(adjusted);

    // Applique l'evenement
    this.applyEvent(world, player, picked);
    return picked;
  }

  private canTriggerEvent(world: WorldState, player: Player): boolean {
    const { EVENTS, BALANCE } = CONFIG;

    // Protection anti-faillite en debut de jeu
    if (player.daysSinceStart < BALANCE.BANKRUPTCY_PROTECTION_DAYS && player.cash < CONFIG.STARTING_CASH * 0.3) {
      return false;
    }

    // Pas trop d'evenements simultanes
    if (world.activeEvents.length >= EVENTS.MAX_ACTIVE_EVENTS) {
      return false;
    }

    // Espacement minimum entre evenements
    if (world.day - world.lastEventDay < EVENTS.MIN_DAYS_BETWEEN_EVENTS) {
      return false;
    }

    return true;
  }

  private getEligibleEvents(world: WorldState, player: Player): GameEventDef[] {
    return ALL_EVENTS.filter(event => {
      // Cooldown
      const cooldownEnd = world.eventCooldowns.get(event.id);
      if (cooldownEnd && world.day < cooldownEnd) return false;

      // Conditions
      const c = event.conditions;
      if (c.minDay && player.daysSinceStart < c.minDay) return false;
      if (c.minPlayerLevel && player.level < c.minPlayerLevel) return false;
      if (c.minBusinessCount && player.businesses.length < c.minBusinessCount) return false;
      if (c.maxBusinessCount && player.businesses.length > c.maxBusinessCount) return false;
      if (c.minCash && player.cash < c.minCash) return false;
      if (c.maxCash && player.cash > c.maxCash) return false;

      if (c.requiredSeason && world.season !== c.requiredSeason) return false;
      if (c.requiredWeather && world.weather !== c.requiredWeather) return false;
      if (c.economyPhase && world.economyCycle !== c.economyPhase) return false;

      if (c.minEmployeeCount) {
        const totalEmployees = player.businesses.reduce((sum, b) => sum + b.employees.length, 0);
        if (totalEmployees < c.minEmployeeCount) return false;
      }

      if (c.requiredBusinessTypes) {
        const playerTypes = new Set(player.businesses.map(b => b.type));
        const hasRequired = c.requiredBusinessTypes.some(t => playerTypes.has(t));
        if (!hasRequired) return false;
      }

      // Si l'event cible des types specifiques, verifier que le joueur en a
      if (event.affectsBusinessTypes && event.affectsBusinessTypes.length > 0) {
        const playerTypes = new Set(player.businesses.map(b => b.type));
        const hasMatching = event.affectsBusinessTypes.some(t => playerTypes.has(t));
        if (!hasMatching) return false;
      }

      return true;
    });
  }

  /**
   * Equilibrage adaptatif :
   * - Apres une serie de malchance, on booste les evenements positifs
   * - Apres une serie de chance, on reduit les evenements positifs
   */
  private applyBalancing(
    events: GameEventDef[],
    player: Player,
  ): Array<GameEventDef & { weight: number }> {
    const { BALANCE, EVENTS } = CONFIG;

    return events.map(event => {
      let weight = event.baseWeight;

      // Boost positif apres serie noire
      if (player.negativeStreak >= EVENTS.LUCK_PROTECTION_THRESHOLD) {
        if (event.impact === 'positive') {
          weight *= 1 + BALANCE.NEGATIVE_STREAK_BOOST * player.negativeStreak;
        } else if (event.impact === 'negative') {
          weight *= 0.5; // reduit les events negatifs
        }
      }

      // Damper apres serie de chance
      if (player.positiveStreak >= EVENTS.LUCK_PROTECTION_THRESHOLD) {
        if (event.impact === 'positive') {
          weight *= 1 - BALANCE.POSITIVE_STREAK_DAMPER * player.positiveStreak;
        }
      }

      // Les joueurs pauvres ont moins d'events negatifs financiers
      if (player.cash < CONFIG.STARTING_CASH * 0.5 && event.impact === 'negative') {
        if (event.effects.cashChange && event.effects.cashChange < 0) {
          weight *= 0.3;
        }
      }

      return { ...event, weight: Math.max(weight, 0.1) };
    });
  }

  private applyEvent(world: WorldState, player: Player, event: GameEventDef): void {
    // Choisir un business cible si applicable
    let targetBusinessId: string | undefined;
    if (event.category === 'business' && player.businesses.length > 0) {
      let candidates = player.businesses;
      if (event.affectsBusinessTypes && event.affectsBusinessTypes.length > 0) {
        candidates = candidates.filter(b => event.affectsBusinessTypes!.includes(b.type));
      }
      if (candidates.length > 0) {
        targetBusinessId = candidates[randInt(0, candidates.length - 1)].id;
      }
    }

    // Appliquer les effets immediats
    const effects = event.effects;

    if (effects.cashChange) {
      player.cash += effects.cashChange;
    }
    if (effects.cashChangePercent) {
      player.cash += player.cash * effects.cashChangePercent;
    }
    if (effects.reputationChange) {
      player.reputation = clamp(player.reputation + effects.reputationChange, 0, 100);
    }

    // Mise a jour des streaks
    if (event.impact === 'negative') {
      player.negativeStreak++;
      player.positiveStreak = 0;
    } else if (event.impact === 'positive') {
      player.positiveStreak++;
      player.negativeStreak = 0;
    }

    // Si l'event a une duree, l'ajouter aux events actifs
    if (event.durationDays > 0) {
      const activeEvent: ActiveEvent = {
        eventId: event.id,
        name: event.name,
        daysRemaining: event.durationDays,
        effects: {} as Record<string, number>,
        targetBusinessId,
      };

      // Copier les effets en cours dans l'event actif
      if (effects.revenueMultiplier) activeEvent.effects['revenueMultiplier'] = effects.revenueMultiplier;
      if (effects.costMultiplier) activeEvent.effects['costMultiplier'] = effects.costMultiplier;
      if (effects.employeeMoraleChange) activeEvent.effects['employeeMoraleChange'] = effects.employeeMoraleChange;
      if (effects.consumptionChange) activeEvent.effects['consumptionChange'] = effects.consumptionChange;
      if (effects.inflationChange) activeEvent.effects['inflationChange'] = effects.inflationChange;
      if (effects.interestRateChange) activeEvent.effects['interestRateChange'] = effects.interestRateChange;

      world.activeEvents.push(activeEvent);
    }

    // Cooldown
    world.eventCooldowns.set(event.id, world.day + event.cooldownDays);
    world.lastEventDay = world.day;

    // Log
    world.eventLog.push({
      day: world.day,
      message: `${event.name}: ${event.description}`,
      impact: event.impact,
    });
  }

  private tickActiveEvents(world: WorldState): void {
    world.activeEvents = world.activeEvents.filter(event => {
      event.daysRemaining--;
      return event.daysRemaining > 0;
    });
  }
}
