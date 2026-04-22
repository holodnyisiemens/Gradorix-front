import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ExternalLink, Calendar, Star, Link2, Plus, X, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useChallenge, useChallengeJuniors, useUsers, useUpdateChallengeProgress, useUpdateChallengeJunior, useCreateNotification } from '@shared/hooks/useApi';
import { ChallengeStatusBadge, ProgressBadge } from '@shared/components/ui/Badge/Badge';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Card } from '@shared/components/ui/Card/Card';
import { Button } from '@shared/components/ui/Button/Button';
import styles from './ChallengePage.module.css';

export function ChallengePage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user)!;
  const isJunior = user.role === 'JUNIOR';

  const { data: challenge, isLoading } = useChallenge(Number(id));
  const { data: assignments = [] } = useChallengeJuniors(
    isJunior ? { junior_id: user.id } : undefined
  );
  const updateProgress = useUpdateChallengeProgress();
  const updateJunior = useUpdateChallengeJunior();
  const createNotification = useCreateNotification();
  const { data: allUsers = [] } = useUsers();

  const assignment = isJunior
    ? assignments.find((cj) => cj.challenge_id === Number(id) && cj.junior_id === user.id)
    : null;

  const [comment, setComment] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [saving, setSaving] = useState<'draft' | 'submit' | null>(null);

  // Sync state from assignment when loaded
  useEffect(() => {
    if (assignment) {
      setComment(assignment.comment ?? '');
      setLinks(assignment.links ?? []);
    }
  }, [assignment?.challenge_id, assignment?.junior_id]);

  // Auto-set SKIPPED when challenge is COMPLETED and progress is GOING/IN_PROGRESS
  useEffect(() => {
    if (
      challenge?.status === 'COMPLETED' &&
      assignment &&
      (assignment.progress === 'GOING' || assignment.progress === 'IN_PROGRESS')
    ) {
      updateProgress.mutate({ challengeId: challenge.id, juniorId: user.id, progress: 'SKIPPED' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge?.status, assignment?.progress]);

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

  const isUpcoming  = challenge.status === 'UPCOMING';
  const isActive    = challenge.status === 'ACTIVE';
  const isCompleted = challenge.status === 'COMPLETED';
  const isCancelled = challenge.status === 'CANCELLED';
  const isReadOnly  = !isActive;

  const currentProgress = assignment?.progress;
  const isSubmitted = currentProgress === 'DONE';

  function addLink() {
    const trimmed = linkInput.trim();
    if (!trimmed || links.includes(trimmed)) return;
    setLinks(prev => [...prev, trimmed]);
    setLinkInput('');
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
    if (!assignment) return;
    const finalLinks = getFinalLinks();
    if (linkInput.trim()) { setLinks(finalLinks); setLinkInput(''); }
    setSaving('draft');
    await updateJunior.mutateAsync({
      challengeId: challenge!.id,
      juniorId: user.id,
      data: {
        comment: comment || undefined,
        links: finalLinks.length ? finalLinks : undefined,
        progress: 'IN_PROGRESS',
      },
    });
    setSaving(null);
  }

  async function submitForReview() {
    if (!assignment) return;
    const finalLinks = getFinalLinks();
    if (linkInput.trim()) { setLinks(finalLinks); setLinkInput(''); }
    setSaving('submit');
    await updateJunior.mutateAsync({
      challengeId: challenge!.id,
      juniorId: user.id,
      data: {
        comment: comment || undefined,
        links: finalLinks.length ? finalLinks : undefined,
        progress: 'DONE',
      },
    });
    // Notify all HR users
    const juniorName = [user.firstname, user.lastname].filter(Boolean).join(' ') || user.username;
    const hrUsers = allUsers.filter(u => u.role === 'HR');
    await Promise.all(hrUsers.map(hr =>
      createNotification.mutateAsync({
        user_id: hr.id,
        message: `📋 Участник ${juniorName} отправил задачу «${challenge!.title}» на проверку||/points`,
      })
    ));
    setSaving(null);
  }

  return (
    <>
      <PageHeader title={challenge.title} showBack />
      <div className={styles.page}>
        <div className={styles.header}>
          <ChallengeStatusBadge status={challenge.status} />
          {assignment && <ProgressBadge progress={currentProgress ?? assignment.progress} />}
          {challenge.maxPoints != null && challenge.maxPoints > 0 && (
            <span className={[styles.maxPointsBadge, isJunior && assignment?.awarded_points != null ? styles.maxPointsBadgeAwarded : ''].join(' ')}>
              <Star size={13} />
              {isJunior && assignment?.awarded_points != null
                ? `${assignment.awarded_points} из ${challenge.maxPoints} баллов`
                : `до ${challenge.maxPoints} баллов`}
            </span>
          )}
        </div>

        {/* UPCOMING: locked notice */}
        {isJunior && isUpcoming && (
          <div className={styles.lockedNotice}>
            <Lock size={16} />
            <span>Задача ещё не началась. Вы сможете приступить, когда HR активирует её.</span>
          </div>
        )}

        {/* CANCELLED notice */}
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
          <a className={styles.link} href={challenge.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={16} />
            Открыть материал
          </a>
        )}

        {/* Editable comment & links — for junior on ACTIVE challenge, not yet submitted */}
        {isJunior && assignment && isActive && !isSubmitted && (
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
              <Button
                variant="secondary"
                onClick={saveDraft}
                disabled={saving !== null}
              >
                {saving === 'draft' ? 'Сохранение...' : 'Сохранить черновик'}
              </Button>
              <Button
                onClick={submitForReview}
                disabled={saving !== null}
              >
                {saving === 'submit' ? 'Отправка...' : 'Отправить на проверку'}
              </Button>
            </div>
          </div>
        )}

        {/* Read-only submitted view — junior already sent for review */}
        {isJunior && assignment && isActive && isSubmitted && (
          <>
            {assignment.comment && (
              <div className={styles.submissionReadonly}>
                <p className={styles.submissionLabel}>Ваш комментарий</p>
                <p className={styles.submissionText}>{assignment.comment}</p>
              </div>
            )}
            {(assignment.links ?? []).length > 0 && (
              <div className={styles.submissionReadonly}>
                <p className={styles.submissionLabel}>Ссылки</p>
                {(assignment.links ?? []).map(url => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer" className={styles.submissionLink}>
                    <Link2 size={13} />
                    {url}
                  </a>
                ))}
              </div>
            )}
          </>
        )}

        {/* Read-only comment & links display when COMPLETED/CANCELLED */}
        {isJunior && assignment && (isCompleted || isCancelled) && (
          <>
            {assignment.comment && (
              <div className={styles.submissionReadonly}>
                <p className={styles.submissionLabel}>Ваш комментарий</p>
                <p className={styles.submissionText}>{assignment.comment}</p>
              </div>
            )}
            {(assignment.links ?? []).length > 0 && (
              <div className={styles.submissionReadonly}>
                <p className={styles.submissionLabel}>Ссылки</p>
                {(assignment.links ?? []).map(url => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer" className={styles.submissionLink}>
                    <Link2 size={13} />
                    {url}
                  </a>
                ))}
              </div>
            )}
          </>
        )}

        {/* "Submitted, waiting for HR review" notice */}
        {isJunior && assignment && isActive && isSubmitted && assignment.feedback == null && assignment.awarded_points == null && (
          <div className={styles.pendingReviewNotice}>
            ✅ Задача отправлена на проверку. Ожидайте обратной связи от HR.
          </div>
        )}

        {/* HR feedback & awarded points (visible to junior) */}
        {isJunior && assignment && (assignment.feedback || assignment.awarded_points != null) && (
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

        {/* HR/Mentor: read-only status */}
        {!isJunior && isReadOnly && (
          <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', padding: 'var(--space-4) 0' }}>
            Статус: <strong style={{ color: 'var(--text-primary)' }}>{challenge.status}</strong>
          </div>
        )}
      </div>
    </>
  );
}
