import { useState } from 'react';
import { useMentorJuniors, useUsers, useAssignMentor, useRemoveMentor } from '@shared/hooks/useApi';
import { useAuthStore } from '@modules/auth/store/authStore';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Card } from '@shared/components/ui/Card/Card';
import { RoleBadge } from '@shared/components/ui/Badge/Badge';
import { Button } from '@shared/components/ui/Button/Button';
import { Modal } from '@shared/components/ui/Modal/Modal';
import styles from './MentorshipsPage.module.css';

export function MentorshipsPage() {
  const currentUser = useAuthStore((s) => s.user)!;
  const isHR = currentUser.role === 'HR';
  const [pairModal, setPairModal] = useState(false);
  const [selectedMentorId, setSelectedMentorId] = useState<number | null>(null);
  const [selectedJuniorId, setSelectedJuniorId] = useState<number | null>(null);

  const { data: pairs = [] } = useMentorJuniors();
  const { data: allUsers = [] } = useUsers();
  const assignMentor = useAssignMentor();
  const removeMentor = useRemoveMentor();

  const mentors = allUsers.filter(u => u.role === 'MENTOR');
  const juniors = allUsers.filter(u => u.role === 'JUNIOR');

  async function handleCreatePair() {
    if (!selectedMentorId || !selectedJuniorId) return;
    await assignMentor.mutateAsync({ mentor_id: selectedMentorId, junior_id: selectedJuniorId, assigned_by: currentUser.id });
    setPairModal(false);
    setSelectedMentorId(null);
    setSelectedJuniorId(null);
  }

  // Group by mentor
  const grouped = pairs.reduce<Record<number, number[]>>((acc, pair) => {
    if (!acc[pair.mentor_id]) acc[pair.mentor_id] = [];
    acc[pair.mentor_id].push(pair.junior_id);
    return acc;
  }, {});

  return (
    <>
      <PageHeader title="Пары" subtitle="Ментор — HiPo" />
      <div className={styles.page}>
        {isHR && (
          <Button full style={{ marginBottom: 'var(--space-3)' }} onClick={() => setPairModal(true)}>
            + Добавить пару
          </Button>
        )}
        {Object.entries(grouped).map(([mentorId, juniorIds]) => {
          const mentor = allUsers.find((u) => u.id === Number(mentorId));
          if (!mentor) return null;
          return (
            <Card key={mentorId} accent>
              <div className={styles.mentorRow}>
                <div className={styles.avatar} style={{ borderColor: 'rgba(58,154,238,0.4)', color: 'var(--color-info-bright)' }}>
                  {(mentor.firstname?.[0] ?? '') + (mentor.lastname?.[0] ?? '')}
                </div>
                <div className={styles.info}>
                  <p className={styles.name}>{mentor.firstname} {mentor.lastname}</p>
                  <p className={styles.username}>@{mentor.username}</p>
                </div>
                <RoleBadge role="MENTOR" />
              </div>
              <div className={styles.juniorList}>
                {juniorIds.map((jid) => {
                  const junior = allUsers.find((u) => u.id === jid);
                  if (!junior) return null;
                  return (
                    <div key={jid} className={styles.juniorRow}>
                      <span className={styles.connector}>└</span>
                      <div className={styles.avatarSm} style={{ borderColor: 'rgba(61,189,106,0.4)', color: 'var(--color-success-bright)' }}>
                        {(junior.firstname?.[0] ?? '') + (junior.lastname?.[0] ?? '')}
                      </div>
                      <div className={styles.info}>
                        <p className={styles.nameSm}>{junior.firstname} {junior.lastname}</p>
                        <p className={styles.usernameSm}>@{junior.username}</p>
                      </div>
                      <RoleBadge role="JUNIOR" />
                      {isHR && (
                        <button
                          onClick={() => removeMentor.mutate({ mentorId: Number(mentorId), juniorId: jid })}
                          style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--color-danger-bright)', cursor: 'pointer', fontSize: 14 }}
                          title="Убрать из пары"
                        >✕</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
        {pairs.length === 0 && (
          <div className={styles.empty}>Пар ещё нет</div>
        )}
      </div>

      {pairModal && (
        <Modal open={true} onClose={() => setPairModal(false)} title="Добавить пару" type="dialog">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Ментор</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', maxHeight: 180, overflowY: 'auto' }}>
                {mentors.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMentorId(m.id)}
                    style={{
                      padding: '8px 12px', borderRadius: 6, border: '1px solid', textAlign: 'left',
                      borderColor: selectedMentorId === m.id ? 'var(--color-primary)' : 'var(--border-subtle)',
                      background: selectedMentorId === m.id ? 'rgba(204,0,0,0.15)' : 'transparent',
                      color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13,
                    }}
                  >
                    {m.firstname} {m.lastname} <span style={{ color: 'var(--text-muted)' }}>@{m.username}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>HiPo участник</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', maxHeight: 180, overflowY: 'auto' }}>
                {juniors.map(j => (
                  <button
                    key={j.id}
                    onClick={() => setSelectedJuniorId(j.id)}
                    style={{
                      padding: '8px 12px', borderRadius: 6, border: '1px solid', textAlign: 'left',
                      borderColor: selectedJuniorId === j.id ? 'var(--color-primary)' : 'var(--border-subtle)',
                      background: selectedJuniorId === j.id ? 'rgba(204,0,0,0.15)' : 'transparent',
                      color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13,
                    }}
                  >
                    {j.firstname} {j.lastname} <span style={{ color: 'var(--text-muted)' }}>@{j.username}</span>
                  </button>
                ))}
              </div>
            </div>
            <Button full onClick={handleCreatePair} disabled={!selectedMentorId || !selectedJuniorId || assignMentor.isPending}>
              {assignMentor.isPending ? 'Создание...' : 'Создать пару'}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
