import { describe, expect, it } from 'vitest';
import { computeKpis } from './kpis';
import { aPayment, FIXTURE_NOW } from './payment.fixture';

describe('computeKpis', () => {
  it('aggregates count, today, usd total, oldest and assignment', () => {
    const yesterday = new Date('2026-10-06T23:00:00Z');
    const payments = [
      aPayment({ id: 'a', assigneeId: 'op_1' }),
      aPayment({ id: 'b', receivedAt: yesterday }),
      aPayment({
        id: 'c',
        token: 'ETH',
        amount: { minor: 42_100_000_000_000_000n, decimals: 18 },
        assigneeId: 'op_1',
      }),
    ];

    const kpis = computeKpis(payments, FIXTURE_NOW, 'op_1');

    expect(kpis.unmatchedCount).toBe(3);
    expect(kpis.addedToday).toBe(2);
    expect(kpis.totalUsdCents).toBe(100n + 100n + 10_314n);
    expect(kpis.oldest?.id).toBe('b');
    expect(kpis.assignedToOperator).toBe(2);
  });

  it('handles an empty queue', () => {
    expect(computeKpis([], FIXTURE_NOW, 'op_1')).toEqual({
      unmatchedCount: 0,
      addedToday: 0,
      totalUsdCents: 0n,
      oldest: null,
      assignedToOperator: 0,
    });
  });
});
