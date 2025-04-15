import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface PasswordResetProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

const PasswordReset: React.FC<PasswordResetProps> = ({
  onSuccess,
  onError,
}) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await resetPassword({ email });
      setSubmitted(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Password reset request failed';
      setError(errorMessage);
      if (onError && err instanceof Error) {
        onError(err);
      }
    }
  };

  if (submitted) {
    return (
      <div>
        <h3>Password Reset Email Sent</h3>
        <p>
          If an account exists with the email {email}, you will receive password
          reset instructions.
        </p>
        <button onClick={() => setSubmitted(false)}>Try Another Email</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>Reset Password</h3>
      <p>
        Please enter your email address to receive password reset instructions.
      </p>
      <div>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit">Reset Password</button>
    </form>
  );
};

export default PasswordReset;
