import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TaskStats } from '../../../core/models/task.model';

@Component({
  selector: 'app-task-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <dl class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      @for (item of items(); track item.label) {
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <dt class="text-xs tracking-wide text-slate-500 uppercase">{{ item.label }}</dt>
          <dd class="mt-1 text-2xl font-semibold" [class]="item.accent">{{ item.value }}</dd>
        </div>
      }
    </dl>
  `,
})
export class TaskSummary {
  readonly stats = input.required<TaskStats>();

  protected items() {
    const s = this.stats();
    return [
      { label: 'Total', value: s.total, accent: 'text-slate-900' },
      { label: 'Completed', value: s.completed, accent: 'text-green-700' },
      { label: 'In progress', value: s.inProgress, accent: 'text-blue-700' },
      { label: 'Overdue', value: s.overdue, accent: 'text-red-700' },
    ];
  }
}
