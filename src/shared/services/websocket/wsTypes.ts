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

export type AgentWorkMode = 'normal' | 'data_work' | 'report';

/** Формат файла отчёта (режим «Отчёт»). */
export type ReportFileFormat = 'excel' | 'pdf';

/** Send a message to the AI chat agent. */
export interface WsChatMessageIn {
  type: 'chat_message';
  payload: {
    /** User's text input */
    text: string;

    agent_mode: AgentWorkMode;
    /**
     * Формат отчёта. Передаётся при agent_mode === 'report'.
     * excel — .xlsx, pdf — .pdf
     */
    report_format?: ReportFileFormat;
    /**
     * Optional session identifier.
     * Pass the same value across messages to keep AI context within one
     * conversation. Omit to start a fresh session.
     */
    session_id?: string;
  };
}

/** Send a message in mentor ↔ employee chat. */
export interface WsMentorChatSendIn {
  type: 'mentor_chat_send';
  payload: {
    peer_id: number;
    text: string;
  };
}

/** Heartbeat — server must respond with { type: "pong" }. */
export interface WsPingIn {
  type: 'ping';
}

export type WsInbound = WsChatMessageIn | WsMentorChatSendIn | WsPingIn;

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

/**
 * Report file (Excel or PDF) is generated and ready for download.
 * Event name kept as excel_ready for backward compatibility.
 */
export interface WsExcelReadyOut {
  type: 'excel_ready';
  payload: {
    /** Relative path (e.g. /reports/abc.xlsx, /reports/abc.pdf) or absolute URL */
    file_url: string;
    /** File name for UI */
    filename: string;
  };
}

/** Mentor ↔ employee chat message (real-time). */
export interface WsMentorChatMessageOut {
  type: 'mentor_chat_message';
  payload: {
    id: string;
    mentor_id: number;
    employee_id: number;
    sender_id: number;
    body: string;
    created_at: string;
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
  | WsExcelReadyOut
  | WsMentorChatMessageOut
  | WsPongOut
  | WsErrorOut;
