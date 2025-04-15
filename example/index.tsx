import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  AuthProvider,
  LoginForm,
  RegisterForm,
  PasswordReset,
  configureAuth,
} from '../.';

// Configure auth endpoints
configureAuth({
  baseUrl: 'https://api.example.com',
  tokenStorage: 'localStorage',
});

const App = () => {
  const [view, setView] = React.useState<'login' | 'register' | 'reset'>(
    'login'
  );

  return (
    <AuthProvider
      onLoginSuccess={user => console.log('Logged in successfully', user)}
      onRegisterSuccess={user => console.log('Registered successfully', user)}
    >
      <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
        <h1>Auth Example</h1>

        {view === 'login' && (
          <>
            <LoginForm />
            <div style={{ marginTop: '20px' }}>
              <button onClick={() => setView('register')}>
                Need an account? Register
              </button>
              <button onClick={() => setView('reset')}>Forgot password?</button>
            </div>
          </>
        )}

        {view === 'register' && (
          <>
            <RegisterForm />
            <div style={{ marginTop: '20px' }}>
              <button onClick={() => setView('login')}>
                Already have an account? Login
              </button>
            </div>
          </>
        )}

        {view === 'reset' && (
          <>
            <PasswordReset />
            <div style={{ marginTop: '20px' }}>
              <button onClick={() => setView('login')}>Back to Login</button>
            </div>
          </>
        )}
      </div>
    </AuthProvider>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
