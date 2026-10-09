import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

const STORAGE_KEY = 'payments-ops-theme';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.add('dark');
  });

  it('does not persist the system-derived theme on startup', () => {
    const theme = TestBed.inject(ThemeService);
    TestBed.tick();
    expect(theme.theme()).toBe('dark');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('persists and applies an explicit toggle', () => {
    const theme = TestBed.inject(ThemeService);
    theme.toggle();
    TestBed.tick();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
