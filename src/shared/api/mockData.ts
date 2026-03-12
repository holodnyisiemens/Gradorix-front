import type {
  User,
  Challenge,
  MentorJunior,
  ChallengeJunior,
  Notification,
  CalendarEvent,
  Achievement,
  JuniorActivityStats,
} from '@shared/types';

// ============== USERS ==============
export const MOCK_ALL_USERS: User[] = [
  { id: 1, username: 'hr_anna',      email: 'anna@gradorix.ru',   role: 'HR',     firstname: 'Анна',    lastname: 'Соколова', is_active: true },
  { id: 2, username: 'mentor_alex',  email: 'alex@gradorix.ru',   role: 'MENTOR', firstname: 'Алексей', lastname: 'Воронов',  is_active: true },
  { id: 3, username: 'mentor_dasha', email: 'dasha@gradorix.ru',  role: 'MENTOR', firstname: 'Даша',    lastname: 'Крылова',  is_active: true },
  { id: 4, username: 'junior_kate',  email: 'kate@gradorix.ru',   role: 'JUNIOR', firstname: 'Катя',    lastname: 'Ефимова',  is_active: true },
  { id: 5, username: 'junior_ivan',  email: 'ivan@gradorix.ru',   role: 'JUNIOR', firstname: 'Иван',    lastname: 'Петров',   is_active: true },
  { id: 6, username: 'junior_mila',  email: 'mila@gradorix.ru',   role: 'JUNIOR', firstname: 'Мила',    lastname: 'Зайцева',  is_active: false },
  { id: 7, username: 'junior_sasha', email: 'sasha@gradorix.ru',  role: 'JUNIOR', firstname: 'Саша',    lastname: 'Морозов',  is_active: true },
];

// ============== CHALLENGES ==============
export const MOCK_CHALLENGES: Challenge[] = [
  { id: 1,  title: 'Основы Git Flow',              description: 'Изучи Git Flow: feature, develop, release, hotfix ветки. Практика на тестовом репозитории.', url: 'https://nvie.com/posts/a-successful-git-branching-model/', status: 'COMPLETED', date: '2026-03-01' },
  { id: 2,  title: 'Code Review: первый PR',        description: 'Создай и задокументируй pull request с описанием изменений. Получи review от ментора.', status: 'ACTIVE', date: '2026-03-10' },
  { id: 3,  title: 'REST API дизайн',               description: 'Спроектируй REST API для CRUD-приложения. Следуй принципам RESTful design.', url: 'https://restfulapi.net/', status: 'ACTIVE', date: '2026-03-14' },
  { id: 4,  title: 'Тестирование с Pytest',         description: 'Напиши unit и integration тесты. Покрытие кода > 80%.', status: 'UPCOMING', date: '2026-03-18' },
  { id: 5,  title: 'Docker & Docker Compose',       description: 'Контейнеризируй проект. Настрой docker-compose для local development с hot-reload.', status: 'UPCOMING', date: '2026-03-25' },
  { id: 6,  title: 'SQL оптимизация',               description: 'Проанализируй медленные запросы с EXPLAIN ANALYZE. Добавь индексы, оптимизируй N+1.', status: 'DRAFT', date: '2026-04-01' },
  { id: 7,  title: 'Стэндап-митинг #1',             description: 'Первый standup. Расскажи о прогрессе, планах и блокерах.', status: 'COMPLETED', date: '2026-03-05' },
  { id: 8,  title: 'Стэндап-митинг #2',             description: 'Еженедельный standup. Блокеры, достижения, планы.', status: 'ACTIVE', date: '2026-03-12' },
  { id: 9,  title: 'Введение в FastAPI',             description: 'Изучи основы FastAPI: роуты, зависимости, Pydantic модели. Создай TODO API.', url: 'https://fastapi.tiangolo.com/tutorial/', status: 'COMPLETED', date: '2026-02-20' },
  { id: 10, title: 'Async Python: asyncio',          description: 'Разберись с async/await, event loop, корутинами. Реализуй асинхронный HTTP клиент.', status: 'COMPLETED', date: '2026-02-25' },
  { id: 11, title: 'Паттерны проектирования',        description: 'Изучи и примени 5 GoF паттернов: Repository, Factory, Singleton, Observer, Strategy.', status: 'ACTIVE', date: '2026-03-16' },
  { id: 12, title: 'CI/CD с GitHub Actions',         description: 'Настрой pipeline: lint → test → build → deploy. Добавь badge статуса в README.', status: 'UPCOMING', date: '2026-04-05' },
  { id: 13, title: 'Работа с PostgreSQL',            description: 'Напиши сложные SQL: JOIN, CTE, оконные функции. Оптимизируй схему БД.', status: 'COMPLETED', date: '2026-02-15' },
  { id: 14, title: 'Код-ревью практика',             description: 'Проведи ревью кода коллеги. Оставь минимум 5 конструктивных комментариев.', status: 'COMPLETED', date: '2026-02-28' },
  { id: 15, title: 'Введение в Redis',               description: 'Изучи Redis: кеширование, pub/sub, TTL. Добавь Redis кеш в существующее API.', status: 'UPCOMING', date: '2026-04-08' },
];

