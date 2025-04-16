import { TokenData } from '../types/TokenTypes';

export interface ITokenRepository {
  getTokens(): TokenData;
  storeTokens(token: string, refreshToken?: string, expiresIn?: number): void;
  clearTokens(): void;
  isTokenExpired(): boolean;
  shouldRefreshToken(): boolean;
}
