# my-auth-package Documentation

## Overview

`my-auth-package` is a flexible, comprehensive authentication solution for React applications. It provides a complete authentication system with customizable components, context providers, and API utilities to handle user authentication flows.

## Table of Contents

1. [Key Features](#key-features)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Authentication Flows](#authentication-flows)
5. [Component API Reference](#component-api-reference)
6. [Context and Hooks](#context-and-hooks)
7. [Direct API Access](#direct-api-access)
8. [Storage Options](#storage-options)
9. [Customization](#customization)
10. [Example Implementations](#example-implementations)

## Key Features

- Complete authentication flows (login, registration, password reset, email verification)
- Flexible token storage options (localStorage, sessionStorage, cookies, or in-memory)
- Automatic token refresh capabilities
- Customizable UI components
- TypeScript support
- Ready-to-use React context and hooks
- CSRF protection
- Responsive error handling

## Installation

```bash
npm install my-auth-package
# or
yarn add my-auth-package
```

## Configuration

Before using the package, configure the authentication service with your API endpoints and storage preferences:

```jsx
import { configureAuth } from 'my-auth-package';

configureAuth({
  // Required settings
  baseUrl: 'https://api.example.com', // Base URL for your auth endpoints

  // Optional settings
  tokenStorage: 'localStorage', // 'localStorage' (default), 'sessionStorage', 'cookie', or 'memory'
  tokenExpiration: 3600, // Token expiration time in seconds (default: 3600)
  autoRefresh: true, // Automatically refresh tokens before expiry (default: true)
  refreshBeforeExpiration: 300, // Refresh token when this many seconds remain (default: 300)

  // Optional custom endpoints
  endpoints: {
    login: '/auth/login', // Default: '/auth/login'
    register: '/auth/register', // Default: '/auth/register'
    logout: '/auth/logout', // Default: '/auth/logout'
    refresh: '/auth/refresh', // Default: '/auth/refresh'
    passwordReset: '/auth/reset-password', // Default: '/auth/reset-password'
    verifyEmail: '/auth/verify-email', // Default: '/auth/verify-email'
  },

  // Cookie options (only used when tokenStorage is 'cookie')
  cookieOptions: {
    path: '/',
    domain: 'example.com',
    secure: true,
    sameSite: 'strict',
  },
});
```

## Authentication Flows

### 1. Basic Authentication Flow

1. **User Login/Registration**: User authenticates via `LoginForm` or `RegisterForm`
2. **Token Storage**: Auth tokens are stored according to the configured storage method
3. **Authenticated State**: Application enters authenticated state with access to user info
4. **Automatic Token Refresh**: Tokens are refreshed before expiry if `autoRefresh` is enabled
5. **Logout**: User can log out, clearing tokens and user data

### 2. Password Reset Flow

1. User requests password reset via `PasswordReset` component
2. User receives reset email with verification code
3. User enters verification code and new password
4. System validates code and updates password
5. User is redirected to login

### 3. Email Verification Flow

1. User registers with email and password
2. System sends verification code to email
3. User enters code via `VerificationPrompt` component
4. Email is verified, and user can proceed

## Component API Reference

### AuthProvider

The root provider for authentication context:

```jsx
import { AuthProvider } from 'my-auth-package';

function App() {
  return (
    <AuthProvider
      onLoginSuccess={user => console.log('Logged in:', user)}
      onLoginError={error => console.error('Login error:', error)}
      onLogoutSuccess={() => console.log('Logged out')}
      onRegisterSuccess={user => console.log('Registered:', user)}
      onRegisterError={error => console.error('Registration error:', error)}
      autoRefreshInterval={60000} // Check for token refresh every minute
    >
      <YourApp />
    </AuthProvider>
  );
}
```

**Props:**

| Prop                  | Type                   | Description                                                |
| --------------------- | ---------------------- | ---------------------------------------------------------- |
| `children`            | ReactNode              | Child components                                           |
| `onLoginSuccess`      | (user: User) => void   | Callback after successful login                            |
| `onLoginError`        | (error: Error) => void | Callback after login error                                 |
| `onLogoutSuccess`     | () => void             | Callback after successful logout                           |
| `onRegisterSuccess`   | (user: User) => void   | Callback after successful registration                     |
| `onRegisterError`     | (error: Error) => void | Callback after registration error                          |
| `autoRefreshInterval` | number                 | Milliseconds between token refresh checks (default: 60000) |

### LoginForm

Pre-built login form component:

```jsx
import { LoginForm } from 'my-auth-package';

function Login() {
  return (
    <LoginForm
      onSuccess={() => navigate('/dashboard')}
      onError={error => console.error('Login failed:', error)}
      buttonText="Sign In"
      showLabels={true}
      rememberMe={true}
    />
  );
}
```

**Props:**

| Prop                  | Type                   | Description                                      |
| --------------------- | ---------------------- | ------------------------------------------------ |
| `onSuccess`           | () => void             | Callback on successful login                     |
| `onError`             | (error: Error) => void | Callback on login error                          |
| `className`           | string                 | CSS class for container                          |
| `style`               | React.CSSProperties    | Inline styles for container                      |
| `inputClassName`      | string                 | CSS class for input fields                       |
| `buttonClassName`     | string                 | CSS class for button                             |
| `errorClassName`      | string                 | CSS class for error message                      |
| `labelClassName`      | string                 | CSS class for labels                             |
| `formClassName`       | string                 | CSS class for form                               |
| `buttonText`          | string                 | Custom button text (default: "Log In")           |
| `showLabels`          | boolean                | Whether to show field labels (default: true)     |
| `emailPlaceholder`    | string                 | Email field placeholder (default: "Email")       |
| `passwordPlaceholder` | string                 | Password field placeholder (default: "Password") |
| `renderHeader`        | () => React.ReactNode  | Custom header renderer                           |
| `renderFooter`        | () => React.ReactNode  | Custom footer renderer                           |
| `rememberMe`          | boolean                | Show remember me checkbox (default: false)       |
| `socialLogins`        | boolean                | Show social login buttons (default: false)       |

### RegisterForm

Similar to LoginForm but with additional fields for registration.

### PasswordReset

Component for initiating and completing password reset.

### VerificationPrompt

Component for verifying email with a verification code.

## Context and Hooks

### useAuth Hook

Access authentication context from any component:

```jsx
import { useAuth } from 'my-auth-package';

function UserProfile() {
  const {
    user, // Current user or null
    isAuthenticated, // Boolean indicating auth status
    isLoading, // Loading state
    error, // Any auth errors
    login, // Function to log in
    register, // Function to register
    logout, // Function to log out
    resetPassword, // Function to reset password
    verifyEmail, // Function to verify email
    refreshToken, // Function to manually refresh token
  } = useAuth();

  if (isLoading) return <p>Loading...</p>;
  if (!isAuthenticated) return <p>Please log in</p>;

  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <button onClick={logout}>Log out</button>
    </div>
  );
}
```

## Direct API Access

For custom implementations, you can access the API functions directly:

```jsx
import {
  login,
  register,
  logout,
  resetPassword,
  verifyEmail,
} from 'my-auth-package';

// Example custom login
async function customLogin(email, password) {
  try {
    const response = await login({ email, password });
    console.log('Logged in as:', response.user);
    return response;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}
```

## Storage Options

The package supports four storage mechanisms for auth tokens:

1. **localStorage** (default): Persists across browser sessions
2. **sessionStorage**: Persists only during current browser session
3. **cookie**: Stored as HTTP cookies with configurable options
4. **memory**: Stored in memory only (lost on page refresh)

## Customization

### Custom Components

Create custom components using the `useAuth` hook:

```jsx
import { useAuth } from 'my-auth-package';

function CustomLoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await login({ email, password });
      // Success handling
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Your custom form elements */}
      {error && <p className="error">{error}</p>}
      <button type="submit">Login</button>
    </form>
  );
}
```

## Example Implementations

### Complete Authentication Flow

```jsx
import React, { useState } from 'react';
import {
  AuthProvider,
  LoginForm,
  RegisterForm,
  PasswordReset,
  VerificationPrompt,
  configureAuth,
} from 'my-auth-package';

// Configure auth service
configureAuth({
  baseUrl: 'https://api.example.com',
  tokenStorage: 'localStorage',
});

function AuthPage() {
  const [view, setView] = useState('login');
  const [email, setEmail] = useState('');

  return (
    <AuthProvider
      onLoginSuccess={() => console.log('Login successful')}
      onLogoutSuccess={() => setView('login')}
    >
      {view === 'login' && (
        <>
          <LoginForm
            onSuccess={() => console.log('Login successful')}
            onError={error => console.error('Login failed:', error)}
          />
          <p>
            <a href="#" onClick={() => setView('register')}>
              Create account
            </a>{' '}
            |
            <a href="#" onClick={() => setView('reset')}>
              Forgot password?
            </a>
          </p>
        </>
      )}

      {view === 'register' && (
        <>
          <RegisterForm
            onSuccess={user => {
              setEmail(user.email);
              setView('verify');
            }}
          />
          <p>
            <a href="#" onClick={() => setView('login')}>
              Already have an account? Login
            </a>
          </p>
        </>
      )}

      {view === 'reset' && (
        <>
          <PasswordReset
            onSuccess={() => {
              alert('Check your email for reset instructions');
              setView('login');
            }}
          />
          <p>
            <a href="#" onClick={() => setView('login')}>
              Back to login
            </a>
          </p>
        </>
      )}

      {view === 'verify' && (
        <VerificationPrompt email={email} onSuccess={() => setView('login')} />
      )}
    </AuthProvider>
  );
}

export default AuthPage;
```

### Protected Routes

```jsx
import { useAuth } from 'my-auth-package';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
}

// Usage
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route
    path="/dashboard"
    element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    }
  />
</Routes>;
```
