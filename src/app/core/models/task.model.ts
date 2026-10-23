export const TASK_STATUSES = ['todo', 'in-progress', 'completed'] as const;
export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** ISO date without time, e.g. 2026-10-23 */
  dueDate: string;
}

/** What the form produces: a task that has not been given an id yet. */
export type TaskInput = Omit<Task, 'id'>;

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
}

export interface TaskFilters {
  query: string;
  status: TaskStatus | 'all';
  priority: TaskPriority | 'all';
}

export const DEFAULT_FILTERS: TaskFilters = { query: '', status: 'all', priority: 'all' };

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  'in-progress': 'In progress',
  completed: 'Completed',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};
