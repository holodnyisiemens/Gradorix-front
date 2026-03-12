import { type HTMLAttributes, type ReactNode } from 'react';
import styles from './Card.module.css';

type CardPadding = 'default' | 'compact' | 'flush';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
  interactive?: boolean;
  glow?: boolean;
  accent?: boolean;
  children: ReactNode;
}

export function Card({
  padding = 'default',
  interactive = false,
  glow = false,
  accent = false,
  children,
  className,
  ...rest
}: CardProps) {
  return (
    <div
      className={[
        styles.card,
        styles[padding],
        interactive ? styles.interactive : '',
        glow ? styles.glow : '',
        accent ? styles.accent : '',
        className ?? '',
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}
