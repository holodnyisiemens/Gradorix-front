import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@shared/components/ui/Button/Button';
import { Input } from '@shared/components/ui/Input/Input';
import { Select, type SelectOption } from '@shared/components/ui/Select/Select';
import { Card } from '@shared/components/ui/Card/Card';
import { useAuthStore } from '@modules/auth/store/authStore';
import { authApi } from '@shared/api/services/auth';
import { registerPushSubscription } from '@shared/services/push';
import { analytics } from '@shared/lib/analytics';
import styles from './RegisterForm.module.css';

const ROLE_OPTIONS: SelectOption[] = [
  { value: 'EMPLOYEE', label: 'Участник проекта ОКД' },
  //{ value: 'HR', label: 'Администратор' },
  { value: 'MENTOR', label: 'Ментор' },
];

function translateError(raw: string): string {
  if (raw.toLowerCase().includes('username') && raw.toLowerCase().includes('exist')) {
    return 'Этот логин уже занят. Придумайте другой.';
  }
  if (raw.toLowerCase().includes('email') && raw.toLowerCase().includes('exist')) {
    return 'Этот email уже зарегистрирован.';
  }
  if (raw.toLowerCase().includes('already')) {
    return 'Пользователь с такими данными уже существует.';
  }
  return raw;
}

export function RegisterForm() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [role, setRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = (): string => {
    if (!username.trim()) return 'Логин обязателен';
    if (!password) return 'Пароль обязателен';
    if (password.length < 6) return 'Пароль должен быть минимум 6 символов';
    if (password !== passwordConfirm) return 'Пароли не совпадают';
    if (!role) return 'Выберите роль';
    return '';
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setLoading(true);
    try {
      const { access_token, refresh_token } = await authApi.register({
        username: username.trim(),
        password,
        role: role as 'HR' | 'MENTOR' | 'EMPLOYEE',
      });
      localStorage.setItem('gradorix-token', access_token);
      const user = await authApi.getMe();
      login(user, access_token, refresh_token);
      registerPushSubscription(user.id);
      analytics.identify(user.id, { username: user.username, role: user.role });
      analytics.track('регистрация', { role: user.role });
    } catch (err: unknown) {
      const axiosData = (err as { response?: { data?: { detail?: string } } })?.response?.data;
      const rawMsg = axiosData?.detail ?? 'Не удалось зарегистрироваться. Возможно, такой логин уже занят.';
      setError(translateError(rawMsg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logoSection}>
          <h1 className={styles.appName}>
            Очень
            <span className={styles.appNameAccent}>карьерные</span>
            дела
          </h1>
          <p className={styles.tagline}>Программа развития сотрудников</p>
        </div>

        <Card>
          <form className={styles.form} onSubmit={handleSubmit}>
            <p className={styles.formTitle}>Регистрация</p>

            {error && (
              <div className={styles.error}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <Input
              label="Никнейм"
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
            />

            <Input
              label="Пароль"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              iconRight={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              onIconRightClick={() => setShowPassword((v) => !v)}
            />

            <Input
              label="Подтверждение пароля"
              type={showPasswordConfirm ? 'text' : 'password'}
              placeholder="••••••"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
              iconRight={showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              onIconRightClick={() => setShowPasswordConfirm((v) => !v)}
            />

            <Select
              label="Роль"
              options={ROLE_OPTIONS}
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />

            <Button type="submit" full loading={loading} disabled={!username || !password || !passwordConfirm || !role}>
              Зарегистрироваться
            </Button>

            <p className={styles.navHint}>
              Уже есть аккаунт?{' '}
              <button type="button" className={styles.navLink} onClick={() => navigate('/login')}>
                Войти
              </button>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