// ============== MENTOR-JUNIOR ==============
export const MOCK_MENTOR_JUNIOR: MentorJunior[] = [
  { mentor_id: 2, junior_id: 4, assigned_by: 1 },
  { mentor_id: 2, junior_id: 5, assigned_by: 1 },
  { mentor_id: 3, junior_id: 6, assigned_by: 1 },
  { mentor_id: 3, junior_id: 7, assigned_by: 1 },
];

// ============== CHALLENGE-JUNIOR ==============
export const MOCK_CHALLENGE_JUNIOR: ChallengeJunior[] = [
  // Kate (id:4) — 11 tasks, 6 DONE
  { challenge_id: 13, junior_id: 4, assigned_by: 2, progress: 'DONE' },
  { challenge_id: 10, junior_id: 4, assigned_by: 2, progress: 'DONE' },
  { challenge_id: 9,  junior_id: 4, assigned_by: 2, progress: 'DONE' },
  { challenge_id: 14, junior_id: 4, assigned_by: 2, progress: 'DONE' },
  { challenge_id: 1,  junior_id: 4, assigned_by: 2, progress: 'DONE' },
  { challenge_id: 7,  junior_id: 4, assigned_by: 2, progress: 'DONE' },
  { challenge_id: 2,  junior_id: 4, assigned_by: 2, progress: 'IN_PROGRESS' },
  { challenge_id: 8,  junior_id: 4, assigned_by: 2, progress: 'IN_PROGRESS' },
  { challenge_id: 11, junior_id: 4, assigned_by: 2, progress: 'IN_PROGRESS' },
  { challenge_id: 3,  junior_id: 4, assigned_by: 2, progress: 'GOING' },
  { challenge_id: 4,  junior_id: 4, assigned_by: 2, progress: 'GOING' },

  // Ivan (id:5) — 8 tasks, 2 DONE
  { challenge_id: 9,  junior_id: 5, assigned_by: 2, progress: 'DONE' },
  { challenge_id: 13, junior_id: 5, assigned_by: 2, progress: 'DONE' },
  { challenge_id: 1,  junior_id: 5, assigned_by: 2, progress: 'IN_PROGRESS' },
  { challenge_id: 10, junior_id: 5, assigned_by: 2, progress: 'IN_PROGRESS' },
  { challenge_id: 2,  junior_id: 5, assigned_by: 2, progress: 'GOING' },
  { challenge_id: 3,  junior_id: 5, assigned_by: 2, progress: 'GOING' },
  { challenge_id: 7,  junior_id: 5, assigned_by: 2, progress: 'GOING' },
  { challenge_id: 4,  junior_id: 5, assigned_by: 2, progress: 'SKIPPED' },

  // Sasha (id:7) — 6 tasks, 1 DONE
  { challenge_id: 9,  junior_id: 7, assigned_by: 3, progress: 'DONE' },
  { challenge_id: 13, junior_id: 7, assigned_by: 3, progress: 'IN_PROGRESS' },
  { challenge_id: 1,  junior_id: 7, assigned_by: 3, progress: 'GOING' },
  { challenge_id: 7,  junior_id: 7, assigned_by: 3, progress: 'GOING' },
  { challenge_id: 10, junior_id: 7, assigned_by: 3, progress: 'GOING' },
  { challenge_id: 14, junior_id: 7, assigned_by: 3, progress: 'GOING' },
];

