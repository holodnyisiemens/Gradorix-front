import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@modules/auth/store/authStore';
import {
  useChallenges, useChallengeJuniors, useCreateChallenge,
  useUpdateChallenge, useDeleteChallenge, useAssignChallenge, useUnassignChallenge, useUsers, useCreateNotification,
  useCreateCalendarEvent,
} from '@shared/hooks/useApi';
import { ChallengeCard } from '@modules/challenges/components/ChallengeCard';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Button } from '@shared/components/ui/Button/Button';
import { Input } from '@shared/components/ui/Input/Input';
import { DateInput } from '@shared/components/ui/Input/DateInput';
import { Modal } from '@shared/components/ui/Modal/Modal';
import type { Challenge, ChallengeStatus, ChallengeJuniorProgress } from '@shared/types';
import styles from './ChallengesPage.module.css';

type Filter = 'all' | ChallengeStatus | ChallengeJuniorProgress;

const JUNIOR_FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',         label: 'Все' },
  { key: 'IN_PROGRESS', label: 'В процессе' },
  { key: 'GOING',       label: 'Не начаты' },
  { key: 'DONE',        label: 'Выполнены' },
  { key: 'SKIPPED',     label: 'Пропущены' },
];

const HR_MENTOR_FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',       label: 'Все' },
  { key: 'ACTIVE',    label: 'Активные' },
  { key: 'UPCOMING',  label: 'Скоро' },
  { key: 'COMPLETED', label: 'Завершены' },
  { key: 'DRAFT',     label: 'Черновики' },
];

const EMPTY_FORM = { title: '', description: '', status: 'DRAFT' as ChallengeStatus, date: '', url: '', maxPoints: '', assignAll: false };

