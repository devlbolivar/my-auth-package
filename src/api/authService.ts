// src/api/authService.ts
import axios, { AxiosRequestConfig } from 'axios';
import { getFullUrl, getAuthConfig, getMemoryStorage } from './authConfig';
import {
  AuthResult,
  AuthToken,
  LoginCredentials,
  RegisterCredentials,
  User,
} from '../core/types/auth';
import { createAuthHttpClient } from '../infrastructure/http';
import { Result } from '../core/types/result';
import { AuthConfig } from '../types/auth';

// Add this interface near the beginning of the file
interface CookieOptions {
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

// Custom error class for auth errors
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

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
  expiresIn?: number; // Token expiration in seconds
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

// Cookie utilities
const setCookie = (
  name: string,
  value: string,
  expires?: Date,
  options?: CookieOptions
): void => {
  const config = getAuthConfig();
  const cookieOptions = config.cookieOptions as CookieOptions;

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
  const cookieOptions = config.cookieOptions as CookieOptions;

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
  expiresAt: number | null; // Timestamp in milliseconds
}

export const getStoredTokens = (): TokenData => {
  const config = getAuthConfig();

  if (config.tokenStorage === 'localStorage') {
    return {
      token: localStorage.getItem('auth_token'),
      refreshToken: localStorage.getItem('auth_refresh_token'),
      expiresAt: localStorage.getItem('auth_token_expiration')
        ? parseInt(localStorage.getItem('auth_token_expiration') || '0', 10)
        : null,
    };
  } else if (config.tokenStorage === 'sessionStorage') {
    return {
      token: sessionStorage.getItem('auth_token'),
      refreshToken: sessionStorage.getItem('auth_refresh_token'),
      expiresAt: sessionStorage.getItem('auth_token_expiration')
        ? parseInt(sessionStorage.getItem('auth_token_expiration') || '0', 10)
        : null,
    };
  } else if (config.tokenStorage === 'cookie') {
    return {
      token: getCookie('auth_token'),
      refreshToken: getCookie('auth_refresh_token'),
      expiresAt: getCookie('auth_token_expiration')
        ? parseInt(getCookie('auth_token_expiration') || '0', 10)
        : null,
    };
  } else if (config.tokenStorage === 'memory') {
    const memory = getMemoryStorage();
    return {
      token: memory.token,
      refreshToken: memory.refreshToken,
      expiresAt: memory.tokenExpiration,
    };
  }

  return { token: null, refreshToken: null, expiresAt: null };
};

export const storeTokens = (
  token: string,
  refreshToken?: string,
  expiresIn?: number
): void => {
  const config = getAuthConfig();

  // Calculate expiration
  const now = new Date();
  const expiresInMs = (expiresIn || config.tokenExpiration) * 1000;
  const expiresAt = now.getTime() + expiresInMs;

  if (config.tokenStorage === 'localStorage') {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_token_expiration', expiresAt.toString());
    if (refreshToken) {
      localStorage.setItem('auth_refresh_token', refreshToken);
    }
  } else if (config.tokenStorage === 'sessionStorage') {
    sessionStorage.setItem('auth_token', token);
    sessionStorage.setItem('auth_token_expiration', expiresAt.toString());
    if (refreshToken) {
      sessionStorage.setItem('auth_refresh_token', refreshToken);
    }
  } else if (config.tokenStorage === 'cookie') {
    const expires = new Date(expiresAt);
    setCookie('auth_token', token, expires);
    setCookie('auth_token_expiration', expiresAt.toString(), expires);
    if (refreshToken) {
      setCookie('auth_refresh_token', refreshToken, expires);
    }
  } else if (config.tokenStorage === 'memory') {
    const memory = getMemoryStorage();
    memory.token = token;
    memory.refreshToken = refreshToken || null;
    memory.tokenExpiration = expiresAt;
  }
};

export const clearTokens = (): void => {
  const config = getAuthConfig();

  if (config.tokenStorage === 'localStorage') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_token_expiration');
  } else if (config.tokenStorage === 'sessionStorage') {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_refresh_token');
    sessionStorage.removeItem('auth_token_expiration');
  } else if (config.tokenStorage === 'cookie') {
    removeCookie('auth_token');
    removeCookie('auth_refresh_token');
    removeCookie('auth_token_expiration');
  } else if (config.tokenStorage === 'memory') {
    const memory = getMemoryStorage();
    memory.token = null;
    memory.refreshToken = null;
    memory.tokenExpiration = null;
  }
};

