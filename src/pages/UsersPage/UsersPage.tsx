import { useState } from 'react';
import { Search } from 'lucide-react';
import { useUsers } from '@shared/hooks/useApi';
import { UserCard } from '@modules/users/components/UserCard';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Input } from '@shared/components/ui/Input/Input';
import type { UserRole } from '@shared/types';
import styles from './UsersPage.module.css';

type RoleFilter = 'all' | UserRole;

const ROLE_FILTERS: { key: RoleFilter; label: string }[] = [
  { key: 'all',    label: 'Все' },
  { key: 'HR',     label: 'HR' },
  { key: 'MENTOR', label: 'Менторы' },
  { key: 'JUNIOR', label: 'HiPo' },
];

export function UsersPage() {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
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
      <PageHeader title="Пользователи" subtitle={isLoading ? '...' : `${filtered.length} из ${allUsers.length}`} />
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
            <UserCard key={u.id} user={u} />
          ))}
          {!isLoading && filtered.length === 0 && (
            <div className={styles.empty}>Ничего не найдено</div>
          )}
        </div>
      </div>
    </>
  );
}
