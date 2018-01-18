const mock = require('mock-require');

mock('jsdoc/env', {
  opts: {
    destination: 'test'
  }
});

const systemUndertest = require('../index');

describe('KisJsdocPlugin', () => {
  describe('exports.handlers', () => {
    describe('newDoclet', () => {
      it('creates a property "static":true when "scope":static', () => {
        let doclet = {
          meta: {
            path: 'path',
            filename: 'filename'
          },
          scope: 'static'
        };
        systemUndertest.handlers.newDoclet({
          doclet: doclet
        });
        expect(doclet).toEqual(jasmine.objectContaining({
          static: true
        }));
      });
    });
    describe('newDoclet', () => {
      it('creates a property tocDescription for module that matches description', () => {
        const expectedDescription = 'test';
        let doclet = {
          kind: 'module',
          description: expectedDescription,
          meta: {
            path: 'path',
            filename: 'filename'
          }
        };
        systemUndertest.handlers.newDoclet({
          doclet: doclet
        });
        expect(doclet).toEqual(jasmine.objectContaining({
          tocDescription: expectedDescription
        }));
      });
    });
    describe('newDoclet', () => {
      it('creates a property "tocDescription" for module that matches description', () => {
        const expectedDescription = 'test';
        let doclet = {
          kind: 'module',
          description: expectedDescription,
          meta: {
            path: 'path',
            filename: 'filename'
          }
        };
        systemUndertest.handlers.newDoclet({
          doclet: doclet
        });
        expect(doclet).toEqual(jasmine.objectContaining({
          tocDescription: expectedDescription
        }));
      });
    });
    describe('newDoclet', () => {
      it('creates a property "tocDescription" for class that matches classdesc', () => {
        const expectedDescription = 'test';
        let doclet = {
          kind: 'class',
          classdesc: expectedDescription,
          meta: {
            code: {
              node: {
                type: ''
              }
            },
            path: 'path',
            filename: 'filename'
          }
        };
        systemUndertest.handlers.newDoclet({
          doclet: doclet
        });
        expect(doclet).toEqual(jasmine.objectContaining({
          tocDescription: expectedDescription
        }));
      });
    });
  });
});