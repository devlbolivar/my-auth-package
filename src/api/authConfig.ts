// src/api/authConfig.ts
interface AuthConfig {
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
  cookieOptions: {
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    domain?: string;
    path?: string;
  };
  autoRefresh: boolean;
  refreshBeforeExpiration: number; // in seconds
}

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

  // If baseUrl has a trailing slash and the endpoints have leading slashes,
  // clean that up to avoid double slashes
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

export const getAuthConfig = (): AuthConfig => {
  return { ...authConfig };
};

export const getFullUrl = (endpoint: keyof AuthConfig['endpoints']): string => {
  const config = getAuthConfig();
  return `${config.baseUrl}${config.endpoints[endpoint]}`;
};

export const getCookieExpirationDate = (): Date => {
  const config = getAuthConfig();
  const date = new Date();
  date.setTime(date.getTime() + config.tokenExpiration * 1000);
  return date;
};

export const getMemoryStorage = () => memoryStorage;
