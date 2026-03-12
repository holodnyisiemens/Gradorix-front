import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Calendar, Zap, Bell, Users, Link2, User, LogOut } from 'lucide-react';
import type { UserRole } from '@shared/types';
import { useAuthStore } from '@modules/auth/store/authStore';
import styles from './SideNav.module.css';

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
        { to: '/dashboard',     icon: <Home size={18} />,     label: 'Главная' },
        { to: '/calendar',      icon: <Calendar size={18} />, label: 'Календарь' },
        { to: '/challenges',    icon: <Zap size={18} />,      label: 'Задачи' },
        { to: '/notifications', icon: <Bell size={18} />,     label: 'Уведомления', badge: unreadCount },
      ];
    case 'MENTOR':
      return [
        { to: '/dashboard',     icon: <Home size={18} />,     label: 'Главная' },
        { to: '/juniors',       icon: <Users size={18} />,    label: 'Мои HiPo' },
        { to: '/challenges',    icon: <Zap size={18} />,      label: 'Задачи' },
        { to: '/notifications', icon: <Bell size={18} />,     label: 'Уведомления', badge: unreadCount },
      ];
    case 'HR':
      return [
        { to: '/dashboard',     icon: <Home size={18} />,     label: 'Главная' },
        { to: '/users',         icon: <Users size={18} />,    label: 'Пользователи' },
        { to: '/challenges',    icon: <Zap size={18} />,      label: 'Задачи' },
        { to: '/mentorships',   icon: <Link2 size={18} />,    label: 'Пары' },
        { to: '/profile',       icon: <User size={18} />,     label: 'Профиль' },
      ];
  }
}

const roleLabel: Record<UserRole, string> = {
  HR: 'HR',
  MENTOR: 'Ментор',
  JUNIOR: 'HiPo',
};

interface SideNavProps {
  unreadCount?: number;
}

export function SideNav({ unreadCount = 0 }: SideNavProps) {
  const user = useAuthStore((s) => s.user)!;
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const items = getNavItems(user.role, unreadCount);

  const initials = ((user.firstname?.[0] ?? '') + (user.lastname?.[0] ?? '')).toUpperCase()
    || user.username.slice(0, 2).toUpperCase();

  return (
    <nav className={styles.nav}>
      {/* Logo */}
      <div className={styles.logo}>
        <p className={styles.logoTitle}>
          Очень
          <span className={styles.logoAccent}>карьерные</span>
          дела
        </p>
      </div>

      <span className={styles.sectionLabel}>Навигация</span>

      {/* Nav items */}
      <div className={styles.items}>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [styles.item, isActive ? styles.active : ''].join(' ')
            }
          >
            <span className={styles.itemIcon}>{item.icon}</span>
            <span className={styles.itemLabel}>{item.label}</span>
            {item.badge != null && item.badge > 0 && (
              <span className={styles.itemBadge}>
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      {/* User block */}
      <div
        className={styles.user}
        onClick={() => navigate('/profile')}
        role="button"
      >
        <span className={styles.userAvatar}>{initials}</span>
        <div className={styles.userInfo}>
          <p className={styles.userName}>
            {user.firstname ? `${user.firstname} ${user.lastname ?? ''}`.trim() : user.username}
          </p>
          <p className={styles.userRole}>{roleLabel[user.role]}</p>
        </div>
        <button
          className={styles.logoutBtn}
          onClick={(e) => { e.stopPropagation(); logout(); }}
          aria-label="Выйти"
          title="Выйти"
        >
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );
}
