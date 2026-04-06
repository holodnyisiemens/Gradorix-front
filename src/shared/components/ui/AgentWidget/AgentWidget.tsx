import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useUsers, useQuizzes, useQuizResults, useActivities, useChallengeJuniors, useUserPoints } from '@shared/hooks/useApi';
import type { ChatMessage } from '@shared/types';
import { generateReply, HIPO_SUGGESTIONS, HR_SUGGESTIONS, type ReplyContext } from './agentEngine';
import styles from './AgentWidget.module.css';

function renderContent(content: string) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

export function AgentWidget() {
  const user = useAuthStore((s) => s.user)!;
  const isHR = user.role === 'HR';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  const suggestions = isHR ? HR_SUGGESTIONS : HIPO_SUGGESTIONS;

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, open]);

  function sendMessage(text: string) {
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      const reply = generateReply(text, user.role, replyCtx);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 800 + Math.random() * 600);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className={styles.root}>
      {/* Chat panel */}
      {open && (
        <div className={styles.panel}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <span className={styles.headerIcon}>🔴</span>
              <div>
                <p className={styles.headerTitle}>AI Агент</p>
                <p className={styles.headerSub}>{isHR ? 'Аналитика · HiPo' : 'Карьерный помощник'}</p>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Закрыть">
              <ChevronDown size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className={styles.messages}>
            {messages.length === 0 && (
              <div className={styles.welcome}>
                <p className={styles.welcomeText}>
                  {isHR
                    ? 'Аналитический помощник с доступом к данным программы HiPo.'
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
