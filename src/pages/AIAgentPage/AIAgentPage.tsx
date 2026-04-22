import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useAuthStore } from '@modules/auth/store/authStore';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { useUsers, useQuizzes, useQuizResults, useActivities, useChallengeJuniors, useUserPoints } from '@shared/hooks/useApi';
import type { ChatMessage, User, UserPoints, QuizResult, Quiz, Activity } from '@shared/types';
import styles from './AIAgentPage.module.css';

interface ReplyContext {
  allUsers: User[];
  userPoints: UserPoints | undefined;
  quizResults: QuizResult[];
  quizzes: Quiz[];
  activities: Activity[];
  juniorActivityStats: Array<{ userId: number; done: number; skipped: number; totalChallenges: number; completionRate: number }>;
}

// ===== GIGACHAT MOCK ENGINE =====
function generateReply(text: string, role: string, ctx: ReplyContext): string {
  const q = text.toLowerCase();
  const pts = ctx.userPoints;

  if (role === 'HR') {
    // Analytics mode
    if (q.includes('топ') || q.includes('рейтинг') || q.includes('лучш')) {
      const stats = ctx.juniorActivityStats.slice().sort((a, b) => b.completionRate - a.completionRate);
      const top = stats.slice(0, 3).map((s, i) => {
        const u = ctx.allUsers.find((x) => x.id === s.userId);
        return `${i + 1}. ${u?.firstname} ${u?.lastname} — ${s.completionRate}% выполнения задач`;
      }).join('\n');
      return `📊 **Топ участников по выполнению задач:**\n\n${top}\n\nДанные актуальны на сегодня. Хотите подробнее по кому-то конкретному?`;
    }
    if (q.includes('активност') || q.includes('статистик')) {
      const stats = ctx.juniorActivityStats;
      const total = stats.reduce((s, a) => s + a.done, 0);
      const skipped = stats.reduce((s, a) => s + a.skipped, 0);
      const avgRate = stats.length ? Math.round(stats.reduce((s, a) => s + a.completionRate, 0) / stats.length) : 0;
      return `📈 **Сводка активности HiPo:**\n\nВсего выполнено заданий: **${total}**\nПропущено: **${skipped}**\nАктивных участников: **${stats.filter(s => s.totalChallenges > 0).length}** из ${stats.length}\n\nСредний процент выполнения: **${avgRate}%**`;
    }
    if (q.includes('тест') || q.includes('quiz')) {
      const results = ctx.quizResults;
      const avgScore = results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;
      const best = results.slice().sort((a, b) => b.score - a.score)[0];
      const bestQuiz = best ? ctx.quizzes.find(qz => qz.id === best.quizId)?.title : '';
      return `🧪 **Статистика тестирования:**\n\nВсего попыток: **${results.length}**\nСредний балл: **${avgScore}%**\n\nЛучший результат: ${best?.score ?? 0}% (тест "${bestQuiz}")\n\nХотите детализацию по конкретному участнику?`;
    }
    if (q.includes('достижени') || q.includes('подтвер')) {
      const pending = ctx.activities.filter((a) => a.status === 'pending');
      return `⏳ **Ожидают подтверждения: ${pending.length} активностей**\n\n${pending.map(a => {
        const u = ctx.allUsers.find(x => x.id === a.userId);
        return `• ${u?.firstname} ${u?.lastname}: "${a.title}" (+${a.requestedPoints} баллов)`;
      }).join('\n')}\n\nПерейдите в раздел "Баллы" для обработки.`;
    }
    if (q.includes('помощ') || q.includes('что умеешь') || q.includes('help')) {
      return `🤖 **Я — AI-ассистент Gradorix** (Admin режим)\n\nЧто я умею:\n\n📊 Статистика участников и активность\n🏆 Рейтинги и топ-листы\n🧪 Аналитика по тестам\n⏳ Сводки по ожидающим подтверждениям\n👥 Информация о командах\n\nПросто спросите: "топ участников", "статистика тестов", "кто неактивен" и т.д.`;
    }
    if (q.includes('команд') || q.includes('team')) {
      return `👥 **Команды программы:**\n\n**Backend Pioneers** (ментор: Алексей Воронов)\n• Катя Ефимова, Иван Петров\n\n**Growth Squad** (ментор: Даша Крылова)\n• Мила Зайцева, Саша Морозов\n\nОбе команды активны. Хотите аналитику по конкретной команде?`;
    }
    return `🤖 Понял ваш запрос. Для уточнения — я работаю с данными программы HiPo: участники, рейтинги, тесты, активности, команды.\n\nПопробуйте: "топ участников", "статистика тестов", "активности на проверке".`;
  }

  // HiPo / Mentor mode — мистический стиль
  if (q.includes('привет') || q.includes('hello') || q.includes('hi')) {
    return `🔴 *...сигнал из Изнанки...*\n\nПривет! Я — твой проводник в мире карьерного роста. Тьма вокруг, но путь к вершине виден только тем, кто не останавливается.\n\nЧем могу помочь сегодня?`;
  }
  if (q.includes('балл') || q.includes('очк') || q.includes('рейтинг') || q.includes('уровен')) {
    if (pts && pts.totalPoints !== undefined) {
      return `⚡ Твой текущий уровень: **${pts.levelName}** (${pts.totalPoints} баллов)\n\nДо следующего уровня: **${pts.pointsToNextLevel} баллов**\nПозиция в рейтинге: **#${pts.rank}**\n\nВ Изнанке продвигаются те, кто не стоит на месте. Пройди тест или выполни задание — и ты станешь ближе к цели 🌒`;
    }
    return `⚡ Твои баллы пока не определены. Начни с первого задания — и путь откроется!`;
  }
  if (q.includes('задани') || q.includes('task') || q.includes('challenge') || q.includes('что делать')) {
    return `🎯 Чтобы продвинуться вперёд, у тебя есть несколько путей:\n\n• **Задания ментора** — проверь раздел "Задачи"\n• **Тесты** — быстрый способ заработать баллы\n• **Достижения** — добавь своё в профиле\n\nПомни: в этом мире побеждает тот, кто не боится тьмы.`;
  }
  if (q.includes('тест') || q.includes('quiz') || q.includes('проверк')) {
    return `🧪 Тесты — это твои порталы в мир новых баллов!\n\nДоступные тесты в разделе "Тесты". Рекомендую:\n• **Основы Git** — 80 баллов, 10 мин\n• **REST API и HTTP** — 100 баллов, 12 мин\n\nКаждый пройденный тест — шаг из тьмы к свету 🔦`;
  }
  if (q.includes('совет') || q.includes('рекоменд') || q.includes('что дальше') || q.includes('как')) {
    return `🌒 *Изнанка шепчет...*\n\nМой совет:\n\n1. Не пропускай задания — каждый пропуск тянет тебя вниз\n2. Проходи тесты сразу после изучения темы\n3. Добавляй свои достижения — HR их ценит\n4. Общайся с ментором — его опыт бесценен\n\nЧем конкретнее твой вопрос — тем точнее мой ответ 🔴`;
  }
  if (q.includes('ментор') || q.includes('команд') || q.includes('team')) {
    return `👥 Твой ментор — это не просто куратор, это твой проводник в будущее.\n\nПодготовься к следующей встрече:\n• Зафикси прогресс по заданиям\n• Сформулируй 2-3 вопроса\n• Покажи конкретные результаты\n\nСила команды — в каждом её участнике 🤝`;
  }
  if (q.includes('помощ') || q.includes('что умеешь') || q.includes('help') || q.includes('умеешь')) {
    return `🔴 **Привет! Я — AI-агент Gradorix**\n\nЯ помогу тебе:\n\n• 📊 Узнать свои баллы и уровень\n• 🎯 Понять, что делать дальше\n• 🧪 Подобрать тест по теме\n• 💡 Получить совет по карьере в программе\n\nСпрашивай — я здесь, даже когда темно 🌒`;
  }
  if (q.includes('достижени') || q.includes('медаль') || q.includes('значок')) {
    return `🏆 Достижения — это следы твоего пути!\n\nКак добавить:\n1. Перейди в Профиль\n2. Нажми "Добавить достижение"\n3. Опиши, что ты сделал\n4. Жди подтверждения HR\n\nДаже маленький шаг достоин признания 🌱`;
  }
  if (q.includes('база знани') || q.includes('материал') || q.includes('читать') || q.includes('учить')) {
    return `📚 База знаний — твой фонарь в темноте!\n\nЗагляни в раздел **"База знаний"**. Там есть:\n• О программе и системе баллов\n• Технические гайды (Git, Docker, FastAPI)\n• Регламенты и шаблоны\n• FAQ\n\nЗнание — это свет, который не гаснет 🔦`;
  }

  const fallbacks = [
    `🌒 *Сигнал слабый...* Можешь уточнить вопрос? Я лучше всего отвечаю на вопросы о баллах, заданиях, тестах и карьерных советах.`,
    `🔴 Интересный вопрос! Попробуй переформулировать — я отвечу точнее. Или спроси: "что мне делать дальше" или "какие у меня баллы".`,
    `⚡ Изнанка не всегда отвечает сразу... Спроси про баллы, уровень, задания или тесты — и я помогу!`,
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

const HIPO_SUGGESTIONS = [
  '💬 Какой у меня уровень и сколько баллов?',
  '🎯 Что мне стоит сделать дальше?',
  '🧪 Какие тесты мне доступны?',
  '🏆 Как добавить достижение?',
];

const HR_SUGGESTIONS = [
  '📊 Покажи топ участников по активности',
  '🧪 Статистика по тестам',
  '⏳ Что ожидает подтверждения?',
  '👥 Информация о командах',
];

export function AIAgentPage() {
  const user = useAuthStore((s) => s.user)!;
  const isHR = user.role === 'HR';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
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

    const delay = 800 + Math.random() * 700;
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
    }, delay);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const renderContent = (content: string) => {
    // Basic markdown: **bold**
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : <span key={i}>{part}</span>
    );
  };

  const suggestions = isHR ? HR_SUGGESTIONS : HIPO_SUGGESTIONS;

  return (
    <>
      <PageHeader title="AI Агент" showBack subtitle={isHR ? "Аналитика · GigaChat" : "Карьерный помощник · GigaChat"} />
      <div className={styles.page}>
        <div className={styles.messages}>
          {messages.length === 0 && (
            <div className={styles.welcome}>
              <div className={styles.welcomeIcon}>🔴</div>
              <p className={styles.welcomeTitle}>GigaChat Агент</p>
              <p className={styles.welcomeText}>
                {isHR
                  ? 'Аналитический помощник с доступом к данным программы HiPo. Задайте вопрос о участниках, рейтингах или тестах.'
                  : 'Твой личный проводник по программе. Спрашивай про баллы, задания, тесты — я здесь.'}
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
            <div key={msg.id} className={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant].join(' ')}>
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

        <div className={styles.inputRow}>
          <textarea
            ref={textareaRef}
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
            <Send size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
