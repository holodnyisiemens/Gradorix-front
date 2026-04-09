import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { NotificationBell } from '@shared/components/ui/NotificationBell/NotificationBell';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, showBack, onBack, actions }: PageHeaderProps) {
  const navigate = useNavigate();
  const handleBack = onBack ?? (() => navigate(-1));

  return (
    <header className={styles.header}>
      {showBack && (
        <button className={styles.back} onClick={handleBack} aria-label="Назад">
          <ChevronLeft size={22} />
        </button>
      )}
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
      <NotificationBell />
    </header>
  );
}
