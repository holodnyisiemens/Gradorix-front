import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Paperclip, Download, X } from 'lucide-react';
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

function fileName(url: string): string {
  const raw = url.split('/').pop() ?? url;
  // strip the uuid suffix added by backend: name_abc12345.ext → name.ext
  return raw.replace(/_[0-9a-f]{8}(\.[^.]+)$/, '$1');
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
  const [deleteTarget, setDeleteTarget] = useState<KBArticle | null>(null);
  const [newArticleModal, setNewArticleModal] = useState(false);
  const [newArticle, setNewArticle] = useState({ title: '', content: '', author: user.username });
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const section = sections.find((s) => s.id === Number(sectionId));
  if (!section) return null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    setNewFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...picked.filter(f => !existing.has(f.name))];
    });
    e.target.value = '';
  }

  function removeFile(name: string) {
    setNewFiles(prev => prev.filter(f => f.name !== name));
  }

  async function handleCreateArticle() {
    if (!newArticle.title || !newArticle.content) return;
    await createArticle.mutateAsync({
      section_id: Number(sectionId),
      title: newArticle.title,
      content: newArticle.content,
      author: newArticle.author || user.username,
      files: newFiles.length ? newFiles : undefined,
    });
    setNewArticleModal(false);
    setNewArticle({ title: '', content: '', author: newArticle.author });
    setNewFiles([]);
  }

  if (selected) {
    return (
      <>
        <PageHeader title={selected.title} showBack subtitle={`${section.icon || '📄'} ${section.title}`} />
        <div className={styles.page}>
          <div className={styles.articleView}>
            <div className={styles.articleContent}>
              {renderMarkdown(selected.content)}
            </div>

            {selected.attachments && selected.attachments.length > 0 && (
              <div style={{ marginTop: 'var(--space-4)' }}>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                  Вложения ({selected.attachments.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {selected.attachments.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                        padding: 'var(--space-2) var(--space-3)',
                        background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)', textDecoration: 'none',
                        color: 'var(--color-info-bright)', fontSize: 13,
                        overflowWrap: 'break-word', wordBreak: 'break-all',
                      }}
                    >
                      <Download size={14} style={{ flexShrink: 0 }} />
                      {fileName(url)}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {isHR && (
              <div className={styles.hrActions}>
                <Button variant="danger" size="sm" onClick={() => setDeleteTarget(selected)}>Удалить статью</Button>
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
      <PageHeader title={section.title} showBack subtitle={`${articles.length} материалов`} />
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
                <p className={styles.articleMeta}>
                  {article.author} · {article.createdAt}
                  {article.attachments && article.attachments.length > 0 && (
                    <span style={{ marginLeft: 6, color: 'var(--text-muted)' }}>
                      <Paperclip size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} />
                      {article.attachments.length}
                    </span>
                  )}
                </p>
              </button>
              {isHR && (
                <button onClick={() => setDeleteTarget(article)}
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

      {deleteTarget && (
        <Modal open={true} onClose={() => setDeleteTarget(null)} title="Удалить статью?" type="dialog">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Статья <strong>«{deleteTarget.title}»</strong> будет удалена без возможности восстановления.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button full variant="ghost" onClick={() => setDeleteTarget(null)}>Отмена</Button>
              <Button full variant="danger" disabled={deleteArticle.isPending} onClick={() => {
                deleteArticle.mutate(deleteTarget.id, {
                  onSuccess: () => {
                    if (selected?.id === deleteTarget.id) setSelected(null);
                    setDeleteTarget(null);
                  },
                });
              }}>
                {deleteArticle.isPending ? 'Удаление...' : 'Удалить'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {newArticleModal && (
        <Modal open={true} onClose={() => { setNewArticleModal(false); setNewFiles([]); }} title="Создать статью" type="dialog">
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

            {/* File picker */}
            <div>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                Вложения
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp,.zip,.rar"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 12px', borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--border-subtle)', background: 'transparent',
                  color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer',
                  width: '100%', justifyContent: 'center',
                }}
              >
                <Paperclip size={14} />
                Прикрепить файлы (макс. 5 × 10 МБ)
              </button>
              {newFiles.length > 0 && (
                <div style={{ marginTop: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {newFiles.map(f => (
                    <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                      <Paperclip size={11} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                      <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{(f.size / 1024).toFixed(0)} KB</span>
                      <button type="button" onClick={() => removeFile(f.name)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
