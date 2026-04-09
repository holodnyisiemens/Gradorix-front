import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, AlignLeft, CheckCircle } from 'lucide-react';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { useQuiz, useQuizResults, useUsers, useUpdateQuizResult } from '@shared/hooks/useApi';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { QuizResult } from '@shared/types';
import styles from './QuizReviewPage.module.css';

function scoreColor(score: number) {
  if (score >= 70) return 'var(--color-success-bright)';
  if (score >= 40) return 'var(--color-warning-bright)';
  return 'var(--color-danger-bright)';
}

interface ResultRowProps {
  result: QuizResult;
  userName: string;
  questionTexts: string[];
  gradedMask: boolean[];
  onSave: (id: number, score: number, points: number) => Promise<void>;
}

function ResultRow({ result, userName, questionTexts, gradedMask, onSave }: ResultRowProps) {
  const [score, setScore] = useState(result.score);
  const [points, setPoints] = useState(result.pointsEarned);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const hasTextAnswers = (result.answers ?? []).some((a, i) => gradedMask[i] && a);
  const dirty = score !== result.score || points !== result.pointsEarned;

  async function handleSave() {
    setSaving(true);
    await onSave(result.id, score, points);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className={styles.resultCard}>
      {/* Summary row */}
      <div className={styles.resultHeader} onClick={() => hasTextAnswers && setExpanded(v => !v)}>
        <div className={styles.resultUser}>
          <span className={styles.resultAvatar}>
            {userName[0]?.toUpperCase() ?? '?'}
          </span>
          <div>
            <p className={styles.resultName}>{userName}</p>
            <p className={styles.resultDate}>
              {format(new Date(result.completedAt), 'd MMM yyyy', { locale: ru })}
            </p>
          </div>
        </div>

        <div className={styles.resultStats}>
          {/* Editable score */}
          <label className={styles.statField}>
            <span className={styles.statLabel}>Балл %</span>
            <input
              className={styles.statInput}
              type="number"
              min={0} max={100}
              value={score}
              onClick={e => e.stopPropagation()}
              onChange={e => setScore(Math.min(100, Math.max(0, Number(e.target.value))))}
              style={{ color: scoreColor(score) }}
            />
          </label>

          {/* Editable points */}
          <label className={styles.statField}>
            <span className={styles.statLabel}>Баллы</span>
            <input
              className={styles.statInput}
              type="number"
              min={0}
              value={points}
              onClick={e => e.stopPropagation()}
              onChange={e => setPoints(Math.max(0, Number(e.target.value)))}
              style={{ color: 'var(--color-warning-bright)' }}
            />
          </label>

          {dirty && (
            <button
              className={styles.saveBtn}
              onClick={e => { e.stopPropagation(); handleSave(); }}
              disabled={saving}
              title="Сохранить изменения"
            >
              {saved
                ? <CheckCircle size={16} style={{ color: 'var(--color-success-bright)' }} />
                : <Save size={16} />}
            </button>
          )}

          {hasTextAnswers && (
            <span className={[styles.expandIcon, expanded ? styles.expandIconOpen : ''].join(' ')}>
              <AlignLeft size={14} />
            </span>
          )}
        </div>
      </div>

      {/* Text answers */}
      {expanded && hasTextAnswers && (
        <div className={styles.answersSection}>
          {questionTexts.map((qText, idx) => {
            if (!gradedMask[idx]) return null;
            const answer = result.answers?.[idx];
            if (!answer) return null;
            return (
              <div key={idx} className={styles.answerItem}>
                <p className={styles.answerQuestion}>
                  <span className={styles.answerQNum}>{idx + 1}</span>
                  {qText}
                </p>
                <p className={styles.answerText}>{answer}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function QuizReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const quizId = Number(id);

  const { data: quiz, isLoading: quizLoading } = useQuiz(quizId);
  const { data: results = [], isLoading: resultsLoading } = useQuizResults({ quiz_id: quizId });
  const { data: allUsers = [] } = useUsers();
  const updateResult = useUpdateQuizResult();

  if (quizLoading || resultsLoading) return null;
  if (!quiz) return <p style={{ padding: 32, color: 'var(--text-muted)' }}>Тест не найден</p>;

  // Questions that need HR grading
  const gradedMask = quiz.questions.map(q => q.type === 'text' && (q.graded ?? true));
  const hasGradedQuestions = gradedMask.some(Boolean);
  const questionTexts = quiz.questions.map(q => q.text);

  // Stats
  const avgScore = results.length
    ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
    : 0;
  const needsReview = results.filter(r =>
    hasGradedQuestions && (r.answers ?? []).some((a, i) => gradedMask[i] && a)
  ).length;

  async function handleSave(resultId: number, score: number, points: number) {
    await updateResult.mutateAsync({ id: resultId, data: { score, points_earned: points } });
  }

  return (
    <>
      <PageHeader
        title={quiz.title}
        subtitle={`Проверка · ${results.length} ${results.length === 1 ? 'результат' : results.length < 5 ? 'результата' : 'результатов'}`}
        actions={
          <button className={styles.backBtn} onClick={() => navigate('/tests')}>
            <ChevronLeft size={18} />
          </button>
        }
      />

      <div className={styles.page}>
        {/* Summary strip */}
        <div className={styles.summaryRow}>
          <div className={styles.summaryPill}>
            <span className={styles.summaryVal}>{results.length}</span>
            <span className={styles.summaryLabel}>прошли</span>
          </div>
          <div className={styles.summaryPill}>
            <span className={styles.summaryVal} style={{ color: scoreColor(avgScore) }}>{avgScore}%</span>
            <span className={styles.summaryLabel}>средний балл</span>
          </div>
          {hasGradedQuestions && (
            <div className={styles.summaryPill} style={needsReview > 0 ? { borderColor: 'var(--color-warning-bright)' } : {}}>
              <span className={styles.summaryVal} style={{ color: needsReview > 0 ? 'var(--color-warning-bright)' : 'var(--color-success-bright)' }}>
                {needsReview}
              </span>
              <span className={styles.summaryLabel}>ожидают проверки</span>
            </div>
          )}
        </div>

        {/* Questions with graded flag */}
        {hasGradedQuestions && (
          <div className={styles.gradedInfo}>
            <AlignLeft size={13} />
            <span>Открытые вопросы, требующие проверки:</span>
            {quiz.questions.map((q, i) => gradedMask[i] ? (
              <span key={i} className={styles.gradedTag}>#{i + 1} {q.text.slice(0, 40)}{q.text.length > 40 ? '…' : ''}</span>
            ) : null)}
          </div>
        )}

        {/* Results list */}
        {results.length === 0 ? (
          <div className={styles.empty}>Никто ещё не прошёл этот тест</div>
        ) : (
          <div className={styles.list}>
            {results
              .slice()
              .sort((a, b) => b.score - a.score)
              .map(result => {
                const u = allUsers.find(x => x.id === result.userId);
                const name = u ? `${u.firstname ?? ''} ${u.lastname ?? ''}`.trim() || u.username : `Пользователь ${result.userId}`;
                return (
                  <ResultRow
                    key={result.id}
                    result={result}
                    userName={name}
                    questionTexts={questionTexts}
                    gradedMask={gradedMask}
                    onSave={handleSave}
                  />
                );
              })}
          </div>
        )}
      </div>
    </>
  );
}
