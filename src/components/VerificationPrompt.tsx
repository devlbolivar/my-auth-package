import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface VerificationPromptProps {
  email?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onResend?: () => void;
}

const VerificationPrompt: React.FC<VerificationPromptProps> = ({
  email: initialEmail,
  onSuccess,
  onError,
  onResend,
}) => {
  const auth = useAuth();
  const { verifyEmail, resendCode, isLoading } = auth;
  const [email, setEmail] = useState(initialEmail || '');
  const [code, setCode] = useState('');
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationError(null);
    setIsSubmitting(true);

    // Validate code format
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      setValidationError('Code must be 6 digits');
      setIsSubmitting(false);
      return;
    }

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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError(null);
    setValidationError(null);

    try {
      await resendCode({ email });
      if (onResend) {
        onResend();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to resend code';
      setError(errorMessage);
      if (onError && err instanceof Error) {
        onError(err);
      }
    } finally {
      setIsResending(false);
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

  const isFormDisabled = isLoading || isSubmitting;

  return (
    <form onSubmit={handleSubmit}>
      <h3>Verify Your Email</h3>
      <p>Please enter the verification code sent to your email.</p>

      {!initialEmail && (
        <div>
          <label htmlFor="verification-email">Email:</label>
          <input
            id="verification-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={isFormDisabled}
          />
        </div>
      )}

      <div>
        <label htmlFor="verification-code">Verification Code:</label>
        <input
          id="verification-code"
          type="text"
          value={code}
          onChange={e => setCode(e.target.value)}
          required
          placeholder="Enter verification code"
          pattern="[0-9]{6}"
          title="Please enter a 6-digit verification code"
          disabled={isFormDisabled}
          aria-label="Verification Code"
        />
      </div>

      {validationError && <p style={{ color: 'red' }}>{validationError}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit" disabled={isFormDisabled}>
        {isFormDisabled ? 'Verifying...' : 'Verify Email'}
      </button>
      <button type="button" onClick={handleResend} disabled={isResending}>
        {isResending ? 'Resending...' : 'Resend Code'}
      </button>
    </form>
  );
};

export default VerificationPrompt;
