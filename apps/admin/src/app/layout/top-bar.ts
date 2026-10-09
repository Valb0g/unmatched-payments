import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBell,
  lucideMoon,
  lucideSearch,
  lucideSun,
} from '@ng-icons/lucide';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  type ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
  RouterLink,
} from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { PaymentsStore } from '@unmatched-payments/payments-data-access';
import { filter, map } from 'rxjs';
import { ThemeService } from '../theme.service';
import { type Breadcrumb, BREADCRUMBS_KEY } from './breadcrumbs';

@Component({
  selector: 'app-top-bar',
  imports: [NgIcon, HlmButton, RouterLink],
  providers: [
    provideIcons({ lucideBell, lucideMoon, lucideSearch, lucideSun }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'flex min-h-[52px] flex-wrap items-center gap-3 border-b border-border px-6 py-2',
  },
  template: `
    <nav
      aria-label="Breadcrumb"
      class="flex items-center gap-1.5 text-muted-foreground"
    >
      <span>Payments</span>
      @for (crumb of breadcrumbs(); track crumb.label; let last = $last) {
        <span aria-hidden="true">/</span>
        @if (last) {
          <span class="font-medium text-foreground" aria-current="page">
            {{ crumb.label }}
          </span>
        } @else if (crumb.link) {
          <a [routerLink]="crumb.link" class="hover:text-foreground">
            {{ crumb.label }}
          </a>
        } @else {
          <span>{{ crumb.label }}</span>
        }
      }
    </nav>

    <div class="ml-auto flex items-center gap-2">
      <label
        class="flex h-8 w-[300px] max-w-full items-center gap-2 rounded-[7px] border border-border bg-card px-2.5 text-muted-foreground focus-within:ring-2 focus-within:ring-ring"
      >
        <ng-icon name="lucideSearch" size="14px" aria-hidden="true" />
        <span class="sr-only">Search payments</span>
        <input
          #search
          type="search"
          placeholder="Tx hash, address, invoice ID"
          class="min-w-0 flex-1 border-0 bg-transparent text-foreground outline-none"
          [value]="store.filters().search"
          (input)="store.setSearch(search.value)"
        />
      </label>

      <button
        hlmBtn
        variant="outline"
        size="icon"
        class="size-8"
        [attr.aria-label]="
          isDark() ? 'Switch to light theme' : 'Switch to dark theme'
        "
        (click)="theme.toggle()"
      >
        <ng-icon
          [name]="isDark() ? 'lucideSun' : 'lucideMoon'"
          size="16px"
          aria-hidden="true"
        />
      </button>
      <button
        hlmBtn
        variant="outline"
        size="icon"
        class="size-8"
        aria-label="Notifications"
      >
        <ng-icon name="lucideBell" size="16px" aria-hidden="true" />
      </button>
    </div>
  `,
})
export class TopBar {
  protected readonly store = inject(PaymentsStore);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  protected readonly breadcrumbs = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => breadcrumbsOf(this.router.routerState.snapshot.root)),
    ),
    { initialValue: breadcrumbsOf(this.router.routerState.snapshot.root) },
  );
  protected readonly isDark = computed(() => this.theme.theme() === 'dark');
}

function breadcrumbsOf(root: ActivatedRouteSnapshot): readonly Breadcrumb[] {
  let route = root;
  while (route.firstChild) {
    route = route.firstChild;
  }
  return (
    (route.data[BREADCRUMBS_KEY] as readonly Breadcrumb[] | undefined) ?? []
  );
}
