import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@modules/auth/store/authStore';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Button } from '@shared/components/ui/Button/Button';
import { useSurveys, useSurveyResults, useDeleteSurvey } from '@shared/hooks/useApi';
import { Clock, BarChart3, Pencil, FileText } from 'lucide-react';
import styles from './SurveysPage.module.css';

export function SurveysPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user)!;
  const isHR = user.role === 'HR';
  const { data: surveys = [], isLoading } = useSurveys(isHR ? undefined : true);
  const { data: myResults = [], isLoading: resultsLoading } = useSurveyResults({ user_id: user.id });
  const deleteSurvey = useDeleteSurvey();

  const completedIds = new Set(myResults.map((r) => r.surveyId));
  const visibleSurveys = isHR
    ? surveys
    : surveys.filter((s) => !completedIds.has(s.id));

  return (
    <>
      <PageHeader title="Опросы" showBack subtitle={isLoading || resultsLoading ? '...' : `${visibleSurveys.length} доступно`} />
      <div className={styles.page}>
        {isHR && (
          <Button full style={{ marginBottom: 'var(--space-3)' }} onClick={() => navigate('/surveys/new')}>
            + Создать опрос
          </Button>
        )}
        {/* {!isHR && !isLoading && !resultsLoading && visibleSurveys.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: 'var(--space-8) var(--space-4)', gap: 'var(--space-3)', textAlign: 'center',
          }}>
            <span style={{ fontSize: 48 }}>📋</span>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Скоро здесь появятся опросы</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 260, lineHeight: 1.6 }}>
              HR подготовит опросы — как только они будут готовы, вы сразу их увидите здесь
            </p>
          </div>
        )} */}
        <div className={styles.grid}>
          {visibleSurveys.map((survey) => {
            const result = myResults.find((r) => r.surveyId === survey.id);
            const isCompleted = !isHR && completedIds.has(survey.id);
            return (
              <div key={survey.id} style={{ position: 'relative' }}>
                <div
                  className={[styles.card, result ? styles.cardCompleted : ''].join(' ')}
                  onClick={() => { if (!isHR && !isCompleted) navigate(`/surveys/${survey.id}`); }}
                  style={isCompleted ? { cursor: 'default', opacity: 0.85 } : undefined}
                >
                  <div className={styles.cardTop}>
                    <p className={styles.cardTitle}>{survey.title}</p>
                  </div>
                  <p className={styles.desc}>{survey.description}</p>
                  <div className={styles.meta}>
                    <span className={styles.categoryBadge}>{survey.category}</span>
                    <span className={styles.metaItem}><Clock size={11} />{survey.durationMin} мин</span>
                    <span className={styles.metaItem}><FileText size={11} />{survey.questions.length} вопр.</span>
                    {result && <span className={styles.resultBadge}>✓ Пройден</span>}
                    {isHR && !survey.available && (
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>скрыт</span>
                    )}
                  </div>
                </div>

                {isHR && (
                  <div className={styles.hrActions}>
                    <button
                      className={styles.reviewBtn}
                      onClick={(e) => { e.stopPropagation(); navigate(`/surveys/${survey.id}/results`); }}
                      title="Просмотреть результаты"
                    >
                      <BarChart3 size={13} />
                    </button>
                    <button
                      className={styles.editBtn}
                      onClick={(e) => { e.stopPropagation(); navigate(`/surveys/${survey.id}/edit`); }}
                      title="Редактировать"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => { e.stopPropagation(); deleteSurvey.mutate(survey.id); }}
                      title="Удалить"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
