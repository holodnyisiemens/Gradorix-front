import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Notification } from '@shared/types';
import styles from './NotificationItem.module.css';

interface NotificationItemProps {
  notification: Notification;
  onRead?: (id: number) => void;
}

function getNotificationEmoji(message: string): string {
  if (message.startsWith('📋')) return '📋';
  if (message.startsWith('⭐')) return '⭐';
  if (message.startsWith('🎯') || message.startsWith('⚡')) return '🎯';
  if (message.startsWith('✅')) return '✅';
  if (message.startsWith('📅')) return '📅';
  if (message.startsWith('⚠️')) return '⚠️';
  if (message.startsWith('👤')) return '👤';
  if (message.startsWith('📊')) return '📊';
  if (message.startsWith('❌')) return '❌';
  return '🔔';
}

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const navigate = useNavigate();

  // link field takes priority; fall back to legacy "message||/path" format for old records
  const legacyParts = notification.message.split('||');
  const displayMessage = legacyParts[0];
  const link = notification.link ?? legacyParts[1];

  const timeAgo = notification.created_at
    ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ru })
    : null;

  function handleClick() {
    if (!notification.is_read) onRead?.(notification.id);
    if (link) navigate(link);
  }

  return (
    <div
      className={[
        styles.item,
        !notification.is_read ? styles.unread : styles.read,
        link ? styles.clickable : '',
      ].join(' ')}
      onClick={handleClick}
    >
      {!notification.is_read && <span className={styles.unreadDot} />}
      <span className={styles.icon}>{getNotificationEmoji(displayMessage)}</span>
      <div className={styles.content}>
        <p className={styles.message}>{displayMessage}</p>
        {timeAgo && <p className={styles.time}>{timeAgo}</p>}
      </div>
      {link && <span className={styles.arrow}>›</span>}
    </div>
  );
}
