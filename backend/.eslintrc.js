module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking'
  ],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
    ecmaVersion: 2020
  },
  env: {
    node: true,
    es2020: true,
    jest: true
  },
  rules: {
    // TypeScript specific rules to catch common issues
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    '@typescript-eslint/no-unsafe-argument': 'error',
    '@typescript-eslint/restrict-template-expressions': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-inferrable-types': 'warn',
    '@typescript-eslint/require-await': 'error',
    
    // General code quality rules
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-debugger': 'error',
    'no-duplicate-imports': 'error',
    'no-unused-expressions': 'error',
    
    // Security related rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-script-url': 'error'
  },
  ignorePatterns: [
    'dist/**/*',
    'node_modules/**/*',
    'src/generated/**/*',
    '*.js' // Ignore JS files for now since we're focusing on TS
  ]
};