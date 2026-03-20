import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { MOCK_KB_SECTIONS, MOCK_KB_ARTICLES } from '@shared/api/mockData';
import styles from './KnowledgePage.module.css';

export function KnowledgePage() {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader title="База знаний" subtitle="Материалы программы HiPo" />
      <div className={styles.page}>
        <div className={styles.grid}>
          {MOCK_KB_SECTIONS.map((section) => {
            const count = MOCK_KB_ARTICLES.filter((a) => a.sectionId === section.id).length;
            return (
              <button
                key={section.id}
                className={styles.section}
                onClick={() => navigate(`/knowledge/${section.id}`)}
              >
                <span className={styles.icon}>{section.icon}</span>
                <p className={styles.title}>{section.title}</p>
                <p className={styles.desc}>{section.description}</p>
                <p className={styles.count}>{count} {count === 1 ? 'статья' : count < 5 ? 'статьи' : 'статей'}</p>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
