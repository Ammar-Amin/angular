import { Task } from '../models/task.model';

/** Today as YYYY-MM-DD in the user's local timezone (toISOString would use UTC). */
export function todayIso(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** A task is overdue when it is not completed and its due date is before today. */
export function isOverdue(task: Pick<Task, 'status' | 'dueDate'>, today = todayIso()): boolean {
  // ISO dates sort lexicographically, so no Date parsing is needed.
  return task.status !== 'completed' && task.dueDate < today;
}
