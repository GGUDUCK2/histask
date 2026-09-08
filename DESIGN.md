# DESIGN.md — Histask v0.1

This document defines the visual and interaction design direction for Histask v0.1.

It is a design source of truth for coding agents.

Read together with:

- `PRD.md`
- `AGENTS.md`

Histask is not a marketing website.
Histask is not a generic admin dashboard.
Histask is not a Trello clone.

Histask should feel like a compact, calm, professional work console focused on:

- current work
- recent progress
- time
- history
- fast scanning

---

# 1. Design vision

Histask combines three design ideas:

1. **Linear-like information density**
2. **Sunsama-like time-oriented navigation**
3. **Superlist-like lightness and task readability**

The product should feel:

- compact
- quiet
- fast
- professional
- modern
- low-noise

The UI should help the user answer:

> What am I working on, what changed recently, and what needs attention next?

---

# 2. Core design principle

The most important visual hierarchy is:

```text
Task title
↓
Latest WorkLog
↓
Status / category / tags / due date
↓
Secondary metadata
```

Histask is defined by visible recent progress.

The latest WorkLog must not be hidden behind the card detail drawer.

---

# 3. Design references

Use these products as conceptual references only.

Do not copy visual assets or reproduce their layouts exactly.

## Linear

Reference for:

- information density
- typography scale
- compact spacing
- low-noise borders
- sidebar structure
- keyboard-oriented UX
- restrained use of color

## Sunsama

Reference for:

- time-oriented navigation
- Today-first thinking
- calendar as navigation
- daily work context

## Superlist

Reference for:

- lightweight task presentation
- softer card hierarchy
- readable metadata
- simple task grouping

Histask should feel closer to a work tool than a consumer productivity app.

---

# 4. Visual personality

Histask should feel:

```text
calm
precise
dense
efficient
structured
neutral
```

Avoid:

```text
playful
cartoonish
overly colorful
glassmorphism-heavy
marketing-like
dashboard-template-like
```

---

# 5. Layout

## Desktop

Primary target.

Recommended shell:

```text
┌────────────────────────────────────────────────────────────────────┐
│ histask                                      Search      Settings   │
├──────────────────┬─────────────────────────────────────────────────┤
│                  │ Dashboard metrics                               │
│ Sidebar          ├─────────────────────────────────────────────────┤
│                  │ Filters / sort                                  │
│ Today            ├─────────────────────────────────────────────────┤
│ All Tasks        │                                                 │
│ In Progress      │ Kanban board                                    │
│ Waiting          │                                                 │
│ Completed        │                                                 │
│                  │                                                 │
│ Mini Calendar    │                                                 │
│                  │                                                 │
│ Categories       │                                                 │
│ Tags             │                                                 │
└──────────────────┴─────────────────────────────────────────────────┘
```

## Recommended dimensions

### Sidebar

```text
Width: 232px
Minimum: 220px
Maximum: 260px
```

Sidebar should feel compact.

Do not make it 300px+ without strong reason.

### Top header

```text
Height: 48px
```

### Main content padding

```text
16px to 20px
```

### Kanban column gap

```text
12px
```

### Card vertical gap

```text
8px
```

---

# 6. Color philosophy

Use mostly neutral colors.

Color is for:

- selected state
- category identity
- priority
- warnings
- destructive actions
- due-date urgency

Do not decorate the interface with unnecessary color.

---

# 7. Semantic color tokens

Do not hardcode arbitrary hex values throughout components.

Use semantic tokens.

Suggested light theme:

```css
--background: #fafafa;
--surface: #ffffff;
--surface-subtle: #f7f7f8;
--surface-hover: #f4f4f5;

--border: #e5e7eb;
--border-strong: #d4d4d8;

--text-primary: #18181b;
--text-secondary: #71717a;
--text-muted: #a1a1aa;

--accent: #6366f1;
--accent-hover: #4f46e5;
--accent-soft: #eef2ff;

--success: #16a34a;
--warning: #d97706;
--danger: #dc2626;
```

Suggested dark theme:

```css
--background: #111113;
--surface: #18181b;
--surface-subtle: #141416;
--surface-hover: #202023;

--border: #27272a;
--border-strong: #3f3f46;

--text-primary: #fafafa;
--text-secondary: #a1a1aa;
--text-muted: #71717a;

--accent: #818cf8;
--accent-hover: #a5b4fc;
--accent-soft: #25263d;

--success: #22c55e;
--warning: #f59e0b;
--danger: #ef4444;
```

Exact values may be adjusted if accessibility or shadcn token integration requires it.

Keep the semantic meaning stable.

---

# 8. Typography

Prefer local/system fonts.

Do not depend on an external font CDN for the core app.

Recommended stack:

```css
font-family:
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  "Noto Sans KR",
  Arial,
  sans-serif;
```

