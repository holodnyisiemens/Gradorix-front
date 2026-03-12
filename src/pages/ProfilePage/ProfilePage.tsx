import { LogOut, User, Mail, Shield } from 'lucide-react';
import { useAuthStore } from '@modules/auth/store/authStore';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Card } from '@shared/components/ui/Card/Card';
import { Button } from '@shared/components/ui/Button/Button';
import { RoleBadge } from '@shared/components/ui/Badge/Badge';
import styles from './ProfilePage.module.css';

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)!;
  const logout = useAuthStore((s) => s.logout);

  const initials = ((user.firstname?.[0] ?? '') + (user.lastname?.[0] ?? '')).toUpperCase()
    || user.username.slice(0, 2).toUpperCase();

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
