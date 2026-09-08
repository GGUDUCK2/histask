import { useEffect, useMemo, useState } from 'react'
import { RouterProvider } from 'react-router'
import { ThemeProvider } from '@/app/ThemeProvider'
import { createAppRouter } from '@/app/router'
import { Button } from '@/components/ui/button'
import {
  histaskDatabase,
  openHistaskDatabase,
  type HistaskDatabase,
} from '@/db/database'
import { DexieSettingsRepository } from '@/repositories/settings'
import './App.css'

type DatabaseState = 'loading' | 'ready' | 'error'

function ReadyApplication({ database }: { database: HistaskDatabase }) {
  const settings = useMemo(
    () => new DexieSettingsRepository(database),
    [database],
  )
  const router = useMemo(() => createAppRouter(database), [database])
  return (
    <ThemeProvider repository={settings}>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}

export default function App({
  database = histaskDatabase,
}: {
  database?: HistaskDatabase
}) {
  const [databaseState, setDatabaseState] = useState<DatabaseState>('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    void openHistaskDatabase(database)
      .then(() => {
        if (active) setDatabaseState('ready')
      })
      .catch(() => {
        if (active) setDatabaseState('error')
      })
    return () => {
      active = false
    }
  }, [attempt, database])

  if (databaseState === 'ready')
    return <ReadyApplication database={database} />

  if (databaseState === 'error') {
    return (
      <main className="grid min-h-svh place-items-center bg-background p-5">
        <section className="grid max-w-md gap-3 rounded-overlay border bg-surface p-5">
          <h1 className="text-page-title font-semibold">
            Could not open local Histask data
          </h1>
          <p className="text-ui text-muted-foreground">
            The database was not reset or deleted. Retry opening it, or keep
            this browser tab available and try again later.
          </p>
          <Button
            className="justify-self-start"
            onClick={() => {
              setDatabaseState('loading')
              setAttempt((value) => value + 1)
            }}
          >
            Retry
          </Button>
        </section>
      </main>
    )
  }

  return (
    <main className="grid min-h-svh place-items-center bg-background p-5">
      <p className="text-ui text-muted-foreground" role="status">
        Opening local Histask data…
      </p>
    </main>
  )
}
