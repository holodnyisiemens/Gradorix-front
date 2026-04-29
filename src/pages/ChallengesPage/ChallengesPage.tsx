import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@modules/auth/store/authStore';
import {
  useChallenges, useChallengeJuniors, useCreateChallenge, useAssignChallenge, useUsers,
  useCreateCalendarEvent,
} from '@shared/hooks/useApi';
import { ChallengeCard } from '@modules/challenges/components/ChallengeCard';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Button } from '@shared/components/ui/Button/Button';
import { Input } from '@shared/components/ui/Input/Input';
import { DateInput } from '@shared/components/ui/Input/DateInput';
import { Modal } from '@shared/components/ui/Modal/Modal';
import type { ChallengeStatus, ChallengeEmployeeProgress } from '@shared/types';
import styles from './ChallengesPage.module.css';

type Filter = 'all' | ChallengeStatus | ChallengeEmployeeProgress;

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
  { key: 'COMPLETED', label: 'Завершены' },
  { key: 'DRAFT',     label: 'Черновики' },
];

const EMPTY_FORM = { title: '', description: '', status: 'DRAFT' as ChallengeStatus, date: '', url: '', maxPoints: '', assignAll: false, personal: false };

export function ChallengesPage() {
  const user = useAuthStore((s) => s.user)!;
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [newModal, setNewModal] = useState(false);
  const [newChallenge, setNewChallenge] = useState(EMPTY_FORM);
  const [createError, setCreateError] = useState('');

  const isEmployee = user.role === 'EMPLOYEE';
  const filters = isEmployee ? JUNIOR_FILTERS : HR_MENTOR_FILTERS;

  const { data: challenges = [] } = useChallenges();
  const { data: allUsers = [] } = useUsers();
  const { data: assignments = [] } = useChallengeJuniors(isEmployee ? { employee_id: user.id } : undefined);
  const { data: allAssignments = [] } = useChallengeJuniors();
  const createChallenge = useCreateChallenge();
  const assignChallengeMut = useAssignChallenge();
  const createCalendarEvent = useCreateCalendarEvent();

  const juniors = allUsers.filter(u => u.role === 'EMPLOYEE');

  const allChallenges = isEmployee
    ? assignments
        .map((a) => {
          const challenge = challenges.find((c) => c.id === a.challenge_id);
          if (!challenge) return null;
          if (challenge.status === 'DRAFT') return null;
          return { ...challenge, progress: a.progress, awardedPoints: a.awarded_points };
        })
        .filter(Boolean) as (typeof challenges[number] & { progress: ChallengeEmployeeProgress; awardedPoints?: number })[]
    : challenges;

  const filtered = (filter === 'all'
    ? allChallenges
    : allChallenges.filter((c) => {
        if (isEmployee && 'progress' in c) return c.progress === filter;
        return c.status === filter;
      })
  )
    .filter(c => !search.trim() || c.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (user.role !== 'HR') return 0;
      const pa = allAssignments.filter(x => x.challenge_id === a.id && x.progress === 'DONE' && x.awarded_points == null).length;
      const pb = allAssignments.filter(x => x.challenge_id === b.id && x.progress === 'DONE' && x.awarded_points == null).length;
      return pb - pa;
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
      if (newChallenge.personal) {
        await assignChallengeMut.mutateAsync({ challenge_id: created.id, employee_id: user.id, assigned_by: user.id, progress: 'GOING' });
      } else if (newChallenge.assignAll && juniors.length > 0) {
        await Promise.all(juniors.map(j =>
          assignChallengeMut.mutateAsync({ challenge_id: created.id, employee_id: j.id, assigned_by: user.id, progress: 'GOING' })
        ));
      }
      setNewModal(false);
      setNewChallenge(EMPTY_FORM);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setCreateError(msg ?? 'Ошибка при создании задачи');
    }
  }

  const title = isEmployee ? 'Мои задачи' : 'Задачи';

  return (
    <>
      <PageHeader title={title} subtitle={`${filtered.length} из ${allChallenges.length}`} />
      <div className={styles.page}>
        {user.role === 'HR' && (
          <Button full style={{ marginBottom: 'var(--space-3)' }} onClick={() => setNewModal(true)}>
            + Создать задачу
          </Button>
        )}
        <input
          className={styles.search}
          placeholder="Поиск по задачам..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
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
              const pendingCount = user.role === 'HR'
                ? allAssignments.filter(a => a.challenge_id === c.id && a.progress === 'DONE' && a.awarded_points == null).length
                : 0;
              return (
                <ChallengeCard
                  key={c.id}
                  challenge={c}
                  awardedPoints={isEmployee && 'awardedPoints' in c ? (c.awardedPoints as number | null) : undefined}
                  showProgress={isEmployee}
                  pendingReview={pendingCount || undefined}
                  onClick={() => navigate(`/challenges/${c.id}`)}
                />
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
            {!newChallenge.personal && (
              <Input label="Максимум баллов" type="number" value={newChallenge.maxPoints} onChange={e => setNewChallenge(p => ({ ...p, maxPoints: e.target.value }))} />
            )}
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Статус</p>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {(['DRAFT', 'ACTIVE'] as ChallengeStatus[]).map(s => (
                  <button key={s} onClick={() => setNewChallenge(p => ({ ...p, status: s }))}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 6, border: '1px solid', cursor: 'pointer',
                      fontSize: 12, fontFamily: 'var(--font-display)',
                      borderColor: newChallenge.status === s ? 'var(--color-primary)' : 'var(--border-subtle)',
                      background: newChallenge.status === s ? 'rgba(204,0,0,0.15)' : 'transparent',
                      color: newChallenge.status === s ? 'var(--color-primary-bright)' : 'var(--text-muted)',
                    }}
                  >
                    {{ DRAFT: 'Черновик', ACTIVE: 'Активна' }[s as 'DRAFT' | 'ACTIVE']}
                  </button>
                ))}
              </div>
            </div>
            {/* Personal toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', userSelect: 'none' }}>
              <div
                onClick={() => setNewChallenge(p => ({ ...p, personal: !p.personal, assignAll: false }))}
                style={{
                  width: 36, height: 20, borderRadius: 10, position: 'relative', flexShrink: 0,
                  background: newChallenge.personal ? 'var(--color-primary)' : 'var(--border-subtle)',
                  transition: 'background 0.2s', cursor: 'pointer',
                }}
              >
                <span style={{
                  position: 'absolute', top: 2, left: newChallenge.personal ? 18 : 2,
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>Личная задача (только для меня)</span>
            </label>
            {/* Assign-all toggle — hidden for personal */}
            {!newChallenge.personal && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', userSelect: 'none' }}>
                <div
                  onClick={() => setNewChallenge(p => ({ ...p, assignAll: !p.assignAll }))}
                  style={{
                    width: 36, height: 20, borderRadius: 10, position: 'relative', flexShrink: 0,
                    background: newChallenge.assignAll ? 'var(--color-primary)' : 'var(--border-subtle)',
                    transition: 'background 0.2s', cursor: 'pointer',
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
            )}
            {createError && <p style={{ color: 'var(--color-primary-bright)', fontSize: 12 }}>{createError}</p>}
            <Button full onClick={handleCreate} disabled={createChallenge.isPending || assignChallengeMut.isPending}>
              {assignChallengeMut.isPending ? 'Назначение...' : createChallenge.isPending ? 'Создание...' : newChallenge.personal ? 'Создать для себя' : newChallenge.assignAll && juniors.length > 0 ? `Создать и назначить (${juniors.length})` : 'Создать'}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
