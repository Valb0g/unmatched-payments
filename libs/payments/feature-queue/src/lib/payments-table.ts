import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowDown,
  lucideChevronLeft,
  lucideChevronRight,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import type { QueueRowVm } from './presentation';

@Component({
  selector: 'pay-payments-table',
  imports: [RouterLink, NgIcon, HlmButton],
  providers: [
    provideIcons({ lucideArrowDown, lucideChevronLeft, lucideChevronRight }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'block overflow-x-auto rounded-[10px] border border-border bg-card shadow-xs',
  },
  template: `
    <table class="w-full min-w-[1080px] border-collapse text-left">
      <caption class="sr-only">
        Unmatched payments, newest first
      </caption>
      <thead class="bg-subtle text-xs text-muted-foreground">
        <tr class="h-9 border-b border-border">
          <th scope="col" class="w-9 pl-3.5 font-medium">
            <input
              type="checkbox"
              class="m-0 accent-primary"
              aria-label="Select all payments on this page"
            />
          </th>
          <th scope="col" class="w-32 px-3 font-medium text-foreground">
            <span class="inline-flex items-center gap-1">
              Time (UTC)
              <ng-icon name="lucideArrowDown" size="12px" aria-hidden="true" />
            </span>
          </th>
          <th scope="col" class="w-44 px-3 text-right font-medium">
            Amount · network
          </th>
          <th scope="col" class="w-[150px] px-3 font-medium">From</th>
          <th scope="col" class="px-3 font-medium">Detected issue</th>
          <th scope="col" class="px-3 font-medium">Suggested match</th>
          <th scope="col" class="w-28 px-3 font-medium">Status</th>
          <th scope="col" class="w-10"><span class="sr-only">Open</span></th>
        </tr>
      </thead>
      <tbody>
        @for (row of rows(); track row.id) {
          <tr
            class="h-[52px] border-b border-border hover:bg-subtle"
            [class.row-arrived]="row.id === arrivedId()"
          >
            <td class="pl-3.5">
              <input
                type="checkbox"
                class="m-0 accent-primary"
                [attr.aria-label]="
                  'Select payment ' + row.amount + ' ' + row.token
                "
              />
            </td>
            <td class="px-3 py-1.5">
              <div class="flex flex-col">
                <span class="tabular font-mono">{{ row.time }}</span>
                <span
                  class="text-xs leading-4"
                  [class.text-warning]="row.ageBreached"
                  [class.text-muted-foreground]="!row.ageBreached"
                >
                  {{ row.age }} ago
                </span>
              </div>
            </td>
            <td class="px-3 py-1.5">
              <div class="flex flex-col items-end">
                <a
                  [routerLink]="['/payments', row.id]"
                  class="tabular font-mono font-medium whitespace-nowrap no-underline"
                >
                  {{ row.amount }}
                  <span class="font-normal text-muted-foreground">{{
                    row.token
                  }}</span>
                </a>
                <span
                  class="text-xs leading-4 whitespace-nowrap text-muted-foreground"
                >
                  {{ row.network }}
                </span>
              </div>
            </td>
            <td class="px-3 whitespace-nowrap">
              <span
                class="tabular font-mono text-foreground-subtle"
                [title]="row.fromFull"
              >
                {{ row.from }}
              </span>
            </td>
            <td class="px-3 py-1.5">
              <div class="flex flex-col items-start gap-0.5">
                <span
                  class="inline-flex h-[22px] items-center gap-1.5 rounded-md border border-border bg-muted px-2 text-xs font-medium whitespace-nowrap"
                >
                  <span
                    class="size-1.5 rounded-full"
                    [class]="row.issueDotClass"
                  ></span>
                  {{ row.issueLabel }}
                </span>
                <span
                  class="tabular font-mono text-xs leading-4 text-muted-foreground"
                >
                  {{ row.note }}
                </span>
              </div>
            </td>
            <td class="px-3">
              @if (row.match; as match) {
                <div class="flex items-center gap-2.5">
                  <span
                    class="tabular w-[84px] font-mono text-foreground-subtle"
                  >
                    {{ match.invoiceId }}
                  </span>
                  <span
                    class="block h-1 w-14 overflow-hidden rounded-sm bg-border"
                    aria-hidden="true"
                  >
                    <span
                      class="block h-1"
                      [class]="match.barClass"
                      [style.width]="match.confidence"
                    ></span>
                  </span>
                  <span class="tabular font-mono font-medium">{{
                    match.confidence
                  }}</span>
                </div>
              } @else {
                <span class="text-muted-foreground">No candidates</span>
              }
            </td>
            <td class="px-3">
              <span
                class="inline-flex h-[22px] items-center rounded-full border px-2 text-xs font-medium whitespace-nowrap"
                [class]="row.statusClass"
              >
                {{ row.statusLabel }}
              </span>
            </td>
            <td>
              <a
                [routerLink]="['/payments', row.id]"
                class="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                [attr.aria-label]="
                  'Open payment ' + row.amount + ' ' + row.token
                "
              >
                <ng-icon
                  name="lucideChevronRight"
                  size="16px"
                  aria-hidden="true"
                />
              </a>
            </td>
          </tr>
        } @empty {
          <tr>
            <td
              colspan="8"
              class="px-3.5 py-10 text-center text-muted-foreground"
            >
              No payments match these filters.
            </td>
          </tr>
        }
      </tbody>
    </table>
    <div
      class="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 text-muted-foreground"
    >
      <span>
        Rows per page
        <span
          class="tabular ml-1.5 rounded-md border border-border px-2 py-0.5 font-mono text-foreground"
        >
          25
        </span>
      </span>
      <div class="flex items-center gap-2">
        <span class="tabular font-mono"
          >Page {{ pageIndex() + 1 }} of {{ pageCount() }}</span
        >
        <button
          hlmBtn
          variant="outline"
          size="icon"
          class="size-[30px]"
          aria-label="Previous page"
          [disabled]="pageIndex() === 0"
          (click)="previousPage.emit()"
        >
          <ng-icon name="lucideChevronLeft" size="14px" aria-hidden="true" />
        </button>
        <button
          hlmBtn
          variant="outline"
          size="icon"
          class="size-[30px]"
          aria-label="Next page"
          [disabled]="pageIndex() >= pageCount() - 1"
          (click)="nextPage.emit()"
        >
          <ng-icon name="lucideChevronRight" size="14px" aria-hidden="true" />
        </button>
      </div>
    </div>
  `,
})
export class PaymentsTable {
  readonly rows = input.required<readonly QueueRowVm[]>();
  readonly arrivedId = input<string | null>(null);
  readonly pageIndex = input.required<number>();
  readonly pageCount = input.required<number>();
  readonly previousPage = output<void>();
  readonly nextPage = output<void>();
}
