import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface RegisterFormProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  additionalFields?: React.ReactNode;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onError,
  additionalFields,
}) => {
  const { register, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const errors: typeof validationErrors = {};

    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email format';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirm password is required';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await register({ name, email, password });
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      if (onError && err instanceof Error) {
        onError(err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = isLoading || isSubmitting;

  return (
    <form onSubmit={handleSubmit} role="form">
      <div>
        <label htmlFor="register-name">Name:</label>
        <input
          id="register-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          aria-label="Name"
          disabled={isFormDisabled}
        />
      </div>
      <div>
        <label htmlFor="register-email">Email:</label>
        <input
          id="register-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          aria-label="Email"
          disabled={isFormDisabled}
        />
        {validationErrors.email && (
          <p style={{ color: 'red' }}>{validationErrors.email}</p>
        )}
      </div>
      <div>
        <label htmlFor="register-password">Password:</label>
        <input
          id="register-password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          aria-label="Password"
          disabled={isFormDisabled}
        />
        {validationErrors.password && (
          <p style={{ color: 'red' }}>{validationErrors.password}</p>
        )}
      </div>
      <div>
        <label htmlFor="register-confirm-password">Confirm Password:</label>
        <input
          id="register-confirm-password"
          type="password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          aria-label="Confirm Password"
          disabled={isFormDisabled}
        />
        {validationErrors.confirmPassword && (
          <p style={{ color: 'red' }}>{validationErrors.confirmPassword}</p>
        )}
      </div>

      {additionalFields}

      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit" disabled={isFormDisabled}>
        {isFormDisabled ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
};

export default RegisterForm;
