import { useState } from 'react';
import { useAuthStore } from '@modules/auth/store/authStore';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Card } from '@shared/components/ui/Card/Card';
import { Badge } from '@shared/components/ui/Badge/Badge';
import { Button } from '@shared/components/ui/Button/Button';
import { Input } from '@shared/components/ui/Input/Input';
import { Modal } from '@shared/components/ui/Modal/Modal';
import { useTeams, useUsers, useCreateTeam, useUpdateTeam, useDeleteTeam } from '@shared/hooks/useApi';
import type { TeamStatus } from '@shared/types';
import styles from './TeamPage.module.css';

const STATUS_LABEL: Record<string, string> = {
  active: 'Активна', on_hold: 'На паузе', completed: 'Завершена',
};
const STATUS_COLOR: Record<string, 'green' | 'orange' | 'gray'> = {
  active: 'green', on_hold: 'orange', completed: 'gray',
};

export function TeamPage() {
  const user = useAuthStore((s) => s.user)!;
  const isHR = user.role === 'HR';
  const { data: teams = [], isLoading } = useTeams();
  const { data: allUsers = [] } = useUsers();
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();

  const [createModal, setCreateModal] = useState(false);
  const [editTeamId, setEditTeamId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', project: '', description: '', status: 'active' as TeamStatus, mentor_id: '' as string | number, member_ids: [] as number[] });

  const mentors = allUsers.filter(u => u.role === 'MENTOR');
  const juniors = allUsers.filter(u => u.role === 'JUNIOR');

  const team = isHR ? null : teams.find((t) => t.memberIds.includes(user.id) || t.mentorId === user.id);

  function toggleMember(id: number) {
    setForm(p => ({
      ...p,
      member_ids: p.member_ids.includes(id) ? p.member_ids.filter(x => x !== id) : [...p.member_ids, id],
    }));
  }

  async function handleCreate() {
    if (!form.name) return;
    await createTeam.mutateAsync({
      name: form.name,
      project: form.project,
      description: form.description,
      status: form.status,
      mentor_id: form.mentor_id ? Number(form.mentor_id) : undefined,
      member_ids: form.member_ids,
    });
    setCreateModal(false);
    setForm({ name: '', project: '', description: '', status: 'active', mentor_id: '', member_ids: [] });
  }

  async function handleEdit() {
    if (!editTeamId) return;
    await updateTeam.mutateAsync({
      id: editTeamId,
      data: {
        name: form.name,
        project: form.project,
        description: form.description,
        status: form.status,
        mentor_id: form.mentor_id ? Number(form.mentor_id) : undefined,
        member_ids: form.member_ids,
      },
    });
    setEditTeamId(null);
  }

  function openEdit(t: typeof teams[number]) {
    setEditTeamId(t.id);
    setForm({ name: t.name, project: t.project, description: t.description, status: t.status, mentor_id: t.mentorId ?? '', member_ids: t.memberIds });
  }

  if (isLoading) return null;

  // HR view: all teams management
  if (isHR) {
    return (
      <>
        <PageHeader title="Команды" subtitle={`${teams.length} команд`} />
        <div className={styles.page}>
          <Button full style={{ marginBottom: 'var(--space-3)' }} onClick={() => setCreateModal(true)}>
            + Создать команду
          </Button>
          {teams.map(t => {
            const mentor = t.mentorId ? allUsers.find(u => u.id === t.mentorId) : null;
            const members = t.memberIds.map(id => allUsers.find(u => u.id === id)).filter(Boolean);
            return (
              <Card key={t.id} accent style={{ marginBottom: 'var(--space-3)' }}>
                <div className={styles.teamHeader}>
                  <div className={styles.teamInfo}>
                    <p className={styles.teamName}>{t.name}</p>
                    <p className={styles.teamProject}>{t.project}</p>
                  </div>
                  <Badge color={STATUS_COLOR[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                </div>
                {mentor && <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0' }}>Ментор: {mentor.firstname} {mentor.lastname}</p>}
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Участников: {members.length}</p>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(t)}>Редактировать</Button>
                  <Button size="sm" variant="danger" onClick={() => deleteTeam.mutate(t.id)}>Удалить</Button>
                </div>
              </Card>
            );
          })}
          {teams.length === 0 && <div className={styles.empty}><span>👥</span><p>Команд пока нет</p></div>}
        </div>

        {/* Форма создания/редактирования */}
        {(createModal || editTeamId !== null) && (
          <Modal open={true} onClose={() => { setCreateModal(false); setEditTeamId(null); }} title={editTeamId ? 'Редактировать команду' : 'Создать команду'} type="sheet">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Input label="Название команды *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              <Input label="Проект" value={form.project} onChange={e => setForm(p => ({ ...p, project: e.target.value }))} />
              <Input label="Описание" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Статус</p>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  {(['active', 'on_hold', 'completed'] as TeamStatus[]).map(s => (
                    <button key={s} onClick={() => setForm(p => ({ ...p, status: s }))}
                      style={{ flex: 1, padding: '6px', borderRadius: 6, border: '1px solid', cursor: 'pointer', fontSize: 11,
                        borderColor: form.status === s ? 'var(--color-primary)' : 'var(--border-subtle)',
                        background: form.status === s ? 'rgba(204,0,0,0.15)' : 'transparent',
                        color: form.status === s ? 'var(--color-primary-bright)' : 'var(--text-muted)',
                      }}
                    >{STATUS_LABEL[s]}</button>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Ментор</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 120, overflowY: 'auto' }}>
                  <button onClick={() => setForm(p => ({ ...p, mentor_id: '' }))}
                    style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid', textAlign: 'left', cursor: 'pointer', fontSize: 12,
                      borderColor: !form.mentor_id ? 'var(--color-primary)' : 'var(--border-subtle)',
                      background: !form.mentor_id ? 'rgba(204,0,0,0.15)' : 'transparent',
                      color: !form.mentor_id ? 'var(--color-primary-bright)' : 'var(--text-muted)',
                    }}
                  >— Без ментора</button>
                  {mentors.map(m => (
                    <button key={m.id} onClick={() => setForm(p => ({ ...p, mentor_id: m.id }))}
                      style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid', textAlign: 'left', cursor: 'pointer', fontSize: 12,
                        borderColor: form.mentor_id === m.id ? 'var(--color-primary)' : 'var(--border-subtle)',
                        background: form.mentor_id === m.id ? 'rgba(204,0,0,0.15)' : 'transparent',
                        color: 'var(--text-primary)',
                      }}
                    >{m.firstname} {m.lastname} <span style={{ color: 'var(--text-muted)' }}>@{m.username}</span></button>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Участники HiPo</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 150, overflowY: 'auto' }}>
                  {juniors.map(j => {
                    const sel = form.member_ids.includes(j.id);
                    return (
                      <button key={j.id} onClick={() => toggleMember(j.id)}
                        style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid', textAlign: 'left', cursor: 'pointer', fontSize: 12,
                          borderColor: sel ? 'var(--color-primary)' : 'var(--border-subtle)',
                          background: sel ? 'rgba(204,0,0,0.15)' : 'transparent',
                          color: 'var(--text-primary)',
                        }}
                      >{sel ? '✓ ' : ''}{j.firstname} {j.lastname} <span style={{ color: 'var(--text-muted)' }}>@{j.username}</span></button>
                    );
                  })}
                </div>
              </div>
              <Button full onClick={editTeamId ? handleEdit : handleCreate} disabled={createTeam.isPending || updateTeam.isPending}>
                {editTeamId ? 'Сохранить' : 'Создать команду'}
              </Button>
            </div>
          </Modal>
        )}
      </>
    );
  }

  // Non-HR: show own team
  if (!team) {
    return (
      <>
        <PageHeader title="Моя команда" />
        <div className={styles.page}>
          <div className={styles.empty}><span>👥</span><p>Вы ещё не добавлены в команду</p></div>
        </div>
      </>
    );
  }

  const mentor = team.mentorId ? allUsers.find((u) => u.id === team.mentorId) : null;
  const members = team.memberIds.map((id) => allUsers.find((u) => u.id === id)).filter(Boolean) as typeof allUsers;

  return (
    <>
      <PageHeader title="Моя команда" subtitle={team.project} />
      <div className={styles.page}>
        <Card accent>
          <div className={styles.teamHeader}>
            <div className={styles.teamIcon}>👥</div>
            <div className={styles.teamInfo}>
              <p className={styles.teamName}>{team.name}</p>
              <p className={styles.teamProject}>{team.project}</p>
            </div>
            <Badge color={STATUS_COLOR[team.status]}>{STATUS_LABEL[team.status]}</Badge>
          </div>
          <p className={styles.teamDesc}>{team.description}</p>
        </Card>

        {mentor && (
          <div>
            <p className={styles.sectionLabel}>Ментор</p>
            <Card>
              <div className={styles.memberRow}>
                <div className={styles.avatar} style={{ borderColor: 'rgba(58,154,238,0.4)', color: 'var(--color-info-bright)' }}>
                  {(mentor.firstname?.[0] ?? '') + (mentor.lastname?.[0] ?? '')}
                </div>
                <div className={styles.memberInfo}>
                  <p className={styles.memberName}>{mentor.firstname} {mentor.lastname}</p>
                  <p className={styles.memberRole}>@{mentor.username}</p>
                </div>
                <Badge color="blue">Ментор</Badge>
              </div>
            </Card>
          </div>
        )}

        <div>
          <p className={styles.sectionLabel}>Участники · {members.length}</p>
          <div className={styles.memberList}>
            {members.map((m) => {
              if (!m) return null;
              const isMe = m.id === user.id;
              return (
                <Card key={m.id}>
                  <div className={styles.memberRow}>
                    <div className={styles.avatar} style={{ borderColor: isMe ? 'rgba(204,0,0,0.4)' : 'rgba(61,189,106,0.4)', color: isMe ? 'var(--color-primary-bright)' : 'var(--color-success-bright)' }}>
                      {(m.firstname?.[0] ?? '') + (m.lastname?.[0] ?? '')}
                    </div>
                    <div className={styles.memberInfo}>
                      <p className={styles.memberName}>{m.firstname} {m.lastname}{isMe ? ' (вы)' : ''}</p>
                      <p className={styles.memberRole}>@{m.username}</p>
                    </div>
                    <Badge color="green">HiPo</Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
