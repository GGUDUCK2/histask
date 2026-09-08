# AGENTS.md — Histask

This file defines repository-level instructions for coding agents, including Codex.

Read this file before making changes.

Also read `PRD.md`.

`PRD.md` defines **what Histask v0.1 must do**.
This file defines **how changes should be made**.

---

## 1. Project identity

Project: Histask

Histask is a local-first personal work tracker built around:

- Kanban cards
- Categories
- Tags
- WorkLog progress history
- Dashboard metrics
- Today/calendar views
- IndexedDB persistence
- JSON backup/restore
- Offline PWA usage

The most important product behavior is:

> A task card must expose the most recent WorkLog so the user can understand current progress without opening the card.

Do not weaken or remove this behavior.

---

## 2. Source of truth

Before implementation, read:

1. `AGENTS.md`
2. `PRD.md`
3. existing source code
4. existing tests
5. relevant project documentation

If `DEVELOPMENT_PLAN.md` exists, also read it before starting planned work.

Priority when instructions conflict:

1. Explicit user instruction in the current task
2. `PRD.md`
3. `AGENTS.md`
4. `DEVELOPMENT_PLAN.md`
5. Existing implementation patterns

Do not silently reinterpret product requirements.

---

## 3. Development environment

The project uses Node via NVM.

Before installing dependencies, running development commands, or validating the project, prefer:

```bash
nvm use --lts
```

If the shell environment does not have NVM loaded, do not make unrelated system-level changes just to install it.

Report the limitation and use the available compatible Node runtime when possible.

### Package manager

Use the package manager already established by the repository lockfile.

For the initial repository, default to npm.

If `package-lock.json` exists:

```bash
npm install
```

or, in reproducible CI-like validation where appropriate:

```bash
npm ci
```

Do not introduce pnpm, Yarn, Bun, or another package manager without explicit approval.

---

## 4. Required stack

The intended v0.1 stack is:

- Vite
- React
- TypeScript
- Oxlint
- React Router
- Tailwind CSS
- shadcn/ui
- Dexie.js
- IndexedDB
- dnd-kit
- vite-plugin-pwa
- Vitest
- React Testing Library

Do not replace major stack choices without a concrete blocking reason.

### Linter

Use Oxlint.

Do not migrate to ESLint merely because it is more familiar.

### React Compiler

Do not enable React Compiler for v0.1 unless explicitly requested or technically necessary.

### Native wrapper

Do not add Electron or Tauri in v0.1.

---

## 5. Scope discipline

Do not add features that are not requested by `PRD.md` or the current task.

Especially do not add:

- authentication
- backend APIs
- cloud databases
- synchronization
- user accounts
- multi-user collaboration
- file uploads
- analytics
- telemetry
- AI features
- email/Slack/Teams integrations
- calendar integrations
- billing
- recurring tasks
- custom status builders
- time tracking
- Gantt charts

If a future feature influences architecture, create a clean boundary only when useful.

Do not implement the future feature.

---

## 6. Privacy and local-first rules

Histask is designed for work data.

User task data must stay local.

Do not add:

- external analytics
- error-reporting SaaS
- session replay
- remote logging
- remote persistence
- third-party data APIs

without explicit user approval.

Do not send Card, WorkLog, Category, Tag, search text, or backup contents outside the browser.

PWA static assets may be served normally.

---

## 7. Data safety rules

Data safety has higher priority than convenience.

Never solve a data problem by automatically deleting the user's IndexedDB.

Never reset the database during a migration unless explicitly required and documented.

### Backup import

Never mutate current user data until the entire backup payload has passed validation.

Import flow must be:

```text
read
→ parse
→ validate
→ prepare
→ transactional replace
```

If validation fails:

```text
existing data remains untouched
```

### Destructive operations

Use confirmation for destructive operations.

Deleting all data requires the `DELETE` confirmation specified by the PRD.

Card deletion must remove dependent WorkLogs/CardTags transactionally.

Category deletion must not delete Cards.

Tag deletion must not delete Cards.

---

## 8. Domain boundaries

Keep domain types separate from React presentation code.

Core concepts include:

- Card
- CardStatus
- Priority
- Category
- Tag
- CardTag
- WorkLog
- BackupPayload

Prefer explicit types.

Avoid `any`.

Do not use broad type assertions to silence real type errors.

---

## 9. Data access rules

Do not call Dexie directly throughout arbitrary UI components.

Preferred flow:

```text
React UI
  ↓
feature hook/service
  ↓
repository
  ↓
Dexie
  ↓
IndexedDB
```

Repositories/services may expose reactive helpers when required, but the UI should not know table implementation details unnecessarily.

Suggested folders:

```text
src/
  app/
  components/
  db/
  repositories/
  services/
  features/
  hooks/
  types/
  utils/
```

