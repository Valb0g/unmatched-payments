# Unmatched Payments — Queue Screen Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the "Queue" screen of the Unmatched Payments operator console in a new Nx + Angular workspace, fed by a mock RxJS payment stream.

**Architecture:** Nx integrated monorepo. Pure-TS `payments-domain` (types, money as `bigint`, filtering, KPIs, mock generator) ← Angular `payments-data-access` (`MockPaymentsApi` on RxJS, `PaymentsStore` on signals) ← `payments-feature-queue` (page + presentational components) ← `apps/admin` (shell, routing, theme). Shared spartan/ui helm components live in `libs/ui/*`. Boundaries enforced by `@nx/enforce-module-boundaries` tags.

**Tech Stack:** Nx 23, Angular (standalone, zoneless, signals), RxJS, spartan/ui (brain + helm), Tailwind v4, ng-icons (lucide), Vitest, pnpm.

**Design source:** Design canvas `Unmatched Payments` → artboard `Queue · light/dark` (`project/Main.dc.html`). Design doc: `docs/plans/2026-10-07-queue-screen-design.md`.

---

## Conventions for the executor

- Workspace root: `~/Coding/unmatched-payments`. All commands run from there unless stated.
- Run tasks via `pnpm nx <target> <project>`. If a test command starts watch mode, append `--run` (Vitest CLI) or `--watch=false` (Angular unit-test builder).
- **Commits:** the user commits only on explicit request. Each task ends with a _checkpoint_ — propose the message, do not run `git commit` unless the user said so. Messages: Conventional Commits, ≤100 chars, no Claude co-author line.
- Code comments: English, only for non-obvious "why", max one line.
- Never push to GitHub (`gh` is authenticated on this machine) without explicit consent.

---

### Task 0: Scaffold the workspace

**Step 1: Create the workspace (no git commit, no GitHub push)**

```bash
cd ~/Coding && npx create-nx-workspace@latest unmatched-payments \
  --preset=angular-monorepo --appName=admin --prefix=app \
  --bundler=esbuild --style=css --ssr=false --routing=true --zoneless=true \
  --unitTestRunner=vitest --e2eTestRunner=none --linter=eslint --formatter=prettier \
  --packageManager=pnpm --workspaces=false --nxCloud=skip --aiAgents=none \
  --skipGit=true --skipGitHubPush=true --useGitHub=false --interactive=false
```

Expected: `~/Coding/unmatched-payments` with `apps/admin`, `nx.json`, `tsconfig.base.json`, `eslint.config.mjs`.

**Step 2: Init git without committing**

```bash
cd ~/Coding/unmatched-payments && git init -b main
```

**Step 3: Move the plan docs in**

```bash
mkdir -p docs/plans
mv /private/tmp/claude-501/-Users-vladislav/ba14137d-233f-4b8d-94dd-1d62ab0e8aed/scratchpad/plans/2026-10-07-queue-screen*.md docs/plans/
```

**Step 4: Raise the TS target (bigint literals need ≥ ES2020)**

In `tsconfig.base.json` → `compilerOptions`, set:

```json
"target": "es2022",
"lib": ["es2022", "dom"]
```

**Step 5: Verify the scaffold**

Run: `pnpm nx run-many -t lint test build`
Expected: all green for `admin`.

**Checkpoint:** `chore: scaffold nx angular workspace`

---

### Task 1: Generate libraries and enforce boundaries

**Step 1: Generate libraries**

```bash
pnpm nx g @nx/js:library libs/payments/domain --name=payments-domain \
  --importPath=@unmatched-payments/payments-domain --bundler=none --unitTestRunner=vitest \
  --tags=scope:payments,type:domain --no-interactive

pnpm nx g @nx/angular:library libs/payments/data-access --name=payments-data-access \
  --importPath=@unmatched-payments/payments-data-access --prefix=pay \
  --tags=scope:payments,type:data-access --no-interactive

pnpm nx g @nx/angular:library libs/payments/feature-queue --name=payments-feature-queue \
  --importPath=@unmatched-payments/payments-feature-queue --prefix=pay \
  --tags=scope:payments,type:feature --no-interactive
```

Angular libs use the workspace's default unit test runner (set by Task 0).

**Step 2: Delete generated sample code**

Remove the sample component/function files each generator created under `libs/payments/*/src/lib/` and empty each `src/index.ts`. Keep `test-setup.ts` and config files.

**Step 3: Tag the app**

In `apps/admin/project.json` set `"tags": ["scope:admin", "type:app"]`.

**Step 4: Configure module boundaries**

In `eslint.config.mjs`, replace the `depConstraints` of `@nx/enforce-module-boundaries` with:

```js
depConstraints: [
  { sourceTag: 'type:app', onlyDependOnLibsWithTags: ['type:feature', 'type:data-access', 'type:domain', 'type:ui'] },
  { sourceTag: 'type:feature', onlyDependOnLibsWithTags: ['type:data-access', 'type:domain', 'type:ui'] },
  { sourceTag: 'type:data-access', onlyDependOnLibsWithTags: ['type:domain'] },
  { sourceTag: 'type:domain', onlyDependOnLibsWithTags: ['type:domain'] },
  { sourceTag: 'type:ui', onlyDependOnLibsWithTags: ['type:ui'] },
],
```

**Step 5: Verify**

Run: `pnpm nx run-many -t lint`
Expected: PASS. (A real violation is tested in Task 13.)

**Checkpoint:** `chore: add payments libs with module boundary tags`

---

### Task 2: Tailwind v4 + spartan/ui setup

**Step 1: Install spartan CLI and init**

```bash
pnpm add -D @spartan-ng/cli
pnpm nx g @spartan-ng/cli:init
```

When prompted: components path `libs/ui`, import alias `@spartan-ng/helm`, generate as `library`, any style (we override tokens).

**Step 2: Generate helm components**

```bash
pnpm nx g @spartan-ng/cli:ui
```

Select: `button`, `select`. Theme step (`ui-theme`), if prompted: any — its variables are replaced in Step 5.

**Step 3: Verify dependencies**

Check `package.json` contains: `@spartan-ng/brain`, `@angular/cdk`, `tailwindcss`, `@tailwindcss/postcss`, `postcss`, `@ng-icons/core`, `@ng-icons/lucide`. Add only the missing ones. Pin `@angular/cdk` to the installed Angular major (`pnpm add @angular/cdk@^<major>`). `.postcssrc.json` at the workspace root must be:

```json
{ "plugins": { "@tailwindcss/postcss": {} } }
```

**Step 4: Tag ui libs**

In every `libs/ui/*/project.json` set `"tags": ["scope:shared", "type:ui"]`.

**Step 5: Replace `apps/admin/src/styles.css`**

```css
@import 'tailwindcss';
@import '@spartan-ng/brain/hlm-tailwind-preset.css';

@theme {
  --font-sans: 'Geist', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
}

@theme inline {
  --color-subtle: var(--subtle);
  --color-foreground-subtle: var(--foreground-subtle);
  --color-border-strong: var(--border-strong);
  --color-warning: var(--warning);
  --color-warning-soft: var(--warning-soft);
  --color-warning-border: var(--warning-border);
  --color-primary-text: var(--primary-text);
  --color-primary-soft: var(--primary-soft);
  --color-primary-border: var(--primary-border);
}

:root {
  color-scheme: light;
  --radius: 0.5rem;
  --background: #ffffff;
  --foreground: #09090b;
  --card: #ffffff;
  --card-foreground: #09090b;
  --popover: #ffffff;
  --popover-foreground: #09090b;
  --primary: #2563eb;
  --primary-foreground: #ffffff;
  --secondary: #f4f4f5;
  --secondary-foreground: #09090b;
  --muted: #f4f4f5;
  --muted-foreground: #66666e;
  --accent: #f4f4f5;
  --accent-foreground: #09090b;
  --destructive: #b91c1c;
  --border: #e4e4e7;
  --input: #e4e4e7;
  --ring: #66666e;
  --subtle: #fafafa;
  --foreground-subtle: #3f3f46;
  --border-strong: #d4d4d8;
  --warning: #9a3412;
  --warning-soft: #fff7ed;
  --warning-border: #fed7aa;
  --primary-text: #2563eb;
  --primary-soft: rgb(37 99 235 / 0.08);
  --primary-border: rgb(37 99 235 / 0.25);
}

.dark {
  color-scheme: dark;
  --background: #09090b;
  --foreground: #fafafa;
  --card: #111113;
  --card-foreground: #fafafa;
  --popover: #111113;
  --popover-foreground: #fafafa;
  --primary: #2563eb;
  --primary-foreground: #ffffff;
  --secondary: #18181b;
  --secondary-foreground: #fafafa;
  --muted: #18181b;
  --muted-foreground: #a1a1aa;
  --accent: #27272a;
  --accent-foreground: #fafafa;
  --destructive: #f87171;
  --border: #27272a;
  --input: #27272a;
  --ring: #a1a1aa;
  --subtle: #0f0f11;
  --foreground-subtle: #d4d4d8;
  --border-strong: #3f3f46;
  --warning: #fdba74;
  --warning-soft: rgb(249 115 22 / 0.12);
  --warning-border: rgb(249 115 22 / 0.32);
  --primary-text: #87a9f4;
  --primary-soft: rgb(37 99 235 / 0.18);
  --primary-border: rgb(37 99 235 / 0.4);
}

@layer base {
  body {
    @apply bg-background font-sans text-foreground antialiased;
    font-size: 13px;
    line-height: 20px;
  }
}

.tabular {
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

@keyframes row-arrived {
  from {
    background-color: var(--primary-soft);
  }
  to {
    background-color: transparent;
  }
}

.row-arrived {
  animation: row-arrived 2.4s ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .row-arrived {
    animation: none;
  }
}
```

Then open `node_modules/@spartan-ng/brain/hlm-tailwind-preset.css`:

- if it has no `@custom-variant dark`, add `@custom-variant dark (&:where(.dark, .dark *));` after the imports;
- if it maps `--font-sans` via `@theme inline`, move our font stacks into `:root` as `--font-sans`/`--font-mono` instead of `@theme`.

**Step 6: Fonts + no-flash theme in `apps/admin/src/index.html`**

Inside `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500;600&display=swap" />
<script>
  try {
    const stored = localStorage.getItem('payments-ops-theme');
    const dark = stored ? stored === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', dark);
  } catch {}
</script>
```

Set `<title>Payments Ops</title>` and `<html lang="en">`.

**Step 7: Verify**

