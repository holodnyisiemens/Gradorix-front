import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { useAuthStore } from '@modules/auth/store/authStore';
import {
  useMentorChatConversations,
  useMentorChatMessages,
  useMarkMentorChatRead,
  useUsers,
} from '@shared/hooks/useApi';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { useWebSocket } from '@shared/services/websocket/useWebSocket';
import type { WsMentorChatMessageOut } from '@shared/services/websocket/wsTypes';
import type { MentorChatMessage } from '@shared/types';
import styles from './MentorChatPage.module.css';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MentorChatPage() {
  const user = useAuthStore((s) => s.user)!;
  const { peerId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatEnabled = user.role === 'MENTOR' || user.role === 'EMPLOYEE';
  const { data: conversations, isLoading } = useMentorChatConversations(chatEnabled);
  const conversationList = useMemo(() => conversations ?? [], [conversations]);
  const { data: allUsers } = useUsers();
  const markRead = useMarkMentorChatRead();
  const { send, subscribe, isConnected } = useWebSocket();

  const selectedPeerId = peerId ? Number(peerId) : undefined;
  const activeConv = conversationList.find((c) => c.peer_id === selectedPeerId);

  const { data: fetchedMessages } = useMentorChatMessages(
    activeConv?.mentor_id,
    activeConv?.employee_id,
  );

  const [messages, setMessages] = useState<MentorChatMessage[]>([]);
  const [input, setInput] = useState('');
  const markedPairRef = useRef<string | null>(null);

  useEffect(() => {
    if (fetchedMessages !== undefined) {
      setMessages(fetchedMessages);
    }
  }, [fetchedMessages]);

  useEffect(() => {
    if (!peerId && conversationList.length === 1) {
      navigate(`/chat/${conversationList[0].peer_id}`, { replace: true });
    }
  }, [conversationList, peerId, navigate]);

  useEffect(() => {
    if (!activeConv) {
      markedPairRef.current = null;
      return;
    }
    const pairKey = `${activeConv.mentor_id}-${activeConv.employee_id}`;
    if (markedPairRef.current === pairKey) return;
    markedPairRef.current = pairKey;
    markRead.mutate({
      mentorId: activeConv.mentor_id,
      employeeId: activeConv.employee_id,
    });
  }, [activeConv?.mentor_id, activeConv?.employee_id, markRead]);

  const appendMessage = useCallback((payload: WsMentorChatMessageOut['payload']) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === payload.id)) return prev;
      return [...prev, payload];
    });
  }, []);

  useEffect(() => {
    return subscribe((msg) => {
      if (msg.type !== 'mentor_chat_message') return;
      const p = msg.payload;
      if (
        activeConv &&
        p.mentor_id === activeConv.mentor_id &&
        p.employee_id === activeConv.employee_id
      ) {
        appendMessage(p);
        if (p.sender_id !== user.id) {
          markRead.mutate({
            mentorId: p.mentor_id,
            employeeId: p.employee_id,
          });
        }
      } else {
        qc.invalidateQueries({ queryKey: ['mentor-chat'] });
      }
    });
  }, [subscribe, activeConv, user.id, appendMessage, qc]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const peerName = (id: number) =>
    (allUsers ?? []).find((u) => u.id === id)?.username ?? `Участник #${id}`;

  const handleSend = () => {
    const text = input.trim();
    if (!activeConv || !text) return;
    const ok = send({
      type: 'mentor_chat_send',
      payload: { peer_id: activeConv.peer_id, text },
    });
    if (ok) setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showSidebarOnMobile = !peerId;

  if (!chatEnabled) {
    return (
      <>
        <PageHeader title="Чат" showBack />
        <p className={styles.emptyList}>Чат доступен только менторам и участникам</p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={activeConv ? peerName(activeConv.peer_id) : 'Чат'}
        showBack={!!peerId}
        onBack={peerId ? () => navigate('/chat') : undefined}
      />
      <div className={styles.page}>
        <aside
          className={[
            styles.sidebar,
            !showSidebarOnMobile && peerId ? styles.sidebarHidden : '',
          ].join(' ')}
        >
          <p className={styles.sidebarTitle}>Диалоги</p>
          <div className={styles.convList}>
            {isLoading ? (
              <p className={styles.emptyList}>Загрузка…</p>
            ) : conversationList.length === 0 ? (
              <p className={styles.emptyList}>
                {user.role === 'MENTOR'
                  ? 'Подопечные ещё не назначены'
                  : 'Ментор ещё не назначен'}
              </p>
            ) : (
              conversationList.map((conv) => (
                <button
                  key={`${conv.mentor_id}-${conv.employee_id}`}
                  type="button"
                  className={[
                    styles.convItem,
                    conv.peer_id === selectedPeerId ? styles.convItemActive : '',
                  ].join(' ')}
                  onClick={() => navigate(`/chat/${conv.peer_id}`)}
                >
                  <div className={styles.convRow}>
                    <span className={styles.convName}>{peerName(conv.peer_id)}</span>
                    {conv.unread_count > 0 && (
                      <span className={styles.unreadBadge}>
                        {conv.unread_count > 9 ? '9+' : conv.unread_count}
                      </span>
                    )}
                  </div>
                  {conv.last_message && (
                    <span className={styles.convPreview}>{conv.last_message.body}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </aside>

        <section className={[styles.chat, peerId ? styles.chatFull : ''].join(' ')}>
          {!activeConv ? (
            <div className={styles.chatEmpty}>
              <span>💬</span>
              <p>Выберите диалог</p>
            </div>
          ) : (
            <>
              {!isConnected && (
                <p className={styles.statusHint}>Нет соединения — сообщения могут задерживаться</p>
              )}
              <div className={styles.messages}>
                {messages.map((m) => {
                  const mine = m.sender_id === user.id;
                  return (
                    <div
                      key={m.id}
                      className={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs].join(
                        ' ',
                      )}
                    >
                      <div>{m.body}</div>
                      <div className={styles.bubbleTime}>{formatTime(m.created_at)}</div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className={styles.composer}>
                <textarea
                  className={styles.input}
                  rows={1}
                  placeholder="Сообщение…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  type="button"
                  className={styles.sendBtn}
                  disabled={!input.trim() || !isConnected}
                  onClick={handleSend}
                  aria-label="Отправить"
                >
                  <Send size={18} />
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
