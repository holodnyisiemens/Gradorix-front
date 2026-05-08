import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import posthog from 'posthog-js';
import '@shared/styles/globals.css';
import { App } from '@app/App';

const phKey = import.meta.env.VITE_POSTHOG_KEY;
if (phKey) {
  posthog.init(phKey, {
    api_host: import.meta.env.VITE_POSTHOG_HOST ?? 'https://eu.posthog.com',
    capture_pageview: false,
    persistence: 'localStorage',
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
