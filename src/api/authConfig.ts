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
  };
  tokenStorage: 'localStorage' | 'sessionStorage' | 'cookie' | 'memory';
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
  },
  tokenStorage: 'localStorage',
};

let authConfig: AuthConfig = { ...defaultConfig };

export const configureAuth = (config: Partial<AuthConfig>): void => {
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
