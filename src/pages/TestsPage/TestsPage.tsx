import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@modules/auth/store/authStore';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { MOCK_QUIZZES, getQuizResultsForUser } from '@shared/api/mockData';
import { Clock, Star } from 'lucide-react';
import styles from './TestsPage.module.css';

export function TestsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user)!;
  const myResults = getQuizResultsForUser(user.id);

  return (
    <>
      <PageHeader title="Тесты" subtitle={`${MOCK_QUIZZES.length} доступно`} />
      <div className={styles.page}>
        <div className={styles.grid}>
          {MOCK_QUIZZES.map((quiz) => {
            const result = myResults.find((r) => r.quizId === quiz.id);
            return (
              <div
                key={quiz.id}
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
                  {result && (
                    <span className={styles.resultBadge}>✓ {result.score}%</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
