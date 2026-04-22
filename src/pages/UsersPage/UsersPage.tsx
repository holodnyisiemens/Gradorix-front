import { useState } from 'react';
import { Search } from 'lucide-react';
import { useUsers, useUserPoints, useChallengeJuniors, useQuizResults, useActivities } from '@shared/hooks/useApi';
import { UserCard } from '@modules/users/components/UserCard';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Input } from '@shared/components/ui/Input/Input';
import { Modal } from '@shared/components/ui/Modal/Modal';
import { RoleBadge } from '@shared/components/ui/Badge/Badge';
import type { User, UserRole } from '@shared/types';
import styles from './UsersPage.module.css';

export function UserProfileModal({ user, onClose }: { user: User; onClose: () => void }) {
  const isJunior = user.role === 'JUNIOR';
  const { data: pts } = useUserPoints(user.id);
  const { data: assignments = [] } = useChallengeJuniors(isJunior ? { junior_id: user.id } : undefined);
  const { data: quizResults = [] } = useQuizResults(isJunior ? { user_id: user.id } : undefined);
  const { data: activities = [] } = useActivities(isJunior ? { user_id: user.id } : undefined);

  const initials = ((user.firstname?.[0] ?? '') + (user.lastname?.[0] ?? '')).toUpperCase()
    || user.username.slice(0, 2).toUpperCase();

  const doneChallenges = assignments.filter(a => a.progress === 'DONE').length;
  const approvedActivities = activities.filter(a => a.status === 'approved').length;

  const row = (label: string, value: React.ReactNode) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
    </div>
  );

  return (
    <Modal open={true} onClose={onClose} title="Профиль пользователя" type="dialog">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--color-primary)', color: '#fff', fontSize: 20, fontWeight: 700,
          }}>{initials}</div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
              {user.firstname && user.lastname ? `${user.firstname} ${user.lastname}` : user.username}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>@{user.username}</p>
          </div>
          <div style={{ marginLeft: 'auto' }}><RoleBadge role={user.role} /></div>
        </div>

        {/* Base info */}
        <div>
          {row('Статус', <span style={{ color: user.is_active ? 'var(--color-success-bright)' : 'var(--text-muted)' }}>{user.is_active ? 'Активен' : 'Неактивен'}</span>)}
          {user.email && row('Email', user.email)}
        </div>

        {/* Stats — only for JUNIORs */}
        {isJunior && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Статистика</p>
            {pts && row('Уровень', `${pts.level} — ${pts.levelName}`)}
            {pts && row('Баллов', `${pts.totalPoints}`)}
            {pts && row('Место в рейтинге', `#${pts.rank}`)}
            {row('Задач выполнено', doneChallenges)}
            {row('Тестов пройдено', quizResults.length)}
            {row('Достижений одобрено', approvedActivities)}
          </div>
        )}
      </div>
    </Modal>
  );
}

type RoleFilter = 'all' | UserRole;

const ROLE_FILTERS: { key: RoleFilter; label: string }[] = [
  { key: 'all',    label: 'Все' },
  { key: 'HR',     label: 'HR' },
  { key: 'MENTOR', label: 'Менторы' },
  { key: 'JUNIOR', label: 'Участник' },
];

export function UsersPage() {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { data: allUsers = [], isLoading } = useUsers();

  const filtered = allUsers.filter((u) => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const q = query.toLowerCase();
    const matchQuery = !q || [u.username, u.firstname, u.lastname, u.email]
      .some((v) => v?.toLowerCase().includes(q));
    return matchRole && matchQuery;
  });

  return (
    <>
      <PageHeader title="Пользователи" showBack subtitle={isLoading ? '...' : `${filtered.length} из ${allUsers.length}`} />
      <div className={styles.page}>
        <Input
          placeholder="Поиск по имени или логину..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          iconLeft={<Search size={16} />}
        />

        <div className={styles.filters}>
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.key}
              className={[styles.filterBtn, roleFilter === f.key ? styles.active : ''].join(' ')}
              onClick={() => setRoleFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className={styles.list}>
          {filtered.map((u) => (
            <UserCard key={u.id} user={u} onClick={() => setSelectedUser(u)} />
          ))}
          {!isLoading && filtered.length === 0 && (
            <div className={styles.empty}>Ничего не найдено</div>
          )}
        </div>
      </div>
      {selectedUser && (
        <UserProfileModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </>
  );
}
