import { useState } from 'react';
import { LogOut, User, Mail, Shield, Trophy, Edit2, Calendar, Zap, ClipboardList, Users, Settings, Link2, ChevronRight, FlaskConical, FileText, BookOpen, Send, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useThemeStore, type Theme } from '@shared/store/themeStore';
import { useSeasonStore, type Season } from '@shared/store/seasonStore';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Card } from '@shared/components/ui/Card/Card';
import { Button } from '@shared/components/ui/Button/Button';
import { Input } from '@shared/components/ui/Input/Input';
import { Modal } from '@shared/components/ui/Modal/Modal';
import { RoleBadge } from '@shared/components/ui/Badge/Badge';
import { useUserPoints, useUserAchievementsWithStatus, useQuizResults, useChallengeJuniors, useUpdateUser, useChangePassword } from '@shared/hooks/useApi';
import { analytics } from '@shared/lib/analytics';
import styles from './ProfilePage.module.css';

const THEME_GROUPS: { label: string; dark: Theme; light: Theme; color: string }[] = [
  { label: 'Очень тёмные дела', dark: 'dark',         light: 'light',              color: '#cc0000' },
  { label: 'Пацаны',            dark: 'boys',         light: 'boys-light',         color: '#f5c518' },
  { label: 'Во все тяжкие',     dark: 'breaking-bad', light: 'breaking-bad-light', color: '#76c417' },
  { label: 'Аркейн',            dark: 'arcane',       light: 'arcane-light',       color: '#8b5cf6' },
  { label: 'Игра в кальмара',   dark: 'squid-game',   light: 'squid-game-light',   color: '#e91e8c' },
  { label: 'DC',                dark: 'dc',           light: 'dc-light',           color: '#3d8ef0' },
  { label: 'Marvel',            dark: 'marvel',       light: 'marvel-light',       color: '#f03030' },
];

const SEASON_OPTS: { value: Season; label: string }[] = [
  { value: null,     label: '—'  },
  { value: 'winter', label: '❄️' },
  { value: 'spring', label: '🌸' },
  { value: 'summer', label: '☀️' },
  { value: 'autumn', label: '🍂' },
];

const LEVEL_THRESHOLDS = [0, 200, 500, 900, 1400, 2000];

type ExtraLink = { to: string; icon: React.ReactNode; label: string };

function getExtraLinks(role: string): ExtraLink[] {
  switch (role) {
    case 'EMPLOYEE':
      return [
        { to: '/challenges',    icon: <Zap size={18} />,          label: 'Задачи' },
        { to: '/calendar',      icon: <Calendar size={18} />,     label: 'Календарь' },
        { to: '/tests',         icon: <FlaskConical size={18} />, label: 'Тесты' },
        { to: '/surveys',       icon: <FileText size={18} />,     label: 'Опросы' },
        { to: '/knowledge',     icon: <BookOpen size={18} />,     label: 'База знаний' },
        { to: '/points',        icon: <Trophy size={18} />,       label: 'Личные достижения' },
        { to: '/team',          icon: <Users size={18} />,        label: 'Моя команда' },
      ];
    case 'MENTOR':
      return [
        { to: '/calendar',      icon: <Calendar size={18} />,     label: 'Календарь' },
        { to: '/team',          icon: <Users size={18} />,        label: 'Команды' },
      ];
    case 'HR':
      return [
        { to: '/admin',         icon: <Settings size={18} />,     label: 'Администрирование' },
        { to: '/mentorships',   icon: <Link2 size={18} />,        label: 'Менторство' },
        { to: '/challenges',    icon: <Zap size={18} />,          label: 'Задачи' },
        { to: '/tests',         icon: <FlaskConical size={18} />, label: 'Тесты' },
        { to: '/surveys',       icon: <FileText size={18} />,     label: 'Опросы' },
        { to: '/knowledge',     icon: <BookOpen size={18} />,     label: 'База знаний' },
        { to: '/calendar',      icon: <Calendar size={18} />,     label: 'Календарь' },
      ];
    default:
      return [];
  }
}

function rankEmoji(rank: number) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

