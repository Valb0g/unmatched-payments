import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowDownLeft,
  lucideArrowUpRight,
  lucideFileText,
  lucideHistory,
  lucideLayoutDashboard,
  lucideSlidersVertical,
  lucideStore,
  lucideUndo2,
  lucideUnlink,
} from '@ng-icons/lucide';
import { PaymentsStore } from '@unmatched-payments/payments-data-access';
import { DEMO_OPERATOR } from '@unmatched-payments/payments-domain';

interface NavItem {
  readonly label: string;
  readonly icon: string;
  readonly link?: string;
}

interface NavSection {
  readonly title: string;
  readonly items: readonly NavItem[];
}

const NAV: readonly NavSection[] = [
  {
    title: 'PAYMENTS',
    items: [
      { label: 'Overview', icon: 'lucideLayoutDashboard' },
      { label: 'Incoming', icon: 'lucideArrowDownLeft' },
      { label: 'Invoices', icon: 'lucideFileText' },
      { label: 'Unmatched', icon: 'lucideUnlink', link: '/payments/unmatched' },
      { label: 'Refunds', icon: 'lucideUndo2' },
      { label: 'Payouts', icon: 'lucideArrowUpRight' },
    ],
  },
  {
    title: 'ADMIN',
    items: [
      { label: 'Merchants', icon: 'lucideStore' },
      { label: 'Audit log', icon: 'lucideHistory' },
      { label: 'Matching rules', icon: 'lucideSlidersVertical' },
    ],
  },
];

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, NgIcon],
  providers: [
    provideIcons({
      lucideArrowDownLeft,
      lucideArrowUpRight,
      lucideFileText,
      lucideHistory,
      lucideLayoutDashboard,
      lucideSlidersVertical,
      lucideStore,
      lucideUndo2,
      lucideUnlink,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'flex grow basis-[232px] flex-col gap-4 border-r border-border bg-subtle px-2.5 py-3',
  },
  template: `
    <div class="flex items-center gap-2.5 px-1.5 py-1">
      <div
        class="flex size-[26px] items-center justify-center rounded-[7px] bg-primary"
        aria-hidden="true"
      >
        <svg width="16" height="16" viewBox="0 0 24 24">
          <rect
            x="2.5"
            y="2.5"
            width="12"
            height="12"
            rx="3.5"
            fill="#ffffff"
            fill-opacity="0.5"
          />
          <rect
            x="9.5"
            y="9.5"
            width="12"
            height="12"
            rx="3.5"
            fill="#ffffff"
          />
        </svg>
      </div>
      <div class="flex flex-col leading-4">
        <span class="font-semibold">Payments Ops</span>
        <span class="text-xs text-muted-foreground">Operator console</span>
      </div>
      <span
        class="ml-auto rounded-[5px] border border-border px-1.5 font-mono text-[11px]"
        [class.text-muted-foreground]="isLive()"
        [class.text-destructive]="!isLive()"
      >
        {{ isLive() ? 'LIVE' : 'OFFLINE' }}
      </span>
    </div>

    <nav aria-label="Main" class="flex flex-col gap-0.5">
      @for (section of nav; track section.title) {
        <span
          class="px-2 pt-3 pb-1 text-[11px] font-medium tracking-[0.02em] text-muted-foreground first:pt-1.5"
        >
          {{ section.title }}
        </span>
        @for (item of section.items; track item.label) {
          @if (item.link) {
            <a
              [routerLink]="item.link"
              routerLinkActive="bg-muted font-medium !text-foreground"
              ariaCurrentWhenActive="page"
              class="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-foreground-subtle no-underline hover:bg-muted hover:text-foreground"
            >
              <ng-icon [name]="item.icon" size="16px" aria-hidden="true" />
              {{ item.label }}
              <span
                class="tabular ml-auto rounded-[5px] bg-primary px-1.5 font-mono text-[11px] leading-[18px] text-primary-foreground"
              >
                {{ unmatchedCount() }}
              </span>
            </a>
          } @else {
            <span
              aria-disabled="true"
              title="Not part of this demo"
              class="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-foreground-subtle"
            >
              <ng-icon [name]="item.icon" size="16px" aria-hidden="true" />
              {{ item.label }}
            </span>
          }
        }
      }
    </nav>

    <div class="mt-auto flex items-center gap-2.5 border-t border-border p-2">
      <div
        class="flex size-7 items-center justify-center rounded-full bg-border text-[11px] font-semibold text-foreground-subtle"
        aria-hidden="true"
      >
        {{ operator.initials }}
      </div>
      <div class="flex min-w-0 flex-col leading-4">
        <span class="font-medium">{{ operator.name }}</span>
        <span class="text-xs text-muted-foreground">{{ operator.role }}</span>
      </div>
    </div>
  `,
})
export class Sidebar {
  private readonly store = inject(PaymentsStore);

  protected readonly nav = NAV;
  protected readonly operator = DEMO_OPERATOR;
  protected readonly isLive = computed(
    () => this.store.connection() === 'live',
  );
  protected readonly unmatchedCount = computed(
    () => this.store.kpis().unmatchedCount,
  );
}
