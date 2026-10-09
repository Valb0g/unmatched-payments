import { describe, expect, it } from 'vitest';
import {
  countByIssue,
  DEFAULT_FILTERS,
  filterPayments,
  hasActiveFilters,
} from './filters';
import { aPayment, FIXTURE_NOW } from './payment.fixture';

const minutesAgo = (m: number) => new Date(FIXTURE_NOW.getTime() - m * 60_000);

const payments = [
  aPayment({
    id: 'a',
    receivedAt: minutesAgo(30),
    issue: { type: 'underpaid', note: '' },
    network: 'tron',
  }),
  aPayment({
    id: 'b',
    receivedAt: minutesAgo(10),
    issue: { type: 'duplicate', note: '' },
    network: 'ethereum',
    status: 'escalated',
  }),
  aPayment({
    id: 'c',
    receivedAt: minutesAgo(20),
    issue: { type: 'underpaid', note: '' },
    network: 'ethereum',
    txHash: '0xDEADbeef',
    suggestedMatch: { invoiceId: 'INV-20418', confidence: 90 },
  }),
];

const ids = (list: readonly { id: string }[]) => list.map((p) => p.id);

describe('filterPayments', () => {
  it('returns everything newest first by default', () => {
    expect(ids(filterPayments(payments, DEFAULT_FILTERS))).toEqual([
      'b',
      'c',
      'a',
    ]);
  });

  it('filters by issue type', () => {
    expect(
      ids(filterPayments(payments, { ...DEFAULT_FILTERS, issue: 'underpaid' })),
    ).toEqual(['c', 'a']);
  });

  it('filters by statuses', () => {
    expect(
      ids(
        filterPayments(payments, {
          ...DEFAULT_FILTERS,
          statuses: ['escalated'],
        }),
      ),
    ).toEqual(['b']);
  });

  it('filters by network', () => {
    expect(
      ids(filterPayments(payments, { ...DEFAULT_FILTERS, network: 'tron' })),
    ).toEqual(['a']);
  });

  it.each(['deadBEEF', 'addr_a', 'inv-20418'])(
    'searches tx hash, address and invoice id: %s',
    (search) => {
      expect(
        filterPayments(payments, { ...DEFAULT_FILTERS, search }),
      ).toHaveLength(1);
    },
  );

  it('does not mutate the input', () => {
    const copy = [...payments];
    filterPayments(payments, DEFAULT_FILTERS);
    expect(payments).toEqual(copy);
  });
});

describe('countByIssue', () => {
  it('ignores the issue filter but respects the others', () => {
    const counts = countByIssue(payments, {
      ...DEFAULT_FILTERS,
      issue: 'duplicate',
      network: 'ethereum',
    });
    expect(counts.all).toBe(2);
    expect(counts.duplicate).toBe(1);
    expect(counts.underpaid).toBe(1);
    expect(counts.overpaid).toBe(0);
  });
});

describe('hasActiveFilters', () => {
  it('is false for the defaults, even with whitespace-only search or reordered statuses', () => {
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, search: '   ' })).toBe(false);
    expect(
      hasActiveFilters({
        ...DEFAULT_FILTERS,
        statuses: ['escalated', 'open', 'in-review'],
      }),
    ).toBe(false);
  });

  it.each([
    { issue: 'duplicate' as const },
    { network: 'tron' as const },
    { statuses: ['open' as const] },
    { search: 'INV' },
  ])('is true when %o differs from the defaults', (patch) => {
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, ...patch })).toBe(true);
  });
});
