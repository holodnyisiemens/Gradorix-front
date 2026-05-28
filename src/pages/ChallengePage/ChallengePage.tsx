import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExternalLink, Calendar, Star, Link2, Plus, X, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuthStore } from '@modules/auth/store/authStore';
import {
  useChallenge, useChallengeJuniors, useUpdateChallengeProgress, useUpdateChallengeEmployee,
  useUpdateChallenge, useDeleteChallenge, useAssignChallenge, useUnassignChallenge,
  useUsers, useCreateNotification,
} from '@shared/hooks/useApi';
import { ChallengeStatusBadge, ProgressBadge } from '@shared/components/ui/Badge/Badge';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Card } from '@shared/components/ui/Card/Card';
import { Button } from '@shared/components/ui/Button/Button';
import { Input } from '@shared/components/ui/Input/Input';
import { DateInput } from '@shared/components/ui/Input/DateInput';
import { Modal } from '@shared/components/ui/Modal/Modal';
import type { ChallengeStatus, ChallengeEmployeeProgress } from '@shared/types';
import { analytics } from '@shared/lib/analytics';
import styles from './ChallengePage.module.css';

interface DonutSegment { value: number; color: string; label: string }

function DonutChart({ total, segments }: { total: number; segments: DonutSegment[] }) {
  const r = 54;
  const cx = 70;
  const cy = 70;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * r;

  let accumulated = 0;
  const arcs = segments
    .filter(s => s.value > 0)
    .map(s => {
      const length = (s.value / total) * circumference;
      const offset = accumulated;
      accumulated += length;
      return { ...s, length, offset };
    });

  return (
    <svg viewBox="0 0 140 140" width={140} height={140} style={{ flexShrink: 0 }}>
      {arcs.length === 0 ? (
        <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={strokeWidth}
          style={{ stroke: 'var(--border-subtle)' }} />
      ) : (
        arcs.map((arc, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" strokeWidth={strokeWidth}
            stroke={arc.color}
            strokeDasharray={`${arc.length} ${circumference}`}
            strokeDashoffset={-arc.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        ))
      )}
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize={26}
        fontFamily="var(--font-display)" fill="var(--text-primary)">{total}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize={10}
        fontFamily="inherit" fill="var(--text-muted)" letterSpacing="0.05em">НАЗНАЧЕНО</text>
    </svg>
  );
}

type EditForm = {
  title: string;
  description: string;
  url: string;
  date: string;
  maxPointsStr: string;
  status: ChallengeStatus;
};

export function ChallengePage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user)!;
  const navigate = useNavigate();
  const isEmployee = user.role === 'EMPLOYEE';
  const isHR = user.role === 'HR';

  const { data: challenge, isLoading } = useChallenge(Number(id));
  const { data: assignments = [] } = useChallengeJuniors(
    isEmployee ? { employee_id: user.id } : undefined
  );
  const { data: allUsers = [] } = useUsers();
  const updateProgress = useUpdateChallengeProgress();
  const updateJunior = useUpdateChallengeEmployee();
  const updateChallenge = useUpdateChallenge();
  const deleteChallenge = useDeleteChallenge();
  const assignChallengeMut = useAssignChallenge();
  const unassignChallengeMut = useUnassignChallenge();
  const createNotification = useCreateNotification();

  // HR: edit modal
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  // HR: assign modal
  const [assignModal, setAssignModal] = useState(false);
  const [selectedJuniorIds, setSelectedJuniorIds] = useState<number[]>([]);
  const [juniorSearch, setJuniorSearch] = useState('');
  // HR: stats + review accordions
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [reviewExpanded, setReviewExpanded] = useState(false);
  const [reviewedExpanded, setReviewedExpanded] = useState(false);
  const [reviewing, setReviewing] = useState<Record<number, { points: number; feedback: string }>>({});
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  const [editModeJuniors, setEditModeJuniors] = useState<Set<number>>(new Set());

  // Junior or HR-personal: comment & links
  const assignment = isEmployee
    ? assignments.find((cj) => cj.challenge_id === Number(id) && cj.employee_id === user.id)
    : null;
  const [comment, setComment] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [saving, setSaving] = useState<'draft' | 'submit' | null>(null);

  const juniors = allUsers.filter(u => u.role === 'EMPLOYEE');
  const challengeAssignments = assignments.filter(a => a.challenge_id === Number(id));

  // personal = HR has assigned themselves and no one else is assigned
  const selfAssignment = isHR
    ? challengeAssignments.find(a => a.employee_id === user.id) ?? null
    : null;
  const isPersonal = isHR &&
    challengeAssignments.length > 0 &&
    challengeAssignments.every(a => a.employee_id === user.id);

  const activeAssignment = assignment ?? selfAssignment;

  const awaitingReview = challengeAssignments.filter(a => a.awarded_points == null && a.employee_id !== user.id);
  const alreadyReviewed = challengeAssignments.filter(a => a.progress === 'DONE' && a.awarded_points != null && a.employee_id !== user.id);

  const stats = (() => {
    if (!isHR || challengeAssignments.length === 0) return null;
    const total = challengeAssignments.length;
    const done = challengeAssignments.filter(a => a.progress === 'DONE').length;
    const inProgress = challengeAssignments.filter(a => a.progress === 'IN_PROGRESS').length;
    const going = challengeAssignments.filter(a => a.progress === 'GOING').length;
    const skipped = challengeAssignments.filter(a => a.progress === 'SKIPPED').length;
    const pointsList = alreadyReviewed.map(a => a.awarded_points ?? 0);
    const avgPoints = pointsList.length > 0
      ? Math.round(pointsList.reduce((s, p) => s + p, 0) / pointsList.length * 10) / 10
      : null;
    const maxPoints = pointsList.length > 0 ? Math.max(...pointsList) : null;
    return { total, done, inProgress, going, skipped, avgPoints, maxPoints };
  })();

  useEffect(() => {
    if (activeAssignment) {
      setComment(activeAssignment.comment ?? '');
      setLinks(activeAssignment.links ?? []);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAssignment?.challenge_id, activeAssignment?.employee_id]);

  useEffect(() => {
    if (
      challenge?.status === 'COMPLETED' &&
      activeAssignment &&
      (activeAssignment.progress === 'GOING' || activeAssignment.progress === 'IN_PROGRESS')
    ) {
      updateProgress.mutate({ challengeId: challenge.id, juniorId: user.id, progress: 'SKIPPED' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge?.status, activeAssignment?.progress]);

  if (isLoading) return null;

  if (!challenge) {
    return (
      <>
        <PageHeader title="Задача" showBack />
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
          Задача не найдена
        </div>
      </>
    );
  }

  const isActive    = challenge.status === 'ACTIVE';
  const isCompleted = challenge.status === 'COMPLETED';
  const isCancelled = challenge.status === 'CANCELLED';

  const currentProgress = activeAssignment?.progress;
  const isSubmitted = currentProgress === 'DONE';

  // ── Junior helpers ──────────────────────────────────────────────────────────

  function addLink() {
    const trimmed = linkInput.trim();
    if (!trimmed || links.includes(trimmed)) return;
    setLinks(prev => [...prev, trimmed]);
    setLinkInput('');
    analytics.track('задача_добавлена_ссылка', { challenge_id: challenge?.id });
  }

  function removeLink(url: string) {
    setLinks(prev => prev.filter(l => l !== url));
  }

  function getFinalLinks() {
    const trimmed = linkInput.trim();
    if (trimmed && !links.includes(trimmed)) return [...links, trimmed];
    return links;
  }

  async function saveDraft() {
    if (!activeAssignment) return;
    const finalLinks = getFinalLinks();
    if (linkInput.trim()) { setLinks(finalLinks); setLinkInput(''); }
    setSaving('draft');
    await updateJunior.mutateAsync({
      challengeId: challenge.id,
      juniorId: user.id,
      data: { comment: comment || undefined, links: finalLinks.length ? finalLinks : undefined, progress: 'IN_PROGRESS' },
    });
    analytics.track('задача_сохранён_черновик', { challenge_id: challenge?.id, has_links: finalLinks.length > 0, has_comment: !!comment });
    setSaving(null);
  }

  async function submitForReview() {
    if (!activeAssignment) return;
    const finalLinks = getFinalLinks();
    if (linkInput.trim()) { setLinks(finalLinks); setLinkInput(''); }
    setSaving('submit');
    await updateJunior.mutateAsync({
      challengeId: challenge.id,
      juniorId: user.id,
      data: { comment: comment || undefined, links: finalLinks.length ? finalLinks : undefined, progress: 'DONE' },
    });
    analytics.track('задача_отправлена_на_проверку', { challenge_id: challenge?.id, has_links: finalLinks.length > 0, has_comment: !!comment, links_count: finalLinks.length });
    setSaving(null);
  }

  // ── HR helpers ──────────────────────────────────────────────────────────────

  function openEdit() {
    setEditForm({
      title: challenge.title,
      description: challenge.description ?? '',
      url: challenge.url ?? '',
      date: challenge.date ?? '',
      maxPointsStr: challenge.maxPoints != null ? String(challenge.maxPoints) : '',
      status: challenge.status,
    });
    setEditModal(true);
  }

  async function handleEdit() {
    if (!editForm) return;
    const maxPts = editForm.maxPointsStr ? Number(editForm.maxPointsStr) : undefined;
    await updateChallenge.mutateAsync({
      id: challenge.id,
      data: {
        title: editForm.title,
        description: editForm.description,
        status: editForm.status,
        date: editForm.date,
        url: editForm.url,
        max_points: maxPts,
      },
    });
    setEditModal(false);
  }

  async function handleDelete() {
    if (!window.confirm(`Удалить задачу «${challenge.title}»?`)) return;
    await deleteChallenge.mutateAsync(challenge.id);
    navigate('/challenges');
  }

  function openAssign() {
    setSelectedJuniorIds(challengeAssignments.map(a => a.employee_id));
    setAssignModal(true);
  }

  async function handleAssign() {
    const existing = challengeAssignments.map(a => a.employee_id);
    const toAssign = selectedJuniorIds.filter(jid => !existing.includes(jid));
    const toUnassign = existing.filter(jid => !selectedJuniorIds.includes(jid));
    await Promise.all(toUnassign.map(juniorId =>
      unassignChallengeMut.mutateAsync({ challengeId: challenge.id, juniorId })
    ));
    await Promise.all(toAssign.map(juniorId =>
      assignChallengeMut.mutateAsync({ challenge_id: challenge.id, employee_id: juniorId, assigned_by: user.id, progress: 'GOING' })
    ));
    setAssignModal(false);
  }

  function toggleJunior(jid: number) {
    setSelectedJuniorIds(prev => prev.includes(jid) ? prev.filter(x => x !== jid) : [...prev, jid]);
  }

  function getReviewState(juniorId: number, defaultPoints: number, defaultFeedback: string) {
    return reviewing[juniorId] ?? { points: defaultPoints, feedback: defaultFeedback };
  }

  function renderReviewForm(a: typeof assignments[number]) {
    const junior = allUsers.find(u => u.id === a.employee_id);
    const name = junior ? junior.username : `#${a.employee_id}`;
    const st = getReviewState(a.employee_id, a.awarded_points ?? 0, a.feedback ?? '');
    const maxPts = challenge?.maxPoints;
    const isSaved = saved[a.employee_id];

    return (
      <div style={{
        padding: 'var(--space-3) var(--space-4)',
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
      }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--text-primary)' }}>
          👤 {name}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
          Статус: {a.progress}
        </p>
        {a.comment && (
          <p style={{
            fontSize: 13, color: 'var(--text-secondary)',
            background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)',
            padding: 'var(--space-2) var(--space-3)',
          }}>
            {a.comment}
          </p>
        )}
        {(a.links ?? []).length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {(a.links ?? []).map(url => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-info-bright)', textDecoration: 'none' }}
              >
                <Link2 size={11} />{url}
              </a>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Баллы:</span>
          <input
            type="number" min={0} max={maxPts ?? undefined} value={st.points}
            className={styles.scoreInput}
            onChange={e => setReviewing(prev => ({
              ...prev,
              [a.employee_id]: { ...st, points: Math.max(0, maxPts != null ? Math.min(Number(e.target.value), maxPts) : Number(e.target.value)) },
            }))}
          />
          {maxPts != null && <span className={styles.maxLabel}>/ {maxPts}</span>}
        </div>
        <textarea
          placeholder="Обратная связь для участника..."
          value={st.feedback}
          onChange={e => setReviewing(prev => ({ ...prev, [a.employee_id]: { ...st, feedback: e.target.value } }))}
          style={{
            width: '100%', minHeight: 72, background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit',
            padding: 'var(--space-2) var(--space-3)', resize: 'vertical', outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <Button size="sm" onClick={() => saveReview(a)} disabled={updateJunior.isPending}>
          {isSaved ? '✓ Сохранено' : 'Сохранить'}
        </Button>
      </div>
    );
  }

  async function saveReview(a: typeof assignments[number]) {
    const st = getReviewState(a.employee_id, a.awarded_points ?? 0, a.feedback ?? '');
    const maxPts = challenge.maxPoints;
    const finalPoints = maxPts != null ? Math.min(st.points, maxPts) : st.points;
    await updateJunior.mutateAsync({
      challengeId: challenge.id,
      juniorId: a.employee_id,
      data: {
        progress: 'DONE' as ChallengeEmployeeProgress,
        awarded_points: finalPoints,
        feedback: st.feedback || undefined,
      },
    });
    createNotification.mutate({
      user_id: a.employee_id,
      message: `⭐ HR проверил вашу задачу «${challenge.title}» — начислено ${finalPoints} баллов${st.feedback ? '. Есть обратная связь' : ''}`,
      link: `/challenges/${challenge.id}`,
    });
    setSaved(prev => ({ ...prev, [a.employee_id]: true }));
    setEditModeJuniors(prev => { const next = new Set(prev); next.delete(a.employee_id); return next; });
    setTimeout(() => setSaved(prev => ({ ...prev, [a.employee_id]: false })), 2000);
  }

  return (
    <>
      <PageHeader title={challenge.title} showBack />
      <div className={styles.page}>

        {/* HR action bar */}
        {isHR && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {!isPersonal && (
              <Button size="sm" variant="ghost" onClick={openAssign} style={{ flex: 1 }}>
                Назначить ({challengeAssignments.filter(a => a.employee_id !== user.id).length})
              </Button>
            )}
            {isPersonal && (
              <span style={{ flex: 1, fontSize: 12, color: 'var(--text-muted)', padding: '0 var(--space-2)' }}>
                Личная задача
              </span>
            )}
            <Button size="sm" variant="secondary" onClick={openEdit} title="Редактировать">
              <Pencil size={15} />
            </Button>
            <Button size="sm" variant="danger" onClick={handleDelete} title="Удалить">
              <Trash2 size={15} />
            </Button>
          </div>
        )}

        <div className={styles.header}>
          <ChallengeStatusBadge status={challenge.status} />
          {activeAssignment && <ProgressBadge progress={currentProgress ?? activeAssignment.progress} />}
          {challenge.maxPoints != null && challenge.maxPoints > 0 && !isPersonal && (
            <span className={[styles.maxPointsBadge, isEmployee && activeAssignment?.awarded_points != null ? styles.maxPointsBadgeAwarded : ''].join(' ')}>
              <Star size={13} />
              {isEmployee && activeAssignment?.awarded_points != null
                ? `${activeAssignment.awarded_points} из ${challenge.maxPoints} баллов`
                : `до ${challenge.maxPoints} баллов`}
            </span>
          )}
        </div>

        {isCancelled && (
          <div className={styles.cancelledNotice}>
            Задача отменена. Баллы за неё не начисляются.
          </div>
        )}

        {challenge.description && (
          <Card>
            <p className={styles.description}>{challenge.description}</p>
          </Card>
        )}

        {challenge.date && (
          <div className={styles.meta}>
            <Calendar size={14} />
            <span>{format(new Date(challenge.date), 'd MMMM yyyy', { locale: ru })}</span>
          </div>
        )}

        {challenge.url && (
          <a className={styles.link} href={challenge.url} target="_blank" rel="noopener noreferrer"
            onClick={() => analytics.track('задача_открыт_материал', { challenge_id: challenge.id })}>
            <ExternalLink size={16} />
            Открыть материал
          </a>
        )}

                {/* HR stats accordion */}
        {isHR && !isPersonal && stats && (
          <div>
            <button
              onClick={() => setStatsExpanded(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-2)', width: '100%',
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                borderRadius: statsExpanded ? 'var(--radius-lg) var(--radius-lg) 0 0' : 'var(--radius-lg)',
                cursor: 'pointer', color: 'var(--text-secondary)',
                fontFamily: 'var(--font-display)', fontSize: 14,
              }}
            >
              <span style={{ flex: 1, textAlign: 'left' }}>Статистика</span>
              {statsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {statsExpanded && (
              <div className={styles.statsCard}>
                <DonutChart
                  total={stats.total}
                  segments={[
                    { value: stats.done,       color: '#3dbd6a', label: 'Выполнено' },
                    { value: stats.inProgress, color: '#3a9aee', label: 'В процессе' },
                    { value: stats.going,      color: '#555566', label: 'Не начато' },
                    { value: stats.skipped,    color: '#cc3333', label: 'Пропущено' },
                  ]}
                />
                <div className={styles.statsLegend}>
                  {[
                    { value: stats.done,       color: '#3dbd6a', label: 'Выполнено' },
                    { value: stats.inProgress, color: '#3a9aee', label: 'В процессе' },
                    { value: stats.going,      color: '#555566', label: 'Не начато' },
                    ...(stats.skipped > 0 ? [{ value: stats.skipped, color: '#cc3333', label: 'Пропущено' }] : []),
                  ].map(s => (
                    <div key={s.label} className={styles.legendRow}>
                      <span className={styles.legendDot} style={{ background: s.color }} />
                      <span className={styles.legendLabel}>{s.label}</span>
                      <span className={styles.legendValue} style={{ color: s.color }}>{s.value}</span>
                    </div>
                  ))}
                  {stats.avgPoints !== null && (
                    <div className={styles.legendDivider}>
                      <span className={styles.legendLabel}>Средний балл</span>
                      <span className={styles.legendValue} style={{ color: '#ffaa40' }}>{stats.avgPoints}</span>
                    </div>
                  )}
                  {stats.maxPoints !== null && (
                    <div className={styles.legendDivider}>
                      <span className={styles.legendLabel}>Лучший результат</span>
                      <span className={styles.legendValue} style={{ color: '#ffaa40' }}>{stats.maxPoints}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* HR: awaiting review */}
        {isHR && !isPersonal && awaitingReview.length > 0 && (
          <div>
            <button
              onClick={() => setReviewExpanded(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-2)', width: '100%',
                padding: 'var(--space-3) var(--space-4)',
                background: 'rgba(255,170,64,0.08)', border: '1px solid rgba(255,170,64,0.25)',
                borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                color: 'var(--color-warning-bright)', fontFamily: 'var(--font-display)', fontSize: 14,
              }}
            >
              <Star size={14} />
              <span style={{ flex: 1, textAlign: 'left' }}>Оценка ({awaitingReview.length})</span>
              {reviewExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {reviewExpanded && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
                {awaitingReview.map(a => (
                  <div key={a.employee_id}>{renderReviewForm(a)}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* HR: already reviewed */}
        {isHR && !isPersonal && alreadyReviewed.length > 0 && (
          <div>
            <button
              onClick={() => setReviewedExpanded(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-2)', width: '100%',
                padding: 'var(--space-3) var(--space-4)',
                background: 'rgba(61,189,106,0.07)', border: '1px solid rgba(61,189,106,0.25)',
                borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                color: 'var(--color-success-bright)', fontFamily: 'var(--font-display)', fontSize: 14,
              }}
            >
              <Star size={14} />
              <span style={{ flex: 1, textAlign: 'left' }}>Проверено ({alreadyReviewed.length})</span>
              {reviewedExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {reviewedExpanded && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
                {alreadyReviewed.map(a => {
                  const inEditMode = editModeJuniors.has(a.employee_id);
                  if (inEditMode) return <div key={a.employee_id}>{renderReviewForm(a)}</div>;

                  const junior = allUsers.find(u => u.id === a.employee_id);
                  const name = junior ? junior.username : `#${a.employee_id}`;
                  return (
                    <div key={a.employee_id} style={{
                      padding: 'var(--space-3) var(--space-4)',
                      background: 'rgba(61,189,106,0.05)', border: '1px solid rgba(61,189,106,0.2)',
                      borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--text-primary)' }}>
                          👤 {name}
                        </p>
                        <Button size="sm" variant="ghost" onClick={() => setEditModeJuniors(prev => new Set([...prev, a.employee_id]))}>
                          Редактировать
                        </Button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Баллы:</span>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--color-success-bright)' }}>
                          {a.awarded_points}{challenge.maxPoints != null ? ` / ${challenge.maxPoints}` : ''}
                        </span>
                      </div>
                      {a.feedback && (
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          💬 {a.feedback}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Junior / HR-personal: editable submission */}
        {(isEmployee || isPersonal) && activeAssignment && isActive && !isSubmitted && (
          <div className={styles.submissionSection}>
            <h3 className={styles.sectionTitle}>Комментарий</h3>
            <textarea
              className={styles.commentArea}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Опишите, что вы сделали..."
              rows={4}
            />

            <h3 className={styles.sectionTitle} style={{ marginTop: 'var(--space-4)' }}>Ссылки</h3>
            <div className={styles.linkInputRow}>
              <input
                className={styles.linkInput}
                type="url"
                value={linkInput}
                onChange={e => setLinkInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addLink()}
                placeholder="https://..."
              />
              <button className={styles.linkAddBtn} onClick={addLink}>
                <Plus size={16} />
              </button>
            </div>
            {links.length > 0 && (
              <div className={styles.linksList}>
                {links.map(url => (
                  <div key={url} className={styles.linkItem}>
                    <Link2 size={13} />
                    <a href={url} target="_blank" rel="noopener noreferrer" className={styles.linkItemUrl}>{url}</a>
                    <button className={styles.linkRemoveBtn} onClick={() => removeLink(url)}>
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.submitActions}>
              <Button variant="secondary" onClick={saveDraft} disabled={saving !== null}>
                {saving === 'draft' ? 'Сохранение...' : 'Сохранить черновик'}
              </Button>
              <Button onClick={submitForReview} disabled={saving !== null}>
                {saving === 'submit' ? 'Отправка...' : 'Отправить на проверку'}
              </Button>
            </div>
          </div>
        )}

        {/* Junior / HR-personal: read-only submitted view */}
        {(isEmployee || isPersonal) && activeAssignment && isActive && isSubmitted && (
          <>
            {activeAssignment.comment && (
              <div className={styles.submissionReadonly}>
                <p className={styles.submissionLabel}>Ваш комментарий</p>
                <p className={styles.submissionText}>{activeAssignment.comment}</p>
              </div>
            )}
            {(activeAssignment.links ?? []).length > 0 && (
              <div className={styles.submissionReadonly}>
                <p className={styles.submissionLabel}>Ссылки</p>
                {(activeAssignment.links ?? []).map(url => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer" className={styles.submissionLink}>
                    <Link2 size={13} />
                    {url}
                  </a>
                ))}
              </div>
            )}
          </>
        )}

        {/* Junior / HR-personal: completed/cancelled read-only */}
        {(isEmployee || isPersonal) && activeAssignment && (isCompleted || isCancelled) && (
          <>
            {activeAssignment.comment && (
              <div className={styles.submissionReadonly}>
                <p className={styles.submissionLabel}>Ваш комментарий</p>
                <p className={styles.submissionText}>{activeAssignment.comment}</p>
              </div>
            )}
            {(activeAssignment.links ?? []).length > 0 && (
              <div className={styles.submissionReadonly}>
                <p className={styles.submissionLabel}>Ссылки</p>
                {(activeAssignment.links ?? []).map(url => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer" className={styles.submissionLink}>
                    <Link2 size={13} />
                    {url}
                  </a>
                ))}
              </div>
            )}
          </>
        )}

        {isEmployee && assignment && isActive && isSubmitted && assignment.feedback == null && assignment.awarded_points == null && (
          <div className={styles.pendingReviewNotice}>
            ✅ Задача отправлена на проверку. Ожидайте обратной связи от HR.
          </div>
        )}

        {isEmployee && assignment && (assignment.feedback || assignment.awarded_points != null) && (
          <div className={styles.hrFeedback}>
            {assignment.awarded_points != null && (
              <div className={styles.hrFeedbackPoints}>
                <Star size={14} />
                <span>Начислено баллов: <strong>{assignment.awarded_points}</strong></span>
              </div>
            )}
            {assignment.feedback && (
              <>
                <p className={styles.submissionLabel} style={{ marginBottom: 4 }}>Обратная связь от HR</p>
                <p className={styles.submissionText}>{assignment.feedback}</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editModal && editForm && (
        <Modal open={true} onClose={() => setEditModal(false)} title="Редактировать задачу" type="dialog">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input label="Название *" value={editForm.title} onChange={e => setEditForm(p => p && ({ ...p, title: e.target.value }))} />
            <Input label="Описание" value={editForm.description} onChange={e => setEditForm(p => p && ({ ...p, description: e.target.value }))} />
            <Input label="Ссылка (URL)" value={editForm.url} onChange={e => setEditForm(p => p && ({ ...p, url: e.target.value }))} />
            <DateInput label="Дата дедлайна" value={editForm.date} onChange={date => setEditForm(p => p && ({ ...p, date }))} />
            <Input label="Максимум баллов" type="number" value={editForm.maxPointsStr} onChange={e => setEditForm(p => p && ({ ...p, maxPointsStr: e.target.value }))} />
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Статус</p>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                {(['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as ChallengeStatus[]).map(s => (
                  <button key={s} onClick={() => setEditForm(p => p && ({ ...p, status: s }))}
                    style={{
                      flex: 1, padding: '6px', borderRadius: 6, border: '1px solid', cursor: 'pointer',
                      fontSize: 11, fontFamily: 'var(--font-display)',
                      borderColor: editForm.status === s ? 'var(--color-primary)' : 'var(--border-subtle)',
                      background: editForm.status === s ? 'rgba(204,0,0,0.15)' : 'transparent',
                      color: editForm.status === s ? 'var(--color-primary-bright)' : 'var(--text-muted)',
                    }}
                  >
                    {({ DRAFT: 'Черновик', ACTIVE: 'Активна', COMPLETED: 'Завершена', CANCELLED: 'Отменена' } as Record<string, string>)[s]}
                  </button>
                ))}
              </div>
            </div>
            <Button full onClick={handleEdit} disabled={updateChallenge.isPending}>
              {updateChallenge.isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </Modal>
      )}

      {/* Assign modal */}
      {assignModal && (
        <Modal open={true} onClose={() => { setAssignModal(false); setSelectedJuniorIds([]); setJuniorSearch(''); }} title={`Назначить: ${challenge.title}`} type="dialog">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input
              placeholder="Поиск участников..."
              value={juniorSearch}
              onChange={e => setJuniorSearch(e.target.value)}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', maxHeight: 280, overflowY: 'auto' }}>
              {juniors
                .filter(j => j.username.toLowerCase().includes(juniorSearch.toLowerCase()))
                .map(j => {
                  const isSelected = selectedJuniorIds.includes(j.id);
                  return (
                    <button key={j.id} onClick={() => toggleJunior(j.id)}
                      style={{
                        padding: '10px 12px', borderRadius: 6, border: '1px solid', textAlign: 'left',
                        cursor: 'pointer',
                        borderColor: isSelected ? 'var(--color-primary)' : 'var(--border-subtle)',
                        background: isSelected ? 'rgba(204,0,0,0.15)' : 'transparent',
                        color: 'var(--text-primary)', fontSize: 13,
                      }}
                    >
                      {isSelected ? '✓ ' : ''}{j.username}
                    </button>
                  );
                })}
              {juniors.filter(j => j.username.toLowerCase().includes(juniorSearch.toLowerCase())).length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  {juniors.length === 0 ? 'Нет доступных участников' : 'Ничего не найдено'}
                </p>
              )}
            </div>
            <Button full onClick={handleAssign} disabled={assignChallengeMut.isPending || unassignChallengeMut.isPending}>
              {assignChallengeMut.isPending ? 'Назначение...' : `Сохранить (${selectedJuniorIds.length})`}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}