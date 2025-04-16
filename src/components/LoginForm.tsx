// src/components/LoginForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  style?: React.CSSProperties;
  inputClassName?: string;
  buttonClassName?: string;
  errorClassName?: string;
  labelClassName?: string;
  formClassName?: string;
  buttonText?: string;
  showLabels?: boolean;
  emailPlaceholder?: string;
  passwordPlaceholder?: string;
  renderHeader?: () => React.ReactNode;
  renderFooter?: () => React.ReactNode;
  rememberMe?: boolean;
  socialLogins?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onError,
  className = '',
  style = {},
  inputClassName = '',
  buttonClassName = '',
  errorClassName = '',
  labelClassName = '',
  formClassName = '',
  buttonText = 'Log In',
  showLabels = true,
  emailPlaceholder = 'Email',
  passwordPlaceholder = 'Password',
  renderHeader,
  renderFooter,
  rememberMe = false,
  socialLogins = false,
}) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      if (onError && err instanceof Error) {
        onError(err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={className} style={style}>
      {renderHeader && renderHeader()}

      <form onSubmit={handleSubmit} className={formClassName}>
        <div>
          {showLabels && (
            <label htmlFor="login-email" className={labelClassName}>
              Email:
            </label>
          )}
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className={inputClassName}
            placeholder={emailPlaceholder}
            disabled={isSubmitting}
            aria-label="Email"
          />
        </div>
        <div>
          {showLabels && (
            <label htmlFor="login-password" className={labelClassName}>
              Password:
            </label>
          )}
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className={inputClassName}
            placeholder={passwordPlaceholder}
            disabled={isSubmitting}
            aria-label="Password"
          />
        </div>

        {rememberMe && (
          <div>
            <label htmlFor="login-remember">
              <input
                id="login-remember"
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
              />{' '}
              Remember me
            </label>
          </div>
        )}

        {error && (
          <p className={errorClassName} style={{ color: 'red' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          className={buttonClassName}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Logging in...' : buttonText}
        </button>

        {socialLogins && (
          <div style={{ marginTop: '20px' }}>
            <p>Or log in with:</p>
            <div>
              <button
                type="button"
                onClick={() => alert('Google login not implemented')}
              >
                Google
              </button>
              <button
                type="button"
                onClick={() => alert('Facebook login not implemented')}
              >
                Facebook
              </button>
            </div>
          </div>
        )}
      </form>

      {renderFooter && renderFooter()}
    </div>
  );
};

export default LoginForm;
