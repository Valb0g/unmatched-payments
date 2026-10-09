import type { Route } from '@angular/router';
import { BREADCRUMBS_KEY, type Breadcrumb } from './layout/breadcrumbs';
import { Shell } from './layout/shell';

const UNMATCHED: Breadcrumb = {
  label: 'Unmatched',
  link: '/payments/unmatched',
};

export const appRoutes: Route[] = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'payments/unmatched' },
      {
        path: 'payments/unmatched',
        title: 'Unmatched payments · Payments Ops',
        data: { [BREADCRUMBS_KEY]: [UNMATCHED] },
        loadComponent: () =>
          import('@unmatched-payments/payments-feature-queue').then(
            (m) => m.QueuePage,
          ),
      },
      {
        path: 'payments/:id',
        title: 'Payment · Payments Ops',
        data: { [BREADCRUMBS_KEY]: [UNMATCHED, { label: 'Payment' }] },
        loadComponent: () =>
          import('./payment-detail-placeholder').then(
            (m) => m.PaymentDetailPlaceholder,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