If a local/self-hosted font is later introduced, it must not break offline use.

---

# 9. Typography scale

Histask should use smaller text than a content website.

Recommended:

```text
App title            18px / 600
Page title           18px / 600
Section title        13px / 600
Card title           14px / 600
Normal UI            13px / 400
Input text           13px / 400
Metadata             12px / 400
Tag                  11–12px / 500
Dashboard number     22–24px / 600
Dashboard label      11–12px / 500
```

Avoid 16px+ for routine task metadata.

---

# 10. Spacing system

Use a compact spacing scale.

Recommended base:

```text
4px
6px
8px
12px
16px
20px
24px
```

Most UI spacing should live between:

```text
6px–16px
```

Avoid large empty gaps inside task views.

---

# 11. Border radius

Do not use oversized rounded corners.

Recommended:

```text
Button          6px
Input           6px
Tag             5px
Card            8px
Metric tile     8px
Popover         8px
Tooltip         6px
Drawer          10px
Dialog          10px
```

Avoid:

```text
rounded-xl everywhere
rounded-2xl everywhere
pill-shaped containers for normal content
```

Pills are acceptable for small status controls only.

---

# 12. Shadows

Use shadows only where UI physically floats above other UI.

Allowed:

- Drawer
- Dialog
- Popover
- Dropdown
- Tooltip

Avoid large shadows on:

- Kanban cards
- Dashboard metrics
- Sidebar sections
- Filter controls

Primary separation should come from:

```text
border
background contrast
spacing
```

---

# 13. Sidebar

Sidebar is persistent navigation, not a decorative panel.

Recommended structure:

```text
histask

Today
All Tasks
In Progress
Waiting
Completed

──────────────

September 2026
Mini Calendar

──────────────

CATEGORIES
ERP
Operations
Development

+ Category

──────────────

TAGS
bug
waiting
deploy
```

## Sidebar style

- quiet background
- minimal borders
- compact rows
- active state with subtle accent background
- icon use should be consistent and sparse

Navigation row height:

```text
32px–36px
```

Do not make navigation rows oversized.

---

# 14. Mini calendar

The mini calendar is a navigation aid.

It should not visually dominate the sidebar.

## Calendar goals

- quickly select a date
- see subtle activity markers
- jump into date-related work

## Visual rules

- selected day: accent-soft background
- today: subtle ring or accent text
- activity: small dot/indicator
- no heavy colored blocks

Avoid turning the mini calendar into a scheduling heatmap.

---

# 15. Dashboard metrics

Do not use oversized dashboard cards.

Bad:

```text
┌───────────────────┐
│                   │
│      TOTAL        │
│        28         │
│                   │
└───────────────────┘
```

Preferred:

```text
TOTAL         ACTIVE        WAITING        DONE        TODAY
28            7             3              18          5
```

or a compact single-line summary:

```text
28 Total · 7 Active · 3 Waiting · 18 Done · 5 Updated today
```

Recommended metric height:

```text
56px–72px
```

Metrics should support scanning, not act as hero cards.

---

# 16. Kanban board

The board should feel lighter than Trello.

Do not put each column inside a large gray rounded container by default.

Preferred:

```text
TODO  5

────────────────────

Card

Card

Card
```

Column headers should be compact.

Recommended:

```text
status label
count
add button
optional menu
```

Column header height:

```text
32px–40px
```

---

# 17. Kanban card

Cards are the main information unit.

Recommended structure:

```text
ERP settlement issue

SQL condition updated and local test completed.
Production validation still required.

ERP · High · Sep 10

[bug] [settlement]

2h · 4 logs
```

Or:

```text
Title

Category / priority / due

Latest progress text

Tags

Relative time / log count
```

Either structure is acceptable if the latest WorkLog remains visually prominent.

---

# 18. Card hierarchy

Priority:

1. Title
2. Latest WorkLog
3. Category / status / due
4. Tags
5. Relative time / WorkLog count

The latest WorkLog is not secondary decoration.

It is a core part of the card.

---

# 19. Card sizing

Cards should remain compact.

Recommended:

```text
Padding: 10px–12px
Gap: 6px–8px
```

Avoid cards that regularly exceed:

```text
140px–160px height
```

unless the content genuinely requires it.

Long WorkLogs should be clamped.

---

# 20. WorkLog preview

Show a maximum of two lines.

Use:

```css
line-clamp: 2;
```

When truncated:

- hover shows tooltip
- keyboard focus also shows tooltip

The preview should have slightly lower contrast than title but higher importance than minor metadata.

---

# 21. Tag style

Tags should be visually restrained.

Preferred:

```text
[bug] [waiting] [deploy]
```

Use:

- light background
- subtle border
- readable text
- low saturation

Avoid strong rainbow label styling.

