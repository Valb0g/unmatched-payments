import { addressWithEnds, randomTxHash } from './addresses';
import { TOKENS, type NetworkId, type TokenSymbol } from './catalog';
import { parseMoney } from './money';
import { DEMO_OPERATOR } from './operator';
import type { IssueType, PaymentStatus, UnmatchedPayment } from './payment';
import { createRng } from './random';

interface SeedRow {
  readonly minutesAgo: number;
  readonly amount: string;
  readonly token: TokenSymbol;
  readonly network: NetworkId;
  readonly from: readonly [head: string, tail: string];
  readonly issue: IssueType;
  readonly note: string;
  readonly match: readonly [invoiceId: string, confidence: number] | null;
  readonly status: PaymentStatus;
  readonly assigned: boolean;
}

const SEED_RNG = 7;

// Mirrors the 14 rows of the "Queue" artboard.
// prettier-ignore
const SEED_ROWS: readonly SeedRow[] = [
  { minutesAgo: 18, amount: '248.50', token: 'USDT', network: 'tron', from: ['TJR7n', 'Af7W'], issue: 'underpaid', note: '−1.50 USDT (−0.60%)', match: ['INV-20418', 96], status: 'open', assigned: false },
  { minutesAgo: 22, amount: '1,000.00', token: 'USDC', network: 'polygon', from: ['0x7a3F', '9c21'], issue: 'wrong-network', note: 'invoice expects Ethereum', match: ['INV-20415', 91], status: 'open', assigned: true },
  { minutesAgo: 31, amount: '0.042100', token: 'ETH', network: 'ethereum', from: ['0x1bE0', 'aa47'], issue: 'overpaid', note: '+0.003100 ETH (+7.95%)', match: ['INV-20409', 88], status: 'open', assigned: false },
  { minutesAgo: 48, amount: '500.00', token: 'USDC', network: 'ethereum', from: ['0xC4d2', '03Fe'], issue: 'wrong-token', note: 'invoice expects USDT', match: ['INV-20401', 83], status: 'in-review', assigned: true },
  { minutesAgo: 71, amount: '75.00', token: 'USDT', network: 'tron', from: ['TXm4q', 'Lq9z'], issue: 'no-invoice', note: 'deposit address unassigned', match: null, status: 'open', assigned: false },
  { minutesAgo: 86, amount: '1,249.99', token: 'USDT', network: 'tron', from: ['TBc8y', 'n2Rk'], issue: 'expired-invoice', note: 'paid 4m after expiry', match: ['INV-20388', 94], status: 'in-review', assigned: true },
  { minutesAgo: 100, amount: '320.00', token: 'USDT', network: 'bnb', from: ['0x9E21', '7bD0'], issue: 'duplicate', note: 'INV-20371 already paid', match: ['INV-20371', 99], status: 'open', assigned: false },
  { minutesAgo: 177, amount: '0.00318', token: 'BTC', network: 'bitcoin', from: ['bc1qx', '7h2m'], issue: 'underpaid', note: '−0.00009 BTC (−2.75%)', match: ['INV-20352', 72], status: 'escalated', assigned: true },
  { minutesAgo: 245, amount: '2,000.00', token: 'USDT', network: 'ethereum', from: ['0x44aC', 'E19f'], issue: 'wrong-network', note: 'invoice expects TRC-20', match: ['INV-20344', 85], status: 'in-review', assigned: false },
  { minutesAgo: 322, amount: '89.90', token: 'USDC', network: 'solana', from: ['7xKXt', 'sAsU'], issue: 'expired-invoice', note: 'paid 22m after expiry', match: ['INV-20327', 90], status: 'open', assigned: false },
  { minutesAgo: 951, amount: '15.00', token: 'USDT', network: 'tron', from: ['TLp2w', 'Zq3e'], issue: 'no-invoice', note: 'old address, rotated Sep 30', match: null, status: 'open', assigned: false },
  { minutesAgo: 1087, amount: '610.00', token: 'USDT', network: 'arbitrum', from: ['0x2Fb7', 'C8a1'], issue: 'overpaid', note: '+10.00 USDT (+1.67%)', match: ['INV-20298', 81], status: 'open', assigned: true },
  { minutesAgo: 1830, amount: '1,500.00', token: 'USDT', network: 'ton', from: ['UQBv5', 'k9Tt'], issue: 'duplicate', note: 'INV-20240 already paid', match: ['INV-20240', 97], status: 'escalated', assigned: false },
  { minutesAgo: 4200, amount: '3,450.00', token: 'USDT', network: 'tron', from: ['TQk3d', 'V8mP'], issue: 'underpaid', note: '−150.00 USDT (−4.17%)', match: ['INV-20117', 64], status: 'escalated', assigned: true },
];

export const SEED_SIZE = SEED_ROWS.length;

export function createSeedPayments(now: Date): UnmatchedPayment[] {
  const rng = createRng(SEED_RNG);
  return SEED_ROWS.map((row, index) => ({
    id: `pay_seed_${String(index + 1).padStart(2, '0')}`,
    txHash: randomTxHash(rng, row.network),
    receivedAt: new Date(now.getTime() - row.minutesAgo * 60_000),
    amount: parseMoney(row.amount, TOKENS[row.token].decimals),
    token: row.token,
    network: row.network,
    fromAddress: addressWithEnds(rng, row.network, row.from[0], row.from[1]),
    issue: { type: row.issue, note: row.note },
    suggestedMatch: row.match
      ? { invoiceId: row.match[0], confidence: row.match[1] }
      : null,
    status: row.status,
    assigneeId: row.assigned ? DEMO_OPERATOR.id : null,
  }));
}
