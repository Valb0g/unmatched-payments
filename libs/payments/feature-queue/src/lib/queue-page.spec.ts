import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  CLOCK,
  MockPaymentsApi,
} from '@unmatched-payments/payments-data-access';
import { createSeedPayments } from '@unmatched-payments/payments-domain';
import { NEVER, of } from 'rxjs';
import { QueuePage } from './queue-page';

const NOW = new Date('2026-10-07T15:10:00Z');

describe('QueuePage', () => {
  beforeEach(() => {
    const api: Pick<MockPaymentsApi, 'list' | 'incoming$'> = {
      list: () => of(createSeedPayments(NOW)),
      incoming$: NEVER,
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
});
