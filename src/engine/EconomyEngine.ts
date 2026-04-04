import { WorldState, EconomyCycle } from './WorldState';
import { CONFIG } from '../data/config';
import { clamp, lerp, vary, chance, weightedPick, randInt } from '../utils/random';

/**
 * Moteur economique global.
 * Simule les cycles economiques, l'inflation, les taux, le chomage, etc.
 * Tout repose sur des formules mathematiques et des probabilites — zero IA.
 */

interface CycleOption {
  cycle: EconomyCycle;
  weight: number;
}

export class EconomyEngine {
  private readonly ECO = CONFIG.ECONOMY;

  /**
   * Avance l'economie d'un jour.
   */
  tick(world: WorldState): void {
    this.advanceCycle(world);
    this.updateInflation(world);
    this.updateConsumption(world);
    this.updateUnemployment(world);
    this.updateInterestRate(world);
    this.updateRawMaterials(world);
    this.applyActiveEconomyEvents(world);
  }

  private advanceCycle(world: WorldState): void {
    world.cycleDaysRemaining--;

    if (world.cycleDaysRemaining <= 0) {
      // Transition vers un nouveau cycle
      const options: CycleOption[] = this.getNextCycleOptions(world.economyCycle);
      const picked = weightedPick(options);
      world.economyCycle = picked.cycle;
      world.cycleDaysRemaining = randInt(
        this.ECO.CYCLE_DURATION_DAYS_MIN,
        this.ECO.CYCLE_DURATION_DAYS_MAX,
      );
    }
  }

  /**
   * Le cycle suivant depend du cycle actuel :
   * - growth -> probablement stable ou growth, rarement recession
   * - stable -> equilibre entre les trois
   * - recession -> probablement stable ou recession, rarement growth
   */
  private getNextCycleOptions(current: EconomyCycle): CycleOption[] {
    switch (current) {
      case 'growth':
        return [
          { cycle: 'growth', weight: 30 },
          { cycle: 'stable', weight: 50 },
          { cycle: 'recession', weight: 20 },
        ];
      case 'stable':
        return [
          { cycle: 'growth', weight: 35 },
          { cycle: 'stable', weight: 30 },
          { cycle: 'recession', weight: 35 },
        ];
      case 'recession':
        return [
          { cycle: 'growth', weight: 20 },
          { cycle: 'stable', weight: 50 },
          { cycle: 'recession', weight: 30 },
        ];
    }
  }

  private updateInflation(world: WorldState): void {
    let target: number;
    switch (world.economyCycle) {
      case 'growth':    target = this.ECO.BASE_INFLATION * 1.5; break;
      case 'recession': target = this.ECO.BASE_INFLATION * 0.3; break;
      default:          target = this.ECO.BASE_INFLATION; break;
    }
    target = vary(target, 0.1);
    world.inflation = clamp(
      lerp(world.inflation, target, this.ECO.CYCLE_CHANGE_SPEED),
      this.ECO.MIN_INFLATION,
      this.ECO.MAX_INFLATION,
    );
  }

  private updateConsumption(world: WorldState): void {
    let target: number;
    switch (world.economyCycle) {
      case 'growth':    target = 1.2; break;
      case 'recession': target = 0.7; break;
      default:          target = 1.0; break;
    }
    // Le chomage reduit la consommation
    target -= (world.unemployment - this.ECO.BASE_UNEMPLOYMENT) * 2;
    target = vary(target, 0.05);
    world.consumption = clamp(
      lerp(world.consumption, target, this.ECO.CYCLE_CHANGE_SPEED),
      this.ECO.MIN_CONSUMPTION,
      this.ECO.MAX_CONSUMPTION,
    );
  }

  private updateUnemployment(world: WorldState): void {
    let target: number;
    switch (world.economyCycle) {
      case 'growth':    target = this.ECO.BASE_UNEMPLOYMENT * 0.7; break;
      case 'recession': target = this.ECO.BASE_UNEMPLOYMENT * 1.8; break;
      default:          target = this.ECO.BASE_UNEMPLOYMENT; break;
    }
    target = vary(target, 0.05);
    world.unemployment = clamp(
      lerp(world.unemployment, target, this.ECO.CYCLE_CHANGE_SPEED * 0.5),
      this.ECO.MIN_UNEMPLOYMENT,
      this.ECO.MAX_UNEMPLOYMENT,
    );
  }

  private updateInterestRate(world: WorldState): void {
    // Les taux montent avec l'inflation et baissent en recession
    let target = this.ECO.BASE_INTEREST_RATE + (world.inflation - this.ECO.BASE_INFLATION) * 2;
    if (world.economyCycle === 'recession') target *= 0.7;
    target = vary(target, 0.03);
    world.interestRate = clamp(
      lerp(world.interestRate, target, this.ECO.CYCLE_CHANGE_SPEED * 0.3),
      this.ECO.MIN_INTEREST_RATE,
      this.ECO.MAX_INTEREST_RATE,
    );
  }

  private updateRawMaterials(world: WorldState): void {
    // Cout des matieres premieres suit l'inflation avec un lag
    const target = vary(1.0 + (world.inflation * 3), 0.05);
    world.rawMaterialCost = clamp(
      lerp(world.rawMaterialCost, target, this.ECO.CYCLE_CHANGE_SPEED * 0.8),
      0.5,
      2.0,
    );
  }

  private applyActiveEconomyEvents(world: WorldState): void {
    for (const event of world.activeEvents) {
      if (event.effects['consumptionChange']) {
        world.consumption = clamp(
          world.consumption + event.effects['consumptionChange'] * 0.01,
          this.ECO.MIN_CONSUMPTION,
          this.ECO.MAX_CONSUMPTION,
        );
      }
      if (event.effects['inflationChange']) {
        world.inflation = clamp(
          world.inflation + event.effects['inflationChange'] * 0.01,
          this.ECO.MIN_INFLATION,
          this.ECO.MAX_INFLATION,
        );
      }
      if (event.effects['interestRateChange']) {
        world.interestRate = clamp(
          world.interestRate + event.effects['interestRateChange'] * 0.01,
          this.ECO.MIN_INTEREST_RATE,
          this.ECO.MAX_INTEREST_RATE,
        );
      }
    }
  }
}
