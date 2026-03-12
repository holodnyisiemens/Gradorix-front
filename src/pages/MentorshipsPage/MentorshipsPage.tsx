import { MOCK_MENTOR_JUNIOR, getUserById } from '@shared/api/mockData';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Card } from '@shared/components/ui/Card/Card';
import { RoleBadge } from '@shared/components/ui/Badge/Badge';
import styles from './MentorshipsPage.module.css';

export function MentorshipsPage() {
  // Group by mentor
  const grouped = MOCK_MENTOR_JUNIOR.reduce<Record<number, number[]>>((acc, pair) => {
    if (!acc[pair.mentor_id]) acc[pair.mentor_id] = [];
    acc[pair.mentor_id].push(pair.junior_id);
    return acc;
  }, {});

  return (
    <>
      <PageHeader title="Пары" subtitle="Ментор — HiPo" />
      <div className={styles.page}>
        {Object.entries(grouped).map(([mentorId, juniorIds]) => {
          const mentor = getUserById(Number(mentorId));
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
                  const junior = getUserById(jid);
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
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
        {MOCK_MENTOR_JUNIOR.length === 0 && (
          <div className={styles.empty}>Пар ещё нет</div>
        )}
      </div>
    </>
  );
}
