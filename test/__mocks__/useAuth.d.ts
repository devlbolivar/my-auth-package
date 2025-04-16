import { MockedFunction } from 'jest-mock';
import { AuthContextType } from '../../src/context/AuthContext';

export interface MockFunctions {
  login: MockedFunction<AuthContextType['login']>;
  register: MockedFunction<AuthContextType['register']>;
  logout: MockedFunction<AuthContextType['logout']>;
  resetPassword: MockedFunction<AuthContextType['resetPassword']>;
  verifyEmail: MockedFunction<AuthContextType['verifyEmail']>;
  resendCode: MockedFunction<AuthContextType['resendCode']>;
  refreshToken: MockedFunction<AuthContextType['refreshToken']>;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  setUser: (user: any | null) => void;
  reset: () => void;
}

export const mockFunctions: MockFunctions;

declare const useAuth: () => AuthContextType;
export default useAuth;
