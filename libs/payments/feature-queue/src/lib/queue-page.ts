import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideDownload } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { PaymentsStore } from '@unmatched-payments/payments-data-access';
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
  providers: [provideIcons({ lucideDownload })],
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
          aria-disabled="true"
          title="Available in the Actions stage"
        >
          <ng-icon name="lucideDownload" size="14px" aria-hidden="true" />
          Export CSV
        </button>
        <button
          hlmBtn
          variant="outline"
          size="sm"
          aria-disabled="true"
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
    />

    <pay-payments-table
      [rows]="rows()"
      [arrivedId]="store.lastArrivedId()"
      [pageIndex]="store.pageIndex()"
      [pageCount]="store.pageCount()"
      (previousPage)="store.previousPage()"
      (nextPage)="store.nextPage()"
    />
  `,
})
export class QueuePage {
  protected readonly store = inject(PaymentsStore);
  protected readonly kpiTiles = computed(() =>
    toKpiTiles(this.store.kpis(), this.store.now()),
  );
  protected readonly rows = computed(() =>
    this.store.pageRows().map((p) => toQueueRow(p, this.store.now())),
  );
}
