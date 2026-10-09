import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { KpiTileVm } from './presentation';

@Component({
  selector: 'pay-kpi-strip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-wrap gap-2' },
  template: `
    @for (tile of tiles(); track tile.label) {
      <div
        class="flex items-baseline gap-2.5 rounded-lg border px-3 py-2"
        [class.border-border]="!tile.warning"
        [class.bg-card]="!tile.warning"
        [class.border-warning-border]="tile.warning"
        [class.bg-warning-soft]="tile.warning"
        [class.text-warning]="tile.warning"
      >
        <span [class.text-muted-foreground]="!tile.warning">{{
          tile.label
        }}</span>
        <span class="tabular font-mono text-base font-semibold">{{
          tile.value
        }}</span>
        @if (tile.hint) {
          <span
            class="tabular font-mono text-xs"
            [class.text-muted-foreground]="!tile.warning"
          >
            {{ tile.hint }}
          </span>
        }
      </div>
    }
  `,
})
export class KpiStrip {
  readonly tiles = input.required<readonly KpiTileVm[]>();
}
