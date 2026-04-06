import { useNavigate } from 'react-router-dom';
import { format, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Bell, ChevronRight, Zap, Trophy, Users, Link2, Calendar, Settings } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { useAuthStore } from '@modules/auth/store/authStore';
import {
  useChallenges, useChallengeJuniors, useMentorJuniors, useNotifications,
  useCalendarEvents, useUserAchievementsWithStatus, useUsers, useUserPoints,
  useQuizResults, useActivities,
} from '@shared/hooks/useApi';
import { ChallengeCard } from '@modules/challenges/components/ChallengeCard';
import { UserCard } from '@modules/users/components/UserCard';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import styles from './DashboardPage.module.css';

function greetByTime(): string {
  const h = new Date().getHours();
  if (h < 6) return 'Доброй ночи,';
  if (h < 12) return 'Доброе утро,';
  if (h < 18) return 'Добрый день,';
  return 'Добрый вечер,';
}

// ── Shared: bell button ──────────────────────────────────────────────────────
function BellButton({ unread, onClick }: { unread: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 8 }}
    >
      <Bell size={22} />
      {unread > 0 && (
        <span style={{
          position: 'absolute', top: 4, right: 4, width: 8, height: 8,
          background: 'var(--accent-red)', borderRadius: '50%',
          border: '1.5px solid var(--bg-base)',
        }} />
      )}
    </button>
  );
}

// ── Shared: greeting ─────────────────────────────────────────────────────────
function Greeting({ greeting, firstName, role, dateLabel }: { greeting: string; firstName: string; role: string; dateLabel: string }) {
  return (
    <div className={styles.greeting}>
      <p className={styles.greetingDate}>{dateLabel}</p>
      <h1 className={styles.greetingName}>
        {greeting} <span className={styles.greetingAccent}>{firstName}</span>
      </h1>
      <p className={styles.greetingRole}>{role}</p>
    </div>
  );
}

// ── Shared: today events strip ───────────────────────────────────────────────
const EVENT_ICON: Record<string, string> = { challenge: '⚡', meeting: '👥', deadline: '🚨' };

