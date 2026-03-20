import { NavLink } from 'react-router-dom';
import { Home, Zap, Bot, Trophy, User, Users, BookOpen, FlaskConical, Link2 } from 'lucide-react';
import type { UserRole } from '@shared/types';
import styles from './BottomNav.module.css';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

function getNavItems(role: UserRole, unreadCount: number): NavItem[] {
  switch (role) {
    case 'JUNIOR':
      return [
        { to: '/dashboard',  icon: <Home size={20} />,        label: 'Главная' },
        { to: '/tests',      icon: <FlaskConical size={20} />, label: 'Тесты' },
        { to: '/ai-agent',   icon: <Bot size={20} />,         label: 'AI Агент' },
        { to: '/leaderboard',icon: <Trophy size={20} />,      label: 'Рейтинг' },
        { to: '/profile',    icon: <User size={20} />,        label: 'Профиль' },
      ];
    case 'MENTOR':
      return [
        { to: '/dashboard',  icon: <Home size={20} />,    label: 'Главная' },
        { to: '/juniors',    icon: <Users size={20} />,   label: 'HiPo' },
        { to: '/challenges', icon: <Zap size={20} />,     label: 'Задачи' },
        { to: '/ai-agent',   icon: <Bot size={20} />,     label: 'AI Агент' },
        { to: '/profile',    icon: <User size={20} />,    label: 'Профиль' },
      ];
    case 'HR':
      return [
        { to: '/dashboard',  icon: <Home size={20} />,       label: 'Главная' },
        { to: '/users',      icon: <Users size={20} />,      label: 'Люди' },
        { to: '/knowledge',  icon: <BookOpen size={20} />,   label: 'База знаний' },
        { to: '/ai-agent',   icon: <Bot size={20} />,        label: 'AI Агент' },
        { to: '/profile',    icon: <User size={20} />,       label: 'Профиль' },
      ];
  }
}

interface BottomNavProps {
  role: UserRole;
  unreadCount?: number;
}

export function BottomNav({ role, unreadCount = 0 }: BottomNavProps) {
  const items = getNavItems(role, unreadCount);

  return (
    <nav className={styles.nav}>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            [styles.item, isActive ? styles.active : ''].join(' ')
          }
        >
          <span className={styles.iconWrapper}>
            {item.icon}
            {item.badge != null && item.badge > 0 && (
              <span className={styles.badge}>
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </span>
          <span className={styles.label}>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
