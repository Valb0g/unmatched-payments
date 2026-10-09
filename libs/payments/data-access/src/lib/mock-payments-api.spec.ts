import { TestBed } from '@angular/core/testing';
import { SEED_SIZE } from '@unmatched-payments/payments-domain';
import { map, take } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { CLOCK } from './clock';
import { MOCK_STREAM_CONFIG, MockPaymentsApi } from './mock-payments-api';

describe('MockPaymentsApi', () => {
  const now = new Date('2026-10-07T15:10:00Z');
  let scheduler: TestScheduler;
  let api: MockPaymentsApi;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: CLOCK, useValue: () => now },
        {
          provide: MOCK_STREAM_CONFIG,
          useValue: { seed: 1, intervalMs: 6_000, maxEvents: 3 },
        },
      ],
    });
    api = TestBed.inject(MockPaymentsApi);
    scheduler = new TestScheduler((actual, expected) =>
      expect(actual).toEqual(expected),
    );
  });

  it('lists the seed queue synchronously', () => {
    scheduler.run(({ expectObservable }) => {
      expectObservable(api.list().pipe(map((list) => list.length))).toBe(
        '(a|)',
        { a: SEED_SIZE },
      );
    });
  });

  it('streams one new payment per interval', () => {
    scheduler.run(({ expectObservable }) => {
      expectObservable(
        api.incoming$.pipe(
          take(2),
          map((p) => p.id),
        ),
      ).toBe('6000ms a 5999ms (b|)', {
        a: 'pay_live_1',
        b: 'pay_live_2',
      });
    });
  });

  it('stamps streamed payments with the clock time', () => {
    scheduler.run(({ expectObservable }) => {
      expectObservable(
        api.incoming$.pipe(
          take(1),
          map((p) => p.receivedAt),
        ),
      ).toBe('6000ms (a|)', { a: now });
    });
  });

  it('completes after maxEvents payments', () => {
    scheduler.run(({ expectObservable }) => {
      expectObservable(api.incoming$.pipe(map((p) => p.id))).toBe(
        '6000ms a 5999ms b 5999ms (c|)',
        { a: 'pay_live_1', b: 'pay_live_2', c: 'pay_live_3' },
      );
    });
  });
});
