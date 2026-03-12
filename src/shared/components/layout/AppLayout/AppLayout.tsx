import { type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from '../BottomNav/BottomNav';
import { SideNav } from '../SideNav/SideNav';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useUnreadCount } from '@modules/notifications/hooks/useUnreadCount';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  children?: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const user = useAuthStore((s) => s.user);
  const unreadCount = useUnreadCount();

  if (!user) return null;

  return (
    <div className={styles.layout}>
      {/* Desktop: persistent sidebar */}
      <SideNav unreadCount={unreadCount} />

      <main className={styles.main}>
        {children ?? <Outlet />}
      </main>

      {/* Mobile: bottom navigation */}
      <BottomNav role={user.role} unreadCount={unreadCount} />
    </div>
  );
}
