import { useState } from 'react';
import { LogOut, User, Mail, Shield, Trophy, Edit2, Calendar, Bell, Zap, ClipboardList, Users, Settings, Link2, ChevronRight, FlaskConical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@modules/auth/store/authStore';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Card } from '@shared/components/ui/Card/Card';
import { Button } from '@shared/components/ui/Button/Button';
import { Input } from '@shared/components/ui/Input/Input';
import { Modal } from '@shared/components/ui/Modal/Modal';
import { RoleBadge } from '@shared/components/ui/Badge/Badge';
import { useUserPoints, useUserAchievementsWithStatus, useQuizResults, useChallengeJuniors, useUpdateUser } from '@shared/hooks/useApi';
import styles from './ProfilePage.module.css';

const LEVEL_THRESHOLDS = [0, 200, 500, 900, 1400, 2000];

type ExtraLink = { to: string; icon: React.ReactNode; label: string };

function getExtraLinks(role: string): ExtraLink[] {
  switch (role) {
    case 'JUNIOR':
      return [
        { to: '/challenges',    icon: <Zap size={18} />,          label: 'Задачи' },
        { to: '/calendar',      icon: <Calendar size={18} />,     label: 'Календарь' },
        { to: '/attendance',    icon: <ClipboardList size={18} />,label: 'Посещаемость' },
        { to: '/points',        icon: <Trophy size={18} />,       label: 'Мои баллы' },
        { to: '/team',          icon: <Users size={18} />,        label: 'Моя команда' },
      ];
    case 'MENTOR':
      return [
        { to: '/calendar',      icon: <Calendar size={18} />,     label: 'Календарь' },
        { to: '/attendance',    icon: <ClipboardList size={18} />,label: 'Посещаемость' },
        { to: '/team',          icon: <Users size={18} />,        label: 'Команды' },
      ];
    case 'HR':
      return [
        { to: '/admin',         icon: <Settings size={18} />,     label: 'Администрирование' },
        { to: '/mentorships',   icon: <Link2 size={18} />,        label: 'Менторство' },
        { to: '/challenges',    icon: <Zap size={18} />,          label: 'Задачи' },
        { to: '/tests',         icon: <FlaskConical size={18} />, label: 'Тесты' },
        { to: '/calendar',      icon: <Calendar size={18} />,     label: 'Календарь' },
        { to: '/attendance',    icon: <ClipboardList size={18} />,label: 'Посещаемость' },
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

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)!;
  const logout = useAuthStore((s) => s.logout);
  const loginStore = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const updateUser = useUpdateUser();

  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ firstname: user.firstname ?? '', lastname: user.lastname ?? '', username: user.username });

  const initials = ((user.firstname?.[0] ?? '') + (user.lastname?.[0] ?? '')).toUpperCase()
    || user.username.slice(0, 2).toUpperCase();

  const { data: pts } = useUserPoints(user.id);
  const isHiPo = user.role === 'JUNIOR';
  const { data: achievements = [] } = useUserAchievementsWithStatus(isHiPo ? user.id : undefined);
  const earnedAch = achievements.filter((a) => a.earned);
  const { data: quizResults = [] } = useQuizResults(isHiPo ? { user_id: user.id } : undefined);
  const { data: assignments = [] } = useChallengeJuniors(isHiPo ? { junior_id: user.id } : undefined);
  const doneChallenges = assignments.filter((c) => c.progress === 'DONE').length;

  const levelPct = pts
    ? (() => {
        const lo = LEVEL_THRESHOLDS[pts.level] ?? 0;
        const hi = LEVEL_THRESHOLDS[pts.level + 1] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
        return Math.min(100, Math.round(((pts.totalPoints - lo) / (hi - lo)) * 100));
      })()
    : 0;

  async function handleSaveProfile() {
    await updateUser.mutateAsync({ id: user.id, data: { firstname: editForm.firstname || undefined, lastname: editForm.lastname || undefined, username: editForm.username } });
    loginStore({ ...user, firstname: editForm.firstname || undefined, lastname: editForm.lastname || undefined, username: editForm.username }, useAuthStore.getState().token!);
    setEditModal(false);
  }

  return (
    <>
      <PageHeader title="Профиль" />
      <div className={styles.page}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>{initials}</div>
          <h2 className={styles.name}>
            {user.firstname && user.lastname ? `${user.firstname} ${user.lastname}` : user.username}
          </h2>
          <RoleBadge role={user.role} />
          <Button variant="ghost" size="sm" style={{ marginTop: 8 }} onClick={() => setEditModal(true)}>
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

        <Button variant="danger" full onClick={logout}>
          <LogOut size={16} />
          Выйти из аккаунта
        </Button>
      </div>

      {editModal && (
        <Modal open={true} onClose={() => setEditModal(false)} title="Редактировать профиль" type="dialog">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input label="Имя" value={editForm.firstname} onChange={e => setEditForm(p => ({ ...p, firstname: e.target.value }))} />
            <Input label="Фамилия" value={editForm.lastname} onChange={e => setEditForm(p => ({ ...p, lastname: e.target.value }))} />
            <Input label="Логин" value={editForm.username} onChange={e => setEditForm(p => ({ ...p, username: e.target.value }))} />
            <Button full onClick={handleSaveProfile} disabled={updateUser.isPending}>
              {updateUser.isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
