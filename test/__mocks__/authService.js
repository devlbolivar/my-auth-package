// Mock implementation of authService

// Mock tokens and user data
const mockToken = 'test-token';
const mockRefreshToken = 'test-refresh-token';
const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };

// Create mock functions
const login = jest.fn().mockResolvedValue({
  token: mockToken,
  refreshToken: mockRefreshToken,
  user: mockUser,
  expiresIn: 3600,
});

const register = jest.fn().mockResolvedValue({
  token: mockToken,
  refreshToken: mockRefreshToken,
  user: mockUser,
  expiresIn: 3600,
});

const logout = jest.fn().mockResolvedValue({});

const resetPassword = jest.fn().mockResolvedValue({});

const verifyEmail = jest.fn().mockResolvedValue({});

const resendCode = jest.fn().mockResolvedValue({});

const refreshAuthToken = jest.fn().mockResolvedValue({
  token: 'new-token',
  refreshToken: 'new-refresh-token',
  expiresIn: 3600,
});

// Mock token storage
let tokenData = {
  token: mockToken,
  refreshToken: mockRefreshToken,
  expiresAt: Date.now() + 3600000,
};

const getStoredTokens = jest.fn().mockImplementation(() => tokenData);

const storeTokens = jest
  .fn()
  .mockImplementation((token, refreshToken, expiresIn) => {
    tokenData = {
      token,
      refreshToken,
      expiresAt: Date.now() + (expiresIn || 3600) * 1000,
    };
  });

const clearTokens = jest.fn().mockImplementation(() => {
  tokenData = {
    token: null,
    refreshToken: null,
    expiresAt: null,
  };
});

// Mock AuthError class
class AuthError extends Error {
  constructor(message, code = 'auth_error', status) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
  }
}

// Reset all mocks
const resetMocks = () => {
  login.mockClear();
  register.mockClear();
  logout.mockClear();
  resetPassword.mockClear();
  verifyEmail.mockClear();
  resendCode.mockClear();
  refreshAuthToken.mockClear();
  getStoredTokens.mockClear();
  storeTokens.mockClear();
  clearTokens.mockClear();

  // Reset token data
  tokenData = {
    token: mockToken,
    refreshToken: mockRefreshToken,
    expiresAt: Date.now() + 3600000,
  };

  // Reset default resolved values
  login.mockResolvedValue({
    token: mockToken,
    refreshToken: mockRefreshToken,
    user: mockUser,
    expiresIn: 3600,
  });
  register.mockResolvedValue({
    token: mockToken,
    refreshToken: mockRefreshToken,
    user: mockUser,
    expiresIn: 3600,
  });
  logout.mockResolvedValue({});
  resetPassword.mockResolvedValue({});
  verifyEmail.mockResolvedValue({});
  resendCode.mockResolvedValue({});
  refreshAuthToken.mockResolvedValue({
    token: 'new-token',
    refreshToken: 'new-refresh-token',
    expiresIn: 3600,
  });
};

// Export mock functions and utilities
module.exports = {
  login,
  register,
  logout,
  resetPassword,
  verifyEmail,
  resendCode,
  refreshAuthToken,
  getStoredTokens,
  storeTokens,
  clearTokens,
  AuthError,
  resetMocks,
  mockToken,
  mockRefreshToken,
};
