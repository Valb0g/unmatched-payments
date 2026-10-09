import {
  formatAge,
  formatPaymentAmount,
  formatReceivedAt,
  formatUsd,
  ISSUE_LABELS,
  type IssueFilter,
  type IssueType,
  isSlaBreached,
  networkLabel,
  type PaymentStatus,
  type QueueKpis,
  shortenAddress,
  SLA_MS,
  STATUS_LABELS,
  type UnmatchedPayment,
} from '@unmatched-payments/payments-domain';

export interface KpiTileVm {
  readonly label: string;
  readonly value: string;
  readonly hint: string | null;
  readonly warning: boolean;
}

export interface MatchVm {
  readonly invoiceId: string;
  readonly confidence: string;
  readonly barClass: string;
}

export interface QueueRowVm {
  readonly id: string;
  readonly time: string;
  readonly age: string;
  readonly ageBreached: boolean;
  readonly amount: string;
  readonly token: string;
  readonly network: string;
  readonly from: string;
  readonly fromFull: string;
  readonly issueLabel: string;
  readonly issueDotClass: string;
  readonly note: string;
  readonly match: MatchVm | null;
  readonly statusLabel: string;
  readonly statusClass: string;
}

export const ISSUE_TAB_LABELS: Readonly<Record<IssueFilter, string>> = {
  all: 'All',
  ...ISSUE_LABELS,
  'no-invoice': 'No invoice',
};

const ISSUE_DOT_CLASSES: Readonly<Record<IssueType, string>> = {
  underpaid: 'bg-warning',
  overpaid: 'bg-warning',
  'wrong-network': 'bg-primary-text',
  'wrong-token': 'bg-primary-text',
  'no-invoice': 'bg-muted-foreground',
  'expired-invoice': 'bg-muted-foreground',
  duplicate: 'bg-muted-foreground',
};

const STATUS_CLASSES: Readonly<Record<PaymentStatus, string>> = {
  open: 'border-border-strong text-foreground-subtle',
  'in-review': 'border-primary-border bg-primary-soft text-primary-text',
  escalated: 'border-warning-border bg-warning-soft text-warning',
};

export function toQueueRow(payment: UnmatchedPayment, now: Date): QueueRowVm {
  const ageMs = now.getTime() - payment.receivedAt.getTime();
  const match = payment.suggestedMatch;
  return {
    id: payment.id,
    time: formatReceivedAt(payment.receivedAt, now),
    age: formatAge(ageMs),
    ageBreached: ageMs > SLA_MS,
    amount: formatPaymentAmount(payment),
    token: payment.token,
    network: networkLabel(payment.network, payment.token),
    from: shortenAddress(payment.fromAddress),
    fromFull: payment.fromAddress,
    issueLabel: ISSUE_LABELS[payment.issue.type],
    issueDotClass: ISSUE_DOT_CLASSES[payment.issue.type],
    note: payment.issue.note,
    match: match && {
      invoiceId: match.invoiceId,
      confidence: `${match.confidence}%`,
      barClass: confidenceBarClass(match.confidence),
    },
    statusLabel: STATUS_LABELS[payment.status],
    statusClass: STATUS_CLASSES[payment.status],
  };
}

export function toKpiTiles(kpis: QueueKpis, now: Date): KpiTileVm[] {
  const oldest = kpis.oldest;
  const breached = oldest !== null && isSlaBreached(oldest.receivedAt, now);
  return [
    {
      label: 'Unmatched',
      value: String(kpis.unmatchedCount),
      hint: `+${kpis.addedToday} today`,
      warning: false,
    },
    {
      label: 'Total value',
      value: formatUsd(kpis.totalUsdCents),
      hint: 'USD equiv.',
      warning: false,
    },
    {
      label: 'Oldest',
      value: oldest
        ? formatAge(now.getTime() - oldest.receivedAt.getTime())
        : '—',
      hint: oldest
        ? `${formatPaymentAmount(oldest)} ${oldest.token}${breached ? ' · past 24h SLA' : ''}`
        : null,
      warning: breached,
    },
    {
      label: 'Assigned to you',
      value: String(kpis.assignedToOperator),
      hint: null,
      warning: false,
    },
  ];
}

function confidenceBarClass(confidence: number): string {
  if (confidence >= 85) {
    return 'bg-primary';
  }
  return confidence >= 70 ? 'bg-muted-foreground' : 'bg-warning';
}
