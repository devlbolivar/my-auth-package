import type { AuthConfig } from '../types/auth';

const defaultConfig: AuthConfig = {
  baseUrl: '',
  endpoints: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    passwordReset: '/auth/password-reset',
    verifyEmail: '/auth/verify-email',
    resendCode: '/auth/resend-code',
  },
  tokenStorage: 'localStorage',
  tokenExpiration: 3600, // 1 hour
  cookieOptions: {
    secure: true,
    sameSite: 'strict',
    path: '/',
  },
  autoRefresh: true,
  refreshBeforeExpiration: 300, // refresh 5 minutes before expiration
  token: {
    headerName: 'Authorization',
    csrfHeaderName: 'X-CSRF-Token'
  }
};

// In-memory storage for tokens when using memory storage option
const memoryStorage: {
  token: string | null;
  refreshToken: string | null;
  tokenExpiration: number | null;
} = {
  token: null,
  refreshToken: null,
  tokenExpiration: null,
};

let authConfig: AuthConfig = { ...defaultConfig };

/**
 * Configures the authentication service with custom settings
 * @param config - Partial configuration object to override defaults
 * @throws {Error} If invalid token storage type is provided
 */
export const configureAuth = (config: Partial<AuthConfig>): void => {
  // Validate tokenStorage if provided
  if (
    config.tokenStorage &&
    !['localStorage', 'sessionStorage', 'cookie', 'memory'].includes(
      config.tokenStorage
    )
  ) {
    throw new Error('Invalid token storage type');
  }

  authConfig = { ...authConfig, ...config };

  // Clean up URL slashes to avoid double slashes
  if (authConfig.baseUrl.endsWith('/')) {
    Object.keys(authConfig.endpoints).forEach(key => {
      const endpoint =
        authConfig.endpoints[key as keyof typeof authConfig.endpoints];
      if (endpoint.startsWith('/')) {
        authConfig.endpoints[
          key as keyof typeof authConfig.endpoints
        ] = endpoint.substring(1);
      }
    });
  }
};

/**
 * Returns the current auth configuration
 * @returns A copy of the current auth configuration
 */
export const getAuthConfig = (): AuthConfig => {
  return { ...authConfig };
};

/**
 * Returns the full URL for a given endpoint
 * @param endpoint - The endpoint key from the configuration
 * @returns The complete URL for the endpoint
 */
export const getFullUrl = (endpoint: keyof AuthConfig['endpoints']): string => {
  const config = getAuthConfig();
  return `${config.baseUrl}${config.endpoints[endpoint]}`;
};

/**
 * Returns the cookie expiration date based on the current configuration
 * @returns Date object representing when the cookie should expire
 */
export const getCookieExpirationDate = (): Date => {
  const config = getAuthConfig();
  const date = new Date();
  date.setTime(date.getTime() + config.tokenExpiration * 1000);
  return date;
};

/**
 * Returns the memory storage object for token storage
 * @returns The memory storage object
 */
export const getMemoryStorage = () => memoryStorage; 