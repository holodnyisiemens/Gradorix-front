import { useState } from 'react';
import { useAuthStore } from '@modules/auth/store/authStore';
import { getNotificationsForUser, MOCK_NOTIFICATIONS } from '@shared/api/mockData';
import { NotificationItem } from '@modules/notifications/components/NotificationItem';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Button } from '@shared/components/ui/Button/Button';
import styles from './NotificationsPage.module.css';

export function NotificationsPage() {
  const user = useAuthStore((s) => s.user)!;
  const [notifications, setNotifications] = useState(() => getNotificationsForUser(user.id));

  const unread = notifications.filter((n) => !n.is_read).length;

  const handleRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    // Also update mock data
    const notif = MOCK_NOTIFICATIONS.find((n) => n.id === id);
    if (notif) notif.is_read = true;
  };

  const handleReadAll = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    notifications.forEach((n) => {
      const notif = MOCK_NOTIFICATIONS.find((m) => m.id === n.id);
      if (notif) notif.is_read = true;
    });
  };

  return (
    <>
      <PageHeader
        title="Уведомления"
        subtitle={unread > 0 ? `${unread} непрочитанных` : 'Всё прочитано'}
        actions={
          unread > 0 ? (
            <Button variant="ghost" size="sm" onClick={handleReadAll}>
              Прочитать все
            </Button>
          ) : undefined
        }
      />
      <div className={styles.page}>
        {notifications.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🔔</span>
            <p>Уведомлений нет</p>
          </div>
        ) : (
          <div className={styles.list}>
            {notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} onRead={handleRead} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
