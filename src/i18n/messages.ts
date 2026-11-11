import type {
  CardSortMode,
  DueDateFilter,
  SearchMatchSource,
} from '@/types/card-query'
import type {
  CardStatus,
  ClassificationColor,
  Priority,
} from '@/types/domain'
import type { Language } from '@/types/settings'
import type { StoragePersistenceStatus } from '@/services/storage-status'

export type ResolvedLanguage = Exclude<Language, 'system'>

export function resolveSystemLanguage(): ResolvedLanguage {
  if (typeof navigator === 'undefined') return 'en'
  const primary = (navigator.languages?.[0] ?? navigator.language ?? 'en').toLowerCase()
  return primary.startsWith('ko') ? 'ko' : 'en'
}

export function getIntlLocale(language: ResolvedLanguage): string {
  return language === 'ko' ? 'ko-KR' : 'en-US'
}

type StorageViewStatus = StoragePersistenceStatus | 'checking' | 'requesting'

export interface Messages {
  common: {
    cancel: string
    save: string
    saving: string
    delete: string
    deleting: string
    dismiss: string
    retry: string
    reload: string
    clear: string
    close: string
    edited: string
    newLabel: string
    taskCountLabel: (count: number) => string
    workLogCountLabel: (count: number) => string
  }
  statuses: Record<CardStatus, string>
  priorities: Record<Priority, string>
  sortModes: Record<CardSortMode, string>
  dueFilters: Record<DueDateFilter, string>
  searchSources: Record<SearchMatchSource, string>
  colors: Record<ClassificationColor, string>
  appShell: {
    brandSubtitle: string
    openNavigation: string
    navigationTitle: string
    navigationDescription: string
    newTask: string
    settings: string
    openingLocalData: string
    openDbErrorTitle: string
    openDbErrorDescription: string
    routeErrorTitle: string
    routeErrorDescription: string
    pwaUpdateRegionLabel: string
    pwaUpdateTitle: string
    pwaUpdateDescription: string
    pwaUpdateDismiss: string
  }
  sidebar: {
    primaryNavLabel: string
    today: string
    allTasks: string
    inProgress: string
    waiting: string
    completed: string
    categories: string
    newCategory: string
    noCategories: string
    editCategory: (name: string) => string
    tags: string
    newTag: string
    noTags: string
    editTag: (name: string) => string
  }
  dashboard: {
    regionLabel: string
    loadError: string
    filterDisclaimer: string
    metrics: {
      total: string
      totalHint: string
      inProgress: string
      waiting: string
      done: string
      updatedToday: string
      updatedTodayHint: string
    }
  }
  board: {
    views: {
      all: { title: string; subtitle: string }
      inProgress: { title: string; subtitle: string }
      waiting: { title: string; subtitle: string }
      completed: { title: string; subtitle: string }
    }
    loadError: string
    loadingTasks: string
    sortedNoticePrefix: string
    sortedNoticeBodySingle: string
    sortedNoticeBodyMulti: string
    dndDisabledOver: (sortLabel: string) => string
    dndDisabledDrop: (sortLabel: string) => string
    dndPersistFailed: string
    reorderPersistFailed: string
    emptyAllTitle: string
    emptyStatusTitle: (statusLabel: string) => string
    emptyDescription: string
    createTask: string
    importBackup: string
    noMatchingTitle: string
    noMatchingDescription: string
    clearAllFilters: string
    columnAria: (statusLabel: string, count: number) => string
    addTaskToColumn: (statusLabel: string) => string
    emptyColumn: (statusLabel: string) => string
    taskTitleRequired: string
    createTaskFallbackError: string
    newColumnTaskLabel: (statusLabel: string) => string
    taskTitlePlaceholder: string
    add: string
    adding: string
    newTaskDialogTitle: string
    newTaskDialogDescription: string
    titleFieldLabel: string
    titleDialogPlaceholder: string
    columnFieldLabel: string
    creating: string
    dragCardAria: (title: string) => string
    taskActionsAria: (title: string) => string
    openDetails: string
    moveToStatus: string
    reorder: string
    moveUp: string
    moveDown: string
    latestLogAria: (content: string) => string
    noProgressLog: string
    dueOverdueTag: string
    dueTodayTag: string
  }
  cardDetail: {
    archive: string
    delete: string
    descriptionSrOnly: (title: string) => string
    historyHeading: (count: number) => string
    archiveError: string
    deleteError: string
    archiveDialogTitle: string
    archiveDialogDescription: (title: string) => string
    archiveConfirm: string
    archiving: string
    deleteDialogTitle: string
    deleteDialogDescription: (title: string, logCount: number) => string
    deleteConfirm: string
    titleField: string
    statusField: string
    priorityField: string
    categoryField: string
    noCategory: string
    dueDateField: string
    tagsField: string
    noTagsCreated: string
    descriptionField: string
    descriptionPlaceholder: string
    createdField: string
    updatedField: string
    completedField: string
    savedChanges: string
    saveChanges: string
    saveErrorFallback: string
  }
  workLog: {
    addLabel: string
    composerHint: string
    composerPlaceholder: string
    emptyNoteError: string
    createFallbackError: string
    saveButton: string
    emptyTimeline: string
    timelineAria: string
    latestBadge: string
    editedTooltip: (exactTime: string) => string
    editAria: string
    deleteAria: string
    editContentAria: string
    editEmptyError: string
    updateFallbackError: string
    deleteFallbackError: string
    deleteDialogTitle: string
    deleteDialogDescription: string
    deleteConfirm: string
  }
  search: {
    inputAria: string
    placeholder: string
    clearSearchAria: string
    listboxAria: string
    noResults: (query: string) => string
    showingTopMatches: (shown: number, total: number) => string
  }
  filters: {
    regionAria: string
    byCategoryAria: string
    allCategories: string
    byTagAria: string
    allTags: string
    byStatusAria: string
    allStatuses: string
    byPriorityAria: string
    allPriorities: string
    byDueAria: string
    sortAria: string
    activeLabel: string
    chipSearch: string
    chipCategory: string
    chipTag: string
    chipStatus: string
    chipPriority: string
    chipDue: string
    clearAll: string
  }
  classifications: {
    newCategoryTitle: string
    editCategoryTitle: string
    newTagTitle: string
    editTagTitle: string
    categoryDescription: string
    tagDescription: string
    nameLabel: string
    categoryPlaceholder: string
    tagPlaceholder: string
    colorLabel: string
    categoryRequiredError: string
    tagRequiredError: string
    categorySaveFallbackError: string
    tagSaveFallbackError: string
    categoryDeleteFallbackError: string
    tagDeleteFallbackError: string
    createCategory: string
    createTag: string
    deleteCategoryTitle: string
    deleteTagTitle: string
    deleteCategoryDescription: (name: string, count: number) => string
    deleteTagDescription: (name: string, count: number) => string
    deleteCategoryConfirm: string
    deleteTagConfirm: string
  }
  calendar: {
    weekdays: readonly [string, string, string, string, string, string, string]
    previousMonth: string
    nextMonth: string
    indicatorDue: string
    indicatorWorkLog: string
    indicatorCompleted: string
    dateActivity: (formattedDate: string) => string
    previousDayAria: string
    previousDayShort: string
    todayButton: string
    nextDayAria: string
    nextDayShort: string
    invalidDateNotice: (rawDateKey: string) => string
    loadingDateHistory: (dateKey: string) => string
    emptyDateTitle: (formattedDate: string) => string
    emptyDateDescription: string
    backToAllTasks: string
    dueSection: (count: number) => string
    dueEmpty: string
    updatedSection: (count: number) => string
    updatedEmpty: string
    completedSection: (count: number) => string
    completedEmpty: string
    extraLogsThisDay: (latest: string, extraCount: number) => string
  }
  today: {
    title: string
    openBoard: string
    loading: string
    emptyTitle: string
    emptyDescription: string
    viewAllTasks: string
    dueToday: (count: number) => string
    dueTodayEmpty: string
    updatedToday: (count: number) => string
    updatedTodayEmpty: string
    completedToday: (count: number) => string
    completedTodayEmpty: string
    createdToday: (count: number) => string
    logsToday: (count: number) => string
  }
  settings: {
    pageTitle: string
    pageSubtitle: string
    dataSection: string
    applicationSection: string
    aboutSection: string
    themeTitle: string
    themeDescription: string
    themeOptions: Record<'system' | 'light' | 'dark', string>
    themeReadError: string
    themeSaveError: string
    languageTitle: string
    languageDescription: string
    languageOptions: Record<Language, string>
    languageReadError: string
    languageSaveError: string
    storageTitle: string
    storageRetentionNote: string
    storageRequestButton: string
    storageStatuses: Record<StorageViewStatus, string>
    exportTitle: string
    exportDescription: string
    exportButton: string
    exportingButton: string
    exportSuccess: (filename: string) => string
    exportError: string
    importTitle: string
    importDescription: string
    importDropHint: string
    importChooseButton: string
    importChangeButton: string
    importReadingButton: string
    importReviewButton: string
    importClearButton: string
    importValidSummary: (
      cards: number,
      workLogs: number,
      categories: number,
      tags: number,
    ) => string
    importValidMessage: (fileName: string) => string
    importReadError: string
    importInvalidPrefix: (reason: string) => string
    importRestoreSuccess: string
    importRestoreError: string
    importDialogTitle: string
    importDialogDescription: (fileName: string) => string
    importDialogRows: {
      cards: string
      workLogs: string
      categories: string
      tags: string
      cardTags: string
    }
    importDialogWarning: string
    importDialogConfirm: string
    importDialogConfirming: string
    deleteAllTitle: string
    deleteAllDescription: string
    deleteAllTrigger: string
    deleteAllDialogTitle: string
    deleteAllDialogDescription: string
    deleteAllConfirmLabel: string
    deleteAllConfirmPlaceholder: string
    deleteAllConfirmButton: string
    deleteAllSuccess: string
    deleteAllError: string
    aboutVersion: string
    aboutStorage: string
    aboutStorageValue: string
    aboutSchema: string
  }
}