Run: `pnpm nx build admin`
Expected: PASS, CSS bundle contains `--warning-soft`.

**Checkpoint:** `chore: set up tailwind v4, spartan/ui and design tokens`

---

### Task 3: Domain — money

**Files:**

- Create: `libs/payments/domain/src/lib/money.ts`
- Test: `libs/payments/domain/src/lib/money.spec.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { formatMoney, formatUsd, parseMoney, toUsdCents } from './money';

describe('parseMoney', () => {
  it('parses grouped decimal strings into minor units', () => {
    expect(parseMoney('1,249.99', 6)).toEqual({ minor: 1_249_990_000n, decimals: 6 });
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
    expect(formatMoney({ minor: 3_450_000_000n, decimals: 6 }, 2)).toBe('3,450.00');
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
    expect(toUsdCents({ minor: 42_100_000_000_000_000n, decimals: 18 }, 245_000n)).toBe(10_314n);
  });

  it('formats USD cents', () => {
    expect(formatUsd(3_821_460n)).toBe('$38,214.60');
  });
});
```

**Step 2: Run to verify it fails**

Run: `pnpm nx test payments-domain`
Expected: FAIL — cannot resolve `./money`.

**Step 3: Implement**

```ts
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
    throw new Error(`Cannot format ${money.decimals}-decimal amount with ${fractionDigits} digits`);
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
```

**Step 4: Run to verify it passes**

Run: `pnpm nx test payments-domain`
Expected: PASS.

**Checkpoint:** `feat(domain): add bigint money parsing and formatting`

---

### Task 4: Domain — catalog, payment types, operator

**Files:**

- Create: `libs/payments/domain/src/lib/catalog.ts`, `payment.ts`, `operator.ts`
- Test: `libs/payments/domain/src/lib/catalog.spec.ts`

**Step 1: Write the failing test**

```ts
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
```

**Step 2: Run to verify it fails**

Run: `pnpm nx test payments-domain`
Expected: FAIL — cannot resolve `./catalog`.

**Step 3: Implement `catalog.ts`**

```ts
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
  ETH: { symbol: 'ETH', decimals: 18, displayDecimals: 6, usdRateCents: 245_000n },
  BTC: { symbol: 'BTC', decimals: 8, displayDecimals: 5, usdRateCents: 6_200_000n },
};

export const NETWORK_IDS = ['tron', 'ethereum', 'polygon', 'bnb', 'arbitrum', 'solana', 'ton', 'bitcoin'] as const;
export type NetworkId = (typeof NETWORK_IDS)[number];

export interface NetworkInfo {
  readonly id: NetworkId;
  readonly name: string;
  readonly tokenStandard: string | null;
  readonly nativeToken: TokenSymbol | null;
}

export const NETWORKS: Readonly<Record<NetworkId, NetworkInfo>> = {
  tron: { id: 'tron', name: 'TRON', tokenStandard: 'TRC-20', nativeToken: null },
  ethereum: { id: 'ethereum', name: 'Ethereum', tokenStandard: 'ERC-20', nativeToken: 'ETH' },
  polygon: { id: 'polygon', name: 'Polygon PoS', tokenStandard: null, nativeToken: null },
  bnb: { id: 'bnb', name: 'BNB Chain', tokenStandard: 'BEP-20', nativeToken: null },
  arbitrum: { id: 'arbitrum', name: 'Arbitrum One', tokenStandard: null, nativeToken: null },
  solana: { id: 'solana', name: 'Solana', tokenStandard: 'SPL', nativeToken: null },
  ton: { id: 'ton', name: 'TON', tokenStandard: 'Jetton', nativeToken: null },
  bitcoin: { id: 'bitcoin', name: 'Bitcoin', tokenStandard: null, nativeToken: 'BTC' },
};

export function isNetworkId(value: unknown): value is NetworkId {
  return typeof value === 'string' && (NETWORK_IDS as readonly string[]).includes(value);
}

export function networkLabel(network: NetworkId, token: TokenSymbol): string {
  const info = NETWORKS[network];
  if (info.nativeToken === token || info.tokenStandard === null) {
    return info.name;
  }
  return `${info.name} · ${info.tokenStandard}`;
}
```

**Step 4: Implement `payment.ts`**

```ts
import type { NetworkId, TokenSymbol } from './catalog';
import type { Money } from './money';

export const ISSUE_TYPES = ['underpaid', 'overpaid', 'wrong-network', 'wrong-token', 'no-invoice', 'expired-invoice', 'duplicate'] as const;
export type IssueType = (typeof ISSUE_TYPES)[number];

export const PAYMENT_STATUSES = ['open', 'in-review', 'escalated'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface PaymentIssue {
  readonly type: IssueType;
  readonly note: string;
}

export interface SuggestedMatch {
  readonly invoiceId: string;
  readonly confidence: number;
}

export interface UnmatchedPayment {
  readonly id: string;
  readonly txHash: string;
  readonly receivedAt: Date;
  readonly amount: Money;
  readonly token: TokenSymbol;
  readonly network: NetworkId;
  readonly fromAddress: string;
  readonly issue: PaymentIssue;
  readonly suggestedMatch: SuggestedMatch | null;
  readonly status: PaymentStatus;
  readonly assigneeId: string | null;
}

export const ISSUE_LABELS: Readonly<Record<IssueType, string>> = {
  underpaid: 'Underpaid',
  overpaid: 'Overpaid',
  'wrong-network': 'Wrong network',
  'wrong-token': 'Wrong token',
  'no-invoice': 'No invoice found',
  'expired-invoice': 'Expired invoice',
  duplicate: 'Duplicate',
};

export const STATUS_LABELS: Readonly<Record<PaymentStatus, string>> = {
  open: 'Open',
  'in-review': 'In review',
  escalated: 'Escalated',
};

export function isPaymentStatus(value: unknown): value is PaymentStatus {
  return typeof value === 'string' && (PAYMENT_STATUSES as readonly string[]).includes(value);
}
```

**Step 5: Implement `operator.ts`**

```ts
export interface Operator {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly initials: string;
}

export const DEMO_OPERATOR: Operator = {
  id: 'op_marta',
  name: 'Marta Kovač',
  role: 'Payments operator',
  initials: 'MK',
};
```

**Step 6: Run to verify it passes**

Run: `pnpm nx test payments-domain`
Expected: PASS.

**Checkpoint:** `feat(domain): add token/network catalog and payment model`

---

### Task 5: Domain — formatting helpers

**Files:**

- Create: `libs/payments/domain/src/lib/format.ts`
- Test: `libs/payments/domain/src/lib/format.spec.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { formatAge, formatReceivedAt, isSlaBreached, shortenAddress } from './format';

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
    expect(isSlaBreached(new Date(NOW.getTime() - 24 * 60 * MINUTE), NOW)).toBe(false);
    expect(isSlaBreached(new Date(NOW.getTime() - 24 * 60 * MINUTE - MINUTE), NOW)).toBe(true);
  });
});

describe('formatReceivedAt', () => {
  it('shows time only for the same UTC day', () => {
    expect(formatReceivedAt(new Date('2026-10-07T14:52:08Z'), NOW)).toBe('14:52:08');
  });

  it('shows date and time for earlier days', () => {
    expect(formatReceivedAt(new Date('2026-10-06T23:18:00Z'), NOW)).toBe('Oct 6, 23:18');
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
```

**Step 2: Run to verify it fails**

Run: `pnpm nx test payments-domain`
Expected: FAIL — cannot resolve `./format`.

**Step 3: Implement**

```ts
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
  return isSameUtcDay(receivedAt, now) ? timeFormat.format(receivedAt) : dateTimeFormat.format(receivedAt);
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
```

**Step 4: Run to verify it passes**

Run: `pnpm nx test payments-domain`
Expected: PASS. If `Oct 6, 23:18` differs only by ICU punctuation, fix the formatter options, not the test.

**Checkpoint:** `feat(domain): add age, time and address formatting`

---

### Task 6: Domain — filters and KPIs

**Files:**

- Create: `libs/payments/domain/src/lib/payment.fixture.ts` (test-only, not exported)
- Create: `libs/payments/domain/src/lib/filters.ts`, `kpis.ts`
- Test: `libs/payments/domain/src/lib/filters.spec.ts`, `kpis.spec.ts`

**Step 1: Fixture**

```ts
import type { UnmatchedPayment } from './payment';

export const FIXTURE_NOW = new Date('2026-10-07T15:10:00Z');

export function aPayment(overrides: Partial<UnmatchedPayment> & Pick<UnmatchedPayment, 'id'>): UnmatchedPayment {
  return {
    txHash: `hash_${overrides.id}`,
    receivedAt: FIXTURE_NOW,
    amount: { minor: 1_000_000n, decimals: 6 },
    token: 'USDT',
    network: 'tron',
    fromAddress: `addr_${overrides.id}`,
    issue: { type: 'underpaid', note: '' },
    suggestedMatch: null,
    status: 'open',
    assigneeId: null,
    ...overrides,
  };
}
```

**Step 2: Write failing tests — `filters.spec.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { countByIssue, DEFAULT_FILTERS, filterPayments } from './filters';
import { aPayment, FIXTURE_NOW } from './payment.fixture';

const minutesAgo = (m: number) => new Date(FIXTURE_NOW.getTime() - m * 60_000);

const payments = [
  aPayment({ id: 'a', receivedAt: minutesAgo(30), issue: { type: 'underpaid', note: '' }, network: 'tron' }),
  aPayment({ id: 'b', receivedAt: minutesAgo(10), issue: { type: 'duplicate', note: '' }, network: 'ethereum', status: 'escalated' }),
  aPayment({
    id: 'c',
    receivedAt: minutesAgo(20),
    issue: { type: 'underpaid', note: '' },
    network: 'ethereum',
    txHash: '0xDEADbeef',
    suggestedMatch: { invoiceId: 'INV-20418', confidence: 90 },
  }),
];

const ids = (list: readonly { id: string }[]) => list.map((p) => p.id);

describe('filterPayments', () => {
  it('returns everything newest first by default', () => {
    expect(ids(filterPayments(payments, DEFAULT_FILTERS))).toEqual(['b', 'c', 'a']);
  });

  it('filters by issue type', () => {
    expect(ids(filterPayments(payments, { ...DEFAULT_FILTERS, issue: 'underpaid' }))).toEqual(['c', 'a']);
  });

  it('filters by statuses', () => {
    expect(ids(filterPayments(payments, { ...DEFAULT_FILTERS, statuses: ['escalated'] }))).toEqual(['b']);
  });

  it('filters by network', () => {
    expect(ids(filterPayments(payments, { ...DEFAULT_FILTERS, network: 'tron' }))).toEqual(['a']);
  });

  it.each(['deadBEEF', 'addr_a', 'inv-20418'])('searches tx hash, address and invoice id: %s', (search) => {
    expect(filterPayments(payments, { ...DEFAULT_FILTERS, search })).toHaveLength(1);
  });

  it('does not mutate the input', () => {
    const copy = [...payments];
    filterPayments(payments, DEFAULT_FILTERS);
    expect(payments).toEqual(copy);
  });
});

describe('countByIssue', () => {
  it('ignores the issue filter but respects the others', () => {
    const counts = countByIssue(payments, { ...DEFAULT_FILTERS, issue: 'duplicate', network: 'ethereum' });
    expect(counts.all).toBe(2);
    expect(counts.duplicate).toBe(1);
    expect(counts.underpaid).toBe(1);
    expect(counts.overpaid).toBe(0);
  });
});
```

