import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'cancelled.emit()' },
  template: `
    <div class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
      <div
        class="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        <h2 id="confirm-title" class="text-lg font-semibold text-slate-900">{{ title() }}</h2>
        <p id="confirm-message" class="mt-2 text-sm text-slate-600">{{ message() }}</p>
        <div class="mt-5 flex justify-end gap-2">
          <button
            type="button"
            autofocus
            class="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            (click)="cancelled.emit()"
          >
            Cancel
          </button>
          <button
            type="button"
            class="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            [disabled]="busy()"
            (click)="confirmed.emit()"
          >
            {{ confirmLabel() }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDialog {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input('Confirm');
  readonly busy = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
