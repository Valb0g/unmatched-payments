import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Sidebar, TopBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'flex min-h-dvh flex-wrap items-stretch bg-background text-foreground',
  },
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
