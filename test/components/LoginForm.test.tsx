import React from 'react';
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from '@testing-library/react';
import { LoginForm } from '../../src';

// Import the mock directly
const useAuth = require('../__mocks__/useAuth');
const { mockFunctions } = useAuth;
const { AuthProvider: MockAuthProvider } = useAuth;

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

describe('LoginForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFunctions.reset();
  });

  it('renders login form with all fields', () => {
    render(
      <MockAuthProvider>
        <LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />
      </MockAuthProvider>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('handles form submission with valid data', async () => {
    // Mock the login function with a resolved promise
    let resolveLoginPromise: (value: any) => void;
    const loginPromise = new Promise(resolve => {
      resolveLoginPromise = resolve;
    });
    mockFunctions.login.mockImplementation(() => loginPromise);

    render(
      <MockAuthProvider>
        <LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />
      </MockAuthProvider>
    );

    // Fill in the form fields
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button'));

    // Check loading state
    await waitFor(() => {
      const buttonBeforeResolve = screen.getByRole('button');
      expect(buttonBeforeResolve).toBeDisabled();
      expect(buttonBeforeResolve).toHaveTextContent('Logging in...');
    });

    // Resolve the login promise
    await act(async () => {
      resolveLoginPromise({
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        user: { id: 1, email: 'test@example.com' },
      });
    });

    // Verify login was called with correct data
    expect(mockFunctions.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });

    // Verify onSuccess was called
    expect(mockOnSuccess).toHaveBeenCalled();

    // Check that loading state is cleared
    await waitFor(() => {
      const buttonAfterResolve = screen.getByRole('button');
      expect(buttonAfterResolve).not.toBeDisabled();
      expect(buttonAfterResolve).toHaveTextContent('Log In');
    });
  });

  it('displays validation errors for invalid input', async () => {
    render(
      <MockAuthProvider>
        <LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />
      </MockAuthProvider>
    );

    await act(async () => {
      // Submit without filling fields
      fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    });

    expect(screen.getByLabelText(/email/i)).toBeInvalid();
    expect(screen.getByLabelText(/password/i)).toBeInvalid();
  });

  it('handles API errors', async () => {
    const mockError = new Error('Invalid credentials');
    let rejectLoginPromise: (error: Error) => void;
    const loginPromise = new Promise<void>((_, reject) => {
      rejectLoginPromise = reject;
    });
    mockFunctions.login.mockImplementation(() => loginPromise);

    render(
      <MockAuthProvider>
        <LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />
      </MockAuthProvider>
    );

    // Fill in the form fields
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button'));

    // Check loading state
    await waitFor(() => {
      const buttonBeforeReject = screen.getByRole('button');
      expect(buttonBeforeReject).toBeDisabled();
      expect(buttonBeforeReject).toHaveTextContent('Logging in...');
    });

    // Reject the login promise
    await act(async () => {
      rejectLoginPromise(mockError);
    });

    // Wait for the error to be handled
    expect(mockOnError).toHaveBeenCalledWith(mockError);

    // Check that button is not disabled and shows original text
    await waitFor(() => {
      const buttonAfterReject = screen.getByRole('button');
      expect(buttonAfterReject).not.toBeDisabled();
      expect(buttonAfterReject).toHaveTextContent('Log In');
    });
  });

  it('shows loading state during submission', async () => {
    let resolveLoginPromise: (value: any) => void;
    const loginPromise = new Promise(resolve => {
      resolveLoginPromise = resolve;
    });
    mockFunctions.login.mockImplementation(() => loginPromise);

    render(
      <MockAuthProvider>
        <LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />
      </MockAuthProvider>
    );

    // Fill in the form fields
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button'));

    // Check loading state
    await waitFor(() => {
      const buttonBeforeResolve = screen.getByRole('button');
      expect(buttonBeforeResolve).toBeDisabled();
      expect(buttonBeforeResolve).toHaveTextContent('Logging in...');
    });

    // Resolve the login promise
    await act(async () => {
      resolveLoginPromise({
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        user: { id: 1, email: 'test@example.com' },
      });
    });

    // Check that loading state is cleared
    await waitFor(() => {
      const buttonAfterResolve = screen.getByRole('button');
      expect(buttonAfterResolve).not.toBeDisabled();
      expect(buttonAfterResolve).toHaveTextContent('Log In');
    });
  });
});
