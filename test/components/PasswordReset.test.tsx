import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PasswordReset } from '../../src';

// Import the mock directly
const useAuth = require('../__mocks__/useAuth');
const { mockFunctions } = useAuth;
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

describe('PasswordReset', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFunctions.reset();
  });

  it('renders password reset form correctly', () => {
    render(
      <AuthProvider>
        <PasswordReset onSuccess={mockOnSuccess} onError={mockOnError} />
      </AuthProvider>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /reset password/i })
    ).toBeInTheDocument();
  });

  it('validates email format', async () => {
    render(
      <AuthProvider>
        <PasswordReset onSuccess={mockOnSuccess} onError={mockOnError} />
      </AuthProvider>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const form = screen.getByRole('form');

    // Test invalid email
    fireEvent.change(emailInput, { target: { value: 'invalidemail' } });
    fireEvent.submit(form);

    // Wait for validation error to appear
    await waitFor(
      () => {
        const errorElement = screen.getByText('Invalid email format');
        expect(errorElement).toBeInTheDocument();
        expect(errorElement.tagName.toLowerCase()).toBe('p');
        expect(errorElement).toHaveStyle({ color: 'red' });
      },
      { timeout: 1000 }
    );

    // Test valid email
    fireEvent.change(emailInput, { target: { value: 'valid@example.com' } });
    fireEvent.submit(form);

    // Wait for error to disappear
    await waitFor(
      () => {
        expect(
          screen.queryByText('Invalid email format')
        ).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('handles successful password reset request', async () => {
    // Setup the mock to resolve successfully
    mockFunctions.resetPassword.mockImplementationOnce(async () => {
      // Return a resolved promise after a short delay to allow state updates
      await new Promise(resolve => setTimeout(resolve, 10));
      return {};
    });

    render(
      <AuthProvider>
        <PasswordReset onSuccess={mockOnSuccess} onError={mockOnError} />
      </AuthProvider>
    );

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    // Check that the mock was called with correct params
    await waitFor(() => {
      expect(mockFunctions.resetPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });

    // Check that success callback was called
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    // Check for success message
    await waitFor(
      () => {
        expect(
          screen.getByText(/password reset email sent/i)
        ).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('handles API errors during password reset', async () => {
    // Setup the mock to reject with an error
    const mockError = new Error('User not found');
    mockFunctions.resetPassword.mockRejectedValueOnce(mockError);

    render(
      <AuthProvider>
        <PasswordReset onSuccess={mockOnSuccess} onError={mockOnError} />
      </AuthProvider>
    );

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    // Check that error callback was called and error is displayed
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(mockError);
      expect(screen.getByText(mockError.message)).toBeInTheDocument();
    });
  });

  it('shows loading state during password reset request', async () => {
    // Create a promise that won't resolve immediately to test loading state
    const resetPromise = new Promise(resolve => setTimeout(resolve, 50));
    mockFunctions.resetPassword.mockImplementationOnce(() => resetPromise);

    render(
      <AuthProvider>
        <PasswordReset onSuccess={mockOnSuccess} onError={mockOnError} />
      </AuthProvider>
    );

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    // Check for loading state
    expect(screen.getByRole('button', { name: /loading/i })).toBeDisabled();

    // Wait for the promise to resolve
    await waitFor(() => {}, { timeout: 100 });
  });
});
