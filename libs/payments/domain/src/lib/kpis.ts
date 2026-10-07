import { TOKENS } from './catalog';
import { isSameUtcDay } from './format';
import { toUsdCents } from './money';
import type { UnmatchedPayment } from './payment';

export interface QueueKpis {
  readonly unmatchedCount: number;
  readonly addedToday: number;
  readonly totalUsdCents: bigint;
  readonly oldest: UnmatchedPayment | null;
  readonly assignedToOperator: number;
}

export function computeKpis(
  payments: readonly UnmatchedPayment[],
  now: Date,
  operatorId: string,
): QueueKpis {
  let addedToday = 0;
  let totalUsdCents = 0n;
  let oldest: UnmatchedPayment | null = null;
  let assignedToOperator = 0;

  for (const payment of payments) {
    if (isSameUtcDay(payment.receivedAt, now)) {
      addedToday += 1;
    }
    totalUsdCents += toUsdCents(
      payment.amount,
      TOKENS[payment.token].usdRateCents,
    );
    if (!oldest || payment.receivedAt < oldest.receivedAt) {
      oldest = payment;
    }
    if (payment.assigneeId === operatorId) {
      assignedToOperator += 1;
    }
  }

  return {
    unmatchedCount: payments.length,
    addedToday,
    totalUsdCents,
    oldest,
    assignedToOperator,
  };
}
