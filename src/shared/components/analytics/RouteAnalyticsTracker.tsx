import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { trackPageView } from '@shared/services/analytics/ga';

export function RouteAnalyticsTracker() {
  const location = useLocation();
  const lastTrackedPath = useRef<string>('');

  useEffect(() => {
    const currentPath = `${location.pathname}${location.search}`;
    if (currentPath === lastTrackedPath.current) return;

    trackPageView(currentPath);
    lastTrackedPath.current = currentPath;
  }, [location.pathname, location.search]);

  return <Outlet />;
}
