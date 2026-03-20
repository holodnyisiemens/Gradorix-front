import { useAuthStore } from '@modules/auth/store/authStore';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { MOCK_USER_POINTS, getUserById } from '@shared/api/mockData';
import styles from './LeaderboardPage.module.css';

const LEVEL_THRESHOLDS = [0, 200, 500, 900, 1400, 2000];

export function LeaderboardPage() {
  const user = useAuthStore((s) => s.user)!;
  const myPoints = MOCK_USER_POINTS.find((p) => p.userId === user.id);

  function rankClass(rank: number) {
    if (rank === 1) return styles.rankGold;
    if (rank === 2) return styles.rankSilver;
    if (rank === 3) return styles.rankBronze;
    return '';
  }

  function rankEmoji(rank: number) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return String(rank);
  }

  return (
    <>
      <PageHeader title="Рейтинг" subtitle="Участники программы HiPo" />
      <div className={styles.page}>
        {/* My position card */}
        {myPoints && (
          <div className={styles.myCard}>
            <div className={styles.myRank}>{rankEmoji(myPoints.rank)}</div>
            <div className={styles.myInfo}>
              <p className={styles.myName}>
                {user.firstname ? `${user.firstname} ${user.lastname}` : user.username}
              </p>
              <p className={styles.myLevel}>{myPoints.levelName}</p>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${Math.min(100, 100 - (myPoints.pointsToNextLevel / (LEVEL_THRESHOLDS[myPoints.level + 1] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]) * 100))}%`
                  }}
                />
              </div>
              <p className={styles.progressLabel}>
                До следующего уровня: {myPoints.pointsToNextLevel} баллов
              </p>
            </div>
            <div>
              <p className={styles.myPoints}>{myPoints.totalPoints}</p>
              <p className={styles.myPointsLabel}>баллов</p>
            </div>
          </div>
        )}

        <p className={styles.sectionTitle}>Все участники</p>

        <div className={styles.list}>
          {MOCK_USER_POINTS.map((entry) => {
            const u = getUserById(entry.userId);
            if (!u) return null;
            const isMe = u.id === user.id;
            const initials = ((u.firstname?.[0] ?? '') + (u.lastname?.[0] ?? '')).toUpperCase()
              || u.username.slice(0, 2).toUpperCase();
            return (
              <div key={entry.userId} className={[styles.row, isMe ? styles.rowMe : ''].join(' ')}>
                <span className={[styles.rank, rankClass(entry.rank)].join(' ')}>
                  {rankEmoji(entry.rank)}
                </span>
                <div className={[styles.avatar, isMe ? styles.avatarMe : ''].join(' ')}>
                  {initials}
                </div>
                <div className={styles.info}>
                  <p className={styles.name}>
                    {u.firstname ? `${u.firstname} ${u.lastname}` : u.username}
                    {isMe && ' (ты)'}
                  </p>
                  <p className={styles.level}>{entry.levelName}</p>
                </div>
                <span className={[styles.points, isMe ? styles.pointsMe : ''].join(' ')}>
                  {entry.totalPoints} бал.
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
