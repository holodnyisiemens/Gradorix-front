import type { User } from '@shared/types';
import { RoleBadge } from '@shared/components/ui/Badge/Badge';
import styles from './UserCard.module.css';

interface UserCardProps {
  user: User;
  onClick?: () => void;
  extra?: React.ReactNode;
}

const avatarClass: Record<string, string> = {
  HR:     styles.avatarHr,
  MENTOR: styles.avatarMentor,
  JUNIOR: styles.avatarJunior,
};

function getInitials(user: User): string {
  const f = user.firstname?.[0] ?? '';
  const l = user.lastname?.[0] ?? '';
  return (f + l).toUpperCase() || user.username.slice(0, 2).toUpperCase();
}

export function UserCard({ user, onClick, extra }: UserCardProps) {
  return (
    <div
      className={[styles.card, !user.is_active ? styles.inactive : ''].join(' ')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div className={[styles.avatar, avatarClass[user.role]].join(' ')}>
        {getInitials(user)}
      </div>
      <div className={styles.info}>
        <p className={styles.name}>
          {user.firstname && user.lastname
            ? `${user.firstname} ${user.lastname}`
            : user.username}
        </p>
        <p className={styles.username}>@{user.username}</p>
      </div>
      <div className={styles.right}>
        <RoleBadge role={user.role} />
        {extra}
      </div>
    </div>
  );
}
