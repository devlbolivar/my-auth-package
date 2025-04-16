import { Result } from './result';

export type User = {
  id: string | number;
  email: string;
  name?: string;
  [key: string]: unknown;
};

export type AuthToken = {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
};

export type AuthState = {
  user: User | null;
  token: AuthToken | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterCredentials = LoginCredentials & {
  name?: string;
  [key: string]: unknown;
};

export type AuthError = {
  code: string;
  message: string;
  status?: number;
};

export type AuthResult<T> = Result<T, AuthError>;

export type AuthConfig = {
  baseUrl: string;
  endpoints: {
    login: string;
    register: string;
    logout: string;
    refresh: string;
    resetPassword: string;
    verifyEmail: string;
  };
  storage: {
    type: 'localStorage' | 'sessionStorage' | 'cookie';
    options?: {
      path?: string;
      domain?: string;
      secure?: boolean;
      sameSite?: 'strict' | 'lax' | 'none';
    };
  };
  token: {
    headerName: string;
    refreshHeaderName?: string;
    csrfHeaderName?: string;
  };
};
