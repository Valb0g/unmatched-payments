import { describe, expect, it } from 'vitest';
import { formatMoney, formatUsd, parseMoney, toUsdCents } from './money';

describe('parseMoney', () => {
  it('parses grouped decimal strings into minor units', () => {
    expect(parseMoney('1,249.99', 6)).toEqual({
      minor: 1_249_990_000n,
      decimals: 6,
    });
  });

  it('pads missing fraction digits', () => {
    expect(parseMoney('15', 2)).toEqual({ minor: 1500n, decimals: 2 });
  });

  it('rejects more fraction digits than the token supports', () => {
    expect(() => parseMoney('0.123', 2)).toThrow('Invalid money amount');
  });

  it('rejects non-numeric input', () => {
    expect(() => parseMoney('12a', 2)).toThrow('Invalid money amount');
  });
});

describe('formatMoney', () => {
  it('groups thousands and keeps the requested precision', () => {
    expect(formatMoney({ minor: 3_450_000_000n, decimals: 6 }, 2)).toBe(
      '3,450.00',
    );
  });

  it('rounds half up when reducing precision', () => {
    expect(formatMoney({ minor: 1005n, decimals: 3 }, 2)).toBe('1.01');
  });

  it('formats negatives with a typographic minus', () => {
    expect(formatMoney({ minor: -150n, decimals: 2 }, 2)).toBe('−1.50');
  });

  it('supports zero fraction digits', () => {
    expect(formatMoney({ minor: 12_345n, decimals: 2 }, 0)).toBe('123');
  });

  it('rejects precision above the amount decimals', () => {
    expect(() => formatMoney({ minor: 1n, decimals: 2 }, 3)).toThrow();
  });
});

describe('usd conversion', () => {
  it('converts token minor units to USD cents', () => {
    expect(
      toUsdCents({ minor: 42_100_000_000_000_000n, decimals: 18 }, 245_000n),
    ).toBe(10_314n);
  });

  it('formats USD cents', () => {
    expect(formatUsd(3_821_460n)).toBe('$38,214.60');
  });
});
