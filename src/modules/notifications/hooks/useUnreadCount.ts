import { useAuthStore } from '@modules/auth/store/authStore';
import { getNotificationsForUser } from '@shared/api/mockData';

export function useUnreadCount(): number {
  const user = useAuthStore((s) => s.user);
  if (!user) return 0;
  const notifications = getNotificationsForUser(user.id);
  return notifications.filter((n) => !n.is_read).length;
}
