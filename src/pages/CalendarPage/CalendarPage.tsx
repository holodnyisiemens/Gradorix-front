import { useState } from 'react';
import { format } from 'date-fns';
import { useAuthStore } from '@modules/auth/store/authStore';
import {
  useCalendarEvents, useCreateCalendarEvent, useUpdateCalendarEvent, useDeleteCalendarEvent,
  useChallengeJuniors, useMeetingAttendance, useMarkAttendance,
} from '@shared/hooks/useApi';
import { Calendar } from '@modules/calendar/components/Calendar';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Modal } from '@shared/components/ui/Modal/Modal';
import { Input } from '@shared/components/ui/Input/Input';
import { DateInput } from '@shared/components/ui/Input/DateInput';
import { Button } from '@shared/components/ui/Button/Button';
import type { CalendarEvent } from '@shared/types';
import styles from './CalendarPage.module.css';

type EventForm = { title: string; date: string; description: string; type: CalendarEvent['type'] };
const EMPTY_FORM: EventForm = { title: '', date: '', description: '', type: 'meeting' };

export function CalendarPage() {
  const user = useAuthStore((s) => s.user)!;
  const isHR = user.role === 'HR';
  const isJunior = user.role === 'JUNIOR';
  const { data: events = [] } = useCalendarEvents();
  const { data: myAssignments = [] } = useChallengeJuniors(isJunior ? { junior_id: user.id } : undefined);

  const assignedChallengeIds = new Set(myAssignments.map(a => a.challenge_id));

  const visibleEvents = isJunior
    ? events.filter(ev => ev.type !== 'deadline' || (ev.challengeId != null && assignedChallengeIds.has(ev.challengeId)))
    : events;
  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();
  const deleteEvent = useDeleteCalendarEvent();
  const { data: attendance = [] } = useMeetingAttendance();
  const markAttendance = useMarkAttendance();

  const [showCreate, setShowCreate] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);
  const [attendanceEvent, setAttendanceEvent] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [error, setError] = useState('');

  const today = format(new Date(), 'yyyy-MM-dd');

  function handleEventClick(ev: CalendarEvent) {
    if (ev.type === 'deadline' && ev.challengeId) {
      window.open(`/challenges/${ev.challengeId}`, '_blank');
      return;
    }
    if (isHR) { setEditEvent({ ...ev }); return; }
    // Junior: past meetings → self-attendance modal
    if (isJunior && ev.type === 'meeting' && ev.date <= today) {
      setAttendanceEvent(ev);
      return;
    }
    setDetailEvent(ev);
  }

  function handleAdd() {
    if (!form.title.trim()) { setError('Введите название'); return; }
    if (!form.date) { setError('Выберите дату'); return; }
    createEvent.mutate({
      title: form.title.trim(),
      date: form.date,
      event_type: form.type,
      description: form.description.trim() || undefined,
    }, {
      onSuccess: () => { setForm(EMPTY_FORM); setError(''); setShowCreate(false); },
    });
  }

  function handleEdit() {
    if (!editEvent) return;
    updateEvent.mutate({ id: editEvent.id, data: {
      title: editEvent.title,
      date: editEvent.date,
      event_type: editEvent.type,
      description: editEvent.description,
    }}, { onSuccess: () => setEditEvent(null) });
  }


  return (
    <>
      <PageHeader title="Календарь" showBack subtitle="Мои события и задачи"
        actions={
          <button onClick={() => setShowCreate(true)}
            style={{
              background: 'var(--color-primary)', border: 'none', borderRadius: 8,
              padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6,
              cursor: 'pointer', color: '#fff', fontSize: 13, fontFamily: 'var(--font-display)',
            }}
          >+ Добавить событие</button>
        }
      />
      <div className={styles.page}>
        <Calendar
          events={visibleEvents}
          onEventClick={handleEventClick}
        />

        {/* Список событий для управления (HR) */}
        {isHR && visibleEvents.length > 0 && (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>Все мероприятия</p>
            {visibleEvents.map(ev => (
              <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>{ev.title}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ev.date} · {ev.type}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setEditEvent({ ...ev })}>✏️</Button>
                <Button size="sm" variant="danger" onClick={() => deleteEvent.mutate(ev.id)}>✕</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Создать событие */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setError(''); }} title="Добавить событие" type="dialog">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Input label="Название" placeholder="Встреча с ментором..." value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <DateInput label="Дата" value={form.date} onChange={date => setForm(f => ({ ...f, date }))} />
          <Input label="Описание (необязательно)" placeholder="Детали события..." value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          {error && <p style={{ color: 'var(--color-primary-bright)', fontSize: 'var(--text-xs)' }}>{error}</p>}
          <Button full onClick={handleAdd} loading={createEvent.isPending}>Создать</Button>
        </div>
      </Modal>

      {/* Редактировать событие */}
      {editEvent && (
        <Modal open={true} onClose={() => setEditEvent(null)} title="Редактировать событие" type="dialog">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input label="Название" value={editEvent.title} onChange={e => setEditEvent(p => p && ({ ...p, title: e.target.value }))} />
            <DateInput label="Дата" value={editEvent.date} onChange={date => setEditEvent(p => p && ({ ...p, date }))} />
            <Input label="Описание" value={editEvent.description ?? ''} onChange={e => setEditEvent(p => p && ({ ...p, description: e.target.value }))} />
            <Button full onClick={handleEdit} loading={updateEvent.isPending}>Сохранить</Button>
          </div>
        </Modal>
      )}

      {/* Детали события (для не-HR, будущие / не-встречи) */}
      {detailEvent && (
        <Modal open={true} onClose={() => setDetailEvent(null)} title="Событие" type="dialog">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <span style={{ fontSize: 32 }}>
                {detailEvent.type === 'meeting' ? '👥' : '🚨'}
              </span>
              <div>
                <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{detailEvent.title}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {detailEvent.type === 'meeting' ? 'Встреча' : 'Дедлайн'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>📅</span>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{detailEvent.date}</span>
            </div>
            {detailEvent.description && (
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{detailEvent.description}</p>
            )}
          </div>
        </Modal>
      )}

      {/* Самоотметка присутствия (Junior, прошедшая встреча) */}
      {attendanceEvent && (() => {
        const record = attendance.find(r => r.eventId === attendanceEvent.id && r.userId === user.id);
        const isLocked = record != null;
        const attended = record?.attended ?? false;
        return (
          <Modal open={true} onClose={() => setAttendanceEvent(null)} title="Отметить присутствие" type="dialog">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: 28 }}>👥</span>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{attendanceEvent.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>📅 {attendanceEvent.date}</p>
                </div>
              </div>
              {attendanceEvent.description && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{attendanceEvent.description}</p>
              )}
              {isLocked ? (
                <div style={{
                  padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center',
                  background: attended ? 'rgba(61,189,106,0.08)' : 'rgba(204,0,0,0.06)',
                  border: `1px solid ${attended ? 'rgba(61,189,106,0.25)' : 'rgba(204,0,0,0.2)'}`,
                }}>
                  <p style={{ fontSize: 20, marginBottom: 6 }}>{attended ? '✅' : '❌'}</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: attended ? 'var(--color-success-bright)' : 'var(--color-primary-bright)' }}>
                    {attended ? 'Вы отмечены как присутствовавший' : 'Вы отмечены как отсутствовавший'}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Статус подтверждён — изменить нельзя</p>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center' }}>Вы присутствовали на этой встрече?</p>
                  <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <Button full onClick={() => {
                      markAttendance.mutate({ event_id: attendanceEvent.id, user_id: user.id, attended: true });
                      setAttendanceEvent(null);
                    }}>
                      ✓ Да, был(а)
                    </Button>
                    <Button full variant="secondary" onClick={() => {
                      markAttendance.mutate({ event_id: attendanceEvent.id, user_id: user.id, attended: false });
                      setAttendanceEvent(null);
                    }}>
                      ✗ Не был(а)
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Modal>
        );
      })()}
    </>
  );
}
