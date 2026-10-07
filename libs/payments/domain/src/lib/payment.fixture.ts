import type { UnmatchedPayment } from './payment';

export const FIXTURE_NOW = new Date('2026-10-07T15:10:00Z');

export function aPayment(
  overrides: Partial<UnmatchedPayment> & Pick<UnmatchedPayment, 'id'>,
): UnmatchedPayment {
  return {
    txHash: `hash_${overrides.id}`,
    receivedAt: FIXTURE_NOW,
    amount: { minor: 1_000_000n, decimals: 6 },
    token: 'USDT',
    network: 'tron',
    fromAddress: `addr_${overrides.id}`,
    issue: { type: 'underpaid', note: '' },
    suggestedMatch: null,
    status: 'open',
    assigneeId: null,
    ...overrides,
  };
}
