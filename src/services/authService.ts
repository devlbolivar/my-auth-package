import axios from 'axios';
import { getAuthConfig, getMemoryStorage } from '../config/authConfig';
import {
  AuthConfig,
  AuthError,
  AuthResult,
  AuthToken,
  LoginCredentials,
  RegisterCredentials,
  User,
  ResetPasswordRequest,
  VerifyCodeRequest,
} from '../types/auth';
import { createAuthHttpClient } from '../infrastructure/http';
import { Result, ok, err } from '../core/types/result';

interface CookieOptions {
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

const createAuthError = (error: unknown): AuthError => {
  if (axios.isAxiosError(error)) {
    return new AuthError(
      error.response?.data?.message || error.message,
      error.response?.data?.code || 'request_error',
      error.response?.status
    );
  }
  return new AuthError(
    error instanceof Error ? error.message : 'An unknown error occurred',
    'unknown_error'
  );
};

// Cookie utilities
const setCookie = (
  name: string,
  value: string,
  expires?: Date,
  options?: CookieOptions
): void => {
  const config = getAuthConfig();
  const cookieOptions = config.cookieOptions;

  let cookie = `${name}=${encodeURIComponent(value)}`;

  if (expires) {
    cookie += `; expires=${expires.toUTCString()}`;
  }

  if (cookieOptions.path || options?.path) {
    cookie += `; path=${options?.path || cookieOptions.path}`;
  }

  if (cookieOptions.domain || options?.domain) {
    cookie += `; domain=${options?.domain || cookieOptions.domain}`;
  }

  if (cookieOptions.secure || options?.secure) {
    cookie += '; secure';
  }

  if (cookieOptions.sameSite || options?.sameSite) {
    cookie += `; samesite=${options?.sameSite || cookieOptions.sameSite}`;
  }

  document.cookie = cookie;
};

const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return decodeURIComponent(
      parts
        .pop()
        ?.split(';')
        .shift() || ''
    );
  }
  return null;
};

const removeCookie = (name: string, options?: CookieOptions): void => {
  const config = getAuthConfig();
  const cookieOptions = config.cookieOptions;

  let cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;

  if (cookieOptions.path || options?.path) {
    cookie += `; path=${options?.path || cookieOptions.path}`;
  }

  if (cookieOptions.domain || options?.domain) {
    cookie += `; domain=${options?.domain || cookieOptions.domain}`;
  }

  document.cookie = cookie;
};

