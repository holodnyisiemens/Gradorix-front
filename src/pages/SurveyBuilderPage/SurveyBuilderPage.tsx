import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, ChevronLeft, Check, GripVertical, CircleDot, CheckSquare, AlignLeft } from 'lucide-react';
import { PageHeader } from '@shared/components/layout/PageHeader/PageHeader';
import { Button } from '@shared/components/ui/Button/Button';
import { Input } from '@shared/components/ui/Input/Input';
import { useSurvey, useCreateSurvey, useUpdateSurvey } from '@shared/hooks/useApi';
import type { QuestionType, TestQuestion } from '@shared/types';
import styles from './SurveyBuilderPage.module.css';

// ── Draft types ───────────────────────────────────────────────────────────────
interface DraftQuestion {
  _id: number; // local only — never sent to backend
  text: string;
  type: QuestionType;
  options: string[];
}

interface SurveyInfo {
  title: string;
  description: string;
  category: string;
  duration_min: number;
  available: boolean;
}

const EMPTY_QUESTION: Omit<DraftQuestion, '_id'> = {
  text: '',
  type: 'single',
  options: ['', ''],
};

const TYPE_META: Record<QuestionType, { label: string; icon: React.ReactNode; color: string }> = {
  single:   { label: 'Один ответ',       icon: <CircleDot size={14} />,    color: 'var(--color-info-bright)' },
  multiple: { label: 'Несколько ответов', icon: <CheckSquare size={14} />,  color: 'var(--color-warning-bright)' },
  text:     { label: 'Открытый ответ',   icon: <AlignLeft size={14} />,    color: 'var(--color-success-bright)' },
};

let _nextId = 1;
function nextId() { return _nextId++; }

function draftFromQuestion(q: TestQuestion): DraftQuestion {
  return {
    _id: nextId(),
    text: q.text,
    type: q.type,
    options: q.options ?? ['', ''],
  };
}

function draftToQuestion(d: DraftQuestion): TestQuestion {
  return {
    id: 0,
    text: d.text,
    type: d.type,
    options: d.type !== 'text' ? d.options.filter(o => o.trim()) : undefined,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <div className={styles.toggleRow} onClick={onChange}>
      <span className={[styles.toggle, checked ? styles.toggleOn : ''].join(' ')} />
      <span className={styles.toggleLabel}>{label}</span>
    </div>
  );
}

