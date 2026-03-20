import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Calendar, Zap, Bell, Users, Link2, User, LogOut, Bot, Trophy, BookOpen, FlaskConical, Star, Settings, CalendarCheck, Sun, Moon } from 'lucide-react';
import type { UserRole } from '@shared/types';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useThemeStore } from '@shared/store/themeStore';
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
        { to: '/dashboard',    icon: <Home size={18} />,         label: 'Главная' },
        { to: '/calendar',     icon: <Calendar size={18} />,     label: 'Календарь' },
        { to: '/challenges',   icon: <Zap size={18} />,          label: 'Задачи' },
        { to: '/tests',        icon: <FlaskConical size={18} />, label: 'Тесты' },
        { to: '/leaderboard',  icon: <Trophy size={18} />,       label: 'Рейтинг' },
        { to: '/knowledge',    icon: <BookOpen size={18} />,     label: 'База знаний' },
        { to: '/team',         icon: <Users size={18} />,        label: 'Моя команда' },
        { to: '/attendance',   icon: <CalendarCheck size={18} />, label: 'Посещаемость' },
        { to: '/ai-agent',     icon: <Bot size={18} />,          label: 'AI Агент' },
        { to: '/notifications', icon: <Bell size={18} />,        label: 'Уведомления', badge: unreadCount },
        { to: '/profile',      icon: <User size={18} />,         label: 'Профиль' },
      ];
    case 'MENTOR':
      return [
        { to: '/dashboard',    icon: <Home size={18} />,     label: 'Главная' },
        { to: '/juniors',      icon: <Users size={18} />,    label: 'Мои HiPo' },
        { to: '/challenges',   icon: <Zap size={18} />,      label: 'Задачи' },
        { to: '/leaderboard',  icon: <Trophy size={18} />,   label: 'Рейтинг' },
        { to: '/knowledge',    icon: <BookOpen size={18} />, label: 'База знаний' },
        { to: '/ai-agent',     icon: <Bot size={18} />,      label: 'AI Агент' },
        { to: '/notifications', icon: <Bell size={18} />,    label: 'Уведомления', badge: unreadCount },
        { to: '/profile',      icon: <User size={18} />,     label: 'Профиль' },
      ];
    case 'HR':
      return [
        { to: '/dashboard',    icon: <Home size={18} />,         label: 'Главная' },
        { to: '/users',        icon: <Users size={18} />,        label: 'Пользователи' },
        { to: '/challenges',   icon: <Zap size={18} />,          label: 'Задачи' },
        { to: '/mentorships',  icon: <Link2 size={18} />,        label: 'Пары' },
        { to: '/knowledge',    icon: <BookOpen size={18} />,     label: 'База знаний' },
        { to: '/points',       icon: <Star size={18} />,         label: 'Баллы' },
        { to: '/attendance',   icon: <CalendarCheck size={18} />, label: 'Посещаемость' },
        { to: '/admin',        icon: <Settings size={18} />,     label: 'Админ-панель' },
        { to: '/ai-agent',     icon: <Bot size={18} />,          label: 'AI Агент' },
        { to: '/profile',      icon: <User size={18} />,         label: 'Профиль' },
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
  const { theme, toggle } = useThemeStore();
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

      {/* Theme toggle */}
      <button
        onClick={toggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-elevated)',
          color: 'var(--text-muted)',
          fontSize: 13,
          cursor: 'pointer',
          marginBottom: 8,
          transition: 'all 0.15s',
        }}
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
      </button>

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
