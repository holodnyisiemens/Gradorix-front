import { useAuthStore } from '@modules/auth/store/authStore';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Card } from '@shared/components/ui/Card/Card';
import { Badge } from '@shared/components/ui/Badge/Badge';
import { getTeamForUser, getUserById } from '@shared/api/mockData';
import styles from './TeamPage.module.css';

const STATUS_LABEL: Record<string, string> = {
  active: 'Активна',
  on_hold: 'На паузе',
  completed: 'Завершена',
};
const STATUS_COLOR: Record<string, 'green' | 'orange' | 'gray'> = {
  active: 'green',
  on_hold: 'orange',
  completed: 'gray',
};

export function TeamPage() {
  const user = useAuthStore((s) => s.user)!;
  const team = getTeamForUser(user.id);

  if (!team) {
    return (
      <>
        <PageHeader title="Моя команда" />
        <div className={styles.page}>
          <div className={styles.empty}>
            <span>👥</span>
            <p>Вы ещё не добавлены в команду</p>
          </div>
        </div>
      </>
    );
  }

  const mentor = team.mentorId ? getUserById(team.mentorId) : null;
  const members = team.memberIds.map((id) => getUserById(id)).filter(Boolean);

  return (
    <>
      <PageHeader title="Моя команда" subtitle={team.project} />
      <div className={styles.page}>
        {/* Team card */}
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

        {/* Mentor */}
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

        {/* Members */}
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
