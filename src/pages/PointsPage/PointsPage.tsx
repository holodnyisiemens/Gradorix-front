import { useState } from 'react';
import { useAuthStore } from '@modules/auth/store/authStore';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Button } from '@shared/components/ui/Button/Button';
import { MOCK_ACTIVITIES, getUserById, getActivitiesForUser } from '@shared/api/mockData';
import type { ActivityStatus } from '@shared/types';
import styles from './PointsPage.module.css';

type Filter = 'all' | ActivityStatus;
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'pending', label: 'На проверке' },
  { key: 'approved', label: 'Одобрено' },
  { key: 'revision', label: 'На доработку' },
  { key: 'rejected', label: 'Отклонено' },
];

const STATUS_LABEL: Record<ActivityStatus, string> = {
  pending: 'На проверке',
  approved: 'Одобрено',
  revision: 'На доработку',
  rejected: 'Отклонено',
};

export function PointsPage() {
  const user = useAuthStore((s) => s.user)!;
  const isHR = user.role === 'HR';
  const [filter, setFilter] = useState<Filter>('all');

  const activities = isHR ? MOCK_ACTIVITIES : getActivitiesForUser(user.id);
  const filtered = filter === 'all' ? activities : activities.filter((a) => a.status === filter);

  return (
    <>
      <PageHeader
        title={isHR ? 'Управление баллами' : 'Мои активности'}
        subtitle={`${activities.filter(a => a.status === 'pending').length} ожидают проверки`}
      />
      <div className={styles.page}>
        {!isHR && (
          <Button full style={{ marginBottom: 'var(--space-4)' }}>
            + Добавить достижение
          </Button>
        )}

        <div className={styles.filters}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={[styles.filterBtn, filter === f.key ? styles.active : ''].join(' ')}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              {f.key !== 'all' && (
                <span style={{ marginLeft: 4, opacity: 0.7 }}>
                  {activities.filter(a => a.status === f.key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className={styles.list}>
          {filtered.map((activity) => {
            const actUser = getUserById(activity.userId);
            return (
              <div key={activity.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <p className={styles.cardTitle}>{activity.title}</p>
                  <span className={[styles.statusBadge, styles[activity.status]].join(' ')}>
                    {STATUS_LABEL[activity.status]}
                  </span>
                </div>

                {isHR && actUser && (
                  <p className={styles.userName}>
                    👤 {actUser.firstname} {actUser.lastname}
                  </p>
                )}

                <p className={styles.cardDesc}>{activity.description}</p>

                <div className={styles.cardMeta}>
                  <span className={styles.points}>
                    {activity.status === 'approved' ? `✓ +${activity.awardedPoints}` : `+${activity.requestedPoints}`} баллов
                  </span>
                  <span className={styles.metaItem}>{activity.type}</span>
                  <span className={styles.metaItem}>{activity.submittedAt}</span>
                </div>

                {activity.reviewNote && (
                  <p className={styles.note}>💬 {activity.reviewNote}</p>
                )}

                {isHR && activity.status === 'pending' && (
                  <div className={styles.actions}>
                    <Button size="sm">Одобрить</Button>
                    <Button size="sm" variant="secondary">На доработку</Button>
                    <Button size="sm" variant="danger">Отклонить</Button>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', textAlign: 'center', padding: 'var(--space-6) 0' }}>
              Активностей не найдено
            </p>
          )}
        </div>
      </div>
    </>
  );
}
