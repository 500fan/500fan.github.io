module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['themes/**/*.ejs'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  transform: {}
};
