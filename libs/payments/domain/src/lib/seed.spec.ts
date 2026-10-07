import { describe, expect, it } from 'vitest';
import { shortenAddress } from './format';
import { DEMO_OPERATOR } from './operator';
import { createSeedPayments, SEED_SIZE } from './seed';

const NOW = new Date('2026-10-07T15:10:00Z');

describe('createSeedPayments', () => {
  const seed = createSeedPayments(NOW);

  it('matches the design queue', () => {
    expect(seed).toHaveLength(SEED_SIZE);
    expect(SEED_SIZE).toBe(14);
    expect(new Set(seed.map((p) => p.id)).size).toBe(SEED_SIZE);
  });

  it('places payments relative to now', () => {
    expect(seed[0].receivedAt).toEqual(new Date('2026-10-07T14:52:00Z'));
  });

  it('keeps the design address fragments', () => {
    expect(shortenAddress(seed[0].fromAddress)).toBe('TJR7n…Af7W');
    expect(shortenAddress(seed[1].fromAddress)).toBe('0x7a3F…9c21');
  });

  it('assigns six payments to the demo operator', () => {
    expect(seed.filter((p) => p.assigneeId === DEMO_OPERATOR.id)).toHaveLength(
      6,
    );
  });

  it('is deterministic', () => {
    expect(createSeedPayments(NOW)).toEqual(seed);
  });
});