**Step 3: Write failing tests — `kpis.spec.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { computeKpis } from './kpis';
import { aPayment, FIXTURE_NOW } from './payment.fixture';

describe('computeKpis', () => {
  it('aggregates count, today, usd total, oldest and assignment', () => {
    const yesterday = new Date('2026-10-06T23:00:00Z');
    const payments = [aPayment({ id: 'a', assigneeId: 'op_1' }), aPayment({ id: 'b', receivedAt: yesterday }), aPayment({ id: 'c', token: 'ETH', amount: { minor: 42_100_000_000_000_000n, decimals: 18 }, assigneeId: 'op_1' })];

    const kpis = computeKpis(payments, FIXTURE_NOW, 'op_1');

    expect(kpis.unmatchedCount).toBe(3);
    expect(kpis.addedToday).toBe(2);
    expect(kpis.totalUsdCents).toBe(100n + 100n + 10_314n);
    expect(kpis.oldest?.id).toBe('b');
    expect(kpis.assignedToOperator).toBe(2);
  });

  it('handles an empty queue', () => {
    expect(computeKpis([], FIXTURE_NOW, 'op_1')).toEqual({
      unmatchedCount: 0,
      addedToday: 0,
      totalUsdCents: 0n,
      oldest: null,
      assignedToOperator: 0,
    });
  });
});
```

**Step 4: Run to verify they fail**

Run: `pnpm nx test payments-domain`
Expected: FAIL — cannot resolve `./filters`, `./kpis`.

**Step 5: Implement `filters.ts`**

```ts
import type { NetworkId } from './catalog';
import { ISSUE_TYPES, PAYMENT_STATUSES, type IssueType, type PaymentStatus, type UnmatchedPayment } from './payment';

export type IssueFilter = IssueType | 'all';
export type NetworkFilter = NetworkId | 'all';

export interface QueueFilters {
  readonly issue: IssueFilter;
  readonly statuses: readonly PaymentStatus[];
  readonly network: NetworkFilter;
  readonly search: string;
}

export const DEFAULT_FILTERS: QueueFilters = {
  issue: 'all',
  statuses: PAYMENT_STATUSES,
  network: 'all',
  search: '',
};

export type IssueCounts = Readonly<Record<IssueFilter, number>>;

export function filterPayments(payments: readonly UnmatchedPayment[], filters: QueueFilters): UnmatchedPayment[] {
  return payments.filter((p) => matchesIssue(p, filters.issue) && matchesNonIssueFilters(p, filters)).sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());
}

export function countByIssue(payments: readonly UnmatchedPayment[], filters: QueueFilters): IssueCounts {
  const counts: Record<IssueFilter, number> = { all: 0, ...emptyIssueCounts() };
  for (const payment of payments) {
    if (matchesNonIssueFilters(payment, filters)) {
      counts.all += 1;
      counts[payment.issue.type] += 1;
    }
  }
  return counts;
}

function emptyIssueCounts(): Record<IssueType, number> {
  return Object.fromEntries(ISSUE_TYPES.map((type) => [type, 0])) as Record<IssueType, number>;
}

function matchesIssue(payment: UnmatchedPayment, issue: IssueFilter): boolean {
  return issue === 'all' || payment.issue.type === issue;
}

function matchesNonIssueFilters(payment: UnmatchedPayment, filters: QueueFilters): boolean {
  return filters.statuses.includes(payment.status) && (filters.network === 'all' || payment.network === filters.network) && matchesSearch(payment, filters.search);
}

function matchesSearch(payment: UnmatchedPayment, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (!query) {
    return true;
  }
  const haystack = [payment.txHash, payment.fromAddress, payment.suggestedMatch?.invoiceId ?? ''];
  return haystack.some((value) => value.toLowerCase().includes(query));
}
```

**Step 6: Implement `kpis.ts`**

```ts
import { TOKENS } from './catalog';
import { isSameUtcDay } from './format';
import { toUsdCents } from './money';
import type { UnmatchedPayment } from './payment';

export interface QueueKpis {
  readonly unmatchedCount: number;
  readonly addedToday: number;
  readonly totalUsdCents: bigint;
  readonly oldest: UnmatchedPayment | null;
  readonly assignedToOperator: number;
}

export function computeKpis(payments: readonly UnmatchedPayment[], now: Date, operatorId: string): QueueKpis {
  let addedToday = 0;
  let totalUsdCents = 0n;
  let oldest: UnmatchedPayment | null = null;
  let assignedToOperator = 0;

  for (const payment of payments) {
    if (isSameUtcDay(payment.receivedAt, now)) {
      addedToday += 1;
    }
    totalUsdCents += toUsdCents(payment.amount, TOKENS[payment.token].usdRateCents);
    if (!oldest || payment.receivedAt < oldest.receivedAt) {
      oldest = payment;
    }
    if (payment.assigneeId === operatorId) {
      assignedToOperator += 1;
    }
  }

  return { unmatchedCount: payments.length, addedToday, totalUsdCents, oldest, assignedToOperator };
}
```

**Step 7: Run to verify they pass**

Run: `pnpm nx test payments-domain`
Expected: PASS.

**Checkpoint:** `feat(domain): add queue filtering and kpi aggregation`

---

### Task 7: Domain — PRNG, addresses, generator, seed

**Files:**

- Create: `libs/payments/domain/src/lib/random.ts`, `addresses.ts`, `generator.ts`, `seed.ts`
- Test: `libs/payments/domain/src/lib/generator.spec.ts`, `seed.spec.ts`

**Step 1: Write failing tests — `generator.spec.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { TOKENS } from './catalog';
import { generatePayment } from './generator';
import { ISSUE_TYPES } from './payment';
import { createRng } from './random';

const NOW = new Date('2026-10-07T15:10:00Z');

describe('createRng', () => {
  it('is deterministic and stays within [0, 1)', () => {
    const a = createRng(5);
    const b = createRng(5);
    for (let i = 0; i < 100; i++) {
      const value = a();
      expect(value).toBe(b());
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('generatePayment', () => {
  it('is deterministic for the same seed', () => {
    expect(generatePayment(createRng(1), { now: NOW, sequence: 3 })).toEqual(generatePayment(createRng(1), { now: NOW, sequence: 3 }));
  });

  it('derives id, invoice and timestamp from options', () => {
    const payment = generatePayment(createRng(1), { now: NOW, sequence: 7, issue: 'duplicate' });
    expect(payment.id).toBe('pay_live_7');
    expect(payment.receivedAt).toBe(NOW);
    expect(payment.suggestedMatch?.invoiceId).toBe('INV-20426');
    expect(payment.issue.note).toBe('INV-20426 already paid');
    expect(payment.status).toBe('open');
  });

  it('has no suggested match when no invoice is found', () => {
    expect(generatePayment(createRng(1), { now: NOW, sequence: 1, issue: 'no-invoice' }).suggestedMatch).toBeNull();
  });

  it('signs the difference for under- and overpayments', () => {
    expect(generatePayment(createRng(2), { now: NOW, sequence: 1, issue: 'underpaid' }).issue.note).toMatch(/^−.+\(−\d+\.\d{2}%\)$/);
    expect(generatePayment(createRng(2), { now: NOW, sequence: 1, issue: 'overpaid' }).issue.note).toMatch(/^\+.+\(\+\d+\.\d{2}%\)$/);
  });

  it('always produces positive amounts in the token precision and covers every issue', () => {
    const rng = createRng(99);
    const seen = new Set<string>();
    for (let sequence = 1; sequence <= 200; sequence++) {
      const payment = generatePayment(rng, { now: NOW, sequence });
      expect(payment.amount.minor > 0n).toBe(true);
      expect(payment.amount.decimals).toBe(TOKENS[payment.token].decimals);
      seen.add(payment.issue.type);
    }
    expect([...seen].sort()).toEqual([...ISSUE_TYPES].sort());
  });
});
```

**Step 2: Write failing tests — `seed.spec.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { shortenAddress } from './format';
import { DEMO_OPERATOR } from './operator';
import { createSeedPayments, SEED_SIZE } from './seed';

const NOW = new Date('2026-10-07T15:10:00Z');

describe('createSeedPayments', () => {
  const seed = createSeedPayments(NOW);

  it('matches the design queue', () => {
    expect(seed).toHaveLength(SEED_SIZE);
    expect(SEED_SIZE).toBe(14);
    expect(new Set(seed.map((p) => p.id)).size).toBe(SEED_SIZE);
  });

  it('places payments relative to now', () => {
    expect(seed[0].receivedAt).toEqual(new Date('2026-10-07T14:52:00Z'));
  });

  it('keeps the design address fragments', () => {
    expect(shortenAddress(seed[0].fromAddress)).toBe('TJR7n…Af7W');
    expect(shortenAddress(seed[1].fromAddress)).toBe('0x7a3F…9c21');
  });

  it('assigns six payments to the demo operator', () => {
    expect(seed.filter((p) => p.assigneeId === DEMO_OPERATOR.id)).toHaveLength(6);
  });

  it('is deterministic', () => {
    expect(createSeedPayments(NOW)).toEqual(seed);
  });
});
```

**Step 3: Run to verify they fail**

Run: `pnpm nx test payments-domain`
Expected: FAIL — cannot resolve `./generator`, `./seed`.

**Step 4: Implement `random.ts`**

