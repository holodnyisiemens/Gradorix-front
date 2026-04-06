/**
 * Integration tests for Gradorix backend API
 *
 * Usage:
 *   TEST_API_URL=http://<backend-host>:8000 \
 *   TEST_EMAIL=admin@example.com \
 *   TEST_PASSWORD=secret \
 *   npx vitest run src/tests/api.test.ts
 *
 * Defaults: localhost:8000, credentials below
 */

import axios, { AxiosInstance } from 'axios';
import { describe, it, expect, beforeAll } from 'vitest';

// ─── Config ─────────────────────────────────────────────────────────────────
const BASE_URL = process.env.TEST_API_URL ?? 'http://localhost:8000';
const TEST_EMAIL = process.env.TEST_EMAIL ?? 'test@gradorix.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? 'password123';

// ─── HTTP client ─────────────────────────────────────────────────────────────
let http: AxiosInstance;
let token: string;

// IDs created during tests — used to chain dependent tests and cleanup
const ids: Record<string, number> = {};

function log(label: string, data: unknown) {
  console.log(`\n[${label}]`, JSON.stringify(data, null, 2));
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
describe('AUTH', () => {
  it('POST /auth/login — получить токен', async () => {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('access_token');
    expect(res.data).toHaveProperty('token_type');
    token = res.data.access_token;
    log('login', { token_type: res.data.token_type, token_preview: token.slice(0, 20) + '…' });
  });

  it('POST /auth/register — регистрация нового пользователя', async () => {
    const payload = {
      username: `test_user_${Date.now()}`,
      email: `test_${Date.now()}@gradorix.com`,
      password: 'Test1234!',
      role: 'JUNIOR',
      firstname: 'Test',
      lastname: 'User',
    };
    const res = await axios.post(`${BASE_URL}/auth/register`, payload);
    expect(res.status).toBeOneOf([200, 201]);
    // ⚠️ BACKEND BUG: возвращает {message} вместо {access_token, token_type}
    // Фронт ожидает токен после регистрации (authApi.register() -> LoginResponse)
    // Бэк должен возвращать: { access_token: string, token_type: string }
    log('register (actual response)', res.data);
  });
});

// ─── Shared authenticated client (created after login) ────────────────────────
beforeAll(async () => {
  // Login first to get token
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    token = res.data.access_token;
  } catch {
    console.error('⚠️  Could not login. Some tests will fail due to missing auth token.');
  }

  http = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${token}` },
    validateStatus: () => true, // don't throw on any status — we assert manually
  });
});

// ─── Users ────────────────────────────────────────────────────────────────────
describe('USERS', () => {
  it('GET /users/me — текущий пользователь', async () => {
    const res = await http.get('/users/me');
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('id');
    expect(res.data).toHaveProperty('email');
    expect(res.data).toHaveProperty('role');
    ids.currentUserId = res.data.id;
    log('GET /users/me', res.data);
  });

  it('GET /users/ — список пользователей', async () => {
    const res = await http.get('/users/');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    log('GET /users/', { count: res.data.length, sample: res.data[0] });
  });

  it('POST /users/ — создать пользователя', async () => {
    const payload = {
      username: `api_test_${Date.now()}`,
      email: `api_test_${Date.now()}@gradorix.com`,
      password: 'Test1234!',
      role: 'JUNIOR',
    };
    const res = await http.post('/users/', payload);
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.data).toHaveProperty('id');
    ids.userId = res.data.id;
    log('POST /users/', res.data);
  });

  it('GET /users/{id} — пользователь по ID', async () => {
    const res = await http.get(`/users/${ids.userId}`);
    expect(res.status).toBe(200);
    expect(res.data.id).toBe(ids.userId);
    log('GET /users/id', res.data);
  });

  it('PATCH /users/{id} — обновить пользователя', async () => {
    const res = await http.patch(`/users/${ids.userId}`, { firstname: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.data.firstname).toBe('Updated');
    log('PATCH /users/id', res.data);
  });

  it('DELETE /users/{id} — удалить пользователя', async () => {
    const res = await http.delete(`/users/${ids.userId}`);
    expect(res.status).toBeOneOf([200, 204]);
    log('DELETE /users/id', { status: res.status });
  });
});

// ─── Challenges ───────────────────────────────────────────────────────────────
describe('CHALLENGES', () => {
  it('GET /challenges/ — список челленджей', async () => {
    const res = await http.get('/challenges/');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    log('GET /challenges/', { count: res.data.length });
  });

  it('POST /challenges/ — создать челлендж', async () => {
    const res = await http.post('/challenges/', {
      title: 'Test Challenge',
      description: 'Created by API test',
      status: 'DRAFT',
    });
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.data).toHaveProperty('id');
    ids.challengeId = res.data.id;
    log('POST /challenges/', res.data);
  });

  it('GET /challenges/{id} — челлендж по ID', async () => {
    const res = await http.get(`/challenges/${ids.challengeId}`);
    expect(res.status).toBe(200);
    expect(res.data.id).toBe(ids.challengeId);
  });

  it('PATCH /challenges/{id} — обновить челлендж', async () => {
    const res = await http.patch(`/challenges/${ids.challengeId}`, { status: 'ACTIVE' });
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('ACTIVE');
  });
});

// ─── Calendar Events ───────────────────────────────────────────────────────────
describe('CALENDAR EVENTS', () => {
  it('GET /calendar-events/ — список событий', async () => {
    const res = await http.get('/calendar-events/');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    log('GET /calendar-events/', { count: res.data.length });
  });

  it('POST /calendar-events/ — создать событие', async () => {
    const res = await http.post('/calendar-events/', {
      title: 'Test Meeting',
      date: new Date().toISOString().split('T')[0],
      event_type: 'meeting',
      description: 'API test event',
    });
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.data).toHaveProperty('id');
    ids.calendarEventId = res.data.id;
    log('POST /calendar-events/', res.data);
  });

  it('GET /calendar-events/{id} — событие по ID', async () => {
    const res = await http.get(`/calendar-events/${ids.calendarEventId}`);
    expect(res.status).toBe(200);
  });

  it('PATCH /calendar-events/{id} — обновить событие', async () => {
    const res = await http.patch(`/calendar-events/${ids.calendarEventId}`, { title: 'Updated Meeting' });
    expect(res.status).toBe(200);
  });

  it('DELETE /calendar-events/{id} — удалить событие', async () => {
    const res = await http.delete(`/calendar-events/${ids.calendarEventId}`);
    expect(res.status).toBeOneOf([200, 204]);
  });
});

// ─── Notifications ────────────────────────────────────────────────────────────
describe('NOTIFICATIONS', () => {
  it('GET /notifications/ — список уведомлений', async () => {
    const res = await http.get('/notifications/');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    log('GET /notifications/', { count: res.data.length });
  });

  it('POST /notifications/ — создать уведомление', async () => {
    const res = await http.post('/notifications/', {
      user_id: ids.currentUserId,
      message: 'Test notification from API tests',
      is_read: false,
    });
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.data).toHaveProperty('id');
    ids.notificationId = res.data.id;
    log('POST /notifications/', res.data);
  });

  it('GET /notifications/{id} — уведомление по ID', async () => {
    const res = await http.get(`/notifications/${ids.notificationId}`);
    expect(res.status).toBe(200);
  });

  it('PATCH /notifications/{id} — отметить прочитанным', async () => {
    const res = await http.patch(`/notifications/${ids.notificationId}`, { is_read: true });
    expect(res.status).toBe(200);
    expect(res.data.is_read).toBe(true);
  });

  it('DELETE /notifications/{id} — удалить уведомление', async () => {
    const res = await http.delete(`/notifications/${ids.notificationId}`);
    expect(res.status).toBeOneOf([200, 204]);
  });
});

// ─── Teams ────────────────────────────────────────────────────────────────────
describe('TEAMS', () => {
  it('GET /teams/ — список команд', async () => {
    const res = await http.get('/teams/');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    log('GET /teams/', { count: res.data.length });
  });

  it('POST /teams/ — создать команду', async () => {
    const res = await http.post('/teams/', {
      name: 'Test Team',
      project: 'Test Project',
      status: 'active',
      description: 'Created by API tests',
      member_ids: [],
    });
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.data).toHaveProperty('id');
    ids.teamId = res.data.id;
    log('POST /teams/', res.data);
  });

  it('GET /teams/{id} — команда по ID', async () => {
    const res = await http.get(`/teams/${ids.teamId}`);
    expect(res.status).toBe(200);
  });

  it('PATCH /teams/{id} — обновить команду', async () => {
    const res = await http.patch(`/teams/${ids.teamId}`, { status: 'on_hold' });
    expect(res.status).toBe(200);
  });

  it('DELETE /teams/{id} — удалить команду', async () => {
    const res = await http.delete(`/teams/${ids.teamId}`);
    expect(res.status).toBeOneOf([200, 204]);
  });
});

// ─── Activities ───────────────────────────────────────────────────────────────
describe('ACTIVITIES', () => {
  it('GET /activities/ — список активностей', async () => {
    const res = await http.get('/activities/');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    log('GET /activities/', { count: res.data.length });
  });

  it('POST /activities/ — создать активность', async () => {
    const res = await http.post('/activities/', {
      user_id: ids.currentUserId,
      title: 'Test Activity',
      description: 'Created by API tests',
      requested_points: 10,
      activity_type: 'custom',
    });
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.data).toHaveProperty('id');
    ids.activityId = res.data.id;
    log('POST /activities/', res.data);
  });

  it('GET /activities/{id} — активность по ID', async () => {
    const res = await http.get(`/activities/${ids.activityId}`);
    expect(res.status).toBe(200);
  });

  it('PATCH /activities/{id} — обновить статус активности', async () => {
    const res = await http.patch(`/activities/${ids.activityId}`, {
      status: 'approved',
      awarded_points: 10,
    });
    expect(res.status).toBe(200);
    log('PATCH /activities/id', res.data);
  });

  it('DELETE /activities/{id} — удалить активность', async () => {
    const res = await http.delete(`/activities/${ids.activityId}`);
    expect(res.status).toBeOneOf([200, 204]);
  });
});

// ─── Achievements ─────────────────────────────────────────────────────────────
describe('ACHIEVEMENTS', () => {
  it('GET /achievements/ — список достижений', async () => {
    const res = await http.get('/achievements/');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    log('GET /achievements/', { count: res.data.length });
  });

  it('POST /achievements/ — создать достижение', async () => {
    const res = await http.post('/achievements/', {
      title: 'Test Achievement',
      description: 'Created by API tests',
      icon: '🏆',
      category: 'milestone',
      xp: 100,
    });
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.data).toHaveProperty('id');
    ids.achievementId = res.data.id;
    log('POST /achievements/', res.data);
  });

  it('GET /achievements/{id} — достижение по ID', async () => {
    const res = await http.get(`/achievements/${ids.achievementId}`);
    expect(res.status).toBe(200);
  });

  it('PATCH /achievements/{id} — обновить достижение', async () => {
    const res = await http.patch(`/achievements/${ids.achievementId}`, { xp: 200 });
    expect(res.status).toBe(200);
  });
});

// ─── User Achievements ────────────────────────────────────────────────────────
describe('USER ACHIEVEMENTS', () => {
  it('GET /user-achievements/ — список пользователь-достижение', async () => {
    const res = await http.get('/user-achievements/');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  it('POST /user-achievements/ — выдать достижение', async () => {
    const res = await http.post('/user-achievements/', {
      user_id: ids.currentUserId,
      achievement_id: ids.achievementId,
      earned_at: new Date().toISOString().split('T')[0], // backend expects date-only: YYYY-MM-DD
    });
    expect(res.status).toBeOneOf([200, 201]);
    log('POST /user-achievements/', res.data);
  });

  it('GET /user-achievements/{userId}/{achievementId} — конкретная запись', async () => {
    const res = await http.get(`/user-achievements/${ids.currentUserId}/${ids.achievementId}`);
    expect(res.status).toBe(200);
  });

  it('DELETE /user-achievements/{userId}/{achievementId} — отозвать достижение', async () => {
    const res = await http.delete(`/user-achievements/${ids.currentUserId}/${ids.achievementId}`);
    expect(res.status).toBeOneOf([200, 204]);
  });

  // cleanup achievement
  it('DELETE /achievements/{id} — удалить достижение', async () => {
    const res = await http.delete(`/achievements/${ids.achievementId}`);
    expect(res.status).toBeOneOf([200, 204]);
  });
});

// ─── User Points ──────────────────────────────────────────────────────────────
describe('USER POINTS', () => {
  it('GET /user-points/leaderboard — лидерборд', async () => {
    const res = await http.get('/user-points/leaderboard');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    log('GET /user-points/leaderboard', { count: res.data.length, top: res.data[0] });
  });

  it('GET /user-points/{userId} — очки пользователя', async () => {
    const res = await http.get(`/user-points/${ids.currentUserId}`);
    expect(res.status).toBeOneOf([200, 404]); // может не быть записи
    log('GET /user-points/userId', res.data);
  });

  it('POST /user-points/ — создать запись очков', async () => {
    const res = await http.post('/user-points/', {
      user_id: ids.currentUserId,
      total_points: 0,
      level: 1,
      level_name: 'Beginner',
      points_to_next_level: 100,
    });
    expect(res.status).toBeOneOf([200, 201, 409]); // 409 если уже существует
    log('POST /user-points/', res.data);
  });

  it('PATCH /user-points/{userId} — обновить очки', async () => {
    const res = await http.patch(`/user-points/${ids.currentUserId}`, { total_points: 50 });
    expect(res.status).toBeOneOf([200, 404]);
    log('PATCH /user-points/userId', res.data);
  });
});

// ─── Quizzes ──────────────────────────────────────────────────────────────────
describe('QUIZZES', () => {
  it('GET /quizzes/ — список квизов', async () => {
    const res = await http.get('/quizzes/');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    log('GET /quizzes/', { count: res.data.length });
  });

  it('POST /quizzes/ — создать квиз', async () => {
    const res = await http.post('/quizzes/', {
      title: 'Test Quiz',
      description: 'API test quiz',
      category: 'general',
      duration_min: 10,
      questions: [],
      points: 50,
      available: true,
    });
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.data).toHaveProperty('id');
    ids.quizId = res.data.id;
    log('POST /quizzes/', res.data);
  });

  it('GET /quizzes/{id} — квиз по ID', async () => {
    const res = await http.get(`/quizzes/${ids.quizId}`);
    expect(res.status).toBe(200);
  });

  it('PATCH /quizzes/{id} — обновить квиз', async () => {
    const res = await http.patch(`/quizzes/${ids.quizId}`, { available: false });
    expect(res.status).toBe(200);
  });
});

// ─── Quiz Results ─────────────────────────────────────────────────────────────
describe('QUIZ RESULTS', () => {
  it('GET /quiz-results/ — список результатов', async () => {
    const res = await http.get('/quiz-results/');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    log('GET /quiz-results/', { count: res.data.length });
  });

  it('POST /quiz-results/ — создать результат квиза', async () => {
    const res = await http.post('/quiz-results/', {
      user_id: ids.currentUserId,
      quiz_id: ids.quizId,
      score: 85,
      completed_at: new Date().toISOString().split('T')[0], // backend expects date-only: YYYY-MM-DD
      points_earned: 42,
    });
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.data).toHaveProperty('id');
    ids.quizResultId = res.data.id;
    log('POST /quiz-results/', res.data);
  });

  it('GET /quiz-results/{id} — результат по ID', async () => {
    const res = await http.get(`/quiz-results/${ids.quizResultId}`);
    expect(res.status).toBeOneOf([200, 404]);
  });

  it('DELETE /quiz-results/{id} — удалить результат', async () => {
    const res = await http.delete(`/quiz-results/${ids.quizResultId}`);
    expect(res.status).toBeOneOf([200, 204]);
  });

  it('DELETE /quizzes/{id} — удалить квиз', async () => {
    const res = await http.delete(`/quizzes/${ids.quizId}`);
    expect(res.status).toBeOneOf([200, 204]);
  });
});

// ─── Knowledge Base ───────────────────────────────────────────────────────────
describe('KNOWLEDGE BASE', () => {
  it('GET /kb-sections/ — список разделов', async () => {
    const res = await http.get('/kb-sections/');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    log('GET /kb-sections/', { count: res.data.length });
  });

  it('POST /kb-sections/ — создать раздел', async () => {
    const res = await http.post('/kb-sections/', { title: 'Test Section', order: 99 });
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.data).toHaveProperty('id');
    ids.kbSectionId = res.data.id;
    log('POST /kb-sections/', res.data);
  });

  it('GET /kb-sections/{id} — раздел по ID', async () => {
    const res = await http.get(`/kb-sections/${ids.kbSectionId}`);
    expect(res.status).toBe(200);
  });

  it('PATCH /kb-sections/{id} — обновить раздел', async () => {
    const res = await http.patch(`/kb-sections/${ids.kbSectionId}`, { title: 'Updated Section' });
    expect(res.status).toBe(200);
  });

  it('GET /kb-articles/ — список статей', async () => {
    const res = await http.get('/kb-articles/');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    log('GET /kb-articles/', { count: res.data.length });
  });

  it('POST /kb-articles/ — создать статью', async () => {
    const res = await http.post('/kb-articles/', {
      section_id: ids.kbSectionId,
      title: 'Test Article',
      content: 'Content created by API tests',
      created_at: new Date().toISOString().split('T')[0], // required by backend (date-only)
      author: 'test-runner',
    });
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.data).toHaveProperty('id');
    ids.kbArticleId = res.data.id;
    log('POST /kb-articles/', res.data);
  });

  it('GET /kb-articles/{id} — статья по ID', async () => {
    const res = await http.get(`/kb-articles/${ids.kbArticleId}`);
    expect(res.status).toBe(200);
  });

  it('PATCH /kb-articles/{id} — обновить статью', async () => {
    const res = await http.patch(`/kb-articles/${ids.kbArticleId}`, { title: 'Updated Article' });
    expect(res.status).toBe(200);
  });

  it('DELETE /kb-articles/{id} — удалить статью', async () => {
    const res = await http.delete(`/kb-articles/${ids.kbArticleId}`);
    expect(res.status).toBeOneOf([200, 204]);
  });

  it('DELETE /kb-sections/{id} — удалить раздел', async () => {
    const res = await http.delete(`/kb-sections/${ids.kbSectionId}`);
    expect(res.status).toBeOneOf([200, 204]);
  });
});

// ─── Challenge-Junior Assignments ─────────────────────────────────────────────
describe('CHALLENGE-JUNIOR', () => {
  it('GET /challenge-junior/ — список назначений', async () => {
    const res = await http.get('/challenge-junior/');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    log('GET /challenge-junior/', { count: res.data.length });
  });

  it('POST /challenge-junior/ — назначить челлендж джуниору', async () => {
    const res = await http.post('/challenge-junior/', {
      challenge_id: ids.challengeId,
      junior_id: ids.currentUserId,
      assigned_by: ids.currentUserId,
      progress: 'GOING',
    });
    expect(res.status).toBeOneOf([200, 201]);
    log('POST /challenge-junior/', res.data);
  });

  it('GET /challenge-junior/{challengeId}/{juniorId}', async () => {
    const res = await http.get(`/challenge-junior/${ids.challengeId}/${ids.currentUserId}`);
    expect(res.status).toBeOneOf([200, 404]);
  });

  it('PATCH /challenge-junior/{challengeId}/{juniorId} — обновить прогресс', async () => {
    const res = await http.patch(`/challenge-junior/${ids.challengeId}/${ids.currentUserId}`, {
      progress: 'IN_PROGRESS',
    });
    expect(res.status).toBeOneOf([200, 404]);
  });

  it('DELETE /challenge-junior/{challengeId}/{juniorId}', async () => {
    const res = await http.delete(`/challenge-junior/${ids.challengeId}/${ids.currentUserId}`);
    expect(res.status).toBeOneOf([200, 204, 404]);
  });

  // Cleanup challenge
  it('DELETE /challenges/{id} — удалить челлендж', async () => {
    const res = await http.delete(`/challenges/${ids.challengeId}`);
    expect(res.status).toBeOneOf([200, 204]);
  });
});

// ─── Mentor-Junior ────────────────────────────────────────────────────────────
describe('MENTOR-JUNIOR', () => {
  it('GET /mentor-junior/ — список пар ментор-джуниор', async () => {
    const res = await http.get('/mentor-junior/');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    log('GET /mentor-junior/', { count: res.data.length });
  });
});

// ─── Meeting Attendance ───────────────────────────────────────────────────────
describe('MEETING ATTENDANCE', () => {
  it('GET /meeting-attendance/ — список посещаемости', async () => {
    const res = await http.get('/meeting-attendance/');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    log('GET /meeting-attendance/', { count: res.data.length });
  });
});
