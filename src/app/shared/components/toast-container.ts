import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed right-4 top-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      @for (item of notifications.items(); track item.id) {
        <div
          class="flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm shadow"
          [class]="
            item.kind === 'success'
              ? 'border-green-200 bg-green-50 text-green-900'
              : 'border-red-200 bg-red-50 text-red-900'
          "
        >
          <span>{{ item.text }}</span>
          <button
            type="button"
            class="font-medium opacity-60 hover:opacity-100"
            aria-label="Dismiss message"
            (click)="notifications.dismiss(item.id)"
          >
            ✕
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainer {
  protected readonly notifications = inject(NotificationService);
}
