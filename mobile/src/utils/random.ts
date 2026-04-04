export const rand = (a: number, b: number) => Math.random() * (b - a) + a;
export const randInt = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
export const chance = (p: number) => Math.random() < p;
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const lerp = (c: number, t: number, s: number) => c + (t - c) * s;
export const vary = (base: number, pct: number) => base * (1 + rand(-pct, pct));
export const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR');

export function weightedPick<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}
