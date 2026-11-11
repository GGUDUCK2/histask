import { useEffect, useMemo, useState } from 'react'
import { RouterProvider } from 'react-router'
import { LanguageProvider } from '@/app/LanguageProvider'
import { useI18n } from '@/app/language-context'
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

function ReadyApplication({
  database,
  settings,
}: {
  database: HistaskDatabase
  settings: DexieSettingsRepository
}) {
  const router = useMemo(() => createAppRouter(database), [database])
  return (
    <ThemeProvider repository={settings}>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}

function AppContent({
  database,
  databaseState,
  settings,
  onRetry,
}: {
  database: HistaskDatabase
  databaseState: DatabaseState
  settings: DexieSettingsRepository
  onRetry: () => void
}) {
  const { messages } = useI18n()

  if (databaseState === 'ready') {
    return <ReadyApplication database={database} settings={settings} />
  }

  if (databaseState === 'error') {
    return (
      <main className="grid min-h-svh place-items-center bg-background p-5">
        <section className="grid max-w-md gap-3 rounded-overlay border bg-surface p-5">
          <h1 className="text-page-title font-semibold">
            {messages.appShell.openDbErrorTitle}
          </h1>
          <p className="text-ui text-muted-foreground">
            {messages.appShell.openDbErrorDescription}
          </p>
          <Button className="justify-self-start" onClick={onRetry}>
            {messages.common.retry}
          </Button>
        </section>
      </main>
    )
  }

  return (
    <main className="grid min-h-svh place-items-center bg-background p-5">
      <p className="text-ui text-muted-foreground" role="status">
        {messages.appShell.openingLocalData}
      </p>
    </main>
  )
}

export default function App({
  database = histaskDatabase,
}: {
  database?: HistaskDatabase
}) {
  const [databaseState, setDatabaseState] = useState<DatabaseState>('loading')
  const [attempt, setAttempt] = useState(0)
  const settings = useMemo(
    () => new DexieSettingsRepository(database),
    [database],
  )

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

  return (
    <LanguageProvider
      repository={databaseState === 'ready' ? settings : undefined}
    >
      <AppContent
        database={database}
        databaseState={databaseState}
        settings={settings}
        onRetry={() => {
          setDatabaseState('loading')
          setAttempt((value) => value + 1)
        }}
      />
    </LanguageProvider>
  )
}
