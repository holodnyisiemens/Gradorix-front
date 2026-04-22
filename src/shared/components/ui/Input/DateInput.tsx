import { useEffect, useRef, useState } from 'react';
import { Calendar } from 'lucide-react';
import styles from './Input.module.css';

interface DateInputProps {
  label?: string;
  value: string; // YYYY-MM-DD or ''
  onChange: (value: string) => void;
  error?: string;
}

/**
 * User-friendly date input: shows ДД.ММ.ГГГГ mask, autofills separators,
 * stores value as YYYY-MM-DD for API compatibility.
 */
export function DateInput({ label, value, onChange, error }: DateInputProps) {
  // Convert YYYY-MM-DD → DD.MM.YYYY for display
  function toDisplay(iso: string): string {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    if (!y || !m || !d) return iso;
    return `${d}.${m}.${y}`;
  }

  // Convert DD.MM.YYYY → YYYY-MM-DD for storage
  function toISO(display: string): string {
    const clean = display.replace(/\D/g, '');
    if (clean.length < 8) return '';
    const d = clean.slice(0, 2);
    const m = clean.slice(2, 4);
    const y = clean.slice(4, 8);
    return `${y}-${m}-${d}`;
  }

  const [display, setDisplay] = useState(() => toDisplay(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) {
      setDisplay(toDisplay(value));
    }
  }, [value]);

  function handleChange(raw: string) {
    // Strip non-digits
    const digits = raw.replace(/\D/g, '').slice(0, 8);

    // Build masked string with auto-dots
    let masked = '';
    for (let i = 0; i < digits.length; i++) {
      if (i === 2 || i === 4) masked += '.';
      masked += digits[i];
    }

    setDisplay(masked);

    const iso = toISO(masked);
    onChange(iso);
  }

  function handleBlur() {
    isFocused.current = false;
    setDisplay(toDisplay(value));
  }

  function handleFocus() {
    isFocused.current = true;
  }

  const inputId = label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={styles.wrapper}>
      {label && (
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className={styles.inputWrapper}>
        <span className={styles.iconLeft}>
          <Calendar size={16} />
        </span>
        <input
          ref={inputRef}
          id={inputId}
          className={[styles.input, styles.hasIcon, error ? styles.error : ''].filter(Boolean).join(' ')}
          value={display}
          onChange={e => handleChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="ДД.ММ.ГГГГ"
          inputMode="numeric"
          autoComplete="off"
        />
      </div>
      {error && <span className={styles.errorMsg}>{error}</span>}
      {display && display.length < 10 && (
        <span className={styles.errorMsg} style={{ color: 'var(--text-muted)' }}>
          Введите дату полностью: ДД.ММ.ГГГГ
        </span>
      )}
    </div>
  );
}
