import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, X, Send, ChevronDown, Wifi, WifiOff } from 'lucide-react';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useUsers, useQuizzes, useQuizResults, useActivities, useChallengeJuniors, useUserPoints } from '@shared/hooks/useApi';
import type { ChatMessage } from '@shared/types';
import { generateReply, HIPO_SUGGESTIONS, HR_SUGGESTIONS, MENTOR_SUGGESTIONS, type ReplyContext } from './agentEngine';
import { useWebSocket } from '@shared/services/websocket/useWebSocket';
import type { WsChatReplyOut, WsChatTypingOut, WsErrorOut } from '@shared/services/websocket/wsTypes';
import styles from './AgentWidget.module.css';

function renderContent(content: string) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

function timestamp() {
  return new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export function AgentWidget() {
  const user = useAuthStore((s) => s.user)!;
  const isHR = user.role === 'HR';
  const isMentor = user.role === 'MENTOR';

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Mock data for fallback ───────────────────────────────────────────────
  const { data: allUsers = [] } = useUsers();
  const { data: quizResults = [] } = useQuizResults();
  const { data: quizzes = [] } = useQuizzes();
  const { data: activities = [] } = useActivities();
  const { data: allAssignments = [] } = useChallengeJuniors();
  const { data: userPoints } = useUserPoints(user.id);

  const juniorActivityStats = allUsers.filter(u => u.role === 'JUNIOR').map(u => {
    const ua = allAssignments.filter(a => a.junior_id === u.id);
    const done = ua.filter(a => a.progress === 'DONE').length;
    const skipped = ua.filter(a => a.progress === 'SKIPPED').length;
    const total = ua.length;
    return { userId: u.id, done, skipped, totalChallenges: total, completionRate: total ? Math.round(done / total * 100) : 0 };
  });

  const replyCtx: ReplyContext = { allUsers, userPoints, quizResults, quizzes, activities, juniorActivityStats };
  const suggestions = isHR ? HR_SUGGESTIONS : isMentor ? MENTOR_SUGGESTIONS : HIPO_SUGGESTIONS;

  // Refs to keep latest context accessible in stable WS callbacks
  const replyCtxRef = useRef(replyCtx);
  replyCtxRef.current = replyCtx;
  const lastSentRef = useRef('');
  const userRef = useRef(user);
  userRef.current = user;

  // ── WebSocket ────────────────────────────────────────────────────────────
  const { isConnected, send, subscribe } = useWebSocket();

  // Accumulates streaming chunks until done=true
  const streamingIdRef = useRef<string | null>(null);

  useEffect(() => {
    return subscribe((msg) => {
      // Typing indicator from server
      if (msg.type === 'chat_typing') {
        const { typing } = (msg as WsChatTypingOut).payload;
        setIsTyping(typing);
        return;
      }

      // Server-side error — fall back to local mock so chat never hangs
      if (msg.type === 'error') {
        const { code } = (msg as WsErrorOut).payload;
        if (code === 'CHAT_ERROR' || code === 'INTERNAL_ERROR') {
          const reply = generateReply(lastSentRef.current, userRef.current.role, replyCtxRef.current);
          setMessages((prev) => [
            ...prev,
            { id: `fallback-${Date.now()}`, role: 'assistant', content: reply, timestamp: timestamp() },
          ]);
          setIsTyping(false);
        }
        return;
      }

      // AI reply — supports both streaming (done=false) and full (done=true)
      if (msg.type === 'chat_reply') {
        const { text, done } = (msg as WsChatReplyOut).payload;

        setMessages((prev) => {
          // If we already have a streaming message in progress, append to it
          if (streamingIdRef.current) {
            return prev.map((m) =>
              m.id === streamingIdRef.current
                ? { ...m, content: m.content + text }
                : m,
            );
          }
          // First chunk / full reply — create a new assistant message
          const id = `ws-${Date.now()}`;
          streamingIdRef.current = id;
          return [
            ...prev,
            { id, role: 'assistant', content: text, timestamp: timestamp() },
          ];
        });

        if (done) {
          streamingIdRef.current = null;
          setIsTyping(false);
        }
        return;
      }
    });
  }, [subscribe]);

  // ── Scroll ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, open]);

  // ── Send message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;

    const trimmed = text.trim();
    lastSentRef.current = trimmed;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: timestamp(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    if (isConnected) {
      // ── Real path: delegate to backend via WebSocket ──────────────────
      // Server will respond with chat_typing + chat_reply frames (or error → fallback)
      setIsTyping(true);
      send({ type: 'chat_message', payload: { text: trimmed } });
    } else {
      // ── Fallback: local mock (until backend WS is ready) ──────────────
      setIsTyping(true);
      setTimeout(() => {
        const reply = generateReply(trimmed, user.role, replyCtxRef.current);
        setMessages((prev) => [
          ...prev,
          { id: `mock-${Date.now()}`, role: 'assistant', content: reply, timestamp: timestamp() },
        ]);
        setIsTyping(false);
      }, 800 + Math.random() * 600);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, send, user.role, replyCtx]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={styles.root}>
      {open && (
        <div className={styles.panel}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <span className={styles.headerIcon}>🔴</span>
              <div>
                <p className={styles.headerTitle}>AI Агент</p>
                <p className={styles.headerSub}>{isHR ? 'Аналитика' : isMentor ? 'Помощник ментора' : 'Карьерный помощник'}</p>
              </div>
            </div>
            <div className={styles.headerRight}>
              {/* WS connection indicator */}
              <span
                className={[styles.wsStatus, isConnected ? styles.wsOnline : styles.wsOffline].join(' ')}
                title={isConnected ? 'Онлайн' : 'Офлайн — mock режим'}
              >
                {isConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
              </span>
              <button className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Закрыть">
                <ChevronDown size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className={styles.messages}>
            {messages.length === 0 && (
              <div className={styles.welcome}>
                <p className={styles.welcomeText}>
                  {isHR
                    ? 'Аналитический помощник с доступом к данным программы ОКД.'
                    : isMentor
                    ? 'Помощник ментора. Спрашивай про подопечных, задачи и планирование встреч.'
                    : 'Твой проводник по программе. Спрашивай про баллы, задания, тесты.'}
                </p>
                <div className={styles.suggestions}>
                  {suggestions.map((s) => (
                    <button key={s} className={styles.suggestion} onClick={() => sendMessage(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant].join(' ')}
              >
                <div style={{ whiteSpace: 'pre-line' }}>{renderContent(msg.content)}</div>
                <div className={styles.timestamp}>{msg.timestamp}</div>
              </div>
            ))}

            {isTyping && (
              <div className={styles.typing}>
                <div className={styles.dot} />
                <div className={styles.dot} />
                <div className={styles.dot} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className={styles.inputRow}>
            <textarea
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Напишите сообщение..."
              rows={1}
            />
            <button
              className={styles.sendBtn}
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              aria-label="Отправить"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        className={[styles.fab, open ? styles.fabOpen : ''].join(' ')}
        onClick={() => setOpen((v) => !v)}
        aria-label="AI Агент"
      >
        {open ? <X size={22} /> : <Bot size={22} />}
      </button>
    </div>
  );
}
