/* eslint-disable linebreak-style */
/* global describe, it, expect, jasmine */
const mock = require('mock-require');

mock('jsdoc/env', {
  opts: {
    destination: 'test',
  },
  conf: {
    templates: {
      markdown: {
        tocfilename: 'toc.md',
        tocOrder: {
          test1: 1,
          test2: 2,
        },
        badgecolors: {
          cat1: 'FFFFFF',
        },
        externallinks: {
          Test: 'externallink',
        },
      },
    },
  },
});

const systemUndertest = require('../index');


describe('KisJsdocPlugin', () => {
  describe('exports.handlers', () => {
    describe('newDoclet', () => {

      it('creates a property "static":true when "scope":static.', () => {
        const doclet = {
          meta: {
            path: 'path',
            filename: 'filename',
          },
          scope: 'static',
        };
        systemUndertest.handlers.newDoclet({
          doclet,
        });
        expect(doclet).toEqual(jasmine.objectContaining({
          static: true,
        }));
      });

      it('creates a property "tocDescription" for module that matches description property.', () => {
        const expectedDescription = 'test';
        const doclet = {
          kind: 'module',
          description: expectedDescription,
          meta: {
            path: 'path',
            filename: 'filename',
          },
        };
        systemUndertest.handlers.newDoclet({
          doclet,
        });
        expect(doclet).toEqual(jasmine.objectContaining({
          tocDescription: expectedDescription,
        }));
      });

      it('creates a property "category" with default value when none specified.', () => {
        const expectedCategory = 'other';
        const doclet = {
          kind: 'module',
          description: 'module',
          meta: {
            path: 'path',
            filename: 'filename',
          },
        };
        systemUndertest.handlers.newDoclet({
          doclet,
        });
        expect(doclet).toEqual(jasmine.objectContaining({
          category: expectedCategory,
        }));
      });

      it('creates a property "categorycolor" with configured value.', () => {
        const expectedColor = 'FFFFFF';
        const doclet = {
          kind: 'module',
          description: 'module',
          category: 'cat1',
          meta: {
            path: 'path',
            filename: 'filename',
          },
        };
        systemUndertest.handlers.newDoclet({
          doclet,
        });
        expect(doclet).toEqual(jasmine.objectContaining({
          categorycolor: expectedColor,
        }));
      });

      it('creates a property "categorycolor" with default value "blue" if not configured.', () => {
        const expectedColor = 'blue';
        const doclet = {
          kind: 'module',
          description: 'module',
          category: 'catundefined',
          meta: {
            path: 'path',
            filename: 'filename',
          },
        };
        systemUndertest.handlers.newDoclet({
          doclet,
        });
        expect(doclet).toEqual(jasmine.objectContaining({
          categorycolor: expectedColor,
        }));
      });
    });
  });
});
