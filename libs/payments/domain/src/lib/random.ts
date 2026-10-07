export type Rng = () => number;

// mulberry32: tiny seeded PRNG so the demo stream is reproducible.
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) {
    throw new Error('Cannot pick from an empty list');
  }
  return items[Math.floor(rng() * items.length)] as T;
}

export function intBetween(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function randomString(
  rng: Rng,
  alphabet: string,
  length: number,
): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += alphabet[Math.floor(rng() * alphabet.length)];
  }
  return result;
}