```ts
export type Rng = () => number;

// mulberry32: tiny seeded PRNG so the demo stream is reproducible.
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) {
    throw new Error('Cannot pick from an empty list');
  }
  return items[Math.floor(rng() * items.length)] as T;
}

export function intBetween(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function randomString(rng: Rng, alphabet: string, length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += alphabet[Math.floor(rng() * alphabet.length)];
  }
  return result;
}
```

**Step 5: Implement `addresses.ts`**

```ts
import type { NetworkId } from './catalog';
import { randomString, type Rng } from './random';

const HEX = '0123456789abcdef';
const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BECH32 = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const BASE64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

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
  return format.prefix + randomString(rng, format.alphabet, format.length - format.prefix.length);
}

export function addressWithEnds(rng: Rng, network: NetworkId, head: string, tail: string): string {
  const format = ADDRESS_FORMATS[network];
  return head + randomString(rng, format.alphabet, format.length - head.length - tail.length) + tail;
}

export function randomTxHash(rng: Rng, network: NetworkId): string {
  const hash = randomString(rng, HEX, 64);
  return ADDRESS_FORMATS[network] === EVM ? `0x${hash}` : hash;
}
```

**Step 6: Implement `generator.ts`**

```ts
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

const STABLECOIN_NETWORKS: readonly NetworkId[] = ['tron', 'ethereum', 'bnb', 'polygon'];

// Invoice ranges in display units (10^displayDecimals).
const INVOICE_RANGES: Readonly<Record<TokenSymbol, readonly [number, number]>> = {
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

export function generatePayment(rng: Rng, options: GenerateOptions): UnmatchedPayment {
  const issueType = options.issue ?? pick(rng, ISSUE_TYPES);
  const route = pick(rng, ROUTES);
  const token = TOKENS[route.token];
  const [min, max] = INVOICE_RANGES[route.token];
  const invoiceDisplayMinor = BigInt(intBetween(rng, min, max));
  const invoiceId = `INV-${INVOICE_BASE + options.sequence}`;
  const outcome = describeIssue(rng, issueType, invoiceDisplayMinor, route, invoiceId);
  const displayToMinor = 10n ** BigInt(token.decimals - token.displayDecimals);

  return {
    id: `pay_live_${options.sequence}`,
    txHash: randomTxHash(rng, route.network),
    receivedAt: options.now,
    amount: { minor: outcome.paidDisplayMinor * displayToMinor, decimals: token.decimals },
    token: route.token,
    network: route.network,
    fromAddress: randomAddress(rng, route.network),
    issue: { type: issueType, note: outcome.note },
    suggestedMatch: issueType === 'no-invoice' ? null : { invoiceId, confidence: intBetween(rng, 60, 99) },
    status: 'open',
    assigneeId: null,
  };
}

function describeIssue(rng: Rng, type: IssueType, invoice: bigint, route: Route, invoiceId: string): IssueOutcome {
  switch (type) {
    case 'underpaid':
    case 'overpaid':
      return describeAmountMismatch(rng, type, invoice, route.token);
    case 'wrong-network': {
      const expected = pick(
        rng,
        STABLECOIN_NETWORKS.filter((network) => network !== route.network),
      );
      return { paidDisplayMinor: invoice, note: `invoice expects ${NETWORKS[expected].name}` };
    }
    case 'wrong-token':
      return { paidDisplayMinor: invoice, note: `invoice expects ${route.token === 'USDT' ? 'USDC' : 'USDT'}` };
    case 'no-invoice':
      return { paidDisplayMinor: invoice, note: 'deposit address unassigned' };
    case 'expired-invoice':
      return { paidDisplayMinor: invoice, note: `paid ${intBetween(rng, 1, 45)}m after expiry` };
    case 'duplicate':
      return { paidDisplayMinor: invoice, note: `${invoiceId} already paid` };
  }
}

function describeAmountMismatch(rng: Rng, type: 'underpaid' | 'overpaid', invoice: bigint, token: TokenSymbol): IssueOutcome {
  const displayDecimals = TOKENS[token].displayDecimals;
  const basisPoints = BigInt(intBetween(rng, 30, 500));
  const computed = (invoice * basisPoints) / 10_000n;
  const diff = computed > 0n ? computed : 1n;
  const sign = type === 'underpaid' ? '−' : '+';
  const paid = type === 'underpaid' ? invoice - diff : invoice + diff;
  const diffText = formatMoney({ minor: diff, decimals: displayDecimals }, displayDecimals);
  const percent = (Number((diff * 10_000n) / invoice) / 100).toFixed(2);
  return { paidDisplayMinor: paid, note: `${sign}${diffText} ${token} (${sign}${percent}%)` };
}
```

**Step 7: Implement `seed.ts`**

```ts
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
    suggestedMatch: row.match ? { invoiceId: row.match[0], confidence: row.match[1] } : null,
    status: row.status,
    assigneeId: row.assigned ? DEMO_OPERATOR.id : null,
  }));
}
```

(Prettier will reflow the long seed rows — keep one object per row.)

**Step 8: Export the public API — `libs/payments/domain/src/index.ts`**

```ts
export * from './lib/catalog';
export * from './lib/filters';
export * from './lib/format';
export * from './lib/generator';
export * from './lib/kpis';
export * from './lib/money';
export * from './lib/operator';
export * from './lib/payment';
export * from './lib/random';
export * from './lib/seed';
```

**Step 9: Run to verify they pass**

Run: `pnpm nx test payments-domain && pnpm nx lint payments-domain`
Expected: PASS.

**Checkpoint:** `feat(domain): add seeded mock payment generator and design seed`

---

### Task 8: Data-access — MockPaymentsApi

**Files:**

- Create: `libs/payments/data-access/src/lib/clock.ts`, `mock-payments-api.ts`
- Test: `libs/payments/data-access/src/lib/mock-payments-api.spec.ts`

**Step 1: Write the failing test**

```ts
import { TestBed } from '@angular/core/testing';
import { SEED_SIZE } from '@unmatched-payments/payments-domain';
import { map, take } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { CLOCK } from './clock';
import { MOCK_STREAM_CONFIG, MockPaymentsApi } from './mock-payments-api';

describe('MockPaymentsApi', () => {
  const now = new Date('2026-10-07T15:10:00Z');
  let scheduler: TestScheduler;
  let api: MockPaymentsApi;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: CLOCK, useValue: () => now },
        { provide: MOCK_STREAM_CONFIG, useValue: { seed: 1, intervalMs: 6_000 } },
      ],
    });
    api = TestBed.inject(MockPaymentsApi);
    scheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
  });

  it('lists the seed queue synchronously', () => {
    scheduler.run(({ expectObservable }) => {
      expectObservable(api.list().pipe(map((list) => list.length))).toBe('(a|)', { a: SEED_SIZE });
    });
  });

  it('streams one new payment per interval', () => {
    scheduler.run(({ expectObservable }) => {
      expectObservable(
        api.incoming$.pipe(
          take(2),
          map((p) => p.id),
        ),
      ).toBe('6000ms a 5999ms (b|)', {
        a: 'pay_live_1',
        b: 'pay_live_2',
      });
    });
  });

  it('stamps streamed payments with the clock time', () => {
    scheduler.run(({ expectObservable }) => {
      expectObservable(
        api.incoming$.pipe(
          take(1),
          map((p) => p.receivedAt),
        ),
      ).toBe('6000ms (a|)', { a: now });
    });
  });
});
```

**Step 2: Run to verify it fails**

Run: `pnpm nx test payments-data-access`
Expected: FAIL — cannot resolve `./clock`.

**Step 3: Implement `clock.ts`**

```ts
import { InjectionToken } from '@angular/core';

export type Clock = () => Date;

export const CLOCK = new InjectionToken<Clock>('CLOCK', {
  providedIn: 'root',
  factory: () => () => new Date(),
});
```

**Step 4: Implement `mock-payments-api.ts`**

```ts
import { inject, Injectable, InjectionToken } from '@angular/core';
import { createRng, createSeedPayments, generatePayment, type UnmatchedPayment } from '@unmatched-payments/payments-domain';
import { defer, interval, map, type Observable, of } from 'rxjs';
import { CLOCK } from './clock';

export interface MockStreamConfig {
  readonly seed: number;
  readonly intervalMs: number;
}

export const MOCK_STREAM_CONFIG = new InjectionToken<MockStreamConfig>('MOCK_STREAM_CONFIG', {
  providedIn: 'root',
  factory: () => ({ seed: 2026, intervalMs: 6_000 }),
});

@Injectable({ providedIn: 'root' })
export class MockPaymentsApi {
  private readonly config = inject(MOCK_STREAM_CONFIG);
  private readonly clock = inject(CLOCK);

  readonly incoming$: Observable<UnmatchedPayment> = defer(() => {
    const rng = createRng(this.config.seed);
    return interval(this.config.intervalMs).pipe(map((tick) => generatePayment(rng, { now: this.clock(), sequence: tick + 1 })));
  });

  list(): Observable<UnmatchedPayment[]> {
    return defer(() => of(createSeedPayments(this.clock())));
  }
}
```

**Step 5: Run to verify it passes**

Run: `pnpm nx test payments-data-access`
Expected: PASS.

**Checkpoint:** `feat(data-access): add rxjs mock payments api`

---

### Task 9: Data-access — PaymentsStore

**Files:**

- Create: `libs/payments/data-access/src/lib/payments-store.ts`
- Modify: `libs/payments/data-access/src/index.ts`
- Test: `libs/payments/data-access/src/lib/payments-store.spec.ts`

**Step 1: Write the failing test**

