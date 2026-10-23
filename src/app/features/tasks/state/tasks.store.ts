import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import {
  DEFAULT_FILTERS,
  Task,
  TaskFilters,
  TaskInput,
  TaskStats,
} from '../../../core/models/task.model';
import { NotificationService } from '../../../core/services/notification.service';
import { TasksApiService } from '../../../core/services/tasks-api.service';
import { isOverdue, todayIso } from '../../../core/utils/date';
import { toUserMessage } from '../../../core/utils/http-error';

/**
 * Single source of truth for tasks.
 *
 * Private writable signals hold the state; everything the UI reads is either a readonly
 * signal or a computed derived from them. State is only ever replaced, never mutated.
 */
@Injectable({ providedIn: 'root' })
export class TasksStore {
  private readonly api = inject(TasksApiService);
  private readonly notify = inject(NotificationService);

  private readonly _tasks = signal<readonly Task[]>([]);
  private readonly _loading = signal(false);
  private readonly _loaded = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filters = signal<TaskFilters>(DEFAULT_FILTERS);

  readonly tasks = this._tasks.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filters = this._filters.asReadonly();

  readonly filteredTasks = computed(() => {
    const { query, status, priority } = this._filters();
    const needle = query.trim().toLowerCase();
    return this._tasks().filter(
      (t) =>
        (!needle || t.title.toLowerCase().includes(needle)) &&
        (status === 'all' || t.status === status) &&
        (priority === 'all' || t.priority === priority),
    );
  });

  readonly stats = computed<TaskStats>(() => {
    const today = todayIso();
    return this._tasks().reduce<TaskStats>(
      (acc, t) => ({
        total: acc.total + 1,
        completed: acc.completed + (t.status === 'completed' ? 1 : 0),
        inProgress: acc.inProgress + (t.status === 'in-progress' ? 1 : 0),
        overdue: acc.overdue + (isOverdue(t, today) ? 1 : 0),
      }),
      { total: 0, completed: 0, inProgress: 0, overdue: 0 },
    );
  });

  taskById(id: string): Task | undefined {
    return this._tasks().find((t) => t.id === id);
  }

  setFilters(patch: Partial<TaskFilters>): void {
    this._filters.update((f) => ({ ...f, ...patch }));
  }

  resetFilters(): void {
    this._filters.set(DEFAULT_FILTERS);
  }

  /** Fetches tasks. Pass force to refetch even if they have been loaded already. */
  async load(force = false): Promise<void> {
    if (this._loading() || (this._loaded() && !force)) return;

    this._loading.set(true);
    this._error.set(null);
    try {
      this._tasks.set(await firstValueFrom(this.api.getAll()));
      this._loaded.set(true);
    } catch (err) {
      this._error.set(toUserMessage(err, 'load your tasks'));
    } finally {
      this._loading.set(false);
    }
  }

  /** Write methods resolve to true on success, false on failure (the error toast is shown here). */
  create(input: TaskInput): Promise<boolean> {
    return this.write(this.api.create(input), 'create the task', 'Task created.', (saved) =>
      this._tasks.update((tasks) => [...tasks, saved]),
    );
  }

  update(id: string, input: TaskInput): Promise<boolean> {
    return this.write(this.api.update(id, input), 'update the task', 'Task updated.', (saved) =>
      this._tasks.update((tasks) => tasks.map((t) => (t.id === id ? saved : t))),
    );
  }

  delete(id: string): Promise<boolean> {
    return this.write(this.api.delete(id), 'delete the task', 'Task deleted.', () =>
      this._tasks.update((tasks) => tasks.filter((t) => t.id !== id)),
    );
  }

  private async write<T>(
    request: Observable<T>,
    action: string,
    successMessage: string,
    applyToState: (result: T) => void,
  ): Promise<boolean> {
    this._saving.set(true);
    try {
      applyToState(await firstValueFrom(request));
      this.notify.success(successMessage);
      return true;
    } catch (err) {
      this.notify.error(toUserMessage(err, action));
      return false;
    } finally {
      this._saving.set(false);
    }
  }
}
