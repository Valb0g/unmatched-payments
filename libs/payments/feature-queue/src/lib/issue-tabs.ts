import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import {
  ISSUE_TYPES,
  type IssueCounts,
  type IssueFilter,
} from '@unmatched-payments/payments-domain';
import { ISSUE_TAB_LABELS } from './presentation';

const TAB_ORDER: readonly IssueFilter[] = ['all', ...ISSUE_TYPES];

@Component({
  selector: 'pay-issue-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block max-w-full self-start' },
  template: `
    <div
      role="group"
      aria-label="Issue type"
      class="flex flex-wrap gap-0.5 rounded-lg bg-muted p-[3px]"
    >
      @for (tab of tabs; track tab.value) {
        @let pressed = tab.value === active();
        <button
          type="button"
          class="flex h-7 items-center gap-1.5 rounded-md px-2.5 font-medium"
          [class.bg-card]="pressed"
          [class.shadow-xs]="pressed"
          [class.text-foreground]="pressed"
          [class.text-foreground-subtle]="!pressed"
          [attr.aria-pressed]="pressed"
          (click)="selected.emit(tab.value)"
        >
          {{ tab.label }}
          <span class="tabular font-mono text-[11px] text-muted-foreground">
            {{ counts()[tab.value] }}
          </span>
        </button>
      }
    </div>
  `,
})
export class IssueTabs {
  readonly counts = input.required<IssueCounts>();
  readonly active = input.required<IssueFilter>();
  readonly selected = output<IssueFilter>();

  protected readonly tabs = TAB_ORDER.map((value) => ({
    value,
    label: ISSUE_TAB_LABELS[value],
  }));
}
