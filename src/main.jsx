import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { logger } from './utils/logger'

const log = logger.create('Main');

try {
  log.info('Application bootstrapping...');

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element #root not found in DOM');
  }

  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );

  log.info('Application mounted successfully');
} catch (err) {
  log.error('Fatal: Application failed to mount:', err);

  // Last-resort fallback UI
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#000;color:#fff;font-family:sans-serif;text-align:center;padding:2rem">
        <div>
          <h1 style="font-size:1.5rem;margin-bottom:1rem">Unable to load the experience</h1>
          <p style="color:rgba(255,255,255,0.5);font-size:0.85rem">Please try refreshing the page or use a modern browser with WebGL support.</p>
        </div>
      </div>
    `;
  }
}
