/**
 * Utilitaires de probabilites et d'aleatoire pondere.
 * Aucune IA externe — tout repose sur des maths simples.
 */

/** Retourne un nombre aleatoire entre min et max (inclus). */
export function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/** Retourne un entier aleatoire entre min et max (inclus). */
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Retourne true avec la probabilite donnee (0..1). */
export function chance(probability: number): boolean {
  return Math.random() < probability;
}

/**
 * Selection ponderee parmi une liste d'elements.
 * Chaque element a un poids (weight). Plus le poids est eleve, plus il a de chances d'etre choisi.
 */
export function weightedPick<T extends { weight: number }>(items: T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

/** Borne une valeur entre min et max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Lissage progressif : deplace current vers target d'un facteur speed (0..1). */
export function lerp(current: number, target: number, speed: number): number {
  return current + (target - current) * speed;
}

/** Variation aleatoire autour d'une valeur de base. */
export function vary(base: number, variancePct: number): number {
  const factor = 1 + randFloat(-variancePct, variancePct);
  return base * factor;
}
