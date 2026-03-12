import { Calendar, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Challenge, ChallengeJuniorProgress } from '@shared/types';
import { ChallengeStatusBadge, ProgressBadge } from '@shared/components/ui/Badge/Badge';
import styles from './ChallengeCard.module.css';

interface ChallengeCardProps {
  challenge: Challenge & { progress?: ChallengeJuniorProgress };
  onClick?: () => void;
  showProgress?: boolean;
}

const statusClass: Record<string, string> = {
  ACTIVE:    styles.active,
  UPCOMING:  styles.upcoming,
  COMPLETED: styles.completed,
  CANCELLED: styles.cancelled,
  DRAFT:     styles.draft,
};

export function ChallengeCard({ challenge, onClick, showProgress = false }: ChallengeCardProps) {
  return (
    <div
      className={[styles.card, statusClass[challenge.status] ?? ''].join(' ')}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
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
        {challenge.date && (
          <span className={styles.date}>
            <Calendar size={12} />
            {format(new Date(challenge.date), 'd MMM', { locale: ru })}
          </span>
        )}
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
