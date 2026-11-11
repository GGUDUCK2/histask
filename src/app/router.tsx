import { Navigate, createHashRouter } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import type { HistaskDatabase } from '@/db/database'
import { BoardPage } from '@/features/board/BoardPage'
import { DateWorkView } from '@/features/calendar/DateWorkView'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { TodayPage } from '@/features/today/TodayPage'
import { WorkspaceProvider } from '@/features/workspace/WorkspaceProvider'
import { RouteErrorPage } from './RouteErrorPage'

export function createAppRouter(database: HistaskDatabase) {
  return createHashRouter([
    {
      path: '/',
      element: (
        <WorkspaceProvider database={database}>
          <AppShell />
        </WorkspaceProvider>
      ),
      errorElement: <RouteErrorPage />,
      children: [
        { index: true, element: <Navigate to="/all" replace /> },
        { path: 'today', element: <TodayPage /> },
        { path: 'all', element: <BoardPage view="all" /> },
        { path: 'in-progress', element: <BoardPage view="inProgress" /> },
        { path: 'waiting', element: <BoardPage view="waiting" /> },
        { path: 'completed', element: <BoardPage view="completed" /> },
        { path: 'date/:dateKey', element: <DateWorkView /> },
        { path: 'settings', element: <SettingsPage database={database} /> },
        { path: '*', element: <Navigate to="/all" replace /> },
      ],
    },
  ])
}