export function ChallengesPage() {
  const user = useAuthStore((s) => s.user)!;
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const [newModal, setNewModal] = useState(false);
  const [newChallenge, setNewChallenge] = useState(EMPTY_FORM);
  const [createError, setCreateError] = useState('');
  const [editChallenge, setEditChallenge] = useState<(Challenge & { maxPointsStr: string }) | null>(null);
  const [assignChallenge, setAssignChallenge] = useState<Challenge | null>(null);
  const [selectedJuniorIds, setSelectedJuniorIds] = useState<number[]>([]);
  const [assignAllEdit, setAssignAllEdit] = useState(false);

  const isJunior = user.role === 'JUNIOR';
  const filters = isJunior ? JUNIOR_FILTERS : HR_MENTOR_FILTERS;

  const { data: challenges = [] } = useChallenges();
  const { data: allUsers = [] } = useUsers();
  const { data: assignments = [] } = useChallengeJuniors(isJunior ? { junior_id: user.id } : undefined);
  const { data: allAssignments = [] } = useChallengeJuniors();
  const createChallenge = useCreateChallenge();
  const updateChallenge = useUpdateChallenge();
  const deleteChallenge = useDeleteChallenge();
  const assignChallengeMut = useAssignChallenge();
  const unassignChallengeMut = useUnassignChallenge();
  const createNotification = useCreateNotification();
  const createCalendarEvent = useCreateCalendarEvent();

  const juniors = allUsers.filter(u => u.role === 'JUNIOR');

  const allChallenges = isJunior
    ? assignments
        .map((a) => {
          const challenge = challenges.find((c) => c.id === a.challenge_id);
          if (!challenge) return null;
          // HiPo never sees DRAFT challenges
          if (challenge.status === 'DRAFT') return null;
          return { ...challenge, progress: a.progress, awardedPoints: a.awarded_points };
        })
        .filter(Boolean) as (typeof challenges[number] & { progress: ChallengeJuniorProgress; awardedPoints?: number })[]
    : challenges;

  const filtered = filter === 'all'
    ? allChallenges
    : allChallenges.filter((c) => {
        if (isJunior && 'progress' in c) return c.progress === filter;
        return c.status === filter;
      });

  async function handleCreate() {
    if (!newChallenge.title) return;
    setCreateError('');
    const maxPts = newChallenge.maxPoints ? Number(newChallenge.maxPoints) : undefined;
    try {
      const created = await createChallenge.mutateAsync({
        title: newChallenge.title,
        description: newChallenge.description || undefined,
        status: newChallenge.status,
        date: newChallenge.date || undefined,
        url: newChallenge.url || undefined,
        max_points: maxPts,
      });
      if (newChallenge.date) {
        createCalendarEvent.mutate({
          title: `Дедлайн: ${created.title}`,
          date: newChallenge.date,
          event_type: 'deadline',
          challenge_id: created.id,
          description: newChallenge.description || undefined,
        });
      }
      if (newChallenge.assignAll && juniors.length > 0) {
        await Promise.all(juniors.map(j =>
          assignChallengeMut.mutateAsync({ challenge_id: created.id, junior_id: j.id, assigned_by: user.id, progress: 'GOING' })
        ));
        await Promise.all(juniors.map(j =>
          createNotification.mutateAsync({
            user_id: j.id,
            message: `📋 Вам назначена новая задача «${created.title}»||/challenges/${created.id}`,
          })
        ));
      }
      setNewModal(false);
      setNewChallenge(EMPTY_FORM);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setCreateError(msg ?? 'Ошибка при создании задачи');
    }
  }

  async function handleEdit() {
    if (!editChallenge) return;
    const maxPts = editChallenge.maxPointsStr ? Number(editChallenge.maxPointsStr) : undefined;
    await updateChallenge.mutateAsync({
      id: editChallenge.id,
      data: {
        title: editChallenge.title,
        description: editChallenge.description,
        status: editChallenge.status,
        date: editChallenge.date,
        url: editChallenge.url,
        max_points: maxPts,
      },
    });
    if (assignAllEdit && juniors.length > 0) {
      const existing = allAssignments.filter(a => a.challenge_id === editChallenge.id).map(a => a.junior_id);
      const toAssign = juniors.filter(j => !existing.includes(j.id));
      if (toAssign.length > 0) {
        await Promise.all(toAssign.map(j =>
          assignChallengeMut.mutateAsync({ challenge_id: editChallenge.id, junior_id: j.id, assigned_by: user.id, progress: 'GOING' })
        ));
        await Promise.all(toAssign.map(j =>
          createNotification.mutateAsync({
            user_id: j.id,
            message: `📋 Вам назначена новая задача «${editChallenge.title}»||/challenges/${editChallenge.id}`,
          })
        ));
      }
    }
    setEditChallenge(null);
    setAssignAllEdit(false);
  }

  async function handleAssign() {
    if (!assignChallenge) return;
    const existing = allAssignments.filter(a => a.challenge_id === assignChallenge.id).map(a => a.junior_id);
    const toAssign = selectedJuniorIds.filter(id => !existing.includes(id));
    const toUnassign = existing.filter(id => !selectedJuniorIds.includes(id));
    await Promise.all(toUnassign.map(juniorId =>
      unassignChallengeMut.mutateAsync({ challengeId: assignChallenge.id, juniorId })
    ));
    await Promise.all(toAssign.map(juniorId =>
      assignChallengeMut.mutateAsync({ challenge_id: assignChallenge.id, junior_id: juniorId, assigned_by: user.id, progress: 'GOING' })
    ));
    await Promise.all(toAssign.map(juniorId =>
      createNotification.mutateAsync({
        user_id: juniorId,
        message: `📋 Вам назначена новая задача «${assignChallenge.title}»||/challenges/${assignChallenge.id}`,
      })
    ));
    setAssignChallenge(null);
    setSelectedJuniorIds([]);
  }

  function toggleJunior(id: number) {
    setSelectedJuniorIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function openEdit(c: Challenge) {
    setEditChallenge({ ...c, maxPointsStr: c.maxPoints != null ? String(c.maxPoints) : '' });
    setAssignAllEdit(false);
  }

  const title = isJunior ? 'Мои задачи' : 'Задачи';

  return (
    <>
      <PageHeader title={title} subtitle={`${filtered.length} из ${allChallenges.length}`} />
      <div className={styles.page}>
        {user.role === 'HR' && (
          <Button full style={{ marginBottom: 'var(--space-3)' }} onClick={() => setNewModal(true)}>
            + Создать задачу
          </Button>
        )}
        <div className={styles.filters}>
          {filters.map((f) => (
            <button key={f.key}
              className={[styles.filterBtn, filter === f.key ? styles.active : ''].join(' ')}
              onClick={() => setFilter(f.key)}
            >{f.label}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className={styles.empty}>Ничего не найдено</div>
        ) : (
          <div className={styles.list}>
            {filtered.map((c) => {
              const isUpcoming = isJunior && c.status === 'UPCOMING';
              return (
                <div key={c.id}>
                  <ChallengeCard
                    challenge={c}
                    awardedPoints={isJunior && 'awardedPoints' in c ? c.awardedPoints : undefined}
                    showProgress={isJunior}
                    locked={isUpcoming}
                    onClick={isUpcoming ? undefined : () => navigate(`/challenges/${c.id}`)}
                  />
                  {user.role === 'HR' && (
                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-1)', marginBottom: 'var(--space-3)' }}>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>Редактировать</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setAssignChallenge(c); setSelectedJuniorIds(allAssignments.filter(a => a.challenge_id === c.id).map(a => a.junior_id)); }}>Назначить</Button>
                      <Button size="sm" variant="danger" onClick={() => { if (window.confirm(`Удалить задачу «${c.title}»?`)) deleteChallenge.mutate(c.id); }}>Удалить</Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Создать задачу */}
      {newModal && (
        <Modal open={true} onClose={() => { setNewModal(false); setCreateError(''); }} title="Создать задачу" type="dialog">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input label="Название *" value={newChallenge.title} onChange={e => setNewChallenge(p => ({ ...p, title: e.target.value }))} />
            <Input label="Описание" value={newChallenge.description} onChange={e => setNewChallenge(p => ({ ...p, description: e.target.value }))} />
            <Input label="Ссылка (URL)" value={newChallenge.url} onChange={e => setNewChallenge(p => ({ ...p, url: e.target.value }))} />
            <DateInput label="Дата дедлайна" value={newChallenge.date} onChange={date => setNewChallenge(p => ({ ...p, date }))} />
            <Input label="Максимум баллов" type="number" value={newChallenge.maxPoints} onChange={e => setNewChallenge(p => ({ ...p, maxPoints: e.target.value }))} />
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Статус</p>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {(['DRAFT', 'UPCOMING', 'ACTIVE'] as ChallengeStatus[]).map(s => (
                  <button key={s} onClick={() => setNewChallenge(p => ({ ...p, status: s }))}
                    style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-display)',
                      borderColor: newChallenge.status === s ? 'var(--color-primary)' : 'var(--border-subtle)',
                      background: newChallenge.status === s ? 'rgba(204,0,0,0.15)' : 'transparent',
                      color: newChallenge.status === s ? 'var(--color-primary-bright)' : 'var(--text-muted)',
                    }}
                  >{{ DRAFT: 'Черновик', UPCOMING: 'Скоро', ACTIVE: 'Активна' }[s]}</button>
                ))}
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', userSelect: 'none' }}>
              <div
                onClick={() => setNewChallenge(p => ({ ...p, assignAll: !p.assignAll }))}
                style={{
                  width: 36, height: 20, borderRadius: 10, position: 'relative', flexShrink: 0,
                  background: newChallenge.assignAll ? 'var(--color-primary)' : 'var(--border-subtle)',
                  transition: 'background 0.2s',
                  cursor: 'pointer',
                }}
              >
                <span style={{
                  position: 'absolute', top: 2, left: newChallenge.assignAll ? 18 : 2,
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                Назначить всем участникам
                {newChallenge.assignAll && juniors.length > 0 && (
                  <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>({juniors.length})</span>
                )}
              </span>
            </label>
            {createError && <p style={{ color: 'var(--color-primary-bright)', fontSize: 12 }}>{createError}</p>}
            <Button full onClick={handleCreate} disabled={createChallenge.isPending || assignChallengeMut.isPending}>
              {assignChallengeMut.isPending ? 'Назначение...' : createChallenge.isPending ? 'Создание...' : newChallenge.assignAll && juniors.length > 0 ? `Создать и назначить (${juniors.length})` : 'Создать'}
            </Button>
          </div>
        </Modal>
      )}

      {/* Редактировать задачу */}
      {editChallenge && (
        <Modal open={true} onClose={() => setEditChallenge(null)} title="Редактировать задачу" type="dialog">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input label="Название *" value={editChallenge.title} onChange={e => setEditChallenge(p => p && ({ ...p, title: e.target.value }))} />
            <Input label="Описание" value={editChallenge.description ?? ''} onChange={e => setEditChallenge(p => p && ({ ...p, description: e.target.value }))} />
            <Input label="Ссылка (URL)" value={editChallenge.url ?? ''} onChange={e => setEditChallenge(p => p && ({ ...p, url: e.target.value }))} />
            <DateInput label="Дата дедлайна" value={editChallenge.date ?? ''} onChange={date => setEditChallenge(p => p && ({ ...p, date }))} />
            <Input label="Максимум баллов" type="number" value={editChallenge.maxPointsStr} onChange={e => setEditChallenge(p => p && ({ ...p, maxPointsStr: e.target.value }))} />
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Статус</p>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                {(['DRAFT', 'UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as ChallengeStatus[]).map(s => (
                  <button key={s} onClick={() => setEditChallenge(p => p && ({ ...p, status: s }))}
                    style={{ flex: 1, padding: '6px', borderRadius: 6, border: '1px solid', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-display)',
                      borderColor: editChallenge.status === s ? 'var(--color-primary)' : 'var(--border-subtle)',
                      background: editChallenge.status === s ? 'rgba(204,0,0,0.15)' : 'transparent',
                      color: editChallenge.status === s ? 'var(--color-primary-bright)' : 'var(--text-muted)',
                    }}
                  >{{ DRAFT: 'Черновик', UPCOMING: 'Скоро', ACTIVE: 'Активна', COMPLETED: 'Завершена', CANCELLED: 'Отменена' }[s]}</button>
                ))}
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', userSelect: 'none' }}>
              <div
                onClick={() => setAssignAllEdit(p => !p)}
                style={{
                  width: 36, height: 20, borderRadius: 10, position: 'relative', flexShrink: 0,
                  background: assignAllEdit ? 'var(--color-primary)' : 'var(--border-subtle)',
                  transition: 'background 0.2s', cursor: 'pointer',
                }}
              >
                <span style={{
                  position: 'absolute', top: 2, left: assignAllEdit ? 18 : 2,
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                Назначить неназначенным участникам
                {assignAllEdit && (() => {
                  const existing = allAssignments.filter(a => a.challenge_id === editChallenge!.id).map(a => a.junior_id);
                  const count = juniors.filter(j => !existing.includes(j.id)).length;
                  return count > 0 ? <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>({count})</span> : null;
                })()}
              </span>
            </label>
            <Button full onClick={handleEdit} disabled={updateChallenge.isPending || assignChallengeMut.isPending}>
              {assignChallengeMut.isPending ? 'Назначение...' : updateChallenge.isPending ? 'Сохранение...' : assignAllEdit ? 'Сохранить и назначить' : 'Сохранить'}
            </Button>
          </div>
        </Modal>
      )}

      {/* Назначить HiPo */}
      {assignChallenge && (
        <Modal open={true} onClose={() => { setAssignChallenge(null); setSelectedJuniorIds([]); }} title={`Назначить: ${assignChallenge.title}`} type="dialog">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Выберите участников:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', maxHeight: 280, overflowY: 'auto' }}>
              {juniors.map(j => {
                const isSelected = selectedJuniorIds.includes(j.id);
                return (
                  <button key={j.id} onClick={() => toggleJunior(j.id)}
                    style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid', textAlign: 'left', cursor: 'pointer',
                      borderColor: isSelected ? 'var(--color-primary)' : 'var(--border-subtle)',
                      background: isSelected ? 'rgba(204,0,0,0.15)' : 'transparent',
                      color: 'var(--text-primary)', fontSize: 13,
                    }}
                  >
                    {isSelected ? '✓ ' : ''}{j.firstname} {j.lastname} <span style={{ color: 'var(--text-muted)' }}>@{j.username}</span>
                  </button>
                );
              })}
              {juniors.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Нет доступных Участник проектаов</p>}
            </div>
            <Button full onClick={handleAssign} disabled={selectedJuniorIds.length === 0 || assignChallengeMut.isPending}>
              {assignChallengeMut.isPending ? 'Назначение...' : `Назначить (${selectedJuniorIds.length})`}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
