type GtagParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (
      command: 'js' | 'config' | 'event' | 'set',
      targetIdOrName: string | Date | GtagParams,
      params?: GtagParams
    ) => void;
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();

let initialized = false;

function canTrack() {
  return typeof window !== 'undefined' && Boolean(GA_MEASUREMENT_ID);
}

function injectScript() {
  if (!GA_MEASUREMENT_ID) return;
  const scriptSrc = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${scriptSrc}"]`);
  if (existingScript) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = scriptSrc;
  document.head.appendChild(script);
}

export function initGa() {
  if (!canTrack() || initialized) return;

  injectScript();
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(...args) {
    window.dataLayer.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID!, {
    send_page_view: false,
  });

  initialized = true;
}

export function trackPageView(path: string) {
  if (!canTrack() || !initialized) return;

  window.gtag('event', 'page_view', {
    page_path: path,
  });
}

export function trackEvent(eventName: string, params: GtagParams = {}) {
  if (!canTrack() || !initialized) return;
  window.gtag('event', eventName, params);
}

export function setUserId(userId: string) {
  if (!canTrack() || !initialized || !userId) return;
  window.gtag('set', { user_id: userId });
}