Do not create layers that add no meaningful boundary.

---

## 10. Database rules

Start with explicit schema versioning.

Use Dexie migrations for schema changes.

Design indexes around actual access patterns.

Likely indexed data includes:

- Card.status
- Card.categoryId
- Card.updatedAt
- Card.dueDate
- WorkLog.cardId
- WorkLog.createdAt

Do not prematurely optimize with complicated denormalization.

### Transactions

Use transactions for multi-table mutations that must remain consistent.

Examples:

- delete Card + CardTags + WorkLogs
- replace database from backup
- create WorkLog + update Card.updatedAt when consistency matters

---

## 11. WorkLog rules

WorkLog is a first-class entity.

Never replace WorkLog history with a single mutable "latest status" string on Card.

The board may derive/cache preview information only if correctness is preserved.

Canonical history remains in WorkLog records.

### Ordering

Card detail:

```text
newest WorkLog first
```

### Latest preview

The latest WorkLog must be recalculated correctly after:

- create
- edit
- delete
- backup import

---

## 12. React implementation rules

Use function components and hooks.

Keep components focused.

Avoid putting repository/database/business logic directly into large JSX files.

Prefer feature-level hooks/services when a component begins coordinating complex behavior.

Avoid premature global state.

Do not introduce Redux for v0.1 unless a concrete need is demonstrated.

Local UI state should remain local where possible.

Persistent domain state belongs in IndexedDB.

---

## 13. UI rules

Histask is desktop-first and information-dense.

Prefer:

- compact spacing
- clear hierarchy
- readable metadata
- predictable interactions
- low visual noise

Avoid:

- oversized cards
- decorative gradients everywhere
- excessive animation
- large empty margins
- marketing-site aesthetics inside the work app

### Card priority

Cards should make this order easy to scan:

1. title
2. status/context
3. latest WorkLog
4. category/tags
5. timing/metadata

Exact visual order may vary if usability improves.

---

## 14. Accessibility rules

Do not sacrifice keyboard/focus behavior for visual polish.

Required practices:

- visible focus states
- semantic buttons
- aria labels where icon-only controls need them
- drawer/dialog focus management
- tooltip available on keyboard focus
- sufficient contrast
- do not encode status using color alone

Drag-and-drop should not make non-drag access impossible.

---

## 15. Date/time rules

Persist timestamps as ISO strings.

Do not persist locale-formatted display strings.

Display using user locale.

For relative time, use shared utilities.

Examples:

- just now
- 10 minutes ago
- 2 hours ago
- yesterday
- 3 days ago

Detailed views/tooltips should expose exact date/time.

Keep "today" calculations in a shared utility/service to prevent inconsistent timezone behavior.

---

## 16. Search/filter rules

Search results are Card-based.

A WorkLog match returns the parent Card.

Filtering must support combined conditions.

Do not hardcode search behavior separately in multiple screens if it can share a service.

Keep active filters serializable/simple where practical.

---

## 17. Drag-and-drop rules

Use dnd-kit.

Required outcomes:

- moving across columns updates Card status
- moving inside a column updates manual ordering
- IndexedDB state is persisted after drag
- persistence failure does not leave a false successful UI state

When adding optimistic behavior, keep rollback logic straightforward and tested.

---

## 18. PWA rules

PWA must support offline app-shell execution.

IndexedDB remains the data store.

Do not misuse service-worker cache as a database.

Avoid caching user-generated task payloads in network caches.

---

## 19. Dependency policy

Before adding a dependency:

1. Check whether the existing stack already solves the problem.
2. Prefer mature, focused packages.
3. Avoid large libraries for tiny helpers.
4. Avoid overlapping libraries that solve the same problem.
5. Keep bundle/runtime complexity reasonable.

Document significant new dependencies in the relevant task summary.

Do not perform broad dependency upgrades unrelated to the current task.

---

## 20. File-change discipline

Make the smallest coherent set of changes that completes the task.

Do not:

- mass-format unrelated files
- rename unrelated folders
- rewrite working code without reason
- change public APIs unrelated to the task
- modify generated/lock files unnecessarily

If a refactor is required to implement the requested feature safely, keep it bounded and explain it.

---

## 21. Testing requirements

Every meaningful domain behavior should be testable.

At minimum, maintain coverage for PRD-critical logic:

- Card CRUD
- WorkLog CRUD
- latest WorkLog
- dashboard counts
- Updated Today unique-card count
- combined filtering
- search
- status/sort changes
- Category deletion behavior
- Tag deletion behavior
- backup export
- backup validation
- backup import
- migration behavior

For bug fixes:

1. reproduce with a test where practical
2. fix the bug
3. verify regression test passes

Do not delete useful tests just to make CI pass.

