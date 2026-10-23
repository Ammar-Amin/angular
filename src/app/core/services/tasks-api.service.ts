import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Task, TaskInput } from '../models/task.model';

export const TASKS_URL = 'http://localhost:3001/tasks';

/** The only place that talks to HttpClient. Components and the store go through this. */
@Injectable({ providedIn: 'root' })
export class TasksApiService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Task[]> {
    return this.http.get<Task[]>(TASKS_URL);
  }

  create(input: TaskInput): Observable<Task> {
    return this.http.post<Task>(TASKS_URL, input);
  }

  update(id: string, input: TaskInput): Observable<Task> {
    return this.http.put<Task>(`${TASKS_URL}/${id}`, { ...input, id });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${TASKS_URL}/${id}`);
  }
}
