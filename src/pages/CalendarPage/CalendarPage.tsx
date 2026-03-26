import { useState } from 'react';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useCalendarEvents, useCreateCalendarEvent, useUpdateCalendarEvent, useDeleteCalendarEvent } from '@shared/hooks/useApi';
import { Calendar } from '@modules/calendar/components/Calendar';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Modal } from '@shared/components/ui/Modal/Modal';
import { Input } from '@shared/components/ui/Input/Input';
import { Button } from '@shared/components/ui/Button/Button';
import type { CalendarEvent } from '@shared/types';
import styles from './CalendarPage.module.css';

type EventForm = { title: string; date: string; description: string; type: CalendarEvent['type'] };
const EMPTY_FORM: EventForm = { title: '', date: '', description: '', type: 'meeting' };

export function CalendarPage() {
  const user = useAuthStore((s) => s.user)!;
  const isHR = user.role === 'HR';
  const { data: events = [] } = useCalendarEvents();
  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();
  const deleteEvent = useDeleteCalendarEvent();

  const [showCreate, setShowCreate] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [error, setError] = useState('');

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

  const TYPE_BUTTONS = (
    current: CalendarEvent['type'],
    setter: (t: CalendarEvent['type']) => void
  ) => (
    <div style={{ display: 'flex', gap: 8 }}>
      {(['meeting', 'challenge', 'deadline'] as const).map((t) => (
        <button key={t} onClick={() => setter(t)}
          style={{
            flex: 1, padding: '6px 0', borderRadius: 8, border: '1px solid',
            borderColor: current === t ? 'var(--color-primary)' : 'var(--border-color)',
            background: current === t ? 'rgba(204,0,0,0.1)' : 'var(--bg-card)',
            color: current === t ? 'var(--color-primary-bright)' : 'var(--text-secondary)',
            cursor: 'pointer', fontSize: 12,
          }}
        >{t === 'meeting' ? 'Встреча' : t === 'challenge' ? 'Задание' : 'Дедлайн'}</button>
      ))}
    </div>
  );

  return (
    <>
      <PageHeader title="Календарь" subtitle="Мои события и задачи"
        actions={
          <button onClick={() => setShowCreate(true)}
            style={{
              background: 'var(--color-primary)', border: 'none', borderRadius: '50%',
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff', fontSize: 20, lineHeight: 1,
            }}
            aria-label="Добавить событие"
          >+</button>
        }
      />
      <div className={styles.page}>
        <Calendar
          events={events}
          onEventClick={(ev) => isHR ? setEditEvent({ ...ev }) : setDetailEvent(ev)}
        />

        {/* Список событий для управления (HR) */}
        {isHR && events.length > 0 && (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>Все мероприятия</p>
            {events.map(ev => (
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
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setError(''); }} title="Добавить событие" type="sheet">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Input label="Название" placeholder="Встреча с ментором..." value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Input label="Дата" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          <div>
            <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Тип</label>
            {TYPE_BUTTONS(form.type, (t) => setForm(f => ({ ...f, type: t })))}
          </div>
          <Input label="Описание (необязательно)" placeholder="Детали события..." value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          {error && <p style={{ color: 'var(--color-primary-bright)', fontSize: 'var(--text-xs)' }}>{error}</p>}
          <Button full onClick={handleAdd} loading={createEvent.isPending}>Создать</Button>
        </div>
      </Modal>

      {/* Редактировать событие */}
      {editEvent && (
        <Modal open={true} onClose={() => setEditEvent(null)} title="Редактировать событие" type="sheet">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input label="Название" value={editEvent.title} onChange={e => setEditEvent(p => p && ({ ...p, title: e.target.value }))} />
            <Input label="Дата" type="date" value={editEvent.date} onChange={e => setEditEvent(p => p && ({ ...p, date: e.target.value }))} />
            <div>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Тип</label>
              {TYPE_BUTTONS(editEvent.type, (t) => setEditEvent(p => p && ({ ...p, type: t })))}
            </div>
            <Input label="Описание" value={editEvent.description ?? ''} onChange={e => setEditEvent(p => p && ({ ...p, description: e.target.value }))} />
            <Button full onClick={handleEdit} loading={updateEvent.isPending}>Сохранить</Button>
          </div>
        </Modal>
      )}

      {/* Детали события (для не-HR) */}
      {detailEvent && (
        <Modal open={true} onClose={() => setDetailEvent(null)} title="Мероприятие" type="sheet">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <span style={{ fontSize: 32 }}>
                {detailEvent.type === 'meeting' ? '👥' : detailEvent.type === 'challenge' ? '⚡' : '🚨'}
              </span>
              <div>
                <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{detailEvent.title}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {detailEvent.type === 'meeting' ? 'Встреча' : detailEvent.type === 'challenge' ? 'Задание' : 'Дедлайн'}
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
    </>
  );
}