// Token handling
interface TokenData {
  token: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

const getStoredTokens = (): TokenData => {
  const config = getAuthConfig();

  switch (config.tokenStorage) {
    case 'localStorage':
      return {
        token: localStorage.getItem('auth_token'),
        refreshToken: localStorage.getItem('auth_refresh_token'),
        expiresAt: localStorage.getItem('auth_token_expiration')
          ? parseInt(localStorage.getItem('auth_token_expiration') || '0', 10)
          : null,
      };
    case 'sessionStorage':
      return {
        token: sessionStorage.getItem('auth_token'),
        refreshToken: sessionStorage.getItem('auth_refresh_token'),
        expiresAt: sessionStorage.getItem('auth_token_expiration')
          ? parseInt(sessionStorage.getItem('auth_token_expiration') || '0', 10)
          : null,
      };
    case 'cookie':
      return {
        token: getCookie('auth_token'),
        refreshToken: getCookie('auth_refresh_token'),
        expiresAt: getCookie('auth_token_expiration')
          ? parseInt(getCookie('auth_token_expiration') || '0', 10)
          : null,
      };
    case 'memory':
      const memory = getMemoryStorage();
      return {
        token: memory.token,
        refreshToken: memory.refreshToken,
        expiresAt: memory.tokenExpiration,
      };
    default:
      return { token: null, refreshToken: null, expiresAt: null };
  }
};

const storeTokens = (
  token: string,
  refreshToken?: string,
  expiresIn?: number
): void => {
  const config = getAuthConfig();
  const now = new Date();
  const expiresInMs = (expiresIn || config.tokenExpiration) * 1000;
  const expiresAt = now.getTime() + expiresInMs;

  switch (config.tokenStorage) {
    case 'localStorage':
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_token_expiration', expiresAt.toString());
      if (refreshToken) {
        localStorage.setItem('auth_refresh_token', refreshToken);
      }
      break;
    case 'sessionStorage':
      sessionStorage.setItem('auth_token', token);
      sessionStorage.setItem('auth_token_expiration', expiresAt.toString());
      if (refreshToken) {
        sessionStorage.setItem('auth_refresh_token', refreshToken);
      }
      break;
    case 'cookie':
      const expires = new Date(expiresAt);
      setCookie('auth_token', token, expires);
      setCookie('auth_token_expiration', expiresAt.toString(), expires);
      if (refreshToken) {
        setCookie('auth_refresh_token', refreshToken, expires);
      }
      break;
    case 'memory':
      const memory = getMemoryStorage();
      memory.token = token;
      memory.refreshToken = refreshToken || null;
      memory.tokenExpiration = expiresAt;
      break;
  }
};

const clearTokens = (): void => {
  const config = getAuthConfig();

  switch (config.tokenStorage) {
    case 'localStorage':
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_refresh_token');
      localStorage.removeItem('auth_token_expiration');
      break;
    case 'sessionStorage':
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_refresh_token');
      sessionStorage.removeItem('auth_token_expiration');
      break;
    case 'cookie':
      removeCookie('auth_token');
      removeCookie('auth_refresh_token');
      removeCookie('auth_token_expiration');
      break;
    case 'memory':
      const memory = getMemoryStorage();
      memory.token = null;
      memory.refreshToken = null;
      memory.tokenExpiration = null;
      break;
  }
};

// Token validation
const shouldRefreshToken = (): boolean => {
  const config = getAuthConfig();
  if (!config.autoRefresh) return false;

  const { expiresAt } = getStoredTokens();
  if (!expiresAt) return false;

  const now = new Date().getTime();
  const refreshThreshold = config.refreshBeforeExpiration * 1000;

  return expiresAt - now < refreshThreshold;
};

const isTokenExpired = (): boolean => {
  const { expiresAt } = getStoredTokens();
  if (!expiresAt) return true;

  return new Date().getTime() >= expiresAt;
};

// Authentication service
export const createAuthService = (config: AuthConfig) => {
  const httpClient = createAuthHttpClient(config);

  const handleAuthResponse = async (
    response: Result<{ user: User; token: AuthToken }, Error>
  ): Promise<AuthResult<{ user: User; token: AuthToken }>> => {
    if (!response.success) {
      return { success: false, error: createAuthError(response.error) };
    }
    const { accessToken, refreshToken, expiresIn } = response.value.token;
    storeTokens(accessToken, refreshToken, expiresIn);
    return { success: true, value: response.value };
  };

  const login = async (
    credentials: LoginCredentials
  ): Promise<AuthResult<{ user: User; token: AuthToken }>> => {
    try {
      const response = await httpClient.post<{ user: User; token: AuthToken }>(
        '/auth/login',
        credentials
      );
      return handleAuthResponse({ success: true, value: response.data });
    } catch (error) {
      return err(createAuthError(error));
    }
  };

  const register = async (
    credentials: RegisterCredentials
  ): Promise<AuthResult<{ user: User; token: AuthToken }>> => {
    try {
      const response = await httpClient.post<{ user: User; token: AuthToken }>(
        '/auth/register',
        credentials
      );
      return handleAuthResponse({ success: true, value: response.data });
    } catch (error) {
      return err(createAuthError(error));
    }
  };

  const logout = async (): Promise<AuthResult<void>> => {
    try {
      await httpClient.post('/auth/logout');
      clearTokens();
      return { success: true, value: undefined };
    } catch (error) {
      return err(createAuthError(error));
    }
  };

  const refreshToken = async (): Promise<AuthResult<{
    user: User;
    token: AuthToken;
  }>> => {
    try {
      const { refreshToken } = getStoredTokens();
      if (!refreshToken) {
        return err(
          new AuthError('No refresh token available', 'refresh_token_missing')
        );
      }

      const response = await httpClient.post('/auth/refresh', { refreshToken });
      return handleAuthResponse(ok(response.data));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return err(
          new AuthError(
            'Token refresh failed',
            'refresh_error',
            error.response?.status
          )
        );
      }
      return err(new AuthError('Token refresh failed', 'refresh_error'));
    }
  };

  const resetPassword = async (
    data: ResetPasswordRequest
  ): Promise<AuthResult<void>> => {
    try {
      await httpClient.post('/auth/password-reset', data);
      return { success: true, value: undefined };
    } catch (error) {
      return err(createAuthError(error));
    }
  };

  const verifyEmail = async (
    data: VerifyCodeRequest
  ): Promise<AuthResult<void>> => {
    try {
      await httpClient.post('/auth/verify-email', data);
      return { success: true, value: undefined };
    } catch (error) {
      return err(createAuthError(error));
    }
  };

  const getCurrentUser = async (): Promise<AuthResult<User>> => {
    try {
      const response = await httpClient.get<User>('/auth/me');
      return { success: true, value: response.data };
    } catch (error) {
      return err(createAuthError(error));
    }
  };

  const isAuthenticated = async (): Promise<boolean> => {
    const { token } = getStoredTokens();
    if (!token) return false;

    if (isTokenExpired()) {
      if (shouldRefreshToken()) {
        const result = await refreshToken();
        return result.success;
      }
      return false;
    }

    return true;
  };

  const resendCode = async (data: {
    email: string;
  }): Promise<AuthResult<void>> => {
    try {
      await httpClient.post('/auth/resend-code', data);
      return { success: true, value: undefined };
    } catch (error) {
      return err(createAuthError(error));
    }
  };

  return {
    login,
    register,
    logout,
    refreshToken,
    resetPassword,
    verifyEmail,
    getCurrentUser,
    isAuthenticated,
    resendCode,
  };
};

export type AuthService = ReturnType<typeof createAuthService>;

// Create and export a default instance
const defaultAuthService = createAuthService(getAuthConfig());

// Export utility functions
export { isTokenExpired, shouldRefreshToken, clearTokens, getStoredTokens };

// Export individual methods
export const {
  login,
  register,
  logout,
  resetPassword,
  verifyEmail,
  refreshToken: refreshAuthToken,
  getCurrentUser,
  isAuthenticated,
  resendCode,
} = defaultAuthService;

export default defaultAuthService;
