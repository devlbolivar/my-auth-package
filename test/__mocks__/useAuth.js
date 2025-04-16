// Create mock functions for auth operations
const mockLogin = jest.fn().mockResolvedValue({
  success: true,
  value: {
    token: 'test-token',
    refreshToken: 'test-refresh-token',
    user: { id: 1, email: 'test@example.com' },
  },
});
const mockRegister = jest.fn().mockResolvedValue({
  success: true,
  value: {
    token: 'test-token',
    refreshToken: 'test-refresh-token',
    user: { id: 1, email: 'test@example.com' },
  },
});
const mockLogout = jest.fn().mockResolvedValue({ success: true });
const mockResetPassword = jest.fn().mockResolvedValue({ success: true });
const mockVerifyEmail = jest.fn().mockResolvedValue({ success: true });
const mockResendCode = jest.fn().mockResolvedValue({ success: true });
const mockRefreshToken = jest.fn().mockResolvedValue({
  success: true,
  value: {
    token: 'new-test-token',
    refreshToken: 'new-test-refresh-token',
    user: { id: 1, email: 'test@example.com' },
  },
});

// Create state variables for auth context
let isLoading = false;
let error = null;
let user = null;

// Main hook mock implementation
const useAuth = jest.fn().mockImplementation(() => ({
  login: mockLogin,
  register: mockRegister,
  logout: mockLogout,
  resetPassword: mockResetPassword,
  verifyEmail: mockVerifyEmail,
  resendCode: mockResendCode,
  refreshToken: mockRefreshToken,
  isLoading,
  error,
  user,
  isAuthenticated: !!user,
}));

// Helper functions for controlling mock behavior in tests
const mockFunctions = {
  login: mockLogin,
  register: mockRegister,
  logout: mockLogout,
  resetPassword: mockResetPassword,
  verifyEmail: mockVerifyEmail,
  resendCode: mockResendCode,
  refreshToken: mockRefreshToken,
  setLoading: val => {
    isLoading = val;
    updateHook();
  },
  setError: val => {
    error = val;
    updateHook();
  },
  setUser: val => {
    user = val;
    updateHook();
  },
  reset: () => {
    // Clear mock calls and reset implementations
    mockLogin.mockClear();
    mockRegister.mockClear();
    mockLogout.mockClear();
    mockResetPassword.mockClear();
    mockVerifyEmail.mockClear();
    mockResendCode.mockClear();
    mockRefreshToken.mockClear();

    // Reset state variables
    isLoading = false;
    error = null;
    user = null;

    // Reset default resolved values
    mockLogin.mockResolvedValue({
      success: true,
      value: {
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        user: { id: 1, email: 'test@example.com' },
      },
    });
    mockRegister.mockResolvedValue({
      success: true,
      value: {
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        user: { id: 1, email: 'test@example.com' },
      },
    });
    mockLogout.mockResolvedValue({ success: true });
    mockResetPassword.mockResolvedValue({ success: true });
    mockVerifyEmail.mockResolvedValue({ success: true });
    mockResendCode.mockResolvedValue({ success: true });
    mockRefreshToken.mockResolvedValue({
      success: true,
      value: {
        token: 'new-test-token',
        refreshToken: 'new-test-refresh-token',
        user: { id: 1, email: 'test@example.com' },
      },
    });

    // Update the hook implementation
    updateHook();
  },
};

// Helper to update the mock implementation with current state
function updateHook() {
  useAuth.mockImplementation(() => ({
    login: mockLogin,
    register: mockRegister,
    logout: mockLogout,
    resetPassword: mockResetPassword,
    verifyEmail: mockVerifyEmail,
    resendCode: mockResendCode,
    refreshToken: mockRefreshToken,
    isLoading,
    error,
    user,
    isAuthenticated: !!user,
  }));
}

// Expose the mock functions for test assertions
useAuth.mockFunctions = mockFunctions;

// Create a mock implementation for the AuthProvider component
const React = require('react');
const AuthContext = React.createContext(undefined);

useAuth.AuthContext = AuthContext;
useAuth.AuthProvider = ({ children }) => {
  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        login: mockLogin,
        register: mockRegister,
        logout: mockLogout,
        resetPassword: mockResetPassword,
        verifyEmail: mockVerifyEmail,
        resendCode: mockResendCode,
        refreshToken: mockRefreshToken,
        isLoading,
        error,
        user,
        isAuthenticated: !!user,
      },
    },
    children
  );
};

module.exports = useAuth;
