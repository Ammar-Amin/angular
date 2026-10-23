import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TaskInput } from '../../../core/models/task.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner';
import { TaskForm } from '../components/task-form';
import { TasksStore } from '../state/tasks.store';

/** Handles both /tasks/new and /tasks/:id/edit. The router binds :id to the `id` input. */
@Component({
  selector: 'app-task-form-page',
  imports: [RouterLink, TaskForm, LoadingSpinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-form-page.html',
})
export class TaskFormPage {
  protected readonly store = inject(TasksStore);
  private readonly router = inject(Router);

  readonly id = input<string>();

  protected readonly isEdit = computed(() => this.id() !== undefined);
  protected readonly task = computed(() => {
    const id = this.id();
    return id === undefined ? undefined : this.store.taskById(id);
  });
  protected readonly notFound = computed(
    () => this.isEdit() && this.store.loaded() && !this.task(),
  );

  constructor() {
    // Opening /tasks/:id/edit directly means nothing has been loaded yet.
    void this.store.load();
  }

  protected async save(input: TaskInput): Promise<void> {
    const id = this.id();
    const saved =
      id === undefined ? await this.store.create(input) : await this.store.update(id, input);
    if (saved) this.goBack();
  }

  protected goBack(): void {
    void this.router.navigate(['/tasks']);
  }
}
