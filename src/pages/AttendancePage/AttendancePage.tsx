import { useState } from 'react';
import { useAuthStore } from '@modules/auth/store/authStore';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Button } from '@shared/components/ui/Button/Button';
import { Modal } from '@shared/components/ui/Modal/Modal';
import { useCalendarEvents, useUsers, useMeetingAttendance, useMarkAttendance, useUpdateAttendance } from '@shared/hooks/useApi';
import type { MeetingAttendance } from '@shared/types';
import styles from './AttendancePage.module.css';

export function AttendancePage() {
  const user = useAuthStore((s) => s.user)!;
  const isHR = user.role === 'HR';

  const { data: events = [] } = useCalendarEvents({ event_type: 'meeting' });
  const { data: allUsers = [] } = useUsers();
  const { data: attendance = [] } = useMeetingAttendance();
  const markAttendance = useMarkAttendance();
  const updateAttendance = useUpdateAttendance();

  const [attendanceEditor, setAttendanceEditor] = useState<{
    eventId: number;
    userId: number;
    record: MeetingAttendance | null;
    attended: boolean;
  } | null>(null);
  const [editorPoints, setEditorPoints] = useState('');
  const [editorError, setEditorError] = useState('');

  function getRecord(eventId: number, userId: number) {
    return attendance.find((a: MeetingAttendance) => a.eventId === eventId && a.userId === userId) ?? null;
  }

  function openAttendanceEditor(eventId: number, userId: number) {
    const record = getRecord(eventId, userId);
    setAttendanceEditor({
      eventId,
      userId,
      record,
      attended: record?.attended ?? false,
    });
    setEditorPoints(record?.awardedPoints != null ? String(record.awardedPoints) : '');
    setEditorError('');
  }

  function closeAttendanceEditor() {
    setAttendanceEditor(null);
    setEditorPoints('');
    setEditorError('');
  }

  function handleSaveAttendance(attended: boolean) {
    if (!attendanceEditor) return;
    const points = editorPoints.trim();
    const pointsValue = points === '' ? undefined : Number(points);
    if (pointsValue !== undefined && (Number.isNaN(pointsValue) || pointsValue < 0)) {
      setEditorError('Введите корректное число баллов');
      return;
    }

    const payload: { attended: boolean; marked_by: number; awarded_points?: number } = {
      attended,
      marked_by: user.id,
    };
    if (attended && pointsValue !== undefined) {
      payload.awarded_points = pointsValue;
    }

    if (attendanceEditor.record) {
      updateAttendance.mutate({ id: attendanceEditor.record.id, data: payload });
    } else {
      markAttendance.mutate({
        event_id: attendanceEditor.eventId,
        user_id: attendanceEditor.userId,
        ...payload,
      });
    }

    closeAttendanceEditor();
  }

  const meetings = events;
  const hipoUsers = allUsers.filter(u => u.role === 'EMPLOYEE');

  function handleMark(eventId: number, userId: number, attended: boolean) {
    const existing = attendance.find((a: MeetingAttendance) => a.eventId === eventId && a.userId === userId);
    if (existing) {
      updateAttendance.mutate({ id: existing.id, data: { attended } });
    } else {
      markAttendance.mutate({
        event_id: eventId,
        user_id: userId,
        attended,
        marked_by: isHR ? user.id : undefined,
      });
    }
  }

  function isAttended(eventId: number, userId: number) {
    return attendance.find((a: MeetingAttendance) => a.eventId === eventId && a.userId === userId)?.attended ?? false;
  }

  function hasRecord(eventId: number, userId: number) {
    return attendance.some((a: MeetingAttendance) => a.eventId === eventId && a.userId === userId);
  }

  if (!isHR) {
    return (
      <>
        <PageHeader title="Встречи" showBack subtitle="Посещаемость мероприятий" />
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
                {isPast || hasRec ? (
                  <button
                    onClick={() => handleMark(meeting.id, user.id, !attended)}
                    style={{
                      padding: '4px 12px', borderRadius: 6, border: '1px solid', cursor: 'pointer', fontSize: 12,
                      borderColor: attended ? 'var(--color-success-bright)' : 'var(--border-subtle)',
                      background: attended ? 'rgba(61,189,106,0.12)' : 'transparent',
                      color: attended ? 'var(--color-success-bright)' : 'var(--text-muted)',
                    }}
                  >
                    {attended ? '✓ Присутствовал' : '✗ Отсутствовал'}
                  </button>
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
      <PageHeader title="Посещаемость" showBack subtitle="Управление посещением встреч" />
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
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{u.username}</span>
                </td>
                {meetings.map(m => {
                  const rec = getRecord(m.id, u.id);
                  const state: 'none' | 'absent' | 'present' = !rec ? 'none' : rec.attended ? 'present' : 'absent';
                  const label = rec ? (rec.attended ? `✓${rec.awardedPoints != null ? ` +${rec.awardedPoints}` : ''}` : '✗') : '—';
                  return (
                    <td key={m.id} className={styles.td} style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => openAttendanceEditor(m.id, u.id)}
                        style={{
                          minWidth: 28, height: 28, borderRadius: '50%',
                          border: '1px solid',
                          borderColor: state === 'present' ? 'var(--color-success-bright)' : state === 'absent' ? 'var(--color-primary)' : 'var(--border-color)',
                          background: state === 'present' ? 'rgba(61,189,106,0.12)' : 'transparent',
                          color: state === 'present' ? 'var(--color-success-bright)' : state === 'absent' ? 'var(--text-muted)' : 'var(--text-muted)',
                          cursor: 'pointer', fontSize: 14,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px',
                        }}
                        title={state === 'present' ? 'Нажмите, чтобы изменить' : state === 'absent' ? 'Нажмите, чтобы изменить' : 'Добавить запись'}
                      >
                        {label}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {attendanceEditor && (
        <Modal open={true} onClose={closeAttendanceEditor} title="Управление посещаемостью" type="dialog">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: 28 }}>🤝</span>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                  {meetings.find(ev => ev.id === attendanceEditor.eventId)?.title ?? 'Мероприятие'}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {meetings.find(ev => ev.id === attendanceEditor.eventId)?.date ?? ''}
                </p>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Участник: <strong>{allUsers.find(u => u.id === attendanceEditor.userId)?.username ?? 'Пользователь'}</strong>
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button
                type="button"
                onClick={() => setAttendanceEditor(prev => prev ? ({ ...prev, attended: true }) : prev)}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 8, border: attendanceEditor.attended ? '1px solid var(--color-success-bright)' : '1px solid var(--border-subtle)',
                  background: attendanceEditor.attended ? 'rgba(61,189,106,0.12)' : 'transparent', color: attendanceEditor.attended ? 'var(--color-success-bright)' : 'var(--text-primary)',
                  cursor: 'pointer', fontSize: 13,
                }}
              >
                Присутствовал
              </button>
              <button
                type="button"
                onClick={() => setAttendanceEditor(prev => prev ? ({ ...prev, attended: false }) : prev)}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 8, border: !attendanceEditor.attended ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                  background: !attendanceEditor.attended ? 'rgba(204,0,0,0.08)' : 'transparent', color: !attendanceEditor.attended ? 'var(--color-primary-bright)' : 'var(--text-primary)',
                  cursor: 'pointer', fontSize: 13,
                }}
              >
                Не был
              </button>
            </div>
            {attendanceEditor.attended && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Баллы (необязательно)
                </label>
                <input
                  value={editorPoints}
                  onChange={e => setEditorPoints(e.target.value)}
                  placeholder="Например, 10"
                  inputMode="numeric"
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 13, outline: 'none'
                  }}
                />
              </div>
            )}
            {editorError && <p style={{ color: 'var(--color-primary-bright)', fontSize: 12 }}>{editorError}</p>}
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button full onClick={() => handleSaveAttendance(attendanceEditor.attended)} loading={markAttendance.isPending || updateAttendance.isPending}>
                Сохранить
              </Button>
              <Button full variant="secondary" onClick={closeAttendanceEditor}>Отмена</Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
