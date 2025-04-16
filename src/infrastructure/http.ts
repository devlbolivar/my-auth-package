import axios, {  AxiosInstance } from 'axios';
import type { AuthConfig, CookieOptions } from '../types/auth';
import { getAuthConfig, getMemoryStorage } from '../config/authConfig';

/**
 * Creates an authenticated HTTP client instance
 * @param config - Authentication configuration
 * @returns Axios instance with authentication interceptors
 */
export const createAuthHttpClient = (config: AuthConfig): AxiosInstance => {
  const instance = axios.create({
    baseURL: config.baseUrl,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor for adding auth token
  instance.interceptors.request.use(
    (config) => {
      const token = getStoredToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for handling token refresh
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If error is 401 and we haven't tried to refresh token yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const { refreshToken } = getStoredTokens();
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await instance.post('/auth/refresh', { refreshToken });
          const { token } = response.data;

          // Store the new token
          storeTokens(token.accessToken, token.refreshToken, token.expiresIn);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${token.accessToken}`;
          return instance(originalRequest);
        } catch (refreshError) {
          // If refresh fails, clear tokens and reject
          clearTokens();
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

// Token storage utilities
const getStoredToken = (): string | null => {
  const config = getAuthConfig();
  switch (config.tokenStorage) {
    case 'localStorage':
      return localStorage.getItem('auth_token');
    case 'sessionStorage':
      return sessionStorage.getItem('auth_token');
    case 'cookie':
      return getCookie('auth_token');
    case 'memory':
      return getMemoryStorage().token;
    default:
      return null;
  }
};

const getStoredTokens = () => {
  const config = getAuthConfig();
  switch (config.tokenStorage) {
    case 'localStorage':
      return {
        token: localStorage.getItem('auth_token'),
        refreshToken: localStorage.getItem('auth_refresh_token'),
      };
    case 'sessionStorage':
      return {
        token: sessionStorage.getItem('auth_token'),
        refreshToken: sessionStorage.getItem('auth_refresh_token'),
      };
    case 'cookie':
      return {
        token: getCookie('auth_token'),
        refreshToken: getCookie('auth_refresh_token'),
      };
    case 'memory':
      const memory = getMemoryStorage();
      return {
        token: memory.token,
        refreshToken: memory.refreshToken,
      };
    default:
      return { token: null, refreshToken: null };
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

// Cookie utilities
const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop()?.split(';').shift() || '');
  }
  return null;
};

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
