import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  computeKpis,
  countByIssue,
  DEFAULT_FILTERS,
  DEMO_OPERATOR,
  filterPayments,
  type IssueFilter,
  type NetworkFilter,
  type PaymentStatus,
  type QueueFilters,
  type UnmatchedPayment,
} from '@unmatched-payments/payments-domain';
import { interval, map, switchMap, tap } from 'rxjs';
import { CLOCK } from './clock';
import { MockPaymentsApi } from './mock-payments-api';

export const PAGE_SIZE = 25;
const NOW_TICK_MS = 30_000;

export type Connection = 'live' | 'offline';

@Injectable({ providedIn: 'root' })
export class PaymentsStore {
  private readonly api = inject(MockPaymentsApi);
  private readonly clock = inject(CLOCK);

  private readonly visibleState = signal<readonly UnmatchedPayment[]>([]);
  private readonly pendingState = signal<readonly UnmatchedPayment[]>([]);
  private readonly filtersState = signal<QueueFilters>(DEFAULT_FILTERS);
  private readonly pageState = signal(0);
  private readonly arrivedIdsState = signal<ReadonlySet<string>>(new Set());
  private readonly connectionState = signal<Connection>('live');

  readonly filters = this.filtersState.asReadonly();
  readonly arrivedIds = this.arrivedIdsState.asReadonly();
  readonly connection = this.connectionState.asReadonly();
  readonly now = toSignal(interval(NOW_TICK_MS).pipe(map(() => this.clock())), {
    initialValue: this.clock(),
  });

  readonly payments = computed(() => [
    ...this.pendingState(),
    ...this.visibleState(),
  ]);
  readonly pendingCount = computed(() => this.pendingState().length);
  readonly filtered = computed(() =>
    filterPayments(this.visibleState(), this.filtersState()),
  );
  readonly issueCounts = computed(() =>
    countByIssue(this.visibleState(), this.filtersState()),
  );
  readonly kpis = computed(() =>
    computeKpis(this.payments(), this.now(), DEMO_OPERATOR.id),
  );
  readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)),
  );
  readonly pageIndex = computed(() =>
    Math.min(this.pageState(), this.pageCount() - 1),
  );
  readonly pageRows = computed(() => {
    const start = this.pageIndex() * PAGE_SIZE;
    return this.filtered().slice(start, start + PAGE_SIZE);
  });

  constructor() {
    this.api
      .list()
      .pipe(
        tap((payments) => this.visibleState.set(payments)),
        switchMap(() => this.api.incoming$),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (payment) =>
          this.pendingState.update((list) => [payment, ...list]),
        error: (error: unknown) => {
          console.error('Payments stream failed', error);
          this.connectionState.set('offline');
        },
      });
  }

  setIssue(issue: IssueFilter): void {
    this.patchFilters({ issue });
  }

  setNetwork(network: NetworkFilter): void {
    this.patchFilters({ network });
  }

  setStatuses(statuses: readonly PaymentStatus[]): void {
    this.patchFilters({ statuses });
  }

  setSearch(search: string): void {
    this.patchFilters({ search });
  }

  resetFilters(): void {
    this.filtersState.set(DEFAULT_FILTERS);
    this.pageState.set(0);
  }

  nextPage(): void {
    this.pageState.set(Math.min(this.pageIndex() + 1, this.pageCount() - 1));
  }

  previousPage(): void {
    this.pageState.set(Math.max(this.pageIndex() - 1, 0));
  }

  showPending(): void {
    const pending = this.pendingState();
    this.visibleState.update((list) => [...pending, ...list]);
    this.arrivedIdsState.set(new Set(pending.map((payment) => payment.id)));
    this.pendingState.set([]);
    this.pageState.set(0);
  }

  private patchFilters(patch: Partial<QueueFilters>): void {
    this.filtersState.update((filters) => ({ ...filters, ...patch }));
    this.pageState.set(0);
  }
}
