import { useCallback, useRef, useState } from 'react'
import { Menu, Plus, Settings } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QuickCreateDialog } from '@/features/board/QuickAddCard'
import { CardDetailDrawer } from '@/features/card-detail/CardDetailDrawer'
import { ClassificationDialogs } from '@/features/categories/ClassificationDialogs'
import { GlobalSearch } from '@/features/search/GlobalSearch'
import { useWorkspace } from '@/features/workspace/workspace-context'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { PwaUpdateBanner } from './PwaUpdateBanner'
import { Sidebar } from './Sidebar'

export function AppShell() {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false)
  const mobileNavigationTrigger = useRef<HTMLButtonElement>(null)
  const {
    openQuickCreate,
    focusSearch,
    searchDropdownOpen,
    setSearchDropdownOpen,
    selectedCardId,
    quickCreateStatus,
    classificationDialog,
  } = useWorkspace()

  const isModalOpen = useCallback(
    () =>
      mobileNavigationOpen ||
      selectedCardId !== null ||
      quickCreateStatus !== null ||
      classificationDialog !== null ||
      document.querySelector('[role="dialog"]') !== null,
    [
      classificationDialog,
      mobileNavigationOpen,
      quickCreateStatus,
      selectedCardId,
    ],
  )

  const handleEscape = useCallback(() => {
    if (searchDropdownOpen) {
      setSearchDropdownOpen(false)
    }
  }, [searchDropdownOpen, setSearchDropdownOpen])

  useKeyboardShortcuts({
    onNewTask: () => openQuickCreate('TODO'),
    onFocusSearch: focusSearch,
    onEscape: handleEscape,
    isModalOpen,
  })

  return (
    <TooltipProvider delayDuration={250}>
      <div className="app-shell">
        <header className="app-header">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              ref={mobileNavigationTrigger}
              aria-label="Open navigation"
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileNavigationOpen(true)}
            >
              <Menu />
            </Button>
            <NavLink
              to="/all"
              className="rounded-control text-[18px] font-semibold tracking-[-0.02em]"
            >
              histask
            </NavLink>
            <span className="hidden text-metadata text-muted-foreground lg:inline">
              Local work history
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <GlobalSearch />
            <Button
              size="sm"
              aria-keyshortcuts="n"
              onClick={(event) => openQuickCreate('TODO', event.currentTarget)}
            >
              <Plus />
              <span className="hidden sm:inline">New task</span>
            </Button>
            <Button asChild variant="ghost" size="icon">
              <NavLink to="/settings" aria-label="Settings">
                <Settings />
              </NavLink>
            </Button>
          </div>
        </header>

        <aside className="app-sidebar hidden md:block">
          <Sidebar />
        </aside>

        <main className="app-content">
          <Outlet />
        </main>

        <Sheet
          open={mobileNavigationOpen}
          onOpenChange={setMobileNavigationOpen}
        >
          <SheetContent
            side="left"
            className="w-[260px] p-0"
            onCloseAutoFocus={(event) => {
              event.preventDefault()
              mobileNavigationTrigger.current?.focus()
            }}
          >
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SheetDescription className="sr-only">
              Navigate between Histask views, calendar dates, categories, and
              tags.
            </SheetDescription>
            <Sidebar onNavigate={() => setMobileNavigationOpen(false)} />
          </SheetContent>
        </Sheet>

        <QuickCreateDialog />
        <CardDetailDrawer />
        <ClassificationDialogs />
        <PwaUpdateBanner />
      </div>
    </TooltipProvider>
  )
}
