import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@shared/components/ui/Button/Button';
import { Input } from '@shared/components/ui/Input/Input';
import { Card } from '@shared/components/ui/Card/Card';
import { useAuthStore } from '@modules/auth/store/authStore';
import { authApi } from '@shared/api/services/auth';
import styles from './LoginForm.module.css';

const QUICK_LOGINS = [
  { email: 'hr@test.com', password: 'hr1234', role: 'HR', name: 'Анна Соколова' },
  { email: 'mentor@test.com', password: 'mentor123', role: 'MENTOR', name: 'Алексей Воронов' },
  { email: 'junior@test.com', password: 'junior123', role: 'JUNIOR', name: 'Катя Ефимова' },
];

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
    } catch {
      setError('Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await doLogin(email.trim(), password);
  };

  const handleQuickLogin = (idx: number) => {
    const cred = QUICK_LOGINS[idx];
    doLogin(cred.email, cred.password);
  };

  const roleLabels: Record<string, string> = { HR: 'HR', MENTOR: 'Ментор', JUNIOR: 'HiPo' };
  const roleIcons: Record<string, string> = { HR: '👔', MENTOR: '🧑‍💻', JUNIOR: '⭐' };
  const roleColors: Record<string, string> = {
    HR: 'rgba(245, 197, 24, 0.15)',
    MENTOR: 'rgba(58, 154, 238, 0.15)',
    JUNIOR: 'rgba(45, 138, 78, 0.15)',
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
          <p className={styles.tagline}>Система наставничества Gradorix</p>
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

        <div className={styles.divider}>Быстрый вход</div>
        <div className={styles.quickAccess}>
          {QUICK_LOGINS.map((cred, idx) => (
            <button
              key={cred.email}
              className={styles.quickBtn}
              onClick={() => handleQuickLogin(idx)}
              type="button"
              disabled={loading}
            >
              <span
                className={styles.roleIcon}
                style={{ background: roleColors[cred.role] }}
              >
                {roleIcons[cred.role]}
              </span>
              <span>
                <p className={styles.quickBtnRole}>{roleLabels[cred.role]}</p>
                <p className={styles.quickBtnName}>{cred.name}</p>
              </span>
              <span className={styles.quickBtnHint}>{cred.email}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}