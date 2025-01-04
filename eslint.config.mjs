import arrayFunc from 'eslint-plugin-array-func';
import promise from 'eslint-plugin-promise';
import unicorn from 'eslint-plugin-unicorn';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import babelParser from '@babel/eslint-parser';
import eslint from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';

export default [
  {
    ignores: ['test/jest-pretest.js', 'e2e/**/*']
  },

  eslint.configs.recommended,
  arrayFunc.configs.recommended,
  promise.configs['flat/recommended'],
  unicorn.configs['flat/recommended'],
  prettierRecommended,
  jsdoc.configs['flat/recommended-typescript-flavor'],

  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jasmine
      },
      parser: babelParser,
      ecmaVersion: 2019,
      sourceType: 'module',

      parserOptions: {
        ecmaFeatures: {
          legacyDecorators: true
        }
      }
    },

    rules: {
      'no-var': 2,
      'prefer-const': 1,
      'no-shadow': 2,
      'no-unused-vars': [
        2,
        {
          vars: 'local',
          args: 'none'
        }
      ],
      'no-use-before-define': 0,
      'no-console': 1,
      'no-alert': 1,
      'consistent-return': 0,
      'default-case': 2,
      'dot-notation': 2,
      eqeqeq: 2,
      'guard-for-in': 1,
      'no-caller': 2,
      'no-else-return': 2,
      'no-eq-null': 2,
      'no-eval': 2,
      'no-extend-native': 2,
      'no-extra-bind': 2,
      'no-implied-eval': 2,
      'no-lone-blocks': 2,
      'no-loop-func': 2,
      'no-multi-str': 2,
      'no-native-reassign': 2,
      'no-new': 2,
      'no-new-func': 2,
      'no-new-wrappers': 2,
      'no-octal-escape': 2,
      'no-param-reassign': 0,
      'no-proto': 2,
      'no-script-url': 2,
      'no-self-compare': 2,
      'no-sequences': 2,
      'no-throw-literal': 2,
      'no-useless-concat': 1,
      radix: 0,
      'vars-on-top': 2,
      yoda: 2,
      camelcase: [
        2,
        {
          properties: 'never'
        }
      ],
      'func-names': 0,
      'new-cap': 2,
      'no-nested-ternary': 2,
      'no-new-object': 2,
      'no-underscore-dangle': 0,
      'one-var': [2, 'never'],
      'spaced-comment': [
        1,
        'always',
        {
          exceptions: ['*']
        }
      ],
      'no-return-assign': ['error', 'except-parens'],

      'array-func/prefer-array-from': 0,

      'promise/no-promise-in-callback': 0,

      'unicorn/prefer-spread': 0,
      'unicorn/prefer-number-properties': 0,
      'unicorn/prefer-node-protocol': 0,
      'unicorn/no-array-for-each': 0,
      'unicorn/prefer-module': 0,
      'unicorn/no-array-reduce': 0,

      'jsdoc/check-tag-names': ['error', { definedTags: ['category'] }]
    }
  }
];
