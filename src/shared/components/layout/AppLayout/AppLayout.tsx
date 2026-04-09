import { type ReactNode, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from '../BottomNav/BottomNav';
import { SideNav } from '../SideNav/SideNav';
import { AgentWidget } from '@shared/components/ui/AgentWidget/AgentWidget';
import { useAuthStore } from '@modules/auth/store/authStore';
import { wsClient } from '@shared/services/websocket/wsClient';
import { useWsNotifications } from '@shared/services/websocket/useWsNotifications';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  children?: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  // Connect WebSocket when layout mounts (user is authenticated),
  // disconnect when they log out / layout unmounts.
  useEffect(() => {
    if (token) wsClient.connect(token);
    return () => wsClient.disconnect();
  }, [token]);

  // Merge incoming WS notifications into React Query cache
  useWsNotifications();

  return (
    <div className={styles.layout}>
      {/* Desktop: persistent sidebar */}
      <SideNav />

      <main className={styles.main}>
        {children ?? <Outlet />}
      </main>

      {/* Mobile: bottom navigation */}
      <BottomNav role={user!.role} />

      {/* Floating AI Agent — visible on all pages */}
      <AgentWidget />
    </div>
  );
}
