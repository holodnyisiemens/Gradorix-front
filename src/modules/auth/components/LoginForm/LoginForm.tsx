import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@shared/components/ui/Button/Button';
import { Input } from '@shared/components/ui/Input/Input';
import { Card } from '@shared/components/ui/Card/Card';
import { useAuthStore } from '@modules/auth/store/authStore';
import { authApi } from '@shared/api/services/auth';
import { registerPushSubscription } from '@shared/services/push';
import styles from './LoginForm.module.css';

export function LoginForm() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const doLogin = async (e: string, p: string) => {
    setError('');
    setLoading(true);
    try {
      const { access_token } = await authApi.login({ email: e, password: p });
      localStorage.setItem('gradorix-token', access_token);
      const user = await authApi.getMe();
      login(user, access_token);
      registerPushSubscription(user.id);
    } catch {
      setError('Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await doLogin(email.trim(), password);
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
            <p className={styles.formTitle}>Войти</p>

            {error && (
              <div className={styles.error}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

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
              autoComplete="current-password"
              iconRight={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              onIconRightClick={() => setShowPassword((v) => !v)}
            />

            <Button type="submit" full loading={loading} disabled={!email || !password}>
              Войти
            </Button>

            <p className={styles.navHint}>
              Нет аккаунта?{' '}
              <button type="button" className={styles.navLink} onClick={() => navigate('/register')}>
                Зарегистрироваться
              </button>
            </p>
          </form>
        </Card>

      </div>
    </div>
  );
}