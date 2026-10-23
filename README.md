# Task Manager

A small Angular app for viewing, searching, filtering, creating, editing and deleting tasks.
Built with standalone components, Signals for state, Reactive Forms, and JSON Server as the API.

## Running it

Requires a current Node LTS (developed on Node 24).

```bash
npm install
npm start     # starts JSON Server (http://localhost:3001) and the Angular dev server (http://localhost:4200)
npm test      # unit tests (Vitest via the Angular test builder)
npm run build # production build
```

`npm start` runs both processes together. If you only want the front end, use `npm run start:web`
(you will need `npm run api` in another terminal for data).

Notes:

- The API uses port **3001**, not 3000, because 3000 is commonly taken by other dev servers.
  It is set in `package.json` (`api` script) and `TASKS_URL` in `core/services/tasks-api.service.ts`.
- JSON Server writes changes back to `db.json`, so edits persist between runs. Commit the file (or keep a copy)
  if you want a way back to the original sample data. The API has a 400ms delay on purpose so loading states are visible.

## Structure

```
src/app/
  core/
    models/        Task types, filter/stat types, label maps
    services/      TasksApiService (only HttpClient user), NotificationService (toasts)
    utils/         date helpers (overdue logic), HTTP error -> user message
    validators/    trimmedMinLength
  features/tasks/
    state/         TasksStore (signals), the single source of truth
    components/    TaskCard, TaskFilterBar, TaskSummary, TaskForm  (presentational)
    pages/         TaskListPage, TaskFormPage                     (route-level, talk to the store)
  shared/components/  ConfirmDialog, LoadingSpinner, ToastContainer, NotFoundPage
```

Routes: `/` redirects to `/tasks`, then `/tasks`, `/tasks/new`, `/tasks/:id/edit`, and a
catch-all not-found page. Page components are lazy loaded.

## How data flows

```
JSON Server  <->  TasksApiService (HttpClient)  <->  TasksStore (signals)  ->  pages  ->  presentational components
```

1. A page calls `store.load()`. The store asks `TasksApiService` for the tasks and puts them in a private signal.
2. Pages read read-only signals (`tasks`, `filteredTasks`, `stats`, `loading`, `error`) and pass plain values
   down to presentational components through `input()`.
3. Components send events back up with `output()`. The page turns those into store calls
   (`setFilters`, `create`, `update`, `delete`).
4. Write calls hit the API first, and the store only updates its state after the server confirms.
   On success the store replaces its array (never mutates it) and shows a success toast. On failure it shows an
   error toast and leaves state untouched.
5. `create`, `update` and `delete` are `async` and resolve to `true` or `false`, so a page can simply
   `await` them and then navigate or close a dialog. No component subscribes to anything.

## README questions

**1. Why Signals?**
The state here is small and synchronous apart from the HTTP calls, so Signals fit well. `computed()` gives
derived state (filtered list, stats) that updates automatically and is only recalculated when its inputs change,
and templates read signals directly with no `async` pipe or subscriptions to manage. NgRx would add actions,
reducers and effects that this size of app doesn't need. RxJS is limited to the HTTP layer: `TasksApiService`
returns observables (the normal `HttpClient` shape) and the store converts each call to a promise with
`firstValueFrom`, so nothing outside the store has to subscribe or unsubscribe.

**2. How is data passed between the API, state layer and components?**
See "How data flows" above. Components never touch `HttpClient`. The store is the only thing that
talks to the API service and is the only owner of task state.

**3. Trade-offs because of the time limit**

- Search is applied on every keystroke. It's cheap for a small in-memory list, but it isn't debounced.
- Writes are pessimistic (wait for the server) rather than optimistic. Simpler and always consistent,
  but the UI waits for the API.
- Filtering is client-side, and the store loads every task in one request.
- The confirm dialog is a simple overlay. It handles Escape and has dialog roles, but it does not trap focus.
- Filter state lives in the store, not the URL. It survives navigating to the form and back, but is lost on
  refresh and can't be linked to.
- No end-to-end tests and no pagination.
- I removed the SSR/prerender setup the Angular CLI generated, since there is no benefit for this app and
  it complicates talking to a separate API.

**4. What I'd improve before production**

- A real backend with authentication, validation, and server-side ids/timestamps. JSON Server accepts anything.
- Move the API URL into environment config instead of a constant.
- Optimistic updates with rollback, and request cancellation/retry for flaky networks. Promises are simple but
  can't be cancelled, so I'd move search to an observable pipeline (`debounceTime` + `switchMap`) once it hits
  the server.
- Keep filters and page in query params.
- Proper focus trap in the dialog (or the native `<dialog>`), a wider accessibility pass, and e2e tests (Playwright).
- Handle concurrent edits (e.g. ETag/version check) so one user doesn't overwrite another.
- Error reporting/logging, and CI running lint, tests and build.

**5. Supporting thousands of tasks**

- Move search, filtering, sorting and pagination to the server (`?q=`, `?status=`, `?_page=&_limit=`),
  with the store holding only the current page and a total count.
- Debounce search and cancel in-flight requests when a new one starts (`switchMap`).
- Virtual scrolling (`@angular/cdk` scroll viewport) if a long list is needed, and `track task.id` (already used)
  to avoid re-rendering rows.
- Components are `OnPush` and read signals, so a change to one task doesn't re-check everything.
- Compute the dashboard counts on the server for large datasets instead of reducing the full list in the browser.

## Requirements checklist

Done:

- Task list with search by title, status and priority filters, overdue highlighting, and empty states
  (both "no tasks yet" and "no matches", with a clear-filters button)
- Reusable Reactive Form for create and edit with all required validations and messages
- Delete with a confirmation dialog
- Dashboard summary (total, completed, in progress, overdue) that updates as data changes
- Routing: default redirect, `/tasks`, `/tasks/new`, `/tasks/:id/edit`, not-found page
- Signal store: single source of truth, immutable updates, derived stats, loading and error handling
- JSON Server API with get, create, update, delete. No component uses `HttpClient`
- Loading indicator, friendly errors with retry on the list, success/error toasts
- Tests (see below)
- Route lazy loading (optional)
- Custom confirmation dialog (optional)

Not done:

- Debounced search, optimistic updates, pagination, drag-and-drop, end-to-end tests
- Mobile layout was kept simple (the grids collapse on small screens) but I have not tested it carefully
- Accessibility is partial: labelled fields, `aria-invalid`, live region for toasts, dialog roles. No focus trap.

## Tests

`npm test` starts the test runner in watch mode. For a single run (CI), use `npx ng test --watch=false`.

| File                     | What it covers                                                                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tasks.store.spec.ts`    | loading, retry, API errors (offline and 500), filters, stats and overdue rules, create/update/delete, immutability, failed writes leaving state alone |
| `task-form.spec.ts`      | each validation rule, whitespace-only titles, error messages after submit, trimmed output, create vs edit pre-fill                                    |
| `task-list-page.spec.ts` | loading to rendered list, summary numbers, overdue badge, search/filter, empty states, error + retry, delete confirm / cancel / success / failure     |

## AI declaration

This project was written with the help of an AI coding assistant (Claude Code). I reviewed the code and can explain
and change any part of it. The Angular CLI scaffold, Tailwind and JSON Server are the only external pieces.
