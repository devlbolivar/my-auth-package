import { User, AuthToken, AuthError } from '../../src/types/auth';
import { Result } from '../../src/core/types/result';

describe('Auth Result Type Tests', () => {
  it('handles successful auth result', () => {
    const result: Result<{ user: User; token: AuthToken }, AuthError> = {
      success: true,
      value: {
        user: { id: '1', email: 'test@example.com' },
        token: {
          accessToken: 'test-token',
        },
      },
    };

    if (result.success) {
      expect(result.value.token.accessToken).toBe('test-token');
      expect(result.value.user.id).toBe('1');
      expect(result.value.user.email).toBe('test@example.com');
    } else {
      fail('Result should be successful');
    }
  });

  it('handles failed auth result', () => {
    const result: Result<{ user: User; token: AuthToken }, AuthError> = {
      success: false,
      error: new AuthError('Authentication failed', 'auth_failed'),
    };

    if (!result.success) {
      expect(result.error.message).toBe('Authentication failed');
      expect(result.error.code).toBe('auth_failed');
    } else {
      fail('Result should be unsuccessful');
    }
  });

  it('handles successful registration result', () => {
    const result: Result<{ user: User; token: AuthToken }, AuthError> = {
      success: true,
      value: {
        user: { id: '2', email: 'new@example.com', name: 'New User' },
        token: {
          accessToken: 'new-token',
        },
      },
    };

    if (result.success) {
      expect(result.value.token.accessToken).toBe('new-token');
      expect(result.value.user.name).toBe('New User');
    } else {
      fail('Result should be successful');
    }
  });
});
