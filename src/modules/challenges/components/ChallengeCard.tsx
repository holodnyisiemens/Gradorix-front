import { Calendar, ExternalLink, Star } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Challenge, ChallengeJuniorProgress } from '@shared/types';
import { ChallengeStatusBadge, ProgressBadge } from '@shared/components/ui/Badge/Badge';
import styles from './ChallengeCard.module.css';

interface ChallengeCardProps {
  challenge: Challenge & { progress?: ChallengeJuniorProgress };
  onClick?: () => void;
  showProgress?: boolean;
  locked?: boolean;
}

const statusClass: Record<string, string> = {
  ACTIVE:    styles.active,
  UPCOMING:  styles.upcoming,
  COMPLETED: styles.completed,
  CANCELLED: styles.cancelled,
  DRAFT:     styles.draft,
};

export function ChallengeCard({ challenge, onClick, showProgress = false, locked = false }: ChallengeCardProps) {
  return (
    <div
      className={[styles.card, statusClass[challenge.status] ?? '', locked ? styles.locked : ''].join(' ')}
      onClick={locked ? undefined : onClick}
      role={locked ? undefined : 'button'}
      tabIndex={locked ? undefined : 0}
      onKeyDown={(e) => !locked && e.key === 'Enter' && onClick?.()}
    >
      <div className={styles.header}>
        <p className={styles.title}>{challenge.title}</p>
        <div style={{ flexShrink: 0 }}>
          {showProgress && challenge.progress ? (
            <ProgressBadge progress={challenge.progress} />
          ) : (
            <ChallengeStatusBadge status={challenge.status} />
          )}
        </div>
      </div>

      {challenge.description && (
        <p className={styles.description}>{challenge.description}</p>
      )}

      <div className={styles.footer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {challenge.date && (
            <span className={styles.date}>
              <Calendar size={12} />
              {format(new Date(challenge.date), 'd MMM', { locale: ru })}
            </span>
          )}
          {challenge.maxPoints != null && challenge.maxPoints > 0 && (
            <span className={styles.maxPoints}>
              <Star size={11} />
              до {challenge.maxPoints} баллов
            </span>
          )}
        </div>
        {challenge.url && (
          <a
            className={styles.link}
            href={challenge.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={12} />
            Открыть
          </a>
        )}
      </div>
    </div>
  );
}
