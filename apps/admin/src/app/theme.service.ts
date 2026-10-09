import { DOCUMENT, effect, inject, Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'payments-ops-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly root = inject(DOCUMENT).documentElement;

  readonly theme = signal<Theme>(
    this.root.classList.contains('dark') ? 'dark' : 'light',
  );

  constructor() {
    effect(() => this.root.classList.toggle('dark', this.theme() === 'dark'));
  }

  // Only an explicit choice is stored, so an untouched app keeps following the OS theme.
  toggle(): void {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be blocked (private mode); the theme then lives for the session only.
    }
  }
}
