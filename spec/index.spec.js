/* global describe, it, expect, jasmine */
const mock = require('mock-require');

mock('jsdoc/env', {
  opts: {
    destination: 'test',
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
      it('creates a property "tocDescription" for class that matches classdesc property.', () => {
        const expectedDescription = 'test';
        const doclet = {
          kind: 'class',
          classdesc: expectedDescription,
          meta: {
            code: {
              node: {
                type: '',
              },
            },
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
    });
  });
});
