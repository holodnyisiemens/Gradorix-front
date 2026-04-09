import type { WsInbound, WsOutbound } from './wsTypes';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const WS_BASE_URL = (import.meta.env.VITE_WS_URL as string | undefined)
  ?? 'ws://localhost:8000/ws';

const PING_INTERVAL_MS      = 25_000;   // send ping every 25 s
const RECONNECT_BASE_MS     = 1_000;    // first retry after 1 s
const RECONNECT_MAX_MS      = 30_000;   // cap at 30 s

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type WsStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

type MessageHandler = (msg: WsOutbound) => void;
type StatusHandler  = (status: WsStatus) => void;

// ---------------------------------------------------------------------------
// Singleton client
// ---------------------------------------------------------------------------
class WsClient {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private status: WsStatus = 'idle';

  private intentionalClose = false;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout>  | null = null;
  private pingTimer:      ReturnType<typeof setInterval> | null = null;

  private messageHandlers = new Set<MessageHandler>();
  private statusHandlers  = new Set<StatusHandler>();

  // ── Public API ────────────────────────────────────────────────────────────

  /** Open the connection. Call once after login. */
  connect(token: string) {
    if (this.status === 'connected' || this.status === 'connecting') return;
    this.token = token;
    this.intentionalClose = false;
    this.reconnectAttempts = 0;
    this._open();
  }

  /** Close the connection. Call on logout. */
  disconnect() {
    this.intentionalClose = true;
    this._clearTimers();
    this.ws?.close(1000, 'logout');
    this.ws = null;
    this._setStatus('idle');
  }

  /**
   * Send a message to the server.
   * Returns true if the frame was queued, false if not connected.
   */
  send(msg: WsInbound): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
      return true;
    }
    return false;
  }

  /** Subscribe to incoming server messages. Returns an unsubscribe fn. */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Subscribe to connection status changes.
   * The handler is called immediately with the current status.
   * Returns an unsubscribe fn.
   */
  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    handler(this.status);
    return () => this.statusHandlers.delete(handler);
  }

  getStatus(): WsStatus {
    return this.status;
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private _open() {
    if (!this.token) return;
    this._setStatus('connecting');

    const url = `${WS_BASE_URL}?token=${encodeURIComponent(this.token)}`;
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      this.reconnectAttempts = 0;
      this._setStatus('connected');
      this._startPing();
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      try {
        const msg = JSON.parse(event.data) as WsOutbound;
        // Silently swallow heartbeat — not for consumers
        if (msg.type === 'pong') return;
        this.messageHandlers.forEach((h) => h(msg));
      } catch {
        console.warn('[WS] Unparseable message:', event.data);
      }
    };

    ws.onerror = () => {
      // onerror always precedes onclose — just flag the state
      this._setStatus('error');
    };

    ws.onclose = (event: CloseEvent) => {
      this._clearPing();
      // 4001 = auth failed (see wsTypes contract) — don't reconnect
      if (this.intentionalClose || event.code === 1000 || event.code === 4001) {
        this._setStatus('disconnected');
        return;
      }
      this._setStatus('disconnected');
      this._scheduleReconnect();
    };
  }

  private _scheduleReconnect() {
    const delay = Math.min(
      RECONNECT_BASE_MS * 2 ** this.reconnectAttempts,
      RECONNECT_MAX_MS,
    );
    this.reconnectAttempts++;
    console.info(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.reconnectTimer = setTimeout(() => this._open(), delay);
  }

  private _startPing() {
    this._clearPing();
    this.pingTimer = setInterval(() => {
      this.send({ type: 'ping' });
    }, PING_INTERVAL_MS);
  }

  private _clearPing() {
    if (this.pingTimer) { clearInterval(this.pingTimer); this.pingTimer = null; }
  }

  private _clearTimers() {
    this._clearPing();
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
  }

  private _setStatus(s: WsStatus) {
    if (this.status === s) return;
    this.status = s;
    this.statusHandlers.forEach((h) => h(s));
  }
}

/** Singleton — import this everywhere instead of creating new instances. */
export const wsClient = new WsClient();
