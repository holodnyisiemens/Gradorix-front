import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  type?: 'sheet' | 'dialog';
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

const SWIPE_CLOSE_THRESHOLD = 120; // px — enough drag down to trigger close

export function Modal({ open, onClose, title, children, type = 'dialog' }: ModalProps) {
  const isMobile = useIsMobile();
  // On mobile always show as sheet; on desktop use the prop
  const resolvedType = isMobile ? 'sheet' : type;

  const sheetRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const dragging = useRef(false);
  const [dragY, setDragY] = useState(0);
  const [isSnapping, setIsSnapping] = useState(false);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Reset drag state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setDragY(0);
      setIsSnapping(false);
    }
  }, [open]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    dragging.current = true;
    setIsSnapping(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) setDragY(delta); // only allow dragging down
  };

  const handleTouchEnd = () => {
    dragging.current = false;
    if (dragY > SWIPE_CLOSE_THRESHOLD) {
      setIsSnapping(true);
      // Animate out before closing
      const height = sheetRef.current?.offsetHeight ?? 400;
      setDragY(height);
      setTimeout(() => {
        setDragY(0);
        setIsSnapping(false);
        onClose();
      }, 280);
    } else {
      // Snap back
      setIsSnapping(true);
      setDragY(0);
    }
  };

  if (!open) return null;

  const isSheet = resolvedType === 'sheet';

  return (
    <div
      className={[styles.overlay, isSheet ? styles.overlaySheet : styles.overlayDialog].join(' ')}
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        className={isSheet ? styles.sheet : styles.dialog}
        style={isSheet ? {
          transform: `translateY(${dragY}px)`,
          transition: dragging.current ? 'none' : isSnapping ? 'transform 0.28s ease' : undefined,
        } : undefined}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={isSheet ? handleTouchStart : undefined}
        onTouchMove={isSheet ? handleTouchMove : undefined}
        onTouchEnd={isSheet ? handleTouchEnd : undefined}
      >
        {isSheet && <div className={styles.handle} />}
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
