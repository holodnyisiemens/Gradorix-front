import type { User, UserPoints, QuizResult, Quiz, Activity } from '@shared/types';

export interface ReplyContext {
  allUsers: User[];
  userPoints: UserPoints | undefined;
  quizResults: QuizResult[];
  quizzes: Quiz[];
  activities: Activity[];
  juniorActivityStats: Array<{
    userId: number;
    done: number;
    skipped: number;
    totalChallenges: number;
    completionRate: number;
  }>;
}

export function generateReply(text: string, role: string, ctx: ReplyContext): string {
  const q = text.toLowerCase();
  const pts = ctx.userPoints;

  if (role === 'HR') {
    if (q.includes('топ') || q.includes('рейтинг') || q.includes('лучш')) {
      const stats = ctx.juniorActivityStats.slice().sort((a, b) => b.completionRate - a.completionRate);
      const top = stats.slice(0, 3).map((s, i) => {
        const u = ctx.allUsers.find((x) => x.id === s.userId);
        return `${i + 1}. ${u?.firstname} ${u?.lastname} — ${s.completionRate}% выполнения задач`;
      }).join('\n');
      return `📊 **Топ участников по выполнению задач:**\n\n${top}\n\nДанные актуальны на сегодня.`;
    }
    if (q.includes('активност') || q.includes('статистик')) {
      const stats = ctx.juniorActivityStats;
      const total = stats.reduce((s, a) => s + a.done, 0);
      const skipped = stats.reduce((s, a) => s + a.skipped, 0);
      const avgRate = stats.length ? Math.round(stats.reduce((s, a) => s + a.completionRate, 0) / stats.length) : 0;
      return `📈 **Сводка активности HiPo:**\n\nВыполнено заданий: **${total}**\nПропущено: **${skipped}**\nАктивных участников: **${stats.filter(s => s.totalChallenges > 0).length}** из ${stats.length}\nСредний % выполнения: **${avgRate}%**`;
    }
    if (q.includes('тест') || q.includes('quiz')) {
      const results = ctx.quizResults;
      const avgScore = results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;
      const best = results.slice().sort((a, b) => b.score - a.score)[0];
      const bestQuiz = best ? ctx.quizzes.find(qz => qz.id === best.quizId)?.title : '';
      return `🧪 **Статистика тестирования:**\n\nВсего попыток: **${results.length}**\nСредний балл: **${avgScore}%**\nЛучший результат: ${best?.score ?? 0}% ("${bestQuiz}")`;
    }
    if (q.includes('достижени') || q.includes('подтвер') || q.includes('ожида')) {
      const pending = ctx.activities.filter((a) => a.status === 'pending');
      return `⏳ **Ожидают подтверждения: ${pending.length}**\n\n${pending.slice(0, 5).map(a => {
        const u = ctx.allUsers.find(x => x.id === a.userId);
        return `• ${u?.firstname} ${u?.lastname}: "${a.title}" (+${a.requestedPoints} баллов)`;
      }).join('\n')}\n\nПерейдите в раздел "Баллы" для обработки.`;
    }
    if (q.includes('помощ') || q.includes('что умеешь') || q.includes('help')) {
      return `🤖 **AI-ассистент Gradorix** (HR режим)\n\nЧто я умею:\n📊 Статистика участников\n🏆 Рейтинги и топ-листы\n🧪 Аналитика по тестам\n⏳ Ожидающие подтверждения\n\nСпросите: "топ участников", "статистика тестов", "что ждёт подтверждения"`;
    }
    return `🤖 Работаю с данными программы HiPo: участники, рейтинги, тесты, активности.\n\nПопробуйте: "топ участников", "статистика тестов", "ожидают подтверждения".`;
  }

  // HiPo / Mentor mode
  if (q.includes('привет') || q.includes('hello') || q.includes('hi')) {
    return `🔴 *...сигнал из Изнанки...*\n\nПривет! Я — твой проводник в мире карьерного роста.\n\nЧем могу помочь сегодня?`;
  }
  if (q.includes('балл') || q.includes('очк') || q.includes('рейтинг') || q.includes('уровен')) {
    if (pts) {
      return `⚡ Твой уровень: **${pts.levelName}** (${pts.totalPoints} баллов)\n\nДо следующего уровня: **${pts.pointsToNextLevel} баллов**\nПозиция в рейтинге: **#${pts.rank}**\n\nПройди тест или выполни задание — и ты станешь ближе к цели 🌒`;
    }
    return `⚡ Твои баллы пока не определены. Начни с первого задания — и путь откроется!`;
  }
  if (q.includes('задани') || q.includes('task') || q.includes('что делать')) {
    return `🎯 Пути вперёд:\n\n• **Задания ментора** — раздел "Задачи"\n• **Тесты** — быстрый способ заработать баллы\n• **Достижения** — добавь своё в профиле\n\nВ этом мире побеждает тот, кто не боится тьмы.`;
  }
  if (q.includes('тест') || q.includes('quiz')) {
    return `🧪 Тесты — это твои порталы в мир новых баллов!\n\nЗайди в раздел "Тесты" и выбери подходящий. Каждый пройденный тест — шаг из тьмы к свету 🔦`;
  }
  if (q.includes('совет') || q.includes('рекоменд') || q.includes('как')) {
    return `🌒 Мой совет:\n\n1. Не пропускай задания\n2. Проходи тесты сразу после изучения темы\n3. Добавляй свои достижения\n4. Общайся с ментором\n\nЧем конкретнее вопрос — тем точнее ответ 🔴`;
  }
  if (q.includes('ментор') || q.includes('команд')) {
    return `👥 Твой ментор — проводник в будущее.\n\nПодготовься к встрече:\n• Зафикси прогресс по заданиям\n• Сформулируй 2-3 вопроса\n• Покажи конкретные результаты\n\nСила команды — в каждом её участнике 🤝`;
  }
  if (q.includes('помощ') || q.includes('что умеешь') || q.includes('help')) {
    return `🔴 **AI-агент Gradorix**\n\nЯ помогу:\n• 📊 Узнать баллы и уровень\n• 🎯 Понять, что делать дальше\n• 🧪 Подобрать тест\n• 💡 Получить совет по карьере\n\nСпрашивай — я здесь 🌒`;
  }
  if (q.includes('достижени') || q.includes('медаль')) {
    return `🏆 Как добавить достижение:\n1. Перейди в Профиль\n2. Нажми "Добавить достижение"\n3. Опиши, что сделал\n4. Жди подтверждения HR\n\nДаже маленький шаг достоин признания 🌱`;
  }

  const fallbacks = [
    `🌒 Можешь уточнить вопрос? Лучше всего отвечаю на вопросы о баллах, заданиях, тестах и карьерных советах.`,
    `🔴 Переформулируй — отвечу точнее. Или спроси: "что мне делать дальше" или "какие у меня баллы".`,
    `⚡ Спроси про баллы, уровень, задания или тесты — и я помогу!`,
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

export const HIPO_SUGGESTIONS = [
  '💬 Какой у меня уровень и баллы?',
  '🎯 Что стоит сделать дальше?',
  '🧪 Какие тесты доступны?',
  '🏆 Как добавить достижение?',
];

export const HR_SUGGESTIONS = [
  '📊 Топ участников по активности',
  '🧪 Статистика по тестам',
  '⏳ Что ожидает подтверждения?',
];
