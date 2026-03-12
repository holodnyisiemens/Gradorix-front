import styles from './Badge.module.css';
import type { ChallengeStatus, ChallengeJuniorProgress, UserRole } from '@shared/types';

type BadgeColor = 'default' | 'red' | 'orange' | 'green' | 'yellow' | 'blue' | 'gray';

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  dot?: boolean;
}

export function Badge({ children, color = 'default', dot = false }: BadgeProps) {
  return (
    <span className={[styles.badge, styles[color]].join(' ')}>
      {dot && <span className={styles.dot} />}
      {children}
    </span>
  );
}

// Helpers for domain types
export function ChallengeStatusBadge({ status }: { status: ChallengeStatus }) {
  const map: Record<ChallengeStatus, { color: BadgeColor; label: string }> = {
    DRAFT:     { color: 'gray',   label: 'Черновик' },
    UPCOMING:  { color: 'blue',   label: 'Скоро' },
    ACTIVE:    { color: 'green',  label: 'Активный' },
    COMPLETED: { color: 'yellow', label: 'Завершён' },
    CANCELLED: { color: 'red',    label: 'Отменён' },
  };
  const { color, label } = map[status];
  return <Badge color={color} dot>{label}</Badge>;
}

export function ProgressBadge({ progress }: { progress: ChallengeJuniorProgress }) {
  const map: Record<ChallengeJuniorProgress, { color: BadgeColor; label: string }> = {
    GOING:       { color: 'gray',   label: 'Не начат' },
    IN_PROGRESS: { color: 'orange', label: 'В процессе' },
    DONE:        { color: 'green',  label: 'Выполнен' },
    SKIPPED:     { color: 'red',    label: 'Пропущен' },
  };
  const { color, label } = map[progress];
  return <Badge color={color} dot>{label}</Badge>;
}

export function RoleBadge({ role }: { role: UserRole }) {
  const map: Record<UserRole, { color: BadgeColor; label: string }> = {
    HR:     { color: 'yellow', label: 'HR' },
    MENTOR: { color: 'blue',   label: 'Ментор' },
    JUNIOR: { color: 'green',  label: 'HiPo' },
  };
  const { color, label } = map[role];
  return <Badge color={color}>{label}</Badge>;
}
