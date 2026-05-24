import { useState } from 'react';
import { ChevronDown, ChevronUp, Pencil, Trash2, Calendar, CheckCircle, Link2, ClipboardCheck, BarChart3 } from 'lucide-react';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Button } from '@shared/components/ui/Button/Button';
import { Input } from '@shared/components/ui/Input/Input';
import { DateInput } from '@shared/components/ui/Input/DateInput';
import { Modal } from '@shared/components/ui/Modal/Modal';
import {
  useActivities, useAchievements, useUsers, useLeaderboard,
  useUpdateActivity, useCreateActivity, useDeleteAchievement, useCreateUser,
  useCalendarEvents, useCreateCalendarEvent,
  useAwardAchievement, useAllUserAchievements, useRevokeAchievement,
  useChallenges, useChallengeJuniors, useCreateChallenge, useAssignChallenge,
  useMeetingAttendance, useMarkAttendance, useUpdateAttendance, useDeleteAttendance,
  useQuizzes,
  useQuizResults,
  useSurveys,
  useSurveyResults,
  useTeams, useCreateTeam, useUpdateTeam, useDeleteTeam,
} from '@shared/hooks/useApi';
import { achievementsApi } from '@shared/api/services/achievements';
import { ChallengeCard } from '@modules/challenges/components/ChallengeCard';
import { useQueryClient } from '@tanstack/react-query';
import { analytics } from '@shared/lib/analytics';
import type { Activity, ActivityStatus, UserRole, ChallengeStatus, TeamStatus, MeetingAttendance } from '@shared/types';

const STATUS_LABEL: Record<ActivityStatus, string> = {
  pending: 'На проверке',
  approved: 'Одобрено',
  revision: 'На доработку',
  rejected: 'Отклонено',
};

const CHALLENGE_FILTERS: { key: 'all' | ChallengeStatus; label: string }[] = [
  { key: 'all',       label: 'Все' },
  { key: 'ACTIVE',    label: 'Активные' },
  { key: 'COMPLETED', label: 'Завершены' },
  { key: 'DRAFT',     label: 'Черновики' },
];

const EMPTY_CHALLENGE = {
  title: '', description: '', status: 'DRAFT' as ChallengeStatus,
  date: '', url: '', maxPoints: '', assignAll: false, personal: false,
};

const TEAM_STATUS_LABEL: Record<TeamStatus, string> = {
  active: 'Активна',
  on_hold: 'На паузе',
  completed: 'Завершена',
};

import styles from './AdminPage.module.css';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

type Tab = 'achievements' | 'activities' | 'users' | 'events' | 'tests' | 'surveys' | 'personal' | 'challenges' | 'teams';