function QuestionFormPanel({
  draft,
  onChange,
  onSave,
  onCancel,
}: {
  draft: DraftQuestion;
  onChange: (d: DraftQuestion) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  function setField<K extends keyof DraftQuestion>(key: K, val: DraftQuestion[K]) {
    onChange({ ...draft, [key]: val });
  }

  function setOption(idx: number, val: string) {
    const opts = [...draft.options];
    opts[idx] = val;
    onChange({ ...draft, options: opts });
  }

  function addOption() {
    onChange({ ...draft, options: [...draft.options, ''] });
  }

  function removeOption(idx: number) {
    const opts = draft.options.filter((_, i) => i !== idx);
    onChange({ ...draft, options: opts });
  }

  const canSave = draft.text.trim() &&
    (draft.type === 'text' || draft.options.filter(o => o.trim()).length >= 2);

  return (
    <div className={styles.questionForm}>
      {/* Type selector */}
      <div className={styles.typeRow}>
        {(['single', 'multiple', 'text'] as QuestionType[]).map(t => (
          <button
            key={t}
            className={[styles.typeBtn, draft.type === t ? styles.typeBtnActive : ''].join(' ')}
            onClick={() => setField('type', t)}
            style={draft.type === t ? { borderColor: TYPE_META[t].color, color: TYPE_META[t].color } : {}}
          >
            {TYPE_META[t].icon}
            <span>{TYPE_META[t].label}</span>
          </button>
        ))}
      </div>

      {/* Question text */}
      <textarea
        className={styles.questionTextarea}
        placeholder="Текст вопроса *"
        value={draft.text}
        rows={2}
        onChange={e => setField('text', e.target.value)}
      />

      {/* Options (for single / multiple) */}
      {draft.type !== 'text' && (
        <div className={styles.optionsList}>
          {draft.options.map((opt, idx) => (
            <div key={idx} className={styles.optionRow}>
              <input
                className={styles.optionInput}
                placeholder={`Вариант ${idx + 1}`}
                value={opt}
                onChange={e => setOption(idx, e.target.value)}
              />
              {draft.options.length > 2 && (
                <button className={styles.optionRemove} onClick={() => removeOption(idx)}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
          {draft.options.length < 8 && (
            <button className={styles.addOptionBtn} onClick={addOption}>
              <Plus size={13} /> Добавить вариант
            </button>
          )}
          <p className={styles.optionHint}>
            Вариант для выбора участниками опроса
          </p>
        </div>
      )}

      <div className={styles.formActions}>
        <button className={styles.cancelBtn} onClick={onCancel}>Отмена</button>
        <Button onClick={onSave} disabled={!canSave}>
          <Check size={14} /> Сохранить вопрос
        </Button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function SurveyBuilderPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const surveyId = id ? Number(id) : 0;

  const { data: existingSurvey } = useSurvey(surveyId);
  const createSurvey = useCreateSurvey();
  const updateSurvey = useUpdateSurvey();

  const [info, setInfo] = useState<SurveyInfo>({
    title: '', description: '', category: '', duration_min: 20, available: true,
  });
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [draftQ, setDraftQ] = useState<DraftQuestion | null>(null);
  const [infoError, setInfoError] = useState('');

  // Pre-populate when editing
  useEffect(() => {
    if (existingSurvey && isEdit) {
      setInfo({
        title: existingSurvey.title,
        description: existingSurvey.description,
        category: existingSurvey.category,
        duration_min: existingSurvey.durationMin,
        available: existingSurvey.available,
      });
      setQuestions(existingSurvey.questions.map(draftFromQuestion));
    }
  }, [existingSurvey, isEdit]);

  function startNewQuestion() {
    setEditingIdx(null);
    setDraftQ({ _id: nextId(), ...EMPTY_QUESTION });
  }

  function startEditQuestion(idx: number) {
    setEditingIdx(idx);
    setDraftQ({ ...questions[idx] });
  }

  function saveQuestion() {
    if (!draftQ) return;
    if (editingIdx !== null) {
      setQuestions(prev => prev.map((q, i) => i === editingIdx ? draftQ : q));
    } else {
      setQuestions(prev => [...prev, draftQ]);
    }
    setDraftQ(null);
    setEditingIdx(null);
  }

  function deleteQuestion(idx: number) {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
    if (editingIdx === idx) { setDraftQ(null); setEditingIdx(null); }
  }

  async function handleSave() {
    if (!info.title.trim()) { setInfoError('Укажите название опроса'); return; }
    setInfoError('');

    const payload = {
      ...info,
      category: info.category || 'general',
      questions: questions.map(draftToQuestion),
    };

    if (isEdit) {
      await updateSurvey.mutateAsync({ id: surveyId, data: payload });
    } else {
      await createSurvey.mutateAsync(payload);
    }
    navigate('/surveys');
  }

  const isSaving = createSurvey.isPending || updateSurvey.isPending;
  const typeOrder: QuestionType[] = ['single', 'multiple', 'text'];
  const questionCount = questions.length;

  return (
    <>
      <PageHeader
        title={isEdit ? 'Редактировать опрос' : 'Новый опрос'}
        subtitle={`${questionCount} ${questionCount === 1 ? 'вопрос' : questionCount < 5 ? 'вопроса' : 'вопросов'}`}
        actions={
          <button className={styles.backBtn} onClick={() => navigate('/surveys')}>
            <ChevronLeft size={18} />
          </button>
        }
      />

      <div className={styles.page}>

        {/* ── Survey info ── */}
        <section className={styles.section}>
          <p className={styles.sectionLabel}>Основное</p>
          <div className={styles.infoGrid}>
            <div className={styles.infoFull}>
              <Input
                label="Название *"
                value={info.title}
                onChange={e => { setInfo(p => ({ ...p, title: e.target.value })); setInfoError(''); }}
              />
              {infoError && <p className={styles.error}>{infoError}</p>}
            </div>
            <div className={styles.infoFull}>
              <Input
                label="Описание"
                value={info.description}
                onChange={e => setInfo(p => ({ ...p, description: e.target.value }))}
              />
            </div>
            <Input
              label="Категория"
              value={info.category}
              placeholder="general"
              onChange={e => setInfo(p => ({ ...p, category: e.target.value }))}
            />
            <Input
              label="Длительность (мин)"
              type="number"
              value={String(info.duration_min)}
              onChange={e => setInfo(p => ({ ...p, duration_min: Number(e.target.value) }))}
            />
            <Toggle
              checked={info.available}
              onChange={() => setInfo(p => ({ ...p, available: !p.available }))}
              label={info.available ? 'Доступен участникам' : 'Скрыт от участников'}
            />
          </div>
        </section>

        {/* ── Questions ── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionLabel}>Вопросы</p>
            <div className={styles.typeLegend}>
              {typeOrder.map(t => (
                <span key={t} className={styles.legendItem} style={{ color: TYPE_META[t].color }}>
                  {TYPE_META[t].icon} {questions.filter(q => q.type === t).length}
                </span>
              ))}
            </div>
          </div>

          {/* Question list */}
          {questions.length > 0 && (
            <div className={styles.questionList}>
              {questions.map((q, idx) => (
                <div
                  key={q._id}
                  className={[styles.questionCard, editingIdx === idx ? styles.questionCardActive : ''].join(' ')}
                >
                  <div className={styles.questionCardInner} onClick={() => editingIdx === idx ? undefined : startEditQuestion(idx)}>
                    <span className={styles.questionNum}>{idx + 1}</span>
                    <GripVertical size={14} className={styles.grip} />
                    <span
                      className={styles.questionTypeBadge}
                      style={{ color: TYPE_META[q.type].color, borderColor: TYPE_META[q.type].color }}
                    >
                      {TYPE_META[q.type].icon}
                    </span>
                    <p className={styles.questionText}>{q.text || <em>Без текста</em>}</p>
                    {q.type !== 'text' && (
                      <span className={styles.questionMeta}>{q.options.filter(o => o.trim()).length} вар.</span>
                    )}
                    <button
                      className={styles.deleteBtn}
                      onClick={e => { e.stopPropagation(); deleteQuestion(idx); }}
                      title="Удалить вопрос"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Inline edit form */}
                  {editingIdx === idx && draftQ && (
                    <div className={styles.inlineForm}>
                      <QuestionFormPanel
                        draft={draftQ}
                        onChange={setDraftQ}
                        onSave={saveQuestion}
                        onCancel={() => { setDraftQ(null); setEditingIdx(null); }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* New question form */}
          {draftQ && editingIdx === null && (
            <div className={styles.newQuestionWrap}>
              <QuestionFormPanel
                draft={draftQ}
                onChange={setDraftQ}
                onSave={saveQuestion}
                onCancel={() => setDraftQ(null)}
              />
            </div>
          )}

          {!draftQ && (
            <button className={styles.addQuestionBtn} onClick={startNewQuestion}>
              <Plus size={16} /> Добавить вопрос
            </button>
          )}
        </section>

        {/* ── Save ── */}
        <Button full onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Сохранение...' : isEdit ? 'Сохранить изменения' : `Создать опрос · ${questionCount} вопр.`}
        </Button>
      </div>
    </>
  );
}
