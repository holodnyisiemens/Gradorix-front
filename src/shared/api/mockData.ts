import type {
  User,
  Challenge,
  MentorJunior,
  ChallengeJunior,
  Notification,
  CalendarEvent,
  Achievement,
  JuniorActivityStats,
  Quiz, QuizResult, KBSection, KBArticle, Team, UserPoints, Activity,
  MeetingAttendance,
} from '@shared/types';

export type { MeetingAttendance };

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
  { id: 1,  title: 'Code Review: первый PR',   date: '2026-03-13', type: 'challenge', challengeId: 2,  description: 'Дедлайн по созданию PR' },
  { id: 2,  title: 'Стэндап-митинг',           date: '2026-03-13', type: 'meeting',   description: 'Еженедельный standup 11:00' },
  { id: 3,  title: 'REST API дизайн',          date: '2026-03-14', type: 'challenge', challengeId: 3,  description: 'Дедлайн по заданию' },
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

// ============== QUIZZES / TESTS ==============
export const MOCK_QUIZZES: Quiz[] = [
  {
    id: 1, title: 'Основы Git', category: 'Инструменты', durationMin: 10, points: 80, available: true,
    description: 'Проверь знания по Git: ветки, мерджи, ребейз, конфликты.',
    questions: [
      { id: 1, text: 'Какая команда создаёт новую ветку и сразу переключается на неё?', type: 'single', options: ['git branch new', 'git checkout -b new', 'git switch new', 'git new branch'], correctAnswers: [1] },
      { id: 2, text: 'Что делает git rebase?', type: 'single', options: ['Создаёт merge commit', 'Переносит коммиты на новое основание', 'Удаляет историю', 'Синхронизирует remote'], correctAnswers: [1] },
      { id: 3, text: 'Выбери команды для просмотра истории коммитов:', type: 'multiple', options: ['git log', 'git history', 'git log --oneline', 'git show-log'], correctAnswers: [0, 2] },
      { id: 4, text: 'Как называется зона перед коммитом?', type: 'single', options: ['Staging area', 'Buffer zone', 'Pre-commit', 'Draft'], correctAnswers: [0] },
      { id: 5, text: 'Что означает HEAD в Git?', type: 'text' },
    ],
  },
  {
    id: 2, title: 'Python: типы данных', category: 'Python', durationMin: 8, points: 60, available: true,
    description: 'Проверь понимание встроенных типов Python: list, dict, tuple, set.',
    questions: [
      { id: 1, text: 'Какой тип данных неизменяемый (immutable)?', type: 'single', options: ['list', 'dict', 'tuple', 'set'], correctAnswers: [2] },
      { id: 2, text: 'Что вернёт len({1, 2, 2, 3})?', type: 'single', options: ['4', '3', '2', 'Ошибку'], correctAnswers: [1] },
      { id: 3, text: 'Выбери мутабельные типы:', type: 'multiple', options: ['list', 'tuple', 'dict', 'frozenset'], correctAnswers: [0, 2] },
      { id: 4, text: 'Как получить ключи словаря?', type: 'single', options: ['dict.values()', 'dict.keys()', 'dict.items()', 'dict.get()'], correctAnswers: [1] },
    ],
  },
  {
    id: 3, title: 'REST API и HTTP', category: 'Backend', durationMin: 12, points: 100, available: true,
    description: 'Тест по принципам REST, HTTP методам, статус-кодам.',
    questions: [
      { id: 1, text: 'Какой HTTP метод используется для создания ресурса?', type: 'single', options: ['GET', 'POST', 'PUT', 'DELETE'], correctAnswers: [1] },
      { id: 2, text: 'Что означает статус-код 404?', type: 'single', options: ['Сервер недоступен', 'Не авторизован', 'Ресурс не найден', 'Запрос выполнен'], correctAnswers: [2] },
      { id: 3, text: 'Выбери идемпотентные HTTP методы:', type: 'multiple', options: ['GET', 'POST', 'PUT', 'DELETE'], correctAnswers: [0, 2, 3] },
      { id: 4, text: 'Что такое CRUD?', type: 'single', options: ['Create, Read, Update, Delete', 'Copy, Run, Upload, Download', 'Cache, Route, Use, Deploy', 'Connect, Request, URL, Data'], correctAnswers: [0] },
      { id: 5, text: 'Какой код возвращается при успешном создании ресурса?', type: 'single', options: ['200', '201', '204', '202'], correctAnswers: [1] },
    ],
  },
  {
    id: 4, title: 'SQL основы', category: 'Базы данных', durationMin: 10, points: 90, available: true,
    description: 'Базовые знания SQL: SELECT, JOIN, GROUP BY, агрегатные функции.',
    questions: [
      { id: 1, text: 'Какой JOIN вернёт только совпадающие строки из обеих таблиц?', type: 'single', options: ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN'], correctAnswers: [2] },
      { id: 2, text: 'Что делает GROUP BY?', type: 'single', options: ['Сортирует результат', 'Группирует строки по значению', 'Фильтрует дубликаты', 'Объединяет таблицы'], correctAnswers: [1] },
      { id: 3, text: 'Выбери агрегатные функции:', type: 'multiple', options: ['COUNT()', 'UPPER()', 'SUM()', 'AVG()'], correctAnswers: [0, 2, 3] },
      { id: 4, text: 'Что такое PRIMARY KEY?', type: 'text' },
    ],
  },
  {
    id: 5, title: 'Soft skills: коммуникация', category: 'Soft skills', durationMin: 6, points: 50, available: true,
    description: 'Тест на понимание принципов эффективной коммуникации в команде.',
    questions: [
      { id: 1, text: 'Что главное в конструктивной обратной связи?', type: 'single', options: ['Указать на все ошибки', 'Конкретность и уважение', 'Краткость любой ценой', 'Оценивать личность'], correctAnswers: [1] },
      { id: 2, text: 'Активное слушание включает:', type: 'multiple', options: ['Перефразирование', 'Перебивание', 'Уточняющие вопросы', 'Молчание'], correctAnswers: [0, 2] },
      { id: 3, text: 'Цель стендапа — это:', type: 'single', options: ['Отчёт руководству', 'Синхронизация команды и выявление блокеров', 'Детальный разбор задач', 'Планирование спринта'], correctAnswers: [1] },
    ],
  },
];

export const MOCK_QUIZ_RESULTS: QuizResult[] = [
  { userId: 4, quizId: 1, score: 90, completedAt: '2026-03-02', pointsEarned: 72 },
  { userId: 4, quizId: 2, score: 75, completedAt: '2026-03-05', pointsEarned: 45 },
  { userId: 4, quizId: 4, score: 100, completedAt: '2026-02-16', pointsEarned: 90 },
  { userId: 5, quizId: 1, score: 60, completedAt: '2026-03-03', pointsEarned: 48 },
  { userId: 5, quizId: 3, score: 80, completedAt: '2026-03-10', pointsEarned: 80 },
  { userId: 7, quizId: 2, score: 50, completedAt: '2026-03-08', pointsEarned: 30 },
];

// ============== USER POINTS / LEADERBOARD ==============
function calcUserPoints(): UserPoints[] {
  const LEVEL_NAMES = ['Новичок', 'Стажёр', 'Специалист', 'Эксперт', 'Мастер', 'Легенда'];
  const LEVEL_THRESHOLDS = [0, 200, 500, 900, 1400, 2000];

  const rawPoints: Record<number, number> = {
    4: 675, // Kate: tasks + quizzes
    5: 348, // Ivan
    6: 120, // Mila (inactive, low)
    7: 210, // Sasha
    2: 430, // Alex (mentor bonus)
    3: 310, // Dasha (mentor)
    1: 0,   // HR — не участвует
  };

  const sorted = Object.entries(rawPoints)
    .filter(([, pts]) => pts > 0)
    .sort(([, a], [, b]) => b - a);

  return sorted.map(([idStr, pts], i) => {
    const userId = Number(idStr);
    let level = 0;
    for (let l = LEVEL_THRESHOLDS.length - 1; l >= 0; l--) {
      if (pts >= LEVEL_THRESHOLDS[l]) { level = l; break; }
    }
    const nextThreshold = LEVEL_THRESHOLDS[level + 1] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    return {
      userId,
      totalPoints: pts,
      level,
      levelName: LEVEL_NAMES[level] ?? 'Легенда',
      pointsToNextLevel: Math.max(0, nextThreshold - pts),
      rank: i + 1,
    };
  });
}
export const MOCK_USER_POINTS: UserPoints[] = calcUserPoints();

// ============== KNOWLEDGE BASE ==============
export const MOCK_KB_SECTIONS: KBSection[] = [
  { id: 1, title: 'О программе',         icon: '🎯', description: 'Цели, структура и правила программы ОКД' },
  { id: 2, title: 'Учебные материалы',   icon: '📚', description: 'Статьи, видео и гайды по технологиям' },
  { id: 3, title: 'Регламенты',          icon: '📋', description: 'Процессы, стандарты и шаблоны команды' },
  { id: 4, title: 'FAQ',                 icon: '💡', description: 'Ответы на частые вопросы участников' },
];

export const MOCK_KB_ARTICLES: KBArticle[] = [
  { id: 1,  sectionId: 1, title: 'Добро пожаловать в программу ОКД!', createdAt: '2026-01-10', author: 'Анна Соколова',
    content: '## Добро пожаловать!\n\nПрограмма ОКД — это путь от перспективного сотрудника до будущего руководителя.\n\n### Что вас ждёт:\n- Персональный ментор из числа действующих руководителей\n- Задания и испытания для прокачки компетенций\n- Рейтинг и система достижений\n- Доступ к базе знаний\n\n### Продолжительность программы\n6 месяцев. За это время вы пройдёте путь от новичка до специалиста, готового к руководящей роли.' },
  { id: 2,  sectionId: 1, title: 'Как начисляются баллы', createdAt: '2026-01-10', author: 'Анна Соколова',
    content: '## Система баллов\n\nБаллы начисляются за активности в программе:\n\n| Активность | Баллы |\n|-----------|-------|\n| Выполнение задания | 50–200 |\n| Прохождение теста | 50–100 |\n| Добавление достижения | 30–150 |\n| Посещение мероприятия | 20–50 |\n\n### Уровни\n- Новичок: 0–199 баллов\n- Стажёр: 200–499\n- Специалист: 500–899\n- Эксперт: 900–1399\n- Мастер: 1400–1999\n- Легенда: 2000+' },
  { id: 3,  sectionId: 1, title: 'Роль ментора в программе', createdAt: '2026-01-15', author: 'Анна Соколова',
    content: '## Ментор — ваш проводник\n\nМентор — действующий руководитель, который сопровождает вас на протяжении всей программы.\n\n### Функции ментора:\n- Назначение и проверка заданий\n- Code review и обратная связь\n- Еженедельные встречи\n- Оценка прогресса\n\n### Как работать с ментором:\nПодготовьтесь к каждой встрече: зафиксируйте прогресс, сформулируйте вопросы и блокеры.' },
  { id: 4,  sectionId: 2, title: 'Git Flow: полное руководство', createdAt: '2026-01-20', author: 'Алексей Воронов',
    content: '## Git Flow\n\nGit Flow — популярная модель ветвления для командной разработки.\n\n### Основные ветки:\n- `main` — стабильный production код\n- `develop` — ветка разработки\n\n### Вспомогательные ветки:\n- `feature/*` — новые функции\n- `release/*` — подготовка релиза\n- `hotfix/*` — срочные исправления\n\n### Типичный workflow:\n1. Создай `feature/my-feature` от `develop`\n2. Разработай фичу, коммить\n3. Открой Pull Request в `develop`\n4. Пройди code review\n5. Merge!' },
  { id: 5,  sectionId: 2, title: 'FastAPI: от нуля до API', createdAt: '2026-02-01', author: 'Алексей Воронов',
    content: '## FastAPI Quick Start\n\nFastAPI — современный фреймворк для создания API на Python.\n\n```python\nfrom fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get("/items/{item_id}")\nasync def read_item(item_id: int):\n    return {"item_id": item_id}\n```\n\n### Ключевые возможности:\n- Автодокументация (Swagger UI)\n- Валидация через Pydantic\n- Async/await из коробки\n- Dependency Injection' },
  { id: 6,  sectionId: 2, title: 'Docker для разработчика', createdAt: '2026-02-10', author: 'Даша Крылова',
    content: '## Docker: основы\n\nDocker позволяет упаковать приложение со всеми зависимостями в контейнер.\n\n### Dockerfile пример:\n```dockerfile\nFROM python:3.11-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install -r requirements.txt\nCOPY . .\nCMD ["uvicorn", "main:app", "--host", "0.0.0.0"]\n```\n\n### Docker Compose:\n```yaml\nservices:\n  api:\n    build: .\n    ports: ["8000:8000"]\n  db:\n    image: postgres:15\n```' },
  { id: 7,  sectionId: 3, title: 'Шаблон стендап-отчёта', createdAt: '2026-01-12', author: 'Анна Соколова',
    content: '## Формат стендапа\n\nСтендап длится 5–10 минут. Каждый участник отвечает на 3 вопроса:\n\n1. **Что сделал вчера?**\n   Конкретные задачи, завершённые активности\n\n2. **Что планирую сегодня?**\n   Конкретные задачи на день\n\n3. **Есть ли блокеры?**\n   Что мешает двигаться вперёд\n\n### Пример:\n> Вчера: закончил задание по Git Flow, открыл PR #12\n> Сегодня: начну REST API дизайн\n> Блокеры: нет' },
  { id: 8,  sectionId: 3, title: 'Правила code review', createdAt: '2026-01-18', author: 'Алексей Воронов',
    content: '## Code Review Guidelines\n\n### Для автора PR:\n- Описывай изменения в теле PR\n- Добавляй скриншоты для UI изменений\n- Размер PR: до 400 строк\n\n### Для ревьювера:\n- Оставляй конкретные комментарии\n- Используй префиксы: `nit:`, `suggestion:`, `blocker:`\n- Отвечай в течение рабочего дня\n\n### Критерии одобрения:\n- Код работает и проходит тесты\n- Логика понятна без лишних комментариев\n- Нет security уязвимостей' },
  { id: 9,  sectionId: 4, title: 'Как добавить достижение?', createdAt: '2026-02-05', author: 'Анна Соколова',
    content: '## Добавление достижений\n\nДостижения — это внешние активности, которые вы хотите зафиксировать в программе.\n\n### Примеры достижений:\n- Выступление на конференции\n- Публикация статьи\n- Сертификат курса\n- Участие в хакатоне\n\n### Как добавить:\n1. Перейдите в раздел "Профиль" → "Достижения"\n2. Нажмите "Добавить достижение"\n3. Заполните название и описание\n4. Ожидайте подтверждения от HR (до 2 рабочих дней)' },
  { id: 10, sectionId: 4, title: 'Как работают тесты?', createdAt: '2026-02-05', author: 'Анна Соколова',
    content: '## Система тестирования\n\nТесты — способ проверить и подтвердить знания по пройденным темам.\n\n### Правила:\n- Каждый тест можно пройти один раз (в моках — неограниченно)\n- Результат фиксируется и влияет на рейтинг\n- Баллы начисляются пропорционально правильным ответам\n\n### Типы вопросов:\n- Одиночный выбор\n- Множественный выбор\n- Открытый ответ (проверяется ментором)\n\n### Совет:\nПроходите тесты сразу после изучения темы, пока знания свежие!' },
];

// ============== TEAMS ==============
export const MOCK_TEAMS: Team[] = [
  { id: 1, name: 'Backend Pioneers', project: 'Gradorix API', status: 'active', mentorId: 2,
    description: 'Команда занимается разработкой бэкенд-части платформы Gradorix: REST API, интеграции, база данных.',
    memberIds: [4, 5] },
  { id: 2, name: 'Growth Squad', project: 'ОКД Analytics', status: 'active', mentorId: 3,
    description: 'Команда фокусируется на аналитике и визуализации данных о прогрессе участников программы.',
    memberIds: [6, 7] },
];

// ============== ACTIVITIES (for HR points management) ==============
export const MOCK_ACTIVITIES: Activity[] = [
  { id: 1,  userId: 4, title: 'Выступление на внутреннем митапе',      type: 'achievement', requestedPoints: 100, status: 'approved', awardedPoints: 100, submittedAt: '2026-03-01', reviewedAt: '2026-03-02', description: 'Рассказал про Git Flow практики на внутреннем митапе команды (~15 человек)' },
  { id: 2,  userId: 4, title: 'Сертификат: Python Professional',        type: 'achievement', requestedPoints: 150, status: 'approved', awardedPoints: 150, submittedAt: '2026-02-20', reviewedAt: '2026-02-21', description: 'Получен сертификат платформы Stepik по курсу Python Professional' },
  { id: 3,  userId: 5, title: 'Участие в хакатоне Gradorix Hack',       type: 'achievement', requestedPoints: 200, status: 'pending', submittedAt: '2026-03-11', description: 'Участвовал в двухдневном хакатоне, команда заняла 2 место' },
  { id: 4,  userId: 7, title: 'Публикация статьи в корп. блоге',        type: 'achievement', requestedPoints: 80,  status: 'revision', submittedAt: '2026-03-09', reviewedAt: '2026-03-10', description: 'Написал статью о работе с PostgreSQL', reviewNote: 'Добавь ссылку на опубликованную статью' },
  { id: 5,  userId: 5, title: 'Помощь коллеге с дебагом',               type: 'custom',      requestedPoints: 30,  status: 'approved', awardedPoints: 30, submittedAt: '2026-03-06', reviewedAt: '2026-03-07', description: 'Помог Кате разобраться с проблемой в async коде, потратил ~2 часа' },
  { id: 6,  userId: 4, title: 'Завершил курс Docker on Demand',         type: 'achievement', requestedPoints: 120, status: 'pending', submittedAt: '2026-03-12', description: 'Прошёл 8-часовой курс Docker на платформе Udemy' },
  { id: 7,  userId: 7, title: 'Code review для джуна из другой команды', type: 'custom',      requestedPoints: 40,  status: 'rejected', submittedAt: '2026-03-04', reviewedAt: '2026-03-05', description: 'Провёл ревью 3 PR', reviewNote: 'Активность вне программы, баллы не начисляются' },
];

// ============== NEW HELPERS ==============

export function getUserPoints(userId: number): UserPoints | undefined {
  return MOCK_USER_POINTS.find((up) => up.userId === userId);
}

export function getQuizResultsForUser(userId: number): QuizResult[] {
  return MOCK_QUIZ_RESULTS.filter((r) => r.userId === userId);
}

export function getTeamForUser(userId: number): Team | undefined {
  return MOCK_TEAMS.find((t) => t.memberIds.includes(userId));
}

export function getActivitiesForUser(userId: number): Activity[] {
  return MOCK_ACTIVITIES.filter((a) => a.userId === userId);
}

export function getKBArticlesBySection(sectionId: number): KBArticle[] {
  return MOCK_KB_ARTICLES.filter((a) => a.sectionId === sectionId);
}

// ============== MEETING ATTENDANCE ==============
export const MOCK_ATTENDANCE: MeetingAttendance[] = [
  { id: 1, eventId: 2, userId: 4, attended: true, markedAt: '2026-03-13T11:30:00Z' },
  { id: 2, eventId: 7, userId: 4, attended: true, markedAt: '2026-03-19T11:30:00Z' },
  { id: 3, eventId: 2, userId: 5, attended: false },
  { id: 4, eventId: 6, userId: 4, attended: true, markedAt: '2026-03-19T15:10:00Z' },
];

export function getAttendanceForUser(userId: number): MeetingAttendance[] {
  return MOCK_ATTENDANCE.filter(a => a.userId === userId);
}

export function getMeetingEvents(): CalendarEvent[] {
  return MOCK_CALENDAR_EVENTS.filter(e => e.type === 'meeting');
}
