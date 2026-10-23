import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Task, TaskInput } from '../../../core/models/task.model';
import { NotificationService } from '../../../core/services/notification.service';
import { TASKS_URL } from '../../../core/services/tasks-api.service';
import { todayIso } from '../../../core/utils/date';
import { TasksStore } from './tasks.store';

const daysFromToday = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return todayIso(d);
};

const task = (overrides: Partial<Task> = {}): Task => ({
  id: '1',
  title: 'Write report',
  status: 'todo',
  priority: 'medium',
  dueDate: daysFromToday(5),
  ...overrides,
});

describe('TasksStore', () => {
  let store: TasksStore;
  let http: HttpTestingController;
  let notify: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(TasksStore);
    http = TestBed.inject(HttpTestingController);
    notify = TestBed.inject(NotificationService);
  });

  afterEach(() => http.verify());

  async function seed(tasks: Task[]): Promise<void> {
    const loading = store.load();
    http.expectOne(TASKS_URL).flush(tasks);
    await loading;
  }

  describe('loading', () => {
    it('is loading until the request resolves, then holds the tasks', async () => {
      const loading = store.load();
      expect(store.loading()).toBe(true);

      http.expectOne(TASKS_URL).flush([task()]);
      await loading;

      expect(store.loading()).toBe(false);
      expect(store.tasks()).toHaveLength(1);
      expect(store.error()).toBeNull();
    });

    it('does not refetch once loaded unless forced', async () => {
      await seed([task()]);
      await store.load();
      http.expectNone(TASKS_URL);

      const reload = store.load(true);
      http.expectOne(TASKS_URL).flush([]);
      await reload;
      expect(store.tasks()).toEqual([]);
    });

    it('exposes a friendly error when the API is unreachable', async () => {
      const loading = store.load();
      http.expectOne(TASKS_URL).error(new ProgressEvent('error'), { status: 0 });
      await loading;

      expect(store.loading()).toBe(false);
      expect(store.error()).toContain('Could not reach the server');
      expect(store.tasks()).toEqual([]);
    });

    it('exposes a friendly error on a 500 and allows a retry', async () => {
      const first = store.load();
      http.expectOne(TASKS_URL).flush('boom', { status: 500, statusText: 'Server Error' });
      await first;
      expect(store.error()).toContain('server ran into a problem');

      const retry = store.load(true);
      expect(store.error()).toBeNull();
      http.expectOne(TASKS_URL).flush([task()]);
      await retry;
      expect(store.tasks()).toHaveLength(1);
    });
  });

  describe('derived state', () => {
    beforeEach(async () => {
      await seed([
        task({ id: '1', title: 'Alpha', status: 'completed', dueDate: daysFromToday(-3) }),
        task({ id: '2', title: 'Beta', status: 'in-progress', dueDate: daysFromToday(-1) }),
        task({
          id: '3',
          title: 'Gamma',
          status: 'todo',
          priority: 'high',
          dueDate: daysFromToday(2),
        }),
        task({ id: '4', title: 'alphabet soup', status: 'todo', dueDate: todayIso() }),
      ]);
    });

    it('computes stats, and a completed past-due task is not overdue', () => {
      expect(store.stats()).toEqual({ total: 4, completed: 1, inProgress: 1, overdue: 1 });
    });

    it('a task due today is not overdue', () => {
      expect(store.stats().overdue).toBe(1); // only Beta
    });

    it('searches by title, ignoring case', () => {
      store.setFilters({ query: 'ALPHA' });
      expect(store.filteredTasks().map((t) => t.id)).toEqual(['1', '4']);
    });

    it('combines status and priority filters', () => {
      store.setFilters({ status: 'todo', priority: 'high' });
      expect(store.filteredTasks().map((t) => t.id)).toEqual(['3']);
    });

    it('resets filters', () => {
      store.setFilters({ query: 'zzz', status: 'completed' });
      expect(store.filteredTasks()).toEqual([]);
      store.resetFilters();
      expect(store.filteredTasks()).toHaveLength(4);
    });
  });

  describe('writes', () => {
    const input: TaskInput = {
      title: 'New one',
      description: '',
      status: 'todo',
      priority: 'low',
      dueDate: daysFromToday(1),
    };

    it('create adds the saved task, notifies and updates the stats', async () => {
      await seed([task()]);
      const result = store.create(input);
      expect(store.saving()).toBe(true);

      http.expectOne({ method: 'POST', url: TASKS_URL }).flush({ ...input, id: '99' });

      expect(await result).toBe(true);
      expect(store.tasks().map((t) => t.id)).toEqual(['1', '99']);
      expect(store.stats().total).toBe(2);
      expect(store.saving()).toBe(false);
      expect(notify.items()[0]).toMatchObject({ kind: 'success', text: 'Task created.' });
    });

    it('update replaces only the matching task without mutating the old array', async () => {
      await seed([task({ id: '1' }), task({ id: '2', title: 'Other' })]);
      const before = store.tasks();

      const result = store.update('1', { ...input, status: 'completed' });
      http
        .expectOne({ method: 'PUT', url: `${TASKS_URL}/1` })
        .flush({ ...input, id: '1', status: 'completed' });
      await result;

      expect(store.tasks()).not.toBe(before);
      expect(before[0].status).toBe('todo');
      expect(store.tasks()[0].status).toBe('completed');
      expect(store.tasks()[1].title).toBe('Other');
    });

    it('delete removes the task', async () => {
      await seed([task({ id: '1' }), task({ id: '2' })]);
      const result = store.delete('1');
      http.expectOne({ method: 'DELETE', url: `${TASKS_URL}/1` }).flush({});
      await result;
      expect(store.tasks().map((t) => t.id)).toEqual(['2']);
    });

    it('keeps state unchanged and reports an error when a write fails', async () => {
      await seed([task({ id: '1' })]);
      const result = store.delete('1');
      http.expectOne(`${TASKS_URL}/1`).flush('nope', { status: 500, statusText: 'Server Error' });

      expect(await result).toBe(false);
      expect(store.tasks()).toHaveLength(1);
      expect(store.saving()).toBe(false);
      expect(notify.items()[0]).toMatchObject({ kind: 'error' });
      expect(notify.items()[0].text).toContain('delete the task');
    });
  });
});
