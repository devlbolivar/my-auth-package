// test/mocks.ts
jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
  isAxiosError: jest.fn(),
  create: jest.fn().mockReturnValue({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  }),
  defaults: {
    headers: {
      common: {},
    },
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn().mockReturnValue(null),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
  key: jest.fn(),
  length: 0,
};

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn().mockReturnValue(null),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
  key: jest.fn(),
  length: 0,
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
});

// Mock fetch
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({}),
});

// Export something to make this a module
export const mocks = {
  localStorage: localStorageMock,
  sessionStorage: sessionStorageMock,
};
