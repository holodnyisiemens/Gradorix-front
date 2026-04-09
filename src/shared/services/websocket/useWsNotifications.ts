import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { wsClient } from './wsClient';
import type { WsNotificationOut } from './wsTypes';

/**
 * Listens for real-time `notification` events over WebSocket and
 * merges them into the React Query notifications cache.
 *
 * Mount this once in AppLayout so it's active for the whole session.
 */
export function useWsNotifications() {
  const queryClient = useQueryClient();

  useEffect(() => {
    return wsClient.onMessage((msg) => {
      if (msg.type !== 'notification') return;

      const { title: _title, body, ...rest } = (msg as WsNotificationOut).payload;
      // Normalize WS payload to match the REST Notification shape (message instead of body)
      const incoming = { ...rest, message: body };

      // Prepend to every cached notifications list (different user_id queries)
      queryClient.setQueriesData<unknown[]>(
        { queryKey: ['notifications'], exact: false },
        (old) => {
          if (!Array.isArray(old)) return old;
          // Deduplicate by id
          if (old.some((n: { id: number }) => n.id === incoming.id)) return old;
          return [incoming, ...old];
        },
      );
    });
  }, [queryClient]);
}