export function AdminPage() {
  const user = useAuthStore((s) => s.user)!;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [tab, setTab] = useState<Tab>('challenges');
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  // Challenges tab
  const [challengeFilter, setChallengeFilter] = useState<'all' | ChallengeStatus>('all');
  const [challengeSearch, setChallengeSearch] = useState('');
  const [newChallengeModal, setNewChallengeModal] = useState(false);
  const [newChallenge, setNewChallenge] = useState(EMPTY_CHALLENGE);
  const [createChallengeError, setCreateChallengeError] = useState('');
  const [newAchModal, setNewAchModal] = useState(false);
  const [newAch, setNewAch] = useState({ title: '', description: '', icon: '🏆', xp: 100, category: 'challenge' as const });
  const [achExpanded, setAchExpanded] = useState<number | null>(null);
  const [editAchModal, setEditAchModal] = useState<number | null>(null);
  const [achEditData, setAchEditData] = useState<{ title: string; description: string; icon: string; xp: string }>({ title: '', description: '', icon: '', xp: '' });
  const [newUserModal, setNewUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'EMPLOYEE' as UserRole });
  const [newUserError, setNewUserError] = useState('');
  const [newActivityModal, setNewActivityModal] = useState(false);
  const [newActivity, setNewActivity] = useState({ title: '', description: '', requested_points: '100', userId: 0 });
  const [attendanceExpanded, setAttendanceExpanded] = useState<number | null>(null);
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceEditor, setAttendanceEditor] = useState<{
    eventId: number;
    userId: number;
    record: MeetingAttendance | null;
    attended: boolean;
  } | null>(null);
  const [attendanceEditorPoints, setAttendanceEditorPoints] = useState('');
  const [attendanceEditorError, setAttendanceEditorError] = useState('');
  const [createTeamModal, setCreateTeamModal] = useState(false);
  const [editTeamId, setEditTeamId] = useState<number | null>(null);

  function getAttendanceRecord(eventId: number, userId: number) {
    return attendance.find(r => r.eventId === eventId && r.userId === userId) ?? null;
  }

  function openAttendanceEditor(eventId: number, userId: number) {
    const record = getAttendanceRecord(eventId, userId);
    setAttendanceEditor({ eventId, userId, record, attended: record?.attended ?? false });
    setAttendanceEditorPoints(record?.awardedPoints != null ? String(record.awardedPoints) : '');
    setAttendanceEditorError('');
  }

  function closeAttendanceEditor() {
    setAttendanceEditor(null);
    setAttendanceEditorPoints('');
    setAttendanceEditorError('');
  }

  function handleSaveAttendance(attended: boolean) {
    if (!attendanceEditor) return;
    const points = attendanceEditorPoints.trim();
    const pointsValue = points === '' ? undefined : Number(points);
    if (pointsValue !== undefined && (Number.isNaN(pointsValue) || pointsValue < 0)) {
      setAttendanceEditorError('Введите корректное число баллов');
      return;
    }

    const payload: { attended: boolean; marked_by: number; awarded_points?: number } = {
      attended,
      marked_by: user.id,
    };
    if (attended && pointsValue !== undefined) {
      payload.awarded_points = pointsValue;
    }

    if (attendanceEditor.record) {
      updateAttendance.mutate({ id: attendanceEditor.record.id, data: payload });
    } else {
      markAttendance.mutate({
        event_id: attendanceEditor.eventId,
        user_id: attendanceEditor.userId,
        ...payload,
      });
    }

    closeAttendanceEditor();
  }
  const [teamForm, setTeamForm] = useState({
    name: '',
    project: '',
    description: '',
    status: 'active' as TeamStatus,
    mentor_id: '' as string | number,
    member_ids: [] as number[],
  });

  const { data: activities = [] } = useActivities();
  const { data: achievements = [] } = useAchievements();
  const { data: allUsers = [] } = useUsers();
  const { data: leaderboard = [] } = useLeaderboard();
  const { data: events = [] } = useCalendarEvents();
  const { data: challenges = [] } = useChallenges();
  const { data: allAssignments = [] } = useChallengeJuniors();
  const updateActivity = useUpdateActivity();
  const createActivity = useCreateActivity();
  const deleteAchievement = useDeleteAchievement();
  const createUser = useCreateUser();
  const createEvent = useCreateCalendarEvent();
  const awardAchievement = useAwardAchievement();
  const revokeAchievement = useRevokeAchievement();
  const { data: allUserAchievements = [] } = useAllUserAchievements();
  const { data: quizzes = [] } = useQuizzes();
  const { data: allResults = [] } = useQuizResults();
  const { data: surveys = [] } = useSurveys();
  const { data: allSurveyResults = [] } = useSurveyResults();
  const { data: teams = [] } = useTeams();
  const createChallengeMut = useCreateChallenge();
  const assignChallengeMut = useAssignChallenge();
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();
  const { data: attendance = [] } = useMeetingAttendance();
  const markAttendance = useMarkAttendance();
  const updateAttendance = useUpdateAttendance();
  const deleteAttendance = useDeleteAttendance();

  const [editing, setEditing] = useState<Record<number, { points: number; note: string }>>({});
  const [filter, setFilter] = useState<'all' | ActivityStatus>('pending');

  const personal = activities.filter(a => a.type === 'achievement');
  const filtered = filter === 'all' ? personal : personal.filter(a => a.status === filter);
  const pendingCount = personal.filter(a => a.status === 'pending').length;

  function getEdit(id: number, defaultPts: number, defaultNote: string) {
    return editing[id] ?? { points: defaultPts, note: defaultNote };
  }

  async function approve(id: number) {
    const ed = editing[id];
    await updateActivity.mutateAsync({
      id,
      data: { status: 'approved', awarded_points: ed?.points ?? 0, review_note: ed?.note || undefined },
    });
    analytics.track('личное_достижение_одобрено', { activity_id: id, points: ed?.points ?? 0 });
  }


  async function reject(id: number) {
    const ed = editing[id];
    await updateActivity.mutateAsync({
      id,
      data: { status: 'rejected', review_note: ed?.note || 'Не соответствует критериям' },
    });
    analytics.track('личное_достижение_отклонено', { activity_id: id });
  }

  async function revision(id: number) {
    const ed = editing[id];
    await updateActivity.mutateAsync({
      id,
      data: { status: 'revision', review_note: ed?.note || 'Требуется доработка' },
    });
    analytics.track('личное_достижение_на_доработку', { activity_id: id });
  }

  const FILTER_BTNS: { key: 'all' | ActivityStatus; label: string }[] = [
    { key: 'all',      label: 'Все' },
    { key: 'pending',  label: `На проверке${pendingCount ? ` (${pendingCount})` : ''}` },
    { key: 'approved', label: 'Одобрено' },
    { key: 'rejected', label: 'Отклонено' },
    { key: 'revision', label: 'На доработку' },
  ];

  if (user.role !== 'HR') {
    navigate('/dashboard');
    return null;
  }

  function updateActivityStatus(id: number, status: Activity['status'], note?: string) {
    updateActivity.mutate({
      id,
      data: {
        status,
        review_note: note,
        awarded_points: status === 'approved' ? activities.find(a => a.id === id)?.requestedPoints : undefined,
      },
    });
  }

  async function addAchievement() {
    await achievementsApi.create(newAch);
    qc.invalidateQueries({ queryKey: ['achievements'] });
    analytics.track('достижение_создано', { title: newAch.title, xp: newAch.xp });
    setNewAchModal(false);
    setNewAch({ title: '', description: '', icon: '🏆', xp: 100, category: 'challenge' });
  }

  async function createNewUser() {
    setNewUserError('');
    if (!newUser.username || !newUser.email || !newUser.password) {
      setNewUserError('Заполните обязательные поля');
      return;
    }
    try {
      await createUser.mutateAsync({
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
      });
      analytics.track('пользователь_создан', { role: newUser.role });
      setNewUserModal(false);
      setNewUser({ username: '', email: '', password: '', role: 'EMPLOYEE' });
    } catch {
      setNewUserError('Ошибка при создании. Проверьте данные.');
    }
  }

  async function createNewActivity() {
    if (!newActivity.title || !newActivity.userId) return;
    await createActivity.mutateAsync({
      user_id: newActivity.userId,
      title: newActivity.title,
      description: newActivity.description,
      requested_points: Number(newActivity.requested_points) || 0,
      activity_type: 'custom',
    });
    setNewActivityModal(false);
    setNewActivity({ title: '', description: '', requested_points: '100', userId: 0 });
  }

  async function handleCreateChallenge() {
    if (!newChallenge.title) return;
    setCreateChallengeError('');
    const maxPts = newChallenge.maxPoints ? Number(newChallenge.maxPoints) : undefined;
    try {
      const created = await createChallengeMut.mutateAsync({
        title: newChallenge.title,
        description: newChallenge.description || undefined,
        status: newChallenge.status,
        date: newChallenge.date || undefined,
        url: newChallenge.url || undefined,
        max_points: maxPts,
      });
      if (newChallenge.date) {
        createEvent.mutate({ title: `Дедлайн: ${created.title}`, date: newChallenge.date, event_type: 'deadline', challenge_id: created.id, description: newChallenge.description || undefined });
      }
      const juniors = allUsers.filter(u => u.role === 'EMPLOYEE');
      if (newChallenge.personal) {
        await assignChallengeMut.mutateAsync({ challenge_id: created.id, employee_id: user.id, assigned_by: user.id, progress: 'GOING' });
      } else if (newChallenge.assignAll && juniors.length > 0) {
        await Promise.all(juniors.map(j => assignChallengeMut.mutateAsync({ challenge_id: created.id, employee_id: j.id, assigned_by: user.id, progress: 'GOING' })));
      }
      analytics.track('задача_создана', { status: newChallenge.status, assign_all: newChallenge.assignAll, personal: newChallenge.personal });
      setNewChallengeModal(false);
      setNewChallenge(EMPTY_CHALLENGE);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setCreateChallengeError(msg ?? 'Ошибка при создании задачи');
    }
  }

  const juniors = allUsers.filter(u => u.role === 'EMPLOYEE');
  const mentors = allUsers.filter(u => u.role === 'MENTOR');

  const filteredChallenges = (challengeFilter === 'all' ? challenges : challenges.filter(c => c.status === challengeFilter))
    .filter(c => !challengeSearch.trim() || c.title.toLowerCase().includes(challengeSearch.toLowerCase()))
    .sort((a, b) => {
      const pa = allAssignments.filter(x => x.challenge_id === a.id && x.progress === 'DONE' && x.awarded_points == null).length;
      const pb = allAssignments.filter(x => x.challenge_id === b.id && x.progress === 'DONE' && x.awarded_points == null).length;
      return pb - pa;
    });

  function toggleTeamMember(id: number) {
    setTeamForm(prev => ({
      ...prev,
      member_ids: prev.member_ids.includes(id) ? prev.member_ids.filter(x => x !== id) : [...prev.member_ids, id],
    }));
  }

  function resetTeamForm() {
    setTeamForm({
      name: '',
      project: '',
      description: '',
      status: 'active',
      mentor_id: '',
      member_ids: [],
    });
  }

  function openEditTeam(team: typeof teams[number]) {
    setEditTeamId(team.id);
    setTeamForm({
      name: team.name,
      project: team.project,
      description: team.description,
      status: team.status,
      mentor_id: team.mentorId ?? '',
      member_ids: team.memberIds,
    });
  }

  async function handleCreateTeam() {
    if (!teamForm.name) return;
    await createTeam.mutateAsync({
      name: teamForm.name,
      project: teamForm.project,
      description: teamForm.description,
      status: teamForm.status,
      mentor_id: teamForm.mentor_id ? Number(teamForm.mentor_id) : undefined,
      member_ids: teamForm.member_ids,
    });
    setCreateTeamModal(false);
    resetTeamForm();
  }

  async function handleUpdateTeam() {
    if (!editTeamId) return;
    await updateTeam.mutateAsync({
      id: editTeamId,
      data: {
        name: teamForm.name,
        project: teamForm.project,
        description: teamForm.description,
        status: teamForm.status,
        mentor_id: teamForm.mentor_id ? Number(teamForm.mentor_id) : undefined,
        member_ids: teamForm.member_ids,
      },
    });
    setEditTeamId(null);
    resetTeamForm();
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'challenges',   label: 'Задачи' },
    { key: 'teams',        label: 'Команды' },
    { key: 'achievements', label: 'Достижения' },
    { key: 'events',       label: 'Мероприятия' },
    { key: 'tests',        label: 'Тесты' },
    { key: 'surveys',      label: 'Опросы' },
    { key: 'users',        label: 'Участники' },
    { key: 'personal', label: 'Личные достижения' },
  ];

  return (
    <>
      <PageHeader title="Админ-панель" showBack subtitle="Управление участниками" />
      <div className={styles.page}>
        <div className={styles.tabs}>
          {TABS.map(t => (
            <button key={t.key} className={[styles.tab, tab === t.key ? styles.tabActive : ''].join(' ')} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* CHALLENGES TAB */}
        {tab === 'challenges' && (
          <div>
            <Button full style={{ marginBottom: 'var(--space-3)' }} onClick={() => setNewChallengeModal(true)}>
              + Создать задачу
            </Button>
            <input
              className={styles.search}
              placeholder="Поиск по задачам..."
              value={challengeSearch}
              onChange={e => setChallengeSearch(e.target.value)}
            />
            <div className={styles.filterRow}>
              {CHALLENGE_FILTERS.map(f => (
                <button
                  key={f.key}
                  className={[styles.filterBtn, challengeFilter === f.key ? styles.filterBtnActive : ''].join(' ')}
                  onClick={() => setChallengeFilter(f.key)}
                >{f.label}</button>
              ))}
            </div>
            {filteredChallenges.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 'var(--space-4) 0' }}>Ничего не найдено</p>
            ) : (
              <div className={styles.list}>
                {filteredChallenges.map(c => {
                  const pendingCount = allAssignments.filter(a => a.challenge_id === c.id && a.progress === 'DONE' && a.awarded_points == null).length;
                  return (
                    <ChallengeCard
                      key={c.id}
                      challenge={c}
                      pendingReview={pendingCount || undefined}
                      onClick={() => navigate(`/challenges/${c.id}`)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TEAMS TAB */}
        {tab === 'teams' && (
          <div>
            <Button full style={{ marginBottom: 'var(--space-3)' }} onClick={() => setCreateTeamModal(true)}>
              + Создать команду
            </Button>
            {teams.length === 0 ? (
              <div className={styles.empty}>Команд пока нет</div>
            ) : (
              <div className={styles.list}>
                {teams.map(team => {
                  const mentor = team.mentorId ? allUsers.find(u => u.id === team.mentorId) : null;
                  const memberCount = team.memberIds.length;
                  const statusClass = team.status === 'active'
                    ? styles.approved
                    : team.status === 'on_hold'
                      ? styles.revision
                      : styles.rejected;

                  return (
                    <div key={team.id} className={styles.item}>
                      <div className={styles.itemTop}>
                        <p className={styles.itemTitle}>{team.name}</p>
                        <span className={[styles.status, statusClass].join(' ')}>{TEAM_STATUS_LABEL[team.status]}</span>
                      </div>
                      <p className={styles.itemSub}>{team.project || 'Без проекта'}</p>
                      <p className={styles.itemDesc}>{team.description || 'Описание не заполнено'}</p>
                      {mentor && <p className={styles.itemSub}>Ментор: {mentor.username}</p>}
                      <p className={styles.itemSub}>Участников: {memberCount}</p>
                      <div className={styles.itemActions}>
                        <Button size="sm" variant="ghost" onClick={() => openEditTeam(team)}>Редактировать</Button>
                        <Button size="sm" variant="danger" onClick={() => deleteTeam.mutate(team.id)}>Удалить</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ACTIVITIES TAB */}
        {tab === 'activities' && (
          <div>
          <div className={styles.list}>
            {activities.map(act => {
              const actUser = allUsers.find(u => u.id === act.userId);
              return (
                <div key={act.id} className={styles.item}>
                  <div className={styles.itemTop}>
                    <p className={styles.itemTitle}>{act.title}</p>
                    <span className={[styles.status, styles[act.status]].join(' ')}>{STATUS_LABEL[act.status]}</span>
                  </div>
                  <p className={styles.itemSub}>👤 {actUser?.username} · {act.submittedAt} · +{act.requestedPoints} бал.</p>
                  <p className={styles.itemDesc}>{act.description}</p>
                  {act.reviewNote && <p className={styles.reviewNote}>💬 {act.reviewNote}</p>}
                  <div className={styles.itemActions}>
                    {act.status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => updateActivityStatus(act.id, 'approved')}>Одобрить</Button>
                        <Button size="sm" variant="secondary" onClick={() => updateActivityStatus(act.id, 'revision', 'Требуется доработка')}>На доработку</Button>
                        <Button size="sm" variant="danger" onClick={() => updateActivityStatus(act.id, 'rejected', 'Не соответствует критериям')}>Отклонить</Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        )}

        {tab === 'tests' && quizzes.length === 0 && (
          <div className={styles.empty}>Нет тестов</div>
        )}
        {tab === 'tests' && quizzes.length !== 0 && (
          <div className={styles.list}>
            {quizzes.map(q => {
              const count = allResults.filter(r => r.quizId === q.id).length;
              const pending = allResults.filter(r => r.quizId === q.id && r.score === 0).length;
              return (
                <div key={q.id} className={styles.quizCard}>
                  <div className={styles.quizInfo}>
                    <p className={styles.quizTitle}>{q.title}</p>
                    <p className={styles.quizMeta}>
                      {count} {count === 1 ? 'результат' : count < 5 ? 'результата' : 'результатов'}
                      {pending > 0 && <span style={{ color: 'var(--color-warning-bright)', marginLeft: 8 }}>• {pending} требует проверки</span>}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => { analytics.track('тест_открыта_проверка', { quiz_id: q.id }); navigate(`/tests/${q.id}/review`); }}>
                    <ClipboardCheck size={14} style={{ marginRight: 4 }} />
                    Проверить
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'surveys' && surveys.length === 0 && (
          <div className={styles.empty}>Нет опросов</div>
        )}
        {tab === 'surveys' && surveys.length !== 0 && (
          <div className={styles.list}>
            {surveys.map(s => {
              const count = allSurveyResults.filter(r => r.surveyId === s.id).length;
              return (
                <div key={s.id} className={styles.quizCard}>
                  <div className={styles.quizInfo}>
                    <p className={styles.quizTitle}>{s.title}</p>
                    <p className={styles.quizMeta}>
                      {count} {count === 1 ? 'ответ' : count < 5 ? 'ответа' : 'ответов'}
                      {!s.available && <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>• скрыт</span>}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => { analytics.track('опрос_открыты_результаты', { survey_id: s.id }); navigate(`/surveys/${s.id}/results`); }}>
                    <BarChart3 size={14} style={{ marginRight: 4 }} />
                    Результаты
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* ACHIEVEMENTS TAB */}
        {tab === 'achievements' && (
          <div>
            <Button full style={{ marginBottom: 'var(--space-3)' }} onClick={() => setNewAchModal(true)}>
              + Создать достижение
            </Button>
            <div className={styles.attendanceGrid}>
              {achievements.map(ach => {
                const isOpen = achExpanded === ach.id;
                const employees = allUsers.filter(u => u.role === 'EMPLOYEE');
                return (
                  <div key={ach.id} className={styles.attendanceCard}>
                    <div className={styles.attendanceHeader} onClick={() => setAchExpanded(v => v === ach.id ? null : ach.id)}>
                      <span style={{ fontSize: 24, flexShrink: 0 }}>{ach.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className={styles.achTitle} style={{ marginBottom: 2 }}>{ach.title}</p>
                        <p className={styles.achDesc}>{ach.description}</p>
                        <p style={{ fontSize: 11, fontFamily: 'var(--font-display)', color: 'var(--color-warning-bright)', marginTop: 3 }}>+{ach.xp} БАЛЛОВ</p>
                      </div>
                      <button
                        title="Редактировать"
                        onClick={e => { e.stopPropagation(); setAchEditData({ title: ach.title, description: ach.description ?? '', icon: ach.icon, xp: String(ach.xp) }); setEditAchModal(ach.id); }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0 }}
                      ><Pencil size={15} /></button>
                      <button
                        title="Удалить"
                        onClick={e => { e.stopPropagation(); deleteAchievement.mutate(ach.id); }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'transparent', cursor: 'pointer', color: 'var(--color-primary-bright)', flexShrink: 0 }}
                      ><Trash2 size={15} /></button>
                      {isOpen ? <ChevronUp size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                    </div>
                    {isOpen && (
                      <div className={styles.attendanceBody}>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 'var(--space-2)' }}>Участники</p>
                        <div>
                          {employees.map(emp => {
                            const has = allUserAchievements.some(ua => ua.user_id === emp.id && ua.achievement_id === ach.id);
                            return (
                              <div key={emp.id} className={styles.attendanceRow}>
                                <div className={styles.attendanceAvatar}>{emp.username.slice(0, 2).toUpperCase()}</div>
                                <p style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>{emp.username}</p>
                                {has ? (
                                  <>
                                    <span style={{ fontSize: 11, color: 'var(--color-success-bright)', marginRight: 'var(--space-2)' }}>✓ Выдано</span>
                                    <Button size="sm" variant="danger" onClick={() => { analytics.track('достижение_отозвано', { achievement_id: ach.id, user_id: emp.id }); revokeAchievement.mutate({ userId: emp.id, achievementId: ach.id }); }} disabled={revokeAchievement.isPending}>Отозвать</Button>
                                  </>
                                ) : (
                                  <Button size="sm" onClick={() => { analytics.track('достижение_выдано', { achievement_id: ach.id, user_id: emp.id }); awardAchievement.mutate({ user_id: emp.id, achievement_id: ach.id }); }} disabled={awardAchievement.isPending}>Выдать</Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* EVENTS TAB — attendance only */}
        {tab === 'events' && (() => {
          const hrIds = new Set(allUsers.filter(u => u.role === 'HR').map(u => u.id));

          // Only meetings created by HR that have at least one EMPLOYEE attendee
          const meetingEvents = [...events]
            .filter(ev => {
              if (ev.type !== 'meeting') return false;
              if (ev.createdBy == null || !hrIds.has(ev.createdBy)) return false;
              const employeeAttendees = ev.attendeeIds.filter(id => {
                const u = allUsers.find(u => u.id === id);
                return u?.role === 'EMPLOYEE';
              });
              return employeeAttendees.length > 0;
            })
            .sort((a, b) => b.date.localeCompare(a.date));

          function getRecord(eventId: number, userId: number) {
            return getAttendanceRecord(eventId, userId);
          }

          function openRowEditor(eventId: number, userId: number) {
            openAttendanceEditor(eventId, userId);
          }

          if (meetingEvents.length === 0) {
            return <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 'var(--space-6) 0' }}>Нет мероприятий с назначенными участниками</p>;
          }

          return (
            <div className={styles.attendanceGrid}>
              {meetingEvents.map(ev => {
                // Only EMPLOYEE users from this event's attendeeIds
                const eventEmployees = ev.attendeeIds
                  .map(id => allUsers.find(u => u.id === id))
                  .filter(u => u?.role === 'EMPLOYEE') as typeof allUsers;

                const filteredEmployees = attendanceSearch.trim()
                  ? eventEmployees.filter(e => e.username.toLowerCase().includes(attendanceSearch.toLowerCase()))
                  : eventEmployees;

                const attendedCount = eventEmployees.filter(e => getRecord(ev.id, e.id)?.attended).length;
                const isOpen = attendanceExpanded === ev.id;

                return (
                  <div key={ev.id} className={styles.attendanceCard}>
                    <div className={styles.attendanceHeader} onClick={() => setAttendanceExpanded(v => v === ev.id ? null : ev.id)}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>🤝</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className={styles.itemTitle} style={{ marginBottom: 2 }}>{ev.title}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ev.date}</p>
                      </div>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-display)', color: attendedCount > 0 ? 'var(--color-success-bright)' : 'var(--text-muted)', flexShrink: 0 }}>
                        {attendedCount}/{eventEmployees.length}
                      </span>
                      {isOpen ? <ChevronUp size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                    </div>
                    {isOpen && (
                      <div className={styles.attendanceBody}>
                        <input
                          className={styles.search}
                          placeholder="Поиск по имени..."
                          value={attendanceSearch}
                          onChange={e => setAttendanceSearch(e.target.value)}
                        />
                        {filteredEmployees.length === 0 && (
                          <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-2) 0' }}>Никого не найдено</p>
                        )}
                        {filteredEmployees.map(emp => {
                          const rec = getRecord(ev.id, emp.id);
                          const state: 'none' | 'absent' | 'present' = !rec ? 'none' : rec.attended ? 'present' : 'absent';
                          const label = rec ? (rec.attended ? `✓${rec.awardedPoints != null ? ` +${rec.awardedPoints}` : ''}` : '✗ Не был') : '—';
                          return (
                            <div key={emp.id} className={styles.attendanceRow}>
                              <div className={styles.attendanceAvatar}>{emp.username.slice(0, 2).toUpperCase()}</div>
                              <p style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>{emp.username}</p>
                              <button
                                className={[styles.attendanceToggle, state === 'present' ? styles.attendanceToggleOn : state === 'absent' ? styles.attendanceToggleOff : ''].join(' ')}
                                onClick={() => openRowEditor(ev.id, emp.id)}
                              >
                                {label}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {attendanceEditor && (
          <Modal open={true} onClose={closeAttendanceEditor} title="Управление посещаемостью" type="dialog">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: 28 }}>🤝</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                    {events.find(ev => ev.id === attendanceEditor.eventId)?.title ?? 'Мероприятие'}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {events.find(ev => ev.id === attendanceEditor.eventId)?.date ?? ''}
                  </p>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Участник: <strong>{allUsers.find(u => u.id === attendanceEditor.userId)?.username ?? 'Пользователь'}</strong>
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button
                  type="button"
                  onClick={() => setAttendanceEditor(prev => prev ? ({ ...prev, attended: true }) : prev)}
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: 8, border: attendanceEditor.attended ? '1px solid var(--color-success-bright)' : '1px solid var(--border-subtle)',
                    background: attendanceEditor.attended ? 'rgba(61,189,106,0.12)' : 'transparent', color: attendanceEditor.attended ? 'var(--color-success-bright)' : 'var(--text-primary)',
                    cursor: 'pointer', fontSize: 13,
                  }}
                >
                  Присутствовал
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceEditor(prev => prev ? ({ ...prev, attended: false }) : prev)}
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: 8, border: !attendanceEditor.attended ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                    background: !attendanceEditor.attended ? 'rgba(204,0,0,0.08)' : 'transparent', color: !attendanceEditor.attended ? 'var(--color-primary-bright)' : 'var(--text-primary)',
                    cursor: 'pointer', fontSize: 13,
                  }}
                >
                  Не был
                </button>
              </div>
              {attendanceEditor.attended && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Баллы (необязательно)
                  </label>
                  <input
                    value={attendanceEditorPoints}
                    onChange={e => setAttendanceEditorPoints(e.target.value)}
                    placeholder="Например, 10"
                    inputMode="numeric"
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 13, outline: 'none'
                    }}
                  />
                </div>
              )}
              {attendanceEditorError && <p style={{ color: 'var(--color-primary-bright)', fontSize: 12 }}>{attendanceEditorError}</p>}
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button full onClick={() => handleSaveAttendance(attendanceEditor.attended)} loading={markAttendance.isPending || updateAttendance.isPending}>
                  Сохранить
                </Button>
                <Button full variant="secondary" onClick={closeAttendanceEditor}>Отмена</Button>
              </div>
            </div>
          </Modal>
        )}

        {tab === 'personal' && (
    <>
      <div className={styles.filters}>
        {FILTER_BTNS.map(f => (
          <button key={f.key}
            className={[styles.filterBtn, filter === f.key ? styles.active : ''].join(' ')}
            onClick={() => setFilter(f.key)}
          >{f.label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>Нет достижений</div>
      ) : (
        <div className={styles.list}>
          {filtered.map(a => {
            const u = allUsers.find(x => x.id === a.userId);
            const name = u ? u.username : `#${a.userId}`;
            const ed = getEdit(a.id, a.awardedPoints ?? 0, a.reviewNote ?? '');

            return (
              <div key={a.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <p className={styles.cardTitle}>{a.title}</p>
                  <span className={[styles.statusBadge, styles[a.status]].join(' ')}>
                    {STATUS_LABEL[a.status]}
                  </span>
                </div>
                <p className={styles.userName}>👤 {name}</p>
                {a.achievedDate && (
                  <p className={styles.metaItem} style={{ fontSize: 11 }}>
                    <Calendar size={11} />
                    {format(new Date(a.achievedDate), 'd MMMM yyyy', { locale: ru })}
                  </p>
                )}
                {a.description && <p className={styles.cardDesc}>{a.description}</p>}
                {(a.links ?? []).length > 0 && (
                  <div className={styles.linksList}>
                    {(a.links ?? []).map(url => (
                      <a key={url} href={url} target="_blank" rel="noopener noreferrer" className={styles.linksItem}>
                        <Link2 size={11} />{url}
                      </a>
                    ))}
                  </div>
                )}

                {a.status === 'pending' && (
                  <>
                    <div className={styles.scoreRow}>
                      <span className={styles.scoreLabel}>Баллы:</span>
                      <input
                        type="number"
                        className={styles.scoreInput}
                        min={0}
                        value={ed.points}
                        onChange={e => setEditing(prev => ({ ...prev, [a.id]: { ...ed, points: Math.max(0, Number(e.target.value)) } }))}
                      />
                    </div>
                    <textarea
                      className={styles.feedbackArea}
                      placeholder="Комментарий..."
                      value={ed.note}
                      onChange={e => setEditing(prev => ({ ...prev, [a.id]: { ...ed, note: e.target.value } }))}
                    />
                    <div className={styles.actions}>
                      <Button size="sm" onClick={() => approve(a.id)} disabled={updateActivity.isPending}>Одобрить</Button>
                      <Button size="sm" variant="secondary" onClick={() => revision(a.id)} disabled={updateActivity.isPending}>На доработку</Button>
                      <Button size="sm" variant="danger" onClick={() => reject(a.id)} disabled={updateActivity.isPending}>Отклонить</Button>
                    </div>
                  </>
                )}

                {a.status !== 'pending' && a.reviewNote && (
                  <p className={styles.note}>💬 {a.reviewNote}</p>
                )}
                {a.status === 'approved' && a.awardedPoints != null && (
                  <p className={styles.points}>✓ +{a.awardedPoints} баллов</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  )
}

        {/* USERS TAB */}
        {tab === 'users' && (
          <div>
            <Button full style={{ marginBottom: 'var(--space-3)' }} onClick={() => setNewUserModal(true)}>
              + Создать пользователя
            </Button>
            <div className={styles.list}>
            {allUsers.map(u => {
              const pts = leaderboard.find(p => p.userId === u.id);
              return (
                <div key={u.id} className={styles.item}>
                  <div className={styles.itemTop}>
                    <p className={styles.itemTitle}>{u.username}</p>
                    {pts && <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--color-primary-bright)' }}>{pts.totalPoints} бал.</span>}
                  </div>
                  <p className={styles.itemSub}>@{u.username} · {pts?.levelName ?? '—'} · #{pts?.rank ?? '—'}</p>
                  <div className={styles.itemActions}>
                    <Button size="sm" variant="secondary" onClick={() => navigate('/points')}>Активности</Button>
                    <Button size="sm" variant="ghost" onClick={() => navigate('/leaderboard')}>Рейтинг</Button>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}
      </div>

      {/* Edit Achievement Modal */}
      {editAchModal !== null && (
        <Modal open={true} onClose={() => setEditAchModal(null)} title="Редактировать достижение" type="dialog">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input label="Название" value={achEditData.title} onChange={e => setAchEditData(p => ({ ...p, title: e.target.value }))} />
            <Input label="Описание" value={achEditData.description} onChange={e => setAchEditData(p => ({ ...p, description: e.target.value }))} />
            <Input label="Иконка (эмодзи)" value={achEditData.icon} onChange={e => setAchEditData(p => ({ ...p, icon: e.target.value }))} />
            <Input label="Баллов" type="number" value={achEditData.xp} onChange={e => setAchEditData(p => ({ ...p, xp: e.target.value }))} />
            <Button full onClick={async () => {
              await achievementsApi.update(editAchModal, { title: achEditData.title, description: achEditData.description, icon: achEditData.icon, xp: Number(achEditData.xp) });
              qc.invalidateQueries({ queryKey: ['achievements'] });
              analytics.track('достижение_изменено', { achievement_id: editAchModal });
              setEditAchModal(null);
            }}>Сохранить</Button>
          </div>
        </Modal>
      )}

      {/* Edit Activity Modal */}
      {editActivity && (
        <Modal open={true} onClose={() => setEditActivity(null)} title="Редактировать активность" type="dialog">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input label="Название" value={editActivity.title} onChange={e => setEditActivity(p => p && ({ ...p, title: e.target.value }))} />
            <Input label="Описание" value={editActivity.description} onChange={e => setEditActivity(p => p && ({ ...p, description: e.target.value }))} />
            <Input label="Баллы" type="number" value={String(editActivity.requestedPoints)} onChange={e => setEditActivity(p => p && ({ ...p, requestedPoints: Number(e.target.value) }))} />
            <Input label="Комментарий HR" value={editActivity.reviewNote ?? ''} onChange={e => setEditActivity(p => p && ({ ...p, reviewNote: e.target.value }))} />
            <Button full onClick={() => {
              if (!editActivity) return;
              updateActivity.mutate({
                id: editActivity.id,
                data: { title: editActivity.title, description: editActivity.description, requested_points: editActivity.requestedPoints, review_note: editActivity.reviewNote },
              }, { onSuccess: () => setEditActivity(null) });
            }}>Сохранить</Button>
          </div>
        </Modal>
      )}

      {/* New Achievement Modal */}
      {newAchModal && (
        <Modal open={true} onClose={() => setNewAchModal(false)} title="Создать достижение" type="dialog">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input label="Название" value={newAch.title} onChange={e => setNewAch(p => ({ ...p, title: e.target.value }))} />
            <Input label="Описание" value={newAch.description} onChange={e => setNewAch(p => ({ ...p, description: e.target.value }))} />
            <Input label="Иконка (эмодзи)" value={newAch.icon} onChange={e => setNewAch(p => ({ ...p, icon: e.target.value }))} />
            <Input label="Баллов" type="number" value={String(newAch.xp)} onChange={e => setNewAch(p => ({ ...p, xp: Number(e.target.value) }))} />
            <Button full onClick={addAchievement}>Создать</Button>
          </div>
        </Modal>
      )}

      {/* New Challenge Modal */}
      {newChallengeModal && (
        <Modal open={true} onClose={() => { setNewChallengeModal(false); setCreateChallengeError(''); }} title="Создать задачу" type="dialog">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input label="Название *" value={newChallenge.title} onChange={e => setNewChallenge(p => ({ ...p, title: e.target.value }))} />
            <Input label="Описание" value={newChallenge.description} onChange={e => setNewChallenge(p => ({ ...p, description: e.target.value }))} />
            <Input label="Ссылка (URL)" value={newChallenge.url} onChange={e => setNewChallenge(p => ({ ...p, url: e.target.value }))} />
            <DateInput label="Дата дедлайна" value={newChallenge.date} onChange={date => setNewChallenge(p => ({ ...p, date }))} />
            {!newChallenge.personal && (
              <Input label="Максимум баллов" type="number" value={newChallenge.maxPoints} onChange={e => setNewChallenge(p => ({ ...p, maxPoints: e.target.value }))} />
            )}
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Статус</p>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {(['DRAFT', 'ACTIVE'] as ChallengeStatus[]).map(s => (
                  <button key={s} onClick={() => setNewChallenge(p => ({ ...p, status: s }))}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 6, border: '1px solid', cursor: 'pointer',
                      fontSize: 12, fontFamily: 'var(--font-display)',
                      borderColor: newChallenge.status === s ? 'var(--color-primary)' : 'var(--border-subtle)',
                      background: newChallenge.status === s ? 'rgba(204,0,0,0.15)' : 'transparent',
                      color: newChallenge.status === s ? 'var(--color-primary-bright)' : 'var(--text-muted)',
                    }}
                  >{{ DRAFT: 'Черновик', ACTIVE: 'Активна' }[s as 'DRAFT' | 'ACTIVE']}</button>
                ))}
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', userSelect: 'none' }}>
              <div onClick={() => setNewChallenge(p => ({ ...p, personal: !p.personal, assignAll: false }))}
                style={{ width: 36, height: 20, borderRadius: 10, position: 'relative', flexShrink: 0, cursor: 'pointer',
                  background: newChallenge.personal ? 'var(--color-primary)' : 'var(--border-subtle)', transition: 'background 0.2s' }}>
                <span style={{ position: 'absolute', top: 2, left: newChallenge.personal ? 18 : 2,
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>Личная задача (только для меня)</span>
            </label>
            {!newChallenge.personal && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', userSelect: 'none' }}>
                <div onClick={() => setNewChallenge(p => ({ ...p, assignAll: !p.assignAll }))}
                  style={{ width: 36, height: 20, borderRadius: 10, position: 'relative', flexShrink: 0, cursor: 'pointer',
                    background: newChallenge.assignAll ? 'var(--color-primary)' : 'var(--border-subtle)', transition: 'background 0.2s' }}>
                  <span style={{ position: 'absolute', top: 2, left: newChallenge.assignAll ? 18 : 2,
                    width: 16, height: 16, borderRadius: '50%', background: '#fff',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                  Назначить всем участникам
                  {newChallenge.assignAll && juniors.length > 0 && (
                    <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>({juniors.length})</span>
                  )}
                </span>
              </label>
            )}
            {createChallengeError && <p style={{ color: 'var(--color-primary-bright)', fontSize: 12 }}>{createChallengeError}</p>}
            <Button full onClick={handleCreateChallenge} disabled={createChallengeMut.isPending || assignChallengeMut.isPending}>
              {assignChallengeMut.isPending ? 'Назначение...' : createChallengeMut.isPending ? 'Создание...' : newChallenge.personal ? 'Создать для себя' : newChallenge.assignAll && juniors.length > 0 ? `Создать и назначить (${juniors.length})` : 'Создать'}
            </Button>
          </div>
        </Modal>
      )}

      {(createTeamModal || editTeamId !== null) && (
        <Modal
          open={true}
          onClose={() => {
            setCreateTeamModal(false);
            setEditTeamId(null);
            resetTeamForm();
          }}
          title={editTeamId ? 'Редактировать команду' : 'Создать команду'}
          type="dialog"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input label="Название команды *" value={teamForm.name} onChange={e => setTeamForm(p => ({ ...p, name: e.target.value }))} />
            <Input label="Проект" value={teamForm.project} onChange={e => setTeamForm(p => ({ ...p, project: e.target.value }))} />
            <Input label="Описание" value={teamForm.description} onChange={e => setTeamForm(p => ({ ...p, description: e.target.value }))} />
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Статус</p>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {(['active', 'on_hold', 'completed'] as TeamStatus[]).map(status => (
                  <button
                    key={status}
                    onClick={() => setTeamForm(p => ({ ...p, status }))}
                    style={{
                      flex: 1,
                      padding: '6px',
                      borderRadius: 6,
                      border: '1px solid',
                      cursor: 'pointer',
                      fontSize: 11,
                      borderColor: teamForm.status === status ? 'var(--color-primary)' : 'var(--border-subtle)',
                      background: teamForm.status === status ? 'rgba(204,0,0,0.15)' : 'transparent',
                      color: teamForm.status === status ? 'var(--color-primary-bright)' : 'var(--text-muted)',
                    }}
                  >
                    {TEAM_STATUS_LABEL[status]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Ментор</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 120, overflowY: 'auto' }}>
                <button
                  onClick={() => setTeamForm(p => ({ ...p, mentor_id: '' }))}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 12,
                    borderColor: !teamForm.mentor_id ? 'var(--color-primary)' : 'var(--border-subtle)',
                    background: !teamForm.mentor_id ? 'rgba(204,0,0,0.15)' : 'transparent',
                    color: !teamForm.mentor_id ? 'var(--color-primary-bright)' : 'var(--text-muted)',
                  }}
                >
                  — Без ментора
                </button>
                {mentors.map(mentor => (
                  <button
                    key={mentor.id}
                    onClick={() => setTeamForm(p => ({ ...p, mentor_id: mentor.id }))}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: '1px solid',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: 12,
                      borderColor: teamForm.mentor_id === mentor.id ? 'var(--color-primary)' : 'var(--border-subtle)',
                      background: teamForm.mentor_id === mentor.id ? 'rgba(204,0,0,0.15)' : 'transparent',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {mentor.username}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Участники проекта</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 150, overflowY: 'auto' }}>
                {juniors.map(member => {
                  const selected = teamForm.member_ids.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      onClick={() => toggleTeamMember(member.id)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: 12,
                        borderColor: selected ? 'var(--color-primary)' : 'var(--border-subtle)',
                        background: selected ? 'rgba(204,0,0,0.15)' : 'transparent',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {selected ? '✓ ' : ''}{member.username}
                    </button>
                  );
                })}
              </div>
            </div>
            <Button full onClick={editTeamId ? handleUpdateTeam : handleCreateTeam} disabled={createTeam.isPending || updateTeam.isPending}>
              {editTeamId ? 'Сохранить' : 'Создать команду'}
            </Button>
          </div>
        </Modal>
      )}

      {/* New User Modal */}
      {newUserModal && (
        <Modal open={true} onClose={() => { setNewUserModal(false); setNewUserError(''); }} title="Создать пользователя" type="dialog">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input label="Логин *" value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))} />
            <Input label="Email *" type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} />
            <Input label="Пароль *" type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} />
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Роль</p>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {(['EMPLOYEE', 'MENTOR', 'HR'] as UserRole[]).map(r => (
                  <button
                    key={r}
                    onClick={() => setNewUser(p => ({ ...p, role: r }))}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 6, border: '1px solid',
                      borderColor: newUser.role === r ? 'var(--color-primary)' : 'var(--border-subtle)',
                      background: newUser.role === r ? 'rgba(204,0,0,0.15)' : 'transparent',
                      color: newUser.role === r ? 'var(--color-primary-bright)' : 'var(--text-muted)',
                      cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-display)',
                    }}
                  >
                    {{ EMPLOYEE: 'Участник', MENTOR: 'Ментор', HR: 'HR' }[r] ?? r}
                  </button>
                ))}
              </div>
            </div>
            {newUserError && <p style={{ color: 'var(--color-danger-bright)', fontSize: 12 }}>{newUserError}</p>}
            <Button full onClick={createNewUser} disabled={createUser.isPending}>
              {createUser.isPending ? 'Создание...' : 'Создать'}
            </Button>
          </div>
        </Modal>
      )}

      {/* New Activity Modal */}
      {newActivityModal && (
        <Modal open={true} onClose={() => setNewActivityModal(false)} title="Добавить активность" type="dialog">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input label="Название *" value={newActivity.title} onChange={e => setNewActivity(p => ({ ...p, title: e.target.value }))} />
            <Input label="Описание" value={newActivity.description} onChange={e => setNewActivity(p => ({ ...p, description: e.target.value }))} />
            <Input label="Баллов" type="number" value={newActivity.requested_points} onChange={e => setNewActivity(p => ({ ...p, requested_points: e.target.value }))} />
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Участник</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
                {allUsers.filter(u => u.role === 'EMPLOYEE').map(u => (
                  <button key={u.id} onClick={() => setNewActivity(p => ({ ...p, userId: u.id }))}
                    style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid', textAlign: 'left', cursor: 'pointer', fontSize: 12,
                      borderColor: newActivity.userId === u.id ? 'var(--color-primary)' : 'var(--border-subtle)',
                      background: newActivity.userId === u.id ? 'rgba(204,0,0,0.15)' : 'transparent',
                      color: 'var(--text-primary)',
                    }}
                  >{newActivity.userId === u.id ? '✓ ' : ''}{u.username}</button>
                ))}
              </div>
            </div>
            <Button full onClick={createNewActivity} disabled={createActivity.isPending || !newActivity.title || !newActivity.userId}>
              {createActivity.isPending ? 'Создание...' : 'Создать'}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
