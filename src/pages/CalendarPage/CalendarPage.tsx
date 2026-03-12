import { useAuthStore } from '@modules/auth/store/authStore';
import { getCalendarEventsForJunior } from '@shared/api/mockData';
import { Calendar } from '@modules/calendar/components/Calendar';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { AppLayout } from '@shared/components/layout/AppLayout/AppLayout';
import styles from './CalendarPage.module.css';

export function CalendarPage() {
  const user = useAuthStore((s) => s.user)!;
  const events = getCalendarEventsForJunior(user.id);

  return (
    <>
      <PageHeader title="Календарь" subtitle="Мои события и задачи" />
      <div className={styles.page}>
        <Calendar events={events} />
      </div>
    </>
  );
}
