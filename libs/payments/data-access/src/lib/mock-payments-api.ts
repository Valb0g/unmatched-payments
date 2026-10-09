import { inject, Injectable, InjectionToken } from '@angular/core';
import {
  createRng,
  createSeedPayments,
  generatePayment,
  type UnmatchedPayment,
} from '@unmatched-payments/payments-domain';
import { defer, interval, map, type Observable, of, take } from 'rxjs';
import { CLOCK } from './clock';

export interface MockStreamConfig {
  readonly seed: number;
  readonly intervalMs: number;
  // Bounds the demo stream so a tab left open does not grow the queue forever.
  readonly maxEvents: number;
}

export const MOCK_STREAM_CONFIG = new InjectionToken<MockStreamConfig>(
  'MOCK_STREAM_CONFIG',
  {
    providedIn: 'root',
    factory: () => ({ seed: 2026, intervalMs: 18_000, maxEvents: 500 }),
  },
);

@Injectable({ providedIn: 'root' })
export class MockPaymentsApi {
  private readonly config = inject(MOCK_STREAM_CONFIG);
  private readonly clock = inject(CLOCK);

  readonly incoming$: Observable<UnmatchedPayment> = defer(() => {
    const rng = createRng(this.config.seed);
    return interval(this.config.intervalMs).pipe(
      take(this.config.maxEvents),
      map((tick) =>
        generatePayment(rng, { now: this.clock(), sequence: tick + 1 }),
      ),
    );
  });

  list(): Observable<UnmatchedPayment[]> {
    return defer(() => of(createSeedPayments(this.clock())));
  }
}
