import {
  computeKpis,
  createSeedPayments,
} from '@unmatched-payments/payments-domain';
import { toKpiTiles, toQueueRow } from './presentation';

const NOW = new Date('2026-10-07T15:10:00Z');
const seed = createSeedPayments(NOW);

describe('toQueueRow', () => {
  it('maps a payment to table cells', () => {
    expect(toQueueRow(seed[0], NOW)).toMatchObject({
      id: 'pay_seed_01',
      time: '14:52:00',
      age: '18m',
      ageBreached: false,
      amount: '248.50',
      token: 'USDT',
      network: 'TRON · TRC-20',
      from: 'TJR7n…Af7W',
      issueLabel: 'Underpaid',
      note: '−1.50 USDT (−0.60%)',
      statusLabel: 'Open',
      match: { invoiceId: 'INV-20418', confidence: '96%' },
    });
  });

  it('flags SLA breaches and missing matches', () => {
    expect(toQueueRow(seed[13], NOW).ageBreached).toBe(true);
    expect(toQueueRow(seed[4], NOW).match).toBeNull();
  });
});

describe('toKpiTiles', () => {
  it('summarises the queue and warns about the oldest payment', () => {
    const tiles = toKpiTiles(computeKpis(seed, NOW, 'op_marta'), NOW);
    expect(tiles.map((t) => t.value)).toEqual([
      '14',
      expect.stringMatching(/^\$/),
      '2d 22h',
      '6',
    ]);
    expect(tiles[0]?.hint).toBe('+10 today');
    expect(tiles[2]).toMatchObject({
      warning: true,
      hint: '3,450.00 USDT · past 24h SLA',
    });
  });
});