---

## 22. Validation commands

Before considering a task complete, inspect `package.json` and run the repository's actual scripts.

Expected checks should include equivalents of:

```bash
nvm use --lts
npm run lint
npm run test
npm run build
```

If a separate typecheck script exists:

```bash
npm run typecheck
```

If test script requires a non-watch mode, use the appropriate flag/script.

Do not claim validation passed if a command was not run.

If a command cannot run because of the environment, report exactly what blocked it.

---

## 23. Build correctness

Do not stop after dev-server visual success.

A completed implementation should:

- compile
- lint
- test
- production-build

Fix errors introduced by the current work.

Warnings should be evaluated, not automatically ignored.

---

## 24. Documentation

Keep documentation proportional to the work.

Core repository documentation targets:

- `README.md`
- `PRD.md`
- `AGENTS.md`

As implementation matures, add/update when useful:

- `ARCHITECTURE.md`
- `DATABASE.md`
- `CHANGELOG.md`
- `DEVELOPMENT_PLAN.md`

Do not create many redundant markdown files.

---

## 25. Development plan handling

If `DEVELOPMENT_PLAN.md` exists:

- treat it as the implementation backlog
- keep task IDs stable
- mark work complete only after validation
- do not silently skip dependencies
- update status if the current task explicitly includes plan maintenance

The plan does not override product scope in `PRD.md`.

---

## 26. Git discipline

Do not rewrite repository history.

Do not force push.

Do not delete branches unrelated to the task.

Do not include secrets.

Do not commit:

- `.env` secrets
- local credentials
- editor-specific private configuration
- generated backup files containing real work data

Use clear commit/PR summaries when requested.

Example style:

```text
feat: add WorkLog history to task drawer
fix: preserve cards when deleting category
test: cover backup import validation
```

Do not create a commit unless the environment/task asks for it.

---

## 27. Security

Treat imported JSON as untrusted input.

Validate backup payloads.

Do not inject WorkLog or description HTML directly into the DOM.

If Markdown is later supported, sanitize rendered output.

Avoid `dangerouslySetInnerHTML` unless explicitly justified and sanitized.

No secrets are required for v0.1.

---

## 28. Performance

Histask is a personal work manager, not a large multi-tenant system.

Optimize sensibly for hundreds to a few thousand Cards/WorkLogs, but do not over-engineer.

Avoid obvious performance traps:

- repeated full database scans on every keystroke when avoidable
- expensive derived calculations duplicated across many cards
- unstable React keys
- unnecessary global rerenders

Correctness and maintainability come first.

---

## 29. Error handling

User-facing failures must be understandable.

Prefer:

- inline validation
- toast/banner for failed writes
- explicit import errors

Avoid raw stack traces in normal UI.

Log useful development diagnostics to the console only when appropriate.

Do not silently swallow data-layer errors.

---

## 30. Implementation decision rule

When the PRD allows multiple solutions, prefer in this order:

1. data safety
2. daily usability
3. correctness
4. simplicity
5. maintainability
6. future extensibility
7. visual cleverness

Do not build a framework inside the app.

---

## 31. Task completion report

When finishing a Codex task, report:

### Implemented

A concise list of completed behavior.

### Important files changed

Only major files/directories.

### Validation

List each command actually run and whether it passed.

Example:

```text
npm run lint   PASS
npm run test   PASS
npm run build  PASS
```

### Remaining issues

Only real known issues or explicit deferred scope.

Do not invent future work to make the report look longer.

---

## 32. Prohibited shortcuts

Do not:

- replace IndexedDB with localStorage for convenience
- store all app data as one giant JSON string
- disable TypeScript strictness to bypass errors
- add `any` broadly
- disable lint rules globally to silence failures
- remove tests to make a build pass
- clear the database on schema errors
- send work data to external services
- implement cloud sync in v0.1
- turn Histask into a generic Trello clone at the expense of WorkLog visibility

---

## 33. Initial implementation sequence

Unless `DEVELOPMENT_PLAN.md` says otherwise, a safe order is:

1. Foundation and dependencies
2. Domain types
3. Dexie schema/repositories
4. Card/WorkLog/Category/Tag behavior
5. Main layout
6. Kanban
7. Card drawer + WorkLog history
8. Dashboard
9. Search/filter/sort
10. Today/calendar
11. Backup/restore
12. PWA/offline
13. accessibility/responsive polish
14. full validation

Prefer complete vertical slices over leaving many half-implemented screens.

---

## 34. Final reminder

Histask v0.1 is successful when it becomes a reliable daily work console.

The defining UX is:

```text
Task
+ current state
+ latest progress
+ searchable history
```

Keep the latest WorkLog visible, keep user data local, and keep the implementation small and dependable.
