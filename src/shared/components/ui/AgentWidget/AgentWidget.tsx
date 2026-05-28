import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Bot, X, Send, ChevronDown, Wifi, WifiOff, MessageSquare, Database, FileText, Check } from 'lucide-react';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useUsers, useQuizzes, useQuizResults, useActivities, useChallengeJuniors, useUserPoints } from '@shared/hooks/useApi';
import type { ChatMessage } from '@shared/types';
import { generateReply, HIPO_SUGGESTIONS, HR_SUGGESTIONS, MENTOR_SUGGESTIONS, type ReplyContext } from './agentEngine';
import { useWebSocket } from '@shared/services/websocket/useWebSocket';
import type {
  AgentWorkMode,
  ReportFileFormat,
  WsChatReplyOut,
  WsChatTypingOut,
  WsErrorOut,
  WsExcelReadyOut,
} from '@shared/services/websocket/wsTypes';
import styles from './AgentWidget.module.css';

const AGENT_MODE_OPTIONS: Array<{
  value: AgentWorkMode;
  label: string;
  shortLabel: string;
  Icon: LucideIcon;
}> = [
  { value: 'normal', label: 'обычный', shortLabel: 'Обычный', Icon: MessageSquare },
  { value: 'data_work', label: 'работа с данными', shortLabel: 'Данные', Icon: Database },
  { value: 'report', label: 'отчёт', shortLabel: 'Отчёт', Icon: FileText },
];

const REPORT_FORMAT_OPTIONS: Array<{
  value: ReportFileFormat;
  label: string;
}> = [
  { value: 'excel', label: 'Excel (.xlsx)' },
  { value: 'pdf', label: 'PDF (.pdf)' },
];

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

type WidgetMessage = ChatMessage & {
  fileUrl?: string;
  filename?: string;
};