// ============== NOTIFICATIONS ==============
export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 1,  user_id: 4, message: '🎯 Новый челлендж: "Паттерны проектирования". Срок — 16 марта.', is_read: false, created_at: '2026-03-11T09:00:00Z' },
  { id: 2,  user_id: 4, message: '✅ Ментор Алексей одобрил твой PR. Отличная работа!', is_read: false, created_at: '2026-03-11T14:30:00Z' },
  { id: 3,  user_id: 4, message: '📅 Стэндап-митинг сегодня в 11:00. Подготовь обновления.', is_read: true, created_at: '2026-03-12T08:00:00Z' },
  { id: 4,  user_id: 4, message: '⚠️ До дедлайна "Code Review: первый PR" осталось 2 дня.', is_read: true, created_at: '2026-03-09T10:00:00Z' },
  { id: 5,  user_id: 4, message: '🏆 Получена ачивка "Git Гуру" — ты освоил Git Flow!', is_read: false, created_at: '2026-03-01T16:00:00Z' },
  { id: 6,  user_id: 4, message: '🎯 Новый челлендж: "REST API дизайн". Срок — 14 марта.', is_read: true, created_at: '2026-03-10T09:00:00Z' },
  { id: 7,  user_id: 4, message: '💬 Алексей оставил комментарий к твоему коду. Проверь PR.', is_read: true, created_at: '2026-03-08T11:00:00Z' },
  { id: 8,  user_id: 2, message: '👤 К тебе назначен новый джун: Иван Петров.', is_read: false, created_at: '2026-03-08T12:00:00Z' },
  { id: 9,  user_id: 2, message: '📊 Катя завершила "Работа с PostgreSQL". Посмотри результат!', is_read: false, created_at: '2026-03-07T16:00:00Z' },
  { id: 10, user_id: 2, message: '⚠️ Иван Петров пропустил задание "Тестирование с Pytest".', is_read: true, created_at: '2026-03-06T09:00:00Z' },
];

// ============== CALENDAR EVENTS ==============
export const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
  { id: 1,  title: 'Code Review: первый PR',   date: '2026-03-10', type: 'challenge', challengeId: 2,  description: 'Дедлайн по созданию PR' },
  { id: 2,  title: 'Стэндап-митинг',           date: '2026-03-12', type: 'meeting',   description: 'Еженедельный standup 11:00' },
  { id: 3,  title: 'REST API дизайн',           date: '2026-03-14', type: 'challenge', challengeId: 3,  description: 'Дедлайн по заданию' },
  { id: 4,  title: 'Паттерны проектирования',  date: '2026-03-16', type: 'challenge', challengeId: 11, description: 'Дедлайн по паттернам' },
  { id: 5,  title: 'Тестирование с Pytest',    date: '2026-03-18', type: 'challenge', challengeId: 4,  description: 'Старт нового задания' },
  { id: 6,  title: 'Встреча с ментором',       date: '2026-03-19', type: 'meeting',   description: 'Ревью прогресса за месяц, 15:00' },
  { id: 7,  title: 'Стэндап-митинг',           date: '2026-03-19', type: 'meeting',   description: 'Еженедельный standup 11:00' },
  { id: 8,  title: 'Docker & Docker Compose',  date: '2026-03-25', type: 'challenge', challengeId: 5,  description: 'Дедлайн по контейнеризации' },
  { id: 9,  title: 'Стэндап-митинг',           date: '2026-03-26', type: 'meeting',   description: 'Еженедельный standup 11:00' },
  { id: 10, title: 'Дедлайн: Sprint 2',        date: '2026-03-28', type: 'deadline',  description: 'Итоги второго спринта' },
  { id: 11, title: 'SQL оптимизация',          date: '2026-04-01', type: 'challenge', challengeId: 6,  description: 'Старт задания по БД' },
  { id: 12, title: 'Стэндап-митинг',           date: '2026-04-02', type: 'meeting',   description: 'Еженедельный standup 11:00' },
  { id: 13, title: 'CI/CD с GitHub Actions',   date: '2026-04-05', type: 'challenge', challengeId: 12, description: 'Старт задания по CI/CD' },
  { id: 14, title: 'Введение в Redis',         date: '2026-04-08', type: 'challenge', challengeId: 15, description: 'Дедлайн по кешированию' },
  { id: 15, title: 'Дедлайн: Sprint 3',        date: '2026-04-11', type: 'deadline',  description: 'Итоги третьего спринта' },
];

