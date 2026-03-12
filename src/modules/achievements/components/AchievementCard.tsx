import { Lock } from 'lucide-react';
import type { Achievement } from '@shared/types';
import styles from './AchievementCard.module.css';

interface AchievementCardProps {
  achievement: Achievement;
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const { title, description, icon, earned, xp } = achievement;

  return (
    <div className={`${styles.card} ${earned ? styles.earned : styles.locked}`}>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.content}>
        <div className={styles.title}>{title}</div>
        <div className={styles.description}>{description}</div>
      </div>
      {earned ? (
        <span className={styles.xp}>+{xp} XP</span>
      ) : (
        <Lock size={16} className={styles.lockIcon} />
      )}
    </div>
  );
}

interface AchievementListProps {
  achievements: Achievement[];
}

export function AchievementList({ achievements }: AchievementListProps) {
  return (
    <div className={styles.grid}>
      {achievements.map((a) => (
        <AchievementCard key={a.id} achievement={a} />
      ))}
    </div>
  );
}
