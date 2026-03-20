import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MOCK_QUIZZES, getQuizResultsForUser } from '@shared/api/mockData';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Button } from '@shared/components/ui/Button/Button';
import { useAuthStore } from '@modules/auth/store/authStore';
import styles from './TestPage.module.css';

type Phase = 'intro' | 'quiz' | 'result';

export function TestPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user)!;
  const quiz = MOCK_QUIZZES.find((q) => q.id === Number(id));
  const prevResult = getQuizResultsForUser(user.id).find((r) => r.quizId === Number(id));

  const [phase, setPhase] = useState<Phase>('intro');
  const [step, setStep] = useState(0);
  // selected answers: Set of option indices (or string for text)
  const [answers, setAnswers] = useState<(number[] | string)[]>([]);
  const [finalScore, setFinalScore] = useState(0);
  const [pointsEarned, setPointsEarned] = useState(0);

  if (!quiz) return <div style={{ padding: 32, color: 'var(--text-muted)' }}>Тест не найден</div>;

  const question = quiz.questions[step];
  const currentAnswer = answers[step];

  function toggleOption(idx: number) {
    const cur = (currentAnswer as number[] | undefined) ?? [];
    let next: number[];
    if (question.type === 'single') {
      next = [idx];
    } else {
      next = cur.includes(idx) ? cur.filter((i) => i !== idx) : [...cur, idx];
    }
    const updated = [...answers];
    updated[step] = next;
    setAnswers(updated);
  }

  function setTextAnswer(val: string) {
    const updated = [...answers];
    updated[step] = val;
    setAnswers(updated);
  }

  function handleNext() {
    if (step < quiz.questions.length - 1) {
      setStep((s) => s + 1);
    } else {
      // Calculate score
      let correct = 0;
      quiz.questions.forEach((q, i) => {
        const ans = answers[i];
        if (q.type === 'text') {
          // Text answers auto-score 50% (reviewed by mentor in real system)
          if (typeof ans === 'string' && ans.trim().length > 10) correct += 0.5;
        } else if (Array.isArray(ans) && q.correctAnswers) {
          const expected = [...q.correctAnswers].sort().join(',');
          const given = [...ans].sort().join(',');
          if (expected === given) correct += 1;
        }
      });
      const score = Math.round((correct / quiz.questions.length) * 100);
      const earned = Math.round((score / 100) * quiz.points);
      setFinalScore(score);
      setPointsEarned(earned);
      setPhase('result');
    }
  }

  const canProceed = () => {
    if (question.type === 'text') return typeof currentAnswer === 'string' && (currentAnswer as string).trim().length > 0;
    return Array.isArray(currentAnswer) && (currentAnswer as number[]).length > 0;
  };

  function resultEmoji(score: number) {
    if (score >= 90) return '🏆';
    if (score >= 70) return '⚡';
    if (score >= 50) return '🌱';
    return '🔄';
  }

  function resultTitle(score: number) {
    if (score >= 90) return 'Отлично!';
    if (score >= 70) return 'Хорошо!';
    if (score >= 50) return 'Неплохо';
    return 'Есть куда расти';
  }

  if (phase === 'intro') {
    return (
      <>
        <PageHeader title={quiz.title} subtitle={quiz.category} />
        <div className={styles.page}>
          <div className={styles.results}>
            <div className={styles.resultHero}>
              <div className={styles.resultEmoji}>🧪</div>
              <p className={styles.resultTitle}>{quiz.title}</p>
              <p className={styles.resultMeta}>{quiz.description}</p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 16 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>⏱ {quiz.durationMin} мин</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>❓ {quiz.questions.length} вопросов</span>
                <span style={{ fontSize: 12, color: 'var(--color-warning-bright)' }}>⭐ +{quiz.points} баллов</span>
              </div>
            </div>
            {prevResult && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', textAlign: 'center' }}>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Предыдущий результат</p>
                <p style={{ fontSize: 'var(--text-xl)', fontFamily: 'var(--font-display)', color: 'var(--color-success-bright)' }}>{prevResult.score}%</p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning-bright)' }}>+{prevResult.pointsEarned} баллов заработано</p>
              </div>
            )}
            <Button full onClick={() => { setAnswers([]); setStep(0); setPhase('quiz'); }}>
              {prevResult ? 'Пройти ещё раз' : 'Начать тест'}
            </Button>
            <Button full variant="ghost" onClick={() => navigate('/tests')}>Назад</Button>
          </div>
        </div>
      </>
    );
  }

  if (phase === 'result') {
    return (
      <>
        <PageHeader title="Результат" />
        <div className={styles.page}>
          <div className={styles.results}>
            <div className={styles.resultHero}>
              <div className={styles.resultEmoji}>{resultEmoji(finalScore)}</div>
              <p className={styles.resultTitle}>{resultTitle(finalScore)}</p>
              <p className={styles.resultScore}>{finalScore}%</p>
              <p className={styles.resultPoints}>+{pointsEarned} баллов начислено</p>
              <p className={styles.resultMeta}>
                {quiz.questions.filter((q) => q.type === 'text').length > 0
                  ? 'Открытые вопросы будут проверены ментором'
                  : `Правильных ответов: ${Math.round(finalScore / 100 * quiz.questions.length)} из ${quiz.questions.length}`}
              </p>
            </div>
            <Button full onClick={() => navigate('/tests')}>К списку тестов</Button>
            <Button full variant="ghost" onClick={() => navigate('/leaderboard')}>Посмотреть рейтинг</Button>
          </div>
        </div>
      </>
    );
  }

  // Quiz phase
  const progress = ((step) / quiz.questions.length) * 100;

  return (
    <>
      <PageHeader title={quiz.title} subtitle={`Вопрос ${step + 1} из ${quiz.questions.length}`} />
      <div className={styles.page}>
        <div className={styles.progress}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>

        <p className={styles.questionText}>{question.text}</p>

        {question.type === 'text' ? (
          <>
            <p className={styles.hint}>Напишите развёрнутый ответ (будет проверен ментором)</p>
            <textarea
              className={styles.textAnswer}
              value={typeof currentAnswer === 'string' ? currentAnswer : ''}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder="Ваш ответ..."
            />
          </>
        ) : (
          <>
            {question.type === 'multiple' && (
              <p className={styles.hint}>Можно выбрать несколько вариантов</p>
            )}
            <div className={styles.options}>
              {question.options?.map((opt, idx) => {
                const selected = Array.isArray(currentAnswer) && (currentAnswer as number[]).includes(idx);
                return (
                  <button
                    key={idx}
                    className={[styles.option, selected ? styles.optionSelected : ''].join(' ')}
                    onClick={() => toggleOption(idx)}
                  >
                    <div className={styles.optionCircle} />
                    {opt}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className={styles.actions}>
          {step > 0 && (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>Назад</Button>
          )}
          <Button full onClick={handleNext} disabled={!canProceed()}>
            {step < quiz.questions.length - 1 ? 'Далее' : 'Завершить тест'}
          </Button>
        </div>
      </div>
    </>
  );
}
