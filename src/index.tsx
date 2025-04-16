import { AuthProvider, useAuth } from './context/AuthContext';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import PasswordReset from './components/PasswordReset';
import VerificationPrompt from './components/VerificationPrompt';
import { configureAuth } from './config/authConfig';
import {
  login,
  register,
  logout,
  resetPassword,
  verifyEmail,
  refreshAuthToken,
} from './services/authService';
import type {
  AuthConfig,
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
} from './types/auth';

// Export types
export type {
  AuthConfig,
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
};

// Export components
export {
  // Context and provider
  AuthProvider,
  useAuth,
  // Components
  LoginForm,
  RegisterForm,
  PasswordReset,
  VerificationPrompt,
  // Configuration
  configureAuth,
  // Direct API access
  login,
  register,
  logout,
  resetPassword,
  verifyEmail,
  refreshAuthToken,
};