```ts
import { TestBed } from '@angular/core/testing';
import { createRng, createSeedPayments, generatePayment, SEED_SIZE, type UnmatchedPayment } from '@unmatched-payments/payments-domain';
import { of, Subject } from 'rxjs';
import { CLOCK } from './clock';
import { MockPaymentsApi } from './mock-payments-api';
import { PAGE_SIZE, PaymentsStore } from './payments-store';

const NOW = new Date('2026-10-07T15:10:00Z');

function setup(initial: UnmatchedPayment[] = createSeedPayments(NOW)) {
  const incoming = new Subject<UnmatchedPayment>();
  const api: Pick<MockPaymentsApi, 'list' | 'incoming$'> = {
    list: () => of(initial),
    incoming$: incoming.asObservable(),
  };
  TestBed.configureTestingModule({
    providers: [
      { provide: MockPaymentsApi, useValue: api },
      { provide: CLOCK, useValue: () => NOW },
    ],
  });
  return { store: TestBed.inject(PaymentsStore), incoming };
}

function manyPayments(count: number): UnmatchedPayment[] {
  return Array.from({ length: count }, (_, i) =>
    generatePayment(createRng(i + 1), {
      now: NOW,
      sequence: i + 1,
      issue: i % 2 === 0 ? 'underpaid' : 'duplicate',
    }),
  );
}

describe('PaymentsStore', () => {
  it('loads the initial queue newest first', () => {
    const { store } = setup();
    expect(store.filtered()).toHaveLength(SEED_SIZE);
    expect(store.filtered()[0]?.id).toBe('pay_seed_01');
    expect(store.connection()).toBe('live');
  });

  it('prepends streamed payments and marks the latest arrival', () => {
    const { store, incoming } = setup();
    incoming.next(generatePayment(createRng(1), { now: NOW, sequence: 1 }));
    expect(store.filtered()[0]?.id).toBe('pay_live_1');
    expect(store.lastArrivedId()).toBe('pay_live_1');
    expect(store.kpis().unmatchedCount).toBe(SEED_SIZE + 1);
  });

  it('pages rows by PAGE_SIZE and clamps navigation', () => {
    const { store } = setup(manyPayments(30));
    expect(store.pageRows()).toHaveLength(PAGE_SIZE);
    expect(store.pageCount()).toBe(2);
    store.nextPage();
    store.nextPage();
    expect(store.pageIndex()).toBe(1);
    expect(store.pageRows()).toHaveLength(5);
    store.previousPage();
    store.previousPage();
    expect(store.pageIndex()).toBe(0);
  });

  it('narrows by issue and resets to the first page', () => {
    const { store } = setup(manyPayments(30));
    store.nextPage();
    store.setIssue('duplicate');
    expect(store.pageIndex()).toBe(0);
    expect(store.filtered()).toHaveLength(15);
    expect(store.filtered().every((p) => p.issue.type === 'duplicate')).toBe(true);
  });

  it('restores defaults on reset', () => {
    const { store } = setup();
    store.setNetwork('tron');
    store.setSearch('INV');
    store.resetFilters();
    expect(store.filtered()).toHaveLength(SEED_SIZE);
  });

  it('exposes the selected payment', () => {
    const { store } = setup();
    store.select('pay_seed_02');
    expect(store.selected()?.id).toBe('pay_seed_02');
  });

  it('goes offline when the stream fails', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { store, incoming } = setup();
    incoming.error(new Error('socket closed'));
    expect(store.connection()).toBe('offline');
  });
});
```

**Step 2: Run to verify it fails**

Run: `pnpm nx test payments-data-access`
Expected: FAIL — cannot resolve `./payments-store`.

**Step 3: Implement `payments-store.ts`**

```ts
import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { computeKpis, countByIssue, DEFAULT_FILTERS, DEMO_OPERATOR, filterPayments, type IssueFilter, type NetworkFilter, type PaymentStatus, type QueueFilters, type UnmatchedPayment } from '@unmatched-payments/payments-domain';
import { interval, map, switchMap, tap } from 'rxjs';
import { CLOCK } from './clock';
import { MockPaymentsApi } from './mock-payments-api';

export const PAGE_SIZE = 25;
const NOW_TICK_MS = 30_000;

export type Connection = 'live' | 'offline';

@Injectable({ providedIn: 'root' })
export class PaymentsStore {
  private readonly api = inject(MockPaymentsApi);
  private readonly clock = inject(CLOCK);

  private readonly paymentsState = signal<readonly UnmatchedPayment[]>([]);
  private readonly filtersState = signal<QueueFilters>(DEFAULT_FILTERS);
  private readonly pageState = signal(0);
  private readonly selectedIdState = signal<string | null>(null);
  private readonly lastArrivedIdState = signal<string | null>(null);
  private readonly connectionState = signal<Connection>('live');

  readonly filters = this.filtersState.asReadonly();
  readonly lastArrivedId = this.lastArrivedIdState.asReadonly();
  readonly connection = this.connectionState.asReadonly();
  readonly now = toSignal(interval(NOW_TICK_MS).pipe(map(() => this.clock())), { initialValue: this.clock() });

  readonly filtered = computed(() => filterPayments(this.paymentsState(), this.filtersState()));
  readonly issueCounts = computed(() => countByIssue(this.paymentsState(), this.filtersState()));
  readonly kpis = computed(() => computeKpis(this.paymentsState(), this.now(), DEMO_OPERATOR.id));
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)));
  readonly pageIndex = computed(() => Math.min(this.pageState(), this.pageCount() - 1));
  readonly pageRows = computed(() => {
    const start = this.pageIndex() * PAGE_SIZE;
    return this.filtered().slice(start, start + PAGE_SIZE);
  });
  readonly selected = computed(() => this.paymentsState().find((payment) => payment.id === this.selectedIdState()) ?? null);

  constructor() {
    this.api
      .list()
      .pipe(
        tap((payments) => this.paymentsState.set(payments)),
        switchMap(() => this.api.incoming$),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (payment) => {
          this.paymentsState.update((list) => [payment, ...list]);
          this.lastArrivedIdState.set(payment.id);
        },
        error: (error: unknown) => {
          console.error('Payments stream failed', error);
          this.connectionState.set('offline');
        },
      });
  }

  setIssue(issue: IssueFilter): void {
    this.patchFilters({ issue });
  }

  setNetwork(network: NetworkFilter): void {
    this.patchFilters({ network });
  }

  setStatuses(statuses: readonly PaymentStatus[]): void {
    this.patchFilters({ statuses });
  }

  setSearch(search: string): void {
    this.patchFilters({ search });
  }

  resetFilters(): void {
    this.filtersState.set(DEFAULT_FILTERS);
    this.pageState.set(0);
  }

  nextPage(): void {
    this.pageState.set(Math.min(this.pageIndex() + 1, this.pageCount() - 1));
  }

  previousPage(): void {
    this.pageState.set(Math.max(this.pageIndex() - 1, 0));
  }

  select(id: string | null): void {
    this.selectedIdState.set(id);
  }

  private patchFilters(patch: Partial<QueueFilters>): void {
    this.filtersState.update((filters) => ({ ...filters, ...patch }));
    this.pageState.set(0);
  }
}
```

**Step 4: Public API — `libs/payments/data-access/src/index.ts`**

```ts
export * from './lib/clock';
export * from './lib/mock-payments-api';
export * from './lib/payments-store';
```

**Step 5: Run to verify it passes**

Run: `pnpm nx test payments-data-access && pnpm nx lint payments-data-access`
Expected: PASS.

**Checkpoint:** `feat(data-access): add signal-based payments store`

---

### Task 10: Feature — presentation mapping

**Files:**

- Create: `libs/payments/feature-queue/src/lib/presentation.ts`
- Test: `libs/payments/feature-queue/src/lib/presentation.spec.ts`

**Step 1: Write the failing test**

```ts
import { createSeedPayments } from '@unmatched-payments/payments-domain';
import { computeKpis } from '@unmatched-payments/payments-domain';
import { toKpiTiles, toQueueRow } from './presentation';

const NOW = new Date('2026-10-07T15:10:00Z');
const seed = createSeedPayments(NOW);

describe('toQueueRow', () => {
  it('maps a payment to table cells', () => {
    expect(toQueueRow(seed[0]!, NOW)).toMatchObject({
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
    expect(toQueueRow(seed[13]!, NOW).ageBreached).toBe(true);
    expect(toQueueRow(seed[4]!, NOW).match).toBeNull();
  });
});

describe('toKpiTiles', () => {
  it('summarises the queue and warns about the oldest payment', () => {
    const tiles = toKpiTiles(computeKpis(seed, NOW, 'op_marta'), NOW);
    expect(tiles.map((t) => t.value)).toEqual(['14', expect.stringMatching(/^\$/), '2d 22h', '6']);
    expect(tiles[0]?.hint).toBe('+10 today');
    expect(tiles[2]).toMatchObject({ warning: true, hint: '3,450.00 USDT · past 24h SLA' });
  });
});
```

**Step 2: Run to verify it fails**

Run: `pnpm nx test payments-feature-queue`
Expected: FAIL — cannot resolve `./presentation`.

**Step 3: Implement**

```ts
import { formatAge, formatPaymentAmount, formatReceivedAt, formatUsd, ISSUE_LABELS, type IssueFilter, type IssueType, isSlaBreached, networkLabel, type PaymentStatus, type QueueKpis, shortenAddress, SLA_MS, STATUS_LABELS, type UnmatchedPayment } from '@unmatched-payments/payments-domain';

export interface KpiTileVm {
  readonly label: string;
  readonly value: string;
  readonly hint: string | null;
  readonly warning: boolean;
}

export interface MatchVm {
  readonly invoiceId: string;
  readonly confidence: string;
  readonly barClass: string;
}

export interface QueueRowVm {
  readonly id: string;
  readonly time: string;
  readonly age: string;
  readonly ageBreached: boolean;
  readonly amount: string;
  readonly token: string;
  readonly network: string;
  readonly from: string;
  readonly fromFull: string;
  readonly issueLabel: string;
  readonly issueDotClass: string;
  readonly note: string;
  readonly match: MatchVm | null;
  readonly statusLabel: string;
  readonly statusClass: string;
}

export const ISSUE_TAB_LABELS: Readonly<Record<IssueFilter, string>> = {
  all: 'All',
  ...ISSUE_LABELS,
  'no-invoice': 'No invoice',
};

const ISSUE_DOT_CLASSES: Readonly<Record<IssueType, string>> = {
  underpaid: 'bg-warning',
  overpaid: 'bg-warning',
  'wrong-network': 'bg-primary-text',
  'wrong-token': 'bg-primary-text',
  'no-invoice': 'bg-muted-foreground',
  'expired-invoice': 'bg-muted-foreground',
  duplicate: 'bg-muted-foreground',
};

const STATUS_CLASSES: Readonly<Record<PaymentStatus, string>> = {
  open: 'border-border-strong text-foreground-subtle',
  'in-review': 'border-primary-border bg-primary-soft text-primary-text',
  escalated: 'border-warning-border bg-warning-soft text-warning',
};

export function toQueueRow(payment: UnmatchedPayment, now: Date): QueueRowVm {
  const ageMs = now.getTime() - payment.receivedAt.getTime();
  const match = payment.suggestedMatch;
  return {
    id: payment.id,
    time: formatReceivedAt(payment.receivedAt, now),
    age: formatAge(ageMs),
    ageBreached: ageMs > SLA_MS,
    amount: formatPaymentAmount(payment),
    token: payment.token,
    network: networkLabel(payment.network, payment.token),
    from: shortenAddress(payment.fromAddress),
    fromFull: payment.fromAddress,
    issueLabel: ISSUE_LABELS[payment.issue.type],
    issueDotClass: ISSUE_DOT_CLASSES[payment.issue.type],
    note: payment.issue.note,
    match: match && {
      invoiceId: match.invoiceId,
      confidence: `${match.confidence}%`,
      barClass: confidenceBarClass(match.confidence),
    },
    statusLabel: STATUS_LABELS[payment.status],
    statusClass: STATUS_CLASSES[payment.status],
  };
}

export function toKpiTiles(kpis: QueueKpis, now: Date): KpiTileVm[] {
  const oldest = kpis.oldest;
  const breached = oldest !== null && isSlaBreached(oldest.receivedAt, now);
  return [
    { label: 'Unmatched', value: String(kpis.unmatchedCount), hint: `+${kpis.addedToday} today`, warning: false },
    { label: 'Total value', value: formatUsd(kpis.totalUsdCents), hint: 'USD equiv.', warning: false },
    {
      label: 'Oldest',
      value: oldest ? formatAge(now.getTime() - oldest.receivedAt.getTime()) : '—',
      hint: oldest ? `${formatPaymentAmount(oldest)} ${oldest.token}${breached ? ' · past 24h SLA' : ''}` : null,
      warning: breached,
    },
    { label: 'Assigned to you', value: String(kpis.assignedToOperator), hint: null, warning: false },
  ];
}

function confidenceBarClass(confidence: number): string {
  if (confidence >= 85) {
    return 'bg-primary';
  }
  return confidence >= 70 ? 'bg-muted-foreground' : 'bg-warning';
}
```

