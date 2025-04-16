// src/types/auth.ts

import type { Result } from '../core/types/result';

/**
 * Cookie options interface
 */
export interface CookieOptions {
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Authentication configuration interface
 */
export interface AuthConfig {
  baseUrl: string;
  endpoints: {
    login: string;
    register: string;
    logout: string;
    refresh: string;
    passwordReset: string;
    verifyEmail: string;
    resendCode: string;
  };
  tokenStorage: 'localStorage' | 'sessionStorage' | 'cookie' | 'memory';
  tokenExpiration: number; // in seconds
  cookieOptions: CookieOptions;
  autoRefresh: boolean;
  refreshBeforeExpiration: number; // in seconds
  storage?: Storage;
  token: {
    headerName: string;
    csrfHeaderName?: string;
  };
}

/**
 * User interface representing the authenticated user
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  roles?: string[];
  [key: string]: any; // Allow for additional user properties
}

/**
 * Authentication token interface
 */
export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

/**
 * Authentication response interface
 */
export interface AuthResponse {
  user: User;
  token: AuthToken;
}

/**
 * Login credentials interface
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Registration credentials interface
 */
export interface RegisterCredentials {
  email: string;
  password: string;
  name?: string;
  [key: string]: any; // Allow for additional registration fields
}

/**
 * Password reset request interface
 */
export interface ResetPasswordRequest {
  email: string;
}

/**
 * Email verification request interface
 */
export interface VerifyCodeRequest {
  code: string;
  email?: string;
}

/**
 * Resend verification code request interface
 */
export interface ResendCodeRequest {
  email: string;
}

/**
 * Authentication result type
 */
export type AuthResult<T> = Result<T, AuthError>;

/**
 * Custom authentication error class
 */
export class AuthError extends Error {
  public code: string;
  public status?: number;

  constructor(message: string, code: string = 'auth_error', status?: number) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
  }
}
