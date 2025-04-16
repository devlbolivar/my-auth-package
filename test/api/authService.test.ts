import axios from 'axios';
import { configureAuth } from '../../src/api/authConfig';
import {
  login,
  register,
  logout,
  resetPassword,
  verifyEmail,
  refreshAuthToken,
  getStoredTokens,
} from '../../src/api/authService';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock getStoredTokens
const mockStoredTokens = {
  token: 'valid-token',
  refreshToken: 'valid-refresh-token',
  expiresAt: Date.now() + 3600000,
};

// Directly mock getStoredTokens
jest
  .spyOn(require('../../src/api/authService'), 'getStoredTokens')
  .mockReturnValue(mockStoredTokens);

// Initialize test data
const mockToken = 'test-token';
const mockRefreshToken = 'test-refresh-token';
const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };

describe('Auth Service', () => {
  beforeEach(() => {
    // Configure auth with test settings
    configureAuth({
      baseUrl: 'https://api.test.com',
      tokenStorage: 'memory',
    });

    // Reset all mocks
    jest.clearAllMocks();

    // Reset getStoredTokens mock to default values
    (getStoredTokens as jest.Mock).mockReturnValue(mockStoredTokens);
  });

  describe('login', () => {
    it('successfully logs in user', async () => {
      const mockResponse = {
        data: {
          token: mockToken,
          refreshToken: mockRefreshToken,
          user: mockUser,
          expiresIn: 3600,
        },
        headers: {
          'x-csrf-token': 'csrf-token',
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.test.com/auth/login',
        {
          email: 'test@example.com',
          password: 'password123',
        },
        {
          withCredentials: true,
        }
      );
    });

    it('handles login errors', async () => {
      const axiosError = {
        response: {
          status: 401,
          data: {
            message: 'Invalid credentials',
            code: 'auth_failed',
          },
        },
      };

      mockedAxios.post.mockRejectedValueOnce(axiosError);

      await expect(
        login({
          email: 'wrong@example.com',
          password: 'wrongpass',
        })
      ).rejects.toMatchObject({
        message: 'Invalid credentials',
        code: 'auth_failed',
        status: 401,
      });
    });
  });

  describe('register', () => {
    it('successfully registers new user', async () => {
      const mockResponse = {
        data: {
          token: 'new-token',
          refreshToken: 'new-refresh-token',
          user: { id: 2, email: 'new@example.com', name: 'New User' },
          expiresIn: 3600,
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await register({
        email: 'new@example.com',
        password: 'newpassword',
        name: 'New User',
      });

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.test.com/auth/register',
        {
          email: 'new@example.com',
          password: 'newpassword',
          name: 'New User',
        },
        undefined
      );
    });

    it('handles registration errors', async () => {
      const axiosError = {
        response: {
          status: 409,
          data: {
            message: 'Email already exists',
            code: 'email_exists',
          },
        },
      };

      mockedAxios.post.mockRejectedValueOnce(axiosError);

      await expect(
        register({
          email: 'existing@example.com',
          password: 'password123',
          name: 'Existing User',
        })
      ).rejects.toMatchObject({
        message: 'Email already exists',
        code: 'email_exists',
        status: 409,
      });
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      // Reset getStoredTokens mock to default values
      (getStoredTokens as jest.Mock).mockReturnValue(mockStoredTokens);
      // Reset axios mock
      mockedAxios.post.mockReset();
    });

    it('successfully logs out user', async () => {
      const mockResponse = {
        data: { message: 'Logged out successfully' },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      await logout();

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.test.com/auth/logout',
        {},
        expect.objectContaining({
          withCredentials: true,
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Bearer'),
          }),
        })
      );
    });

    it('handles logout errors', async () => {
      const axiosError = {
        response: {
          status: 500,
          data: {
            message: 'Failed to logout',
            code: 'logout_failed',
          },
        },
      };

      mockedAxios.post.mockRejectedValueOnce(axiosError);

      // The logout function throws an error when the API call fails
      await expect(logout()).rejects.toMatchObject({
        message: 'Failed to logout',
        code: 'logout_failed',
        status: 500,
      });

      // Verify that the API was called with the correct parameters
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.test.com/auth/logout',
        {},
        expect.objectContaining({
          withCredentials: true,
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Bearer'),
          }),
        })
      );
    });
  });

  describe('resetPassword', () => {
    beforeEach(() => {
      // Reset getStoredTokens mock to default values
      (getStoredTokens as jest.Mock).mockReturnValue(mockStoredTokens);
    });

    it('successfully initiates password reset', async () => {
      const mockResponse = {
        data: { message: 'Password reset email sent' },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      await resetPassword({ email: 'test@example.com' });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.test.com/auth/password-reset',
        { email: 'test@example.com' },
        undefined
      );
    });

    it('handles reset password errors', async () => {
      const axiosError = {
        response: {
          status: 404,
          data: {
            message: 'User not found',
            code: 'user_not_found',
          },
        },
      };

      mockedAxios.post.mockRejectedValueOnce(axiosError);

      await expect(
        resetPassword({ email: 'nonexistent@example.com' })
      ).rejects.toMatchObject({
        message: 'User not found',
        code: 'user_not_found',
        status: 404,
      });
    });
  });

  describe('verifyEmail', () => {
    beforeEach(() => {
      // Reset getStoredTokens mock to default values
      (getStoredTokens as jest.Mock).mockReturnValue(mockStoredTokens);
    });

    it('successfully verifies email', async () => {
      const mockResponse = {
        data: { message: 'Email verified successfully' },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      await verifyEmail({ code: '123456', email: 'test@example.com' });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.test.com/auth/verify-email',
        { code: '123456', email: 'test@example.com' },
        undefined
      );
    });

    it('handles email verification errors', async () => {
      const axiosError = {
        response: {
          status: 400,
          data: {
            message: 'Invalid verification token',
            code: 'invalid_token',
          },
        },
      };

      mockedAxios.post.mockRejectedValueOnce(axiosError);

      await expect(
        verifyEmail({ code: '123456', email: 'test@example.com' })
      ).rejects.toMatchObject({
        message: 'Invalid verification token',
        code: 'invalid_token',
        status: 400,
      });
    });
  });

  describe('refreshAuthToken', () => {
    beforeEach(() => {
      // Reset getStoredTokens mock to default values
      (getStoredTokens as jest.Mock).mockReturnValue(mockStoredTokens);
    });

    it('successfully refreshes auth token', async () => {
      const mockResponse = {
        data: {
          token: 'new-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600,
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await refreshAuthToken();

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.test.com/auth/refresh',
        { refreshToken: mockStoredTokens.refreshToken },
        undefined
      );
    });

    it('handles token refresh errors', async () => {
      const axiosError = {
        response: {
          status: 401,
          data: {
            message: 'Invalid refresh token',
            code: 'invalid_refresh_token',
          },
        },
      };

      mockedAxios.post.mockRejectedValueOnce(axiosError);

      await expect(refreshAuthToken()).rejects.toMatchObject({
        message: 'Invalid refresh token',
        code: 'invalid_refresh_token',
        status: 401,
      });
    });
  });
});
