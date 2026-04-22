import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@modules/auth/store/authStore';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Button } from '@shared/components/ui/Button/Button';
import { Input } from '@shared/components/ui/Input/Input';
import { DateInput } from '@shared/components/ui/Input/DateInput';
import { Modal } from '@shared/components/ui/Modal/Modal';
import {
  useActivities, useUsers, useUpdateActivity, useCreateActivity, useDeleteActivity,
  useChallenges, useChallengeJuniors, useUpdateChallengeJunior, useCreateNotification,
  useQuizzes, useQuizResults,
  useAchievements, useAllUserAchievements, useAwardAchievement, useRevokeAchievement,
  useCalendarEvents, useMeetingAttendance, useMarkAttendance, useUpdateAttendance,
} from '@shared/hooks/useApi';
import { ChevronDown, ChevronUp, Link2, Plus, X, Star, ClipboardCheck, Calendar, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { ActivityStatus } from '@shared/types';
import styles from './PointsPage.module.css';

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<ActivityStatus, string> = {
  pending: 'На проверке',
  approved: 'Одобрено',
  revision: 'На доработку',
  rejected: 'Отклонено',
};

// ─────────────────────────────────────────────────────────────────────────────
// HR: Задачи tab
// ─────────────────────────────────────────────────────────────────────────────

function TasksTab() {
  const { data: challenges = [] } = useChallenges();
  const { data: assignments = [] } = useChallengeJuniors();
  const { data: allUsers = [] } = useUsers();
  const updateJunior = useUpdateChallengeJunior();
  const createNotification = useCreateNotification();

  // Local state per assignment (challengeId+juniorId key)
  const [editing, setEditing] = useState<Record<string, { points: number; feedback: string }>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const reviewable = assignments.filter(a => a.progress === 'DONE');

  function key(a: typeof assignments[number]) { return `${a.challenge_id}-${a.junior_id}`; }

  function getState(a: typeof assignments[number]) {
    const k = key(a);
    if (editing[k]) return editing[k];
    const challenge = challenges.find(c => c.id === a.challenge_id);
    return { points: a.awarded_points ?? 0, feedback: a.feedback ?? '', maxPoints: challenge?.maxPoints };
  }

  function update(a: typeof assignments[number], patch: Partial<{ points: number; feedback: string }>) {
    const k = key(a);
    const cur = getState(a);
    setEditing(prev => ({ ...prev, [k]: { ...cur, ...patch } }));
  }

  async function save(a: typeof assignments[number]) {
    const k = key(a);
    const st = getState(a);
    const challenge = challenges.find(c => c.id === a.challenge_id);
    const maxPts = challenge?.maxPoints;
    const finalPoints = maxPts != null ? Math.min(st.points, maxPts) : st.points;
    await updateJunior.mutateAsync({
      challengeId: a.challenge_id,
      juniorId: a.junior_id,
      data: {
        awarded_points: finalPoints,
        feedback: st.feedback || undefined,
      },
    });
    // Notify the junior
    await createNotification.mutateAsync({
      user_id: a.junior_id,
      message: `⭐ HR проверил вашу задачу «${challenge?.title ?? `#${a.challenge_id}`}» — начислено ${finalPoints} баллов${st.feedback ? '. Есть обратная связь' : ''}||/challenges/${a.challenge_id}`,
    });
    setSaved(prev => ({ ...prev, [k]: true }));
    setTimeout(() => setSaved(prev => ({ ...prev, [k]: false })), 2000);
  }

  if (reviewable.length === 0) {
    return <div className={styles.empty}>Нет задач на проверке</div>;
  }

  return (
    <div className={styles.list}>
      {reviewable.map(a => {
        const challenge = challenges.find(c => c.id === a.challenge_id);
        const junior = allUsers.find(u => u.id === a.junior_id);
        const juniorName = junior ? `${junior.firstname ?? ''} ${junior.lastname ?? ''}`.trim() || junior.username : `#${a.junior_id}`;
        const k = key(a);
        const st = getState(a);
        const maxPts = challenge?.maxPoints;
        const isSaved = saved[k];

        return (
          <div key={k} className={styles.card}>
            <div className={styles.cardTop}>
              <p className={styles.cardTitle}>{challenge?.title ?? `Задача #${a.challenge_id}`}</p>
              <span className={[styles.statusBadge, a.progress === 'DONE' ? styles.approved : styles.pending].join(' ')}>
                {a.progress === 'DONE' ? 'Выполнено' : 'В процессе'}
              </span>
            </div>
            <p className={styles.userName}>👤 {juniorName}</p>

            {a.comment && <p className={styles.cardDesc}>{a.comment}</p>}
            {(a.links ?? []).length > 0 && (
              <div className={styles.linksList}>
                {(a.links ?? []).map(url => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer" className={styles.linksItem}>
                    <Link2 size={11} />{url}
                  </a>
                ))}
              </div>
            )}

            <div className={styles.scoreRow}>
              <span className={styles.scoreLabel}>Баллы:</span>
              <input
                type="number"
                className={styles.scoreInput}
                min={0}
                max={maxPts ?? undefined}
                value={st.points}
                onChange={e => update(a, { points: Math.max(0, maxPts != null ? Math.min(Number(e.target.value), maxPts) : Number(e.target.value)) })}
              />
              {maxPts != null && <span className={styles.maxLabel}>/ {maxPts}</span>}
            </div>

            <textarea
              className={styles.feedbackArea}
              placeholder="Обратная связь для участника..."
              value={st.feedback}
              onChange={e => update(a, { feedback: e.target.value })}
            />

            <div className={styles.actions}>
              <Button size="sm" onClick={() => save(a)} disabled={updateJunior.isPending}>
                {isSaved ? '✓ Сохранено' : 'Сохранить'}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HR: Тесты tab
// ─────────────────────────────────────────────────────────────────────────────

function TestsTab() {
  const navigate = useNavigate();
  const { data: quizzes = [] } = useQuizzes();
  const { data: allResults = [] } = useQuizResults();

  if (quizzes.length === 0) return <div className={styles.empty}>Нет тестов</div>;

  return (
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
            <Button size="sm" variant="ghost" onClick={() => navigate(`/tests/${q.id}/review`)}>
              <ClipboardCheck size={14} style={{ marginRight: 4 }} />
              Проверить
            </Button>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HR: Личные достижения tab
// ─────────────────────────────────────────────────────────────────────────────

function PersonalTab() {
  const { data: activities = [] } = useActivities();
  const { data: allUsers = [] } = useUsers();
  const updateActivity = useUpdateActivity();

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
      data: {
        status: 'approved',
        awarded_points: ed?.points ?? 0,
        review_note: ed?.note || undefined,
      },
    });
  }

  async function reject(id: number) {
    const ed = editing[id];
    await updateActivity.mutateAsync({
      id,
      data: {
        status: 'rejected',
        review_note: ed?.note || 'Не соответствует критериям',
      },
    });
  }

  async function revision(id: number) {
    const ed = editing[id];
    await updateActivity.mutateAsync({
      id,
      data: {
        status: 'revision',
        review_note: ed?.note || 'Требуется доработка',
      },
    });
  }

  const FILTER_BTNS: { key: 'all' | ActivityStatus; label: string }[] = [
    { key: 'all',      label: 'Все' },
    { key: 'pending',  label: `На проверке${pendingCount ? ` (${pendingCount})` : ''}` },
    { key: 'approved', label: 'Одобрено' },
    { key: 'rejected', label: 'Отклонено' },
    { key: 'revision', label: 'На доработку' },
  ];

  return (
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
            const name = u ? `${u.firstname ?? ''} ${u.lastname ?? ''}`.trim() || u.username : `#${a.userId}`;
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
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HR: Достижения tab (award catalog achievements)
// ─────────────────────────────────────────────────────────────────────────────

function AchievementsTab() {
  const { data: achievements = [] } = useAchievements();
  const { data: allUsers = [] } = useUsers();
  const { data: userAchievements = [] } = useAllUserAchievements();
  const award = useAwardAchievement();
  const revoke = useRevokeAchievement();
  const [expanded, setExpanded] = useState<number | null>(null);

  const juniors = allUsers.filter(u => u.role === 'JUNIOR');

  function hasAchievement(userId: number, achievementId: number) {
    return userAchievements.some(ua => ua.user_id === userId && ua.achievement_id === achievementId);
  }

  if (achievements.length === 0) return <div className={styles.empty}>Нет достижений в каталоге</div>;

  return (
    <div className={styles.achieveGrid}>
      {achievements.map(ach => (
        <div key={ach.id} className={styles.achieveCard}>
          <div className={styles.achieveCardHeader} onClick={() => setExpanded(v => v === ach.id ? null : ach.id)}>
            <span className={styles.achieveIcon}>{ach.icon}</span>
            <div style={{ flex: 1 }}>
              <p className={styles.achieveTitle}>{ach.title}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{ach.description}</p>
            </div>
            <span className={styles.achieveXp}>+{ach.xp} XP</span>
            {expanded === ach.id ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
          </div>

          {expanded === ach.id && (
            <div className={styles.achieveBody}>
              {juniors.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Нет Участник проектаов</p>}
              {juniors.map(j => {
                const earned = hasAchievement(j.id, ach.id);
                const name = `${j.firstname ?? ''} ${j.lastname ?? ''}`.trim() || j.username;
                return (
                  <div key={j.id} className={styles.juniorRow}>
                    <p className={styles.juniorName}>{name}</p>
                    {earned ? (
                      <>
                        <span className={styles.awardedBadge}>✓ Выдано</span>
                        <Button
                          size="sm"
                          variant="danger"
                          style={{ marginLeft: 6 }}
                          onClick={() => revoke.mutate({ userId: j.id, achievementId: ach.id })}
                          disabled={revoke.isPending}
                        >
                          Отозвать
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => award.mutate({ user_id: j.id, achievement_id: ach.id })}
                        disabled={award.isPending}
                      >
                        Выдать
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HR: Мероприятия tab (attendance matrix — same as AttendancePage)
// ─────────────────────────────────────────────────────────────────────────────

function EventsTab() {
  const { data: events = [] } = useCalendarEvents();
  const { data: attendance = [] } = useMeetingAttendance();
  const { data: allUsers = [] } = useUsers();
  const markAttendance = useMarkAttendance();
  const updateAttendance = useUpdateAttendance();

  const juniors = allUsers.filter(u => u.role === 'JUNIOR');
  const sorted = [...events].sort((a, b) => b.date.localeCompare(a.date));

  if (events.length === 0) return <div className={styles.empty}>Нет мероприятий</div>;

  function isAttended(eventId: number, userId: number) {
    return attendance.find(r => r.eventId === eventId && r.userId === userId)?.attended ?? false;
  }

  function handleMark(eventId: number, userId: number) {
    const existing = attendance.find(r => r.eventId === eventId && r.userId === userId);
    const current = existing?.attended ?? false;
    if (existing) {
      updateAttendance.mutate({ id: existing.id, data: { attended: !current } });
    } else {
      markAttendance.mutate({ event_id: eventId, user_id: userId, attended: true });
    }
  }

  return (
    <div className={styles.attendWrap}>
      <table className={styles.attendTable}>
        <thead>
          <tr>
            <th className={styles.attendTh}>Участник</th>
            {sorted.map(ev => (
              <th key={ev.id} className={styles.attendTh} style={{ minWidth: 100 }}>
                <span style={{ fontSize: 11 }}>{ev.title}</span>
                <br />
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}>{ev.date}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {juniors.map(j => {
            const name = `${j.firstname ?? ''} ${j.lastname ?? ''}`.trim() || j.username;
            return (
              <tr key={j.id}>
                <td className={styles.attendTd}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{name}</span>
                </td>
                {sorted.map(ev => {
                  const att = isAttended(ev.id, j.id);
                  return (
                    <td key={ev.id} className={styles.attendTd} style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleMark(ev.id, j.id)}
                        title={att ? 'Был · нажмите чтобы отменить' : 'Не был · нажмите чтобы отметить'}
                        style={{
                          width: 28, height: 28, borderRadius: '50%',
                          border: '1px solid',
                          borderColor: att ? 'var(--color-success-bright)' : 'var(--border-color)',
                          background: att ? 'rgba(61,189,106,0.12)' : 'transparent',
                          color: att ? 'var(--color-success-bright)' : 'var(--text-muted)',
                          cursor: 'pointer', fontSize: 14,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {att ? '✓' : '–'}
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {juniors.length === 0 && (
            <tr>
              <td className={styles.attendTd} colSpan={sorted.length + 1} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                Нет Участник проектаов
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HR: full page with tabs
// ─────────────────────────────────────────────────────────────────────────────

type HrTab = 'tasks' | 'tests' | 'personal' | 'achievements' | 'events';

const HR_TABS: { key: HrTab; label: string }[] = [
  { key: 'tasks',        label: 'Задачи' },
  { key: 'tests',        label: 'Тесты' },
  { key: 'personal',     label: 'Личные достижения' },
  { key: 'achievements', label: 'Достижения' },
  { key: 'events',       label: 'Мероприятия' },
];

function HrPointsPage() {
  const [tab, setTab] = useState<HrTab>('tasks');
  const { data: assignments = [] } = useChallengeJuniors();
  const { data: activities = [] } = useActivities();
  const pendingTasks    = assignments.filter(a => a.progress === 'DONE' && a.awarded_points == null).length;
  const pendingPersonal = activities.filter(a => a.type === 'achievement' && a.status === 'pending').length;

  return (
    <>
      <PageHeader
        title="Управление баллами"
        showBack
        subtitle={`${pendingTasks + pendingPersonal} ожидают проверки`}
      />
      <div className={styles.page}>
        <div className={styles.tabs}>
          {HR_TABS.map(t => {
            const badge = t.key === 'tasks' ? pendingTasks : t.key === 'personal' ? pendingPersonal : 0;
            return (
              <button
                key={t.key}
                className={[styles.tab, tab === t.key ? styles.tabActive : ''].join(' ')}
                onClick={() => setTab(t.key)}
              >
                {t.label}
                {badge > 0 && <span className={styles.tabBadge}>{badge}</span>}
              </button>
            );
          })}
        </div>

        {tab === 'tasks'        && <TasksTab />}
        {tab === 'tests'        && <TestsTab />}
        {tab === 'personal'     && <PersonalTab />}
        {tab === 'achievements' && <AchievementsTab />}
        {tab === 'events'       && <EventsTab />}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HiPo: "Мои достижения"
// ─────────────────────────────────────────────────────────────────────────────

function HiPoAchievementsPage() {
  const user = useAuthStore((s) => s.user)!;
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', achievedDate: '', linkInput: '', links: [] as string[] });
  const [filter, setFilter] = useState<'all' | ActivityStatus>('all');

  const { data: activities = [] } = useActivities({ user_id: user.id });
  const createActivity = useCreateActivity();
  const deleteActivity = useDeleteActivity();

  const filtered = filter === 'all' ? activities : activities.filter(a => a.status === filter);
  const pendingCount = activities.filter(a => a.status === 'pending').length;

  function addLink() {
    const trimmed = form.linkInput.trim();
    if (!trimmed || form.links.includes(trimmed)) return;
    setForm(p => ({ ...p, links: [...p.links, trimmed], linkInput: '' }));
  }

  function removeLink(url: string) {
    setForm(p => ({ ...p, links: p.links.filter(l => l !== url) }));
  }

  async function handleCreate() {
    if (!form.title.trim()) return;
    await createActivity.mutateAsync({
      user_id: user.id,
      title: form.title,
      description: form.description,
      requested_points: 0,
      activity_type: 'achievement',
      links: form.links.length ? form.links : undefined,
      achieved_date: form.achievedDate || undefined,
    });
    setAddModal(false);
    setForm({ title: '', description: '', achievedDate: '', linkInput: '', links: [] });
  }

  const FILTERS: { key: 'all' | ActivityStatus; label: string }[] = [
    { key: 'all',      label: 'Все' },
    { key: 'pending',  label: `На проверке${pendingCount ? ` (${pendingCount})` : ''}` },
    { key: 'approved', label: 'Одобрено' },
    { key: 'revision', label: 'На доработку' },
    { key: 'rejected', label: 'Отклонено' },
  ];

  return (
    <>
      <PageHeader
        title="Мои достижения"
        showBack
        subtitle={`${activities.length} отправлено`}
      />
      <div className={styles.page}>
        <Button full style={{ marginBottom: 'var(--space-4)' }} onClick={() => setAddModal(true)}>
          + Добавить достижение
        </Button>

        <div className={styles.filters}>
          {FILTERS.map(f => (
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
            {filtered.map(a => (
              <div key={a.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <p className={styles.cardTitle}>{a.title}</p>
                  <span className={[styles.statusBadge, styles[a.status]].join(' ')}>
                    {STATUS_LABEL[a.status]}
                  </span>
                </div>

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

                {a.status === 'approved' && a.awardedPoints != null && (
                  <p className={styles.points}>
                    <CheckCircle size={13} style={{ display: 'inline', marginRight: 4, color: 'var(--color-success-bright)' }} />
                    +{a.awardedPoints} баллов
                  </p>
                )}

                {a.reviewNote && (
                  <p className={styles.note}>💬 {a.reviewNote}</p>
                )}

                {a.status === 'pending' && (
                  <div className={styles.actions}>
                    <Button size="sm" variant="danger" onClick={() => deleteActivity.mutate(a.id)}>
                      Удалить
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {addModal && (
        <Modal open={true} onClose={() => setAddModal(false)} title="Добавить достижение" type="dialog">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input
              label="Название *"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            />
            <Input
              label="Описание"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            />
            <DateInput
              label="Дата получения"
              value={form.achievedDate}
              onChange={date => setForm(p => ({ ...p, achievedDate: date }))}
            />

            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Ссылки</p>
              <div className={styles.linkInputRow}>
                <input
                  type="url"
                  className={styles.linkInput}
                  placeholder="https://..."
                  value={form.linkInput}
                  onChange={e => setForm(p => ({ ...p, linkInput: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addLink()}
                />
                <button className={styles.linkAddBtn} onClick={addLink}><Plus size={16} /></button>
              </div>
              {form.links.length > 0 && (
                <div className={styles.addedLinks} style={{ marginTop: 6 }}>
                  {form.links.map(url => (
                    <div key={url} className={styles.addedLink}>
                      <Link2 size={11} />
                      <span className={styles.addedLinkUrl}>{url}</span>
                      <button className={styles.linkRemoveBtn} onClick={() => removeLink(url)}><X size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button full onClick={handleCreate} disabled={createActivity.isPending || !form.title.trim()}>
              {createActivity.isPending ? 'Отправка...' : 'Отправить на проверку'}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────────

export function PointsPage() {
  const user = useAuthStore((s) => s.user)!;
  return user.role === 'HR' ? <HrPointsPage /> : <HiPoAchievementsPage />;
}
