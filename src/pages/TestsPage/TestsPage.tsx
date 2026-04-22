import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@modules/auth/store/authStore';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Button } from '@shared/components/ui/Button/Button';
import { useQuizzes, useQuizResults, useDeleteQuiz } from '@shared/hooks/useApi';
import { Clock, Star, Pencil, ClipboardCheck } from 'lucide-react';
import styles from './TestsPage.module.css';

export function TestsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user)!;
  const isHR = user.role === 'HR';
  const { data: quizzes = [], isLoading } = useQuizzes(isHR ? undefined : true);
  const { data: myResults = [] } = useQuizResults({ user_id: user.id });
  const deleteQuiz = useDeleteQuiz();

  return (
    <>
      <PageHeader title="Тесты" showBack subtitle={isLoading ? '...' : `${quizzes.length} доступно`} />
      <div className={styles.page}>
        {isHR && (
          <Button full style={{ marginBottom: 'var(--space-3)' }} onClick={() => navigate('/tests/new')}>
            + Создать тест
          </Button>
        )}
        <div className={styles.grid}>
          {quizzes.map((quiz) => {
            const result = myResults.find((r) => r.quizId === quiz.id);
            return (
              <div key={quiz.id} style={{ position: 'relative' }}>
                <div
                  className={[styles.card, result ? styles.cardCompleted : ''].join(' ')}
                  onClick={() => navigate(`/tests/${quiz.id}`)}
                >
                  <div className={styles.cardTop}>
                    <p className={styles.cardTitle}>{quiz.title}</p>
                    <span className={styles.points}>+{quiz.points}</span>
                  </div>
                  <p className={styles.desc}>{quiz.description}</p>
                  <div className={styles.meta}>
                    <span className={styles.categoryBadge}>{quiz.category}</span>
                    <span className={styles.metaItem}><Clock size={11} />{quiz.durationMin} мин</span>
                    <span className={styles.metaItem}><Star size={11} />{quiz.questions.length} вопр.</span>
                    {result && <span className={styles.resultBadge}>✓ {result.score}%</span>}
                    {isHR && !quiz.available && (
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>скрыт</span>
                    )}
                  </div>
                </div>

                {isHR && (
                  <div className={styles.hrActions}>
                    <button
                      className={styles.reviewBtn}
                      onClick={(e) => { e.stopPropagation(); navigate(`/tests/${quiz.id}/review`); }}
                      title="Проверить результаты"
                    >
                      <ClipboardCheck size={13} />
                    </button>
                    <button
                      className={styles.editBtn}
                      onClick={(e) => { e.stopPropagation(); navigate(`/tests/${quiz.id}/edit`); }}
                      title="Редактировать"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => { e.stopPropagation(); deleteQuiz.mutate(quiz.id); }}
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
