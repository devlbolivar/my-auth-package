// src/api/authService.ts
import axios, { AxiosRequestConfig } from 'axios';
import { getFullUrl, getAuthConfig } from './authConfig';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name?: string;
  [key: string]: any; // Allow additional fields for registration
}

export interface User {
  id: string | number;
  email: string;
  name?: string;
  [key: string]: any; // Allow additional user properties
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface VerifyCodeRequest {
  code: string;
  email?: string;
}

const getStoredTokens = (): {
  token: string | null;
  refreshToken: string | null;
} => {
  const config = getAuthConfig();

  if (config.tokenStorage === 'localStorage') {
    return {
      token: localStorage.getItem('auth_token'),
      refreshToken: localStorage.getItem('auth_refresh_token'),
    };
  } else if (config.tokenStorage === 'sessionStorage') {
    return {
      token: sessionStorage.getItem('auth_token'),
      refreshToken: sessionStorage.getItem('auth_refresh_token'),
    };
  }

  // For memory or cookie storage, token handling would be implemented differently
  return { token: null, refreshToken: null };
};

const storeTokens = (token: string, refreshToken?: string): void => {
  const config = getAuthConfig();

  if (config.tokenStorage === 'localStorage') {
    localStorage.setItem('auth_token', token);
    if (refreshToken) {
      localStorage.setItem('auth_refresh_token', refreshToken);
    }
  } else if (config.tokenStorage === 'sessionStorage') {
    sessionStorage.setItem('auth_token', token);
    if (refreshToken) {
      sessionStorage.setItem('auth_refresh_token', refreshToken);
    }
  }

  // For memory or cookie storage, token handling would be implemented differently
};

const clearTokens = (): void => {
  const config = getAuthConfig();

  if (config.tokenStorage === 'localStorage') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh_token');
  } else if (config.tokenStorage === 'sessionStorage') {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_refresh_token');
  }

  // For memory or cookie storage, token handling would be implemented differently
};

export const login = async (
  credentials: LoginCredentials,
  options?: AxiosRequestConfig
): Promise<AuthResponse> => {
  const response = await axios.post<AuthResponse>(
    getFullUrl('login'),
    credentials,
    options
  );

  if (response.data.token) {
    storeTokens(response.data.token, response.data.refreshToken);
  }

  return response.data;
};

export const register = async (
  credentials: RegisterCredentials,
  options?: AxiosRequestConfig
): Promise<AuthResponse> => {
  const response = await axios.post<AuthResponse>(
    getFullUrl('register'),
    credentials,
    options
  );

  if (response.data.token) {
    storeTokens(response.data.token, response.data.refreshToken);
  }

  return response.data;
};

export const logout = async (options?: AxiosRequestConfig): Promise<void> => {
  const { token } = getStoredTokens();

  if (token) {
    try {
      await axios.post(
        getFullUrl('logout'),
        {},
        {
          ...options,
          headers: {
            ...options?.headers,
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } finally {
      clearTokens();
    }
  }
};

export const resetPassword = async (
  data: ResetPasswordRequest,
  options?: AxiosRequestConfig
): Promise<void> => {
  await axios.post(getFullUrl('passwordReset'), data, options);
};

export const verifyEmail = async (
  data: VerifyCodeRequest,
  options?: AxiosRequestConfig
): Promise<void> => {
  await axios.post(getFullUrl('verifyEmail'), data, options);
};

export const refreshAuthToken = async (
  options?: AxiosRequestConfig
): Promise<AuthResponse> => {
  const { refreshToken } = getStoredTokens();

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await axios.post<AuthResponse>(
    getFullUrl('refresh'),
    { refreshToken },
    options
  );

  if (response.data.token) {
    storeTokens(response.data.token, response.data.refreshToken);
  }

  return response.data;
};
