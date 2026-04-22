import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Users, Zap, Link2, ChevronRight, Trophy, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@modules/auth/store/authStore';
import {
  useChallenges, useChallengeJuniors, useMentorJuniors,
  useCalendarEvents, useUserAchievementsWithStatus, useUsers, useUserPoints,
  useQuizResults,
} from '@shared/hooks/useApi';
import { ChallengeCard } from '@modules/challenges/components/ChallengeCard';
import { UserCard } from '@modules/users/components/UserCard';
import { AchievementList } from '@modules/achievements/components/AchievementCard';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { HRCharts } from '@modules/charts/HRCharts';
import { UserProfileModal } from '@pages/UsersPage/UsersPage';
import type { User } from '@shared/types';
import { HiPoProgressChart } from '@modules/charts/HiPoProgressChart';
import styles from './DashboardPage.module.css';

function greetByTime(): string {
  const h = new Date().getHours();
  if (h < 6) return 'Доброй ночи,';
  if (h < 12) return 'Доброе утро,';
  if (h < 18) return 'Добрый день,';
  return 'Добрый вечер,';
}

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

// ===== JUNIOR =====
function JuniorDashboard({ userId, firstName, greeting, dateLabel, navigate }: { userId: number; firstName: string; greeting: string; dateLabel: string; navigate: ReturnType<typeof useNavigate> }) {
  const { data: challenges = [] } = useChallenges();
  const { data: assignments = [] } = useChallengeJuniors({ junior_id: userId });
  const { data: events = [] } = useCalendarEvents();
  const { data: achievements = [] } = useUserAchievementsWithStatus(userId);
  const { data: pts } = useUserPoints(userId);
  const { data: quizResults = [] } = useQuizResults({ user_id: userId });

  const todayEvents = events.filter((e) => isToday(new Date(e.date)));

  // Enrich assignments with challenge data
  const enriched = assignments.map((a) => {
    const challenge = challenges.find((c) => c.id === a.challenge_id);
    if (!challenge) return null;
    return { ...challenge, progress: a.progress };
  }).filter(Boolean) as (typeof challenges[number] & { progress: typeof assignments[number]['progress'] })[];

  const done = enriched.filter((c) => c.progress === 'DONE').length;
  const inProgress = enriched.filter((c) => c.progress === 'IN_PROGRESS').length;
  const total = enriched.length;
  const progressPercent = total > 0 ? Math.round((done / total) * 100) : 0;

  const activeChallenges = enriched.filter((c) => c.progress === 'IN_PROGRESS' || c.progress === 'GOING');
  const earnedAchievements = achievements.filter((a) => a.earned);
  const totalPoints = pts?.totalPoints ?? earnedAchievements.reduce((sum, a) => sum + a.xp, 0);

  return (
    <>
      <PageHeader title="Главная" />
      <div className={styles.page}>
        <div className={styles.greeting}>
          <p className={styles.greetingDate}>{dateLabel}</p>
          <h1 className={styles.greetingName}>
            {greeting} <span className={styles.greetingAccent}>{firstName}</span>
          </h1>
          <p className={styles.greetingRole}>Участник проекта ОКД</p>
        </div>

        <div className={styles.todaySection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Сегодня</h2>
            <a className={styles.seeAll} onClick={() => navigate('/calendar')}>
              Календарь <ChevronRight size={14} />
            </a>
          </div>
          {todayEvents.length === 0 ? (
            <div className={styles.todayEmpty}>Сегодня событий нет 🎉</div>
          ) : (
            <div className={styles.list}>
              {todayEvents.map((event) => (
                <div
                  key={event.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)', borderRadius: 10,
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate('/calendar')}
                >
                  <span style={{ fontSize: 20 }}>
                    {event.type === 'challenge' ? '⚡' : event.type === 'meeting' ? '👥' : '🚨'}
                  </span>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{event.title}</p>
                    {event.description && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{event.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard} style={{ cursor: 'pointer' }} onClick={() => navigate('/challenges')}>
            <span className={`${styles.statValue} ${styles.statValueAccent}`}>{total}</span>
            <span className={styles.statLabel}>Всего задач</span>
          </div>
          <div className={styles.statCard} style={{ cursor: 'pointer' }} onClick={() => navigate('/challenges')}>
            <span className={`${styles.statValue} ${styles.statValueGreen}`}>{done}</span>
            <span className={styles.statLabel}>Выполнено</span>
          </div>
          <div className={styles.statCard} style={{ cursor: 'pointer' }} onClick={() => navigate('/challenges')}>
            <span className={`${styles.statValue} ${styles.statValueOrange}`}>{inProgress}</span>
            <span className={styles.statLabel}>В процессе</span>
          </div>
          <div className={styles.statCard} style={{ cursor: 'pointer' }} onClick={() => navigate('/points')}>
            <span className={`${styles.statValue} ${styles.statValueYellow}`}>{totalPoints}</span>
            <span className={styles.statLabel}>Баллов набрано</span>
          </div>
        </div>

        <HiPoProgressChart
          done={done}
          total={total}
          completionRate={progressPercent}
          quizCount={quizResults.length}
          points={pts?.totalPoints ?? 0}
        />

        <div style={{ marginBottom: 24 }}>
          <div className={styles.progressWrap}>
            <div className={styles.progressBar} style={{ width: `${progressPercent}%` }} />
          </div>
          <div className={styles.progressLabel}>
            <span>Прогресс программы</span>
            <span>{progressPercent}%</span>
          </div>
        </div>

        <div className={styles.recentSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Мои задачи</h2>
            <a className={styles.seeAll} onClick={() => navigate('/challenges')}>
              Все <ChevronRight size={14} />
            </a>
          </div>
          <div className={styles.list}>
            {activeChallenges.slice(0, 3).map((c) => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                showProgress
                onClick={() => navigate(`/challenges/${c.id}`)}
              />
            ))}
            {activeChallenges.length === 0 && (
              <div className={styles.todayEmpty}>Все задачи выполнены! 🎉</div>
            )}
          </div>
        </div>

        <div className={styles.recentSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Trophy size={16} style={{ color: 'var(--accent-yellow)', marginRight: 6, verticalAlign: 'middle' }} />
              Достижения
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {earnedAchievements.length}/{achievements.length} открыто
              </span>
              <a className={styles.seeAll} onClick={() => navigate('/points')}>
                + Добавить <ChevronRight size={14} />
              </a>
            </div>
          </div>
          <AchievementList achievements={achievements} />
        </div>
      </div>
    </>
  );
}

// ===== MENTOR =====
function MentorDashboard({ userId, firstName, greeting, dateLabel, navigate }: { userId: number; firstName: string; greeting: string; dateLabel: string; navigate: ReturnType<typeof useNavigate> }) {
  const { data: pairs = [] } = useMentorJuniors({ mentor_id: userId });
  const { data: allUsers = [] } = useUsers();
  const { data: allAssignments = [] } = useChallengeJuniors();

  const juniors = pairs.map((p) => allUsers.find((u) => u.id === p.junior_id)).filter(Boolean) as typeof allUsers;

  const juniorIds = juniors.map((j) => j.id);
  const totalAssignments = allAssignments.filter((cj) => juniorIds.includes(cj.junior_id)).length;
  const doneAssignments = allAssignments.filter((cj) => juniorIds.includes(cj.junior_id) && cj.progress === 'DONE').length;

  return (
    <>
      <PageHeader title="Главная" />
      <div className={styles.page}>
        <div className={styles.greeting}>
          <p className={styles.greetingDate}>{dateLabel}</p>
          <h1 className={styles.greetingName}>
            {greeting} <span className={styles.greetingAccent}>{firstName}</span>
          </h1>
          <p className={styles.greetingRole}>Ментор</p>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard} style={{ cursor: 'pointer' }} onClick={() => navigate('/juniors')}>
            <span className={`${styles.statValue} ${styles.statValueAccent}`}>{juniors.length}</span>
            <span className={styles.statLabel}>Подопечных</span>
          </div>
          <div className={styles.statCard}>
            <span className={`${styles.statValue} ${styles.statValueOrange}`}>{totalAssignments}</span>
            <span className={styles.statLabel}>Назначено задач</span>
          </div>
          <div className={styles.statCard}>
            <span className={`${styles.statValue} ${styles.statValueGreen}`}>{doneAssignments}</span>
            <span className={styles.statLabel}>Выполнено</span>
          </div>
          <div className={styles.statCard} style={{ cursor: 'pointer' }} onClick={() => navigate('/challenges')}>
            <span className={`${styles.statValue} ${styles.statValueBlue}`}>{totalAssignments - doneAssignments}</span>
            <span className={styles.statLabel}>В работе</span>
          </div>
        </div>

        <div className={styles.quickActions}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Навигация</h2>
          </div>
          {[
            { icon: <Users size={20} />, iconClass: styles.actionIconBlue, title: 'Подопечные в проекте', sub: `${juniors.length} участника`, to: '/juniors' },
            { icon: <Zap size={20} />, iconClass: styles.actionIconOrange, title: 'Все задачи', sub: 'Просмотр и назначение', to: '/challenges' },
          ].map((item) => (
            <div key={item.to} className={styles.actionItem} onClick={() => navigate(item.to)}>
              <span className={`${styles.actionIcon} ${item.iconClass}`}>{item.icon}</span>
              <span className={styles.actionText}>
                <p className={styles.actionTitle}>{item.title}</p>
                <p className={styles.actionSubtitle}>{item.sub}</p>
              </span>
              <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
            </div>
          ))}
        </div>

        <div className={styles.recentSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Подопечные в проекте</h2>
            <a className={styles.seeAll} onClick={() => navigate('/juniors')}>
              Все <ChevronRight size={14} />
            </a>
          </div>
          <div className={styles.list}>
            {juniors.slice(0, 3).map((junior) => (
              <UserCard key={junior.id} user={junior} onClick={() => navigate(`/juniors/${junior.id}`)} />
            ))}
            {juniors.length === 0 && (
              <div className={styles.todayEmpty}>Подопечные ещё не назначены</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ===== HR =====
function HrDashboard({ firstName, greeting, dateLabel, navigate }: { firstName: string; greeting: string; dateLabel: string; navigate: ReturnType<typeof useNavigate> }) {
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const { data: allUsers = [] } = useUsers();
  const { data: pairs = [] } = useMentorJuniors();
  const { data: challenges = [] } = useChallenges();
  const { data: allAssignments = [] } = useChallengeJuniors();

  const totalUsers = allUsers.length;
  const activeUsers = allUsers.filter((u) => u.is_active).length;
  const mentors = allUsers.filter((u) => u.role === 'MENTOR').length;
  const juniors = allUsers.filter((u) => u.role === 'JUNIOR').length;
  const pairsCount = pairs.length;
  const activeChallengesCount = challenges.filter((c) => c.status === 'ACTIVE').length;

  // Compute junior activity stats from assignments
  const juniorUsers = allUsers.filter((u) => u.role === 'JUNIOR');
  const activityStats = juniorUsers.map((u) => {
    const userAssignments = allAssignments.filter((a) => a.junior_id === u.id);
    const done = userAssignments.filter((a) => a.progress === 'DONE').length;
    const inProgress = userAssignments.filter((a) => a.progress === 'IN_PROGRESS').length;
    const going = userAssignments.filter((a) => a.progress === 'GOING').length;
    const skipped = userAssignments.filter((a) => a.progress === 'SKIPPED').length;
    const total = userAssignments.length;
    return { userId: u.id, totalChallenges: total, done, inProgress, going, skipped, completionRate: total > 0 ? Math.round((done / total) * 100) : 0 };
  }).sort((a, b) => b.completionRate - a.completionRate);

  return (
    <>
      <PageHeader title="Главная" />
      <div className={styles.page}>
        <div className={styles.greeting}>
          <p className={styles.greetingDate}>{dateLabel}</p>
          <h1 className={styles.greetingName}>
            {greeting} <span className={styles.greetingAccent}>{firstName}</span>
          </h1>
          <p className={styles.greetingRole}>Администратор</p>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard} style={{ cursor: 'pointer' }} onClick={() => navigate('/users')}>
            <span className={`${styles.statValue} ${styles.statValueAccent}`}>{totalUsers}</span>
            <span className={styles.statLabel}>Всего людей</span>
          </div>
          <div className={styles.statCard} style={{ cursor: 'pointer' }} onClick={() => navigate('/users')}>
            <span className={`${styles.statValue} ${styles.statValueGreen}`}>{activeUsers}</span>
            <span className={styles.statLabel}>Активных</span>
          </div>
          <div className={styles.statCard} style={{ cursor: 'pointer' }} onClick={() => navigate('/users')}>
            <span className={`${styles.statValue} ${styles.statValueBlue}`}>{mentors}</span>
            <span className={styles.statLabel}>Менторов</span>
          </div>
          <div className={styles.statCard} style={{ cursor: 'pointer' }} onClick={() => navigate('/users')}>
            <span className={`${styles.statValue} ${styles.statValueOrange}`}>{juniors}</span>
            <span className={styles.statLabel}>Участников</span>
          </div>
        </div>

        <div className={styles.quickActions}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Управление</h2>
          </div>
          {[
            { icon: <Users size={20} />, iconClass: styles.actionIconBlue,   title: 'Пользователи', sub: `${totalUsers} человек`, to: '/users' },
            { icon: <Zap size={20} />,   iconClass: styles.actionIconOrange,  title: 'Задачи', sub: `${activeChallengesCount} активных`, to: '/challenges' },
            { icon: <Link2 size={20} />, iconClass: styles.actionIconGreen,   title: 'Пары ментор — участник', sub: `${pairsCount} назначено`, to: '/mentorships' },
            { icon: <TrendingUp size={20} />, iconClass: styles.actionIconRed, title: 'Активность участников', sub: 'Прогресс и статистика', to: '/points' },
          ].map((item) => (
            <div key={item.title} className={styles.actionItem} onClick={() => navigate(item.to)}>
              <span className={`${styles.actionIcon} ${item.iconClass}`}>{item.icon}</span>
              <span className={styles.actionText}>
                <p className={styles.actionTitle}>{item.title}</p>
                <p className={styles.actionSubtitle}>{item.sub}</p>
              </span>
              <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
            </div>
          ))}
        </div>

        <div className={styles.recentSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <TrendingUp size={16} style={{ color: 'var(--color-success-bright)', marginRight: 6, verticalAlign: 'middle' }} />
              Аналитика
            </h2>
          </div>
          <HRCharts />
        </div>

        <div className={styles.recentSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <TrendingUp size={16} style={{ color: 'var(--color-success-bright)', marginRight: 6, verticalAlign: 'middle' }} />
              Активность участников
            </h2>
          </div>
          <div className={styles.list}>
            {activityStats.map((stat, idx) => {
              const junior = allUsers.find((u) => u.id === stat.userId);
              if (!junior) return null;
              const isTop = idx === 0;
              const name = `${junior.firstname ?? ''} ${junior.lastname ?? ''}`.trim() || junior.username;
              return (
                <div key={stat.userId} className={styles.activityCard} onClick={() => setProfileUser(junior)} style={{ cursor: 'pointer' }}>
                  <div className={styles.activityHeader}>
                    <div className={styles.activityAvatar} style={{ background: isTop ? 'rgba(245,197,24,0.15)' : 'var(--bg-elevated)', borderColor: isTop ? 'rgba(245,197,24,0.4)' : 'var(--border-subtle)' }}>
                      {(junior.firstname?.[0] ?? junior.username[0]).toUpperCase()}
                    </div>
                    <div className={styles.activityInfo}>
                      <span className={styles.activityName}>
                        {name}
                        {isTop && <span className={styles.topBadge}>🏆 Лидер</span>}
                        {!junior.is_active && <span className={styles.inactiveBadge}>Неактивен</span>}
                      </span>
                      <span className={styles.activityMeta}>
                        {stat.done} из {stat.totalChallenges} задач · {stat.completionRate}%
                      </span>
                    </div>
                    <span className={styles.activityRate} style={{ color: stat.completionRate >= 70 ? 'var(--accent-green)' : stat.completionRate >= 30 ? 'var(--accent-orange)' : 'var(--accent-red-bright)' }}>
                      {stat.completionRate}%
                    </span>
                  </div>
                  <div className={styles.activityProgressWrap}>
                    <div
                      className={styles.activityProgressBar}
                      style={{
                        width: `${stat.completionRate}%`,
                        background: stat.completionRate >= 70 ? 'var(--accent-green)' : stat.completionRate >= 30 ? 'var(--accent-orange)' : 'var(--accent-red-bright)',
                      }}
                    />
                  </div>
                  <div className={styles.activityTags}>
                    {stat.done > 0 && <span className={styles.tagDone}>✓ {stat.done} выполнено</span>}
                    {stat.inProgress > 0 && <span className={styles.tagInProgress}>⟳ {stat.inProgress} в работе</span>}
                    {stat.going > 0 && <span className={styles.tagGoing}>→ {stat.going} назначено</span>}
                    {stat.skipped > 0 && <span className={styles.tagSkipped}>✗ {stat.skipped} пропущено</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {profileUser && <UserProfileModal user={profileUser} onClose={() => setProfileUser(null)} />}
    </>
  );
}