// Check if token needs refresh
export const shouldRefreshToken = (): boolean => {
  const config = getAuthConfig();
  if (!config.autoRefresh) return false;

  const { expiresAt } = getStoredTokens();
  if (!expiresAt) return false;

  const now = new Date().getTime();
  const refreshThreshold = config.refreshBeforeExpiration * 1000;

  // If token expires within the threshold, it needs refreshing
  return expiresAt - now < refreshThreshold;
};

// Check if token is expired
export const isTokenExpired = (): boolean => {
  const { expiresAt } = getStoredTokens();
  if (!expiresAt) return true;

  const now = new Date().getTime();
  return now >= expiresAt;
};

// Security utilities for CSRF protection
let csrfToken: string | null = null;

export const getCsrfToken = (): string | null => {
  if (csrfToken) return csrfToken;

  // Try to get from meta tag
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  if (metaTag && metaTag.getAttribute('content')) {
    csrfToken = metaTag.getAttribute('content');
    return csrfToken;
  }

  // Try to get from cookie
  const csrfCookie = getCookie('csrf-token') || getCookie('XSRF-TOKEN');
  if (csrfCookie) {
    csrfToken = csrfCookie;
    return csrfToken;
  }

  return null;
};

export const setCsrfToken = (token: string): void => {
  csrfToken = token;
};

export const includeCredentials = (
  options?: AxiosRequestConfig
): AxiosRequestConfig => {
  return {
    ...options,
    withCredentials: true,
  };
};

export const includeCsrf = (
  options?: AxiosRequestConfig
): AxiosRequestConfig => {
  const token = getCsrfToken();
  if (!token) return options || {};

  return {
    ...options,
    headers: {
      ...options?.headers,
      'X-CSRF-Token': token,
      'X-XSRF-Token': token,
    },
  };
};

// Create an axios instance with auth header and CSRF protection
export const createAuthenticatedRequest = (options?: AxiosRequestConfig) => {
  const { token } = getStoredTokens();

  return {
    ...includeCsrf(options),
    withCredentials: true,
    headers: {
      ...options?.headers,
      Authorization: token ? `Bearer ${token}` : '',
    },
  };
};

// Handle API errors
const handleApiError = (error: any): never => {
  // Handle Axios errors
  if (error?.response) {
    const { status, data: errorData } = error.response;

    throw new AuthError(
      errorData?.message || 'API request failed',
      errorData?.code || 'api_error',
      status
    );
  }

  // Handle fetch errors
  if (error?.status) {
    const status = error.status;
    const errorData = error;

    throw new AuthError(
      errorData?.message || 'API request failed',
      errorData?.code || 'api_error',
      status
    );
  }

  // Handle other errors
  throw new AuthError(
    error?.message || 'Unknown error occurred',
    'unknown_error'
  );
};

