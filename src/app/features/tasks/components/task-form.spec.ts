import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Task, TaskInput } from '../../../core/models/task.model';
import { TaskForm } from './task-form';

describe('TaskForm', () => {
  let fixture: ComponentFixture<TaskForm>;
  let component: TaskForm;
  let submitted: TaskInput[];

  const el = (): HTMLElement => fixture.nativeElement;
  const text = (): string => el().textContent ?? '';

  async function setup(task?: Task): Promise<void> {
    fixture = TestBed.createComponent(TaskForm);
    component = fixture.componentInstance;
    if (task) fixture.componentRef.setInput('task', task);
    submitted = [];
    component.submitted.subscribe((v) => submitted.push(v));
    await fixture.whenStable();
  }

  async function submit(): Promise<void> {
    el().querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  describe('validation', () => {
    beforeEach(() => setup());

    it('requires a title', () => {
      const title = component.form.controls.title;
      title.setValue('');
      expect(title.hasError('required')).toBe(true);
    });

    it('rejects titles shorter than three characters, including whitespace padding', () => {
      const title = component.form.controls.title;

      title.setValue('ab');
      expect(title.hasError('minlength')).toBe(true);

      title.setValue('  a  ');
      expect(title.hasError('minlength')).toBe(true);

      title.setValue('abc');
      expect(title.valid).toBe(true);
    });

    it('requires status, priority and due date', () => {
      const { status, priority, dueDate } = component.form.controls;
      status.setValue('' as never);
      priority.setValue('' as never);
      dueDate.setValue('');

      expect(status.hasError('required')).toBe(true);
      expect(priority.hasError('required')).toBe(true);
      expect(dueDate.hasError('required')).toBe(true);
    });

    it('does not emit and shows messages when submitted empty', async () => {
      await submit();

      expect(submitted).toEqual([]);
      expect(text()).toContain('Title is required.');
      expect(text()).toContain('Due date is required.');
    });

    it('shows the minimum length message once the title has been touched', async () => {
      component.form.controls.title.setValue('ab');
      component.form.controls.title.markAsTouched();
      await fixture.whenStable();

      expect(text()).toContain('Title must be at least 3 characters.');
    });

    it('emits trimmed values when valid', async () => {
      component.form.patchValue({
        title: '  Buy milk  ',
        description: '  two litres ',
        status: 'in-progress',
        priority: 'high',
        dueDate: '2026-12-01',
      });
      await submit();

      expect(submitted).toEqual([
        {
          title: 'Buy milk',
          description: 'two litres',
          status: 'in-progress',
          priority: 'high',
          dueDate: '2026-12-01',
        },
      ]);
    });
  });

  describe('modes', () => {
    it('starts empty with sensible defaults when creating', async () => {
      await setup();
      expect(component.form.getRawValue()).toEqual({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        dueDate: '',
      });
      expect(text()).toContain('Create task');
    });

    it('is pre-filled when editing', async () => {
      await setup({
        id: '7',
        title: 'Existing',
        description: 'desc',
        status: 'completed',
        priority: 'low',
        dueDate: '2026-11-11',
      });

      expect(component.form.getRawValue()).toEqual({
        title: 'Existing',
        description: 'desc',
        status: 'completed',
        priority: 'low',
        dueDate: '2026-11-11',
      });
      expect(text()).toContain('Save changes');
    });
  });
});
