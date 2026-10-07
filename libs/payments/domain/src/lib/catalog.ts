export type TokenSymbol = 'USDT' | 'USDC' | 'ETH' | 'BTC';

export interface TokenInfo {
  readonly symbol: TokenSymbol;
  readonly decimals: number;
  readonly displayDecimals: number;
  readonly usdRateCents: bigint;
}

// Fixed rates: the demo has no price feed.
export const TOKENS: Readonly<Record<TokenSymbol, TokenInfo>> = {
  USDT: { symbol: 'USDT', decimals: 6, displayDecimals: 2, usdRateCents: 100n },
  USDC: { symbol: 'USDC', decimals: 6, displayDecimals: 2, usdRateCents: 100n },
  ETH: {
    symbol: 'ETH',
    decimals: 18,
    displayDecimals: 6,
    usdRateCents: 245_000n,
  },
  BTC: {
    symbol: 'BTC',
    decimals: 8,
    displayDecimals: 5,
    usdRateCents: 6_200_000n,
  },
};

export const NETWORK_IDS = [
  'tron',
  'ethereum',
  'polygon',
  'bnb',
  'arbitrum',
  'solana',
  'ton',
  'bitcoin',
] as const;
export type NetworkId = (typeof NETWORK_IDS)[number];

export interface NetworkInfo {
  readonly id: NetworkId;
  readonly name: string;
  readonly tokenStandard: string | null;
  readonly nativeToken: TokenSymbol | null;
}

export const NETWORKS: Readonly<Record<NetworkId, NetworkInfo>> = {
  tron: {
    id: 'tron',
    name: 'TRON',
    tokenStandard: 'TRC-20',
    nativeToken: null,
  },
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    tokenStandard: 'ERC-20',
    nativeToken: 'ETH',
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon PoS',
    tokenStandard: null,
    nativeToken: null,
  },
  bnb: {
    id: 'bnb',
    name: 'BNB Chain',
    tokenStandard: 'BEP-20',
    nativeToken: null,
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum One',
    tokenStandard: null,
    nativeToken: null,
  },
  solana: {
    id: 'solana',
    name: 'Solana',
    tokenStandard: 'SPL',
    nativeToken: null,
  },
  ton: { id: 'ton', name: 'TON', tokenStandard: 'Jetton', nativeToken: null },
  bitcoin: {
    id: 'bitcoin',
    name: 'Bitcoin',
    tokenStandard: null,
    nativeToken: 'BTC',
  },
};

export function isNetworkId(value: unknown): value is NetworkId {
  return (
    typeof value === 'string' &&
    (NETWORK_IDS as readonly string[]).includes(value)
  );
}

export function networkLabel(network: NetworkId, token: TokenSymbol): string {
  const info = NETWORKS[network];
  if (info.nativeToken === token || info.tokenStandard === null) {
    return info.name;
  }
  return `${info.name} · ${info.tokenStandard}`;
}
