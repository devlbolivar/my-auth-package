import { ReactNode } from 'react';
import { AxiosRequestConfig } from 'axios';

// User related types
export interface User {
  id: string | number;
  email: string;
  name?: string;
  [key: string]: any;
}

// Auth credential types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name?: string;
  [key: string]: any;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface VerifyCodeRequest {
  code: string;
  email?: string;
}

// API response types
export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

// Configuration types
export interface AuthConfig {
  baseUrl: string;
  endpoints: {
    login: string;
    register: string;
    logout: string;
    refresh: string;
    passwordReset: string;
    verifyEmail: string;
  };
  tokenStorage: 'localStorage' | 'sessionStorage' | 'cookie' | 'memory';
}

// Auth context types
export interface AuthContextType {
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

export interface AuthProviderProps {
  children: ReactNode;
  onLoginSuccess?: (user: User) => void;
  onLoginError?: (error: Error) => void;
  onLogoutSuccess?: () => void;
  onRegisterSuccess?: (user: User) => void;
  onRegisterError?: (error: Error) => void;
}

// Component props
export interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export interface RegisterFormProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  additionalFields?: ReactNode;
}

export interface PasswordResetProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export interface VerificationPromptProps {
  email?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}
