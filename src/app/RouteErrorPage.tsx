import { useRouteError } from 'react-router'
import { Button } from '@/components/ui/button'

export function RouteErrorPage() {
  useRouteError()
  return (
    <main className="grid min-h-svh place-items-center bg-background p-5">
      <section className="grid max-w-md gap-3 rounded-overlay border bg-surface p-5">
        <h1 className="text-page-title font-semibold">Could not open this view</h1>
        <p className="text-ui text-muted-foreground">
          Your local Histask data was not reset. Reload the application to try
          again.
        </p>
        <Button className="justify-self-start" onClick={() => location.reload()}>
          Reload
        </Button>
      </section>
    </main>
  )
}
