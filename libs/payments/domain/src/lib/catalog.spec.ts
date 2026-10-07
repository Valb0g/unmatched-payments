import { describe, expect, it } from 'vitest';
import { isNetworkId, networkLabel } from './catalog';
import { isPaymentStatus } from './payment';

describe('networkLabel', () => {
  it.each([
    ['tron', 'USDT', 'TRON · TRC-20'],
    ['ethereum', 'ETH', 'Ethereum'],
    ['ethereum', 'USDC', 'Ethereum · ERC-20'],
    ['polygon', 'USDC', 'Polygon PoS'],
    ['bitcoin', 'BTC', 'Bitcoin'],
    ['ton', 'USDT', 'TON · Jetton'],
  ] as const)('%s + %s → %s', (network, token, expected) => {
    expect(networkLabel(network, token)).toBe(expected);
  });
});

describe('type guards', () => {
  it('recognises network ids', () => {
    expect(isNetworkId('tron')).toBe(true);
    expect(isNetworkId('dogechain')).toBe(false);
    expect(isNetworkId(42)).toBe(false);
  });

  it('recognises payment statuses', () => {
    expect(isPaymentStatus('in-review')).toBe(true);
    expect(isPaymentStatus('closed')).toBe(false);
  });
});
