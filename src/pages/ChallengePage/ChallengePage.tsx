import { useParams, useNavigate } from 'react-router-dom';
import { ExternalLink, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuthStore } from '@modules/auth/store/authStore';
import { MOCK_CHALLENGES, MOCK_CHALLENGE_JUNIOR } from '@shared/api/mockData';
import { ChallengeStatusBadge, ProgressBadge } from '@shared/components/ui/Badge/Badge';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Card } from '@shared/components/ui/Card/Card';
import { Button } from '@shared/components/ui/Button/Button';
import type { ChallengeJuniorProgress } from '@shared/types';
import styles from './ChallengePage.module.css';

const PROGRESS_OPTIONS: { value: ChallengeJuniorProgress; label: string; emoji: string }[] = [
  { value: 'GOING',       label: 'Не начал',   emoji: '⏸' },
  { value: 'IN_PROGRESS', label: 'В процессе', emoji: '🔥' },
  { value: 'DONE',        label: 'Выполнил',   emoji: '✅' },
  { value: 'SKIPPED',     label: 'Пропустил',  emoji: '⏭' },
];

export function ChallengePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user)!;

  const challenge = MOCK_CHALLENGES.find((c) => c.id === Number(id));
  if (!challenge) {
    return (
      <>
        <PageHeader title="Задача" showBack />
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
          Задача не найдена
        </div>
      </>
    );
  }

  const assignment = user.role === 'JUNIOR'
    ? MOCK_CHALLENGE_JUNIOR.find((cj) => cj.challenge_id === challenge.id && cj.junior_id === user.id)
    : null;

  return (
    <>
      <PageHeader title={challenge.title} showBack />
      <div className={styles.page}>
        <div className={styles.header}>
          <ChallengeStatusBadge status={challenge.status} />
          {assignment && <ProgressBadge progress={assignment.progress} />}
        </div>

        {challenge.description && (
          <Card>
            <p className={styles.description}>{challenge.description}</p>
          </Card>
        )}

        {challenge.date && (
          <div className={styles.meta}>
            <Calendar size={14} />
            <span>{format(new Date(challenge.date), 'd MMMM yyyy', { locale: ru })}</span>
          </div>
        )}

        {challenge.url && (
          <a className={styles.link} href={challenge.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={16} />
            Открыть материал
          </a>
        )}

        {/* Progress update for Junior */}
        {assignment && (
          <div className={styles.progressSection}>
            <h3 className={styles.sectionTitle}>Обновить прогресс</h3>
            <div className={styles.progressOptions}>
              {PROGRESS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={[
                    styles.progressOption,
                    assignment.progress === opt.value ? styles.progressOptionActive : '',
                  ].join(' ')}
                  onClick={() => {
                    // In real app, call API; here just mock
                    assignment.progress = opt.value;
                    navigate(-1);
                  }}
                >
                  <span className={styles.progressEmoji}>{opt.emoji}</span>
                  <span className={styles.progressLabel}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
