import * as React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import PasswordReset from './components/PasswordReset';
import VerificationPrompt from './components/VerificationPrompt';
import { configureAuth } from './api/authConfig';

// Delete me
export const Thing = () => {
  return <div>the snozzberries taste like snozzberries</div>;
};

export {
  AuthProvider,
  useAuth,
  LoginForm,
  RegisterForm,
  PasswordReset,
  VerificationPrompt,
  configureAuth,
};
