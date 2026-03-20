import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Button } from '@shared/components/ui/Button/Button';
import { MOCK_KB_SECTIONS, getKBArticlesBySection } from '@shared/api/mockData';
import { useAuthStore } from '@modules/auth/store/authStore';
import type { KBArticle } from '@shared/types';
import styles from './KnowledgeSectionPage.module.css';

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('## ')) return <h2 key={i}>{line.slice(3)}</h2>;
    if (line.startsWith('### ')) return <h3 key={i}>{line.slice(4)}</h3>;
    if (line.startsWith('```')) return null;
    return <span key={i}>{line}<br /></span>;
  }).filter(Boolean) as React.ReactNode[];
}

export function KnowledgeSectionPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user)!;
  const isHR = user.role === 'HR';

  const section = MOCK_KB_SECTIONS.find((s) => s.id === Number(sectionId));
  const articles = getKBArticlesBySection(Number(sectionId));
  const [selected, setSelected] = useState<KBArticle | null>(null);

  if (!section) return null;

  if (selected) {
    return (
      <>
        <PageHeader title={selected.title} subtitle={`${section.icon} ${section.title}`} />
        <div className={styles.page}>
          <div className={styles.articleView}>
            <div className={styles.articleContent}>
              {renderMarkdown(selected.content)}
            </div>
            {isHR && (
              <div className={styles.hrActions}>
                <Button variant="secondary" size="sm">Редактировать</Button>
                <Button variant="danger" size="sm">Удалить</Button>
              </div>
            )}
            <Button variant="ghost" onClick={() => setSelected(null)}>← Назад к разделу</Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={section.title} subtitle={`${articles.length} материалов`} />
      <div className={styles.page}>
        {isHR && (
          <Button full style={{ marginBottom: 'var(--space-3)' }}>+ Создать запись</Button>
        )}
        <div className={styles.list}>
          {articles.map((article) => (
            <button
              key={article.id}
              className={styles.article}
              onClick={() => setSelected(article)}
            >
              <p className={styles.articleTitle}>{article.title}</p>
              <p className={styles.articleMeta}>{article.author} · {article.createdAt}</p>
            </button>
          ))}
          {articles.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Записей пока нет</p>
          )}
        </div>
        <Button variant="ghost" style={{ marginTop: 'var(--space-3)' }} onClick={() => navigate('/knowledge')}>
          ← К разделам
        </Button>
      </div>
    </>
  );
}
