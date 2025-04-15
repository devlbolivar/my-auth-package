// src/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  resetPassword as apiResetPassword,
  verifyEmail as apiVerifyEmail,
  refreshAuthToken as apiRefreshToken,
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordRequest,
  VerifyCodeRequest,
  User,
  AuthResponse,
} from '../api/authService';
import { AxiosRequestConfig } from 'axios';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    credentials: LoginCredentials,
    options?: AxiosRequestConfig
  ) => Promise<void>;
  register: (
    credentials: RegisterCredentials,
    options?: AxiosRequestConfig
  ) => Promise<void>;
  logout: (options?: AxiosRequestConfig) => Promise<void>;
  resetPassword: (
    data: ResetPasswordRequest,
    options?: AxiosRequestConfig
  ) => Promise<void>;
  verifyEmail: (
    data: VerifyCodeRequest,
    options?: AxiosRequestConfig
  ) => Promise<void>;
  refreshToken: (options?: AxiosRequestConfig) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  onLoginSuccess?: (user: User) => void;
  onLoginError?: (error: Error) => void;
  onLogoutSuccess?: () => void;
  onRegisterSuccess?: (user: User) => void;
  onRegisterError?: (error: Error) => void;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  onLoginSuccess,
  onLoginError,
  onLogoutSuccess,
  onRegisterSuccess,
  onRegisterError,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check for existing token and user on initial load
  useEffect(() => {
    const loadUserFromStorage = () => {
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Failed to parse stored user data');
        }
      }
      setIsLoading(false);
    };

    loadUserFromStorage();
  }, []);

  const storeUser = (userData: User) => {
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setUser(userData);
  };

  const login = async (
    credentials: LoginCredentials,
    options?: AxiosRequestConfig
  ) => {
    try {
      setIsLoading(true);
      const data: AuthResponse = await apiLogin(credentials, options);
      storeUser(data.user);
      onLoginSuccess?.(data.user);
    } catch (error) {
      onLoginError?.(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    credentials: RegisterCredentials,
    options?: AxiosRequestConfig
  ) => {
    try {
      setIsLoading(true);
      const data: AuthResponse = await apiRegister(credentials, options);
      storeUser(data.user);
      onRegisterSuccess?.(data.user);
    } catch (error) {
      onRegisterError?.(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (options?: AxiosRequestConfig) => {
    try {
      setIsLoading(true);
      await apiLogout(options);
      localStorage.removeItem('auth_user');
      setUser(null);
      onLogoutSuccess?.();
    } catch (error) {
      // Still remove user data even if the logout API call fails
      localStorage.removeItem('auth_user');
      setUser(null);
      onLogoutSuccess?.();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (
    data: ResetPasswordRequest,
    options?: AxiosRequestConfig
  ) => {
    return apiResetPassword(data, options);
  };

  const verifyEmail = async (
    data: VerifyCodeRequest,
    options?: AxiosRequestConfig
  ) => {
    return apiVerifyEmail(data, options);
  };

  const refreshToken = async (options?: AxiosRequestConfig) => {
    try {
      setIsLoading(true);
      const data = await apiRefreshToken(options);
      storeUser(data.user);
    } catch (error) {
      // If token refresh fails, log the user out
      localStorage.removeItem('auth_user');
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        resetPassword,
        verifyEmail,
        refreshToken,
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