// Auth API methods
export const login = async (
  credentials: LoginCredentials,
  options?: AxiosRequestConfig
): Promise<AuthResponse> => {
  try {
    const response = await axios.post<AuthResponse>(
      getFullUrl('login'),
      credentials,
      includeCredentials(options)
    );

    // Store CSRF token if it's in the response headers
    const responseCsrfToken =
      response.headers['x-csrf-token'] ||
      response.headers['csrf-token'] ||
      response.headers['xsrf-token'];
    if (responseCsrfToken) {
      setCsrfToken(responseCsrfToken);
    }

    if (response.data.token) {
      storeTokens(
        response.data.token,
        response.data.refreshToken,
        response.data.expiresIn
      );
    }

    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const register = async (
  credentials: RegisterCredentials,
  options?: AxiosRequestConfig
): Promise<AuthResponse> => {
  try {
    const response = await axios.post<AuthResponse>(
      getFullUrl('register'),
      credentials,
      options
    );

    if (response.data.token) {
      storeTokens(
        response.data.token,
        response.data.refreshToken,
        response.data.expiresIn
      );
    }

    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const logout = async (options?: AxiosRequestConfig): Promise<void> => {
  const { token } = getStoredTokens();

  try {
    if (token) {
      await axios.post(
        getFullUrl('logout'),
        {},
        createAuthenticatedRequest(options)
      );
    }
  } catch (error) {
    // Log error and throw it
    console.error('Logout API call failed:', error);
    throw handleApiError(error);
  } finally {
    // Clear tokens whether the API call succeeds or not
    clearTokens();
  }
};

export const resetPassword = async (
  data: ResetPasswordRequest,
  options?: AxiosRequestConfig
): Promise<void> => {
  try {
    await axios.post(getFullUrl('passwordReset'), data, options);
  } catch (error) {
    throw handleApiError(error);
  }
};

export const verifyEmail = async (
  data: VerifyCodeRequest,
  options?: AxiosRequestConfig
): Promise<void> => {
  try {
    await axios.post(getFullUrl('verifyEmail'), data, options);
  } catch (error) {
    throw handleApiError(error);
  }
};

export const resendCode = async (
  data: ResendCodeRequest,
  options?: AxiosRequestConfig
): Promise<void> => {
  try {
    await axios.post(getFullUrl('resendCode'), data, options);
  } catch (error) {
    throw handleApiError(error);
  }
};

export const refreshAuthToken = async (
  options?: AxiosRequestConfig
): Promise<AuthResponse> => {
  const { refreshToken } = getStoredTokens();

  if (!refreshToken) {
    throw new AuthError('No refresh token available', 'no_refresh_token');
  }

  try {
    const response = await axios.post<AuthResponse>(
      getFullUrl('refresh'),
      { refreshToken },
      options
    );

    if (response.data.token) {
      storeTokens(
        response.data.token,
        response.data.refreshToken || refreshToken,
        response.data.expiresIn
      );
    }

    return response.data;
  } catch (error) {
    // On refresh failure, clear tokens
    clearTokens();
    throw handleApiError(error);
  }
};

export const createAuthService = (config: AuthConfig) => {
  const httpClient = createAuthHttpClient(config);

  const handleAuthResponse = async (
    response: Result<{ user: User; token: AuthToken }, Error>
  ): Promise<AuthResult<{ user: User; token: AuthToken }>> => {
    if (!response.success) {
      return {
        success: false,
        error: new AuthError(
          response.error.message || 'Unknown error',
          'auth_error'
        ),
      };
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
        config.endpoints.login,
        credentials
      );
      return handleAuthResponse({ success: true, value: response.data });
    } catch (error) {
      return {
        success: false,
        error: new AuthError(
          error instanceof Error ? error.message : 'An unknown error occurred',
          'auth_error'
        ),
      };
    }
  };

  const register = async (
    credentials: RegisterCredentials
  ): Promise<AuthResult<{ user: User; token: AuthToken }>> => {
    try {
      const response = await httpClient.post<{ user: User; token: AuthToken }>(
        config.endpoints.register,
        credentials
      );
      return handleAuthResponse({ success: true, value: response.data });
    } catch (error) {
      return {
        success: false,
        error: new AuthError(
          error instanceof Error ? error.message : 'An unknown error occurred',
          'auth_error'
        ),
      };
    }
  };

  const logout = async (): Promise<AuthResult<void>> => {
    try {
      await httpClient.post(config.endpoints.logout);
      clearTokens();
      return { success: true, value: undefined };
    } catch (error) {
      return {
        success: false,
        error: new AuthError(
          error instanceof Error ? error.message : 'An unknown error occurred',
          'logout_error'
        ),
      };
    }
  };

  const refreshToken = async (): Promise<AuthResult<{
    user: User;
    token: AuthToken;
  }>> => {
    try {
      const { refreshToken } = getStoredTokens();
      if (!refreshToken) {
        return {
          success: false,
          error: new AuthError(
            'No refresh token available',
            'refresh_token_missing'
          ),
        };
      }

      const response = await httpClient.post(config.endpoints.refresh, {
        refreshToken,
      });
      return handleAuthResponse({ success: true, value: response.data });
    } catch (error) {
      return {
        success: false,
        error: new AuthError(
          error instanceof Error ? error.message : 'An unknown error occurred',
          'refresh_error'
        ),
      };
    }
  };

  const resetPassword = async (email: string): Promise<AuthResult<void>> => {
    try {
      await httpClient.post(config.endpoints.passwordReset, { email });
      return { success: true, value: undefined };
    } catch (error) {
      return {
        success: false,
        error: new AuthError(
          error instanceof Error ? error.message : 'An unknown error occurred',
          'reset_password_error'
        ),
      };
    }
  };

  const verifyEmail = async (
    code: string,
    email?: string
  ): Promise<AuthResult<void>> => {
    try {
      await httpClient.post(config.endpoints.verifyEmail, { code, email });
      return { success: true, value: undefined };
    } catch (error) {
      return {
        success: false,
        error: new AuthError(
          error instanceof Error ? error.message : 'An unknown error occurred',
          'verify_email_error'
        ),
      };
    }
  };

  const getCurrentUser = async (): Promise<AuthResult<User>> => {
    try {
      const response = await httpClient.get<User>(config.endpoints.login);
      return { success: true, value: response.data };
    } catch (error) {
      return {
        success: false,
        error: new AuthError(
          error instanceof Error ? error.message : 'An unknown error occurred',
          'get_user_error'
        ),
      };
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

  return {
    login,
    register,
    logout,
    refreshToken,
    resetPassword,
    verifyEmail,
    getCurrentUser,
    isAuthenticated,
  };
};

export type AuthService = ReturnType<typeof createAuthService>;
