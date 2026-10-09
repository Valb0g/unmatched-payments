import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  CLOCK,
  MockPaymentsApi,
} from '@unmatched-payments/payments-data-access';
import {
  createRng,
  createSeedPayments,
  generatePayment,
  type UnmatchedPayment,
} from '@unmatched-payments/payments-domain';
import { of, Subject } from 'rxjs';
import { QueuePage } from './queue-page';

const NOW = new Date('2026-10-07T15:10:00Z');

describe('QueuePage', () => {
  let incoming: Subject<UnmatchedPayment>;

  beforeEach(() => {
    incoming = new Subject<UnmatchedPayment>();
    const api: Pick<MockPaymentsApi, 'list' | 'incoming$'> = {
      list: () => of(createSeedPayments(NOW)),
      incoming$: incoming.asObservable(),
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: MockPaymentsApi, useValue: api },
        { provide: CLOCK, useValue: () => NOW },
      ],
    });
  });

  it('renders the seed queue and filters it by issue', async () => {
    const fixture = TestBed.createComponent(QueuePage);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelectorAll('tbody tr')).toHaveLength(14);

    const duplicateTab = [
      ...element.querySelectorAll<HTMLButtonElement>(
        '[aria-label="Issue type"] button',
      ),
    ].find((button) => button.textContent?.includes('Duplicate'));
    duplicateTab?.click();
    await fixture.whenStable();

    expect(element.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(duplicateTab?.getAttribute('aria-pressed')).toBe('true');
  });

  it('offers new payments behind a button and adds them on top when clicked', async () => {
    const fixture = TestBed.createComponent(QueuePage);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    incoming.next(generatePayment(createRng(1), { now: NOW, sequence: 1 }));
    incoming.next(generatePayment(createRng(2), { now: NOW, sequence: 2 }));
    await fixture.whenStable();

    expect(element.querySelectorAll('tbody tr')).toHaveLength(14);
    const pill = [...element.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('new payments'),
    );
    expect(pill?.textContent?.trim()).toBe('2 new payments');

    pill?.click();
    await fixture.whenStable();

    const rows = element.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(16);
    expect(rows[0]?.classList).toContain('row-arrived');
    expect(rows[2]?.classList).not.toContain('row-arrived');
    expect(element.textContent).not.toContain('new payments');
  });

  it('shows Reset only while a filter is active', async () => {
    const fixture = TestBed.createComponent(QueuePage);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const resetButton = () =>
      [...element.querySelectorAll('button')].find(
        (button) => button.textContent?.trim() === 'Reset',
      );

    expect(resetButton()).toBeUndefined();

    [
      ...element.querySelectorAll<HTMLButtonElement>(
        '[aria-label="Issue type"] button',
      ),
    ]
      .find((button) => button.textContent?.includes('Duplicate'))
      ?.click();
    await fixture.whenStable();
    expect(resetButton()).toBeDefined();

    resetButton()?.click();
    await fixture.whenStable();
    expect(resetButton()).toBeUndefined();
    expect(element.querySelectorAll('tbody tr')).toHaveLength(14);
  });
});
