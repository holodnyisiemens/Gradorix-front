import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@modules/auth/store/authStore';
import {
  useChallenges, useChallengeJuniors, useCreateChallenge,
  useUpdateChallenge, useDeleteChallenge, useAssignChallenge, useUsers,
} from '@shared/hooks/useApi';
import { ChallengeCard } from '@modules/challenges/components/ChallengeCard';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Button } from '@shared/components/ui/Button/Button';
import { Input } from '@shared/components/ui/Input/Input';
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

const EMPTY_FORM = { title: '', description: '', status: 'DRAFT' as ChallengeStatus, date: '', url: '' };

export function ChallengesPage() {
  const user = useAuthStore((s) => s.user)!;
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const [newModal, setNewModal] = useState(false);
  const [newChallenge, setNewChallenge] = useState(EMPTY_FORM);
  const [editChallenge, setEditChallenge] = useState<Challenge | null>(null);
  const [assignChallenge, setAssignChallenge] = useState<Challenge | null>(null);
  const [selectedJuniorIds, setSelectedJuniorIds] = useState<number[]>([]);

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

  const juniors = allUsers.filter(u => u.role === 'JUNIOR');

  const allChallenges = isJunior
    ? assignments.map((a) => {
        const challenge = challenges.find((c) => c.id === a.challenge_id);
        if (!challenge) return null;
        return { ...challenge, progress: a.progress };
      }).filter(Boolean) as (typeof challenges[number] & { progress: ChallengeJuniorProgress })[]
    : challenges;

  const filtered = filter === 'all'
    ? allChallenges
    : allChallenges.filter((c) => {
        if (isJunior && 'progress' in c) return c.progress === filter;
        return c.status === filter;
      });

  async function handleCreate() {
    if (!newChallenge.title) return;
    await createChallenge.mutateAsync({
      title: newChallenge.title,
      description: newChallenge.description || undefined,
      status: newChallenge.status,
      date: newChallenge.date || undefined,
      url: newChallenge.url || undefined,
    });
    setNewModal(false);
    setNewChallenge(EMPTY_FORM);
  }

  async function handleEdit() {
    if (!editChallenge) return;
    await updateChallenge.mutateAsync({
      id: editChallenge.id,
      data: {
        title: editChallenge.title,
        description: editChallenge.description,
        status: editChallenge.status,
        date: editChallenge.date,
        url: editChallenge.url,
      },
    });
    setEditChallenge(null);
  }

  async function handleAssign() {
    if (!assignChallenge || selectedJuniorIds.length === 0) return;
    const existing = allAssignments.filter(a => a.challenge_id === assignChallenge.id).map(a => a.junior_id);
    const toAssign = selectedJuniorIds.filter(id => !existing.includes(id));
    await Promise.all(toAssign.map(juniorId =>
      assignChallengeMut.mutateAsync({ challenge_id: assignChallenge.id, junior_id: juniorId, assigned_by: user.id, progress: 'GOING' })
    ));
    setAssignChallenge(null);
    setSelectedJuniorIds([]);
  }

  function toggleJunior(id: number) {
    setSelectedJuniorIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  const title = isJunior ? 'Мои задачи' : 'Задачи';

  return (
    <>
      <PageHeader title={title} subtitle={`${filtered.length} из ${allChallenges.length}`} />
      <div className={styles.page}>
        {!isJunior && (
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
            {filtered.map((c) => (
              <div key={c.id}>
                <ChallengeCard challenge={c} showProgress={isJunior} onClick={() => navigate(`/challenges/${c.id}`)} />
                {!isJunior && (
                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-1)', marginBottom: 'var(--space-3)' }}>
                    <Button size="sm" variant="ghost" onClick={() => setEditChallenge({ ...c })}>Редактировать</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setAssignChallenge(c); setSelectedJuniorIds(allAssignments.filter(a => a.challenge_id === c.id).map(a => a.junior_id)); }}>Назначить</Button>
                    <Button size="sm" variant="danger" onClick={() => deleteChallenge.mutate(c.id)}>Удалить</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Создать задачу */}
      {newModal && (
        <Modal open={true} onClose={() => setNewModal(false)} title="Создать задачу" type="dialog">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input label="Название *" value={newChallenge.title} onChange={e => setNewChallenge(p => ({ ...p, title: e.target.value }))} />
            <Input label="Описание" value={newChallenge.description} onChange={e => setNewChallenge(p => ({ ...p, description: e.target.value }))} />
            <Input label="Ссылка (URL)" value={newChallenge.url} onChange={e => setNewChallenge(p => ({ ...p, url: e.target.value }))} />
            <Input label="Дата дедлайна" type="date" value={newChallenge.date} onChange={e => setNewChallenge(p => ({ ...p, date: e.target.value }))} />
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
                  >{s}</button>
                ))}
              </div>
            </div>
            <Button full onClick={handleCreate} disabled={createChallenge.isPending}>
              {createChallenge.isPending ? 'Создание...' : 'Создать'}
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
            <Input label="Дата дедлайна" type="date" value={editChallenge.date ?? ''} onChange={e => setEditChallenge(p => p && ({ ...p, date: e.target.value }))} />
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
                  >{s}</button>
                ))}
              </div>
            </div>
            <Button full onClick={handleEdit} disabled={updateChallenge.isPending}>
              {updateChallenge.isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </Modal>
      )}

      {/* Назначить HiPo */}
      {assignChallenge && (
        <Modal open={true} onClose={() => { setAssignChallenge(null); setSelectedJuniorIds([]); }} title={`Назначить: ${assignChallenge.title}`} type="dialog">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Выберите HiPo участников:</p>
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
              {juniors.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Нет доступных HiPo участников</p>}
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
