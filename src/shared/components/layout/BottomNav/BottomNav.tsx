import { NavLink } from 'react-router-dom';
import { Home, Zap, Trophy, User, Users, FlaskConical, Link2, Calendar, Settings, Star } from 'lucide-react';
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
    case 'EMPLOYEE':
      return [
        { to: '/dashboard',   icon: <Home size={20} />,          label: 'Главная' },
        { to: '/challenges',  icon: <Zap size={20} />,           label: 'Задачи' },
        { to: '/points',      icon: <Star size={20} />,        label: 'Мои достижения' },
        { to: '/leaderboard', icon: <Trophy size={20} />,        label: 'Рейтинг' },
        { to: '/profile',     icon: <User size={20} />,          label: 'Профиль' },
      ];
    case 'MENTOR':
      return [
        { to: '/dashboard',   icon: <Home size={20} />,    label: 'Главная' },
        { to: '/juniors',     icon: <Users size={20} />,   label: 'Подопечные' },
        { to: '/challenges',  icon: <Zap size={20} />,     label: 'Задачи' },
        { to: '/calendar',    icon: <Calendar size={20} />, label: 'Календарь' },
        { to: '/profile',     icon: <User size={20} />,    label: 'Профиль' },
      ];
    case 'HR':
      return [
        { to: '/dashboard',   icon: <Home size={20} />,    label: 'Главная' },
        { to: '/leaderboard',       icon: <Trophy size={20} />,   label: 'Рейтинг' },
        { to: '/admin',       icon: <Settings size={20} />, label: 'Админ' },
        { to: '/mentorships', icon: <Link2 size={20} />,   label: 'Пары' },
        { to: '/profile',     icon: <User size={20} />,    label: 'Профиль' },
      ];
    default:
      return [];
  }
}

interface BottomNavProps {
  role: UserRole;
}

export function BottomNav({ role }: BottomNavProps) {
  const items = getNavItems(role, 0);

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
