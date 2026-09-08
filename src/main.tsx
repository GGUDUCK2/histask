import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './app/ThemeProvider'

const root = createRoot(document.getElementById('root')!)
// A development-only visual test fixture; excluded from the production bundle.
if (
  import.meta.env.DEV &&
  new URLSearchParams(location.search).has('__foundation')
) {
  void import('./test/fixtures/FoundationPreview').then(
    ({ FoundationPreview }) => {
      root.render(
        <StrictMode>
          <ThemeProvider>
            <FoundationPreview />
          </ThemeProvider>
        </StrictMode>,
      )
    },
  )
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
