import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { useSurvey, useSurveyResults, useSurveyStatistics } from '@shared/hooks/useApi';
import { useUsers } from '@shared/hooks/useApi';
import styles from './SurveyResultsPage.module.css';

export function SurveyResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const surveyId = Number(id);

  const { data: survey, isLoading: surveyLoading } = useSurvey(surveyId);
  const { data: results = [], isLoading: resultsLoading } = useSurveyResults({ quiz_id: surveyId });
  const { data: allUsers = [] } = useUsers();
  const { data: statistics, isLoading: statsLoading } = useSurveyStatistics(surveyId);

  if (surveyLoading || resultsLoading || statsLoading) return null;
  if (!survey) return <p style={{ padding: 32, color: 'var(--text-muted)' }}>Опрос не найден</p>;

  const completionRate = statistics ? Math.round((statistics.total_responses / (allUsers.length || 1)) * 100) : 0;
  const questionTexts = survey.questions.map(q => q.text);

  const getUserName = (userId: number) => {
    const u = allUsers.find(x => x.id === userId);
    return u ? u.username : `Пользователь ${userId}`;
  };

  return (
    <>
      <PageHeader
        title={survey.title}
        subtitle={`Результаты · ${results.length} ${results.length === 1 ? 'ответ' : results.length < 5 ? 'ответа' : 'ответов'}`}
        actions={
          <button className={styles.backBtn} onClick={() => navigate('/surveys')}>
            <ChevronLeft size={18} />
          </button>
        }
      />

      <div className={styles.page}>
        {/* Summary strip */}
        <div className={styles.summaryRow}>
          <div className={styles.summaryPill}>
            <span style={{ fontSize: 20 }}>👥</span>
            <div>
              <span className={styles.summaryValue}>{results.length}</span>
              <span className={styles.summaryLabel}>Ответов</span>
            </div>
          </div>
          {/* <div className={styles.summaryPill}>
            <span style={{ fontSize: 20 }}>📊</span>
            <div>
              <span className={styles.summaryValue}>{completionRate}%</span>
              <span className={styles.summaryLabel}>Заполнено</span>
            </div>
          </div> */}
        </div>

        {/* Results list */}
        {results.length === 0 ? (
          <div className={styles.empty}>Никто ещё не ответил на этот опрос</div>
        ) : (
          <div className={styles.list}>
            {results
              .slice()
              .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
              .map((result) => {
                const userName = getUserName(result.userId);
                const completedDate = new Date(result.completedAt);
                const dateStr = completedDate.toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  year: completedDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div key={result.id} className={styles.resultCard}>
                    <div className={styles.resultHeader}>
                      <div className={styles.resultUser}>
                        <span className={styles.resultAvatar}>
                          {userName[0]?.toUpperCase() ?? '?'}
                        </span>
                        <div>
                          <p className={styles.resultName}>{userName}</p>
                          <p className={styles.resultDate}>{dateStr}</p>
                        </div>
                      </div>
                    </div>

                    {/* Answers section */}
                    {(result.answers ?? []).some((a) => a) && (
                      <div className={styles.answersSection}>
                        {questionTexts.map((qText, idx) => {
                          const answer = result.answers?.[idx];
                          if (!answer) return null;
                          return (
                            <div key={idx} className={styles.answerItem}>
                              <span className={styles.answerQuestion}>
                                {idx + 1}. {qText}
                              </span>
                              <p className={styles.answerText}>{answer}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </>
  );
}
