import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Task } from '../../../core/models/task.model';
import { TASKS_URL } from '../../../core/services/tasks-api.service';
import { todayIso } from '../../../core/utils/date';
import { TaskListPage } from './task-list-page';

const daysFromToday = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return todayIso(d);
};

const TASKS: Task[] = [
  { id: '1', title: 'Write report', status: 'todo', priority: 'high', dueDate: daysFromToday(-2) },
  {
    id: '2',
    title: 'Plan sprint',
    status: 'in-progress',
    priority: 'low',
    dueDate: daysFromToday(3),
  },
  {
    id: '3',
    title: 'Ship release',
    status: 'completed',
    priority: 'high',
    dueDate: daysFromToday(-5),
  },
];

describe('TaskListPage', () => {
  let fixture: ComponentFixture<TaskListPage>;
  let http: HttpTestingController;

  const root = (): HTMLElement => fixture.nativeElement;
  const text = (): string => root().textContent ?? '';
  const titles = (): string[] =>
    Array.from(root().querySelectorAll('app-task-card h3')).map((h) => h.textContent!.trim());

  async function render(): Promise<void> {
    fixture = TestBed.createComponent(TaskListPage);
    await fixture.whenStable();
  }

  async function flushTasks(tasks: Task[] = TASKS): Promise<void> {
    http.expectOne(TASKS_URL).flush(tasks);
    await fixture.whenStable();
  }

  async function typeIn(selector: string, value: string, eventName: string): Promise<void> {
    const input = root().querySelector<HTMLInputElement | HTMLSelectElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event(eventName));
    await fixture.whenStable();
  }

  const clickButton = async (label: string): Promise<void> => {
    const button = Array.from(root().querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === label,
    );
    button!.click();
    await fixture.whenStable();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('shows a loading indicator, then the tasks and summary', async () => {
    await render();
    expect(text()).toContain('Loading tasks…');

    await flushTasks();

    expect(text()).not.toContain('Loading tasks…');
    expect(titles()).toEqual(['Write report', 'Plan sprint', 'Ship release']);
    // total 3, completed 1, in progress 1, overdue 1 (the completed one doesn't count)
    const values = Array.from(root().querySelectorAll('app-task-summary dd')).map((d) =>
      d.textContent!.trim(),
    );
    expect(values).toEqual(['3', '1', '1', '1']);
  });

  it('flags only the open past-due task as overdue', async () => {
    await render();
    await flushTasks();

    const cards = Array.from(root().querySelectorAll('app-task-card'));
    expect(cards[0].textContent).toContain('Overdue');
    expect(cards[1].textContent).not.toContain('Overdue');
    expect(cards[2].textContent).not.toContain('Overdue');
  });

  it('filters by title search, status and priority', async () => {
    await render();
    await flushTasks();

    await typeIn('input[type=search]', 'sprint', 'input');
    expect(titles()).toEqual(['Plan sprint']);

    await typeIn('input[type=search]', '', 'input');
    await typeIn('select:nth-of-type(1)', 'completed', 'change');
    expect(titles()).toEqual(['Ship release']);
  });

  it('shows a no-match empty state and clears filters from it', async () => {
    await render();
    await flushTasks();

    await typeIn('input[type=search]', 'zzzz', 'input');
    expect(text()).toContain('No tasks match your filters');

    await clickButton('Clear filters');
    expect(titles()).toHaveLength(3);
  });

  it('shows the first-run empty state when there are no tasks at all', async () => {
    await render();
    await flushTasks([]);
    expect(text()).toContain('No tasks yet');
  });

  it('shows an error with a working retry when loading fails', async () => {
    await render();
    http.expectOne(TASKS_URL).error(new ProgressEvent('error'), { status: 0 });
    await fixture.whenStable();

    expect(text()).toContain('Could not reach the server');

    await clickButton('Try again');
    await flushTasks();
    expect(titles()).toHaveLength(3);
  });

  describe('deleting', () => {
    it('asks for confirmation and does nothing if cancelled', async () => {
      await render();
      await flushTasks();

      await clickButton('Delete');
      expect(text()).toContain('Delete task?');
      expect(text()).toContain('Write report');

      await clickButton('Cancel');
      expect(text()).not.toContain('Delete task?');
      expect(titles()).toHaveLength(3);
      http.expectNone(`${TASKS_URL}/1`);
    });

    it('deletes after confirmation and updates the list and summary', async () => {
      await render();
      await flushTasks();

      await clickButton('Delete');
      // the dialog's own confirm button is the second "Delete" on the page
      const confirm = Array.from(root().querySelectorAll('app-confirm-dialog button')).find(
        (b) => b.textContent?.trim() === 'Delete',
      ) as HTMLButtonElement;
      confirm.click();
      http.expectOne({ method: 'DELETE', url: `${TASKS_URL}/1` }).flush({});
      await fixture.whenStable();

      expect(titles()).toEqual(['Plan sprint', 'Ship release']);
      expect(text()).not.toContain('Delete task?');
      expect(root().querySelector('app-task-summary dd')!.textContent!.trim()).toBe('2');
    });

    it('keeps the task and the dialog open when the delete fails', async () => {
      await render();
      await flushTasks();

      await clickButton('Delete');
      const confirm = Array.from(root().querySelectorAll('app-confirm-dialog button')).find(
        (b) => b.textContent?.trim() === 'Delete',
      ) as HTMLButtonElement;
      confirm.click();
      http.expectOne(`${TASKS_URL}/1`).flush('fail', { status: 500, statusText: 'Server Error' });
      await fixture.whenStable();

      expect(titles()).toHaveLength(3);
      expect(text()).toContain('Delete task?');
    });
  });
});
