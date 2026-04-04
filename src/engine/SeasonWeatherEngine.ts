import { WorldState, Season, WeatherType } from './WorldState';
import { CONFIG } from '../data/config';
import { weightedPick, randInt, chance } from '../utils/random';

/**
 * Moteur de saisons et meteo.
 * Gere les transitions de saison, la meteo quotidienne,
 * et les evenements meteorologiques extremes.
 */

interface WeatherOption {
  type: WeatherType;
  weight: number;
}

// Probabilites de meteo par saison (poids relatifs)
const WEATHER_BY_SEASON: Record<Season, WeatherOption[]> = {
  spring: [
    { type: 'sun', weight: 35 },
    { type: 'rain', weight: 30 },
    { type: 'cloudy', weight: 25 },
    { type: 'storm', weight: 8 },
    { type: 'heatwave', weight: 2 },
    { type: 'snow', weight: 0 },
    { type: 'flood', weight: 0 },
  ],
  summer: [
    { type: 'sun', weight: 50 },
    { type: 'cloudy', weight: 15 },
    { type: 'rain', weight: 10 },
    { type: 'heatwave', weight: 15 },
    { type: 'storm', weight: 8 },
    { type: 'snow', weight: 0 },
    { type: 'flood', weight: 2 },
  ],
  autumn: [
    { type: 'rain', weight: 35 },
    { type: 'cloudy', weight: 25 },
    { type: 'sun', weight: 20 },
    { type: 'storm', weight: 12 },
    { type: 'flood', weight: 5 },
    { type: 'snow', weight: 3 },
    { type: 'heatwave', weight: 0 },
  ],
  winter: [
    { type: 'cloudy', weight: 25 },
    { type: 'rain', weight: 20 },
    { type: 'snow', weight: 25 },
    { type: 'sun', weight: 15 },
    { type: 'storm', weight: 10 },
    { type: 'flood', weight: 3 },
    { type: 'heatwave', weight: 0 },
  ],
};

const SEASON_ORDER: Season[] = ['spring', 'summer', 'autumn', 'winter'];

export class SeasonWeatherEngine {

  /**
   * Avance d'un jour. Met a jour la saison et la meteo.
   */
  tick(world: WorldState): void {
    this.advanceSeason(world);
    this.advanceWeather(world);
  }

  private advanceSeason(world: WorldState): void {
    world.dayInSeason++;
    if (world.dayInSeason > CONFIG.DAYS_PER_SEASON) {
      world.dayInSeason = 1;
      const currentIndex = SEASON_ORDER.indexOf(world.season);
      world.season = SEASON_ORDER[(currentIndex + 1) % 4];
    }
  }

  private advanceWeather(world: WorldState): void {
    world.weatherDaysRemaining--;

    if (world.weatherDaysRemaining <= 0) {
      this.generateNewWeather(world);
    }
  }

  private generateNewWeather(world: WorldState): void {
    const options = WEATHER_BY_SEASON[world.season].filter(o => o.weight > 0);
    const picked = weightedPick(options);
    world.weather = picked.type;

    // Duree selon le type de meteo
    if (this.isExtremeWeather(picked.type)) {
      world.extremeWeatherActive = true;
      world.weatherDaysRemaining = this.getExtremeDuration(picked.type);
    } else {
      world.extremeWeatherActive = false;
      world.weatherDaysRemaining = randInt(1, 4); // meteo normale : 1 a 4 jours
    }
  }

  private isExtremeWeather(weather: WeatherType): boolean {
    return ['storm', 'heatwave', 'flood'].includes(weather);
  }

  private getExtremeDuration(weather: WeatherType): number {
    const { WEATHER } = CONFIG;
    switch (weather) {
      case 'storm':
        return randInt(WEATHER.STORM_DURATION_MIN, WEATHER.STORM_DURATION_MAX);
      case 'heatwave':
        return randInt(WEATHER.HEATWAVE_DURATION_MIN, WEATHER.HEATWAVE_DURATION_MAX);
      case 'flood':
        return randInt(WEATHER.FLOOD_DURATION_MIN, WEATHER.FLOOD_DURATION_MAX);
      default:
        return 1;
    }
  }

  /**
   * Retourne un multiplicateur de meteo pour un type de meteo donne.
   * Utilise par le BusinessEngine pour calculer l'impact.
   */
  getWeatherImpactMultiplier(weather: WeatherType, sensitivity: number): number {
    // sensitivity peut etre negatif (benefice) ou positif
    // On convertit en multiplicateur centre sur 1.0
    const impact = sensitivity * 0.1; // 10% d'impact par point de sensibilite
    return 1.0 + impact;
  }
}
