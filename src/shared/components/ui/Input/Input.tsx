import { type InputHTMLAttributes, type ReactNode } from 'react';
import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  onIconRightClick?: () => void;
}

export function Input({
  label,
  error,
  iconLeft,
  iconRight,
  onIconRightClick,
  className,
  id,
  ...rest
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={styles.wrapper}>
      {label && (
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className={styles.inputWrapper}>
        {iconLeft && <span className={styles.iconLeft}>{iconLeft}</span>}
        <input
          id={inputId}
          className={[
            styles.input,
            iconLeft ? styles.hasIcon : '',
            iconRight ? styles.hasAction : '',
            error ? styles.error : '',
            className ?? '',
          ].filter(Boolean).join(' ')}
          {...rest}
        />
        {iconRight && (
          <span
            className={styles.iconRight}
            onClick={onIconRightClick}
            role={onIconRightClick ? 'button' : undefined}
          >
            {iconRight}
          </span>
        )}
      </div>
      {error && <span className={styles.errorMsg}>{error}</span>}
    </div>
  );
}
