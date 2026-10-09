import { inject, Injectable, InjectionToken } from '@angular/core';
import {
  createRng,
  createSeedPayments,
  generatePayment,
  intBetween,
  type UnmatchedPayment,
} from '@unmatched-payments/payments-domain';
import { concatMap, defer, map, type Observable, of, range, timer } from 'rxjs';
import { CLOCK } from './clock';

export interface MockStreamConfig {
  readonly seed: number;
  readonly minDelayMs: number;
  readonly maxDelayMs: number;
  // Bounds the demo stream so a tab left open does not grow the queue forever.
  readonly maxEvents: number;
}

export const MOCK_STREAM_CONFIG = new InjectionToken<MockStreamConfig>(
  'MOCK_STREAM_CONFIG',
  {
    providedIn: 'root',
    factory: () => ({
      seed: 2026,
      minDelayMs: 10_000,
      maxDelayMs: 20_000,
      maxEvents: 500,
    }),
  },
);

@Injectable({ providedIn: 'root' })
export class MockPaymentsApi {
  private readonly config = inject(MOCK_STREAM_CONFIG);
  private readonly clock = inject(CLOCK);

  readonly incoming$: Observable<UnmatchedPayment> = defer(() => {
    const { seed, minDelayMs, maxDelayMs, maxEvents } = this.config;
    const rng = createRng(seed);
    // Separate PRNG so the timing does not change which payments are generated.
    const delayRng = createRng(seed + 1);
    return range(1, maxEvents).pipe(
      concatMap((sequence) =>
        timer(intBetween(delayRng, minDelayMs, maxDelayMs)).pipe(
          map(() => generatePayment(rng, { now: this.clock(), sequence })),
        ),
      ),
    );
  });

  list(): Observable<UnmatchedPayment[]> {
    return defer(() => of(createSeedPayments(this.clock())));
  }
}
