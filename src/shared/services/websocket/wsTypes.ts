// =============================================================================
// WebSocket Protocol Contract — Gradorix
// =============================================================================
//
// ENDPOINT
//   ws://{host}/ws?token={jwt_access_token}
//   e.g. ws://localhost:8000/ws?token=eyJ...
//
// AUTH
//   JWT access token passed as query parameter `token`.
//   Server must validate it on connection and close with 4001 if invalid.
//
// FORMAT
//   All frames are JSON text messages.
//   Every message has a top-level `type` field (string discriminator).
//
// HEARTBEAT
//   Client sends { type: "ping" } every ~25 s.
//   Server must reply with { type: "pong" } promptly.
//   If server does not receive a ping within 60 s, it may close the connection.
//
// RECONNECT
//   Client auto-reconnects with exponential backoff (1 s → 30 s max).
//
// =============================================================================
// CLIENT → SERVER  (WsInbound)
// =============================================================================

/** Send a message to the AI chat agent. */
export interface WsChatMessageIn {
  type: 'chat_message';
  payload: {
    /** User's text input */
    text: string;
    /**
     * Optional session identifier.
     * Pass the same value across messages to keep AI context within one
     * conversation. Omit to start a fresh session.
     */
    session_id?: string;
  };
}

/** Heartbeat — server must respond with { type: "pong" }. */
export interface WsPingIn {
  type: 'ping';
}

export type WsInbound = WsChatMessageIn | WsPingIn;

// =============================================================================
// SERVER → CLIENT  (WsOutbound)
// =============================================================================

/**
 * Real-time push notification.
 * Shape must mirror the REST response of GET /notifications/{id}.
 *
 * Trigger examples:
 *   - New challenge assigned to user
 *   - Achievement approved/rejected by HR
 *   - Mentor left a comment
 */
export interface WsNotificationOut {
  type: 'notification';
  payload: {
    id: number;
    user_id: number;
    title: string;
    body: string;
    link?: string | null;
    is_read: boolean;        // always false on push
    created_at: string;      // ISO 8601, e.g. "2026-04-08T12:00:00Z"
  };
}

/**
 * AI is generating a reply — client shows a typing indicator.
 * Send once, right before the first chat_reply frame.
 */
export interface WsChatTypingOut {
  type: 'chat_typing';
  payload: {
    typing: boolean;
  };
}

/**
 * AI reply frame.
 *
 * Supports two modes — use whichever the backend implements:
 *
 * ① Non-streaming (simple):
 *     One frame, done=true, full text in `text`.
 *
 * ② Streaming (chunked, for GigaChat stream API):
 *     Multiple frames with done=false, each carrying a text chunk.
 *     Final frame has done=true (text can be empty).
 *
 *     Client accumulates chunks and renders progressively.
 */
export interface WsChatReplyOut {
  type: 'chat_reply';
  payload: {
    /** Text chunk (streaming) or full reply (non-streaming) */
    text: string;
    /** true = this is the last frame for this reply */
    done: boolean;
    /** Echoed from request session_id, if provided */
    session_id?: string;
  };
}

/** Heartbeat response. */
export interface WsPongOut {
  type: 'pong';
}

/**
 * Server-side error related to the current connection or last request.
 *
 * Recommended codes:
 *   AUTH_FAILED     — token invalid or expired
 *   CHAT_ERROR      — AI backend unavailable
 *   INTERNAL_ERROR  — unexpected server error
 */
export interface WsErrorOut {
  type: 'error';
  payload: {
    code: string;
    message: string;
  };
}

export type WsOutbound =
  | WsNotificationOut
  | WsChatTypingOut
  | WsChatReplyOut
  | WsPongOut
  | WsErrorOut;
