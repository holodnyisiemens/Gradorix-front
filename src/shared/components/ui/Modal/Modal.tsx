import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  type?: 'sheet' | 'dialog';
}

export function Modal({ open, onClose, title, children, type = 'sheet' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={[styles.overlay, type === 'dialog' ? styles.overlayCenter : ''].join(' ')}
      onClick={onClose}
    >
      <div
        className={type === 'dialog' ? styles.dialog : styles.sheet}
        onClick={(e) => e.stopPropagation()}
      >
        {type === 'sheet' && <div className={styles.handle} />}
        <div className={styles.header}>
          {title && <h3 className={styles.title}>{title}</h3>}
          <button className={styles.close} onClick={onClose} aria-label="Закрыть">
            <X size={20} />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
