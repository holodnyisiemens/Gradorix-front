#!/usr/bin/env node
/**
 * Seed achievements to the Gradorix backend.
 * Usage: node scripts/seed-achievements.js <API_URL> <JWT_TOKEN>
 * Example: node scripts/seed-achievements.js http://localhost:8000 eyJ...
 */

const API_URL = process.argv[2] || process.env.VITE_API_URL || 'http://localhost:8000';
const TOKEN   = process.argv[3] || process.env.SEED_TOKEN || '';

if (!TOKEN) {
  console.error('❌  JWT token required. Pass as second argument or set SEED_TOKEN env var.');
  process.exit(1);
}

const achievements = [
  // ── Milestone ──────────────────────────────────────────────────────────────
  {
    title: 'Первые шаги',
    description: 'Выполнил свою первую задачу в программе',
    icon: '🎯',
    category: 'milestone',
    xp: 50,
  },
  {
    title: 'Пять из пяти',
    description: 'Закрыл 5 задач — входишь во вкус',
    icon: '🖐️',
    category: 'milestone',
    xp: 80,
  },
  {
    title: 'Мастер задач',
    description: 'Успешно закрыл 10 задач',
    icon: '🌟',
    category: 'milestone',
    xp: 150,
  },
  {
    title: 'Двадцатка',
    description: 'Закрыл 20 задач — ты уже ветеран',
    icon: '🔑',
    category: 'milestone',
    xp: 250,
  },
  {
    title: 'Половина пути',
    description: 'Набрал 500 баллов опыта',
    icon: '🏆',
    category: 'milestone',
    xp: 100,
  },
  {
    title: 'Тысячник',
    description: 'Набрал 1000 баллов — серьёзная заявка',
    icon: '💎',
    category: 'milestone',
    xp: 200,
  },
  {
    title: 'Полторы тысячи',
    description: 'Набрал 1500 баллов — уверенный рост',
    icon: '🥈',
    category: 'milestone',
    xp: 300,
  },
  {
    title: 'Легенда',
    description: 'Набрал 2000 баллов — ты стал легендой команды',
    icon: '👑',
    category: 'milestone',
    xp: 500,
  },
  {
    title: 'Элита',
    description: 'Набрал 3000 баллов — вершина карьерной лестницы',
    icon: '🏔️',
    category: 'milestone',
    xp: 750,
  },
  {
    title: 'Первый тест',
    description: 'Прошёл свой первый тест в системе',
    icon: '📋',
    category: 'milestone',
    xp: 40,
  },

  // ── Challenge ──────────────────────────────────────────────────────────────
  {
    title: 'Ракетный старт',
    description: 'Закрыл 3 задачи в течение первой недели',
    icon: '🚀',
    category: 'challenge',
    xp: 200,
  },
  {
    title: 'Скоростной',
    description: 'Выполнил задачу в тот же день, как она стала активной',
    icon: '⚡',
    category: 'challenge',
    xp: 75,
  },
  {
    title: 'В огне',
    description: 'Закрыл 3 задачи подряд без единого пропуска',
    icon: '🔥',
    category: 'challenge',
    xp: 100,
  },
  {
    title: 'Железная воля',
    description: 'Выполнил задачу с максимальным числом баллов',
    icon: '💪',
    category: 'challenge',
    xp: 150,
  },
  {
    title: 'Перфекционист',
    description: 'Получил полный балл за задачу — ни одного замечания от HR',
    icon: '🎮',
    category: 'challenge',
    xp: 125,
  },
  {
    title: 'Дедлайн-кингер',
    description: 'Сдал задачу в последний момент — в течение последнего часа до дедлайна',
    icon: '⏱️',
    category: 'challenge',
    xp: 50,
  },
  {
    title: 'Марафонец',
    description: 'Выполнил 5 задач подряд без пропусков',
    icon: '🏃',
    category: 'challenge',
    xp: 180,
  },
  {
    title: 'Снайпер',
    description: 'Три раза подряд набрал максимальный балл за задачи',
    icon: '🎯',
    category: 'challenge',
    xp: 220,
  },
  {
    title: 'Всё успел',
    description: 'Выполнил 3 задачи за одну рабочую неделю',
    icon: '📆',
    category: 'challenge',
    xp: 130,
  },
  {
    title: 'Трудяга',
    description: 'Выполнил задачу с наибольшей сложностью в месяце',
    icon: '⚙️',
    category: 'challenge',
    xp: 175,
  },

  // ── Streak ─────────────────────────────────────────────────────────────────
  {
    title: 'Ранняя пташка',
    description: 'Сдал задачу раньше дедлайна',
    icon: '⏰',
    category: 'streak',
    xp: 60,
  },
  {
    title: 'Три дня подряд',
    description: 'Активен в системе 3 дня подряд',
    icon: '📆',
    category: 'streak',
    xp: 40,
  },
  {
    title: 'Неделя без пауз',
    description: 'Активен в системе 7 дней подряд',
    icon: '📅',
    category: 'streak',
    xp: 80,
  },
  {
    title: 'Две недели',
    description: 'Активен 14 дней подряд — настоящая дисциплина',
    icon: '🗓️',
    category: 'streak',
    xp: 150,
  },
  {
    title: 'Месяц в строю',
    description: 'Активен 30 дней подряд — это уже привычка',
    icon: '📊',
    category: 'streak',
    xp: 250,
  },
  {
    title: 'Постоянство',
    description: 'Прошёл 5 тестов — знания проверены',
    icon: '🔁',
    category: 'streak',
    xp: 90,
  },
  {
    title: 'Знаток',
    description: 'Прошёл 10 тестов с результатом выше 70%',
    icon: '🧠',
    category: 'streak',
    xp: 160,
  },
  {
    title: 'Отличник',
    description: 'Прошёл 5 тестов с результатом выше 90%',
    icon: '📚',
    category: 'streak',
    xp: 200,
  },
  {
    title: 'Стабильный',
    description: 'Сдавал задачи каждую неделю в течение месяца',
    icon: '📈',
    category: 'streak',
    xp: 120,
  },
  {
    title: 'Непрерывный поток',
    description: 'Нет ни одной просроченной задачи за 2 месяца',
    icon: '🌊',
    category: 'streak',
    xp: 300,
  },

  // ── Social ─────────────────────────────────────────────────────────────────
  {
    title: 'Добро пожаловать',
    description: 'Впервые вошёл в систему и заполнил профиль',
    icon: '👋',
    category: 'social',
    xp: 30,
  },
  {
    title: 'Командный игрок',
    description: 'Активно участвовал в работе команды',
    icon: '🤝',
    category: 'social',
    xp: 100,
  },
  {
    title: 'Оратор',
    description: 'Выступил с докладом на внутреннем митапе',
    icon: '🎤',
    category: 'social',
    xp: 200,
  },
  {
    title: 'Автор',
    description: 'Опубликовал статью в корпоративном блоге',
    icon: '📝',
    category: 'social',
    xp: 150,
  },
  {
    title: 'Наставник',
    description: 'Помог коллеге разобраться с задачей',
    icon: '🧑‍🏫',
    category: 'social',
    xp: 120,
  },
  {
    title: 'Мотиватор',
    description: 'Вдохновил коллегу на выполнение задачи',
    icon: '💬',
    category: 'social',
    xp: 80,
  },
  {
    title: 'Опытный наставник',
    description: 'Провёл 3 или более менторских сессии',
    icon: '🎓',
    category: 'social',
    xp: 250,
  },
  {
    title: 'Активист',
    description: 'Участвовал в 5 командных мероприятиях',
    icon: '🙌',
    category: 'social',
    xp: 180,
  },
  {
    title: 'Лицо команды',
    description: 'Представлял команду на внешнем мероприятии',
    icon: '🌐',
    category: 'social',
    xp: 220,
  },
  {
    title: 'Связующее звено',
    description: 'Познакомил двух коллег из разных отделов',
    icon: '🔗',
    category: 'social',
    xp: 90,
  },

  // ── Special ────────────────────────────────────────────────────────────────
  {
    title: 'Пионер',
    description: 'Один из первых участников программы',
    icon: '🦄',
    category: 'special',
    xp: 300,
  },
  {
    title: 'Призёр хакатона',
    description: 'Занял призовое место на хакатоне',
    icon: '🏅',
    category: 'special',
    xp: 350,
  },
  {
    title: 'Победитель хакатона',
    description: 'Занял первое место на корпоративном хакатоне',
    icon: '🥇',
    category: 'special',
    xp: 600,
  },
  {
    title: 'Сертифицированный',
    description: 'Получил профессиональный сертификат и подтвердил навыки',
    icon: '📜',
    category: 'special',
    xp: 200,
  },
  {
    title: 'Дважды сертифицированный',
    description: 'Получил два и более профессиональных сертификата',
    icon: '🎓',
    category: 'special',
    xp: 350,
  },
  {
    title: 'Многогранный',
    description: 'Прошёл тесты в трёх разных категориях знаний',
    icon: '🌈',
    category: 'special',
    xp: 175,
  },
  {
    title: 'Всё и сразу',
    description: 'Выполнил все задачи за один календарный месяц',
    icon: '🔮',
    category: 'special',
    xp: 400,
  },
  {
    title: 'Суперзвезда',
    description: 'Вошёл в топ-1 рейтинга по итогам месяца',
    icon: '⭐',
    category: 'special',
    xp: 500,
  },
  {
    title: 'Три месяца в топе',
    description: 'Вошёл в топ-3 рейтинга три месяца подряд',
    icon: '🌠',
    category: 'special',
    xp: 700,
  },
  {
    title: 'Скрытый талант',
    description: 'Неожиданно занял первое место после нескольких недель в середине рейтинга',
    icon: '🎭',
    category: 'special',
    xp: 400,
  },
  {
    title: 'Год в команде',
    description: 'Провёл год в программе карьерного роста',
    icon: '🎂',
    category: 'special',
    xp: 800,
  },
  {
    title: 'Полугодие',
    description: 'Участвует в программе 6 месяцев',
    icon: '🗺️',
    category: 'special',
    xp: 350,
  },
  {
    title: 'Квартал',
    description: 'Активен в программе три месяца подряд',
    icon: '📍',
    category: 'special',
    xp: 180,
  },
];

async function seed() {
  console.log(`🚀  Seeding ${achievements.length} achievements to ${API_URL}...\n`);

  let ok = 0;
  let fail = 0;

  for (const ach of achievements) {
    try {
      const res = await fetch(`${API_URL}/achievements/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify(ach),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`  ❌  ${ach.icon} ${ach.title}: ${res.status} — ${err}`);
        fail++;
      } else {
        console.log(`  ✅  ${ach.icon} ${ach.title} (+${ach.xp} XP)`);
        ok++;
      }
    } catch (e) {
      console.error(`  ❌  ${ach.icon} ${ach.title}: ${e.message}`);
      fail++;
    }
  }

  console.log(`\n✔  Done: ${ok} created, ${fail} failed.`);
}

seed();