**Step 4: Run to verify it passes**

Run: `pnpm nx test payments-feature-queue`
Expected: PASS.

**Checkpoint:** `feat(queue): add row and kpi view models`

---

### Task 11: Feature — presentational components

**Files (all under `libs/payments/feature-queue/src/lib/`):**

- Create: `kpi-strip.ts`, `issue-tabs.ts`, `queue-filter-bar.ts`, `payments-table.ts`

**Step 0: Confirm the generated spartan select API**

Open `libs/ui/select/src/index.ts` (and the files it exports). Confirm the export names `HlmSelectImports` / `BrnSelectImports` and the element selectors used below (`brn-select`, `hlm-select-trigger`, `hlm-select-value`, `hlm-select-content`, `hlm-option`). If the generated version differs, adapt the template in Step 3 to the generated API — keep the bindings (`value`, `valueChange`, `multiple`) semantically the same.

**Step 1: `kpi-strip.ts`**

```ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { KpiTileVm } from './presentation';

@Component({
  selector: 'pay-kpi-strip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-wrap gap-2' },
  template: `
    @for (tile of tiles(); track tile.label) {
      <div class="flex items-baseline gap-2.5 rounded-lg border px-3 py-2" [class.border-border]="!tile.warning" [class.bg-card]="!tile.warning" [class.border-warning-border]="tile.warning" [class.bg-warning-soft]="tile.warning" [class.text-warning]="tile.warning">
        <span [class.text-muted-foreground]="!tile.warning">{{ tile.label }}</span>
        <span class="tabular font-mono text-base font-semibold">{{ tile.value }}</span>
        @if (tile.hint) {
          <span class="tabular font-mono text-xs" [class.text-muted-foreground]="!tile.warning">{{ tile.hint }}</span>
        }
      </div>
    }
  `,
})
export class KpiStrip {
  readonly tiles = input.required<readonly KpiTileVm[]>();
}
```

**Step 2: `issue-tabs.ts`**

```ts
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ISSUE_TYPES, type IssueCounts, type IssueFilter } from '@unmatched-payments/payments-domain';
import { ISSUE_TAB_LABELS } from './presentation';

const TAB_ORDER: readonly IssueFilter[] = ['all', ...ISSUE_TYPES];

@Component({
  selector: 'pay-issue-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block max-w-full self-start' },
  template: `
    <div role="group" aria-label="Issue type" class="flex flex-wrap gap-0.5 rounded-lg bg-muted p-[3px]">
      @for (tab of tabs; track tab.value) {
        @let pressed = tab.value === active();
        <button type="button" class="flex h-7 items-center gap-1.5 rounded-md px-2.5 font-medium" [class.bg-card]="pressed" [class.shadow-xs]="pressed" [class.text-foreground]="pressed" [class.text-foreground-subtle]="!pressed" [attr.aria-pressed]="pressed" (click)="selected.emit(tab.value)">
          {{ tab.label }}
          <span class="tabular font-mono text-[11px] text-muted-foreground">{{ counts()[tab.value] }}</span>
        </button>
      }
    </div>
  `,
})
export class IssueTabs {
  readonly counts = input.required<IssueCounts>();
  readonly active = input.required<IssueFilter>();
  readonly selected = output<IssueFilter>();

  protected readonly tabs = TAB_ORDER.map((value) => ({ value, label: ISSUE_TAB_LABELS[value] }));
}
```

**Step 3: `queue-filter-bar.ts`**

```ts
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCalendar, lucideChevronDown } from '@ng-icons/lucide';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { isNetworkId, isPaymentStatus, NETWORK_IDS, NETWORKS, type NetworkFilter, PAYMENT_STATUSES, type PaymentStatus, type QueueFilters, STATUS_LABELS } from '@unmatched-payments/payments-domain';

@Component({
  selector: 'pay-queue-filter-bar',
  imports: [BrnSelectImports, HlmSelectImports, HlmButton, NgIcon],
  providers: [provideIcons({ lucideCalendar, lucideChevronDown })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-wrap items-center gap-2' },
  template: `
    <brn-select class="inline-block" [value]="filters().network" (valueChange)="onNetworkChange($event)">
      <hlm-select-trigger class="h-[30px]" aria-label="Network">
        <span class="text-muted-foreground">Network</span>
        <hlm-select-value class="font-medium" />
      </hlm-select-trigger>
      <hlm-select-content>
        <hlm-option value="all">All</hlm-option>
        @for (network of networks; track network.id) {
          <hlm-option [value]="network.id">{{ network.name }}</hlm-option>
        }
      </hlm-select-content>
    </brn-select>

    <brn-select class="inline-block" [multiple]="true" [value]="filters().statuses" (valueChange)="onStatusesChange($event)">
      <hlm-select-trigger class="h-[30px]" aria-label="Status">
        <span class="text-muted-foreground">Status</span>
        <hlm-select-value class="font-medium" />
      </hlm-select-trigger>
      <hlm-select-content>
        @for (status of statuses; track status.value) {
          <hlm-option [value]="status.value">{{ status.label }}</hlm-option>
        }
      </hlm-select-content>
    </brn-select>

    <button hlmBtn variant="outline" size="sm" aria-disabled="true" title="Available in the Actions stage">
      <ng-icon name="lucideCalendar" size="14px" aria-hidden="true" />
      Last 7 days
    </button>
    <button hlmBtn variant="outline" size="sm" class="border-dashed" aria-disabled="true" title="Available in the Actions stage">
      <span class="text-muted-foreground">Assignee</span>
      Anyone
    </button>
    <button hlmBtn variant="ghost" size="sm" class="text-muted-foreground" (click)="reset.emit()">Reset</button>

    <span class="ml-auto text-muted-foreground">
      Showing <span class="tabular font-mono text-foreground">{{ shown() }}</span> of <span class="tabular font-mono text-foreground">{{ total() }}</span> · newest first
    </span>
  `,
})
export class QueueFilterBar {
  readonly filters = input.required<QueueFilters>();
  readonly shown = input.required<number>();
  readonly total = input.required<number>();
  readonly networkChange = output<NetworkFilter>();
  readonly statusesChange = output<PaymentStatus[]>();
  readonly reset = output<void>();

  protected readonly networks = NETWORK_IDS.map((id) => NETWORKS[id]);
  protected readonly statuses = PAYMENT_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }));

  protected onNetworkChange(value: unknown): void {
    if (value === 'all' || isNetworkId(value)) {
      this.networkChange.emit(value);
    }
  }

  protected onStatusesChange(value: unknown): void {
    this.statusesChange.emit(Array.isArray(value) ? value.filter(isPaymentStatus) : []);
  }
}
```

**Step 4: `payments-table.ts`**

