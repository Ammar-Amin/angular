import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TaskFilters,
  TaskPriority,
  TaskStatus,
} from '../../../core/models/task.model';

@Component({
  selector: 'app-task-filter-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
      <label class="block text-sm">
        <span class="mb-1 block text-slate-600">Search by title</span>
        <input
          type="search"
          class="w-full rounded-md border border-slate-300 px-3 py-2"
          placeholder="Search tasks…"
          [value]="filters().query"
          (input)="onQuery($event)"
        />
      </label>

      <label class="block text-sm">
        <span class="mb-1 block text-slate-600">Status</span>
        <select
          class="w-full rounded-md border border-slate-300 bg-white px-3 py-2"
          [value]="filters().status"
          (change)="onStatus($event)"
        >
          <option value="all">All statuses</option>
          @for (s of statuses; track s) {
            <option [value]="s">{{ statusLabels[s] }}</option>
          }
        </select>
      </label>

      <label class="block text-sm">
        <span class="mb-1 block text-slate-600">Priority</span>
        <select
          class="w-full rounded-md border border-slate-300 bg-white px-3 py-2"
          [value]="filters().priority"
          (change)="onPriority($event)"
        >
          <option value="all">All priorities</option>
          @for (p of priorities; track p) {
            <option [value]="p">{{ priorityLabels[p] }}</option>
          }
        </select>
      </label>
    </div>
  `,
})
export class TaskFilterBar {
  readonly filters = input.required<TaskFilters>();
  readonly changed = output<Partial<TaskFilters>>();

  protected readonly statuses: readonly TaskStatus[] = TASK_STATUSES;
  protected readonly priorities: readonly TaskPriority[] = TASK_PRIORITIES;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly priorityLabels = PRIORITY_LABELS;

  protected onQuery(event: Event): void {
    this.changed.emit({ query: (event.target as HTMLInputElement).value });
  }

  protected onStatus(event: Event): void {
    this.changed.emit({ status: (event.target as HTMLSelectElement).value as TaskStatus | 'all' });
  }

  protected onPriority(event: Event): void {
    this.changed.emit({
      priority: (event.target as HTMLSelectElement).value as TaskPriority | 'all',
    });
  }
}
