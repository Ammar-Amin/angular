import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  private readonly destroyRef = inject(DestroyRef);

  protected readonly pendingDelete = signal<Task | null>(null);

  constructor() {
    this.store.load();
  }

  protected confirmDelete(): void {
    const task = this.pendingDelete();
    if (!task) return;
    this.store
      .delete(task.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.pendingDelete.set(null));
  }
}
