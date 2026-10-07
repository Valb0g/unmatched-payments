import type { NetworkId, TokenSymbol } from './catalog';
import type { Money } from './money';

export const ISSUE_TYPES = [
  'underpaid',
  'overpaid',
  'wrong-network',
  'wrong-token',
  'no-invoice',
  'expired-invoice',
  'duplicate',
] as const;
export type IssueType = (typeof ISSUE_TYPES)[number];

export const PAYMENT_STATUSES = ['open', 'in-review', 'escalated'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface PaymentIssue {
  readonly type: IssueType;
  readonly note: string;
}

export interface SuggestedMatch {
  readonly invoiceId: string;
  readonly confidence: number;
}

export interface UnmatchedPayment {
  readonly id: string;
  readonly txHash: string;
  readonly receivedAt: Date;
  readonly amount: Money;
  readonly token: TokenSymbol;
  readonly network: NetworkId;
  readonly fromAddress: string;
  readonly issue: PaymentIssue;
  readonly suggestedMatch: SuggestedMatch | null;
  readonly status: PaymentStatus;
  readonly assigneeId: string | null;
}

export const ISSUE_LABELS: Readonly<Record<IssueType, string>> = {
  underpaid: 'Underpaid',
  overpaid: 'Overpaid',
  'wrong-network': 'Wrong network',
  'wrong-token': 'Wrong token',
  'no-invoice': 'No invoice found',
  'expired-invoice': 'Expired invoice',
  duplicate: 'Duplicate',
};

export const STATUS_LABELS: Readonly<Record<PaymentStatus, string>> = {
  open: 'Open',
  'in-review': 'In review',
  escalated: 'Escalated',
};

export function isPaymentStatus(value: unknown): value is PaymentStatus {
  return (
    typeof value === 'string' &&
    (PAYMENT_STATUSES as readonly string[]).includes(value)
  );
}
