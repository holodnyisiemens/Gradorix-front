import { LogOut, User, Mail, Shield, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@modules/auth/store/authStore';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Card } from '@shared/components/ui/Card/Card';
import { Button } from '@shared/components/ui/Button/Button';
import { RoleBadge } from '@shared/components/ui/Badge/Badge';
import {
  getUserPoints, getAchievementsForJunior, getQuizResultsForUser,
  getChallengesForJunior,
} from '@shared/api/mockData';
import styles from './ProfilePage.module.css';

const LEVEL_THRESHOLDS = [0, 200, 500, 900, 1400, 2000];

function rankEmoji(rank: number) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)!;
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const initials = ((user.firstname?.[0] ?? '') + (user.lastname?.[0] ?? '')).toUpperCase()
    || user.username.slice(0, 2).toUpperCase();

  const pts = getUserPoints(user.id);

  // Stats for HiPo
  const isHiPo = user.role === 'JUNIOR';
  const achievements = isHiPo ? getAchievementsForJunior(user.id) : [];
  const earnedAch = achievements.filter((a) => a.earned);
  const quizResults = isHiPo ? getQuizResultsForUser(user.id) : [];
  const challenges = isHiPo ? getChallengesForJunior(user.id) : [];
  const doneChallenges = challenges.filter((c) => c.progress === 'DONE').length;

  const levelPct = pts
    ? (() => {
        const lo = LEVEL_THRESHOLDS[pts.level] ?? 0;
        const hi = LEVEL_THRESHOLDS[pts.level + 1] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
        return Math.min(100, Math.round(((pts.totalPoints - lo) / (hi - lo)) * 100));
      })()
    : 0;

  return (
    <>
      <PageHeader title="Профиль" />
      <div className={styles.page}>
        {/* Avatar block */}
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>{initials}</div>
          <h2 className={styles.name}>
            {user.firstname && user.lastname
              ? `${user.firstname} ${user.lastname}`
              : user.username}
          </h2>
          <RoleBadge role={user.role} />
        </div>

        {/* Level / Points block (HiPo & Mentor) */}
        {pts && (
          <div className={styles.levelBlock}>
            <div className={styles.levelLeft}>
              <p className={styles.levelNum}>{pts.level}</p>
              <p className={styles.levelWord}>уровень</p>
            </div>
            <div className={styles.levelRight}>
              <p className={styles.levelName}>{pts.levelName}</p>
              <p className={styles.levelPts}>{pts.totalPoints} баллов · до след. {pts.pointsToNextLevel}</p>
              <div className={styles.levelProgress}>
                <div className={styles.levelProgressFill} style={{ width: `${levelPct}%` }} />
              </div>
            </div>
            <div className={styles.rankBadge}>{rankEmoji(pts.rank)}</div>
          </div>
        )}

        {/* Stats row for HiPo */}
        {isHiPo && (
          <>
            <div className={styles.statsRow}>
              <div className={styles.statBox}>
                <p className={styles.statVal}>{doneChallenges}</p>
                <p className={styles.statLbl}>Задач выполнено</p>
              </div>
              <div className={styles.statBox}>
                <p className={styles.statVal}>{quizResults.length}</p>
                <p className={styles.statLbl}>Тестов пройдено</p>
              </div>
              <div className={styles.statBox}>
                <p className={styles.statVal}>{earnedAch.length}</p>
                <p className={styles.statLbl}>Достижений</p>
              </div>
            </div>

            {/* Achievements mini grid */}
            {achievements.length > 0 && (
              <div>
                <p className={styles.sectionTitle}>Достижения</p>
                <div className={styles.achievementsGrid}>
                  {achievements.slice(0, 8).map((a) => (
                    <div key={a.id} className={[styles.achip, !a.earned ? styles.achipLocked : ''].join(' ')}>
                      <span className={styles.achipIcon}>{a.icon}</span>
                      <span className={styles.achipTitle}>{a.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button variant="secondary" full onClick={() => navigate('/leaderboard')}>
              <Trophy size={16} /> Посмотреть рейтинг
            </Button>
          </>
        )}

        {/* Info */}
        <Card>
          <div className={styles.infoList}>
            <div className={styles.infoRow}>
              <User size={16} className={styles.infoIcon} />
              <span className={styles.infoLabel}>Логин</span>
              <span className={styles.infoValue}>@{user.username}</span>
            </div>
            <div className={styles.infoRow}>
              <Mail size={16} className={styles.infoIcon} />
              <span className={styles.infoLabel}>Email</span>
              <span className={styles.infoValue}>{user.email}</span>
            </div>
            <div className={styles.infoRow}>
              <Shield size={16} className={styles.infoIcon} />
              <span className={styles.infoLabel}>Роль</span>
              <span className={styles.infoValue}>{user.role}</span>
            </div>
          </div>
        </Card>

        {/* Status */}
        <Card>
          <div className={styles.statusRow}>
            <span className={styles.statusDot} style={{ background: user.is_active ? 'var(--color-success-bright)' : 'var(--text-muted)' }} />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Статус: {user.is_active ? 'Активен' : 'Неактивен'}
            </span>
          </div>
        </Card>

        <Button variant="danger" full onClick={logout}>
          <LogOut size={16} />
          Выйти из аккаунта
        </Button>
      </div>
    </>
  );
}
