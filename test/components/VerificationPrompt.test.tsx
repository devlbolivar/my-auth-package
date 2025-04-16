import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VerificationPrompt } from '../../src';

// Import the mock directly
const useAuth = require('../__mocks__/useAuth');
const mockFunctions = useAuth.mockFunctions;
const { AuthProvider } = useAuth;

// Mock the useAuth hook
jest.mock('../../src/hooks/useAuth', () => {
  return require('../__mocks__/useAuth');
});

// Also mock the AuthContext to use our mock
jest.mock('../../src/context/AuthContext', () => {
  const useAuthMock = require('../__mocks__/useAuth');
  return {
    AuthProvider: useAuthMock.AuthProvider,
    useAuth: useAuthMock,
  };
});

describe('VerificationPrompt', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();
  const mockOnResend = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFunctions.reset();
  });

  it('renders verification prompt with input field', () => {
    render(
      <AuthProvider>
        <VerificationPrompt
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          onResend={mockOnResend}
        />
      </AuthProvider>
    );

    expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /verify email/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /resend code/i })
    ).toBeInTheDocument();
  });

  it('handles verification code submission', async () => {
    // Setup the mock to resolve successfully
    mockFunctions.verifyEmail.mockResolvedValueOnce({});

    render(
      <AuthProvider>
        <VerificationPrompt
          email="test@example.com"
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          onResend={mockOnResend}
        />
      </AuthProvider>
    );

    // Fill out the verification code
    fireEvent.change(screen.getByLabelText(/verification code/i), {
      target: { value: '123456' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /verify email/i }));

    // Wait for the mock promise to resolve completely
    await waitFor(() => expect(mockFunctions.verifyEmail).toHaveBeenCalled());

    // Wait for the success callback to be called
    await waitFor(() => expect(mockOnSuccess).toHaveBeenCalled());

    // Verify the UI has updated correctly
    await waitFor(
      () => {
        expect(screen.getByText(/email verified/i)).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('displays validation error for invalid code', async () => {
    const { container } = render(
      <AuthProvider>
        <VerificationPrompt
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          onResend={mockOnResend}
        />
      </AuthProvider>
    );

    // Enter an invalid code (too short)
    fireEvent.change(screen.getByLabelText(/verification code/i), {
      target: { value: '123' },
    });

    // Get the form element and submit it directly
    const form = container.querySelector('form');
    expect(form).not.toBeNull();
    if (form) {
      fireEvent.submit(form);
    }

    // Wait for validation error to appear with detailed debugging
    await waitFor(
      () => {
        // Debug what's in the DOM
        screen.debug();
        expect(screen.getByText('Code must be 6 digits')).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('handles API errors', async () => {
    // Setup the mock to reject with an error
    const mockError = new Error('Invalid verification code');
    mockFunctions.verifyEmail.mockRejectedValueOnce(mockError);

    render(
      <AuthProvider>
        <VerificationPrompt
          email="test@example.com"
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          onResend={mockOnResend}
        />
      </AuthProvider>
    );

    // Fill out the verification code
    fireEvent.change(screen.getByLabelText(/verification code/i), {
      target: { value: '123456' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /verify email/i }));

    // Check that error callback was called and error is displayed
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(mockError);
      expect(screen.getByText(mockError.message)).toBeInTheDocument();
    });
  });

  it('handles resend code functionality', async () => {
    // Setup the mock to resolve successfully
    mockFunctions.resendCode.mockResolvedValueOnce({});

    render(
      <AuthProvider>
        <VerificationPrompt
          email="test@example.com"
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          onResend={mockOnResend}
        />
      </AuthProvider>
    );

    // Click the resend button
    fireEvent.click(screen.getByRole('button', { name: /resend code/i }));

    // Check that the mock was called with correct params
    await waitFor(() => {
      expect(mockFunctions.resendCode).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });

    // Check that resend callback was called
    await waitFor(() => {
      expect(mockOnResend).toHaveBeenCalled();
    });
  });

  it('shows loading state during verification', async () => {
    // Create a promise that won't resolve immediately to test loading state
    const verifyPromise = new Promise(resolve => setTimeout(resolve, 50));
    mockFunctions.verifyEmail.mockImplementationOnce(() => verifyPromise);

    render(
      <AuthProvider>
        <VerificationPrompt
          email="test@example.com"
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          onResend={mockOnResend}
        />
      </AuthProvider>
    );

    // Fill out the verification code
    fireEvent.change(screen.getByLabelText(/verification code/i), {
      target: { value: '123456' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /verify email/i }));

    // Check for loading state
    expect(screen.getByRole('button', { name: /verifying/i })).toBeDisabled();

    // Wait for the promise to resolve
    await waitFor(() => {}, { timeout: 100 });
  });
});
