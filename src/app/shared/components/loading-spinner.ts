import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex items-center justify-center gap-3 py-12 text-slate-500" role="status">
      <span
        class="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600"
        aria-hidden="true"
      ></span>
      <span>{{ label() }}</span>
    </div>
  `,
})
export class LoadingSpinner {
  readonly label = input('Loading…');
}
