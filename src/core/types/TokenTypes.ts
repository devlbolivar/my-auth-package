export interface TokenData {
  token: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

export interface TokenConfig {
  tokenStorage: 'localStorage' | 'sessionStorage' | 'cookie' | 'memory';
  tokenExpiration: number;
  refreshBeforeExpiration: number;
  autoRefresh: boolean;
  cookieOptions?: CookieOptions;
}

export interface CookieOptions {
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}
