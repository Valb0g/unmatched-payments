import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowUp, lucideDownload } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import {
  PAGE_SIZE,
  PaymentsStore,
} from '@unmatched-payments/payments-data-access';
import { IssueTabs } from './issue-tabs';
import { KpiStrip } from './kpi-strip';
import { PaymentsTable } from './payments-table';
import { toKpiTiles, toQueueRow } from './presentation';
import { QueueFilterBar } from './queue-filter-bar';

@Component({
  selector: 'pay-queue-page',
  imports: [
    HlmButton,
    NgIcon,
    KpiStrip,
    IssueTabs,
    QueueFilterBar,
    PaymentsTable,
  ],
  providers: [provideIcons({ lucideArrowUp, lucideDownload })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0 flex-col gap-4' },
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="flex flex-col gap-1">
        <h1 class="m-0 text-xl leading-7 font-semibold tracking-[-0.01em]">
          Unmatched payments
        </h1>
        <p class="m-0 text-muted-foreground">
          Incoming transfers the matcher couldn't tie to an invoice. Every
          action here moves money and is logged.
        </p>
      </div>
      <div class="flex gap-2">
        <button
          hlmBtn
          variant="outline"
          size="sm"
          disabled
          title="Available in the Actions stage"
        >
          <ng-icon name="lucideDownload" size="14px" aria-hidden="true" />
          Export CSV
        </button>
        <button
          hlmBtn
          variant="outline"
          size="sm"
          disabled
          title="Available in the Actions stage"
        >
          Tolerance rules
        </button>
      </div>
    </div>

    <pay-kpi-strip [tiles]="kpiTiles()" />

    <pay-issue-tabs
      [counts]="store.issueCounts()"
      [active]="store.filters().issue"
      (selected)="store.setIssue($event)"
    />

    <pay-queue-filter-bar
      [filters]="store.filters()"
      [shown]="rows().length"
      [total]="store.filtered().length"
      (networkChange)="store.setNetwork($event)"
      (statusesChange)="store.setStatuses($event)"
      (resetFilters)="store.resetFilters()"
    >
      <span aria-live="polite">
        @if (pendingLabel(); as label) {
          <button
            type="button"
            class="flex h-[30px] items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            (click)="store.showPending()"
          >
            <ng-icon name="lucideArrowUp" size="14px" aria-hidden="true" />
            {{ label }}
          </button>
        }
      </span>
    </pay-queue-filter-bar>

    <pay-payments-table
      [rows]="rows()"
      [arrivedIds]="store.arrivedIds()"
      [pageSize]="pageSize"
      [pageIndex]="store.pageIndex()"
      [pageCount]="store.pageCount()"
      (previousPage)="store.previousPage()"
      (nextPage)="store.nextPage()"
    />
  `,
})
export class QueuePage {
  protected readonly store = inject(PaymentsStore);
  protected readonly pageSize = PAGE_SIZE;

  protected readonly pendingLabel = computed(() => {
    const count = this.store.pendingCount();
    if (count === 0) {
      return null;
    }
    return count === 1 ? '1 new payment' : `${count} new payments`;
  });
  protected readonly kpiTiles = computed(() =>
    toKpiTiles(this.store.kpis(), this.store.now()),
  );
  protected readonly rows = computed(() =>
    this.store.pageRows().map((p) => toQueueRow(p, this.store.now())),
  );
}
