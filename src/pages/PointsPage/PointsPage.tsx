import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@modules/auth/store/authStore';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Button } from '@shared/components/ui/Button/Button';
import { Input } from '@shared/components/ui/Input/Input';
import { DateInput } from '@shared/components/ui/Input/DateInput';
import { Modal } from '@shared/components/ui/Modal/Modal';
import {
  useActivities, useUsers, useUpdateActivity, useCreateActivity, useDeleteActivity,
  useQuizzes, useQuizResults,
} from '@shared/hooks/useApi';
import { Link2, Plus, X, ClipboardCheck, Calendar, CheckCircle } from 'lucide-react';
import { analytics } from '@shared/lib/analytics';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { ActivityStatus } from '@shared/types';
import styles from './PointsPage.module.css';

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<ActivityStatus, string> = {
  pending: 'На проверке',
  approved: 'Одобрено',
  revision: 'На доработку',
  rejected: 'Отклонено',
};

// ─────────────────────────────────────────────────────────────────────────────
// HR: Тесты tab
// ─────────────────────────────────────────────────────────────────────────────

function TestsTab() {
  const navigate = useNavigate();
  const { data: quizzes = [] } = useQuizzes();
  const { data: allResults = [] } = useQuizResults();

  if (quizzes.length === 0) return <div className={styles.empty}>Нет тестов</div>;

  return (
    <div className={styles.list}>
      {quizzes.map(q => {
        const count = allResults.filter(r => r.quizId === q.id).length;
        const pending = allResults.filter(r => r.quizId === q.id && r.score === 0).length;
        return (
          <div key={q.id} className={styles.quizCard}>
            <div className={styles.quizInfo}>
              <p className={styles.quizTitle}>{q.title}</p>
              <p className={styles.quizMeta}>
                {count} {count === 1 ? 'результат' : count < 5 ? 'результата' : 'результатов'}
                {pending > 0 && <span style={{ color: 'var(--color-warning-bright)', marginLeft: 8 }}>• {pending} требует проверки</span>}
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => navigate(`/tests/${q.id}/review`)}>
              <ClipboardCheck size={14} style={{ marginRight: 4 }} />
              Проверить
            </Button>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HR: Личные достижения tab
// ─────────────────────────────────────────────────────────────────────────────

function PersonalTab() {
  const { data: activities = [] } = useActivities();
  const { data: allUsers = [] } = useUsers();
  const updateActivity = useUpdateActivity();

  const [editing, setEditing] = useState<Record<number, { points: number; note: string }>>({});
  const [filter, setFilter] = useState<'all' | ActivityStatus>('pending');

  const personal = activities.filter(a => a.type === 'achievement');
  const filtered = filter === 'all' ? personal : personal.filter(a => a.status === filter);
  const pendingCount = personal.filter(a => a.status === 'pending').length;

  function getEdit(id: number, defaultPts: number, defaultNote: string) {
    return editing[id] ?? { points: defaultPts, note: defaultNote };
  }

  async function approve(id: number) {
    const ed = editing[id];
    await updateActivity.mutateAsync({
      id,
      data: {
        status: 'approved',
        awarded_points: ed?.points ?? 0,
        review_note: ed?.note || undefined,
      },
    });
  }

  async function reject(id: number) {
    const ed = editing[id];
    await updateActivity.mutateAsync({
      id,
      data: {
        status: 'rejected',
        review_note: ed?.note || 'Не соответствует критериям',
      },
    });
  }

  async function revision(id: number) {
    const ed = editing[id];
    await updateActivity.mutateAsync({
      id,
      data: {
        status: 'revision',
        review_note: ed?.note || 'Требуется доработка',
      },
    });
  }

  const FILTER_BTNS: { key: 'all' | ActivityStatus; label: string }[] = [
    { key: 'all',      label: 'Все' },
    { key: 'pending',  label: `На проверке${pendingCount ? ` (${pendingCount})` : ''}` },
    { key: 'approved', label: 'Одобрено' },
    { key: 'rejected', label: 'Отклонено' },
    { key: 'revision', label: 'На доработку' },
  ];

  return (
    <>
      <div className={styles.filters}>
        {FILTER_BTNS.map(f => (
          <button key={f.key}
            className={[styles.filterBtn, filter === f.key ? styles.active : ''].join(' ')}
            onClick={() => setFilter(f.key)}
          >{f.label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>Нет достижений</div>
      ) : (
        <div className={styles.list}>
          {filtered.map(a => {
            const u = allUsers.find(x => x.id === a.userId);
            const name = u ? u.username : `#${a.userId}`;
            const ed = getEdit(a.id, a.awardedPoints ?? 0, a.reviewNote ?? '');

            return (
              <div key={a.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <p className={styles.cardTitle}>{a.title}</p>
                  <span className={[styles.statusBadge, styles[a.status]].join(' ')}>
                    {STATUS_LABEL[a.status]}
                  </span>
                </div>
                <p className={styles.userName}>👤 {name}</p>
                {a.achievedDate && (
                  <p className={styles.metaItem} style={{ fontSize: 11 }}>
                    <Calendar size={11} />
                    {format(new Date(a.achievedDate), 'd MMMM yyyy', { locale: ru })}
                  </p>
                )}
                {a.description && <p className={styles.cardDesc}>{a.description}</p>}
                {(a.links ?? []).length > 0 && (
                  <div className={styles.linksList}>
                    {(a.links ?? []).map(url => (
                      <a key={url} href={url} target="_blank" rel="noopener noreferrer" className={styles.linksItem}>
                        <Link2 size={11} />{url}
                      </a>
                    ))}
                  </div>
                )}

                {a.status === 'pending' && (
                  <>
                    <div className={styles.scoreRow}>
                      <span className={styles.scoreLabel}>Баллы:</span>
                      <input
                        type="number"
                        className={styles.scoreInput}
                        min={0}
                        value={ed.points}
                        onChange={e => setEditing(prev => ({ ...prev, [a.id]: { ...ed, points: Math.max(0, Number(e.target.value)) } }))}
                      />
                    </div>
                    <textarea
                      className={styles.feedbackArea}
                      placeholder="Комментарий..."
                      value={ed.note}
                      onChange={e => setEditing(prev => ({ ...prev, [a.id]: { ...ed, note: e.target.value } }))}
                    />
                    <div className={styles.actions}>
                      <Button size="sm" onClick={() => approve(a.id)} disabled={updateActivity.isPending}>Одобрить</Button>
                      <Button size="sm" variant="secondary" onClick={() => revision(a.id)} disabled={updateActivity.isPending}>На доработку</Button>
                      <Button size="sm" variant="danger" onClick={() => reject(a.id)} disabled={updateActivity.isPending}>Отклонить</Button>
                    </div>
                  </>
                )}

                {a.status !== 'pending' && a.reviewNote && (
                  <p className={styles.note}>💬 {a.reviewNote}</p>
                )}
                {a.status === 'approved' && a.awardedPoints != null && (
                  <p className={styles.points}>✓ +{a.awardedPoints} баллов</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HR: full page with tabs
// ─────────────────────────────────────────────────────────────────────────────

type HrTab = 'tests' | 'personal';

const HR_TABS: { key: HrTab; label: string }[] = [
  { key: 'tests',    label: 'Тесты' },
  { key: 'personal', label: 'Личные достижения' },
];

function HrPointsPage() {
  const [tab, setTab] = useState<HrTab>('personal');
  const { data: activities = [] } = useActivities();
  const pendingPersonal = activities.filter(a => a.type === 'achievement' && a.status === 'pending').length;

  return (
    <>
      <PageHeader
        title="Управление баллами"
        showBack
        subtitle={pendingPersonal > 0 ? `${pendingPersonal} ожидают проверки` : undefined}
      />
      <div className={styles.page}>
        <div className={styles.tabs}>
          {HR_TABS.map(t => {
            const badge = t.key === 'personal' ? pendingPersonal : 0;
            return (
              <button
                key={t.key}
                className={[styles.tab, tab === t.key ? styles.tabActive : ''].join(' ')}
                onClick={() => setTab(t.key)}
              >
                {t.label}
                {badge > 0 && <span className={styles.tabBadge}>{badge}</span>}
              </button>
            );
          })}
        </div>

        {tab === 'tests'    && <TestsTab />}
        {tab === 'personal' && <PersonalTab />}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HiPo: "Мои достижения"
// ─────────────────────────────────────────────────────────────────────────────

function HiPoAchievementsPage() {
  const user = useAuthStore((s) => s.user)!;
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', achievedDate: '', linkInput: '', links: [] as string[] });
  const [filter, setFilter] = useState<'all' | ActivityStatus>('all');

  const { data: activities = [] } = useActivities({ user_id: user.id });
  const createActivity = useCreateActivity();
  const deleteActivity = useDeleteActivity();

  const filtered = filter === 'all' ? activities : activities.filter(a => a.status === filter);
  const pendingCount = activities.filter(a => a.status === 'pending').length;

  function addLink() {
    const trimmed = form.linkInput.trim();
    if (!trimmed || form.links.includes(trimmed)) return;
    setForm(p => ({ ...p, links: [...p.links, trimmed], linkInput: '' }));
  }

  function removeLink(url: string) {
    setForm(p => ({ ...p, links: p.links.filter(l => l !== url) }));
  }

  async function handleCreate() {
    if (!form.title.trim()) return;
    await createActivity.mutateAsync({
      user_id: user.id,
      title: form.title,
      description: form.description,
      requested_points: 0,
      activity_type: 'achievement',
      links: form.links.length ? form.links : undefined,
      achieved_date: form.achievedDate || undefined,
    });
    analytics.track('личное_достижение_отправлено', { has_links: form.links.length > 0 });
    setAddModal(false);
    setForm({ title: '', description: '', achievedDate: '', linkInput: '', links: [] });
  }

  const FILTERS: { key: 'all' | ActivityStatus; label: string }[] = [
    { key: 'all',      label: 'Все' },
    { key: 'pending',  label: `На проверке${pendingCount ? ` (${pendingCount})` : ''}` },
    { key: 'approved', label: 'Одобрено' },
    { key: 'revision', label: 'На доработку' },
    { key: 'rejected', label: 'Отклонено' },
  ];

  return (
    <>
      <PageHeader
        title="Мои достижения"
        showBack
        subtitle={`${activities.length} отправлено`}
      />
      <div className={styles.page}>
        <Button full style={{ marginBottom: 'var(--space-4)' }} onClick={() => setAddModal(true)}>
          + Добавить достижение
        </Button>

        <div className={styles.filters}>
          {FILTERS.map(f => (
            <button key={f.key}
              className={[styles.filterBtn, filter === f.key ? styles.active : ''].join(' ')}
              onClick={() => setFilter(f.key)}
            >{f.label}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className={styles.empty}>Нет достижений</div>
        ) : (
          <div className={styles.list}>
            {filtered.map(a => (
              <div key={a.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <p className={styles.cardTitle}>{a.title}</p>
                  <span className={[styles.statusBadge, styles[a.status]].join(' ')}>
                    {STATUS_LABEL[a.status]}
                  </span>
                </div>

                {a.achievedDate && (
                  <p className={styles.metaItem} style={{ fontSize: 11 }}>
                    <Calendar size={11} />
                    {format(new Date(a.achievedDate), 'd MMMM yyyy', { locale: ru })}
                  </p>
                )}

                {a.description && <p className={styles.cardDesc}>{a.description}</p>}

                {(a.links ?? []).length > 0 && (
                  <div className={styles.linksList}>
                    {(a.links ?? []).map(url => (
                      <a key={url} href={url} target="_blank" rel="noopener noreferrer" className={styles.linksItem}>
                        <Link2 size={11} />{url}
                      </a>
                    ))}
                  </div>
                )}

                {a.status === 'approved' && a.awardedPoints != null && (
                  <p className={styles.points}>
                    <CheckCircle size={13} style={{ display: 'inline', marginRight: 4, color: 'var(--color-success-bright)' }} />
                    +{a.awardedPoints} баллов
                  </p>
                )}

                {a.reviewNote && (
                  <p className={styles.note}>💬 {a.reviewNote}</p>
                )}

                {a.status === 'pending' && (
                  <div className={styles.actions}>
                    <Button size="sm" variant="danger" onClick={() => { analytics.track('личное_достижение_удалено', { activity_id: a.id }); deleteActivity.mutate(a.id); }}>
                      Удалить
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {addModal && (
        <Modal open={true} onClose={() => setAddModal(false)} title="Добавить достижение" type="dialog">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input
              label="Название *"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            />
            <Input
              label="Описание"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            />
            <DateInput
              label="Дата получения"
              value={form.achievedDate}
              onChange={date => setForm(p => ({ ...p, achievedDate: date }))}
            />

            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Ссылки</p>
              <div className={styles.linkInputRow}>
                <input
                  type="url"
                  className={styles.linkInput}
                  placeholder="https://..."
                  value={form.linkInput}
                  onChange={e => setForm(p => ({ ...p, linkInput: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addLink()}
                />
                <button className={styles.linkAddBtn} onClick={addLink}><Plus size={16} /></button>
              </div>
              {form.links.length > 0 && (
                <div className={styles.addedLinks} style={{ marginTop: 6 }}>
                  {form.links.map(url => (
                    <div key={url} className={styles.addedLink}>
                      <Link2 size={11} />
                      <span className={styles.addedLinkUrl}>{url}</span>
                      <button className={styles.linkRemoveBtn} onClick={() => removeLink(url)}><X size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button full onClick={handleCreate} disabled={createActivity.isPending || !form.title.trim()}>
              {createActivity.isPending ? 'Отправка...' : 'Отправить на проверку'}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────────

export function PointsPage() {
  const user = useAuthStore((s) => s.user)!;
  return user.role === 'HR' ? <HrPointsPage /> : <HiPoAchievementsPage />;
}
