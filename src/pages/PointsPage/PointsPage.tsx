import { useState } from 'react';
import { useAuthStore } from '@modules/auth/store/authStore';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Button } from '@shared/components/ui/Button/Button';
import { Input } from '@shared/components/ui/Input/Input';
import { Modal } from '@shared/components/ui/Modal/Modal';
import { useActivities, useUsers, useUpdateActivity, useCreateActivity, useDeleteActivity } from '@shared/hooks/useApi';
import type { ActivityStatus, ActivityType } from '@shared/types';
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

const ACTIVITY_TYPES: { key: ActivityType; label: string }[] = [
  { key: 'achievement', label: 'Достижение' },
  { key: 'task', label: 'Задача' },
  { key: 'test', label: 'Тест' },
  { key: 'event', label: 'Мероприятие' },
  { key: 'custom', label: 'Другое' },
];

export function PointsPage() {
  const user = useAuthStore((s) => s.user)!;
  const isHR = user.role === 'HR';
  const [filter, setFilter] = useState<Filter>('all');
  const [addModal, setAddModal] = useState(false);
  const [newActivity, setNewActivity] = useState({ title: '', description: '', requested_points: 10, activity_type: 'achievement' as ActivityType });

  const { data: allActivities = [] } = useActivities(isHR ? undefined : { user_id: user.id });
  const { data: allUsers = [] } = useUsers();
  const updateActivity = useUpdateActivity();
  const createActivity = useCreateActivity();
  const deleteActivity = useDeleteActivity();

  const filtered = filter === 'all' ? allActivities : allActivities.filter((a) => a.status === filter);

  async function handleCreate() {
    if (!newActivity.title) return;
    await createActivity.mutateAsync({
      user_id: user.id,
      title: newActivity.title,
      description: newActivity.description,
      requested_points: newActivity.requested_points,
      activity_type: newActivity.activity_type,
    });
    setAddModal(false);
    setNewActivity({ title: '', description: '', requested_points: 10, activity_type: 'achievement' });
  }

  return (
    <>
      <PageHeader
        title={isHR ? 'Управление баллами' : 'Мои активности'}
        subtitle={`${allActivities.filter(a => a.status === 'pending').length} ожидают проверки`}
      />
      <div className={styles.page}>
        {!isHR && (
          <Button full style={{ marginBottom: 'var(--space-4)' }} onClick={() => setAddModal(true)}>
            + Добавить достижение
          </Button>
        )}

        <div className={styles.filters}>
          {FILTERS.map((f) => (
            <button key={f.key}
              className={[styles.filterBtn, filter === f.key ? styles.active : ''].join(' ')}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              {f.key !== 'all' && (
                <span style={{ marginLeft: 4, opacity: 0.7 }}>
                  {allActivities.filter(a => a.status === f.key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className={styles.list}>
          {filtered.map((activity) => {
            const actUser = allUsers.find((u) => u.id === activity.userId);
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
                    <Button size="sm" onClick={() => updateActivity.mutate({ id: activity.id, data: { status: 'approved', awarded_points: activity.requestedPoints } })}>Одобрить</Button>
                    <Button size="sm" variant="secondary" onClick={() => updateActivity.mutate({ id: activity.id, data: { status: 'revision', review_note: 'Требуется доработка' } })}>На доработку</Button>
                    <Button size="sm" variant="danger" onClick={() => updateActivity.mutate({ id: activity.id, data: { status: 'rejected', review_note: 'Не соответствует критериям' } })}>Отклонить</Button>
                  </div>
                )}

                {!isHR && activity.status === 'pending' && (
                  <div className={styles.actions}>
                    <Button size="sm" variant="danger" onClick={() => deleteActivity.mutate(activity.id)}>Удалить</Button>
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

      {addModal && (
        <Modal open={true} onClose={() => setAddModal(false)} title="Добавить достижение" type="dialog">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input label="Название *" value={newActivity.title} onChange={e => setNewActivity(p => ({ ...p, title: e.target.value }))} />
            <Input label="Описание" value={newActivity.description} onChange={e => setNewActivity(p => ({ ...p, description: e.target.value }))} />
            <Input label="Запрашиваемые баллы" type="number" value={String(newActivity.requested_points)} onChange={e => setNewActivity(p => ({ ...p, requested_points: Number(e.target.value) }))} />
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Тип активности</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
                {ACTIVITY_TYPES.map(t => (
                  <button key={t.key} onClick={() => setNewActivity(p => ({ ...p, activity_type: t.key }))}
                    style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid', cursor: 'pointer', fontSize: 12,
                      borderColor: newActivity.activity_type === t.key ? 'var(--color-primary)' : 'var(--border-subtle)',
                      background: newActivity.activity_type === t.key ? 'rgba(204,0,0,0.15)' : 'transparent',
                      color: newActivity.activity_type === t.key ? 'var(--color-primary-bright)' : 'var(--text-muted)',
                    }}
                  >{t.label}</button>
                ))}
              </div>
            </div>
            <Button full onClick={handleCreate} disabled={createActivity.isPending}>
              {createActivity.isPending ? 'Отправка...' : 'Отправить на проверку'}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
