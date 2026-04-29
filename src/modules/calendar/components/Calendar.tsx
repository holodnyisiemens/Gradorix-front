import { useState } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
  format, addMonths, subMonths, addWeeks, subWeeks,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Zap, Users, AlertTriangle, CalendarDays, LayoutGrid } from 'lucide-react';
import type { CalendarEvent } from '@shared/types';
import styles from './Calendar.module.css';

interface CalendarProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}

type ViewMode = 'month' | 'week';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0..23

function eventTypeEmoji(type: CalendarEvent['type']) {
  return type === 'meeting' ? '👥' : type === 'deadline' ? '🚨' : '⚡';
}

function eventTypeClass(type: CalendarEvent['type'], s: Record<string, string>) {
  return type === 'challenge' ? s.typeChallenge : type === 'meeting' ? s.typeMeeting : s.typeDeadline;
}

function dotClass(type: CalendarEvent['type'], s: Record<string, string>) {
  return type === 'challenge' ? s.dotChallenge : type === 'meeting' ? s.dotMeeting : s.dotDeadline;
}

function parseHM(t?: string): [number, number] {
  if (!t) return [0, 0];
  const [h, m] = t.split(':').map(Number);
  return [h || 0, m || 0];
}

// ── Month view ──────────────────────────────────────────────────────────────
function MonthView({ currentMonth, events, onEventClick, onDayClick, selectedDate }: {
  currentMonth: Date;
  selectedDate: Date;
  events: CalendarEvent[];
  onEventClick?: (e: CalendarEvent) => void;
  onDayClick: (d: Date) => void;
}) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const getEventsForDay = (date: Date) =>
    events.filter(e => isSameDay(new Date(e.date), date));

  const selectedEvents = getEventsForDay(selectedDate);
  const selectedLabel = isSameDay(selectedDate, new Date())
    ? 'Сегодня'
    : format(selectedDate, 'd MMMM', { locale: ru });

  return (
    <>
      <div className={styles.weekdays}>
        {WEEKDAYS.map(d => <div key={d} className={styles.weekday}>{d}</div>)}
      </div>
      <div className={styles.daysGrid}>
        {calDays.map(day => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSel = isSameDay(day, selectedDate);
          const isTodayDay = isToday(day);
          const cls = [
            styles.day,
            !isCurrentMonth ? styles.dayOutsideMonth : '',
            isTodayDay && !isSel ? styles.dayToday : '',
            isSel ? styles.daySelected : '',
          ].filter(Boolean).join(' ');
          return (
            <div key={day.toISOString()} className={cls}
              onClick={() => { onDayClick(day); }}
            >
              <span className={styles.dayNumber}>{format(day, 'd')}</span>
              {dayEvents.length > 0 && !isSel && (
                <span className={styles.eventDots}>
                  {dayEvents.slice(0, 3).map((e, i) => (
                    <span key={i} className={[styles.dot, dotClass(e.type, styles)].join(' ')} />
                  ))}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.eventsSection}>
        <h3 className={styles.eventsTitle}>{selectedLabel}</h3>
        {selectedEvents.length === 0
          ? <div className={styles.noEvents}>Событий нет</div>
          : <div className={styles.eventsList}>
              {selectedEvents.map(event => (
                <div key={event.id} className={styles.eventItem} onClick={() => onEventClick?.(event)}>
                  <span className={[styles.eventTypeIcon, eventTypeClass(event.type, styles)].join(' ')}>
                    {eventTypeEmoji(event.type)}
                  </span>
                  <div className={styles.eventContent}>
                    <p className={styles.eventTitle}>{event.title}</p>
                    {(event.startTime || event.description) && (
                      <p className={styles.eventDesc}>
                        {event.startTime ? `${event.startTime}${event.endTime ? `–${event.endTime}` : ''}  ` : ''}
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
        }
      </div>
    </>
  );
}

// ── Week view ───────────────────────────────────────────────────────────────
const VISIBLE_HOURS = Array.from({ length: 17 }, (_, i) => i + 7); // 07..23
const HOUR_H = 56; // px per hour

function WeekView({ weekStart, events, onEventClick }: {
  weekStart: Date;
  events: CalendarEvent[];
  onEventClick?: (e: CalendarEvent) => void;
}) {
  const days = eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) });

  const getEventsForDay = (date: Date) =>
    events.filter(e => isSameDay(new Date(e.date), date));

  return (
    <div className={styles.weekGrid}>
      {/* Header row */}
      <div className={styles.weekTimeCol} />
      {days.map(d => (
        <div key={d.toISOString()} className={[styles.weekDayHeader, isToday(d) ? styles.weekDayHeaderToday : ''].join(' ')}>
          <span className={styles.weekDayName}>{format(d, 'EEE', { locale: ru })}</span>
          <span className={[styles.weekDayNum, isToday(d) ? styles.weekDayNumToday : ''].join(' ')}>
            {format(d, 'd')}
          </span>
        </div>
      ))}

      {/* Time slots */}
      {VISIBLE_HOURS.map(hour => (
        <>
          <div key={`t-${hour}`} className={styles.weekTimeCell}>
            <span className={styles.weekHourLabel}>{String(hour).padStart(2, '0')}:00</span>
          </div>
          {days.map(d => {
            const dayEvents = getEventsForDay(d).filter(ev => {
              if (!ev.startTime) return false;
              const [h] = parseHM(ev.startTime);
              return h === hour;
            });
            return (
              <div key={`${d.toISOString()}-${hour}`} className={styles.weekCell}>
                {dayEvents.map(ev => {
                  const [sh, sm] = parseHM(ev.startTime);
                  const [eh, em] = ev.endTime ? parseHM(ev.endTime) : [sh + 1, sm];
                  const top = (sm / 60) * HOUR_H;
                  const duration = Math.max(0.5, (eh - sh) + (em - sm) / 60);
                  const height = duration * HOUR_H - 2;
                  return (
                    <div key={ev.id}
                      className={[styles.weekEvent, eventTypeClass(ev.type, styles)].join(' ')}
                      style={{ top, height }}
                      onClick={() => onEventClick?.(ev)}
                    >
                      <span className={styles.weekEventTitle}>{ev.title}</span>
                      <span className={styles.weekEventTime}>{ev.startTime}{ev.endTime ? `–${ev.endTime}` : ''}</span>
                      {ev.description && height > 50 && (
                        <span className={styles.weekEventDesc}>{ev.description}</span>
                      )}
                    </div>
                  );
                })}
                {/* All-day / no-time events */}
                {hour === 7 && getEventsForDay(d).filter(ev => !ev.startTime).map(ev => (
                  <div key={ev.id}
                    className={[styles.weekEventAllDay, eventTypeClass(ev.type, styles)].join(' ')}
                    onClick={() => onEventClick?.(ev)}
                  >
                    {eventTypeEmoji(ev.type)} {ev.title}
                  </div>
                ))}
              </div>
            );
          })}
        </>
      ))}
    </div>
  );
}

// ── Main Calendar ────────────────────────────────────────────────────────────
export function Calendar({ events, onEventClick }: CalendarProps) {
  const [view, setView] = useState<ViewMode>('month');
  const [current, setCurrent] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthLabel = format(current, 'LLLL yyyy', { locale: ru });
  const weekLabel = (() => {
    const ws = startOfWeek(current, { weekStartsOn: 1 });
    const we = endOfWeek(current, { weekStartsOn: 1 });
    if (format(ws, 'MM') === format(we, 'MM'))
      return `${format(ws, 'd')}–${format(we, 'd MMMM yyyy', { locale: ru })}`;
    return `${format(ws, 'd MMM', { locale: ru })} – ${format(we, 'd MMM yyyy', { locale: ru })}`;
  })();

  const label = view === 'month'
    ? monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)
    : weekLabel;

  function prev() { setCurrent(v => view === 'month' ? subMonths(v, 1) : subWeeks(v, 1)); }
  function next() { setCurrent(v => view === 'month' ? addMonths(v, 1) : addWeeks(v, 1)); }

  return (
    <div className={styles.wrapper}>
      <div className={styles.monthHeader}>
        <button className={styles.monthNav} onClick={prev}><ChevronLeft size={18} /></button>
        <span className={styles.monthTitle}>{label}</span>
        <button className={styles.monthNav} onClick={next}><ChevronRight size={18} /></button>
        <div className={styles.viewToggle}>
          <button className={[styles.viewBtn, view === 'month' ? styles.viewBtnActive : ''].join(' ')} onClick={() => setView('month')} title="Месяц">
            <LayoutGrid size={15} />
          </button>
          <button className={[styles.viewBtn, view === 'week' ? styles.viewBtnActive : ''].join(' ')} onClick={() => setView('week')} title="Неделя">
            <CalendarDays size={15} />
          </button>
        </div>
      </div>

      {view === 'month'
        ? <MonthView currentMonth={current} selectedDate={selectedDate} events={events} onEventClick={onEventClick} onDayClick={d => { setSelectedDate(d); if (!isSameMonth(d, current)) setCurrent(d); }} />
        : <WeekView weekStart={startOfWeek(current, { weekStartsOn: 1 })} events={events} onEventClick={onEventClick} />
      }
    </div>
  );
}
