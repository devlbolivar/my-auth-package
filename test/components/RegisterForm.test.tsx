import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegisterForm } from '../../src';

// Import the mock directly
const useAuth = require('../__mocks__/useAuth');
const { mockFunctions } = useAuth;

// Mock the useAuth hook
jest.mock('../../src/hooks/useAuth', () => {
  return require('../__mocks__/useAuth');
});

// Also mock the AuthContext to use our mock
jest.mock('../../src/context/AuthContext', () => {
  const useAuthMock = require('../__mocks__/useAuth');
  return {
    useAuth: useAuthMock,
  };
});

describe('RegisterForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFunctions.reset();
  });

  it('renders register form correctly', () => {
    render(<RegisterForm onSuccess={mockOnSuccess} onError={mockOnError} />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /register/i })
    ).toBeInTheDocument();
  });

  it('validates form fields', async () => {
    render(<RegisterForm onSuccess={mockOnSuccess} onError={mockOnError} />);

    // Get the form element
    const form = screen.getByRole('form');

    // Submit empty form
    fireEvent.submit(form);

    // Wait for validation errors to appear
    await waitFor(() => {
      // Get the input fields
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      // Check for validation errors in their respective parent divs
      expect(emailInput.parentElement?.textContent).toMatch(
        /email is required/i
      );
      expect(passwordInput.parentElement?.textContent).toMatch(
        /password is required/i
      );
      expect(confirmPasswordInput.parentElement?.textContent).toMatch(
        /confirm password is required/i
      );
    });

    // Fill out form with invalid data
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'invalidemail' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'short' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'different' },
    });

    // Submit form with invalid data
    fireEvent.submit(form);

    // Wait for updated validation errors
    await waitFor(() => {
      // Get the input fields
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      // Check for validation errors in their respective parent divs
      expect(emailInput.parentElement?.textContent).toMatch(
        /invalid email format/i
      );
      expect(passwordInput.parentElement?.textContent).toMatch(
        /password must be at least 8 characters/i
      );
      expect(confirmPasswordInput.parentElement?.textContent).toMatch(
        /passwords do not match/i
      );
    });
  });

  it('handles successful registration', async () => {
    // Setup mock to resolve successfully
    mockFunctions.register.mockResolvedValueOnce({
      success: true,
      value: {
        user: { id: 1, email: 'test@example.com' },
        token: 'test-token',
      },
    });

    render(<RegisterForm onSuccess={mockOnSuccess} onError={mockOnError} />);

    // Fill out form with valid data
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    });

    // Submit form
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => {
      expect(mockFunctions.register).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('handles registration error', async () => {
    // Setup mock to reject with error
    const mockError = new Error('Registration failed');
    mockFunctions.register.mockRejectedValueOnce(mockError);

    render(<RegisterForm onSuccess={mockOnSuccess} onError={mockOnError} />);

    // Fill out form with valid data
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    });

    // Submit form
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(mockError);
      expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during registration', async () => {
    const registerPromise = new Promise(resolve => setTimeout(resolve, 50));
    mockFunctions.register.mockImplementationOnce(() => registerPromise);

    render(<RegisterForm onSuccess={mockOnSuccess} onError={mockOnError} />);

    // Fill out form with valid data
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    });

    // Submit form
    fireEvent.submit(screen.getByRole('form'));

    // Check for loading state
    expect(screen.getByRole('button', { name: /registering/i })).toBeDisabled();

    // Wait for the promise to resolve
    await waitFor(() => {}, { timeout: 100 });
  });
});
