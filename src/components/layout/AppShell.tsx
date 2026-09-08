import { useRef, useState } from 'react'
import { Menu, Plus, Search, Settings } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import { Sidebar } from './Sidebar'

export function AppShell() {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false)
  const mobileNavigationTrigger = useRef<HTMLButtonElement>(null)

  return (
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
          <span className="hidden text-metadata text-muted-foreground sm:inline">
            Local work history
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" disabled aria-label="Search tasks">
            <Search />
            <span className="hidden sm:inline">Search</span>
          </Button>
          <Button size="sm" disabled>
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
          className="w-[248px] p-0"
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            mobileNavigationTrigger.current?.focus()
          }}
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Navigate between Histask views.
          </SheetDescription>
          <Sidebar onNavigate={() => setMobileNavigationOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
