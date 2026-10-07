# Unmatched Payments — Queue screen design

Date: 2026-10-07
Source design: Design canvas "Unmatched Payments" → artboards `Queue · light` / `Queue · dark`.

## Goal

Portfolio pet project: an operator console for crypto payments that the matcher could not tie to an
invoice. No backend — a mock RxJS stream feeds the UI. This stage covers the **Queue screen only**.

## Stack

Nx (pnpm), Angular standalone components, signals for state, RxJS for the mock stream,
spartan/ui (helm) + Tailwind.

## Projects and boundaries

| Project                       | Tags                                 | Contents                                                       |
| ----------------------------- | ------------------------------------ | -------------------------------------------------------------- |
| `apps/admin`                  | `type:app`                           | Router, layout shell (sidebar + header), theme toggle          |
| `libs/payments/feature-queue` | `scope:payments`, `type:feature`     | Queue page + presentational parts                              |
| `libs/payments/data-access`   | `scope:payments`, `type:data-access` | `MockPaymentsApi`, `PaymentsStore`                             |
| `libs/payments/domain`        | `scope:payments`, `type:domain`      | Types, money, filtering, KPI math, mock generator (no Angular) |
| `libs/ui/*`                   | `scope:shared`, `type:ui`            | spartan helm components                                        |

Dependency rule: `app → feature → data-access → domain`; `ui` is importable by `feature` and `app`.
Enforced via `@nx/enforce-module-boundaries`.

## Domain model

- `UnmatchedPayment`: `id`, `txHash`, `receivedAt`, `amount`, `token`, `network`, `fromAddress`,
  `issue { type, note }`, `suggestedMatch { invoiceId, confidence } | null`,
  `status: 'open' | 'in-review' | 'escalated'`, `assigneeId`.
- `IssueType`: `underpaid | overpaid | wrong-network | wrong-token | no-invoice | expired-invoice | duplicate`.
- Money: `bigint` minor units + token `decimals`, never `number`. USD equivalent: stablecoins 1:1,
  ETH/BTC via fixed mock rates.

## Data flow

- `MockPaymentsApi.incoming$`: emits 14 seed payments (from the design), then `interval(~6s)` +
  deterministic PRNG generator emits new payments with one of the 7 issue types.
- `PaymentsStore` subscribes (`takeUntilDestroyed`) and holds signals:
  `payments`, `filters { issue, statuses, network, search }`, `selectedId`;
  computed: `filtered`, `issueCounts`, `kpis` (count, total USD, oldest + SLA breach, assigned to me), `page`.
- Relative time ("18m ago"): a `now` signal fed by `interval(30s)`.

## Queue screen scope

Live: KPI tiles, issue tabs with counts, Network/Status filters, search (tx hash / address / invoice),
table with issue & status badges, confidence bar, SLA highlight, client pagination (25/page),
new rows highlighted on arrival, light/dark theme (`.dark` class, persisted to `localStorage`).

Visual only (activated in the Actions stage): Date range, Assignee, Export CSV, row checkboxes.
Row click sets `selectedId` and navigates to a `/payments/:id` stub. Other sidebar items are `aria-disabled`.

## Testing

- `domain`: unit tests for filtering, KPIs, money formatting, generator.
- `MockPaymentsApi`: marble tests via `TestScheduler`.
- `PaymentsStore`: computed-state tests.
- Lint including module boundaries. Test runner: Nx Angular default.

## Out of scope (this stage)

Payment detail, matching candidates, operator actions + audit log, deployment.
