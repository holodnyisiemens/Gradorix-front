import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useNotifications, useMarkNotificationRead } from '@shared/hooks/useApi';
import { notificationsApi } from '@shared/api/services/notifications';
import { NotificationItem } from '@modules/notifications/components/NotificationItem';
import { useQueryClient } from '@tanstack/react-query';
import styles from './NotificationBell.module.css';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const user = useAuthStore((s) => s.user)!;
  const { data: notifications = [] } = useNotifications(user.id);
  const markRead = useMarkNotificationRead();
  const qc = useQueryClient();

  const unread = notifications.filter((n) => !n.is_read).length;

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  async function markAllRead() {
    await Promise.all(
      notifications.filter((n) => !n.is_read).map((n) => notificationsApi.markRead(n.id))
    );
    qc.invalidateQueries({ queryKey: ['notifications'] });
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        className={[styles.bell, open ? styles.bellOpen : ''].join(' ')}
        onClick={() => setOpen((v) => !v)}
        aria-label="Уведомления"
        aria-expanded={open}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className={styles.badge}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && (
        <div className={styles.panel} role="dialog" aria-label="Панель уведомлений">
          <div className={styles.panelHeader}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <p className={styles.panelTitle}>Уведомления</p>
              {unread > 0 && (
                <span className={styles.unreadPill}>{unread} новых</span>
              )}
            </div>
            {unread > 0 && (
              <button className={styles.markAllBtn} onClick={markAllRead}>
                Прочитать все
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>🔔</span>
              <p>Уведомлений нет</p>
            </div>
          ) : (
            <div className={styles.list}>
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={(id) => markRead.mutate(id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
