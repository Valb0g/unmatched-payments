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
        loadComponent: () =>
          import('@unmatched-payments/payments-feature-queue').then(
            (m) => m.QueuePage,
          ),
      },
      {
        path: 'payments/:id',
        title: 'Payment · Payments Ops',
        loadComponent: () =>
          import('./payment-detail-placeholder').then(
            (m) => m.PaymentDetailPlaceholder,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
