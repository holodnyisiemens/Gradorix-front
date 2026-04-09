import { useEffect, useState, useCallback } from 'react';
import { wsClient, type WsStatus } from './wsClient';
import type { WsInbound, WsOutbound } from './wsTypes';

/**
 * React hook — exposes WebSocket connection state and helpers.
 *
 * Usage:
 *   const { isConnected, status, send, subscribe } = useWebSocket();
 */
export function useWebSocket() {
  const [status, setStatus] = useState<WsStatus>(wsClient.getStatus());

  useEffect(() => {
    // onStatus calls the handler immediately with current state
    return wsClient.onStatus(setStatus);
  }, []);

  /** Send a message. Returns false if not connected. */
  const send = useCallback((msg: WsInbound) => wsClient.send(msg), []);

  /**
   * Subscribe to incoming server messages.
   * Returns an unsubscribe function — call it in useEffect cleanup.
   *
   * Example:
   *   useEffect(() => subscribe((msg) => { ... }), [subscribe]);
   */
  const subscribe = useCallback(
    (handler: (msg: WsOutbound) => void) => wsClient.onMessage(handler),
    [],
  );

  return {
    status,
    isConnected: status === 'connected',
    send,
    subscribe,
  };
}