// ============== ACHIEVEMENTS ==============
export const MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: 1,  title: 'Первый шаг',    description: 'Выполнил первое задание в программе', icon: '🌱', earned: true,  earnedAt: '2026-02-20', category: 'milestone', xp: 50 },
  { id: 2,  title: 'Git Гуру',      description: 'Успешно освоил Git Flow',              icon: '🌿', earned: true,  earnedAt: '2026-03-01', category: 'challenge', xp: 100 },
  { id: 3,  title: 'База данных',   description: 'Освоил работу с PostgreSQL',           icon: '🗄️', earned: true,  earnedAt: '2026-02-15', category: 'challenge', xp: 120 },
  { id: 4,  title: 'Асинхронщик',   description: 'Разобрался с async/await в Python',    icon: '⚡', earned: true,  earnedAt: '2026-02-25', category: 'challenge', xp: 100 },
  { id: 5,  title: 'API Строитель', description: 'Создал первое FastAPI приложение',     icon: '🔧', earned: true,  earnedAt: '2026-02-20', category: 'challenge', xp: 150 },
  { id: 6,  title: 'Ревьювер',      description: 'Провёл первый code review',            icon: '🔍', earned: true,  earnedAt: '2026-02-28', category: 'social',    xp: 80 },
  { id: 7,  title: 'На связи',      description: 'Посетил 5 стендап-митингов подряд',    icon: '🤝', earned: true,  earnedAt: '2026-03-12', category: 'streak',    xp: 75 },
  { id: 8,  title: 'Тест-мастер',   description: 'Выполни задание по Pytest (покрытие > 80%)', icon: '🧪', earned: false, category: 'challenge', xp: 150 },
  { id: 9,  title: 'Контейнер',     description: 'Успешно задеплой проект с Docker',     icon: '🐳', earned: false, category: 'challenge', xp: 200 },
  { id: 10, title: 'Скоростной',    description: 'Выполни задание на 2 дня раньше срока', icon: '🚀', earned: false, category: 'special',   xp: 250 },
  { id: 11, title: 'Марафонец',     description: 'Выполни 10 заданий подряд без пропусков', icon: '🏅', earned: false, category: 'streak', xp: 300 },
  { id: 12, title: 'Архитектор',    description: 'Применил 5 паттернов проектирования',  icon: '🏗️', earned: false, category: 'challenge', xp: 200 },
];

// ============== HELPERS ==============

export function getUserById(id: number): User | undefined {
  return MOCK_ALL_USERS.find((u) => u.id === id);
}

export function getJuniorsForMentor(mentorId: number): User[] {
  const ids = MOCK_MENTOR_JUNIOR.filter((mj) => mj.mentor_id === mentorId).map((mj) => mj.junior_id);
  return MOCK_ALL_USERS.filter((u) => ids.includes(u.id));
}

export function getChallengesForJunior(juniorId: number): Array<Challenge & { progress: ChallengeJunior['progress'] }> {
  return MOCK_CHALLENGE_JUNIOR
    .filter((cj) => cj.junior_id === juniorId)
    .map((a) => {
      const c = MOCK_CHALLENGES.find((ch) => ch.id === a.challenge_id);
      if (!c) return null;
      return { ...c, progress: a.progress };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);
}

export function getNotificationsForUser(userId: number): Notification[] {
  return MOCK_NOTIFICATIONS.filter((n) => n.user_id === userId);
}

export function getCalendarEventsForJunior(_juniorId: number): CalendarEvent[] {
  return MOCK_CALENDAR_EVENTS;
}

export function getAchievementsForJunior(_juniorId: number): Achievement[] {
  return MOCK_ACHIEVEMENTS;
}

export function getJuniorActivityStats(): JuniorActivityStats[] {
  return MOCK_ALL_USERS
    .filter((u) => u.role === 'JUNIOR')
    .map((junior) => {
      const assignments = MOCK_CHALLENGE_JUNIOR.filter((cj) => cj.junior_id === junior.id);
      const done       = assignments.filter((a) => a.progress === 'DONE').length;
      const inProgress = assignments.filter((a) => a.progress === 'IN_PROGRESS').length;
      const going      = assignments.filter((a) => a.progress === 'GOING').length;
      const skipped    = assignments.filter((a) => a.progress === 'SKIPPED').length;
      const total      = assignments.length;
      return {
        userId: junior.id,
        totalChallenges: total,
        done, inProgress, going, skipped,
        completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
        lastActive: '2026-03-12',
      };
    });
}
