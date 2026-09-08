import { Navigate, createHashRouter } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import type { HistaskDatabase } from '@/db/database'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { WorkspacePage } from '@/features/workspace/WorkspacePage'
import { RouteErrorPage } from './RouteErrorPage'

export function createAppRouter(database: HistaskDatabase) {
  return createHashRouter([
    {
      path: '/',
      element: <AppShell />,
      errorElement: <RouteErrorPage />,
      children: [
        { index: true, element: <Navigate to="/all" replace /> },
        { path: 'today', element: <WorkspacePage view="today" /> },
        { path: 'all', element: <WorkspacePage view="all" /> },
        {
          path: 'in-progress',
          element: <WorkspacePage view="inProgress" />,
        },
        { path: 'waiting', element: <WorkspacePage view="waiting" /> },
        { path: 'completed', element: <WorkspacePage view="completed" /> },
        { path: 'settings', element: <SettingsPage database={database} /> },
        { path: '*', element: <Navigate to="/all" replace /> },
      ],
    },
  ])
}
