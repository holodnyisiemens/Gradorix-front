import { type SelectHTMLAttributes } from 'react';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

export function Select({
  label,
  error,
  options,
  className,
  id,
  ...rest
}: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={styles.wrapper}>
      {label && (
        <label className={styles.label} htmlFor={selectId}>
          {label}
        </label>
      )}
      <div className={styles.selectWrapper}>
        <select
          id={selectId}
          className={[
            styles.select,
            error ? styles.error : '',
            className ?? '',
          ].filter(Boolean).join(' ')}
          {...rest}
        >
          <option value="">Выберите опцию</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {error && <span className={styles.errorMsg}>{error}</span>}
    </div>
  );
}