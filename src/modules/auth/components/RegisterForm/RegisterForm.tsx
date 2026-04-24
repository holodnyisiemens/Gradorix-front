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
import styles from './RegisterForm.module.css';

const ROLE_OPTIONS: SelectOption[] = [
  { value: 'JUNIOR', label: 'Участник проекта ОКД' },
  { value: 'HR', label: 'Администратор' },
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
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [role, setRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = (): string => {
    if (!username.trim()) return 'Логин обязателен';
    if (!firstname.trim()) return 'Имя обязательно';
    if (!lastname.trim()) return 'Фамилия обязательна';
    if (!email.trim()) return 'Email обязателен';
    if (!password) return 'Пароль обязателен';
    if (password.length < 6) return 'Пароль должен быть минимум 6 символов';
    if (password !== passwordConfirm) return 'Пароли не совпадают';
    if (!role) return 'Выберите роль';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setLoading(true);
    try {
      await authApi.register({
        username: username.trim(),
        email: email.trim(),
        password,
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        role: role as 'HR' | 'MENTOR' | 'JUNIOR',
      });
      // Backend returns {message}, not a token — login manually after register
      const { access_token } = await authApi.login({ email: email.trim(), password });
      localStorage.setItem('gradorix-token', access_token);
      const user = await authApi.getMe();
      login(user, access_token);
      registerPushSubscription(user.id);
    } catch (err: unknown) {
      const axiosData = (err as { response?: { data?: { detail?: string } } })?.response?.data;
      setError(axiosData?.detail || 'Не удалось зарегистрироваться. Возможно, такой электронный адрес уже используется.');
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
              label="Логин"
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
            />

            <Input
              label="Имя"
              type="text"
              placeholder="Иван"
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
              autoComplete="given-name"
            />

            <Input
              label="Фамилия"
              type="text"
              placeholder="Петров"
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
              autoComplete="family-name"
            />

            <Input
              label="Email"
              type="email"
              placeholder="user@gradorix.ru"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
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

            <Button type="submit" full loading={loading} disabled={!username || !firstname || !lastname || !email || !password || !passwordConfirm || !role}>
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