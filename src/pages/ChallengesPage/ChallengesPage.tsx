import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@modules/auth/store/authStore';
import { getChallengesForJunior, MOCK_CHALLENGES } from '@shared/api/mockData';
import { ChallengeCard } from '@modules/challenges/components/ChallengeCard';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import type { ChallengeStatus, ChallengeJuniorProgress } from '@shared/types';
import styles from './ChallengesPage.module.css';

type Filter = 'all' | ChallengeStatus | ChallengeJuniorProgress;

const JUNIOR_FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',         label: 'Все' },
  { key: 'IN_PROGRESS', label: 'В процессе' },
  { key: 'GOING',       label: 'Не начаты' },
  { key: 'DONE',        label: 'Выполнены' },
  { key: 'SKIPPED',     label: 'Пропущены' },
];

const HR_MENTOR_FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',       label: 'Все' },
  { key: 'ACTIVE',    label: 'Активные' },
  { key: 'UPCOMING',  label: 'Скоро' },
  { key: 'COMPLETED', label: 'Завершены' },
  { key: 'DRAFT',     label: 'Черновики' },
];

export function ChallengesPage() {
  const user = useAuthStore((s) => s.user)!;
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');

  const isJunior = user.role === 'JUNIOR';
  const filters = isJunior ? JUNIOR_FILTERS : HR_MENTOR_FILTERS;

  const allChallenges = isJunior
    ? getChallengesForJunior(user.id)
    : MOCK_CHALLENGES;

  const filtered = filter === 'all'
    ? allChallenges
    : allChallenges.filter((c) => {
        if (isJunior && 'progress' in c) return c.progress === filter;
        return c.status === filter;
      });

  const title = isJunior ? 'Мои задачи' : 'Задачи';
  const subtitle = `${filtered.length} из ${allChallenges.length}`;

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <div className={styles.page}>
        {/* Filters */}
        <div className={styles.filters}>
          {filters.map((f) => (
            <button
              key={f.key}
              className={[styles.filterBtn, filter === f.key ? styles.active : ''].join(' ')}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className={styles.empty}>Ничего не найдено</div>
        ) : (
          <div className={styles.list}>
            {filtered.map((c) => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                showProgress={isJunior}
                onClick={() => navigate(`/challenges/${c.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
