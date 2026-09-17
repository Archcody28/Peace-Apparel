import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default [
  {
    ignores: ['dist', 'node_modules', '.vercel', 'client/dist', 'server/dist'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
    reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,
  {
        files: ['**/*.{js,jsx,mjs,ts,tsx}'],
        languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
        'import.meta': 'readonly',
      },
    },
  },
]

