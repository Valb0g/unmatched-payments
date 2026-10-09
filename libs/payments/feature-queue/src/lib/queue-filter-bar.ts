import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCalendar } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import {
  isNetworkId,
  isPaymentStatus,
  NETWORK_IDS,
  NETWORKS,
  type NetworkFilter,
  PAYMENT_STATUSES,
  type PaymentStatus,
  type QueueFilters,
  STATUS_LABELS,
} from '@unmatched-payments/payments-domain';

@Component({
  selector: 'pay-queue-filter-bar',
  imports: [HlmSelectImports, HlmButton, NgIcon],
  providers: [provideIcons({ lucideCalendar })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-wrap items-center gap-2' },
  template: `
    <hlm-select
      class="inline-block"
      [value]="filters().network"
      (valueChange)="onNetworkChange($event)"
    >
      <hlm-select-trigger size="sm" class="data-[size=sm]:h-[30px]">
        <span class="text-muted-foreground">Network</span>
        <span class="font-medium">{{ networkLabel() }}</span>
      </hlm-select-trigger>
      <hlm-select-content *hlmSelectPortal>
        <hlm-select-item value="all">All</hlm-select-item>
        @for (network of networks; track network.id) {
          <hlm-select-item [value]="network.id">{{
            network.name
          }}</hlm-select-item>
        }
      </hlm-select-content>
    </hlm-select>

    <hlm-select-multiple
      class="inline-block"
      [value]="selectedStatuses()"
      (valueChange)="onStatusesChange($event)"
    >
      <hlm-select-trigger size="sm" class="data-[size=sm]:h-[30px]">
        <span class="text-muted-foreground">Status</span>
        <span class="font-medium">{{ statusesLabel() }}</span>
      </hlm-select-trigger>
      <hlm-select-content *hlmSelectPortal>
        @for (status of statuses; track status.value) {
          <hlm-select-item [value]="status.value">{{
            status.label
          }}</hlm-select-item>
        }
      </hlm-select-content>
    </hlm-select-multiple>

    <button
      hlmBtn
      variant="outline"
      size="sm"
      class="h-[30px]"
      aria-disabled="true"
      title="Available in the Actions stage"
    >
      <ng-icon name="lucideCalendar" size="14px" aria-hidden="true" />
      Last 7 days
    </button>
    <button
      hlmBtn
      variant="outline"
      size="sm"
      class="h-[30px] border-dashed"
      aria-disabled="true"
      title="Available in the Actions stage"
    >
      <span class="text-muted-foreground">Assignee</span>
      Anyone
    </button>
    <button
      hlmBtn
      variant="ghost"
      size="sm"
      class="h-[30px] text-muted-foreground"
      (click)="resetFilters.emit()"
    >
      Reset
    </button>

    <span class="ml-auto text-muted-foreground">
      Showing
      <span class="tabular font-mono text-foreground">{{ shown() }}</span> of
      <span class="tabular font-mono text-foreground">{{ total() }}</span> ·
      newest first
    </span>
  `,
})
export class QueueFilterBar {
  readonly filters = input.required<QueueFilters>();
  readonly shown = input.required<number>();
  readonly total = input.required<number>();
  readonly networkChange = output<NetworkFilter>();
  readonly statusesChange = output<PaymentStatus[]>();
  readonly resetFilters = output<void>();

  protected readonly networks = NETWORK_IDS.map((id) => NETWORKS[id]);
  protected readonly statuses = PAYMENT_STATUSES.map((value) => ({
    value,
    label: STATUS_LABELS[value],
  }));

  protected readonly networkLabel = computed(() => {
    const network = this.filters().network;
    return network === 'all' ? 'All' : NETWORKS[network].name;
  });

  protected readonly selectedStatuses = computed(() => [
    ...this.filters().statuses,
  ]);

  protected readonly statusesLabel = computed(() => {
    const selected = this.filters().statuses;
    if (selected.length === PAYMENT_STATUSES.length) {
      return 'All';
    }
    return selected.length === 0
      ? 'None'
      : selected.map((s) => STATUS_LABELS[s]).join(', ');
  });

  protected onNetworkChange(value: unknown): void {
    if (value === 'all' || isNetworkId(value)) {
      this.networkChange.emit(value);
    }
  }

  protected onStatusesChange(value: unknown): void {
    this.statusesChange.emit(
      Array.isArray(value) ? value.filter(isPaymentStatus) : [],
    );
  }
}
