import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { PaymentsStore } from '@unmatched-payments/payments-data-access';

@Component({
  selector: 'app-payment-detail-placeholder',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-3">
      <a routerLink="/payments/unmatched" class="text-muted-foreground"
        >← Back to queue</a
      >
      <h1 class="m-0 text-xl font-semibold">Payment detail</h1>
      @if (store.selected(); as payment) {
        <p class="m-0 font-mono break-all text-muted-foreground">
          {{ payment.txHash }}
        </p>
      } @else {
        <p class="m-0 text-muted-foreground">Payment not found.</p>
      }
      <p class="m-0 text-muted-foreground">
        Matching candidates and operator actions arrive in the next stage.
      </p>
    </div>
  `,
})
export class PaymentDetailPlaceholder {
  protected readonly store = inject(PaymentsStore);
  readonly id = input.required<string>();

  constructor() {
    effect(() => this.store.select(this.id()));
  }
}
