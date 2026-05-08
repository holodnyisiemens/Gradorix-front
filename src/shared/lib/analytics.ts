import posthog from 'posthog-js';

export const analytics = {
  track(event: string, props?: Record<string, unknown>) {
    posthog.capture(event, props);
  },

  identify(id: number, props: { username: string; role: string }) {
    posthog.identify(String(id), props);
  },

  reset() {
    posthog.reset();
  },
};