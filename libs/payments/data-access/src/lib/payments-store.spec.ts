import { TestBed } from '@angular/core/testing';
import {
  createRng,
  createSeedPayments,
  generatePayment,
  SEED_SIZE,
  type UnmatchedPayment,
} from '@unmatched-payments/payments-domain';
import { of, Subject } from 'rxjs';
import { CLOCK } from './clock';
import { MockPaymentsApi } from './mock-payments-api';
import { PAGE_SIZE, PaymentsStore } from './payments-store';

const NOW = new Date('2026-10-07T15:10:00Z');

function setup(initial: UnmatchedPayment[] = createSeedPayments(NOW)) {
  const incoming = new Subject<UnmatchedPayment>();
  const api: Pick<MockPaymentsApi, 'list' | 'incoming$'> = {
    list: () => of(initial),
    incoming$: incoming.asObservable(),
  };
  TestBed.configureTestingModule({
    providers: [
      { provide: MockPaymentsApi, useValue: api },
      { provide: CLOCK, useValue: () => NOW },
    ],
  });
  return { store: TestBed.inject(PaymentsStore), incoming };
}

function manyPayments(count: number): UnmatchedPayment[] {
  return Array.from({ length: count }, (_, i) =>
    generatePayment(createRng(i + 1), {
      now: NOW,
      sequence: i + 1,
      issue: i % 2 === 0 ? 'underpaid' : 'duplicate',
    }),
  );
}

function liveArrival(sequence = 99): UnmatchedPayment {
  return generatePayment(createRng(sequence), { now: NOW, sequence });
}

describe('PaymentsStore', () => {
  it('loads the initial queue newest first', () => {
    const { store } = setup();
    expect(store.filtered()).toHaveLength(SEED_SIZE);
    expect(store.filtered()[0]?.id).toBe('pay_seed_01');
    expect(store.connection()).toBe('live');
  });

  it('holds streamed payments out of the table but counts them in kpis', () => {
    const { store, incoming } = setup();
    incoming.next(liveArrival(1));
    incoming.next(liveArrival(2));

    expect(store.filtered()).toHaveLength(SEED_SIZE);
    expect(store.issueCounts().all).toBe(SEED_SIZE);
    expect(store.pendingCount()).toBe(2);
    expect(store.kpis().unmatchedCount).toBe(SEED_SIZE + 2);
  });

  it('reveals held payments on top, marks them and returns to the first page', () => {
    const { store, incoming } = setup(manyPayments(30));
    store.nextPage();
    incoming.next(liveArrival(98));
    incoming.next(liveArrival(99));

    store.showPending();

    expect(store.pageIndex()).toBe(0);
    expect(store.pendingCount()).toBe(0);
    expect(
      store
        .filtered()
        .slice(0, 2)
        .map((p) => p.id),
    ).toEqual(['pay_live_99', 'pay_live_98']);
    expect([...store.arrivedIds()]).toEqual(['pay_live_99', 'pay_live_98']);
  });

  it('keeps the current page stable while payments arrive', () => {
    const { store, incoming } = setup(manyPayments(30));
    store.nextPage();
    const rowsBefore = store.pageRows().map((p) => p.id);

    incoming.next(liveArrival());

    expect(store.pageIndex()).toBe(1);
    expect(store.pageRows().map((p) => p.id)).toEqual(rowsBefore);
  });

  it('pages rows by PAGE_SIZE and clamps navigation', () => {
    const { store } = setup(manyPayments(30));
    expect(store.pageRows()).toHaveLength(PAGE_SIZE);
    expect(store.pageCount()).toBe(2);
    store.nextPage();
    store.nextPage();
    expect(store.pageIndex()).toBe(1);
    expect(store.pageRows()).toHaveLength(5);
    store.previousPage();
    store.previousPage();
    expect(store.pageIndex()).toBe(0);
  });

  it('narrows by issue and resets to the first page', () => {
    const { store } = setup(manyPayments(30));
    store.nextPage();
    store.setIssue('duplicate');
    expect(store.pageIndex()).toBe(0);
    expect(store.filtered()).toHaveLength(15);
    expect(store.filtered().every((p) => p.issue.type === 'duplicate')).toBe(
      true,
    );
  });

  it('restores defaults on reset', () => {
    const { store } = setup();
    store.setNetwork('tron');
    store.setSearch('INV');
    store.resetFilters();
    expect(store.filtered()).toHaveLength(SEED_SIZE);
  });

  it('exposes every payment, held ones included, for lookups by id', () => {
    const { store, incoming } = setup();
    incoming.next(liveArrival());
    const ids = store.payments().map((p) => p.id);
    expect(ids).toContain('pay_seed_02');
    expect(ids).toContain('pay_live_99');
  });

  it('goes offline when the stream fails', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { store, incoming } = setup();
    incoming.error(new Error('socket closed'));
    expect(store.connection()).toBe('offline');
  });
});
