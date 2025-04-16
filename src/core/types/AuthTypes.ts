import { TokenConfig } from './TokenTypes';

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

export interface User {
  id: string | number;
  email: string;
  name?: string;
  [key: string]: any;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
  expiresIn?: number;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface VerifyCodeRequest {
  code: string;
  email?: string;
}

export interface ResendCodeRequest {
  email: string;
}

export interface AuthConfig {
  baseUrl: string;
  endpoints: {
    login: string;
    register: string;
    logout: string;
    resetPassword: string;
    verifyEmail: string;
    refreshToken: string;
    resendCode: string;
  };
  tokenConfig: TokenConfig;
  csrfConfig?: {
    headerName: string;
    cookieName: string;
  };
}
