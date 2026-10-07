import { randomAddress, randomTxHash } from './addresses';
import { NETWORKS, TOKENS, type NetworkId, type TokenSymbol } from './catalog';
import { formatMoney } from './money';
import { ISSUE_TYPES, type IssueType, type UnmatchedPayment } from './payment';
import { intBetween, pick, type Rng } from './random';

interface Route {
  readonly network: NetworkId;
  readonly token: TokenSymbol;
}

// TRON listed twice: USDT on TRC-20 dominates real crypto-acquiring traffic.
const ROUTES: readonly Route[] = [
  { network: 'tron', token: 'USDT' },
  { network: 'tron', token: 'USDT' },
  { network: 'ethereum', token: 'USDT' },
  { network: 'ethereum', token: 'USDC' },
  { network: 'ethereum', token: 'ETH' },
  { network: 'polygon', token: 'USDC' },
  { network: 'bnb', token: 'USDT' },
  { network: 'arbitrum', token: 'USDT' },
  { network: 'solana', token: 'USDC' },
  { network: 'ton', token: 'USDT' },
  { network: 'bitcoin', token: 'BTC' },
];

const STABLECOIN_NETWORKS: readonly NetworkId[] = [
  'tron',
  'ethereum',
  'bnb',
  'polygon',
];

// Invoice ranges in display units (10^displayDecimals).
const INVOICE_RANGES: Readonly<Record<TokenSymbol, readonly [number, number]>> =
  {
    USDT: [10_00, 3_500_00],
    USDC: [10_00, 3_500_00],
    ETH: [10_000, 600_000],
    BTC: [50, 3_000],
  };

const INVOICE_BASE = 20_419;

export interface GenerateOptions {
  readonly now: Date;
  readonly sequence: number;
  readonly issue?: IssueType;
}

interface IssueOutcome {
  readonly paidDisplayMinor: bigint;
  readonly note: string;
}

export function generatePayment(
  rng: Rng,
  options: GenerateOptions,
): UnmatchedPayment {
  const issueType = options.issue ?? pick(rng, ISSUE_TYPES);
  const route = pick(rng, ROUTES);
  const token = TOKENS[route.token];
  const [min, max] = INVOICE_RANGES[route.token];
  const invoiceDisplayMinor = BigInt(intBetween(rng, min, max));
  const invoiceId = `INV-${INVOICE_BASE + options.sequence}`;
  const outcome = describeIssue(
    rng,
    issueType,
    invoiceDisplayMinor,
    route,
    invoiceId,
  );
  const displayToMinor = 10n ** BigInt(token.decimals - token.displayDecimals);

  return {
    id: `pay_live_${options.sequence}`,
    txHash: randomTxHash(rng, route.network),
    receivedAt: options.now,
    amount: {
      minor: outcome.paidDisplayMinor * displayToMinor,
      decimals: token.decimals,
    },
    token: route.token,
    network: route.network,
    fromAddress: randomAddress(rng, route.network),
    issue: { type: issueType, note: outcome.note },
    suggestedMatch:
      issueType === 'no-invoice'
        ? null
        : { invoiceId, confidence: intBetween(rng, 60, 99) },
    status: 'open',
    assigneeId: null,
  };
}

function describeIssue(
  rng: Rng,
  type: IssueType,
  invoice: bigint,
  route: Route,
  invoiceId: string,
): IssueOutcome {
  switch (type) {
    case 'underpaid':
    case 'overpaid':
      return describeAmountMismatch(rng, type, invoice, route.token);
    case 'wrong-network': {
      const expected = pick(
        rng,
        STABLECOIN_NETWORKS.filter((network) => network !== route.network),
      );
      return {
        paidDisplayMinor: invoice,
        note: `invoice expects ${NETWORKS[expected].name}`,
      };
    }
    case 'wrong-token':
      return {
        paidDisplayMinor: invoice,
        note: `invoice expects ${route.token === 'USDT' ? 'USDC' : 'USDT'}`,
      };
    case 'no-invoice':
      return { paidDisplayMinor: invoice, note: 'deposit address unassigned' };
    case 'expired-invoice':
      return {
        paidDisplayMinor: invoice,
        note: `paid ${intBetween(rng, 1, 45)}m after expiry`,
      };
    case 'duplicate':
      return { paidDisplayMinor: invoice, note: `${invoiceId} already paid` };
  }
}

function describeAmountMismatch(
  rng: Rng,
  type: 'underpaid' | 'overpaid',
  invoice: bigint,
  token: TokenSymbol,
): IssueOutcome {
  const displayDecimals = TOKENS[token].displayDecimals;
  const basisPoints = BigInt(intBetween(rng, 30, 500));
  const computed = (invoice * basisPoints) / 10_000n;
  const diff = computed > 0n ? computed : 1n;
  const sign = type === 'underpaid' ? '−' : '+';
  const paid = type === 'underpaid' ? invoice - diff : invoice + diff;
  const diffText = formatMoney(
    { minor: diff, decimals: displayDecimals },
    displayDecimals,
  );
  const percent = (Number((diff * 10_000n) / invoice) / 100).toFixed(2);
  return {
    paidDisplayMinor: paid,
    note: `${sign}${diffText} ${token} (${sign}${percent}%)`,
  };
}