Do not assign saturated colors to every tag by default.

---

# 22. Category color

Category is allowed to carry slightly more color than tags.

Possible treatments:

- small colored dot
- subtle left border
- compact category text
- small muted badge

Do not fill the entire card with category color.

---

# 23. Priority style

Priority should be understandable without dominating the card.

Suggested:

```text
↑ High
→ Medium
↓ Low
```

or icon + label.

Only HIGH should be strongly noticeable.

Do not make all priority levels brightly colored.

---

# 24. Due date style

Normal due dates should be neutral.

Urgency states:

```text
Future         neutral
Today          warning
Overdue        danger
Completed      muted/success
```

Do not use bright red unless genuinely overdue.

---

# 25. Card detail drawer

Desktop uses a right-side drawer.

Recommended width:

```text
420px–520px
```

Do not cover the entire desktop unless viewport constraints require it.

Suggested layout:

```text
Title

Status / Category / Priority / Due / Tags

Description

──────────────────
HISTORY

● 10:41
│ SQL update and tests complete
│
● 09:12
│ Reproduced issue
│
● Yesterday
  Customer data verification requested

──────────────────

Add progress...
```

---

# 26. WorkLog detail style

Do not make WorkLogs look like social-media comments.

Avoid:

- speech bubbles
- avatars
- chat-like alignment
- reaction buttons

Histask WorkLogs represent work history.

Preferred visual metaphor:

```text
timeline
activity log
history
```

---

# 27. WorkLog timeline

Recommended:

```text
● 10:41
│ SQL update and tests complete
│
● 09:12
│ Reproduced issue
│ settlement_type = 3
│
● Yesterday 16:20
  Customer data verification requested
```

Use a subtle vertical line.

Timestamp should be small and muted.

WorkLog content should remain readable.

---

# 28. Drawer editing

Avoid making every field look like a large form.

Preferred:

```text
Status      In Progress
Category    ERP
Priority    High
Due         Sep 10
Tags        bug, deploy
```

Fields may become editable on click/select.

This keeps the drawer readable as task detail, not a data-entry form.

---

# 29. Today view

Today should feel like a work timeline/list.

Recommended:

```text
Today

Due Today
ERP deployment
Customer verification

Updated Today

10:41
SQL update and tests complete
ERP settlement issue

09:12
Reproduced issue
ERP settlement issue

Completed Today
Database backup
```

Do not reuse the full Kanban board here.

---

# 30. Search

Search should be fast and visually lightweight.

Preferred placement:

- top app bar
- keyboard shortcut `/`

Search input should not permanently consume excessive width.

Search result hierarchy:

```text
Card title
matching WorkLog / description excerpt
category / tags
```

Highlight matching text carefully.

---

# 31. Filters

Filters should be compact.

Preferred:

```text
Category: ERP
Tag: bug
Status: In Progress
Priority: High
```

Active filters may use small chips.

Do not fill the page with large filter cards.

Provide:

```text
Clear all
```

when filters are active.

---

# 32. Empty states

Keep empty states minimal.

Example:

```text
No tasks yet

Create your first task.

[ Add task ]
```

Do not use large illustrations in the core work interface.

---

# 33. Loading states

Most local IndexedDB operations should be fast.

Use subtle loading states.

Avoid full-screen spinners for ordinary reads.

Prefer:

- skeleton for initial app load if necessary
- inline pending state
- disabled action while write completes

---

# 34. Error states

Error states should be calm and specific.

Examples:

```text
Could not save this task.
Your previous data is unchanged.

Retry
```

For backup import:

```text
This backup file is invalid.
No existing Histask data was changed.
```

Avoid generic "Something went wrong" when a more precise message is available.

---

# 35. Theme behavior

Support:

- System
- Light
- Dark

Dark mode should not simply invert colors.

Maintain:

- readable borders
- muted surfaces
- clear focus states
- restrained accent

---

# 36. Icons

Use one icon system consistently.

If shadcn setup uses Lucide, prefer Lucide.

Do not mix multiple icon libraries.

Icons should support labels, not replace them when meaning is unclear.

Recommended size:

```text
14px–16px routine
18px navigation
```

Avoid oversized 24px icons throughout the work UI.

---

# 37. Motion

Animation should be subtle and functional.

Allowed:

- drawer open/close
- dropdown/popover
- drag feedback
- hover transitions
- small status transitions

Recommended duration:

```text
120ms–200ms
```

Avoid:

- bouncing
- large scaling
- decorative page transitions
- excessive spring effects

---

# 38. Drag state

When dragging:

- card should gain subtle elevation
- original slot should remain understandable
- target column should indicate acceptance
- layout should not jump unpredictably

Do not apply extreme scale or rotation effects.

---

# 39. Responsive rules

## Desktop

Full sidebar + board + drawer.

