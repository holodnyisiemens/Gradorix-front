import { useState } from 'react';
import { useAuthStore } from '@modules/auth/store/authStore';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Button } from '@shared/components/ui/Button/Button';
import { getMeetingEvents, MOCK_ALL_USERS, MOCK_ATTENDANCE } from '@shared/api/mockData';
import type { MeetingAttendance } from '@shared/api/mockData';
import styles from './AttendancePage.module.css';

export function AttendancePage() {
  const user = useAuthStore((s) => s.user)!;
  const isHR = user.role === 'HR';
  const meetings = getMeetingEvents();
  const [attendance, setAttendance] = useState<MeetingAttendance[]>([...MOCK_ATTENDANCE]);

  const hipoUsers = MOCK_ALL_USERS.filter(u => u.role === 'JUNIOR');

  function markAttendance(eventId: number, userId: number, attended: boolean) {
    setAttendance(prev => {
      const existing = prev.find(a => a.eventId === eventId && a.userId === userId);
      if (existing) {
        return prev.map(a => a.eventId === eventId && a.userId === userId
          ? { ...a, attended, markedAt: new Date().toISOString(), markedBy: isHR ? user.id : undefined }
          : a
        );
      }
      return [...prev, {
        id: Date.now(),
        eventId,
        userId,
        attended,
        markedAt: new Date().toISOString(),
        markedBy: isHR ? user.id : undefined,
      }];
    });
  }

  function isAttended(eventId: number, userId: number) {
    return attendance.find(a => a.eventId === eventId && a.userId === userId)?.attended ?? false;
  }

  function hasRecord(eventId: number, userId: number) {
    return attendance.some(a => a.eventId === eventId && a.userId === userId);
  }

  if (!isHR) {
    return (
      <>
        <PageHeader title="Встречи" subtitle="Посещаемость мероприятий" />
        <div style={{ padding: 'var(--space-4) 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {meetings.map(meeting => {
            const attended = isAttended(meeting.id, user.id);
            const hasRec = hasRecord(meeting.id, user.id);
            const isPast = new Date(meeting.date) < new Date();
            return (
              <div key={meeting.id} className={styles.meetingCard}>
                <div className={styles.meetingInfo}>
                  <p className={styles.meetingTitle}>{meeting.title}</p>
                  <p className={styles.meetingDate}>{meeting.date} · {meeting.description}</p>
                </div>
                {attended ? (
                  <span className={styles.attendedBadge}>✓ Присутствовал</span>
                ) : hasRec ? (
                  <span className={styles.absentBadge}>✗ Отсутствовал</span>
                ) : isPast ? (
                  <Button size="sm" variant="secondary" onClick={() => markAttendance(meeting.id, user.id, true)}>
                    Отметиться
                  </Button>
                ) : (
                  <span className={styles.futureBadge}>Предстоит</span>
                )}
              </div>
            );
          })}
        </div>
      </>
    );
  }

  // HR view: matrix of users × meetings
  return (
    <>
      <PageHeader title="Посещаемость" subtitle="Управление посещением встреч" />
      <div style={{ padding: 'var(--space-4) 0', overflowX: 'auto' }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Участник</th>
              {meetings.map(m => (
                <th key={m.id} className={styles.th} style={{ minWidth: 100 }}>
                  <span style={{ fontSize: 10 }}>{m.title}</span>
                  <br />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.date}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hipoUsers.map(u => (
              <tr key={u.id}>
                <td className={styles.td}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{u.firstname} {u.lastname}</span>
                </td>
                {meetings.map(m => {
                  const att = isAttended(m.id, u.id);
                  return (
                    <td key={m.id} className={styles.td} style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => markAttendance(m.id, u.id, !att)}
                        style={{
                          width: 28, height: 28, borderRadius: '50%',
                          border: '1px solid',
                          borderColor: att ? 'var(--color-success-bright)' : 'var(--border-color)',
                          background: att ? 'rgba(61,189,106,0.12)' : 'transparent',
                          color: att ? 'var(--color-success-bright)' : 'var(--text-muted)',
                          cursor: 'pointer', fontSize: 14,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        }}
                        title={att ? 'Был · нажмите чтобы отменить' : 'Не был · нажмите чтобы отметить'}
                      >
                        {att ? '✓' : '–'}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