function TodayStrip({ events, onCalendar }: { events: { id: number; title: string; type: string; description?: string }[]; onCalendar: () => void }) {
  if (events.length === 0) return null;
  return (
    <div className={styles.todayStrip}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionLabel}>Сегодня</span>
        <button className={styles.seeAll} onClick={onCalendar}>
          Календарь <ChevronRight size={13} />
        </button>
      </div>
      <div className={styles.todayList}>
        {events.slice(0, 3).map((ev) => (
          <div key={ev.id} className={styles.todayItem}>
            <span className={styles.todayIcon}>{EVENT_ICON[ev.type] ?? '📅'}</span>
            <span className={styles.todayTitle}>{ev.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Router ───────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const user = useAuthStore((s) => s.user)!;
  const navigate = useNavigate();
  const today = new Date();
  const dateLabel = format(today, 'EEEE, d MMMM', { locale: ru });
  const greeting = greetByTime();
  const firstName = user.firstname ?? user.username;

  if (user.role === 'JUNIOR') return <JuniorDashboard userId={user.id} firstName={firstName} greeting={greeting} dateLabel={dateLabel} navigate={navigate} />;
  if (user.role === 'MENTOR') return <MentorDashboard userId={user.id} firstName={firstName} greeting={greeting} dateLabel={dateLabel} navigate={navigate} />;
  return <HrDashboard firstName={firstName} greeting={greeting} dateLabel={dateLabel} navigate={navigate} />;
}

// ===== JUNIOR ================================================================
function JuniorDashboard({ userId, firstName, greeting, dateLabel, navigate }: { userId: number; firstName: string; greeting: string; dateLabel: string; navigate: ReturnType<typeof useNavigate> }) {
  const { data: challenges = [] } = useChallenges();
  const { data: assignments = [] } = useChallengeJuniors({ junior_id: userId });
  const { data: events = [] } = useCalendarEvents();
  const { data: notifications = [] } = useNotifications(userId);
  const { data: achievements = [] } = useUserAchievementsWithStatus(userId);
  const { data: pts } = useUserPoints(userId);
  const { data: quizResults = [] } = useQuizResults({ user_id: userId });

  const unread = notifications.filter((n) => !n.is_read).length;
  const todayEvents = events.filter((e) => isToday(new Date(e.date)));

  const enriched = assignments
    .map((a) => {
      const ch = challenges.find((c) => c.id === a.challenge_id);
      return ch ? { ...ch, progress: a.progress } : null;
    })
    .filter(Boolean) as (typeof challenges[number] & { progress: typeof assignments[number]['progress'] })[];

  const done = enriched.filter((c) => c.progress === 'DONE').length;
  const total = enriched.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const earnedXp = achievements.filter((a) => a.earned).reduce((s, a) => s + a.xp, 0);
  const activeChallenges = enriched.filter((c) => c.progress === 'IN_PROGRESS' || c.progress === 'GOING');

  return (
    <>
      <PageHeader
        title="Главная"
        actions={<BellButton unread={unread} onClick={() => navigate('/notifications')} />}
      />
      <div className={styles.page}>
        <Greeting greeting={greeting} firstName={firstName} role="HiPo · Программа наставничества" dateLabel={dateLabel} />

        <TodayStrip events={todayEvents} onCalendar={() => navigate('/calendar')} />

        {/* Progress widget */}
        <div className={styles.progressCard}>
          <div className={styles.progressCardLeft}>
            <span className={styles.progressBig}>{pct}%</span>
            <span className={styles.progressSub}>программы пройдено</span>
            <div className={styles.progressMini}>
              <div className={styles.progressMiniFill} style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className={styles.progressCardRight}>
            <div className={styles.progressStat}>
              <span className={styles.progressStatVal}>{done}/{total}</span>
              <span className={styles.progressStatLabel}>задач</span>
            </div>
            <div className={styles.progressStat}>
              <span className={styles.progressStatVal}>{earnedXp}</span>
              <span className={styles.progressStatLabel}>XP</span>
            </div>
            <div className={styles.progressStat}>
              <span className={styles.progressStatVal}>{quizResults.length}</span>
              <span className={styles.progressStatLabel}>тестов</span>
            </div>
            <div className={styles.progressStat}>
              <span className={styles.progressStatVal}>{pts?.level ?? '—'}</span>
              <span className={styles.progressStatLabel}>уровень</span>
            </div>
          </div>
        </div>

        {/* Active challenges — max 3 */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Мои задачи</span>
            <button className={styles.seeAll} onClick={() => navigate('/challenges')}>
              Все <ChevronRight size={13} />
            </button>
          </div>
          {activeChallenges.length === 0 ? (
            <div className={styles.empty}>Все задачи выполнены 🎉</div>
          ) : (
            <div className={styles.list}>
              {activeChallenges.slice(0, 3).map((c) => (
                <ChallengeCard key={c.id} challenge={c} showProgress onClick={() => navigate(`/challenges/${c.id}`)} />
              ))}
            </div>
          )}
        </div>

        {/* Leaderboard teaser */}
        {pts && (
          <div className={styles.leaderRow} onClick={() => navigate('/leaderboard')}>
            <Trophy size={16} style={{ color: 'var(--accent-yellow)', flexShrink: 0 }} />
            <span className={styles.leaderText}>
              {pts.levelName} · {pts.totalPoints} баллов · до следующего уровня {pts.pointsToNextLevel}
            </span>
            <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </div>
        )}
      </div>
    </>
  );
}

// ===== MENTOR ================================================================
function MentorDashboard({ userId, firstName, greeting, dateLabel, navigate }: { userId: number; firstName: string; greeting: string; dateLabel: string; navigate: ReturnType<typeof useNavigate> }) {
  const { data: pairs = [] } = useMentorJuniors({ mentor_id: userId });
  const { data: allUsers = [] } = useUsers();
  const { data: notifications = [] } = useNotifications(userId);
  const { data: allAssignments = [] } = useChallengeJuniors();
  const { data: events = [] } = useCalendarEvents();

  const juniors = pairs.map((p) => allUsers.find((u) => u.id === p.junior_id)).filter(Boolean) as typeof allUsers;
  const unread = notifications.filter((n) => !n.is_read).length;
  const todayEvents = events.filter((e) => isToday(new Date(e.date)));

  const juniorIds = juniors.map((j) => j.id);
  const doneCount = allAssignments.filter((cj) => juniorIds.includes(cj.junior_id) && cj.progress === 'DONE').length;
  const totalCount = allAssignments.filter((cj) => juniorIds.includes(cj.junior_id)).length;

  // Juniors who haven't done anything yet — need attention
  const needAttention = juniors.filter((j) => {
    const ja = allAssignments.filter((a) => a.junior_id === j.id);
    return ja.length === 0 || ja.every((a) => a.progress === 'GOING');
  });

  return (
    <>
      <PageHeader
        title="Главная"
        actions={<BellButton unread={unread} onClick={() => navigate('/notifications')} />}
      />
      <div className={styles.page}>
        <Greeting greeting={greeting} firstName={firstName} role="Ментор · Программа наставничества" dateLabel={dateLabel} />

        {/* Quick stats — inline, compact */}
        <div className={styles.statsRow}>
          <div className={styles.statPill} onClick={() => navigate('/juniors')}>
            <span className={styles.statPillVal}>{juniors.length}</span>
            <span className={styles.statPillLabel}>HiPo</span>
          </div>
          <div className={styles.statPill}>
            <span className={styles.statPillVal}>{doneCount}/{totalCount}</span>
            <span className={styles.statPillLabel}>задач выполнено</span>
          </div>
          {unread > 0 && (
            <div className={styles.statPill} onClick={() => navigate('/notifications')}>
              <span className={styles.statPillVal} style={{ color: 'var(--accent-red-bright)' }}>{unread}</span>
              <span className={styles.statPillLabel}>уведомлений</span>
            </div>
          )}
        </div>

        <TodayStrip events={todayEvents} onCalendar={() => navigate('/calendar')} />

        {/* Attention needed */}
        {needAttention.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel} style={{ color: 'var(--accent-orange-bright)' }}>
                ⚠ Требуют внимания
              </span>
            </div>
            <div className={styles.list}>
              {needAttention.slice(0, 3).map((j) => (
                <UserCard key={j.id} user={j} onClick={() => navigate('/juniors')} />
              ))}
            </div>
          </div>
        )}

        {/* All juniors */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Мои HiPo</span>
            <button className={styles.seeAll} onClick={() => navigate('/juniors')}>
              Все <ChevronRight size={13} />
            </button>
          </div>
          {juniors.length === 0 ? (
            <div className={styles.empty}>HiPo ещё не назначены</div>
          ) : (
            <div className={styles.list}>
              {juniors.slice(0, 3).map((j) => (
                <UserCard key={j.id} user={j} onClick={() => navigate('/juniors')} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Chart colour palette (matches design tokens) ─────────────────────────────
const C = {
  red:    '#cc0000',
  orange: '#e05c00',
  blue:   '#1a6aaa',
  green:  '#2d8a4e',
  gray:   '#5a5a6a',
  yellow: '#b8860b',
};

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  fontSize: 12,
};

// ===== HR ====================================================================
function HrDashboard({ firstName, greeting, dateLabel, navigate }: { firstName: string; greeting: string; dateLabel: string; navigate: ReturnType<typeof useNavigate> }) {
  const { data: allUsers = [] } = useUsers();
  const { data: pairs = [] } = useMentorJuniors();
  const { data: challenges = [] } = useChallenges();
  const { data: allAssignments = [] } = useChallengeJuniors();
  const { data: activities = [] } = useActivities();

  const juniors = allUsers.filter((u) => u.role === 'JUNIOR');
  const mentors = allUsers.filter((u) => u.role === 'MENTOR');
  const hrs = allUsers.filter((u) => u.role === 'HR');
  const activeChallenges = challenges.filter((c) => c.status === 'ACTIVE').length;
  const pendingActivities = activities.filter((a) => a.status === 'pending').length;

  // ── Chart 1: role distribution donut ──────────────────────────────────────
  const roleData = [
    { name: 'HiPo',    value: juniors.length, color: C.red },
    { name: 'Менторы', value: mentors.length,  color: C.blue },
    { name: 'HR',      value: hrs.length,      color: C.gray },
  ].filter((d) => d.value > 0);

  // ── Chart 2: task status breakdown pie ────────────────────────────────────
  const going     = allAssignments.filter((a) => a.progress === 'GOING').length;
  const inProg    = allAssignments.filter((a) => a.progress === 'IN_PROGRESS').length;
  const done      = allAssignments.filter((a) => a.progress === 'DONE').length;
  const skipped   = allAssignments.filter((a) => a.progress === 'SKIPPED').length;
  const statusData = [
    { name: 'Не начаты',   value: going,   color: C.gray },
    { name: 'В процессе',  value: inProg,  color: C.orange },
    { name: 'Выполнены',   value: done,    color: C.green },
    { name: 'Пропущены',   value: skipped, color: C.red },
  ].filter((d) => d.value > 0);

  // ── Chart 3: top-8 HiPo bar chart ─────────────────────────────────────────
  const juniorStats = juniors.map((u) => {
    const ja = allAssignments.filter((a) => a.junior_id === u.id);
    const doneCount = ja.filter((a) => a.progress === 'DONE').length;
    const pct = ja.length > 0 ? Math.round((doneCount / ja.length) * 100) : 0;
    const name = (u.firstname ?? u.username).slice(0, 8);
    return { name, pct, total: ja.length };
  }).sort((a, b) => b.pct - a.pct).slice(0, 8);

  const quickLinks = [
    { icon: <Users size={18} />,    cls: styles.qlBlue,   label: 'Пользователи', sub: `${allUsers.length} чел.`,       to: '/users' },
    { icon: <Zap size={18} />,      cls: styles.qlOrange, label: 'Задачи',       sub: `${activeChallenges} активных`,  to: '/challenges' },
    { icon: <Link2 size={18} />,    cls: styles.qlGreen,  label: 'Пары',         sub: `${pairs.length} назначено`,     to: '/mentorships' },
    { icon: <Calendar size={18} />, cls: styles.qlRed,    label: 'Посещаемость', sub: 'Мероприятия',                   to: '/attendance' },
    { icon: <Settings size={18} />, cls: styles.qlGray,   label: 'Админ',        sub: 'Панель управления',             to: '/admin' },
  ];

  return (
    <>
      <PageHeader title="Главная" />
      <div className={styles.page}>
        <Greeting greeting={greeting} firstName={firstName} role="HR · Управление программой" dateLabel={dateLabel} />

        {/* Stats row */}
        <div className={styles.statsRow}>
          <div className={styles.statPill}>
            <span className={styles.statPillVal}>{allUsers.length}</span>
            <span className={styles.statPillLabel}>участников</span>
          </div>
          <div className={styles.statPill}>
            <span className={styles.statPillVal}>{mentors.length}</span>
            <span className={styles.statPillLabel}>менторов</span>
          </div>
          <div className={styles.statPill}>
            <span className={styles.statPillVal}>{juniors.length}</span>
            <span className={styles.statPillLabel}>HiPo</span>
          </div>
          <div className={styles.statPill}>
            <span className={styles.statPillVal}>{pairs.length}</span>
            <span className={styles.statPillLabel}>пар</span>
          </div>
          {pendingActivities > 0 && (
            <div className={styles.statPill} style={{ borderColor: 'var(--accent-orange-bright)' }}>
              <span className={styles.statPillVal} style={{ color: 'var(--accent-orange-bright)' }}>{pendingActivities}</span>
              <span className={styles.statPillLabel}>на проверке</span>
            </div>
          )}
        </div>

        {/* Charts row */}
        <div className={styles.chartsRow}>
          {/* Donut — role distribution */}
          <div className={styles.chartCard}>
            <p className={styles.chartTitle}>Состав программы</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={roleData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} dataKey="value" paddingAngle={3}>
                  {roleData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, n) => [v ?? 0, n]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Pie — task status */}
          <div className={styles.chartCard}>
            <p className={styles.chartTitle}>Статусы задач</p>
            {statusData.length === 0 ? (
              <div className={styles.chartEmpty}>Нет назначенных задач</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={72} dataKey="value" paddingAngle={3}>
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, n) => [v ?? 0, n]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bar chart — HiPo completion */}
        <div className={`${styles.chartCard} ${styles.chartCardFull}`}>
          <div className={styles.sectionHeader}>
            <p className={styles.chartTitle}>Выполнение задач HiPo, %</p>
            <button className={styles.seeAll} onClick={() => navigate('/users')}>
              Все <ChevronRight size={13} />
            </button>
          </div>
          {juniorStats.length === 0 ? (
            <div className={styles.chartEmpty}>Нет данных по HiPo</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={juniorStats} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v) => [`${v ?? 0}%`, 'Выполнено']}
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                />
                <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                  {juniorStats.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.pct >= 70 ? C.green : entry.pct >= 30 ? C.orange : C.red}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick links grid */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Управление</span>
          </div>
          <div className={styles.quickGrid}>
            {quickLinks.map((ql) => (
              <div key={ql.to} className={styles.quickCard} onClick={() => navigate(ql.to)}>
                <span className={`${styles.quickIcon} ${ql.cls}`}>{ql.icon}</span>
                <p className={styles.quickLabel}>{ql.label}</p>
                <p className={styles.quickSub}>{ql.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
