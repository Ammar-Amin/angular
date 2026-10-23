import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="py-16 text-center">
      <p class="text-5xl font-bold text-slate-300">404</p>
      <h1 class="mt-3 text-xl font-semibold text-slate-900">Page not found</h1>
      <p class="mt-1 text-slate-600">The page you're looking for doesn't exist.</p>
      <a routerLink="/tasks" class="mt-5 inline-block text-indigo-700 underline">Back to tasks</a>
    </section>
  `,
})
export class NotFoundPage {}
