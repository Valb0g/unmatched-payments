import type { NetworkId } from './catalog';
import { randomString, type Rng } from './random';

const HEX = '0123456789abcdef';
const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BECH32 = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const BASE64URL =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

interface AddressFormat {
  readonly prefix: string;
  readonly alphabet: string;
  readonly length: number;
}

const EVM: AddressFormat = { prefix: '0x', alphabet: HEX, length: 42 };

export const ADDRESS_FORMATS: Readonly<Record<NetworkId, AddressFormat>> = {
  tron: { prefix: 'T', alphabet: BASE58, length: 34 },
  ethereum: EVM,
  polygon: EVM,
  bnb: EVM,
  arbitrum: EVM,
  solana: { prefix: '', alphabet: BASE58, length: 44 },
  ton: { prefix: 'UQ', alphabet: BASE64URL, length: 48 },
  bitcoin: { prefix: 'bc1q', alphabet: BECH32, length: 42 },
};

export function randomAddress(rng: Rng, network: NetworkId): string {
  const format = ADDRESS_FORMATS[network];
  return (
    format.prefix +
    randomString(rng, format.alphabet, format.length - format.prefix.length)
  );
}

export function addressWithEnds(
  rng: Rng,
  network: NetworkId,
  head: string,
  tail: string,
): string {
  const format = ADDRESS_FORMATS[network];
  return (
    head +
    randomString(
      rng,
      format.alphabet,
      format.length - head.length - tail.length,
    ) +
    tail
  );
}

export function randomTxHash(rng: Rng, network: NetworkId): string {
  const hash = randomString(rng, HEX, 64);
  return ADDRESS_FORMATS[network] === EVM ? `0x${hash}` : hash;
}