```ts
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowDown, lucideChevronLeft, lucideChevronRight } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import type { QueueRowVm } from './presentation';

@Component({
  selector: 'pay-payments-table',
  imports: [RouterLink, NgIcon, HlmButton],
  providers: [provideIcons({ lucideArrowDown, lucideChevronLeft, lucideChevronRight })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block overflow-x-auto rounded-[10px] border border-border bg-card shadow-xs' },
  template: `
    <table class="w-full min-w-[1080px] border-collapse text-left">
      <caption class="sr-only">
        Unmatched payments, newest first
      </caption>
      <thead class="bg-subtle text-xs text-muted-foreground">
        <tr class="h-9 border-b border-border">
          <th scope="col" class="w-9 pl-3.5 font-medium">
            <input type="checkbox" class="m-0 accent-primary" aria-label="Select all payments on this page" />
          </th>
          <th scope="col" class="w-32 px-3 font-medium text-foreground">
            <span class="inline-flex items-center gap-1"> Time (UTC) <ng-icon name="lucideArrowDown" size="12px" aria-hidden="true" /> </span>
          </th>
          <th scope="col" class="w-44 px-3 text-right font-medium">Amount · network</th>
          <th scope="col" class="w-[150px] px-3 font-medium">From</th>
          <th scope="col" class="px-3 font-medium">Detected issue</th>
          <th scope="col" class="px-3 font-medium">Suggested match</th>
          <th scope="col" class="w-28 px-3 font-medium">Status</th>
          <th scope="col" class="w-10"><span class="sr-only">Open</span></th>
        </tr>
      </thead>
      <tbody>
        @for (row of rows(); track row.id) {
          <tr class="h-[52px] border-b border-border hover:bg-subtle" [class.row-arrived]="row.id === arrivedId()">
            <td class="pl-3.5">
              <input type="checkbox" class="m-0 accent-primary" [attr.aria-label]="'Select payment ' + row.amount + ' ' + row.token" />
            </td>
            <td class="px-3 py-1.5">
              <div class="flex flex-col">
                <span class="tabular font-mono">{{ row.time }}</span>
                <span class="text-xs leading-4" [class.text-warning]="row.ageBreached" [class.text-muted-foreground]="!row.ageBreached"> {{ row.age }} ago </span>
              </div>
            </td>
            <td class="px-3 py-1.5">
              <div class="flex flex-col items-end">
                <a [routerLink]="['/payments', row.id]" class="tabular font-mono font-medium whitespace-nowrap no-underline">
                  {{ row.amount }} <span class="font-normal text-muted-foreground">{{ row.token }}</span>
                </a>
                <span class="text-xs leading-4 whitespace-nowrap text-muted-foreground">{{ row.network }}</span>
              </div>
            </td>
            <td class="px-3 whitespace-nowrap">
              <span class="tabular font-mono text-foreground-subtle" [title]="row.fromFull">{{ row.from }}</span>
            </td>
            <td class="px-3 py-1.5">
              <div class="flex flex-col items-start gap-0.5">
                <span class="inline-flex h-[22px] items-center gap-1.5 rounded-md border border-border bg-muted px-2 text-xs font-medium whitespace-nowrap">
                  <span class="size-1.5 rounded-full" [class]="row.issueDotClass"></span>
                  {{ row.issueLabel }}
                </span>
                <span class="tabular font-mono text-xs leading-4 text-muted-foreground">{{ row.note }}</span>
              </div>
            </td>
            <td class="px-3">
              @if (row.match; as match) {
                <div class="flex items-center gap-2.5">
                  <span class="tabular w-[84px] font-mono text-foreground-subtle">{{ match.invoiceId }}</span>
                  <span class="block h-1 w-14 overflow-hidden rounded-sm bg-border" aria-hidden="true">
                    <span class="block h-1" [class]="match.barClass" [style.width]="match.confidence"></span>
                  </span>
                  <span class="tabular font-mono font-medium">{{ match.confidence }}</span>
                </div>
              } @else {
                <span class="text-muted-foreground">No candidates</span>
              }
            </td>
            <td class="px-3">
              <span class="inline-flex h-[22px] items-center rounded-full border px-2 text-xs font-medium whitespace-nowrap" [class]="row.statusClass">
                {{ row.statusLabel }}
              </span>
            </td>
            <td>
              <a [routerLink]="['/payments', row.id]" class="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted" [attr.aria-label]="'Open payment ' + row.amount + ' ' + row.token">
                <ng-icon name="lucideChevronRight" size="16px" aria-hidden="true" />
              </a>
            </td>
          </tr>
        } @empty {
          <tr>
            <td colspan="8" class="px-3.5 py-10 text-center text-muted-foreground">No payments match these filters.</td>
          </tr>
        }
      </tbody>
    </table>
    <div class="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 text-muted-foreground">
      <span>Rows per page <span class="tabular ml-1.5 rounded-md border border-border px-2 py-0.5 font-mono text-foreground">25</span></span>
      <div class="flex items-center gap-2">
        <span class="tabular font-mono">Page {{ pageIndex() + 1 }} of {{ pageCount() }}</span>
        <button hlmBtn variant="outline" size="icon" class="size-[30px]" aria-label="Previous page" [disabled]="pageIndex() === 0" (click)="previousPage.emit()">
          <ng-icon name="lucideChevronLeft" size="14px" aria-hidden="true" />
        </button>
        <button hlmBtn variant="outline" size="icon" class="size-[30px]" aria-label="Next page" [disabled]="pageIndex() >= pageCount() - 1" (click)="nextPage.emit()">
          <ng-icon name="lucideChevronRight" size="14px" aria-hidden="true" />
        </button>
      </div>
    </div>
  `,
})
export class PaymentsTable {
  readonly rows = input.required<readonly QueueRowVm[]>();
  readonly arrivedId = input<string | null>(null);
  readonly pageIndex = input.required<number>();
  readonly pageCount = input.required<number>();
  readonly previousPage = output<void>();
  readonly nextPage = output<void>();
}
```

**Step 5: Verify compile + lint**

Run: `pnpm nx lint payments-feature-queue && pnpm nx test payments-feature-queue`
Expected: PASS (template type-checking happens in Task 12's build).

**Checkpoint:** `feat(queue): add kpi, tabs, filter bar and table components`

---

### Task 12: Feature — Queue page container

**Files:**

- Create: `libs/payments/feature-queue/src/lib/queue-page.ts`
- Modify: `libs/payments/feature-queue/src/index.ts`
- Test: `libs/payments/feature-queue/src/lib/queue-page.spec.ts`

**Step 1: Write the failing smoke test**

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CLOCK, MockPaymentsApi } from '@unmatched-payments/payments-data-access';
import { createSeedPayments } from '@unmatched-payments/payments-domain';
import { NEVER, of } from 'rxjs';
import { QueuePage } from './queue-page';

const NOW = new Date('2026-10-07T15:10:00Z');

describe('QueuePage', () => {
  beforeEach(() => {
    const api: Pick<MockPaymentsApi, 'list' | 'incoming$'> = {
      list: () => of(createSeedPayments(NOW)),
      incoming$: NEVER,
    };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: MockPaymentsApi, useValue: api }, { provide: CLOCK, useValue: () => NOW }],
    });
  });

  it('renders the seed queue and filters it by issue', async () => {
    const fixture = TestBed.createComponent(QueuePage);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelectorAll('tbody tr')).toHaveLength(14);

    const duplicateTab = [...element.querySelectorAll<HTMLButtonElement>('[aria-label="Issue type"] button')].find((button) => button.textContent?.includes('Duplicate'));
    duplicateTab?.click();
    await fixture.whenStable();

    expect(element.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(duplicateTab?.getAttribute('aria-pressed')).toBe('true');
  });
});
```

**Step 2: Run to verify it fails**

Run: `pnpm nx test payments-feature-queue`
Expected: FAIL — cannot resolve `./queue-page`.

**Step 3: Implement `queue-page.ts`**

```ts
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideDownload } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { PaymentsStore } from '@unmatched-payments/payments-data-access';
import { IssueTabs } from './issue-tabs';
import { KpiStrip } from './kpi-strip';
import { PaymentsTable } from './payments-table';
import { toKpiTiles, toQueueRow } from './presentation';
import { QueueFilterBar } from './queue-filter-bar';

