export interface Money {
  readonly minor: bigint;
  readonly decimals: number;
}

const AMOUNT_PATTERN = /^(\d+)(?:\.(\d+))?$/;
const MINUS = '−';

export function parseMoney(value: string, decimals: number): Money {
  const match = AMOUNT_PATTERN.exec(value.replaceAll(',', ''));
  const whole = match?.[1];
  const fraction = match?.[2] ?? '';
  if (!whole || fraction.length > decimals) {
    throw new Error(`Invalid money amount: ${value}`);
  }
  return { minor: BigInt(whole + fraction.padEnd(decimals, '0')), decimals };
}

export function formatMoney(money: Money, fractionDigits: number): string {
  if (fractionDigits > money.decimals) {
    throw new Error(
      `Cannot format ${money.decimals}-decimal amount with ${fractionDigits} digits`,
    );
  }
  const negative = money.minor < 0n;
  const abs = negative ? -money.minor : money.minor;
  const scale = 10n ** BigInt(money.decimals - fractionDigits);
  const rounded = (abs + scale / 2n) / scale;
  const unit = 10n ** BigInt(fractionDigits);
  const whole = groupThousands((rounded / unit).toString());
  const fraction = (rounded % unit).toString().padStart(fractionDigits, '0');
  const body = fractionDigits > 0 ? `${whole}.${fraction}` : whole;
  return negative ? `${MINUS}${body}` : body;
}

export function toUsdCents(money: Money, usdRateCents: bigint): bigint {
  return (money.minor * usdRateCents) / 10n ** BigInt(money.decimals);
}

export function formatUsd(cents: bigint): string {
  return `$${formatMoney({ minor: cents, decimals: 2 }, 2)}`;
}

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
