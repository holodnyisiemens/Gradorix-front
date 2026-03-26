import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Button } from '@shared/components/ui/Button/Button';
import { Input } from '@shared/components/ui/Input/Input';
import { Modal } from '@shared/components/ui/Modal/Modal';
import { useKBSections, useKBArticles, useCreateKBArticle, useDeleteKBArticle } from '@shared/hooks/useApi';
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

  const { data: sections = [] } = useKBSections();
  const { data: articles = [] } = useKBArticles(Number(sectionId));
  const createArticle = useCreateKBArticle();
  const deleteArticle = useDeleteKBArticle();

  const [selected, setSelected] = useState<KBArticle | null>(null);
  const [newArticleModal, setNewArticleModal] = useState(false);
  const [newArticle, setNewArticle] = useState({ title: '', content: '', author: user.firstname ? `${user.firstname} ${user.lastname}` : user.username });

  const section = sections.find((s) => s.id === Number(sectionId));
  if (!section) return null;

  async function handleCreateArticle() {
    if (!newArticle.title || !newArticle.content) return;
    await createArticle.mutateAsync({
      section_id: Number(sectionId),
      title: newArticle.title,
      content: newArticle.content,
      author: newArticle.author || user.username,
    });
    setNewArticleModal(false);
    setNewArticle({ title: '', content: '', author: newArticle.author });
  }

  if (selected) {
    return (
      <>
        <PageHeader title={selected.title} subtitle={`${section.icon || '📄'} ${section.title}`} />
        <div className={styles.page}>
          <div className={styles.articleView}>
            <div className={styles.articleContent}>
              {renderMarkdown(selected.content)}
            </div>
            {isHR && (
              <div className={styles.hrActions}>
                <Button variant="danger" size="sm" onClick={() => { deleteArticle.mutate(selected.id); setSelected(null); }}>Удалить статью</Button>
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
          <Button full style={{ marginBottom: 'var(--space-3)' }} onClick={() => setNewArticleModal(true)}>
            + Создать статью
          </Button>
        )}
        <div className={styles.list}>
          {articles.map((article) => (
            <div key={article.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <button className={styles.article} style={{ flex: 1 }} onClick={() => setSelected(article)}>
                <p className={styles.articleTitle}>{article.title}</p>
                <p className={styles.articleMeta}>{article.author} · {article.createdAt}</p>
              </button>
              {isHR && (
                <button onClick={() => deleteArticle.mutate(article.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-danger-bright)', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}
                >✕</button>
              )}
            </div>
          ))}
          {articles.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Записей пока нет</p>
          )}
        </div>
        <Button variant="ghost" style={{ marginTop: 'var(--space-3)' }} onClick={() => navigate('/knowledge')}>
          ← К разделам
        </Button>
      </div>

      {newArticleModal && (
        <Modal open={true} onClose={() => setNewArticleModal(false)} title="Создать статью" type="sheet">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input label="Заголовок *" value={newArticle.title} onChange={e => setNewArticle(p => ({ ...p, title: e.target.value }))} />
            <Input label="Автор" value={newArticle.author} onChange={e => setNewArticle(p => ({ ...p, author: e.target.value }))} />
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Содержание *</p>
              <textarea
                value={newArticle.content}
                onChange={e => setNewArticle(p => ({ ...p, content: e.target.value }))}
                placeholder="Поддерживается Markdown: ## Заголовок, ### Подзаголовок"
                style={{ width: '100%', minHeight: 180, padding: 10, borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
            <Button full onClick={handleCreateArticle} disabled={createArticle.isPending}>
              {createArticle.isPending ? 'Создание...' : 'Создать статью'}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