type EditFormState = {
  username: string;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

function emptyEditForm(username: string): EditFormState {
  return { username, oldPassword: '', newPassword: '', confirmPassword: '' };
}

function validatePasswordFields(form: EditFormState): string {
  const hasAny = form.oldPassword || form.newPassword || form.confirmPassword;
  if (!hasAny) return '';

  if (!form.oldPassword) return 'Введите текущий пароль';
  if (!form.newPassword) return 'Введите новый пароль';
  if (form.newPassword.length < 6) return 'Новый пароль должен быть минимум 6 символов';
  if (form.newPassword !== form.confirmPassword) return 'Пароли не совпадают';
  return '';
}

function translatePasswordError(raw: string): string {
  if (raw.toLowerCase().includes('invalid old password')) {
    return 'Неверный текущий пароль';
  }
  return raw;
}

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)!;
  const logout = useAuthStore((s) => s.logout);
  const loginStore = useAuthStore((s) => s.login);
  const { theme, setTheme } = useThemeStore();
  const { season, setSeason } = useSeasonStore();
  const navigate = useNavigate();
  const updateUser = useUpdateUser();
  const changePassword = useChangePassword();

  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>(() => emptyEditForm(user.username));
  const [showPasswords, setShowPasswords] = useState(false);
  const [formError, setFormError] = useState('');

  const initials = user.username.slice(0, 2).toUpperCase();

  const { data: pts } = useUserPoints(user.id);
  const isHiPo = user.role === 'EMPLOYEE';
  const { data: achievements = [] } = useUserAchievementsWithStatus(isHiPo ? user.id : undefined);
  const earnedAch = achievements.filter((a) => a.earned);
  const { data: quizResults = [] } = useQuizResults(isHiPo ? { user_id: user.id } : undefined);
  const { data: assignments = [] } = useChallengeJuniors(isHiPo ? { employee_id: user.id } : undefined);
  const doneChallenges = assignments.filter((c) => c.progress === 'DONE').length;

  const levelPct = pts
    ? (() => {
        const lo = LEVEL_THRESHOLDS[pts.level] ?? 0;
        const hi = LEVEL_THRESHOLDS[pts.level + 1] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
        return Math.min(100, Math.round(((pts.totalPoints - lo) / (hi - lo)) * 100));
      })()
    : 0;

  function openEditModal() {
    setEditForm(emptyEditForm(user.username));
    setFormError('');
    setShowPasswords(false);
    setEditModal(true);
  }

  function closeEditModal() {
    setEditModal(false);
    setFormError('');
  }

  async function handleSaveProfile() {
    setFormError('');

    const passwordError = validatePasswordFields(editForm);
    if (passwordError) {
      setFormError(passwordError);
      return;
    }

    const wantsPassword = !!(editForm.oldPassword || editForm.newPassword || editForm.confirmPassword);
    const usernameChanged = editForm.username.trim() !== user.username;

    if (!wantsPassword && !usernameChanged) {
      closeEditModal();
      return;
    }

    try {
      if (wantsPassword) {
        await changePassword.mutateAsync({
          old_password: editForm.oldPassword,
          new_password: editForm.newPassword,
        });
      }

      if (usernameChanged) {
        await updateUser.mutateAsync({ id: user.id, data: { username: editForm.username.trim() } });
        const state = useAuthStore.getState();
        loginStore(
          { ...user, username: editForm.username.trim() },
          state.token!,
          state.refreshToken!,
        );
      }

      closeEditModal();
    } catch (err: unknown) {
      const axiosData = (err as { response?: { data?: { detail?: string } } })?.response?.data;
      const rawMsg = axiosData?.detail ?? 'Не удалось сохранить изменения';
      setFormError(translatePasswordError(rawMsg));
    }
  }

  const isSaving = updateUser.isPending || changePassword.isPending;

  return (
    <>
      <PageHeader title="Профиль" />
      <div className={styles.page}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>{initials}</div>
          <h2 className={styles.name}>
            {user.username}
          </h2>
          <RoleBadge role={user.role} />
          <Button variant="ghost" size="sm" style={{ marginTop: 8 }} onClick={openEditModal}>
            <Edit2 size={13} /> Редактировать
          </Button>
        </div>

        {pts && (
          <div className={styles.levelBlock}>
            <div className={styles.levelLeft}>
              <p className={styles.levelNum}>{pts.level}</p>
              <p className={styles.levelWord}>уровень</p>
            </div>
            <div className={styles.levelRight}>
              <p className={styles.levelName}>{pts.levelName}</p>
              <p className={styles.levelPts}>{pts.totalPoints} баллов · до след. {pts.pointsToNextLevel}</p>
              <div className={styles.levelProgress}>
                <div className={styles.levelProgressFill} style={{ width: `${levelPct}%` }} />
              </div>
            </div>
            <div className={styles.rankBadge}>{rankEmoji(pts.rank)}</div>
          </div>
        )}

        {isHiPo && (
          <>
            <div className={styles.statsRow}>
              <div className={styles.statBox}>
                <p className={styles.statVal}>{doneChallenges}</p>
                <p className={styles.statLbl}>Задач выполнено</p>
              </div>
              <div className={styles.statBox}>
                <p className={styles.statVal}>{quizResults.length}</p>
                <p className={styles.statLbl}>Тестов пройдено</p>
              </div>
              <div className={styles.statBox}>
                <p className={styles.statVal}>{earnedAch.length}</p>
                <p className={styles.statLbl}>Достижений</p>
              </div>
            </div>

            {achievements.length > 0 && (
              <div>
                <p className={styles.sectionTitle}>Достижения</p>
                <div className={styles.achievementsGrid}>
                  {achievements.slice(0, 8).map((a) => (
                    <div key={a.id} className={[styles.achip, !a.earned ? styles.achipLocked : ''].join(' ')}>
                      <span className={styles.achipIcon}>{a.icon}</span>
                      <span className={styles.achipTitle}>{a.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button variant="secondary" full onClick={() => navigate('/leaderboard')}>
              <Trophy size={16} /> Посмотреть рейтинг
            </Button>
          </>
        )}

        <Card>
          <div className={styles.infoList}>
            <div className={styles.infoRow}>
              <User size={16} className={styles.infoIcon} />
              <span className={styles.infoLabel}>Логин</span>
              <span className={styles.infoValue}>@{user.username}</span>
            </div>
            <div className={styles.infoRow}>
              <Mail size={16} className={styles.infoIcon} />
              <span className={styles.infoLabel}>Email</span>
              <span className={styles.infoValue}>{user.email}</span>
            </div>
            <div className={styles.infoRow}>
              <Shield size={16} className={styles.infoIcon} />
              <span className={styles.infoLabel}>Роль</span>
              <span className={styles.infoValue}>{user.role}</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className={styles.statusRow}>
            <span className={styles.statusDot} style={{ background: user.is_active ? 'var(--color-success-bright)' : 'var(--text-muted)' }} />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Статус: {user.is_active ? 'Активен' : 'Неактивен'}
            </span>
          </div>
        </Card>

        {getExtraLinks(user.role).length > 0 && (
          <div>
            <p className={styles.sectionTitle}>Ещё</p>
            <div className={styles.extraLinks}>
              {getExtraLinks(user.role).map((link) => (
                <button key={link.to} className={styles.extraLinkRow} onClick={() => navigate(link.to)}>
                  <span className={styles.extraLinkIcon}>{link.icon}</span>
                  <span className={styles.extraLinkLabel}>{link.label}</span>
                  <ChevronRight size={16} className={styles.extraLinkChevron} />
                </button>
              ))}
            </div>
          </div>
        )}

        {isHiPo && (
          <Card>
            <p className={styles.sectionTitle}>Контакты организаторов</p>
            <div className={styles.infoList}>
              <div className={styles.infoRow}>
                <Mail size={16} className={styles.infoIcon} />
                <span className={styles.infoLabel}>Email</span>
                <span className={styles.infoValue}>organizers@gradorix.ru</span>
              </div>
              <div className={styles.infoRow}>
                <Send size={16} className={styles.infoIcon} />
                <span className={styles.infoLabel}>Telegram</span>
                <span className={styles.infoValue}>@gradorix_org</span>
              </div>
            </div>
          </Card>
        )}

        <div>
          <p className={styles.sectionTitle}>Внешний вид</p>
          <div className={styles.appearanceCard}>
            <div className={styles.appearanceRow}>
              <span className={styles.appearanceLabel}>Сезон</span>
              <div className={styles.seasonBtns}>
                {SEASON_OPTS.map(o => (
                  <button
                    key={String(o.value)}
                    title={o.value ?? 'Выключить'}
                    className={[styles.seasonBtn, season === o.value ? styles.seasonBtnActive : ''].join(' ')}
                    onClick={() => setSeason(o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.appearanceDivider} />

            <p className={styles.appearanceLabel}>Тема</p>
            <div className={styles.themeList}>
              {THEME_GROUPS.map(g => (
                <div key={g.dark} className={styles.themeRow}>
                  <span className={styles.themeRowDot} style={{ background: g.color }} />
                  <span className={styles.themeRowName}>{g.label}</span>
                  <div className={styles.themeVariants}>
                    <button
                      title={`${g.label} — тёмная`}
                      className={[styles.themeVariantBtn, styles.themeVariantDark, theme === g.dark ? styles.themeVariantActive : ''].join(' ')}
                      style={{ '--swatch-color': g.color } as React.CSSProperties}
                      onClick={() => setTheme(g.dark)}
                    />
                    <button
                      title={`${g.label} — светлая`}
                      className={[styles.themeVariantBtn, styles.themeVariantLight, theme === g.light ? styles.themeVariantActive : ''].join(' ')}
                      style={{ '--swatch-color': g.color } as React.CSSProperties}
                      onClick={() => setTheme(g.light)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Button variant="danger" full onClick={() => { analytics.track('выход_из_системы'); analytics.reset(); logout(); }}>
          <LogOut size={16} />
          Выйти из аккаунта
        </Button>
      </div>

      {editModal && (
        <Modal open={true} onClose={closeEditModal} title="Редактировать профиль" type="dialog">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input
              label="Логин"
              value={editForm.username}
              onChange={e => setEditForm(p => ({ ...p, username: e.target.value }))}
            />

            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
              Смена пароля
            </p>
            <Input
              label="Текущий пароль"
              type={showPasswords ? 'text' : 'password'}
              value={editForm.oldPassword}
              onChange={e => setEditForm(p => ({ ...p, oldPassword: e.target.value }))}
              autoComplete="current-password"
              iconRight={showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
              onIconRightClick={() => setShowPasswords(v => !v)}
            />
            <Input
              label="Новый пароль"
              type={showPasswords ? 'text' : 'password'}
              value={editForm.newPassword}
              onChange={e => setEditForm(p => ({ ...p, newPassword: e.target.value }))}
              autoComplete="new-password"
            />
            <Input
              label="Подтвердите новый пароль"
              type={showPasswords ? 'text' : 'password'}
              value={editForm.confirmPassword}
              onChange={e => setEditForm(p => ({ ...p, confirmPassword: e.target.value }))}
              autoComplete="new-password"
            />

            {formError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <Button full onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
