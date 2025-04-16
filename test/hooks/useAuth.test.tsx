import React from 'react';
import { renderHook, act } from '@testing-library/react';
import useAuth from '../../src/hooks/useAuth';
import { AuthProvider } from '../../src/context/AuthContext';
import '@testing-library/jest-dom';

// Mock localStorage for testing
const localStorageMock = (function() {
  let store: Record<string, string> = {};
  return {
    getItem: function(key: string) {
      return store[key] || null;
    },
    setItem: function(key: string, value: string) {
      store[key] = value;
    },
    removeItem: function(key: string) {
      delete store[key];
    },
    clear: function() {
      store = {};
    },
  };
})();

// Replace global localStorage
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock the auth service
jest.mock('../../src/services/authService', () => ({
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  refreshAuthToken: jest.fn(),
  verifyEmail: jest.fn(),
  resetPassword: jest.fn(),
  isTokenExpired: jest.fn(),
  shouldRefreshToken: jest.fn(),
  clearTokens: jest.fn(),
  getStoredTokens: jest.fn(),
  storeTokens: jest.fn(),
}));

// Import the mocked functions
const authService = require('../../src/services/authService');

describe('useAuth', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    // Reset auth service mock implementations
    authService.login.mockReset();
    authService.register.mockReset();
    authService.logout.mockReset();
    authService.refreshAuthToken.mockReset();
    authService.verifyEmail.mockReset();
    authService.resetPassword.mockReset();
    authService.isTokenExpired.mockReturnValue(false);
    authService.shouldRefreshToken.mockReturnValue(false);
    authService.getStoredTokens.mockReturnValue({
      token: null,
      refreshToken: null,
    });

    // Mock storeTokens to update localStorage
    authService.storeTokens.mockImplementation(
      (token: string, refreshToken?: string, expiresIn?: number) => {
        localStorage.setItem('auth_token', token);
        if (refreshToken) {
          localStorage.setItem('auth_refresh_token', refreshToken);
        }
        if (expiresIn) {
          localStorage.setItem(
            'auth_token_expiration',
            (Date.now() + expiresIn * 1000).toString()
          );
        }
      }
    );

    // Mock clearTokens to clear localStorage
    authService.clearTokens.mockImplementation(() => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_refresh_token');
      localStorage.removeItem('auth_token_expiration');
    });
  });

  describe('login', () => {
    it('updates auth state on successful login', async () => {
      const mockResponse = {
        success: true,
        value: {
          user: { id: 1, email: 'test@example.com' },
          token: {
            accessToken: 'test-token',
            refreshToken: 'test-refresh-token',
            expiresIn: 3600,
          },
        },
      };

      // Mock the login function to also directly call storeTokens
      // This simulates what happens in the real AuthContext implementation
      authService.login.mockImplementation(async () => {
        authService.storeTokens(
          mockResponse.value.token.accessToken,
          mockResponse.value.token.refreshToken,
          mockResponse.value.token.expiresIn
        );
        // Store user in localStorage to simulate AuthContext behavior
        localStorage.setItem(
          'auth_user',
          JSON.stringify(mockResponse.value.user)
        );
        return mockResponse;
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      // Verify storeTokens was called
      expect(authService.storeTokens).toHaveBeenCalledWith(
        mockResponse.value.token.accessToken,
        mockResponse.value.token.refreshToken,
        mockResponse.value.token.expiresIn
      );

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockResponse.value.user);
      expect(localStorage.getItem('auth_token')).toBe(
        mockResponse.value.token.accessToken
      );
    });

    it('handles login errors', async () => {
      const mockError = new Error('Invalid credentials');
      authService.login.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.login({
            email: 'test@example.com',
            password: 'wrong-password',
          });
        } catch (error) {
          expect(error).toBe(mockError);
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('logout', () => {
    it('clears auth state on logout', async () => {
      // Set initial authenticated state
      localStorage.setItem('auth_token', 'test-token');
      localStorage.setItem(
        'auth_user',
        JSON.stringify({ id: 1, email: 'test@example.com' })
      );

      authService.logout.mockImplementation(async () => {
        authService.clearTokens();
        localStorage.removeItem('auth_user');
        return { success: true };
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('register', () => {
    it('updates auth state on successful registration', async () => {
      const mockResponse = {
        success: true,
        value: {
          user: { id: 1, email: 'test@example.com' },
          token: {
            accessToken: 'test-token',
            refreshToken: 'test-refresh-token',
            expiresIn: 3600,
          },
        },
      };

      // Mock the register function to also directly call storeTokens
      authService.register.mockImplementation(async () => {
        authService.storeTokens(
          mockResponse.value.token.accessToken,
          mockResponse.value.token.refreshToken,
          mockResponse.value.token.expiresIn
        );
        // Store user in localStorage to simulate AuthContext behavior
        localStorage.setItem(
          'auth_user',
          JSON.stringify(mockResponse.value.user)
        );
        return mockResponse;
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.register({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      // Verify storeTokens was called
      expect(authService.storeTokens).toHaveBeenCalledWith(
        mockResponse.value.token.accessToken,
        mockResponse.value.token.refreshToken,
        mockResponse.value.token.expiresIn
      );

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockResponse.value.user);
      expect(localStorage.getItem('auth_token')).toBe(
        mockResponse.value.token.accessToken
      );
    });

    it('handles registration errors', async () => {
      const mockError = new Error('Registration failed');
      authService.register.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.register({
            email: 'test@example.com',
            password: 'password123',
          });
        } catch (error) {
          expect(error).toBe(mockError);
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  it('provides initial state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles password reset', async () => {
    authService.resetPassword.mockResolvedValueOnce({ success: true });
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.resetPassword({ email: 'test@example.com' });
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles email verification', async () => {
    authService.verifyEmail.mockResolvedValueOnce({ success: true });
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.verifyEmail({
        code: '123456',
        email: 'test@example.com',
      });
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles token refresh', async () => {
    const mockResponse = {
      success: true,
      value: {
        user: { id: 1, email: 'test@example.com' },
        token: {
          accessToken: 'new-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600,
        },
      },
    };

    // Set initial refresh token
    localStorage.setItem('auth_refresh_token', 'old-refresh-token');

    // Mock the refreshAuthToken function
    authService.refreshAuthToken.mockImplementation(async () => {
      authService.storeTokens(
        mockResponse.value.token.accessToken,
        mockResponse.value.token.refreshToken,
        mockResponse.value.token.expiresIn
      );
      // Store user in localStorage to simulate AuthContext behavior
      localStorage.setItem(
        'auth_user',
        JSON.stringify(mockResponse.value.user)
      );
      return mockResponse;
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.refreshToken();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(authService.storeTokens).toHaveBeenCalledWith(
      mockResponse.value.token.accessToken,
      mockResponse.value.token.refreshToken,
      mockResponse.value.token.expiresIn
    );
    expect(localStorage.getItem('auth_token')).toBe(
      mockResponse.value.token.accessToken
    );
  });

  it('updates loading state during operations', async () => {
    const mockResponse = {
      success: true,
      value: {
        user: { id: 1, email: 'test@example.com' },
        token: {
          accessToken: 'test-token',
          refreshToken: 'test-refresh-token',
          expiresIn: 3600,
        },
      },
    };

    authService.login.mockImplementation(
      () =>
        new Promise(resolve => {
          setTimeout(() => {
            // Simulate storing tokens in the mock implementation
            authService.storeTokens(
              mockResponse.value.token.accessToken,
              mockResponse.value.token.refreshToken,
              mockResponse.value.token.expiresIn
            );
            // Store user in localStorage to simulate AuthContext behavior
            localStorage.setItem(
              'auth_user',
              JSON.stringify(mockResponse.value.user)
            );
            resolve(mockResponse);
          }, 100);
        })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      // Wait for login to complete
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('clears error state on successful operations', async () => {
    // First cause an error
    const mockError = new Error('Login failed');
    authService.login.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      try {
        await result.current.login({
          email: 'wrong@example.com',
          password: 'wrongpass',
        });
      } catch (error) {
        // Error is expected
      }
    });

    expect(result.current.error).toBeTruthy();

    // Then perform a successful operation
    const mockResponse = {
      success: true,
      value: {
        user: { id: 1, email: 'test@example.com' },
        token: {
          accessToken: 'test-token',
          refreshToken: 'test-refresh-token',
          expiresIn: 3600,
        },
      },
    };

    authService.login.mockImplementation(async () => {
      authService.storeTokens(
        mockResponse.value.token.accessToken,
        mockResponse.value.token.refreshToken,
        mockResponse.value.token.expiresIn
      );
      // Store user in localStorage to simulate AuthContext behavior
      localStorage.setItem(
        'auth_user',
        JSON.stringify(mockResponse.value.user)
      );
      return mockResponse;
    });

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(result.current.error).toBeNull();
  });
});
