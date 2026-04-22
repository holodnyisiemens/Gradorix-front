import { useAuthStore } from '@modules/auth/store/authStore';
import { useNotifications, useMarkNotificationRead } from '@shared/hooks/useApi';
import { useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@shared/api/services/notifications';
import { NotificationItem } from '@modules/notifications/components/NotificationItem';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Button } from '@shared/components/ui/Button/Button';
import styles from './NotificationsPage.module.css';

export function NotificationsPage() {
  const user = useAuthStore((s) => s.user)!;
  const { data: notifications = [], isLoading } = useNotifications(user.id);
  const markRead = useMarkNotificationRead();
  const qc = useQueryClient();

  const unread = notifications.filter((n) => !n.is_read).length;

  const sorted = [...notifications].sort((a, b) => {
    if (a.is_read !== b.is_read) return a.is_read ? 1 : -1;
    return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
  });

  const handleRead = (id: number) => {
    markRead.mutate(id);
  };

  const handleReadAll = async () => {
    await Promise.all(
      notifications.filter((n) => !n.is_read).map((n) => notificationsApi.markRead(n.id))
    );
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  return (
    <>
      <PageHeader
        title="Уведомления"
        showBack
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
        {isLoading ? null : notifications.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🔔</span>
            <p>Уведомлений нет</p>
          </div>
        ) : (
          <div className={styles.list}>
            {sorted.map((n) => (
              <NotificationItem key={n.id} notification={n} onRead={handleRead} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
