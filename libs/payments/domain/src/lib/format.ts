import { TOKENS } from './catalog';
import { formatMoney } from './money';
import type { UnmatchedPayment } from './payment';

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
export const SLA_MS = 24 * HOUR_MS;

const timeFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

const dateTimeFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function formatAge(ms: number): string {
  if (ms < MINUTE_MS) {
    return '<1m';
  }
  const totalMinutes = Math.floor(ms / MINUTE_MS);
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }
  const totalHours = Math.floor(totalMinutes / 60);
  if (totalHours < 24) {
    return `${totalHours}h ${String(totalMinutes % 60).padStart(2, '0')}m`;
  }
  return `${Math.floor(totalHours / 24)}d ${totalHours % 24}h`;
}

export function isSlaBreached(receivedAt: Date, now: Date): boolean {
  return now.getTime() - receivedAt.getTime() > SLA_MS;
}

export function isSameUtcDay(a: Date, b: Date): boolean {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

export function formatReceivedAt(receivedAt: Date, now: Date): string {
  return isSameUtcDay(receivedAt, now)
    ? timeFormat.format(receivedAt)
    : dateTimeFormat.format(receivedAt);
}

export function shortenAddress(address: string): string {
  const head = address.startsWith('0x') ? 6 : 5;
  const tail = 4;
  if (address.length <= head + tail + 1) {
    return address;
  }
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

export function formatPaymentAmount(payment: UnmatchedPayment): string {
  return formatMoney(payment.amount, TOKENS[payment.token].displayDecimals);
}
