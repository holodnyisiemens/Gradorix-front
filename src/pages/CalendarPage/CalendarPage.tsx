import { useState } from 'react';
import { useAuthStore } from '@modules/auth/store/authStore';
import { getCalendarEventsForJunior } from '@shared/api/mockData';
import { Calendar } from '@modules/calendar/components/Calendar';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Modal } from '@shared/components/ui/Modal/Modal';
import { Input } from '@shared/components/ui/Input/Input';
import { Button } from '@shared/components/ui/Button/Button';
import type { CalendarEvent } from '@shared/types';
import styles from './CalendarPage.module.css';

let nextId = 100;

export function CalendarPage() {
  const user = useAuthStore((s) => s.user)!;
  const [extraEvents, setExtraEvents] = useState<CalendarEvent[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', description: '', type: 'meeting' as CalendarEvent['type'] });
  const [error, setError] = useState('');

  const baseEvents = getCalendarEventsForJunior(user.id);
  const events = [...baseEvents, ...extraEvents];

  function handleAdd() {
    if (!form.title.trim()) { setError('Введите название'); return; }
    if (!form.date) { setError('Выберите дату'); return; }
    const newEvent: CalendarEvent = {
      id: nextId++,
      title: form.title.trim(),
      date: form.date,
      type: form.type,
      description: form.description.trim() || undefined,
    };
    setExtraEvents((prev) => [...prev, newEvent]);
    setForm({ title: '', date: '', description: '', type: 'meeting' });
    setError('');
    setShowModal(false);
  }

  return (
    <>
      <PageHeader
        title="Календарь"
        subtitle="Мои события и задачи"
        actions={
          <button
            onClick={() => setShowModal(true)}
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
        <Calendar events={events} />
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setError(''); }}
        title="Добавить событие"
        type="sheet"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Input
            label="Название"
            placeholder="Встреча с ментором..."
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Input
            label="Дата"
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          />
          <div>
            <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Тип
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['meeting', 'challenge', 'deadline'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  style={{
                    flex: 1, padding: '6px 0', borderRadius: 8, border: '1px solid',
                    borderColor: form.type === t ? 'var(--color-primary)' : 'var(--border-color)',
                    background: form.type === t ? 'rgba(204,0,0,0.1)' : 'var(--bg-card)',
                    color: form.type === t ? 'var(--color-primary-bright)' : 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: 12,
                  }}
                >
                  {t === 'meeting' ? 'Встреча' : t === 'challenge' ? 'Задание' : 'Дедлайн'}
                </button>
              ))}
            </div>
          </div>
          <Input
            label="Описание (необязательно)"
            placeholder="Детали события..."
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          {error && <p style={{ color: 'var(--color-primary-bright)', fontSize: 'var(--text-xs)' }}>{error}</p>}
          <Button full onClick={handleAdd}>Создать</Button>
        </div>
      </Modal>
    </>
  );
}
