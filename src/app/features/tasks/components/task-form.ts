import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  Task,
  TaskInput,
  TaskPriority,
  TaskStatus,
} from '../../../core/models/task.model';
import { trimmedMinLength } from '../../../core/validators/trimmed-min-length';

type Field = 'title' | 'status' | 'priority' | 'dueDate';

const FIELD_LABELS: Record<Field, string> = {
  title: 'Title',
  status: 'Status',
  priority: 'Priority',
  dueDate: 'Due date',
};

/** Used for both creating (no task passed in) and editing (task passed in). */
@Component({
  selector: 'app-task-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './task-form.html',
})
export class TaskForm {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly task = input<Task>();
  readonly saving = input(false);
  readonly submitted = output<TaskInput>();
  readonly cancelled = output<void>();

  protected readonly statuses: readonly TaskStatus[] = TASK_STATUSES;
  protected readonly priorities: readonly TaskPriority[] = TASK_PRIORITIES;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly priorityLabels = PRIORITY_LABELS;

  readonly form = this.fb.group({
    title: ['', [Validators.required, trimmedMinLength(3)]],
    description: [''],
    status: this.fb.control<TaskStatus>('todo', Validators.required),
    priority: this.fb.control<TaskPriority>('medium', Validators.required),
    dueDate: ['', Validators.required],
  });

  constructor() {
    // When editing, fill the form once the task is available.
    effect(() => {
      const task = this.task();
      if (task) {
        this.form.reset({
          title: task.title,
          description: task.description ?? '',
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
        });
      }
    });
  }

  protected errorFor(field: Field): string | null {
    const control = this.form.controls[field];
    if (!control.errors || !(control.touched || control.dirty)) return null;
    if (control.hasError('required')) return `${FIELD_LABELS[field]} is required.`;
    if (control.hasError('minlength')) return 'Title must be at least 3 characters.';
    return null;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.submitted.emit({
      ...value,
      title: value.title.trim(),
      description: value.description.trim(),
    });
  }
}