@Component({
  selector: 'pay-queue-page',
  imports: [HlmButton, NgIcon, KpiStrip, IssueTabs, QueueFilterBar, PaymentsTable],
  providers: [provideIcons({ lucideDownload })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0 flex-col gap-4' },
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="flex flex-col gap-1">
        <h1 class="m-0 text-xl leading-7 font-semibold tracking-[-0.01em]">Unmatched payments</h1>
        <p class="m-0 text-muted-foreground">Incoming transfers the matcher couldn't tie to an invoice. Every action here moves money and is logged.</p>
      </div>
      <div class="flex gap-2">
        <button hlmBtn variant="outline" size="sm" aria-disabled="true" title="Available in the Actions stage">
          <ng-icon name="lucideDownload" size="14px" aria-hidden="true" />
          Export CSV
        </button>
        <button hlmBtn variant="outline" size="sm" aria-disabled="true" title="Available in the Actions stage">Tolerance rules</button>
      </div>
    </div>

    <pay-kpi-strip [tiles]="kpiTiles()" />

    <pay-issue-tabs [counts]="store.issueCounts()" [active]="store.filters().issue" (selected)="store.setIssue($event)" />

    <pay-queue-filter-bar [filters]="store.filters()" [shown]="rows().length" [total]="store.filtered().length" (networkChange)="store.setNetwork($event)" (statusesChange)="store.setStatuses($event)" (reset)="store.resetFilters()" />

    <pay-payments-table [rows]="rows()" [arrivedId]="store.lastArrivedId()" [pageIndex]="store.pageIndex()" [pageCount]="store.pageCount()" (previousPage)="store.previousPage()" (nextPage)="store.nextPage()" />
  `,
})
export class QueuePage {
  protected readonly store = inject(PaymentsStore);
  protected readonly kpiTiles = computed(() => toKpiTiles(this.store.kpis(), this.store.now()));
  protected readonly rows = computed(() => this.store.pageRows().map((p) => toQueueRow(p, this.store.now())));
}
```

**Step 4: Public API — `libs/payments/feature-queue/src/index.ts`**

```ts
export { QueuePage } from './lib/queue-page';
```

**Step 5: Run to verify it passes**

Run: `pnpm nx test payments-feature-queue && pnpm nx lint payments-feature-queue`
Expected: PASS.

**Checkpoint:** `feat(queue): add unmatched payments queue page`

---

### Task 13: App shell — layout, routing, theme

**Files (under `apps/admin/src/app/`):**

- Create: `theme.service.ts`, `layout/sidebar.ts`, `layout/top-bar.ts`, `layout/shell.ts`, `payment-detail-placeholder.ts`
- Modify: `app.routes.ts`, `app.config.ts`, `app.ts` (+ delete generated `nx-welcome*` and the sample `app.html`/`app.css` content)

**Step 1: `theme.service.ts`**

```ts
import { DOCUMENT, effect, inject, Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'payments-ops-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly root = inject(DOCUMENT).documentElement;

  readonly theme = signal<Theme>(this.root.classList.contains('dark') ? 'dark' : 'light');

  constructor() {
    effect(() => {
      const theme = this.theme();
      this.root.classList.toggle('dark', theme === 'dark');
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        // Storage can be blocked (private mode); the theme then lives for the session only.
      }
    });
  }

  toggle(): void {
    this.theme.update((theme) => (theme === 'dark' ? 'light' : 'dark'));
  }
}
```

(`STORAGE_KEY` must match the inline script in `index.html` from Task 2.)

**Step 2: `layout/sidebar.ts`**

```ts
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowDownLeft, lucideArrowUpRight, lucideFileText, lucideHistory, lucideLayoutDashboard, lucideSlidersVertical, lucideStore, lucideUndo2, lucideUnlink } from '@ng-icons/lucide';
import { PaymentsStore } from '@unmatched-payments/payments-data-access';
import { DEMO_OPERATOR } from '@unmatched-payments/payments-domain';

interface NavItem {
  readonly label: string;
  readonly icon: string;
  readonly link?: string;
}

interface NavSection {
  readonly title: string;
  readonly items: readonly NavItem[];
}

const NAV: readonly NavSection[] = [
  {
    title: 'PAYMENTS',
    items: [
      { label: 'Overview', icon: 'lucideLayoutDashboard' },
      { label: 'Incoming', icon: 'lucideArrowDownLeft' },
      { label: 'Invoices', icon: 'lucideFileText' },
      { label: 'Unmatched', icon: 'lucideUnlink', link: '/payments/unmatched' },
      { label: 'Refunds', icon: 'lucideUndo2' },
      { label: 'Payouts', icon: 'lucideArrowUpRight' },
    ],
  },
  {
    title: 'ADMIN',
    items: [
      { label: 'Merchants', icon: 'lucideStore' },
      { label: 'Audit log', icon: 'lucideHistory' },
      { label: 'Matching rules', icon: 'lucideSlidersVertical' },
    ],
  },
];

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, NgIcon],
  providers: [
    provideIcons({
      lucideArrowDownLeft,
      lucideArrowUpRight,
      lucideFileText,
      lucideHistory,
      lucideLayoutDashboard,
      lucideSlidersVertical,
      lucideStore,
      lucideUndo2,
      lucideUnlink,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex grow basis-[232px] flex-col gap-4 border-r border-border bg-subtle px-2.5 py-3' },
  template: `
    <div class="flex items-center gap-2.5 px-1.5 py-1">
      <div class="flex size-[26px] items-center justify-center rounded-[7px] bg-primary" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24">
          <rect x="2.5" y="2.5" width="12" height="12" rx="3.5" fill="#ffffff" fill-opacity="0.5" />
          <rect x="9.5" y="9.5" width="12" height="12" rx="3.5" fill="#ffffff" />
        </svg>
      </div>
      <div class="flex flex-col leading-4">
        <span class="font-semibold">Payments Ops</span>
        <span class="text-xs text-muted-foreground">Operator console</span>
      </div>
      <span class="ml-auto rounded-[5px] border border-border px-1.5 font-mono text-[11px]" [class.text-muted-foreground]="isLive()" [class.text-destructive]="!isLive()">
        {{ isLive() ? 'LIVE' : 'OFFLINE' }}
      </span>
    </div>

    <nav aria-label="Main" class="flex flex-col gap-0.5">
      @for (section of nav; track section.title) {
        <span class="px-2 pt-3 pb-1 text-[11px] font-medium tracking-[0.02em] text-muted-foreground first:pt-1.5">
          {{ section.title }}
        </span>
        @for (item of section.items; track item.label) {
          @if (item.link) {
            <a [routerLink]="item.link" routerLinkActive="bg-muted font-medium !text-foreground" ariaCurrentWhenActive="page" class="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-foreground-subtle no-underline hover:bg-muted hover:text-foreground">
              <ng-icon [name]="item.icon" size="16px" aria-hidden="true" />
              {{ item.label }}
              <span class="tabular ml-auto rounded-[5px] bg-primary px-1.5 font-mono text-[11px] leading-[18px] text-primary-foreground">
                {{ unmatchedCount() }}
              </span>
            </a>
          } @else {
            <span aria-disabled="true" title="Not part of this demo" class="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-foreground-subtle">
              <ng-icon [name]="item.icon" size="16px" aria-hidden="true" />
              {{ item.label }}
            </span>
          }
        }
      }
    </nav>

    <div class="mt-auto flex items-center gap-2.5 border-t border-border p-2">
      <div class="flex size-7 items-center justify-center rounded-full bg-border text-[11px] font-semibold text-foreground-subtle" aria-hidden="true">
        {{ operator.initials }}
      </div>
      <div class="flex min-w-0 flex-col leading-4">
        <span class="font-medium">{{ operator.name }}</span>
        <span class="text-xs text-muted-foreground">{{ operator.role }}</span>
      </div>
    </div>
  `,
})
export class Sidebar {
  private readonly store = inject(PaymentsStore);

  protected readonly nav = NAV;
  protected readonly operator = DEMO_OPERATOR;
  protected readonly isLive = computed(() => this.store.connection() === 'live');
  protected readonly unmatchedCount = computed(() => this.store.kpis().unmatchedCount);
}
```

**Step 3: `layout/top-bar.ts`**

```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBell, lucideMoon, lucideSearch, lucideSun } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { PaymentsStore } from '@unmatched-payments/payments-data-access';
import { ThemeService } from '../theme.service';

@Component({
  selector: 'app-top-bar',
  imports: [NgIcon, HlmButton],
  providers: [provideIcons({ lucideBell, lucideMoon, lucideSearch, lucideSun })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-h-[52px] flex-wrap items-center gap-3 border-b border-border px-6 py-2' },
  template: `
    <nav aria-label="Breadcrumb" class="flex items-center gap-1.5 text-muted-foreground">
      <span>Payments</span>
      <span aria-hidden="true">/</span>
      <span class="font-medium text-foreground" aria-current="page">Unmatched</span>
    </nav>

    <div class="ml-auto flex items-center gap-2">
      <label class="flex h-8 w-[300px] max-w-full items-center gap-2 rounded-[7px] border border-border bg-card px-2.5 text-muted-foreground focus-within:ring-2 focus-within:ring-ring">
        <ng-icon name="lucideSearch" size="14px" aria-hidden="true" />
        <span class="sr-only">Search payments</span>
        <input #search type="search" placeholder="Tx hash, address, invoice ID" class="min-w-0 flex-1 border-0 bg-transparent text-foreground outline-none" [value]="store.filters().search" (input)="store.setSearch(search.value)" />
      </label>

      <button hlmBtn variant="outline" size="icon" class="size-8" [attr.aria-label]="isDark() ? 'Switch to light theme' : 'Switch to dark theme'" (click)="theme.toggle()">
        <ng-icon [name]="isDark() ? 'lucideSun' : 'lucideMoon'" size="16px" aria-hidden="true" />
      </button>
      <button hlmBtn variant="outline" size="icon" class="size-8" aria-label="Notifications">
        <ng-icon name="lucideBell" size="16px" aria-hidden="true" />
      </button>
    </div>
  `,
})
export class TopBar {
  protected readonly store = inject(PaymentsStore);
  protected readonly theme = inject(ThemeService);
  protected readonly isDark = () => this.theme.theme() === 'dark';
}
```

**Step 4: `layout/shell.ts`**

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Sidebar, TopBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-h-dvh flex-wrap items-stretch bg-background text-foreground' },
  template: `
    <app-sidebar />
    <div class="flex min-w-0 grow-[999] basis-[560px] flex-col">
      <app-top-bar />
      <main class="p-6">
        <router-outlet />
      </main>
    </div>
  `,
})
export class Shell {}
```

**Step 5: `payment-detail-placeholder.ts`**

```ts
import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PaymentsStore } from '@unmatched-payments/payments-data-access';

@Component({
  selector: 'app-payment-detail-placeholder',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-3">
      <a routerLink="/payments/unmatched" class="text-muted-foreground">← Back to queue</a>
      <h1 class="m-0 text-xl font-semibold">Payment detail</h1>
      @if (store.selected(); as payment) {
        <p class="m-0 font-mono text-muted-foreground break-all">{{ payment.txHash }}</p>
      } @else {
        <p class="m-0 text-muted-foreground">Payment not found.</p>
      }
      <p class="m-0 text-muted-foreground">Matching candidates and operator actions arrive in the next stage.</p>
    </div>
  `,
})
export class PaymentDetailPlaceholder {
  protected readonly store = inject(PaymentsStore);
  readonly id = input.required<string>();

  constructor() {
    effect(() => this.store.select(this.id()));
  }
}
```

**Step 6: `app.routes.ts`**

```ts
import type { Route } from '@angular/router';
import { Shell } from './layout/shell';

export const appRoutes: Route[] = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'payments/unmatched' },
      {
        path: 'payments/unmatched',
        title: 'Unmatched payments · Payments Ops',
        loadComponent: () => import('@unmatched-payments/payments-feature-queue').then((m) => m.QueuePage),
      },
      {
        path: 'payments/:id',
        title: 'Payment · Payments Ops',
        loadComponent: () => import('./payment-detail-placeholder').then((m) => m.PaymentDetailPlaceholder),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
```

**Step 7: `app.config.ts` and `app.ts`**

In `app.config.ts` change `provideRouter(appRoutes)` → `provideRouter(appRoutes, withComponentInputBinding())` (import `withComponentInputBinding` from `@angular/router`). Keep the other generated providers.

Replace `app.ts` with:

```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<router-outlet />',
})
export class App {
  // Eager inject so the theme effect runs before the first route renders.
  private readonly theme = inject(ThemeService);
}
```

Delete `nx-welcome.ts`, `app.html`, `app.css` if generated; update/remove the generated `app.spec.ts` (it asserts the welcome text) — replace it with:

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  it('creates', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    expect(TestBed.createComponent(App).componentInstance).toBeTruthy();
  });
});
```

**Step 8: Verify boundaries actually bite**

Temporarily add `import '@unmatched-payments/payments-feature-queue';` to `libs/payments/domain/src/lib/money.ts`.
Run: `pnpm nx lint payments-domain`
Expected: FAIL with `A project tagged with "type:domain" can only depend on libs tagged with "type:domain"`.
Revert the import.

**Step 9: Verify**

Run: `pnpm nx run-many -t lint test build`
Expected: all PASS.

**Checkpoint:** `feat(admin): add shell layout, routing and theme toggle`

---

### Task 14: Final verification

Use @verification-before-completion.

**Step 1: Format**

Run: `pnpm nx format:write`

**Step 2: Full check**

Run: `pnpm nx run-many -t lint test build`
Expected: all PASS, no warnings about module boundaries.

**Step 3: Manual check in the browser**

Run: `pnpm nx serve admin` → open the printed URL.

- `/` redirects to `/payments/unmatched`; 14 rows visible, KPIs `14 / $… / 2d 22h (warning) / 6`.
- Every ~6 s a new row appears on top with a brief highlight; Unmatched count in the sidebar and KPI increments; issue tab counts update.
- Issue tabs, Network select, Status multi-select, search (try `INV-20418`, `TJR7n`) narrow the table; "Showing X of Y" matches; Reset restores all.
- After ~70 s (>25 rows) pagination enables; filter change resets to page 1.
- Theme toggle switches light/dark, persists after reload, no flash of the wrong theme.
- Keyboard: Tab reaches tabs, selects, row links and pagination; focus ring visible.
- Amount / chevron link opens `/payments/:id` placeholder with the tx hash; Back returns.
- Narrow window (~400px): sidebar stacks above content, table scrolls horizontally inside its card.

**Step 4: Report** results to the user (what passed, what deviated). Do not commit or push unless asked.