export const MESSAGES: Record<ResolvedLanguage, Messages> = {
  en: {
    common: {
      cancel: 'Cancel',
      save: 'Save',
      saving: 'Saving...',
      delete: 'Delete',
      deleting: 'Deleting...',
      dismiss: 'Dismiss',
      retry: 'Retry',
      reload: 'Reload',
      clear: 'Clear',
      close: 'Close',
      edited: '(edited)',
      newLabel: 'New',
      taskCountLabel: (count) => `${count} ${count === 1 ? 'task' : 'tasks'}`,
      workLogCountLabel: (count) =>
        `${count} WorkLog${count === 1 ? '' : 's'}`,
    },
    statuses: {
      TODO: 'To do',
      IN_PROGRESS: 'In progress',
      WAITING: 'Waiting',
      DONE: 'Done',
    },
    priorities: {
      NONE: 'None',
      LOW: 'Low',
      MEDIUM: 'Medium',
      HIGH: 'High',
    },
    sortModes: {
      manual: 'Manual',
      recentlyUpdated: 'Recently updated',
      createdDate: 'Created date',
      dueDate: 'Due date',
      priority: 'Priority',
    },
    dueFilters: {
      all: 'Any due date',
      overdue: 'Overdue',
      today: 'Due today',
      upcoming: 'Upcoming',
      noDue: 'No due date',
    },
    searchSources: {
      title: 'Title',
      description: 'Description',
      category: 'Category',
      tag: 'Tag',
      workLog: 'WorkLog',
    },
    colors: {
      slate: 'Slate',
      indigo: 'Indigo',
      blue: 'Blue',
      teal: 'Teal',
      amber: 'Amber',
      rose: 'Rose',
    },
    appShell: {
      brandSubtitle: 'Local work history',
      openNavigation: 'Open navigation',
      navigationTitle: 'Navigation',
      navigationDescription:
        'Navigate between Histask views, calendar dates, categories, and tags.',
      newTask: 'New task',
      settings: 'Settings',
      openingLocalData: 'Opening local Histask data…',
      openDbErrorTitle: 'Could not open local Histask data',
      openDbErrorDescription:
        'The database was not reset or deleted. Retry opening it, or keep this browser tab available and try again later.',
      routeErrorTitle: 'Could not open this view',
      routeErrorDescription:
        'Your local Histask data was not reset. Reload the application to try again.',
      pwaUpdateRegionLabel: 'Application update available',
      pwaUpdateTitle: 'Update available',
      pwaUpdateDescription:
        'Reload when ready to use the latest app shell. Local data stays preserved.',
      pwaUpdateDismiss: 'Dismiss update notification',
    },
    sidebar: {
      primaryNavLabel: 'Primary',
      today: 'Today',
      allTasks: 'All Tasks',
      inProgress: 'In Progress',
      waiting: 'Waiting',
      completed: 'Completed',
      categories: 'Categories',
      newCategory: 'New category',
      noCategories: 'No categories yet',
      editCategory: (name) => `Edit category ${name}`,
      tags: 'Tags',
      newTag: 'New tag',
      noTags: 'No tags yet',
      editTag: (name) => `Edit tag ${name}`,
    },
    dashboard: {
      regionLabel: 'Workspace metrics',
      loadError: 'Could not load task metrics from local storage.',
      filterDisclaimer:
        'Metrics reflect all active tasks regardless of board search or filters.',
      metrics: {
        total: 'Total',
        totalHint: 'All active tasks',
        inProgress: 'In Progress',
        waiting: 'Waiting',
        done: 'Done',
        updatedToday: 'Updated Today',
        updatedTodayHint: 'Unique cards with WorkLogs today',
      },
    },
    board: {
      views: {
        all: {
          title: 'All Tasks',
          subtitle:
            'Track task progress across statuses with the latest WorkLog on every card.',
        },
        inProgress: {
          title: 'In Progress',
          subtitle: 'Tasks actively moving forward right now.',
        },
        waiting: {
          title: 'Waiting',
          subtitle:
            'Tasks paused on external feedback, reviews, or dependencies.',
        },
        completed: {
          title: 'Completed',
          subtitle: 'Finished tasks with recorded completion history.',
        },
      },
      loadError:
        'Could not load tasks from local IndexedDB storage. Refresh the page or verify storage status in Settings.',
      loadingTasks: 'Loading local tasks...',
      sortedNoticePrefix: 'Sorted by',
      sortedNoticeBodySingle:
        'Within-column manual reordering is disabled in this mode.',
      sortedNoticeBodyMulti:
        'Within-column manual reordering is disabled in this mode; dragging across columns still updates status.',
      dndDisabledOver: (sortLabel) =>
        `Manual within-column reordering is disabled while sorted by ${sortLabel}. Drag to another column to change status, or switch sort to Manual.`,
      dndDisabledDrop: (sortLabel) =>
        `Manual within-column reordering is disabled while sorted by ${sortLabel}. Switch sort to Manual to drag cards inside a column.`,
      dndPersistFailed:
        'Could not save the new task order or status locally. Your previous board order was restored.',
      reorderPersistFailed: 'Could not save the new task order locally.',
      emptyAllTitle: 'No tasks yet',
      emptyStatusTitle: (statusLabel) =>
        `No ${statusLabel.toLowerCase()} tasks yet`,
      emptyDescription:
        'Create your first task or restore an existing Histask backup stored on this device.',
      createTask: 'Create task',
      importBackup: 'Import backup',
      noMatchingTitle: 'No matching tasks',
      noMatchingDescription:
        'No active tasks match your current search query or selected filters.',
      clearAllFilters: 'Clear all filters',
      columnAria: (statusLabel, count) => `${statusLabel} (${count})`,
      addTaskToColumn: (statusLabel) => `Add task to ${statusLabel}`,
      emptyColumn: (statusLabel) => `No ${statusLabel.toLowerCase()} tasks`,
      taskTitleRequired: 'Task title is required.',
      createTaskFallbackError: 'Could not create task locally. Please try again.',
      newColumnTaskLabel: (statusLabel) => `New ${statusLabel} task title`,
      taskTitlePlaceholder: 'Task title...',
      add: 'Add',
      adding: 'Adding...',
      newTaskDialogTitle: 'New task',
      newTaskDialogDescription:
        'Create a task with a title and initial status. You can add notes and WorkLogs anytime.',
      titleFieldLabel: 'Title',
      titleDialogPlaceholder: 'What needs progress?',
      columnFieldLabel: 'Column',
      creating: 'Creating...',
      dragCardAria: (title) => `Drag ${title}`,
      taskActionsAria: (title) => `Task actions for ${title}`,
      openDetails: 'Open details',
      moveToStatus: 'Move to status',
      reorder: 'Reorder',
      moveUp: 'Move up',
      moveDown: 'Move down',
      latestLogAria: (content) => `Latest progress log: ${content}`,
      noProgressLog: 'No progress log yet',
      dueOverdueTag: '(Overdue)',
      dueTodayTag: '(Today)',
    },
    cardDetail: {
      archive: 'Archive',
      delete: 'Delete',
      descriptionSrOnly: (title) =>
        `Edit task details and record progress WorkLogs for ${title}.`,
      historyHeading: (count) => `History (${count})`,
      archiveError: 'Could not archive this task locally.',
      deleteError: 'Could not delete this task locally.',
      archiveDialogTitle: 'Archive task?',
      archiveDialogDescription: (title) =>
        `Archiving removes "${title}" from active boards and metrics while keeping the task and all its WorkLogs preserved inside JSON backups.`,
      archiveConfirm: 'Archive task',
      archiving: 'Archiving...',
      deleteDialogTitle: 'Delete task permanently?',
      deleteDialogDescription: (title, logCount) =>
        `This permanently removes "${title}" along with all ${logCount} WorkLog${logCount === 1 ? '' : 's'} and tag links from local storage. This cannot be undone.`,
      deleteConfirm: 'Delete permanently',
      titleField: 'Title',
      statusField: 'Status',
      priorityField: 'Priority',
      categoryField: 'Category',
      noCategory: 'No category',
      dueDateField: 'Due date',
      tagsField: 'Tags',
      noTagsCreated: 'No tags created yet.',
      descriptionField: 'Description',
      descriptionPlaceholder:
        'Context, links, acceptance criteria, or key notes...',
      createdField: 'Created',
      updatedField: 'Updated',
      completedField: 'Completed',
      savedChanges: 'Saved changes.',
      saveChanges: 'Save changes',
      saveErrorFallback:
        'Could not save task changes locally. Your edits were kept.',
    },
    workLog: {
      addLabel: 'Add WorkLog',
      composerHint: 'Enter for newline · Ctrl/Cmd+Enter to save',
      composerPlaceholder:
        'Record what moved forward, blockers, or next concrete step...',
      emptyNoteError: 'Write a progress note before saving.',
      createFallbackError:
        'Could not save WorkLog locally. Your note was preserved.',
      saveButton: 'Save WorkLog',
      emptyTimeline:
        'No progress history yet. Add the first WorkLog above so you can track updates directly from the board.',
      timelineAria: 'WorkLog history',
      latestBadge: 'Latest',
      editedTooltip: (exactTime) => `Edited ${exactTime}`,
      editAria: 'Edit WorkLog',
      deleteAria: 'Delete WorkLog',
      editContentAria: 'Edit WorkLog content',
      editEmptyError: 'WorkLog content cannot be empty.',
      updateFallbackError:
        'Could not update WorkLog locally. Your draft was kept.',
      deleteFallbackError: 'Could not delete this WorkLog locally.',
      deleteDialogTitle: 'Delete WorkLog?',
      deleteDialogDescription:
        "This WorkLog entry will be permanently removed from this task's progress history. The task card will update to show the previous WorkLog (if any).",
      deleteConfirm: 'Delete WorkLog',
    },
    search: {
      inputAria: 'Search tasks',
      placeholder: 'Search tasks... (/)',
      clearSearchAria: 'Clear search',
      listboxAria: 'Matching tasks',
      noResults: (query) => `No matching tasks for "${query}"`,
      showingTopMatches: (shown, total) =>
        `Showing ${shown} of ${total} matches. Board cards are filtered in place.`,
    },
    filters: {
      regionAria: 'Filter and sort tasks',
      byCategoryAria: 'Filter by category',
      allCategories: 'All categories',
      byTagAria: 'Filter by tag',
      allTags: 'All tags',
      byStatusAria: 'Filter by status',
      allStatuses: 'All statuses',
      byPriorityAria: 'Filter by priority',
      allPriorities: 'All priorities',
      byDueAria: 'Filter by due date',
      sortAria: 'Sort tasks',
      activeLabel: 'Active:',
      chipSearch: 'Search',
      chipCategory: 'Category',
      chipTag: 'Tag',
      chipStatus: 'Status',
      chipPriority: 'Priority',
      chipDue: 'Due',
      clearAll: 'Clear all',
    },
    classifications: {
      newCategoryTitle: 'New category',
      editCategoryTitle: 'Edit category',
      newTagTitle: 'New tag',
      editTagTitle: 'Edit tag',
      categoryDescription: 'Categories group related work streams cleanly.',
      tagDescription:
        'Tags label cross-cutting topics; multiple tags can belong to one task.',
      nameLabel: 'Name',
      categoryPlaceholder: 'e.g. Platform Ops',
      tagPlaceholder: 'e.g. blocker',
      colorLabel: 'Color',
      categoryRequiredError: 'Category name is required.',
      tagRequiredError: 'Tag name is required.',
      categorySaveFallbackError: 'Could not save category locally.',
      tagSaveFallbackError: 'Could not save tag locally.',
      categoryDeleteFallbackError: 'Could not delete this category locally.',
      tagDeleteFallbackError: 'Could not delete this tag locally.',
      createCategory: 'Create category',
      createTag: 'Create tag',
      deleteCategoryTitle: 'Delete category?',
      deleteTagTitle: 'Delete tag?',
      deleteCategoryDescription: (name, count) =>
        `Deleting "${name}" removes this category label only. All ${count} linked task${count === 1 ? '' : 's'} and their WorkLogs remain intact.`,
      deleteTagDescription: (name, count) =>
        `Deleting "${name}" detaches this tag from ${count} task${count === 1 ? '' : 's'}. Tasks and WorkLogs are not deleted.`,
      deleteCategoryConfirm: 'Delete category',
      deleteTagConfirm: 'Delete tag',
    },
    calendar: {
      weekdays: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
      previousMonth: 'Previous month',
      nextMonth: 'Next month',
      indicatorDue: 'due tasks',
      indicatorWorkLog: 'WorkLogs',
      indicatorCompleted: 'completed tasks',
      dateActivity: (formattedDate) => `Date activity (${formattedDate})`,
      previousDayAria: 'Previous day',
      previousDayShort: 'Prev',
      todayButton: 'Today',
      nextDayAria: 'Next day',
      nextDayShort: 'Next',
      invalidDateNotice: (rawDateKey) =>
        `Invalid calendar date "${rawDateKey}". Showing today's date instead.`,
      loadingDateHistory: (dateKey) => `Loading local history for ${dateKey}...`,
      emptyDateTitle: (formattedDate) => `No tasks recorded on ${formattedDate}`,
      emptyDateDescription:
        'No tasks had a due date, WorkLog update, or completion on this day.',
      backToAllTasks: 'Back to All Tasks',
      dueSection: (count) => `Due (${count})`,
      dueEmpty: 'No tasks due on this date.',
      updatedSection: (count) => `Updated (${count})`,
      updatedEmpty: 'No WorkLogs created on this date.',
      completedSection: (count) => `Completed (${count})`,
      completedEmpty: 'No tasks completed on this date.',
      extraLogsThisDay: (latest, extraCount) =>
        `${latest} (+${extraCount} more log${extraCount === 1 ? '' : 's'} this day)`,
    },
    today: {
      title: 'Today',
      openBoard: 'Open Board',
      loading: "Loading today's activity...",
      emptyTitle: 'Nothing due, updated, or completed today',
      emptyDescription:
        "Create a task or log progress on an active card to see today's summary here.",
      viewAllTasks: 'View All Tasks',
      dueToday: (count) => `Due Today (${count})`,
      dueTodayEmpty: 'No tasks due today.',
      updatedToday: (count) => `Updated Today (${count})`,
      updatedTodayEmpty: 'No WorkLogs recorded yet today.',
      completedToday: (count) => `Completed Today (${count})`,
      completedTodayEmpty: 'No tasks completed today.',
      createdToday: (count) => `Created Today (${count})`,
      logsToday: (count) => `${count} logs today`,
    },
    settings: {
      pageTitle: 'Settings',
      pageSubtitle:
        'Storage, backups, appearance, language, and local application details.',
      dataSection: 'Data',
      applicationSection: 'Application',
      aboutSection: 'About',
      themeTitle: 'Theme',
      themeDescription: 'System follows your operating system appearance.',
      themeOptions: {
        system: 'System',
        light: 'Light',
        dark: 'Dark',
      },
      themeReadError: 'Could not read the saved theme preference.',
      themeSaveError: 'Could not save the theme preference.',
      languageTitle: 'Language',
      languageDescription:
        'Choose interface language. System matches your browser locale.',
      languageOptions: {
        system: 'System',
        en: 'English',
        ko: '한국어',
      },
      languageReadError: 'Could not read the saved language preference.',
      languageSaveError: 'Could not save the language preference.',
      storageTitle: 'Browser storage',
      storageRetentionNote:
        'Data stays in this browser profile and origin. Persistence does not guarantee permanent retention.',
      storageRequestButton: 'Request persistence',
      storageStatuses: {
        checking: 'Checking browser storage status…',
        requesting: 'Requesting persistent local storage…',
        persisted: 'This browser reports that Histask storage is persistent.',
        'not-persisted':
          'Data is local, but the browser may reclaim its storage.',
        denied: 'The browser did not grant persistent storage.',
        unsupported:
          'This browser does not report persistent storage status.',
        error: 'Could not read the browser storage status.',
      },
      exportTitle: 'Export backup',
      exportDescription:
        'Save all Cards, WorkLogs, Categories, Tags, and tag links as JSON.',
      exportButton: 'Export',
      exportingButton: 'Exporting…',
      exportSuccess: (filename) => `Saved ${filename} locally.`,
      exportError: 'Could not export this backup. Your local data is unchanged.',
      importTitle: 'Import backup',
      importDescription:
        'Select or drop a JSON backup file to validate locally before replacement.',
      importDropHint: 'Drop a .json backup file here, or choose from this device.',
      importChooseButton: 'Choose file…',
      importChangeButton: 'Change file',
      importReadingButton: 'Validating…',
      importReviewButton: 'Review',
      importClearButton: 'Clear selected file',
      importValidSummary: (cards, workLogs, categories, tags) =>
        `${cards} Cards · ${workLogs} WorkLogs · ${categories} Categories · ${tags} Tags`,
      importValidMessage: (fileName) =>
        `${fileName} is valid and ready for review.`,
      importReadError:
        'Could not read this backup file. No existing Histask data was changed.',
      importInvalidPrefix: (reason) =>
        `${reason} No existing Histask data was changed.`,
      importRestoreSuccess:
        'Backup restored. Histask now uses the imported local data.',
      importRestoreError:
        'Could not restore this backup. Your previous data is unchanged.',
      importDialogTitle: 'Replace existing data?',
      importDialogDescription: (fileName) =>
        `${fileName} passed full validation. Importing it replaces every current Card, WorkLog, Category, Tag, and tag link. Appearance and language settings stay unchanged.`,
      importDialogRows: {
        cards: 'Cards',
        workLogs: 'WorkLogs',
        categories: 'Categories',
        tags: 'Tags',
        cardTags: 'Tag links',
      },
      importDialogWarning:
        'This operation cannot be merged or undone. Export a current backup first if you may need it.',
      importDialogConfirm: 'Replace data',
      importDialogConfirming: 'Replacing…',
      deleteAllTitle: 'Delete all data',
      deleteAllDescription:
        'Permanently remove every local task, history entry, classification, and setting.',
      deleteAllTrigger: 'Delete…',
      deleteAllDialogTitle: 'Delete all local data?',
      deleteAllDialogDescription:
        'This permanently deletes every Card and WorkLog from this browser profile. Export a backup first if you may need this data.',
      deleteAllConfirmLabel: 'Type DELETE to confirm',
      deleteAllConfirmPlaceholder: 'DELETE',
      deleteAllConfirmButton: 'Delete all data',
      deleteAllSuccess: 'All local Histask data was deleted.',
      deleteAllError:
        'Could not delete local data. Your previous data is unchanged.',
      aboutVersion: 'Histask version',
      aboutStorage: 'Storage',
      aboutStorageValue: 'IndexedDB',
      aboutSchema: 'Database schema',
    },
  },
  ko: {
    common: {
      cancel: '취소',
      save: '저장',
      saving: '저장 중...',
      delete: '삭제',
      deleting: '삭제 중...',
      dismiss: '닫기',
      retry: '다시 시도',
      reload: '새로고침',
      clear: '지우기',
      close: '닫기',
      edited: '(수정됨)',
      newLabel: '새 항목',
      taskCountLabel: (count) => `${count}개 작업`,
      workLogCountLabel: (count) => `WorkLog ${count}개`,
    },
    statuses: {
      TODO: '할 일',
      IN_PROGRESS: '진행 중',
      WAITING: '대기',
      DONE: '완료',
    },
    priorities: {
      NONE: '없음',
      LOW: '낮음',
      MEDIUM: '보통',
      HIGH: '높음',
    },
    sortModes: {
      manual: '수동 정렬',
      recentlyUpdated: '최근 수정순',
      createdDate: '생성일순',
      dueDate: '마감일순',
      priority: '우선순위순',
    },
    dueFilters: {
      all: '모든 마감일',
      overdue: '마감 지남',
      today: '오늘 마감',
      upcoming: '예정',
      noDue: '마감일 없음',
    },
    searchSources: {
      title: '제목',
      description: '설명',
      category: '카테고리',
      tag: '태그',
      workLog: 'WorkLog',
    },
    colors: {
      slate: '슬레이트',
      indigo: '인디고',
      blue: '블루',
      teal: '틸',
      amber: '앰버',
      rose: '로즈',
    },
    appShell: {
      brandSubtitle: '로컬 업무 기록',
      openNavigation: '탐색 메뉴 열기',
      navigationTitle: '탐색 메뉴',
      navigationDescription:
        'Histask 보기, 날짜, 카테고리, 태그 사이를 이동합니다.',
      newTask: '새 작업',
      settings: '설정',
      openingLocalData: '로컬 Histask 데이터를 여는 중…',
      openDbErrorTitle: '로컬 Histask 데이터를 열 수 없습니다',
      openDbErrorDescription:
        '데이터베이스는 초기화되거나 삭제되지 않았습니다. 다시 열기를 시도하거나 이 브라우저 탭을 유지한 채 나중에 다시 시도하세요.',
      routeErrorTitle: '이 화면을 열 수 없습니다',
      routeErrorDescription:
        '로컬 Histask 데이터는 초기화되지 않았습니다. 앱을 새로고침해 다시 시도하세요.',
      pwaUpdateRegionLabel: '앱 업데이트 가능',
      pwaUpdateTitle: '새 버전 준비됨',
      pwaUpdateDescription:
        '원할 때 새로고침하여 최신 앱을 적용하세요. 로컬 데이터는 그대로 유지됩니다.',
      pwaUpdateDismiss: '업데이트 알림 닫기',
    },
    sidebar: {
      primaryNavLabel: '기본 메뉴',
      today: '오늘',
      allTasks: '전체 작업',
      inProgress: '진행 중',
      waiting: '대기',
      completed: '완료',
      categories: '카테고리',
      newCategory: '새 카테고리',
      noCategories: '카테고리가 아직 없습니다',
      editCategory: (name) => `${name} 카테고리 편집`,
      tags: '태그',
      newTag: '새 태그',
      noTags: '태그가 아직 없습니다',
      editTag: (name) => `${name} 태그 편집`,
    },
    dashboard: {
      regionLabel: '작업 현황 지표',
      loadError: '로컬 저장소에서 작업 지표를 불러올 수 없습니다.',
      filterDisclaimer:
        '상단 지표는 검색어나 보드 필터와 무관하게 전체 활성 작업을 반영합니다.',
      metrics: {
        total: '전체',
        totalHint: '보관되지 않은 전체 작업',
        inProgress: '진행 중',
        waiting: '대기',
        done: '완료',
        updatedToday: '오늘 기록됨',
        updatedTodayHint: '오늘 새 WorkLog가 작성된 고유 카드 수',
      },
    },
    board: {
      views: {
        all: {
          title: '전체 작업',
          subtitle:
            '모든 카드의 최신 WorkLog와 함께 상태별 업무 진행 상황을 한눈에 추적합니다.',
        },
        inProgress: {
          title: '진행 중',
          subtitle: '지금 활발하게 진행 중인 작업입니다.',
        },
        waiting: {
          title: '대기',
          subtitle: '외부 피드백, 검토, 선행 작업 대기 상태입니다.',
        },
        completed: {
          title: '완료',
          subtitle: '완료 이력이 기록된 작업입니다.',
        },
      },
      loadError:
        '로컬 IndexedDB에서 작업을 불러오지 못했습니다. 새로고침하거나 설정에서 저장소 상태를 확인하세요.',
      loadingTasks: '로컬 작업 불러오는 중...',
      sortedNoticePrefix: '정렬 기준:',
      sortedNoticeBodySingle:
        '이 정렬 모드에서는 열 내부 수동 순서 변경이 비활성화됩니다.',
      sortedNoticeBodyMulti:
        '이 정렬 모드에서는 열 내부 수동 순서 변경이 비활성화되며, 다른 열로 드래그해 상태 변경은 가능합니다.',
      dndDisabledOver: (sortLabel) =>
        `${sortLabel} 정렬 중에는 열 내부 수동 재정렬이 비활성화됩니다. 다른 열로 드래그해 상태를 바꾸거나 정렬을 수동 정렬로 변경하세요.`,
      dndDisabledDrop: (sortLabel) =>
        `${sortLabel} 정렬 중에는 열 내부 수동 재정렬이 비활성화됩니다. 카드를 열 안에서 이동하려면 정렬을 수동 정렬로 바꾸세요.`,
      dndPersistFailed:
        '새 순서 또는 상태를 로컬에 저장하지 못해 이전 보드 상태로 되돌렸습니다.',
      reorderPersistFailed: '새 작업 순서를 로컬에 저장하지 못했습니다.',
      emptyAllTitle: '아직 작업이 없습니다',
      emptyStatusTitle: (statusLabel) => `${statusLabel} 상태의 작업이 없습니다`,
      emptyDescription:
        '첫 번째 작업을 만들거나 이 기기에 저장된 기존 Histask 백업을 복원하세요.',
      createTask: '작업 만들기',
      importBackup: '백업 가져오기',
      noMatchingTitle: '일치하는 작업이 없습니다',
      noMatchingDescription:
        '현재 검색어 또는 선택한 필터 조건과 일치하는 활성 작업이 없습니다.',
      clearAllFilters: '모든 필터 초기화',
      columnAria: (statusLabel, count) => `${statusLabel} (${count})`,
      addTaskToColumn: (statusLabel) => `${statusLabel} 열에 작업 추가`,
      emptyColumn: (statusLabel) => `${statusLabel} 작업 없음`,
      taskTitleRequired: '작업 제목을 입력하세요.',
      createTaskFallbackError: '작업을 로컬에 생성하지 못했습니다. 다시 시도하세요.',
      newColumnTaskLabel: (statusLabel) => `새 ${statusLabel} 작업 제목`,
      taskTitlePlaceholder: '작업 제목...',
      add: '추가',
      adding: '추가 중...',
      newTaskDialogTitle: '새 작업',
      newTaskDialogDescription:
        '제목과 초기 상태를 입력해 작업을 만듭니다. 설명과 WorkLog는 언제든 추가할 수 있습니다.',
      titleFieldLabel: '제목',
      titleDialogPlaceholder: '어떤 업무를 진행하나요?',
      columnFieldLabel: '상태 열',
      creating: '생성 중...',
      dragCardAria: (title) => `${title} 드래그`,
      taskActionsAria: (title) => `${title} 작업 메뉴`,
      openDetails: '상세 열기',
      moveToStatus: '상태 이동',
      reorder: '순서 변경',
      moveUp: '위로 이동',
      moveDown: '아래로 이동',
      latestLogAria: (content) => `최신 진행 로그: ${content}`,
      noProgressLog: '아직 진행 기록이 없습니다',
      dueOverdueTag: '(마감 지남)',
      dueTodayTag: '(오늘)',
    },
    cardDetail: {
      archive: '보관',
      delete: '삭제',
      descriptionSrOnly: (title) =>
        `${title} 작업 상세 정보를 수정하고 진행 WorkLog를 기록합니다.`,
      historyHeading: (count) => `진행 이력 (${count})`,
      archiveError: '작업을 로컬에 보관하지 못했습니다.',
      deleteError: '작업을 로컬에서 삭제하지 못했습니다.',
      archiveDialogTitle: '작업을 보관할까요?',
      archiveDialogDescription: (title) =>
        `보관하면 "${title}" 작업이 활성 보드와 지표에서 숨겨지며, 모든 WorkLog는 JSON 백업에 안전하게 보존됩니다.`,
      archiveConfirm: '작업 보관',
      archiving: '보관 중...',
      deleteDialogTitle: '작업을 영구 삭제할까요?',
      deleteDialogDescription: (title, logCount) =>
        `"${title}" 작업과 WorkLog ${logCount}개 및 태그 연결을 로컬 저장소에서 영구 삭제합니다. 되돌릴 수 없습니다.`,
      deleteConfirm: '영구 삭제',
      titleField: '제목',
      statusField: '상태',
      priorityField: '우선순위',
      categoryField: '카테고리',
      noCategory: '카테고리 없음',
      dueDateField: '마감일',
      tagsField: '태그',
      noTagsCreated: '생성된 태그가 없습니다.',
      descriptionField: '설명',
      descriptionPlaceholder: '배경, 링크, 완료 기준 또는 핵심 메모...',
      createdField: '생성일',
      updatedField: '최근 수정',
      completedField: '완료일',
      savedChanges: '변경사항을 저장했습니다.',
      saveChanges: '변경사항 저장',
      saveErrorFallback:
        '변경사항을 로컬에 저장하지 못했습니다. 작성한 내용은 유지됩니다.',
    },
    workLog: {
      addLabel: 'WorkLog 추가',
      composerHint: 'Enter 줄바꿈 · Ctrl/Cmd+Enter 저장',
      composerPlaceholder:
        '진행된 내용, 차단 요소 또는 다음 할 일을 기록하세요...',
      emptyNoteError: '저장하기 전에 진행 내용을 입력하세요.',
      createFallbackError:
        'WorkLog를 로컬에 저장하지 못했습니다. 입력 내용은 유지됩니다.',
      saveButton: 'WorkLog 저장',
      emptyTimeline:
        '아직 진행 이력이 없습니다. 위에서 첫 WorkLog를 추가하면 보드 카드에서도 바로 확인할 수 있습니다.',
      timelineAria: 'WorkLog 타임라인',
      latestBadge: '최신',
      editedTooltip: (exactTime) => `${exactTime}에 수정됨`,
      editAria: 'WorkLog 수정',
      deleteAria: 'WorkLog 삭제',
      editContentAria: 'WorkLog 내용 수정',
      editEmptyError: 'WorkLog 내용은 비워둘 수 없습니다.',
      updateFallbackError:
        'WorkLog를 로컬에 수정하지 못했습니다. 초안은 유지됩니다.',
      deleteFallbackError: '이 WorkLog를 로컬에서 삭제하지 못했습니다.',
      deleteDialogTitle: 'WorkLog를 삭제할까요?',
      deleteDialogDescription:
        '이 WorkLog 항목을 작업의 진행 이력에서 영구 삭제합니다. 카드에는 이전 WorkLog(있는 경우)가 최신으로 표시됩니다.',
      deleteConfirm: 'WorkLog 삭제',
    },
    search: {
      inputAria: '작업 검색',
      placeholder: '작업 검색... (/)',
      clearSearchAria: '검색어 지우기',
      listboxAria: '일치하는 작업',
      noResults: (query) => `"${query}"와 일치하는 작업이 없습니다`,
      showingTopMatches: (shown, total) =>
        `상위 ${shown}건 표시 중 (전체 ${total}건). 보드 화면도 함께 필터링됩니다.`,
    },
    filters: {
      regionAria: '작업 필터 및 정렬',
      byCategoryAria: '카테고리 필터',
      allCategories: '모든 카테고리',
      byTagAria: '태그 필터',
      allTags: '모든 태그',
      byStatusAria: '상태 필터',
      allStatuses: '모든 상태',
      byPriorityAria: '우선순위 필터',
      allPriorities: '모든 우선순위',
      byDueAria: '마감일 필터',
      sortAria: '정렬 기준',
      activeLabel: '적용 중:',
      chipSearch: '검색',
      chipCategory: '카테고리',
      chipTag: '태그',
      chipStatus: '상태',
      chipPriority: '우선순위',
      chipDue: '마감일',
      clearAll: '모두 초기화',
    },
    classifications: {
      newCategoryTitle: '새 카테고리',
      editCategoryTitle: '카테고리 편집',
      newTagTitle: '새 태그',
      editTagTitle: '태그 편집',
      categoryDescription: '관련 업무 영역을 깔끔하게 묶어 관리합니다.',
      tagDescription:
        '주제별로 작업을 분류하며, 하나의 작업에 여러 태그를 연결할 수 있습니다.',
      nameLabel: '이름',
      categoryPlaceholder: '예: 플랫폼 운영',
      tagPlaceholder: '예: 긴급',
      colorLabel: '색상',
      categoryRequiredError: '카테고리 이름을 입력하세요.',
      tagRequiredError: '태그 이름을 입력하세요.',
      categorySaveFallbackError: '카테고리를 로컬에 저장하지 못했습니다.',
      tagSaveFallbackError: '태그를 로컬에 저장하지 못했습니다.',
      categoryDeleteFallbackError: '이 카테고리를 로컬에서 삭제하지 못했습니다.',
      tagDeleteFallbackError: '이 태그를 로컬에서 삭제하지 못했습니다.',
      createCategory: '카테고리 만들기',
      createTag: '태그 만들기',
      deleteCategoryTitle: '카테고리를 삭제할까요?',
      deleteTagTitle: '태그를 삭제할까요?',
      deleteCategoryDescription: (name, count) =>
        `"${name}" 카테고리를 삭제하면 연결된 ${count}개 작업에서 카테고리만 해제되며 작업과 WorkLog는 그대로 유지됩니다.`,
      deleteTagDescription: (name, count) =>
        `"${name}" 태그를 삭제하면 ${count}개 작업에서 태그 연결만 해제됩니다. 작업과 WorkLog는 삭제되지 않습니다.`,
      deleteCategoryConfirm: '카테고리 삭제',
      deleteTagConfirm: '태그 삭제',
    },
    calendar: {
      weekdays: ['일', '월', '화', '수', '목', '금', '토'],
      previousMonth: '이전 달',
      nextMonth: '다음 달',
      indicatorDue: '마감 작업',
      indicatorWorkLog: 'WorkLog',
      indicatorCompleted: '완료 작업',
      dateActivity: (formattedDate) => `날짜별 기록 (${formattedDate})`,
      previousDayAria: '이전 날짜',
      previousDayShort: '이전',
      todayButton: '오늘',
      nextDayAria: '다음 날짜',
      nextDayShort: '다음',
      invalidDateNotice: (rawDateKey) =>
        `유효하지 않은 날짜("${rawDateKey}")입니다. 오늘 날짜를 대신 표시합니다.`,
      loadingDateHistory: (dateKey) =>
        `${dateKey}의 로컬 이력을 불러오는 중...`,
      emptyDateTitle: (formattedDate) =>
        `${formattedDate}에 기록된 작업이 없습니다`,
      emptyDateDescription:
        '이 날짜에 마감, WorkLog 기록 또는 완료된 작업이 없습니다.',
      backToAllTasks: '전체 작업으로 돌아가기',
      dueSection: (count) => `마감 (${count})`,
      dueEmpty: '이 날짜가 마감인 작업이 없습니다.',
      updatedSection: (count) => `기록됨 (${count})`,
      updatedEmpty: '이 날짜에 작성된 WorkLog가 없습니다.',
      completedSection: (count) => `완료됨 (${count})`,
      completedEmpty: '이 날짜에 완료된 작업이 없습니다.',
      extraLogsThisDay: (latest, extraCount) =>
        `${latest} (이날 외 ${extraCount}개 로그 더 있음)`,
    },
    today: {
      title: '오늘',
      openBoard: '보드 열기',
      loading: '오늘의 작업 기록 불러오는 중...',
      emptyTitle: '오늘 마감·기록·완료된 작업이 없습니다',
      emptyDescription:
        '작업을 새로 만들거나 진행 중인 카드에 WorkLog를 남기면 여기에 모아볼 수 있습니다.',
      viewAllTasks: '전체 작업 보기',
      dueToday: (count) => `오늘 마감 (${count})`,
      dueTodayEmpty: '오늘 마감인 작업이 없습니다.',
      updatedToday: (count) => `오늘 기록됨 (${count})`,
      updatedTodayEmpty: '오늘 작성된 WorkLog가 아직 없습니다.',
      completedToday: (count) => `오늘 완료됨 (${count})`,
      completedTodayEmpty: '오늘 완료된 작업이 없습니다.',
      createdToday: (count) => `오늘 생성됨 (${count})`,
      logsToday: (count) => `오늘 로그 ${count}개`,
    },
    settings: {
      pageTitle: '설정',
      pageSubtitle:
        '저장소, 백업·복원, 화면 테마, 언어 및 로컬 앱 정보를 관리합니다.',
      dataSection: '데이터',
      applicationSection: '애플리케이션',
      aboutSection: '정보',
      themeTitle: '테마',
      themeDescription: '시스템 설정은 운영체제의 화면 모드를 따릅니다.',
      themeOptions: {
        system: '시스템',
        light: '라이트',
        dark: '다크',
      },
      themeReadError: '저장된 테마 설정을 읽을 수 없습니다.',
      themeSaveError: '테마 설정을 저장하지 못했습니다.',
      languageTitle: '언어',
      languageDescription:
        '화면 표시 언어를 선택합니다. 시스템은 브라우저 언어를 따릅니다.',
      languageOptions: {
        system: '시스템',
        en: 'English',
        ko: '한국어',
      },
      languageReadError: '저장된 언어 설정을 읽을 수 없습니다.',
      languageSaveError: '언어 설정을 저장하지 못했습니다.',
      storageTitle: '브라우저 저장소',
      storageRetentionNote:
        '데이터는 현재 브라우저 프로필과 도메인(Origin)에 저장되며, 영구 보존을 보장하지는 않습니다.',
      storageRequestButton: '영구 저장 요청',
      storageStatuses: {
        checking: '브라우저 저장소 상태 확인 중…',
        requesting: '영구 로컬 저장소 권한 요청 중…',
        persisted: '이 브라우저는 Histask 저장소를 영구 저장 상태로 보고합니다.',
        'not-persisted':
          '로컬에 저장되지만 저장 공간이 부족하면 브라우저가 정리할 수 있습니다.',
        denied: '브라우저가 영구 저장소 권한을 허용하지 않았습니다.',
        unsupported:
          '이 브라우저는 영구 저장소 상태 확인을 지원하지 않습니다.',
        error: '브라우저 저장소 상태를 읽을 수 없습니다.',
      },
      exportTitle: '백업 내보내기',
      exportDescription:
        '모든 Card, WorkLog, Category, Tag 및 태그 연결을 JSON 파일로 저장합니다.',
      exportButton: '내보내기',
      exportingButton: '내보내는 중…',
      exportSuccess: (filename) => `${filename} 파일을 로컬에 저장했습니다.`,
      exportError: '백업을 내보내지 못했습니다. 기존 데이터는 변경되지 않았습니다.',
      importTitle: '백업 가져오기',
      importDescription:
        'JSON 백업 파일을 선택하거나 끌어다 놓으면 교체 전 로컬에서 전체 검증을 실행합니다.',
      importDropHint:
        '.json 백업 파일을 여기에 끌어다 놓거나 기기에서 선택하세요.',
      importChooseButton: '파일 선택…',
      importChangeButton: '파일 변경',
      importReadingButton: '검증 중…',
      importReviewButton: '검토 및 복원',
      importClearButton: '선택한 파일 비우기',
      importValidSummary: (cards, workLogs, categories, tags) =>
        `카드 ${cards}개 · WorkLog ${workLogs}개 · 카테고리 ${categories}개 · 태그 ${tags}개`,
      importValidMessage: (fileName) =>
        `${fileName} 검증이 완료되어 복원할 수 있습니다.`,
      importReadError:
        '백업 파일을 읽을 수 없습니다. 기존 Histask 데이터는 변경되지 않았습니다.',
      importInvalidPrefix: (reason) =>
        `${reason} 기존 Histask 데이터는 변경되지 않았습니다.`,
      importRestoreSuccess:
        '백업을 복원했습니다. 이제 가져온 로컬 데이터를 사용합니다.',
      importRestoreError:
        '백업을 복원하지 못했습니다. 이전 데이터는 그대로 유지됩니다.',
      importDialogTitle: '기존 데이터를 교체할까요?',
      importDialogDescription: (fileName) =>
        `${fileName} 파일이 전체 검증을 통과했습니다. 복원하면 현재 모든 Card, WorkLog, Category, Tag 및 연결 정보가 교체됩니다. 테마·언어 설정은 유지됩니다.`,
      importDialogRows: {
        cards: '카드',
        workLogs: 'WorkLog',
        categories: '카테고리',
        tags: '태그',
        cardTags: '태그 연결',
      },
      importDialogWarning:
        '이 작업은 병합이 아닌 전체 교체이며 되돌릴 수 없습니다. 필요하면 먼저 현재 백업을 내보내세요.',
      importDialogConfirm: '데이터 교체',
      importDialogConfirming: '교체 중…',
      deleteAllTitle: '전체 데이터 삭제',
      deleteAllDescription:
        '로컬 작업, 진행 이력, 분류 및 앱 설정을 모두 영구 삭제합니다.',
      deleteAllTrigger: '삭제…',
      deleteAllDialogTitle: '모든 로컬 데이터를 삭제할까요?',
      deleteAllDialogDescription:
        '이 브라우저 프로필의 모든 Card와 WorkLog를 영구 삭제합니다. 필요할 수 있다면 먼저 백업을 내보내세요.',
      deleteAllConfirmLabel: '확인을 위해 DELETE를 입력하세요',
      deleteAllConfirmPlaceholder: 'DELETE',
      deleteAllConfirmButton: '전체 데이터 삭제',
      deleteAllSuccess: '로컬 Histask 데이터를 모두 삭제했습니다.',
      deleteAllError:
        '로컬 데이터를 삭제하지 못했습니다. 이전 데이터는 그대로 유지됩니다.',
      aboutVersion: 'Histask 버전',
      aboutStorage: '저장소',
      aboutStorageValue: 'IndexedDB',
      aboutSchema: '데이터베이스 스키마',
    },
  },
}
