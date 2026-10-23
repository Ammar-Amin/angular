import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Task } from '../../../core/models/task.model';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog';
import { LoadingSpinner } from '../../../shared/components/loading-spinner';
import { TaskCard } from '../components/task-card';
import { TaskFilterBar } from '../components/task-filter-bar';
import { TaskSummary } from '../components/task-summary';
import { TasksStore } from '../state/tasks.store';

@Component({
  selector: 'app-task-list-page',
  imports: [RouterLink, TaskSummary, TaskFilterBar, TaskCard, ConfirmDialog, LoadingSpinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-list-page.html',
})
export class TaskListPage {
  protected readonly store = inject(TasksStore);

  protected readonly pendingDelete = signal<Task | null>(null);

  constructor() {
    void this.store.load();
  }

  protected async confirmDelete(): Promise<void> {
    const task = this.pendingDelete();
    if (task && (await this.store.delete(task.id))) {
      this.pendingDelete.set(null);
    }
  }
}
