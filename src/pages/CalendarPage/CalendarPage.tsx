import { useState, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Search, X, ChevronDown, ChevronLeft, Pencil } from 'lucide-react';
import { useAuthStore } from '@modules/auth/store/authStore';
import {
  useCalendarEvents, useCreateCalendarEvent, useUpdateCalendarEvent, useDeleteCalendarEvent,
  useChallengeJuniors, useMeetingAttendance, useMarkAttendance, useUsers,
} from '@shared/hooks/useApi';
import { Calendar } from '@modules/calendar/components/Calendar';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Modal } from '@shared/components/ui/Modal/Modal';
import { Input } from '@shared/components/ui/Input/Input';
import { DateInput } from '@shared/components/ui/Input/DateInput';
import { Button } from '@shared/components/ui/Button/Button';
import type { CalendarEvent } from '@shared/types';
import styles from './CalendarPage.module.css';

type EventType = CalendarEvent['type'];

interface EventForm {
  title: string;
  date: string;
  description: string;
  type: EventType;
  startTime: string;
  endTime: string;
  attendeeIds: number[];
}

const EMPTY_FORM: EventForm = {
  title: '', date: '', description: '', type: 'meeting',
  startTime: '', endTime: '', attendeeIds: [],
};

// ── User picker with search ──────────────────────────────────────────────────
function UserPicker({ allUsers, selected, onChange }: {
  allUsers: { id: number; username: string; role: string }[];
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const filtered = allUsers.filter(u =>
    !q.trim() || u.username.toLowerCase().includes(q.toLowerCase())
  );

  function toggle(id: number) {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  }

  const selectedUsers = allUsers.filter(u => selected.includes(u.id));

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 6 }}>Участники</p>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)',
          color: 'var(--text-primary)', fontSize: 13, display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ color: selectedUsers.length ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {selectedUsers.length === 0
            ? 'Никто (личное событие)'
            : selectedUsers.length === allUsers.length
              ? `Все (${allUsers.length})`
              : selectedUsers.map(u => u.username).join(', ')
          }
        </span>
        <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: '0.2s', flexShrink: 0, color: 'var(--text-muted)' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', zIndex: 200, top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--bg-card)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          maxHeight: 320, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              autoFocus
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Поиск..."
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text-primary)' }}
            />
            {q && <button type="button" onClick={() => setQ('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={13} /></button>}
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }} onTouchMove={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => onChange(allUsers.map(u => u.id))}
              style={{
                width: '100%', padding: '8px 12px', border: 'none', background: 'none',
                textAlign: 'left', cursor: 'pointer', fontSize: 12,
                color: selected.length === allUsers.length ? 'var(--color-primary-bright)' : 'var(--text-secondary)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              {selected.length === allUsers.length ? '✓ ' : ''}Выбрать всех ({allUsers.length})
            </button>
            {filtered.map(u => {
              const sel = selected.includes(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggle(u.id)}
                  style={{
                    width: '100%', padding: '7px 12px', border: 'none',
                    background: sel ? 'rgba(204,0,0,0.08)' : 'none',
                    textAlign: 'left', cursor: 'pointer', fontSize: 13,
                    color: sel ? 'var(--color-primary-bright)' : 'var(--text-primary)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <span>{u.username}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{u.role}</span>
                </button>
              );
            })}
          </div>
          <div style={{ padding: '6px 10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setOpen(false)}
              style={{ fontSize: 12, color: 'var(--color-primary-bright)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Готово
            </button>
          </div>
        </div>
      )}

      {/* Selected chips */}
      {selectedUsers.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
          {selectedUsers.map(u => (
            <span key={u.id} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', borderRadius: 100, fontSize: 11,
              background: 'rgba(58,154,238,0.12)', color: 'var(--color-info-bright)',
              border: '1px solid rgba(58,154,238,0.25)',
            }}>
              {u.username}
              <button type="button" onClick={() => toggle(u.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'inherit', opacity: 0.7 }}>
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Time input pair ──────────────────────────────────────────────────────────
function TimeRow({ startTime, endTime, onStart, onEnd }: {
  startTime: string; endTime: string;
  onStart: (v: string) => void; onEnd: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 6 }}>Начало</p>
        <input
          type="time"
          value={startTime}
          onChange={e => onStart(e.target.value)}
          style={{
            width: '100%', padding: '9px 10px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)',
            color: 'var(--text-primary)', fontSize: 13, outline: 'none',
            colorScheme: 'dark', boxSizing: 'border-box',
          }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 6 }}>Конец</p>
        <input
          type="time"
          value={endTime}
          onChange={e => onEnd(e.target.value)}
          style={{
            width: '100%', padding: '9px 10px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)',
            color: 'var(--text-primary)', fontSize: 13, outline: 'none',
            colorScheme: 'dark', boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export function CalendarPage() {
  const user = useAuthStore((s) => s.user)!;
  const isEmployee = user.role === 'EMPLOYEE';

  const { data: events = [] } = useCalendarEvents();
  const { data: allUsers = [] } = useUsers();
  const { data: myAssignments = [] } = useChallengeJuniors(isEmployee ? { employee_id: user.id } : undefined);
  const { data: attendance = [] } = useMeetingAttendance();

  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();
  const deleteEvent = useDeleteCalendarEvent();
  const markAttendance = useMarkAttendance();

  const assignedChallengeIds = useMemo(
    () => new Set(myAssignments.map(a => a.challenge_id)),
    [myAssignments]
  );

  const otherUsers = useMemo(
    () => allUsers.filter(u => u.id !== user.id),
    [allUsers, user.id]
  );

  const visibleEvents = useMemo(() =>
    events.filter(ev => {
      if (user.role === 'HR') return true;

      if (ev.type === 'deadline') {
        if (isEmployee) return ev.challengeId != null && assignedChallengeIds.has(ev.challengeId);
        return true;
      }

      if (ev.attendeeIds.length === 0) return ev.createdBy === user.id;
      return ev.attendeeIds.includes(user.id);
    }),
    [events, user, isEmployee, assignedChallengeIds]
  );

  const [showCreate, setShowCreate] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [editFromDetail, setEditFromDetail] = useState(false);
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
    if (isEmployee && ev.type === 'meeting' && ev.date <= today) {
      if (ev.createdBy === user.id) {
        setDetailEvent(ev);
        return;
      }
      setAttendanceEvent(ev);
      return;
    }
    setDetailEvent(ev);
  }

  function openEditFromDetail() {
    if (!detailEvent) return;
    setEditFromDetail(true);
    setEditEvent({ ...detailEvent });
    setDetailEvent(null);
  }

  function backToDetail() {
    const ev = editEvent;
    setEditEvent(null);
    setEditFromDetail(false);
    if (ev) setDetailEvent({ ...ev });
  }

  function handleAdd() {
    if (!form.title.trim()) { setError('Введите название'); return; }
    if (!form.date) { setError('Выберите дату'); return; }
    createEvent.mutate({
      title: form.title.trim(),
      date: form.date,
      event_type: form.type,
      description: form.description.trim() || undefined,
      start_time: form.startTime || undefined,
      end_time: form.endTime || undefined,
      attendee_ids: form.attendeeIds,
    }, {
      onSuccess: () => { setForm(EMPTY_FORM); setError(''); setShowCreate(false); },
      onError: () => setError('Ошибка при создании'),
    });
  }

  function handleEdit() {
    if (!editEvent) return;
    updateEvent.mutate({
      id: editEvent.id,
      data: {
        title: editEvent.title,
        date: editEvent.date,
        event_type: editEvent.type,
        description: editEvent.description,
        start_time: editEvent.startTime || undefined,
        end_time: editEvent.endTime || undefined,
        attendee_ids: editEvent.attendeeIds,
      },
    }, { onSuccess: () => { setEditEvent(null); setEditFromDetail(false); } });
  }

  const formatEventTime = (ev: CalendarEvent) => {
    if (!ev.startTime) return ev.date;
    const d = format(new Date(ev.date + 'T00:00'), 'd MMMM', { locale: ru });
    return `${d}, ${ev.startTime}${ev.endTime ? `–${ev.endTime}` : ''}`;
  };

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
          >+ Добавить</button>
        }
      />
      <div className={styles.page}>
        <Calendar events={visibleEvents} onEventClick={handleEventClick} />
      </div>

      {/* ── Создать событие ── */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setError(''); setForm(EMPTY_FORM); }} title="Добавить событие" type="dialog">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Input label="Название *" placeholder="Встреча с командой..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <DateInput label="Дата *" value={form.date} onChange={date => setForm(f => ({ ...f, date }))} />
          <TimeRow
            startTime={form.startTime} endTime={form.endTime}
            onStart={v => setForm(f => ({ ...f, startTime: v }))}
            onEnd={v => setForm(f => ({ ...f, endTime: v }))}
          />
          <Input label="Описание" placeholder="Детали события..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <UserPicker
            allUsers={otherUsers}
            selected={form.attendeeIds}
            onChange={ids => setForm(f => ({ ...f, attendeeIds: ids }))}
          />
          <div>
            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 6 }}>Тип</p>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {(['meeting', 'deadline'] as EventType[]).map(t => (
                <button key={t} type="button"
                  onClick={() => setForm(f => ({ ...f, type: t }))}
                  style={{
                    flex: 1, padding: '7px', borderRadius: 6, border: '1px solid', cursor: 'pointer', fontSize: 12,
                    borderColor: form.type === t ? 'var(--color-primary)' : 'var(--border-subtle)',
                    background: form.type === t ? 'rgba(204,0,0,0.15)' : 'transparent',
                    color: form.type === t ? 'var(--color-primary-bright)' : 'var(--text-muted)',
                  }}>
                  {t === 'meeting' ? '👥 Встреча' : '🚨 Дедлайн'}
                </button>
              ))}
            </div>
          </div>
          {error && <p style={{ color: 'var(--color-primary-bright)', fontSize: 12 }}>{error}</p>}
          <Button full onClick={handleAdd} loading={createEvent.isPending}>Создать</Button>
        </div>
      </Modal>

      {/* ── Редактировать событие ── */}
      {editEvent && (
        <Modal open={true} onClose={() => { setEditEvent(null); setEditFromDetail(false); }} title="Редактировать событие" type="dialog">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {editFromDetail && (
              <button
                type="button"
                onClick={backToDetail}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-secondary)', fontSize: 13, padding: '0 0 4px',
                  alignSelf: 'flex-start',
                }}
              >
                <ChevronLeft size={15} />
                Назад
              </button>
            )}
            <Input label="Название" value={editEvent.title} onChange={e => setEditEvent(p => p && ({ ...p, title: e.target.value }))} />
            <DateInput label="Дата" value={editEvent.date} onChange={date => setEditEvent(p => p && ({ ...p, date }))} />
            <TimeRow
              startTime={editEvent.startTime ?? ''}
              endTime={editEvent.endTime ?? ''}
              onStart={v => setEditEvent(p => p && ({ ...p, startTime: v || undefined }))}
              onEnd={v => setEditEvent(p => p && ({ ...p, endTime: v || undefined }))}
            />
            <Input label="Описание" value={editEvent.description ?? ''} onChange={e => setEditEvent(p => p && ({ ...p, description: e.target.value }))} />
            <UserPicker
              allUsers={otherUsers}
              selected={editEvent.attendeeIds}
              onChange={ids => setEditEvent(p => p && ({ ...p, attendeeIds: ids }))}
            />
            <Button full onClick={handleEdit} loading={updateEvent.isPending}>Сохранить</Button>
          </div>
        </Modal>
      )}

      {/* ── Детали события ── */}
      {detailEvent && (() => {
        const canEdit = detailEvent.createdBy === user.id;
        return (
          <Modal open={true} onClose={() => setDetailEvent(null)} title="Событие" type="dialog">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <span style={{ fontSize: 32 }}>{detailEvent.type === 'meeting' ? '👥' : '🚨'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', overflowWrap: 'break-word', wordBreak: 'break-word' }}>{detailEvent.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {detailEvent.type === 'meeting' ? 'Встреча' : 'Дедлайн'}
                  </p>
                </div>
                {canEdit && (
                  <button
                    onClick={openEditFromDetail}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 36, height: 36, borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)',
                      cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0,
                    }}
                    title="Редактировать"
                  >
                    <Pencil size={15} />
                  </button>
                )}
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', overflowWrap: 'break-word', wordBreak: 'break-word' }}>📅 {formatEventTime(detailEvent)}</p>
              {detailEvent.createdBy != null && (() => {
                const creator = allUsers.find(u => u.id === detailEvent.createdBy);
                return creator ? (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Инициатор: <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{creator.username}</span>
                  </p>
                ) : null;
              })()}
              {detailEvent.description && (
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, overflowWrap: 'break-word', wordBreak: 'break-word' }}>{detailEvent.description}</p>
              )}
              {detailEvent.attendeeIds.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                    Участники ({detailEvent.attendeeIds.length})
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {detailEvent.attendeeIds.map(uid => {
                      const u = allUsers.find(x => x.id === uid);
                      return u ? (
                        <span key={uid} style={{
                          padding: '2px 8px', borderRadius: 100, fontSize: 11,
                          background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)',
                        }}>{u.username}</span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </Modal>
        );
      })()}

      {/* ── Самоотметка присутствия ── */}
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
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', overflowWrap: 'break-word', wordBreak: 'break-word' }}>{attendanceEvent.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>📅 {formatEventTime(attendanceEvent)}</p>
                </div>
              </div>
              {attendanceEvent.description && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, overflowWrap: 'break-word', wordBreak: 'break-word' }}>{attendanceEvent.description}</p>
              )}
              {attendanceEvent.createdBy != null && (() => {
                const creator = allUsers.find(u => u.id === attendanceEvent.createdBy);
                return creator ? (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Инициатор: <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{creator.username}</span>
                  </p>
                ) : null;
              })()}
              {attendanceEvent.attendeeIds.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                    Участники ({attendanceEvent.attendeeIds.length})
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {attendanceEvent.attendeeIds.map(uid => {
                      const u = allUsers.find(x => x.id === uid);
                      return u ? (
                        <span key={uid} style={{
                          padding: '2px 8px', borderRadius: 100, fontSize: 11,
                          background: uid === user.id ? 'rgba(204,0,0,0.1)' : 'var(--bg-elevated)',
                          color: uid === user.id ? 'var(--color-primary-bright)' : 'var(--text-secondary)',
                          border: `1px solid ${uid === user.id ? 'rgba(204,0,0,0.25)' : 'var(--border-subtle)'}`,
                        }}>{u.username}</span>
                      ) : null;
                    })}
                  </div>
                </div>
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
                    <Button full onClick={() => { markAttendance.mutate({ event_id: attendanceEvent.id, user_id: user.id, attended: true }); setAttendanceEvent(null); }}>
                      ✓ Да, был(а)
                    </Button>
                    <Button full variant="secondary" onClick={() => { markAttendance.mutate({ event_id: attendanceEvent.id, user_id: user.id, attended: false }); setAttendanceEvent(null); }}>
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
