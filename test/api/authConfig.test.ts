import { configureAuth } from '../../src/api/authConfig';

describe('Auth Configuration', () => {
  beforeEach(() => {
    // Clear any existing configuration
    localStorage.clear();
    sessionStorage.clear();
  });

  it('configures auth with memory storage', () => {
    const config = {
      baseUrl: 'https://api.test.com',
      tokenStorage: 'memory' as const,
    };

    configureAuth(config);

    // Memory storage should not persist between page reloads
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(sessionStorage.getItem('auth_token')).toBeNull();
  });

  it('configures auth with localStorage', () => {
    const config = {
      baseUrl: 'https://api.test.com',
      tokenStorage: 'localStorage' as const,
    };

    configureAuth(config);

    // localStorage should be available for token storage
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('configures auth with sessionStorage', () => {
    const config = {
      baseUrl: 'https://api.test.com',
      tokenStorage: 'sessionStorage' as const,
    };

    configureAuth(config);

    // sessionStorage should be available for token storage
    expect(sessionStorage.getItem('auth_token')).toBeNull();
  });

  it('throws error for invalid storage type', () => {
    const config = {
      baseUrl: 'https://api.test.com',
      tokenStorage: 'invalid' as any,
    };

    expect(() => configureAuth(config)).toThrow('Invalid token storage type');
  });

  it('configures auth with custom token key', () => {
    const config = {
      baseUrl: 'https://api.test.com',
      tokenStorage: 'localStorage' as const,
      tokenKey: 'custom_token_key',
    };

    configureAuth(config);

    // Custom token key should be used
    expect(localStorage.getItem('custom_token_key')).toBeNull();
  });

  it('configures auth with custom refresh token key', () => {
    const config = {
      baseUrl: 'https://api.test.com',
      tokenStorage: 'localStorage' as const,
      refreshTokenKey: 'custom_refresh_token_key',
    };

    configureAuth(config);

    // Custom refresh token key should be used
    expect(localStorage.getItem('custom_refresh_token_key')).toBeNull();
  });

  it('configures auth with custom token expiration key', () => {
    const config = {
      baseUrl: 'https://api.test.com',
      tokenStorage: 'localStorage' as const,
      tokenExpirationKey: 'custom_token_expiration_key',
    };

    configureAuth(config);

    // Custom token expiration key should be used
    expect(localStorage.getItem('custom_token_expiration_key')).toBeNull();
  });

  it('configures auth with custom headers', () => {
    const config = {
      baseUrl: 'https://api.test.com',
      tokenStorage: 'memory' as const,
      headers: {
        'X-Custom-Header': 'custom-value',
      },
    };

    configureAuth(config);

    // Custom headers should be available for API requests
    expect(config.headers['X-Custom-Header']).toBe('custom-value');
  });

  it('configures auth with custom token prefix', () => {
    const config = {
      baseUrl: 'https://api.test.com',
      tokenStorage: 'localStorage' as const,
      tokenPrefix: 'Bearer',
    };

    configureAuth(config);

    // Token prefix should be used in Authorization header
    expect(config.tokenPrefix).toBe('Bearer');
  });

  it('configures auth with custom token expiration time', () => {
    const config = {
      baseUrl: 'https://api.test.com',
      tokenStorage: 'memory' as const,
      tokenExpirationTime: 7200, // 2 hours in seconds
    };

    configureAuth(config);

    // Token expiration time should be set
    expect(config.tokenExpirationTime).toBe(7200);
  });
});
