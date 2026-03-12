import { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@shared/components/ui/Button/Button';
import { Input } from '@shared/components/ui/Input/Input';
import { Card } from '@shared/components/ui/Card/Card';
import { useAuthStore } from '@modules/auth/store/authStore';
import { MOCK_USERS, mockLogin } from '@modules/auth/mockUsers';
import styles from './LoginForm.module.css';

export function LoginForm() {
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 600));

    const user = mockLogin(username.trim(), password);
    if (user) {
      login(user);
    } else {
      setError('Неверный логин или пароль');
    }
    setLoading(false);
  };

  const handleQuickLogin = (credIdx: number) => {
    const cred = MOCK_USERS[credIdx];
    login(cred.user);
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
        {/* Logo */}
        <div className={styles.logoSection}>
          <h1 className={styles.appName}>
            Очень
            <span className={styles.appNameAccent}>карьерные</span>
            дела
          </h1>
          <p className={styles.tagline}>Система наставничества Gradorix</p>
        </div>

        {/* Login form */}
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
              label="Логин"
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
              autoComplete="current-password"
              iconRight={
                showPassword ? <EyeOff size={18} /> : <Eye size={18} />
              }
              onIconRightClick={() => setShowPassword((v) => !v)}
            />

            <Button type="submit" full loading={loading} disabled={!username || !password}>
              Войти
            </Button>
          </form>
        </Card>

        {/* Quick access for dev/demo */}
        <div className={styles.divider}>Быстрый вход</div>
        <div className={styles.quickAccess}>
          {MOCK_USERS.map((cred, idx) => (
            <button
              key={cred.user.id}
              className={styles.quickBtn}
              onClick={() => handleQuickLogin(idx)}
              type="button"
            >
              <span
                className={styles.roleIcon}
                style={{ background: roleColors[cred.user.role] }}
              >
                {roleIcons[cred.user.role]}
              </span>
              <span>
                <p className={styles.quickBtnRole}>{roleLabels[cred.user.role]}</p>
                <p className={styles.quickBtnName}>
                  {cred.user.firstname} {cred.user.lastname}
                </p>
              </span>
              <span className={styles.quickBtnHint}>{cred.username}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
