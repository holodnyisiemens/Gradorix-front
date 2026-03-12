import { useState } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
  format, addMonths, subMonths,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Zap, Users, AlertTriangle } from 'lucide-react';
import type { CalendarEvent } from '@shared/types';
import styles from './Calendar.module.css';

interface CalendarProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function getEventTypeIcon(type: CalendarEvent['type']) {
  switch (type) {
    case 'challenge': return <Zap size={16} />;
    case 'meeting':   return <Users size={16} />;
    case 'deadline':  return <AlertTriangle size={16} />;
  }
}

function getEventTypeClass(type: CalendarEvent['type']) {
  switch (type) {
    case 'challenge': return styles.typeChallenge;
    case 'meeting':   return styles.typeMeeting;
    case 'deadline':  return styles.typeDeadline;
  }
}

function getEventTypeEmoji(type: CalendarEvent['type']) {
  switch (type) {
    case 'challenge': return '⚡';
    case 'meeting':   return '👥';
    case 'deadline':  return '🚨';
  }
}

export function Calendar({ events, onEventClick }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const getEventsForDay = (date: Date) =>
    events.filter((e) => isSameDay(new Date(e.date), date));

  const selectedEvents = getEventsForDay(selectedDate);

  const monthLabel = format(currentMonth, 'LLLL yyyy', { locale: ru });
  const selectedLabel = isSameDay(selectedDate, new Date())
    ? 'Сегодня'
    : format(selectedDate, 'd MMMM', { locale: ru });

  return (
    <div className={styles.wrapper}>
      {/* Month navigation */}
      <div className={styles.monthHeader}>
        <button
          className={styles.monthNav}
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          aria-label="Предыдущий месяц"
        >
          <ChevronLeft size={18} />
        </button>
        <span className={styles.monthTitle}>
          {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
        </span>
        <button
          className={styles.monthNav}
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          aria-label="Следующий месяц"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className={styles.weekdays}>
        {WEEKDAYS.map((d) => (
          <div key={d} className={styles.weekday}>{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className={styles.daysGrid}>
        {calDays.map((day) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSel = isSameDay(day, selectedDate);
          const isTodayDay = isToday(day);

          const classes = [
            styles.day,
            !isCurrentMonth ? styles.dayOutsideMonth : '',
            isTodayDay && !isSel ? styles.dayToday : '',
            isSel ? styles.daySelected : '',
          ].filter(Boolean).join(' ');

          return (
            <div
              key={day.toISOString()}
              className={classes}
              onClick={() => {
                setSelectedDate(day);
                if (!isSameMonth(day, currentMonth)) {
                  setCurrentMonth(day);
                }
              }}
            >
              <span className={styles.dayNumber}>{format(day, 'd')}</span>
              {dayEvents.length > 0 && !isSel && (
                <span className={styles.eventDots}>
                  {dayEvents.slice(0, 3).map((e, i) => (
                    <span
                      key={i}
                      className={[
                        styles.dot,
                        e.type === 'challenge' ? styles.dotChallenge
                          : e.type === 'meeting' ? styles.dotMeeting
                          : styles.dotDeadline,
                      ].join(' ')}
                    />
                  ))}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Events for selected day */}
      <div className={styles.eventsSection}>
        <h3 className={styles.eventsTitle}>{selectedLabel}</h3>
        {selectedEvents.length === 0 ? (
          <div className={styles.noEvents}>Событий нет</div>
        ) : (
          <div className={styles.eventsList}>
            {selectedEvents.map((event) => (
              <div
                key={event.id}
                className={styles.eventItem}
                onClick={() => onEventClick?.(event)}
              >
                <span
                  className={[styles.eventTypeIcon, getEventTypeClass(event.type)].join(' ')}
                >
                  {getEventTypeEmoji(event.type)}
                </span>
                <div className={styles.eventContent}>
                  <p className={styles.eventTitle}>{event.title}</p>
                  {event.description && (
                    <p className={styles.eventDesc}>{event.description}</p>
                  )}
                </div>
                {getEventTypeIcon(event.type)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
