import { AxiosRequestConfig } from 'axios';
import {
  LoginCredentials,
  RegisterCredentials,
  User,
  AuthResponse,
  ResetPasswordRequest,
  VerifyCodeRequest,
} from '../types/AuthTypes';

export interface IAuthService {
  login(
    credentials: LoginCredentials,
    options?: AxiosRequestConfig
  ): Promise<AuthResponse>;
  register(
    credentials: RegisterCredentials,
    options?: AxiosRequestConfig
  ): Promise<AuthResponse>;
  logout(options?: AxiosRequestConfig): Promise<void>;
  resetPassword(
    data: ResetPasswordRequest,
    options?: AxiosRequestConfig
  ): Promise<void>;
  verifyEmail(
    data: VerifyCodeRequest,
    options?: AxiosRequestConfig
  ): Promise<void>;
  refreshToken(options?: AxiosRequestConfig): Promise<AuthResponse>;
  resendCode(
    data: { email: string },
    options?: AxiosRequestConfig
  ): Promise<void>;
  getCurrentUser(): User | null;
  isAuthenticated(): boolean;
}
