import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@modules/auth/store/authStore';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Button } from '@shared/components/ui/Button/Button';
import { Input } from '@shared/components/ui/Input/Input';
import { Modal } from '@shared/components/ui/Modal/Modal';
import { useKBSections, useKBArticles, useCreateKBSection, useDeleteKBSection } from '@shared/hooks/useApi';
import styles from './KnowledgePage.module.css';

export function KnowledgePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user)!;
  const isHR = user.role === 'HR';

  const { data: sections = [] } = useKBSections();
  const { data: allArticles = [] } = useKBArticles();
  const createSection = useCreateKBSection();
  const deleteSection = useDeleteKBSection();

  const [newSectionModal, setNewSectionModal] = useState(false);
  const [newSection, setNewSection] = useState({ title: '', order: 0 });

  async function handleCreateSection() {
    if (!newSection.title) return;
    await createSection.mutateAsync({ title: newSection.title, order: newSection.order || undefined });
    setNewSectionModal(false);
    setNewSection({ title: '', order: 0 });
  }

  return (
    <>
      <PageHeader title="База знаний" subtitle="Материалы программы HiPo" />
      <div className={styles.page}>
        {isHR && (
          <Button full style={{ marginBottom: 'var(--space-3)' }} onClick={() => setNewSectionModal(true)}>
            + Создать раздел
          </Button>
        )}
        <div className={styles.grid}>
          {sections.map((section) => {
            const count = allArticles.filter((a) => a.sectionId === section.id).length;
            return (
              <div key={section.id} style={{ position: 'relative' }}>
                <button className={styles.section} onClick={() => navigate(`/knowledge/${section.id}`)}>
                  <span className={styles.icon}>{section.icon || '📄'}</span>
                  <p className={styles.title}>{section.title}</p>
                  <p className={styles.desc}>{section.description}</p>
                  <p className={styles.count}>{count} {count === 1 ? 'статья' : count < 5 ? 'статьи' : 'статей'}</p>
                </button>
                {isHR && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSection.mutate(section.id); }}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(204,0,0,0.8)', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', fontSize: 11, padding: '2px 6px' }}
                  >✕</button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {newSectionModal && (
        <Modal open={true} onClose={() => setNewSectionModal(false)} title="Создать раздел" type="dialog">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input label="Название *" value={newSection.title} onChange={e => setNewSection(p => ({ ...p, title: e.target.value }))} />
            <Input label="Порядок (число)" type="number" value={String(newSection.order)} onChange={e => setNewSection(p => ({ ...p, order: Number(e.target.value) }))} />
            <Button full onClick={handleCreateSection} disabled={createSection.isPending}>
              {createSection.isPending ? 'Создание...' : 'Создать'}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
