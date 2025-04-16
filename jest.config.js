module.exports = {
  // Transform ESM modules
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  // Handle ESM modules in node_modules
  transformIgnorePatterns: ['/node_modules/(?!axios).+\\.js$'],
  // Test environment
  testEnvironment: 'jsdom',
  // File extensions Jest should look for
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Setup file
  setupFilesAfterEnv: ['./jest.setup.js'],
};
