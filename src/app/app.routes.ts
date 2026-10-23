import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tasks' },
  {
    path: 'tasks',
    title: 'Tasks',
    loadComponent: () =>
      import('./features/tasks/pages/task-list-page').then((m) => m.TaskListPage),
  },
  {
    path: 'tasks/new',
    title: 'New task',
    loadComponent: () =>
      import('./features/tasks/pages/task-form-page').then((m) => m.TaskFormPage),
  },
  {
    path: 'tasks/:id/edit',
    title: 'Edit task',
    loadComponent: () =>
      import('./features/tasks/pages/task-form-page').then((m) => m.TaskFormPage),
  },
  {
    path: '**',
    title: 'Page not found',
    loadComponent: () => import('./shared/components/not-found-page').then((m) => m.NotFoundPage),
  },
];
