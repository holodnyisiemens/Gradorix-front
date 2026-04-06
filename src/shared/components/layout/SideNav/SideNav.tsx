import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, Calendar, Zap, Bell, Users, Link2, User, LogOut,
  Trophy, BookOpen, FlaskConical, Star, Settings,
  CalendarCheck, Sun, Moon, MoreHorizontal, ChevronDown,
} from 'lucide-react';
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

interface NavConfig {
  primary: NavItem[];
  secondary: NavItem[];
}

function getNavConfig(role: UserRole, unreadCount: number): NavConfig {
  switch (role) {
    case 'JUNIOR':
      return {
        primary: [
          { to: '/dashboard',    icon: <Home size={18} />,          label: 'Главная' },
          { to: '/challenges',   icon: <Zap size={18} />,           label: 'Задачи' },
          { to: '/tests',        icon: <FlaskConical size={18} />,  label: 'Тесты' },
          { to: '/leaderboard',  icon: <Trophy size={18} />,        label: 'Рейтинг' },
          { to: '/calendar',     icon: <Calendar size={18} />,      label: 'Календарь' },
        ],
        secondary: [
          { to: '/knowledge',    icon: <BookOpen size={18} />,       label: 'База знаний' },
          { to: '/team',         icon: <Users size={18} />,          label: 'Моя команда' },
          { to: '/attendance',   icon: <CalendarCheck size={18} />,  label: 'Посещаемость' },
          { to: '/notifications', icon: <Bell size={18} />,          label: 'Уведомления', badge: unreadCount },
        ],
      };
    case 'MENTOR':
      return {
        primary: [
          { to: '/dashboard',   icon: <Home size={18} />,      label: 'Главная' },
          { to: '/juniors',     icon: <Users size={18} />,     label: 'Мои HiPo' },
          { to: '/challenges',  icon: <Zap size={18} />,       label: 'Задачи' },
          { to: '/calendar',    icon: <Calendar size={18} />,  label: 'Календарь' },
          { to: '/leaderboard', icon: <Trophy size={18} />,    label: 'Рейтинг' },
        ],
        secondary: [
          { to: '/knowledge',    icon: <BookOpen size={18} />,  label: 'База знаний' },
          { to: '/notifications', icon: <Bell size={18} />,     label: 'Уведомления', badge: unreadCount },
        ],
      };
    case 'HR':
      return {
        primary: [
          { to: '/dashboard',   icon: <Home size={18} />,          label: 'Главная' },
          { to: '/users',       icon: <Users size={18} />,         label: 'Пользователи' },
          { to: '/challenges',  icon: <Zap size={18} />,           label: 'Задачи' },
          { to: '/mentorships', icon: <Link2 size={18} />,         label: 'Пары' },
          { to: '/attendance',  icon: <CalendarCheck size={18} />, label: 'Посещаемость' },
        ],
        secondary: [
          { to: '/knowledge', icon: <BookOpen size={18} />,  label: 'База знаний' },
          { to: '/points',    icon: <Star size={18} />,      label: 'Баллы' },
          { to: '/admin',     icon: <Settings size={18} />,  label: 'Админ-панель' },
        ],
      };
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

function NavItems({ items }: { items: NavItem[] }) {
  return (
    <>
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
    </>
  );
}

export function SideNav({ unreadCount = 0 }: SideNavProps) {
  const user = useAuthStore((s) => s.user)!;
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const { theme, toggle } = useThemeStore();
  const { primary, secondary } = getNavConfig(user.role, unreadCount);
  const [moreOpen, setMoreOpen] = useState(false);

  const initials = ((user.firstname?.[0] ?? '') + (user.lastname?.[0] ?? '')).toUpperCase()
    || user.username.slice(0, 2).toUpperCase();

  // Badge for "Ещё" button — sum of all secondary badges
  const moreBadge = secondary.reduce((s, i) => s + (i.badge ?? 0), 0);

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

      {/* Primary nav */}
      <div className={styles.items}>
        <NavItems items={primary} />

        {/* "Ещё" dropdown trigger */}
        <button
          className={[styles.item, styles.moreBtn, moreOpen ? styles.moreOpen : ''].join(' ')}
          onClick={() => setMoreOpen((v) => !v)}
        >
          <span className={styles.itemIcon}><MoreHorizontal size={18} /></span>
          <span className={styles.itemLabel}>Ещё</span>
          {moreBadge > 0 && !moreOpen && (
            <span className={styles.itemBadge}>{moreBadge > 9 ? '9+' : moreBadge}</span>
          )}
          <ChevronDown
            size={14}
            className={styles.moreCaret}
            style={{ transform: moreOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>

        {/* Secondary items — collapsed by default */}
        {moreOpen && (
          <div className={styles.dropdown}>
            <NavItems items={secondary} />
          </div>
        )}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Theme toggle */}
      <button className={styles.themeBtn} onClick={toggle}>
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
      </button>

      {/* User block — clicking goes to profile */}
      <div className={styles.user} onClick={() => navigate('/profile')} role="button">
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
