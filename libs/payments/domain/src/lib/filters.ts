import type { NetworkId } from './catalog';
import {
  ISSUE_TYPES,
  PAYMENT_STATUSES,
  type IssueType,
  type PaymentStatus,
  type UnmatchedPayment,
} from './payment';

export type IssueFilter = IssueType | 'all';
export type NetworkFilter = NetworkId | 'all';

export interface QueueFilters {
  readonly issue: IssueFilter;
  readonly statuses: readonly PaymentStatus[];
  readonly network: NetworkFilter;
  readonly search: string;
}

export const DEFAULT_FILTERS: QueueFilters = {
  issue: 'all',
  statuses: PAYMENT_STATUSES,
  network: 'all',
  search: '',
};

export function hasActiveFilters(filters: QueueFilters): boolean {
  return (
    filters.issue !== 'all' ||
    filters.network !== 'all' ||
    filters.search.trim() !== '' ||
    !PAYMENT_STATUSES.every((status) => filters.statuses.includes(status))
  );
}

export type IssueCounts = Readonly<Record<IssueFilter, number>>;

export function filterPayments(
  payments: readonly UnmatchedPayment[],
  filters: QueueFilters,
): UnmatchedPayment[] {
  return payments
    .filter(
      (p) =>
        matchesIssue(p, filters.issue) && matchesNonIssueFilters(p, filters),
    )
    .sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());
}

export function countByIssue(
  payments: readonly UnmatchedPayment[],
  filters: QueueFilters,
): IssueCounts {
  const counts: Record<IssueFilter, number> = { all: 0, ...emptyIssueCounts() };
  for (const payment of payments) {
    if (matchesNonIssueFilters(payment, filters)) {
      counts.all += 1;
      counts[payment.issue.type] += 1;
    }
  }
  return counts;
}

function emptyIssueCounts(): Record<IssueType, number> {
  return Object.fromEntries(ISSUE_TYPES.map((type) => [type, 0])) as Record<
    IssueType,
    number
  >;
}

function matchesIssue(payment: UnmatchedPayment, issue: IssueFilter): boolean {
  return issue === 'all' || payment.issue.type === issue;
}

function matchesNonIssueFilters(
  payment: UnmatchedPayment,
  filters: QueueFilters,
): boolean {
  return (
    filters.statuses.includes(payment.status) &&
    (filters.network === 'all' || payment.network === filters.network) &&
    matchesSearch(payment, filters.search)
  );
}

function matchesSearch(payment: UnmatchedPayment, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (!query) {
    return true;
  }
  const haystack = [
    payment.txHash,
    payment.fromAddress,
    payment.suggestedMatch?.invoiceId ?? '',
  ];
  return haystack.some((value) => value.toLowerCase().includes(query));
}
