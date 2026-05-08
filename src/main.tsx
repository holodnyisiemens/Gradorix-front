import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@shared/styles/globals.css';
import { App } from '@app/App';
import { initGa } from '@shared/services/analytics/ga';

initGa();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
