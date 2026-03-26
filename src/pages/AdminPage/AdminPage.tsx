import { useState } from 'react';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Button } from '@shared/components/ui/Button/Button';
import { Input } from '@shared/components/ui/Input/Input';
import { Modal } from '@shared/components/ui/Modal/Modal';
import {
  useActivities, useAchievements, useUsers, useLeaderboard,
  useUpdateActivity, useDeleteAchievement, useCreateUser,
  useCalendarEvents, useCreateCalendarEvent, useUpdateCalendarEvent, useDeleteCalendarEvent,
  useAwardAchievement, useAllUserAchievements,
} from '@shared/hooks/useApi';
import { achievementsApi } from '@shared/api/services/achievements';
import { useQueryClient } from '@tanstack/react-query';
import type { Activity, CalendarEvent, UserRole } from '@shared/types';
import styles from './AdminPage.module.css';

type Tab = 'achievements' | 'activities' | 'users' | 'events';

export function AdminPage() {
  const user = useAuthStore((s) => s.user)!;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [tab, setTab] = useState<Tab>('activities');
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const [editAchievementId, setEditAchievementId] = useState<number | null>(null);
  const [newAchModal, setNewAchModal] = useState(false);
  const [newAch, setNewAch] = useState({ title: '', description: '', icon: '🏆', xp: 100, category: 'challenge' as const });
  const [newUserModal, setNewUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'JUNIOR' as UserRole, firstname: '', lastname: '' });
  const [newUserError, setNewUserError] = useState('');
  const [newEventModal, setNewEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', description: '', type: 'meeting' as CalendarEvent['type'] });
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [awardModal, setAwardModal] = useState<number | null>(null); // achievement id
  const [awardUserId, setAwardUserId] = useState<number | null>(null);

  const { data: activities = [] } = useActivities();
  const { data: achievements = [] } = useAchievements();
  const { data: allUsers = [] } = useUsers();
  const { data: leaderboard = [] } = useLeaderboard();
  const { data: events = [] } = useCalendarEvents();
  const updateActivity = useUpdateActivity();
  const deleteAchievement = useDeleteAchievement();
  const createUser = useCreateUser();
  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();
  const deleteEvent = useDeleteCalendarEvent();
  const awardAchievement = useAwardAchievement();
  const { data: allUserAchievements = [] } = useAllUserAchievements();

  const editAchievement = achievements.find((a) => a.id === editAchievementId) ?? null;

  if (user.role !== 'HR') {
    navigate('/dashboard');
    return null;
  }

  function updateActivityStatus(id: number, status: Activity['status'], note?: string) {
    updateActivity.mutate({
      id,
      data: {
        status,
        review_note: note,
        awarded_points: status === 'approved' ? activities.find(a => a.id === id)?.requestedPoints : undefined,
      },
    });
  }

  async function addAchievement() {
    await achievementsApi.create(newAch);
    qc.invalidateQueries({ queryKey: ['achievements'] });
    setNewAchModal(false);
    setNewAch({ title: '', description: '', icon: '🏆', xp: 100, category: 'challenge' });
  }

  async function createNewUser() {
    setNewUserError('');
    if (!newUser.username || !newUser.email || !newUser.password) {
      setNewUserError('Заполните обязательные поля');
      return;
    }
    try {
      await createUser.mutateAsync({
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        firstname: newUser.firstname || undefined,
        lastname: newUser.lastname || undefined,
      });
      setNewUserModal(false);
      setNewUser({ username: '', email: '', password: '', role: 'JUNIOR', firstname: '', lastname: '' });
    } catch {
      setNewUserError('Ошибка при создании. Проверьте данные.');
    }
  }

  async function saveEditedAchievement(id: number, data: { title: string; description: string; icon: string; xp: number }) {
    await achievementsApi.update(id, data);
    qc.invalidateQueries({ queryKey: ['achievements'] });
    setEditAchievementId(null);
  }

  async function createNewEvent() {
    if (!newEvent.title || !newEvent.date) return;
    await createEvent.mutateAsync({ title: newEvent.title, date: newEvent.date, event_type: newEvent.type, description: newEvent.description || undefined });
    setNewEventModal(false);
    setNewEvent({ title: '', date: '', description: '', type: 'meeting' });
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'activities', label: 'Активности' },
    { key: 'achievements', label: 'Достижения' },
    { key: 'events', label: 'Мероприятия' },
    { key: 'users', label: 'Участники' },
  ];

  return (
    <>
      <PageHeader title="Админ-панель" subtitle="Управление программой HiPo" />
      <div className={styles.page}>
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
              const actUser = allUsers.find(u => u.id === act.userId);
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
                    <Button size="sm" onClick={() => { setAwardModal(ach.id); setAwardUserId(null); }}>🏅 Наградить</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditAchievementId(ach.id)}>Редактировать</Button>
                    <Button size="sm" variant="danger" onClick={() => deleteAchievement.mutate(ach.id)}>Удалить</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EVENTS TAB */}
        {tab === 'events' && (
          <div>
            <Button full style={{ marginBottom: 'var(--space-3)' }} onClick={() => setNewEventModal(true)}>
              + Добавить мероприятие
            </Button>
            <div className={styles.list}>
              {events.map(ev => (
                <div key={ev.id} className={styles.item}>
                  <div className={styles.itemTop}>
                    <p className={styles.itemTitle}>{ev.title}</p>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>{ev.type}</span>
                  </div>
                  <p className={styles.itemSub}>{ev.date}{ev.description ? ` · ${ev.description}` : ''}</p>
                  <div className={styles.itemActions}>
                    <Button size="sm" variant="ghost" onClick={() => setEditEvent({ ...ev })}>Редактировать</Button>
                    <Button size="sm" variant="danger" onClick={() => deleteEvent.mutate(ev.id)}>Удалить</Button>
                  </div>
                </div>
              ))}
              {events.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 'var(--space-4) 0' }}>Мероприятий пока нет</p>}
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {tab === 'users' && (
          <div>
            <Button full style={{ marginBottom: 'var(--space-3)' }} onClick={() => setNewUserModal(true)}>
              + Создать пользователя
            </Button>
            <div className={styles.list}>
            {allUsers.map(u => {
              const pts = leaderboard.find(p => p.userId === u.id);
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
            <Button full onClick={() => {
              if (!editActivity) return;
              updateActivity.mutate({
                id: editActivity.id,
                data: { title: editActivity.title, description: editActivity.description, requested_points: editActivity.requestedPoints, review_note: editActivity.reviewNote },
              }, { onSuccess: () => setEditActivity(null) });
            }}>Сохранить</Button>
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
        <Modal open={true} onClose={() => setEditAchievementId(null)} title="Редактировать достижение" type="sheet">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input label="Название" defaultValue={editAchievement.title} onChange={e => {}} id="ach-title" />
            <Input label="Описание" defaultValue={editAchievement.description} onChange={e => {}} id="ach-desc" />
            <Input label="Иконка" defaultValue={editAchievement.icon} onChange={e => {}} id="ach-icon" />
            <Input label="XP" type="number" defaultValue={String(editAchievement.xp)} onChange={e => {}} id="ach-xp" />
            <Button full onClick={() => {
              const title = (document.getElementById('ach-title') as HTMLInputElement)?.value ?? editAchievement.title;
              const description = (document.getElementById('ach-desc') as HTMLInputElement)?.value ?? editAchievement.description;
              const icon = (document.getElementById('ach-icon') as HTMLInputElement)?.value ?? editAchievement.icon;
              const xp = Number((document.getElementById('ach-xp') as HTMLInputElement)?.value) || editAchievement.xp;
              saveEditedAchievement(editAchievement.id, { title, description, icon, xp });
            }}>Сохранить</Button>
          </div>
        </Modal>
      )}

      {/* New Event Modal */}
      {newEventModal && (
        <Modal open={true} onClose={() => setNewEventModal(false)} title="Добавить мероприятие" type="sheet">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input label="Название *" value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} />
            <Input label="Дата *" type="date" value={newEvent.date} onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))} />
            <Input label="Описание" value={newEvent.description} onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))} />
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Тип</p>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {(['meeting', 'challenge', 'deadline'] as CalendarEvent['type'][]).map(t => (
                  <button key={t} onClick={() => setNewEvent(p => ({ ...p, type: t }))}
                    style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid', cursor: 'pointer', fontSize: 12,
                      borderColor: newEvent.type === t ? 'var(--color-primary)' : 'var(--border-subtle)',
                      background: newEvent.type === t ? 'rgba(204,0,0,0.15)' : 'transparent',
                      color: newEvent.type === t ? 'var(--color-primary-bright)' : 'var(--text-muted)',
                    }}
                  >{t === 'meeting' ? 'Встреча' : t === 'challenge' ? 'Задание' : 'Дедлайн'}</button>
                ))}
              </div>
            </div>
            <Button full onClick={createNewEvent} disabled={createEvent.isPending}>
              {createEvent.isPending ? 'Создание...' : 'Создать мероприятие'}
            </Button>
          </div>
        </Modal>
      )}

      {/* Edit Event Modal */}
      {editEvent && (
        <Modal open={true} onClose={() => setEditEvent(null)} title="Редактировать мероприятие" type="sheet">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input label="Название *" value={editEvent.title} onChange={e => setEditEvent(p => p && ({ ...p, title: e.target.value }))} />
            <Input label="Дата *" type="date" value={editEvent.date} onChange={e => setEditEvent(p => p && ({ ...p, date: e.target.value }))} />
            <Input label="Описание" value={editEvent.description ?? ''} onChange={e => setEditEvent(p => p && ({ ...p, description: e.target.value }))} />
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Тип</p>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {(['meeting', 'challenge', 'deadline'] as CalendarEvent['type'][]).map(t => (
                  <button key={t} onClick={() => setEditEvent(p => p && ({ ...p, type: t }))}
                    style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid', cursor: 'pointer', fontSize: 12,
                      borderColor: editEvent.type === t ? 'var(--color-primary)' : 'var(--border-subtle)',
                      background: editEvent.type === t ? 'rgba(204,0,0,0.15)' : 'transparent',
                      color: editEvent.type === t ? 'var(--color-primary-bright)' : 'var(--text-muted)',
                    }}
                  >{t === 'meeting' ? 'Встреча' : t === 'challenge' ? 'Задание' : 'Дедлайн'}</button>
                ))}
              </div>
            </div>
            <Button full onClick={() => updateEvent.mutate({ id: editEvent.id, data: { title: editEvent.title, date: editEvent.date, event_type: editEvent.type, description: editEvent.description } }, { onSuccess: () => setEditEvent(null) })} disabled={updateEvent.isPending}>
              {updateEvent.isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </Modal>
      )}

      {/* New User Modal */}
      {newUserModal && (
        <Modal open={true} onClose={() => { setNewUserModal(false); setNewUserError(''); }} title="Создать пользователя" type="sheet">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input label="Логин *" value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))} />
            <Input label="Email *" type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} />
            <Input label="Пароль *" type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} />
            <Input label="Имя" value={newUser.firstname} onChange={e => setNewUser(p => ({ ...p, firstname: e.target.value }))} />
            <Input label="Фамилия" value={newUser.lastname} onChange={e => setNewUser(p => ({ ...p, lastname: e.target.value }))} />
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Роль</p>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {(['JUNIOR', 'MENTOR', 'HR'] as UserRole[]).map(r => (
                  <button
                    key={r}
                    onClick={() => setNewUser(p => ({ ...p, role: r }))}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 6, border: '1px solid',
                      borderColor: newUser.role === r ? 'var(--color-primary)' : 'var(--border-subtle)',
                      background: newUser.role === r ? 'rgba(204,0,0,0.15)' : 'transparent',
                      color: newUser.role === r ? 'var(--color-primary-bright)' : 'var(--text-muted)',
                      cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-display)',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            {newUserError && <p style={{ color: 'var(--color-danger-bright)', fontSize: 12 }}>{newUserError}</p>}
            <Button full onClick={createNewUser} disabled={createUser.isPending}>
              {createUser.isPending ? 'Создание...' : 'Создать'}
            </Button>
          </div>
        </Modal>
      )}

      {/* Award Achievement Modal */}
      {awardModal !== null && (() => {
        const ach = achievements.find(a => a.id === awardModal);
        const juniors = allUsers.filter(u => u.role === 'JUNIOR');
        return (
          <Modal open={true} onClose={() => setAwardModal(null)} title="Наградить участника" type="sheet">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {ach && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: 28 }}>{ach.icon}</span>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{ach.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>+{ach.xp} XP</p>
                  </div>
                </div>
              )}
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Выберите участника</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                {juniors.map(u => {
                  const alreadyHas = allUserAchievements.some(ua => ua.user_id === u.id && ua.achievement_id === awardModal);
                  const isSelected = awardUserId === u.id;
                  return (
                    <button key={u.id}
                      onClick={() => !alreadyHas && setAwardUserId(u.id)}
                      disabled={alreadyHas}
                      style={{
                        padding: '8px 12px', borderRadius: 8, border: '1px solid', textAlign: 'left', cursor: alreadyHas ? 'default' : 'pointer', fontSize: 13,
                        borderColor: isSelected ? 'var(--color-primary)' : 'var(--border-subtle)',
                        background: isSelected ? 'rgba(204,0,0,0.1)' : 'transparent',
                        color: alreadyHas ? 'var(--text-muted)' : 'var(--text-primary)',
                        opacity: alreadyHas ? 0.5 : 1,
                      }}
                    >
                      {u.firstname} {u.lastname} <span style={{ color: 'var(--text-muted)' }}>@{u.username}</span>
                      {alreadyHas && <span style={{ marginLeft: 8, fontSize: 11 }}>✓ уже есть</span>}
                    </button>
                  );
                })}
              </div>
              <Button
                full
                disabled={!awardUserId || awardAchievement.isPending}
                onClick={async () => {
                  if (!awardUserId || awardModal === null) return;
                  await awardAchievement.mutateAsync({ user_id: awardUserId, achievement_id: awardModal });
                  setAwardModal(null);
                  setAwardUserId(null);
                }}
              >
                {awardAchievement.isPending ? 'Выдача...' : 'Выдать достижение'}
              </Button>
            </div>
          </Modal>
        );
      })()}
    </>
  );
}
