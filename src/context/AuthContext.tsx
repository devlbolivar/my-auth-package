// src/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import {
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  resetPassword as apiResetPassword,
  verifyEmail as apiVerifyEmail,
  refreshAuthToken as apiRefreshToken,
  resendCode as apiResendCode,
  isTokenExpired,
  shouldRefreshToken,
  clearTokens,
  getStoredTokens,
} from '../services/authService';
import {
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordRequest,
  VerifyCodeRequest,
  User,
  AuthError,
} from '../types/auth';
import { getAuthConfig } from '../config/authConfig';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | Error | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (data: ResetPasswordRequest) => Promise<void>;
  verifyEmail: (data: VerifyCodeRequest) => Promise<void>;
  refreshToken: () => Promise<void>;
  resendCode: (data: { email: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  onLoginSuccess?: (user: User) => void;
  onLoginError?: (error: Error) => void;
  onLogoutSuccess?: () => void;
  onRegisterSuccess?: (user: User) => void;
  onRegisterError?: (error: Error) => void;
  autoRefreshInterval?: number; // in milliseconds
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  onLoginSuccess,
  onLoginError,
  onLogoutSuccess,
  onRegisterSuccess,
  onRegisterError,
  autoRefreshInterval = 60000, // default to check every minute
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<AuthError | Error | null>(null);
  const refreshIntervalRef = useRef<number | null>(null);

  // Check for existing token and user on initial load
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        // Check if token is expired
        if (isTokenExpired()) {
          // If token is expired but we have a refresh token, try to refresh
          const { refreshToken: storedRefreshToken } = getStoredTokens();
          if (storedRefreshToken) {
            refreshToken()
              .catch((err: Error) => {
                console.error('Failed to refresh token on init:', err);
                clearUserAndTokens();
              })
              .finally(() => {
                setIsLoading(false);
              });
            return;
          }

          // If no refresh token, clear everything
          clearUserAndTokens();
          setIsLoading(false);
          return;
        }

        // Token is valid, load user
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (error) {
            console.error('Failed to parse stored user data:', error);
            clearUserAndTokens();
          }
        }
      } catch (err) {
        console.error('Error during auth initialization:', err);
        clearUserAndTokens();
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();

    // Start token refresh interval
    startRefreshTokenInterval();

    // Cleanup on unmount
    return () => {
      stopRefreshTokenInterval();
    };
  }, []);

  // Setup token refresh interval
  const startRefreshTokenInterval = useCallback(() => {
    if (refreshIntervalRef.current) {
      window.clearInterval(refreshIntervalRef.current);
    }

    const config = getAuthConfig();
    if (!config.autoRefresh) return;

    refreshIntervalRef.current = window.setInterval(() => {
      if (shouldRefreshToken()) {
        refreshToken().catch(err => {
          console.error('Scheduled token refresh failed:', err);
          // Do not logout on scheduled refresh failures to prevent
          // disruption to user experience
        });
      }
    }, autoRefreshInterval);
  }, [autoRefreshInterval]);

  // Cleanup refresh interval
  const stopRefreshTokenInterval = useCallback(() => {
    if (refreshIntervalRef.current) {
      window.clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  const storeUser = (userData: User) => {
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setUser(userData);
  };

  const clearUserAndTokens = () => {
    clearTokens();
    localStorage.removeItem('auth_user');
    setUser(null);
    setError(null);
  };

  const refreshToken = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await apiRefreshToken();
      if (!result.success) {
        throw result.error;
      }
      storeUser(result.value.user);
    } catch (error) {
      // If token refresh fails, log the user out
      clearUserAndTokens();
      setError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await apiLogin(credentials);
      if (!result.success) {
        throw result.error;
      }
      storeUser(result.value.user);
      // Start token refresh interval
      startRefreshTokenInterval();
      onLoginSuccess?.(result.value.user);
    } catch (error) {
      setError(error as Error);
      onLoginError?.(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await apiRegister(credentials);
      if (!result.success) {
        throw result.error;
      }
      storeUser(result.value.user);
      // Start token refresh interval
      startRefreshTokenInterval();
      onRegisterSuccess?.(result.value.user);
    } catch (error) {
      setError(error as Error);
      onRegisterError?.(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await apiLogout();
      if (!result.success) {
        throw result.error;
      }
      // Stop token refresh interval
      stopRefreshTokenInterval();
      clearUserAndTokens();
      onLogoutSuccess?.();
    } catch (error) {
      // Still remove user data even if the logout API call fails
      stopRefreshTokenInterval();
      clearUserAndTokens();
      setError(error as Error);
      onLogoutSuccess?.();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (data: ResetPasswordRequest) => {
    try {
      setError(null);
      const result = await apiResetPassword(data);
      if (!result.success) {
        throw result.error;
      }
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const verifyEmail = async (data: VerifyCodeRequest) => {
    try {
      setError(null);
      const result = await apiVerifyEmail(data);
      if (!result.success) {
        throw result.error;
      }
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const resendCode = async (data: { email: string }) => {
    try {
      setError(null);
      const result = await apiResendCode(data);
      if (!result.success) {
        throw result.error;
      }
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        resetPassword,
        verifyEmail,
        refreshToken,
        resendCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
