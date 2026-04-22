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

const MENTOR_FOLLOWUPS = [
  '👥 Мои подопечные и их прогресс',
  '📋 Какие задачи назначены подопечным?',
  '💡 Как помочь участнику расти быстрее?',
  '📅 Когда провести встречу с подопечным?',
];

const HR_FOLLOWUPS = [
  '📊 Топ участников по активности',
  '🧪 Статистика по тестам',
  '⏳ Что ожидает подтверждения?',
  '📈 Общая активность участников',
];

const HIPO_FOLLOWUPS = [
  '💬 Какой у меня уровень и баллы?',
  '🎯 Что стоит сделать дальше?',
  '🧪 Какие тесты доступны?',
  '🏆 Как добавить достижение?',
  '🗺️ Напиши план развития для меня',
];

function withFollowup(answer: string, role: string): string {
  const list = role === 'HR' ? HR_FOLLOWUPS : role === 'MENTOR' ? MENTOR_FOLLOWUPS : HIPO_FOLLOWUPS;
  const picks = list.sort(() => Math.random() - 0.5).slice(0, 3);
  return `${answer}\n\n---\n💡 *Что ещё можно спросить:*\n${picks.map((s) => `• ${s}`).join('\n')}`;
}

export function generateReply(text: string, role: string, ctx: ReplyContext): string {
  const q = text.toLowerCase();
  const pts = ctx.userPoints;

  if (role === 'HR') {
    if (q.includes('привет') || q.includes('hello') || q.includes('hi')) {
      return withFollowup(`👋 Привет! Я — аналитический ассистент.\n\nЧем могу помочь?\n• 📊 Рейтинги и топ участников\n• 🧪 Статистика по тестам\n• ⏳ Ожидающие подтверждения\n• 📈 Общая активность участников`, role);
    }
    if (q.includes('топ') || q.includes('рейтинг') || q.includes('лучш')) {
      const stats = ctx.juniorActivityStats.slice().sort((a, b) => b.completionRate - a.completionRate);
      const top = stats.slice(0, 3).map((s, i) => {
        const u = ctx.allUsers.find((x) => x.id === s.userId);
        return `${i + 1}. ${u?.firstname ?? ''} ${u?.lastname ?? ''} — ${s.completionRate}% выполнения задач`;
      }).join('\n');
      return withFollowup(`📊 **Топ участников по выполнению задач:**\n\n${top || 'Данных пока нет'}\n\nДанные актуальны на сегодня.`, role);
    }
    if (q.includes('список') || q.includes('все участник') || q.includes('перечисли')) {
      const juniors = ctx.allUsers.filter(u => u.role === 'JUNIOR');
      const list = juniors.map((u, i) => `${i + 1}. ${u.firstname ?? ''} ${u.lastname ?? ''}`.trim() || u.username).join('\n');
      return withFollowup(`👥 **Участники программы (${juniors.length}):**\n\n${list || 'Пока никого нет'}`, role);
    }
    if (q.includes('активност') || q.includes('статистик')) {
      const stats = ctx.juniorActivityStats;
      const total = stats.reduce((s, a) => s + a.done, 0);
      const skipped = stats.reduce((s, a) => s + a.skipped, 0);
      const avgRate = stats.length ? Math.round(stats.reduce((s, a) => s + a.completionRate, 0) / stats.length) : 0;
      return withFollowup(`📈 **Сводка активности участников:**\n\nВыполнено заданий: **${total}**\nПропущено: **${skipped}**\nАктивных участников: **${stats.filter(s => s.totalChallenges > 0).length}** из ${stats.length}\nСредний % выполнения: **${avgRate}%**`, role);
    }
    if (q.includes('тест') || q.includes('quiz')) {
      const results = ctx.quizResults;
      const avgScore = results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;
      const best = results.slice().sort((a, b) => b.score - a.score)[0];
      const bestQuiz = best ? ctx.quizzes.find(qz => qz.id === best.quizId)?.title : '';
      return withFollowup(`🧪 **Статистика тестирования:**\n\nВсего попыток: **${results.length}**\nСредний балл: **${avgScore}%**\nЛучший результат: ${best?.score ?? 0}% ("${bestQuiz || '—'}")`, role);
    }
    if (q.includes('достижени') || q.includes('подтвер') || q.includes('ожида')) {
      const pending = ctx.activities.filter((a) => a.status === 'pending');
      const lines = pending.slice(0, 5).map(a => {
        const u = ctx.allUsers.find(x => x.id === a.userId);
        return `• ${u?.firstname ?? ''} ${u?.lastname ?? ''}: "${a.title}" (+${a.requestedPoints} баллов)`;
      }).join('\n');
      return withFollowup(`⏳ **Ожидают подтверждения: ${pending.length}**\n\n${lines || 'Нет ожидающих'}\n\nПерейдите в раздел "Баллы" для обработки.`, role);
    }
    return withFollowup(`🤖 Работаю с данными программы ОКД: участники, рейтинги, тесты, активности.\n\nПопробуйте: "топ участников", "статистика тестов", "ожидают подтверждения".`, role);
  }

  // Ментор
  if (role === 'MENTOR') {
    if (q.includes('привет') || q.includes('hello') || q.includes('hi')) {
      return withFollowup(`👋 Привет! Я — помощник ментора.\n\nЧем могу помочь?\n• 👥 Прогресс подопечных\n• 📋 Задачи и назначения\n• 💡 Советы по наставничеству\n• 📅 Планирование встреч`, role);
    }
    if (q.includes('подопечн') || q.includes('прогресс') || q.includes('участник')) {
      const stats = ctx.juniorActivityStats;
      if (stats.length === 0) return withFollowup(`👥 Подопечные ещё не назначены. Обратитесь к HR для создания пар.`, role);
      const lines = stats.map(s => {
        const u = ctx.allUsers.find(x => x.id === s.userId);
        return `• ${u?.firstname ?? ''} ${u?.lastname ?? ''}: ${s.done} задач выполнено (${s.completionRate}%)`;
      }).join('\n');
      return withFollowup(`👥 **Прогресс подопечных:**\n\n${lines}`, role);
    }
    if (q.includes('задач') || q.includes('task')) {
      return withFollowup(`📋 **Работа с задачами:**\n\nВ разделе "Задачи" вы можете:\n• Просматривать назначенные задачи\n• Видеть прогресс участников\n\nДля создания задач обратитесь к HR-администратору.`, role);
    }
    if (q.includes('встреч') || q.includes('план') || q.includes('календар')) {
      return withFollowup(`📅 **Планирование встреч:**\n\n1. Перейдите в раздел "Календарь"\n2. Нажмите "+ Добавить событие"\n3. Выберите тип "Встреча"\n4. Укажите дату и описание\n\nРегулярные встречи — ключ к успеху подопечного 🤝`, role);
    }
    if (q.includes('совет') || q.includes('как помочь') || q.includes('наставник')) {
      return withFollowup(`💡 **Советы по наставничеству:**\n\n1. Проводите регулярные 1:1 встречи\n2. Давайте конкретную, actionable обратную связь\n3. Помогайте ставить измеримые цели\n4. Отмечайте даже небольшие достижения\n5. Спрашивайте, чем можете помочь — не угадывайте\n\nХороший ментор слушает больше, чем говорит 🎯`, role);
    }
    return withFollowup(`🤝 Я помогу вам в работе с подопечными.\n\nСпросите про прогресс участников, планирование встреч или советы по наставничеству.`, role);
  }

  // Участник
  if (q.includes('привет') || q.includes('hello') || q.includes('hi')) {
    return withFollowup(`🔴 *...сигнал из Изнанки...*\n\nПривет! Я — твой проводник в мире карьерного роста.\n\nЧем могу помочь сегодня?`, role);
  }
  if (q.includes('балл') || q.includes('очк') || q.includes('рейтинг') || q.includes('уровен')) {
    if (pts) {
      return withFollowup(`⚡ Твой уровень: **${pts.levelName}** (${pts.totalPoints} баллов)\n\nДо следующего уровня: **${pts.pointsToNextLevel} баллов**\nПозиция в рейтинге: **#${pts.rank}**\n\nПройди тест или выполни задание — и ты станешь ближе к цели 🌒`, role);
    }
    return withFollowup(`⚡ Твои баллы пока не определены. Начни с первого задания — и путь откроется!`, role);
  }
  if (q.includes('задани') || q.includes('task') || q.includes('что делать')) {
    return withFollowup(`🎯 Пути вперёд:\n\n• **Задания ментора** — раздел "Задачи"\n• **Тесты** — быстрый способ заработать баллы\n• **Достижения** — добавь своё в профиле\n\nВ этом мире побеждает тот, кто не боится тьмы.`, role);
  }
  if (q.includes('тест') || q.includes('quiz')) {
    return withFollowup(`🧪 Тесты — это твои порталы в мир новых баллов!\n\nЗайди в раздел "Тесты" и выбери подходящий. Каждый пройденный тест — шаг из тьмы к свету 🔦`, role);
  }
  if (q.includes('план') || q.includes('развити') || q.includes('карьер') || q.includes('growth')) {
    if (pts) {
      return withFollowup(`🗺️ **Твой план развития:**\n\nСейчас ты на уровне **${pts.levelName}** (${pts.totalPoints} баллов).\n\nШаги вперёд:\n1. **Выполни задания** — раздел "Задачи", ищи активные\n2. **Пройди тесты** — быстрый способ набрать баллы\n3. **Добавь достижения** — фиксируй реальные успехи\n4. **Общайся с ментором** — согласуй цели на квартал\n\nДо следующего уровня: **${pts.pointsToNextLevel} баллов** 🌒`, role);
    }
    return withFollowup(`🗺️ **План развития в программе ОКД:**\n\n1. **Задания** — выполняй активные задачи от ментора\n2. **Тесты** — проходи доступные квизы\n3. **Достижения** — добавляй в профиль реальные результаты\n4. **Активность** — чем больше делаешь, тем выше уровень\n\nСпроси "какой у меня уровень" — расскажу подробнее 🔴`, role);
  }
  if (q.includes('совет') || q.includes('рекоменд') || q.includes('как')) {
    return withFollowup(`🌒 Мой совет:\n\n1. Не пропускай задания\n2. Проходи тесты сразу после изучения темы\n3. Добавляй свои достижения\n4. Общайся с ментором\n\nЧем конкретнее вопрос — тем точнее ответ 🔴`, role);
  }
  if (q.includes('ментор') || q.includes('команд')) {
    return withFollowup(`👥 Твой ментор — проводник в будущее.\n\nПодготовься к встрече:\n• Зафикси прогресс по заданиям\n• Сформулируй 2-3 вопроса\n• Покажи конкретные результаты\n\nСила команды — в каждом её участнике 🤝`, role);
  }
  if (q.includes('помощ') || q.includes('что умеешь') || q.includes('help')) {
    return withFollowup(`🔴 **AI-агент**\n\nЯ помогу:\n• 📊 Узнать баллы и уровень\n• 🎯 Понять, что делать дальше\n• 🧪 Подобрать тест\n• 💡 Получить совет по карьере\n\nСпрашивай — я здесь 🌒`, role);
  }
  if (q.includes('достижени') || q.includes('медаль')) {
    return withFollowup(`🏆 Как добавить достижение:\n1. Перейди в раздел "Мои достижения"\n2. Нажми "+ Добавить"\n3. Опиши, что сделал\n4. Жди подтверждения HR\n\nДаже маленький шаг достоин признания 🌱`, role);
  }

  const fallbacks = [
    `🌒 Можешь уточнить вопрос? Лучше всего отвечаю на вопросы о баллах, заданиях, тестах и карьерных советах.`,
    `🔴 Переформулируй — отвечу точнее. Или спроси: "что мне делать дальше" или "какие у меня баллы".`,
    `⚡ Спроси про баллы, уровень, задания или тесты — и я помогу!`,
  ];
  return withFollowup(fallbacks[Math.floor(Math.random() * fallbacks.length)], role);
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

export const MENTOR_SUGGESTIONS = [
  '👥 Мои подопечные и их прогресс',
  '📅 Как запланировать встречу?',
  '💡 Советы по наставничеству',
];