function resolveReportUrl(fileUrl: string): string {
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
  return `${apiBase}${fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`}`;
}

function truncateFilename(name: string, max = 30): string {
  return name.length > max ? `${name.slice(0, max)}...` : name;
}

export function AgentWidget() {
  const user = useAuthStore((s) => s.user)!;
  const isHR = user.role === 'HR';
  const isMentor = user.role === 'MENTOR';

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [agentMode, setAgentMode] = useState<AgentWorkMode>('normal');
  const [reportFormat, setReportFormat] = useState<ReportFileFormat>('excel');
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modeMenuRef = useRef<HTMLDivElement>(null);

  const selectedModeOption = useMemo(
    () => AGENT_MODE_OPTIONS.find((o) => o.value === agentMode) ?? AGENT_MODE_OPTIONS[0],
    [agentMode],
  );

  // ── Mock data for fallback ───────────────────────────────────────────────
  const { data: allUsers = [] } = useUsers();
  const { data: quizResults = [] } = useQuizResults();
  const { data: quizzes = [] } = useQuizzes();
  const { data: activities = [] } = useActivities();
  const { data: allAssignments = [] } = useChallengeJuniors();
  const { data: userPoints } = useUserPoints(user.id);

  const juniorActivityStats = allUsers.filter(u => u.role === 'EMPLOYEE').map(u => {
    const ua = allAssignments.filter(a => a.employee_id === u.id);
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

      if (msg.type === 'excel_ready') {
        const { file_url, filename } = (msg as WsExcelReadyOut).payload;
        setMessages((prev) => [
          ...prev,
          {
            id: `excel-${Date.now()}`,
            role: 'assistant',
            content: `Готов файл отчёта: ${truncateFilename(filename, 30)}`,
            timestamp: timestamp(),
            fileUrl: resolveReportUrl(file_url),
            filename,
          },
        ]);
        setIsTyping(false);
        streamingIdRef.current = null;
        return;
      }
    });
  }, [subscribe]);

  // ── Scroll ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, open]);

  useEffect(() => {
    if (!isHR) {
      setModeMenuOpen(false);
      setAgentMode('normal');
    }
  }, [isHR]);

  useEffect(() => {
    if (!isHR || !modeMenuOpen) return;
    function onDocMouseDown(e: MouseEvent) {
      const el = modeMenuRef.current;
      if (el && !el.contains(e.target as Node)) setModeMenuOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setModeMenuOpen(false);
    }
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isHR, modeMenuOpen]);

  // ── Send message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;

    const trimmed = text.trim();
    lastSentRef.current = trimmed;

    const userMsg: WidgetMessage = {
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
      const agentModeToSend: AgentWorkMode = isHR ? agentMode : 'normal';
      const payload: {
        text: string;
        agent_mode: AgentWorkMode;
        report_format?: ReportFileFormat;
      } = { text: trimmed, agent_mode: agentModeToSend };
      if (isHR && agentModeToSend === 'report') {
        payload.report_format = reportFormat;
      }
      send({ type: 'chat_message', payload });
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
  }, [isConnected, send, user.role, replyCtx, agentMode, reportFormat, isHR]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const ModeTriggerIcon = selectedModeOption.Icon;

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
                {msg.fileUrl && msg.filename && (
                  <a
                    href={msg.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    download={msg.filename}
                    className={styles.reportLink}
                  >
                    Скачать файл: {truncateFilename(msg.filename, 30)}
                  </a>
                )}
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
          <div className={styles.inputArea}>
            <textarea
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Напишите сообщение..."
              rows={1}
            />
            <div className={styles.inputToolbar}>
              {isHR && (
                <div className={styles.modeWrap} ref={modeMenuRef}>
                  <button
                    type="button"
                    className={styles.modeTrigger}
                    onClick={() => setModeMenuOpen((v) => !v)}
                    aria-expanded={modeMenuOpen}
                    aria-haspopup="listbox"
                    aria-label="Режим агента"
                  >
                    <ModeTriggerIcon size={14} aria-hidden />
                    <span>
                      {agentMode === 'report'
                        ? `${selectedModeOption.shortLabel} · ${reportFormat === 'pdf' ? 'PDF' : 'XLSX'}`
                        : selectedModeOption.shortLabel}
                    </span>
                    <ChevronDown
                      size={14}
                      className={[styles.modeTriggerChevron, modeMenuOpen ? styles.modeTriggerChevronOpen : ''].join(' ')}
                      aria-hidden
                    />
                  </button>
                  {modeMenuOpen && (
                    <div className={styles.modeMenu} role="listbox" aria-label="Режим работы агента">
                      {AGENT_MODE_OPTIONS.map(({ value, label, Icon }) => (
                        <button
                          key={value}
                          type="button"
                          role="option"
                          aria-selected={agentMode === value}
                          className={[styles.modeMenuItem, agentMode === value ? styles.modeMenuItemActive : ''].join(' ')}
                          onClick={() => {
                            setAgentMode(value);
                            if (value !== 'report') setModeMenuOpen(false);
                          }}
                        >
                          <Icon size={16} aria-hidden />
                          <span className={styles.modeMenuLabel}>{label}</span>
                          {agentMode === value ? <Check size={16} className={styles.modeMenuCheck} aria-hidden /> : <span className={styles.modeMenuCheckSlot} aria-hidden />}
                        </button>
                      ))}
                      {agentMode === 'report' && (
                        <div className={styles.reportFormatSection}>
                          <p className={styles.reportFormatTitle}>Формат отчёта</p>
                          <div className={styles.reportFormatOptions} role="group" aria-label="Формат отчёта">
                            {REPORT_FORMAT_OPTIONS.map(({ value, label }) => (
                              <button
                                key={value}
                                type="button"
                                className={[
                                  styles.reportFormatBtn,
                                  reportFormat === value ? styles.reportFormatBtnActive : '',
                                ].join(' ')}
                                aria-pressed={reportFormat === value}
                                onClick={() => {
                                  setReportFormat(value);
                                  setModeMenuOpen(false);
                                }}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div className={styles.toolbarSpacer} />
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