## Tablet

Sidebar may collapse.

Kanban remains horizontally scrollable.

## Mobile

Sidebar becomes sheet.

Card detail becomes full-screen or near-full-screen sheet.

Do not attempt to squeeze four columns into viewport width.

Horizontal board scrolling is acceptable.

---

# 40. Accessibility design rules

Must include:

- visible focus ring
- keyboard-focusable tooltip trigger
- sufficient color contrast
- text labels for ambiguous icons
- non-color status indicators
- accessible dialogs/drawers
- clear destructive actions

Do not remove outlines without replacing them.

---

# 41. Design tokens

Prefer centralized design tokens.

Example:

```css
:root {
  --radius-control: 6px;
  --radius-card: 8px;
  --radius-overlay: 10px;

  --space-1: 4px;
  --space-2: 6px;
  --space-3: 8px;
  --space-4: 12px;
  --space-5: 16px;
  --space-6: 20px;
}
```

Use shadcn/Tailwind theme integration where appropriate.

Do not scatter arbitrary values across many components.

---

# 42. Component density

Preferred controls:

```text
Button height          30px–34px
Input height           32px–36px
Sidebar row            32px–36px
Tag height             20px–24px
Kanban header          32px–40px
```

Avoid 44px+ desktop controls unless accessibility/use case requires it.

---

# 43. Design do

DO:

- keep latest WorkLog visible
- use compact typography
- use neutral surfaces
- use thin borders
- use restrained accent color
- use timeline styling for WorkLogs
- make Today time-oriented
- make calendar part of navigation
- make the interface keyboard-friendly
- prioritize scanning over decoration
- preserve information density
- make dark mode equally usable

---

# 44. Design don't

DO NOT:

- build a generic shadcn dashboard
- make Histask look like a template marketplace dashboard
- copy Trello card styling directly
- use oversized cards
- use rounded-2xl everywhere
- use heavy shadows
- use decorative gradients
- use glassmorphism as the main visual language
- give every tag a saturated color
- make dashboard metrics huge
- add large empty whitespace
- make WorkLogs look like chat messages
- hide the latest WorkLog behind the drawer
- use giant icons
- use marketing-style hero sections inside the app
- add illustrations that reduce work density
- use animation for decoration
- make every control a pill
- add visual complexity without functional value

---

# 45. Reference screen target

A good Histask desktop screen should roughly feel like this:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ histask             Search...                         + New task   ⚙ │
├──────────────────┬───────────────────────────────────────────────────┤
│ Today            │ 28 Total   7 Active   3 Waiting   18 Done   5 ↑ │
│ All Tasks        ├───────────────────────────────────────────────────┤
│ In Progress      │ Category: All   Tags: All   Sort: Manual          │
│ Waiting          ├───────────────────────────────────────────────────┤
│ Completed        │                                                   │
│                  │ TODO        IN PROGRESS     WAITING       DONE    │
│ September 2026   │                                                   │
│ S M T W T F S    │ ┌────────┐  ┌──────────┐                          │
│     1 2 3 4 5    │ │ ERP    │  │ API fix  │                          │
│ 6 7 [8] 9...     │ │ issue  │  │          │                          │
│                  │ │        │  │ SQL test │                          │
│ CATEGORIES       │ │ latest │  │ complete │                          │
│ ● ERP          8 │ │ log... │  │          │                          │
│ ● Operations   4 │ │        │  │ #bug     │                          │
│ ● Development  7 │ │ 2h · 4 │  │ 10m · 6 │                          │
│                  │ └────────┘  └──────────┘                          │
│ TAGS             │                                                   │
│ bug waiting      │                                                   │
└──────────────────┴───────────────────────────────────────────────────┘
```

This is a density reference, not a pixel-perfect specification.

---

# 46. Design review checklist

Before considering a screen complete, ask:

1. Is the latest WorkLog visible where expected?
2. Can the user scan titles quickly?
3. Is metadata secondary to task/progress?
4. Is the screen compact enough for daily work?
5. Are borders doing more work than shadows?
6. Is color restrained?
7. Are tags visually quiet?
8. Are due/priority warnings proportionate?
9. Does the screen work with keyboard focus?
10. Does dark mode preserve hierarchy?
11. Does this look like a work tool rather than a dashboard template?
12. Did we accidentally add unnecessary whitespace?
13. Are controls larger than they need to be?
14. Is the calendar acting as navigation, not decoration?
15. Does the WorkLog feel like history rather than chat?

If several answers are negative, revise the screen before considering it polished.

---

# 47. Final design rule

When visual choices conflict, prefer in this order:

1. fast scanning
2. recent progress visibility
3. information density
4. readability
5. interaction clarity
6. accessibility
7. visual polish
8. decoration

Histask should feel like a quiet console for getting work done.
