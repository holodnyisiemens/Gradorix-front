import { useAuthStore } from '@modules/auth/store/authStore';
import { useNotifications } from '@shared/hooks/useApi';

export function useUnreadCount(): number {
  const user = useAuthStore((s) => s.user);
  const { data } = useNotifications(user?.id);
  if (!user || !data) return 0;
  return data.filter((n) => !n.is_read).length;
}
