import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import axios from 'axios';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Button } from '@shared/components/ui/Button/Button';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useSurvey, useSurveyResults, useSubmitSurveyResult } from '@shared/hooks/useApi';
import styles from './SurveyPage.module.css';

type Phase = 'intro' | 'survey' | 'completion';

export function SurveyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user)!;
  const surveyId = Number(id);
  const { data: survey, isLoading: surveyLoading, isError: surveyError, error: surveyErrorData } = useSurvey(surveyId);
  const { data: allResults = [], isLoading: resultsLoading } = useSurveyResults({ user_id: user.id });
  const submitResult = useSubmitSurveyResult();

  const prevResult = allResults.find((r) => r.surveyId === surveyId);
  const isEmployee = user.role === 'EMPLOYEE';
  const isCompletedConflict =
    surveyError &&
    axios.isAxiosError(surveyErrorData) &&
    surveyErrorData.response?.status === 409;
  const alreadyCompleted = isEmployee && (!!prevResult || isCompletedConflict);

  const [phase, setPhase] = useState<Phase>('intro');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number[] | string)[]>([]);

  if (surveyLoading || resultsLoading) return null;
  if (!survey && !alreadyCompleted) {
    return <div style={{ padding: 32, color: 'var(--text-muted)' }}>Опрос не найден</div>;
  }

  if (alreadyCompleted && !survey) {
    return (
      <>
        <PageHeader title="Опрос" showBack />
        <div className={styles.page}>
          <div className={styles.results}>
            <div className={styles.resultHero}>
              <div className={styles.resultEmoji}>✓</div>
              <p className={styles.resultTitle}>Опрос завершён</p>
              <p className={styles.resultMeta}>Вы уже прошли этот опрос. Повторное прохождение недоступно.</p>
            </div>
            <Button full onClick={() => navigate('/surveys')}>К списку опросов</Button>
          </div>
        </div>
      </>
    );
  }

  const question = survey!.questions[step];
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

  function formatAnswer(q: typeof question, value: number[] | string | undefined) {
    if (q.type === 'text') {
      return typeof value === 'string' ? value : '';
    }
    if (!Array.isArray(value)) return '';
    const selected = value.map((idx) => q.options?.[idx]).filter(Boolean);
    return selected.join(', ');
  }

  function handleNext() {
    if (alreadyCompleted) return;
    if (step < survey!.questions.length - 1) {
      setStep((s) => s + 1);
    } else {
      const allAnswers = survey!.questions.map((q, i) => formatAnswer(q, answers[i]));
      submitResult.mutate({
        quiz_id: survey!.id,
        completed_at: new Date().toISOString(),
        answers: allAnswers,
      });
      setPhase('completion');
    }
  }

  const canProceed = () => {
    if (question.type === 'text') return typeof currentAnswer === 'string' && (currentAnswer as string).trim().length > 0;
    return Array.isArray(currentAnswer) && (currentAnswer as number[]).length > 0;
  };

  if (phase === 'intro' || (phase === 'survey' && alreadyCompleted)) {
    return (
      <>
        <PageHeader title={survey!.title} showBack subtitle={survey!.category} />
        <div className={styles.page}>
          <div className={styles.results}>
            <div className={styles.resultHero}>
              <div className={styles.resultEmoji}>{alreadyCompleted ? '✓' : '📋'}</div>
              <p className={styles.resultTitle}>{alreadyCompleted ? 'Опрос завершён' : 'Опрос'}</p>
              <p className={styles.resultMeta}>
                {alreadyCompleted
                  ? 'Вы уже прошли этот опрос. Повторное прохождение недоступно.'
                  : survey!.description}
              </p>
              {!alreadyCompleted && (
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 16 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>⏱ {survey!.durationMin} мин</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>❓ {survey!.questions.length} вопросов</span>
                </div>
              )}
            </div>
            {!alreadyCompleted && (
              <Button full onClick={() => { setPhase('survey'); setStep(0); setAnswers([]); }}>
                Начать опрос
              </Button>
            )}
            <Button full variant={alreadyCompleted ? undefined : 'ghost'} onClick={() => navigate('/surveys')}>
              {alreadyCompleted ? 'К списку опросов' : 'Назад'}
            </Button>
          </div>
        </div>
      </>
    );
  }

  if (phase === 'completion') {
    return (
      <>
        <PageHeader title="Спасибо" showBack />
        <div className={styles.page}>
          <div className={styles.results}>
            <div className={styles.resultHero}>
              <div className={styles.resultEmoji}>✓</div>
              <p className={styles.resultTitle}>Опрос завершен</p>
              <p className={styles.resultMeta}>Ваши ответы зарегистрированы</p>
            </div>
            <Button full onClick={() => navigate('/surveys')}>К списку опросов</Button>
          </div>
        </div>
      </>
    );
  }

  const progress = ((step) / survey!.questions.length) * 100;

  return (
    <>
      <PageHeader
        title={survey!.title}
        showBack
        subtitle={`Вопрос ${step + 1} из ${survey!.questions.length}`}
      />
      <div className={styles.page}>
        <div className={styles.progress}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>

        <p className={styles.questionText}>{question.text}</p>

        {question.type === 'text' ? (
          <>
            <p className={styles.hint}>Напишите развёрнутый ответ</p>
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
              {question.options?.map((opt, idx) => (
                <button
                  key={idx}
                  className={[
                    styles.option,
                    Array.isArray(currentAnswer) && currentAnswer.includes(idx) ? styles.optionSelected : '',
                  ].join(' ')}
                  onClick={() => toggleOption(idx)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </>
        )}

        <div className={styles.actions}>
          {step > 0 && (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
              <ChevronLeft size={16} /> Назад
            </Button>
          )}
          <Button
            full
            onClick={handleNext}
            disabled={!canProceed()}
          >
            {step < survey!.questions.length - 1 ? 'Далее' : 'Завершить опрос'}
          </Button>
        </div>
      </div>
    </>
  );
}
