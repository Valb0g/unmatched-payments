import { describe, expect, it } from 'vitest';
import { TOKENS } from './catalog';
import { generatePayment } from './generator';
import { ISSUE_TYPES } from './payment';
import { createRng } from './random';

const NOW = new Date('2026-10-07T15:10:00Z');

describe('createRng', () => {
  it('is deterministic and stays within [0, 1)', () => {
    const a = createRng(5);
    const b = createRng(5);
    for (let i = 0; i < 100; i++) {
      const value = a();
      expect(value).toBe(b());
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('generatePayment', () => {
  it('is deterministic for the same seed', () => {
    expect(generatePayment(createRng(1), { now: NOW, sequence: 3 })).toEqual(
      generatePayment(createRng(1), { now: NOW, sequence: 3 }),
    );
  });

  it('derives id, invoice and timestamp from options', () => {
    const payment = generatePayment(createRng(1), {
      now: NOW,
      sequence: 7,
      issue: 'duplicate',
    });
    expect(payment.id).toBe('pay_live_7');
    expect(payment.receivedAt).toBe(NOW);
    expect(payment.suggestedMatch?.invoiceId).toBe('INV-20426');
    expect(payment.issue.note).toBe('INV-20426 already paid');
    expect(payment.status).toBe('open');
  });

  it('has no suggested match when no invoice is found', () => {
    expect(
      generatePayment(createRng(1), {
        now: NOW,
        sequence: 1,
        issue: 'no-invoice',
      }).suggestedMatch,
    ).toBeNull();
  });

  it('signs the difference for under- and overpayments', () => {
    expect(
      generatePayment(createRng(2), {
        now: NOW,
        sequence: 1,
        issue: 'underpaid',
      }).issue.note,
    ).toMatch(/^−.+\(−\d+\.\d{2}%\)$/);
    expect(
      generatePayment(createRng(2), {
        now: NOW,
        sequence: 1,
        issue: 'overpaid',
      }).issue.note,
    ).toMatch(/^\+.+\(\+\d+\.\d{2}%\)$/);
  });

  it('always produces positive amounts in the token precision and covers every issue', () => {
    const rng = createRng(99);
    const seen = new Set<string>();
    for (let sequence = 1; sequence <= 200; sequence++) {
      const payment = generatePayment(rng, { now: NOW, sequence });
      expect(payment.amount.minor > 0n).toBe(true);
      expect(payment.amount.decimals).toBe(TOKENS[payment.token].decimals);
      seen.add(payment.issue.type);
    }
    expect([...seen].sort()).toEqual([...ISSUE_TYPES].sort());
  });
});
