import { useRouteError } from 'react-router'
import { useI18n } from '@/app/language-context'
import { Button } from '@/components/ui/button'

export function RouteErrorPage() {
  useRouteError()
  const { messages } = useI18n()
  return (
    <main className="grid min-h-svh place-items-center bg-background p-5">
      <section className="grid max-w-md gap-3 rounded-overlay border bg-surface p-5">
        <h1 className="text-page-title font-semibold">
          {messages.appShell.routeErrorTitle}
        </h1>
        <p className="text-ui text-muted-foreground">
          {messages.appShell.routeErrorDescription}
        </p>
        <Button className="justify-self-start" onClick={() => location.reload()}>
          {messages.common.reload}
        </Button>
      </section>
    </main>
  )
}
