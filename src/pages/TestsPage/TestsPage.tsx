import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@modules/auth/store/authStore';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Button } from '@shared/components/ui/Button/Button';
import { Input } from '@shared/components/ui/Input/Input';
import { Modal } from '@shared/components/ui/Modal/Modal';
import { useQuizzes, useQuizResults, useCreateQuiz, useDeleteQuiz } from '@shared/hooks/useApi';
import { Clock, Star } from 'lucide-react';
import styles from './TestsPage.module.css';

export function TestsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user)!;
  const isHR = user.role === 'HR';
  const { data: quizzes = [], isLoading } = useQuizzes(isHR ? undefined : true);
  const { data: myResults = [] } = useQuizResults({ user_id: user.id });
  const createQuiz = useCreateQuiz();
  const deleteQuiz = useDeleteQuiz();

  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: '', duration_min: 20, points: 50, available: true });

  async function handleCreate() {
    if (!form.title) return;
    await createQuiz.mutateAsync({
      title: form.title,
      description: form.description,
      category: form.category || 'general',
      duration_min: form.duration_min,
      points: form.points,
      available: form.available,
      questions: [],
    });
    setCreateModal(false);
    setForm({ title: '', description: '', category: '', duration_min: 20, points: 50, available: true });
  }

  return (
    <>
      <PageHeader title="Тесты" subtitle={isLoading ? '...' : `${quizzes.length} доступно`} />
      <div className={styles.page}>
        {isHR && (
          <Button full style={{ marginBottom: 'var(--space-3)' }} onClick={() => setCreateModal(true)}>
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
                    {!quiz.available && <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>скрыт</span>}
                  </div>
                </div>
                {isHR && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteQuiz.mutate(quiz.id); }}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(204,0,0,0.8)', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', fontSize: 11, padding: '2px 6px' }}
                  >✕</button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {createModal && (
        <Modal open={true} onClose={() => setCreateModal(false)} title="Создать тест" type="dialog">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input label="Название *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            <Input label="Описание" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            <Input label="Категория" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="general" />
            <Input label="Длительность (мин)" type="number" value={String(form.duration_min)} onChange={e => setForm(p => ({ ...p, duration_min: Number(e.target.value) }))} />
            <Input label="Баллы за прохождение" type="number" value={String(form.points)} onChange={e => setForm(p => ({ ...p, points: Number(e.target.value) }))} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <button onClick={() => setForm(p => ({ ...p, available: !p.available }))}
                style={{ width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', background: form.available ? 'var(--color-primary)' : 'var(--border-subtle)', transition: 'background 0.2s' }}
              />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{form.available ? 'Доступен участникам' : 'Скрыт'}</span>
            </div>
            <Button full onClick={handleCreate} disabled={createQuiz.isPending}>
              {createQuiz.isPending ? 'Создание...' : 'Создать тест'}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
