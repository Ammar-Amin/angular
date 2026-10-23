import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PRIORITY_LABELS, STATUS_LABELS, Task } from '../../../core/models/task.model';
import { isOverdue } from '../../../core/utils/date';

@Component({
  selector: 'app-task-card',
  imports: [DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <article
      class="rounded-lg border bg-white p-4"
      [class]="overdue() ? 'border-red-300' : 'border-slate-200'"
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <h3
            class="font-medium text-slate-900"
            [class.line-through]="task().status === 'completed'"
          >
            {{ task().title }}
          </h3>
          @if (task().description) {
            <p class="mt-1 text-sm text-slate-600">{{ task().description }}</p>
          }
        </div>
        <div class="flex shrink-0 gap-3 text-sm">
          <a [routerLink]="['/tasks', task().id, 'edit']" class="text-indigo-700 hover:underline">
            Edit
          </a>
          <button type="button" class="text-red-700 hover:underline" (click)="remove.emit(task())">
            Delete
          </button>
        </div>
      </div>

      <div class="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span class="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
          {{ statusLabels[task().status] }}
        </span>
        <span class="rounded-full px-2 py-0.5" [class]="priorityClass()">
          {{ priorityLabels[task().priority] }} priority
        </span>
        <span class="text-slate-500">Due {{ task().dueDate | date: 'mediumDate' }}</span>
        @if (overdue()) {
          <span class="rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-800">Overdue</span>
        }
      </div>
    </article>
  `,
})
export class TaskCard {
  readonly task = input.required<Task>();
  readonly remove = output<Task>();

  protected readonly statusLabels = STATUS_LABELS;
  protected readonly priorityLabels = PRIORITY_LABELS;

  protected readonly overdue = computed(() => isOverdue(this.task()));
  protected readonly priorityClass = computed(
    () =>
      ({
        low: 'bg-slate-100 text-slate-700',
        medium: 'bg-amber-100 text-amber-800',
        high: 'bg-rose-100 text-rose-800',
      })[this.task().priority],
  );
}
