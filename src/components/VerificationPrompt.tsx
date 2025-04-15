import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface VerificationPromptProps {
  email?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

const VerificationPrompt: React.FC<VerificationPromptProps> = ({
  email: initialEmail,
  onSuccess,
  onError,
}) => {
  const { verifyEmail } = useAuth();
  const [email, setEmail] = useState(initialEmail || '');
  const [code, setCode] = useState('');
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await verifyEmail({ code, email });
      setVerified(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Verification failed';
      setError(errorMessage);
      if (onError && err instanceof Error) {
        onError(err);
      }
    }
  };

  if (verified) {
    return (
      <div>
        <h3>Email Verified</h3>
        <p>Your email has been successfully verified.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>Verify Your Email</h3>
      <p>Please enter the verification code sent to your email.</p>

      {!initialEmail && (
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
      )}

      <div>
        <label>Verification Code:</label>
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value)}
          required
          placeholder="Enter verification code"
        />
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit">Verify Email</button>
    </form>
  );
};

export default VerificationPrompt;
