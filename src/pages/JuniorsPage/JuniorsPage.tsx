import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useMentorJuniors, useUsers, useChallengeJuniors } from '@shared/hooks/useApi';
import { UserCard } from '@modules/users/components/UserCard';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Badge } from '@shared/components/ui/Badge/Badge';
import styles from './JuniorsPage.module.css';

export function JuniorsPage() {
  const user = useAuthStore((s) => s.user)!;
  const navigate = useNavigate();
  const { data: pairs = [] } = useMentorJuniors({ mentor_id: user.id });
  const { data: allUsers = [] } = useUsers();
  const { data: allAssignments = [] } = useChallengeJuniors();

  const juniors = pairs
    .map((p) => allUsers.find((u) => u.id === p.junior_id))
    .filter(Boolean) as typeof allUsers;

  return (
    <>
      <PageHeader title="Подопечные в проекте" showBack subtitle={`${juniors.length} участника`} />
      <div className={styles.page}>
        {juniors.length === 0 ? (
          <div className={styles.empty}>
            <span>👥</span>
            <p>Подопечные ещё не назначены</p>
          </div>
        ) : (
          <div className={styles.list}>
            {juniors.map((junior) => {
              const assignments = allAssignments.filter((cj) => cj.junior_id === junior.id);
              const done = assignments.filter((a) => a.progress === 'DONE').length;
              const total = assignments.length;
              return (
                <UserCard
                  key={junior.id}
                  user={junior}
                  onClick={() => navigate(`/juniors/${junior.id}`)}
                  extra={
                    total > 0 ? (
                      <Badge color={done === total ? 'green' : done > 0 ? 'orange' : 'gray'}>
                        {done}/{total}
                      </Badge>
                    ) : undefined
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
