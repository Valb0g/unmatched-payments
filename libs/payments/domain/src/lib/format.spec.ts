import { describe, expect, it } from 'vitest';
import {
  formatAge,
  formatReceivedAt,
  isSlaBreached,
  shortenAddress,
} from './format';

const MINUTE = 60_000;
const NOW = new Date('2026-10-07T15:10:00Z');

describe('formatAge', () => {
  it.each([
    [30_000, '<1m'],
    [18 * MINUTE, '18m'],
    [71 * MINUTE, '1h 11m'],
    [245 * MINUTE, '4h 05m'],
    [1830 * MINUTE, '1d 6h'],
    [4200 * MINUTE, '2d 22h'],
  ])('%i ms → %s', (ms, expected) => {
    expect(formatAge(ms)).toBe(expected);
  });
});

describe('isSlaBreached', () => {
  it('is false at exactly 24h and true after', () => {
    expect(isSlaBreached(new Date(NOW.getTime() - 24 * 60 * MINUTE), NOW)).toBe(
      false,
    );
    expect(
      isSlaBreached(new Date(NOW.getTime() - 24 * 60 * MINUTE - MINUTE), NOW),
    ).toBe(true);
  });
});

describe('formatReceivedAt', () => {
  it('shows time only for the same UTC day', () => {
    expect(formatReceivedAt(new Date('2026-10-07T14:52:08Z'), NOW)).toBe(
      '14:52:08',
    );
  });

  it('shows date and time for earlier days', () => {
    expect(formatReceivedAt(new Date('2026-10-06T23:18:00Z'), NOW)).toBe(
      'Oct 6, 23:18',
    );
  });
});

describe('shortenAddress', () => {
  it('keeps 5 head chars for non-EVM addresses', () => {
    expect(shortenAddress(`TJR7n${'x'.repeat(25)}Af7W`)).toBe('TJR7n…Af7W');
  });

  it('keeps 0x plus 4 chars for EVM addresses', () => {
    expect(shortenAddress(`0x7a3F${'0'.repeat(32)}9c21`)).toBe('0x7a3F…9c21');
  });

  it('leaves short strings intact', () => {
    expect(shortenAddress('abc')).toBe('abc');
  });
});
