import { useState } from 'react';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Button } from '@shared/components/ui/Button/Button';
import { Input } from '@shared/components/ui/Input/Input';
import { Modal } from '@shared/components/ui/Modal/Modal';
import { MOCK_ACHIEVEMENTS, MOCK_ACTIVITIES, MOCK_ALL_USERS, MOCK_USER_POINTS, getUserById } from '@shared/api/mockData';
import type { Achievement, Activity } from '@shared/types';
import styles from './AdminPage.module.css';

type Tab = 'achievements' | 'activities' | 'users';

export function AdminPage() {
  const user = useAuthStore((s) => s.user)!;
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('activities');
  const [activities, setActivities] = useState<Activity[]>([...MOCK_ACTIVITIES]);
  const [achievements, setAchievements] = useState<Achievement[]>([...MOCK_ACHIEVEMENTS]);
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const [editAchievement, setEditAchievement] = useState<Achievement | null>(null);
  const [newAchModal, setNewAchModal] = useState(false);
  const [newAch, setNewAch] = useState({ title: '', description: '', icon: '🏆', xp: 100, category: 'challenge' as Achievement['category'] });

  if (user.role !== 'HR') {
    navigate('/dashboard');
    return null;
  }

  // Activity actions
  function updateActivityStatus(id: number, status: Activity['status'], note?: string) {
    setActivities(prev => prev.map(a => a.id === id
      ? { ...a, status, reviewNote: note ?? a.reviewNote, reviewedAt: new Date().toISOString().slice(0, 10), awardedPoints: status === 'approved' ? a.requestedPoints : undefined }
      : a
    ));
  }

  function saveEditedActivity(updated: Activity) {
    setActivities(prev => prev.map(a => a.id === updated.id ? updated : a));
    setEditActivity(null);
  }

  // Achievement actions
  function deleteAchievement(id: number) {
    setAchievements(prev => prev.filter(a => a.id !== id));
  }

  function addAchievement() {
    const next: Achievement = {
      id: Date.now(),
      ...newAch,
      earned: false,
    };
    setAchievements(prev => [...prev, next]);
    setNewAchModal(false);
    setNewAch({ title: '', description: '', icon: '🏆', xp: 100, category: 'challenge' });
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'activities', label: 'Активности' },
    { key: 'achievements', label: 'Достижения' },
    { key: 'users', label: 'Участники' },
  ];

  return (
    <>
      <PageHeader title="Админ-панель" subtitle="Управление программой HiPo" />
      <div className={styles.page}>
        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map(t => (
            <button key={t.key} className={[styles.tab, tab === t.key ? styles.tabActive : ''].join(' ')} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ACTIVITIES TAB */}
        {tab === 'activities' && (
          <div className={styles.list}>
            {activities.map(act => {
              const actUser = getUserById(act.userId);
              return (
                <div key={act.id} className={styles.item}>
                  <div className={styles.itemTop}>
                    <p className={styles.itemTitle}>{act.title}</p>
                    <span className={[styles.status, styles[act.status]].join(' ')}>{act.status}</span>
                  </div>
                  <p className={styles.itemSub}>👤 {actUser?.firstname} {actUser?.lastname} · {act.submittedAt} · +{act.requestedPoints} бал.</p>
                  <p className={styles.itemDesc}>{act.description}</p>
                  {act.reviewNote && <p className={styles.reviewNote}>💬 {act.reviewNote}</p>}
                  <div className={styles.itemActions}>
                    {act.status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => updateActivityStatus(act.id, 'approved')}>Одобрить</Button>
                        <Button size="sm" variant="secondary" onClick={() => updateActivityStatus(act.id, 'revision', 'Требуется доработка')}>На доработку</Button>
                        <Button size="sm" variant="danger" onClick={() => updateActivityStatus(act.id, 'rejected', 'Не соответствует критериям')}>Отклонить</Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setEditActivity({ ...act })}>Редактировать</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ACHIEVEMENTS TAB */}
        {tab === 'achievements' && (
          <div>
            <Button full style={{ marginBottom: 'var(--space-3)' }} onClick={() => setNewAchModal(true)}>
              + Создать достижение
            </Button>
            <div className={styles.achGrid}>
              {achievements.map(ach => (
                <div key={ach.id} className={styles.achCard}>
                  <div className={styles.achTop}>
                    <span style={{ fontSize: 28 }}>{ach.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p className={styles.achTitle}>{ach.title}</p>
                      <p className={styles.achDesc}>{ach.description}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 13, color: 'var(--color-warning-bright)', fontFamily: 'var(--font-display)' }}>+{ach.xp}</p>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>{ach.category}</p>
                    </div>
                  </div>
                  <div className={styles.itemActions} style={{ marginTop: 'var(--space-2)' }}>
                    <Button size="sm" variant="ghost" onClick={() => setEditAchievement({ ...ach })}>Редактировать</Button>
                    <Button size="sm" variant="danger" onClick={() => deleteAchievement(ach.id)}>Удалить</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {tab === 'users' && (
          <div className={styles.list}>
            {MOCK_ALL_USERS.filter(u => u.role === 'JUNIOR').map(u => {
              const pts = MOCK_USER_POINTS.find(p => p.userId === u.id);
              return (
                <div key={u.id} className={styles.item}>
                  <div className={styles.itemTop}>
                    <p className={styles.itemTitle}>{u.firstname} {u.lastname}</p>
                    {pts && <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--color-primary-bright)' }}>{pts.totalPoints} бал.</span>}
                  </div>
                  <p className={styles.itemSub}>@{u.username} · {pts?.levelName ?? '—'} · #{pts?.rank ?? '—'}</p>
                  <div className={styles.itemActions}>
                    <Button size="sm" variant="secondary" onClick={() => navigate('/points')}>Активности</Button>
                    <Button size="sm" variant="ghost" onClick={() => navigate('/leaderboard')}>Рейтинг</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Activity Modal */}
      {editActivity && (
        <Modal open={true} onClose={() => setEditActivity(null)} title="Редактировать активность" type="sheet">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input label="Название" value={editActivity.title} onChange={e => setEditActivity(p => p && ({ ...p, title: e.target.value }))} />
            <Input label="Описание" value={editActivity.description} onChange={e => setEditActivity(p => p && ({ ...p, description: e.target.value }))} />
            <Input label="Баллы" type="number" value={String(editActivity.requestedPoints)} onChange={e => setEditActivity(p => p && ({ ...p, requestedPoints: Number(e.target.value) }))} />
            <Input label="Комментарий HR" value={editActivity.reviewNote ?? ''} onChange={e => setEditActivity(p => p && ({ ...p, reviewNote: e.target.value }))} />
            <Button full onClick={() => editActivity && saveEditedActivity(editActivity)}>Сохранить</Button>
          </div>
        </Modal>
      )}

      {/* New Achievement Modal */}
      {newAchModal && (
        <Modal open={true} onClose={() => setNewAchModal(false)} title="Создать достижение" type="sheet">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input label="Название" value={newAch.title} onChange={e => setNewAch(p => ({ ...p, title: e.target.value }))} />
            <Input label="Описание" value={newAch.description} onChange={e => setNewAch(p => ({ ...p, description: e.target.value }))} />
            <Input label="Иконка (эмодзи)" value={newAch.icon} onChange={e => setNewAch(p => ({ ...p, icon: e.target.value }))} />
            <Input label="XP баллов" type="number" value={String(newAch.xp)} onChange={e => setNewAch(p => ({ ...p, xp: Number(e.target.value) }))} />
            <Button full onClick={addAchievement}>Создать</Button>
          </div>
        </Modal>
      )}

      {/* Edit Achievement Modal */}
      {editAchievement && (
        <Modal open={true} onClose={() => setEditAchievement(null)} title="Редактировать достижение" type="sheet">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input label="Название" value={editAchievement.title} onChange={e => setEditAchievement(p => p && ({ ...p, title: e.target.value }))} />
            <Input label="Описание" value={editAchievement.description} onChange={e => setEditAchievement(p => p && ({ ...p, description: e.target.value }))} />
            <Input label="Иконка" value={editAchievement.icon} onChange={e => setEditAchievement(p => p && ({ ...p, icon: e.target.value }))} />
            <Input label="XP" type="number" value={String(editAchievement.xp)} onChange={e => setEditAchievement(p => p && ({ ...p, xp: Number(e.target.value) }))} />
            <Button full onClick={() => {
              setAchievements(prev => prev.map(a => a.id === editAchievement!.id ? editAchievement! : a));
              setEditAchievement(null);
            }}>Сохранить</Button>
          </div>
        </Modal>
      )}
    </>
  );
}
