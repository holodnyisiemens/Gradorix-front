import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Notification } from '@shared/types';
import styles from './NotificationItem.module.css';

interface NotificationItemProps {
  notification: Notification;
  onRead?: (id: number) => void;
}

function getNotificationEmoji(message: string): string {
  if (message.startsWith('🎯') || message.startsWith('⚡')) return '🎯';
  if (message.startsWith('✅')) return '✅';
  if (message.startsWith('📅')) return '📅';
  if (message.startsWith('⚠️')) return '⚠️';
  if (message.startsWith('👤')) return '👤';
  if (message.startsWith('📊')) return '📊';
  return '🔔';
}

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const timeAgo = notification.created_at
    ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ru })
    : null;

  return (
    <div
      className={[
        styles.item,
        !notification.is_read ? styles.unread : styles.read,
      ].join(' ')}
      onClick={() => !notification.is_read && onRead?.(notification.id)}
    >
      {!notification.is_read && <span className={styles.unreadDot} />}
      <span className={styles.icon}>{getNotificationEmoji(notification.message)}</span>
      <div className={styles.content}>
        <p className={styles.message}>{notification.message}</p>
        {timeAgo && <p className={styles.time}>{timeAgo}</p>}
      </div>
    </div>
  );
}
