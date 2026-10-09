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

  private readonly paymentsState = signal<readonly UnmatchedPayment[]>([]);
  private readonly filtersState = signal<QueueFilters>(DEFAULT_FILTERS);
  private readonly pageState = signal(0);
  private readonly selectedIdState = signal<string | null>(null);
  private readonly lastArrivedIdState = signal<string | null>(null);
  private readonly connectionState = signal<Connection>('live');

  readonly filters = this.filtersState.asReadonly();
  readonly lastArrivedId = this.lastArrivedIdState.asReadonly();
  readonly connection = this.connectionState.asReadonly();
  readonly now = toSignal(interval(NOW_TICK_MS).pipe(map(() => this.clock())), {
    initialValue: this.clock(),
  });

  readonly filtered = computed(() =>
    filterPayments(this.paymentsState(), this.filtersState()),
  );
  readonly issueCounts = computed(() =>
    countByIssue(this.paymentsState(), this.filtersState()),
  );
  readonly kpis = computed(() =>
    computeKpis(this.paymentsState(), this.now(), DEMO_OPERATOR.id),
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
  readonly selected = computed(
    () =>
      this.paymentsState().find(
        (payment) => payment.id === this.selectedIdState(),
      ) ?? null,
  );

  constructor() {
    this.api
      .list()
      .pipe(
        tap((payments) => this.paymentsState.set(payments)),
        switchMap(() => this.api.incoming$),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (payment) => {
          this.paymentsState.update((list) => [payment, ...list]);
          this.lastArrivedIdState.set(payment.id);
        },
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

  select(id: string | null): void {
    this.selectedIdState.set(id);
  }

  private patchFilters(patch: Partial<QueueFilters>): void {
    this.filtersState.update((filters) => ({ ...filters, ...patch }));
    this.pageState.set(0);
  }
}
