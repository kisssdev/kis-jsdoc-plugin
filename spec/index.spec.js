const mock = require('mock-require');

mock('jsdoc/env', {
  opts: {
    destination: 'test'
  },
  conf: {
    templates: {
      markdown: {
        tocfilename: 'toc.md',
        tocOrder: {
          test1: 1,
          test2: 2
        },
        badgecolors: {
          cat1: 'FFFFFF'
        },
        externallinks: {
          Test: 'externallink'
        }
      }
    }
  }
});

const systemUndertest = require('../index');

describe('KisJsdocPlugin', () => {
  describe('exports.handlers', () => {
    describe('newDoclet', () => {
      it('creates a property "static":true when "scope":static.', () => {
        const doclet = {
          meta: { path: 'path', filename: 'filename' },
          scope: 'static'
        };
        systemUndertest.handlers.newDoclet({ doclet });
        expect(doclet).toEqual(jasmine.objectContaining({ static: true }));
      });

      it('creates a property "tocDescription" for module that matches description property.', () => {
        const expectedDescription = 'test';
        const doclet = {
          kind: 'module',
          description: expectedDescription,
          meta: { path: 'path', filename: 'filename' }
        };
        systemUndertest.handlers.newDoclet({ doclet });
        expect(doclet).toEqual(jasmine.objectContaining({ tocDescription: expectedDescription }));
      });

      it('creates a property "category" with default value when none specified.', () => {
        const expectedCategory = 'other';
        const doclet = {
          kind: 'module',
          description: 'module',
          meta: { path: 'path', filename: 'filename' }
        };
        systemUndertest.handlers.newDoclet({ doclet });
        expect(doclet).toEqual(jasmine.objectContaining({ category: expectedCategory }));
      });

      it('creates a property "categorycolor" with configured value.', () => {
        const expectedColor = 'FFFFFF';
        const doclet = {
          kind: 'module',
          description: 'module',
          category: 'cat1',
          meta: { path: 'path', filename: 'filename' }
        };
        systemUndertest.handlers.newDoclet({ doclet });
        expect(doclet).toEqual(jasmine.objectContaining({ categorycolor: expectedColor }));
      });

      it('process fixUndocumented: creates a falsy property "included" when undocumented=true.', () => {
        const doclet = {
          kind: 'module',
          description: 'module',
          undocumented: true,
          meta: { path: 'path', filename: 'filename' }
        };
        systemUndertest.handlers.newDoclet({ doclet });
        expect(doclet).toEqual(jasmine.objectContaining({ included: false }));
      });

      it('process acceptTypeScriptType: fixes params and returns info if type is specified as TypeScript.', () => {
        const doclet = {
          kind: 'function',
          params: [{ name: 'p1' }, { name: 'p2' }, { name: 'p3' }],
          returns: [{}],
          comment:
            '/**\n   * Defines a function.\n   * @param   {(text: string) => void}            p1 a p1 description\n   * @param   {string}                            p2 a p2 description\n   * @param   {(text : string) => {text: string}} p3 a p3 description\n   * @return  {Promise<(text : string) => {text: string}>} the result description\n   */',
          meta: { path: 'path', filename: 'filename' }
        };
        systemUndertest.handlers.newDoclet({ doclet });
        expect(doclet).toEqual(
          jasmine.objectContaining({
            params: [
              { name: 'p1', type: { names: ['(text: string) => void'] }, description: 'a p1 description' },
              { name: 'p2', type: { names: ['string'] }, description: 'a p2 description' },
              {
                name: 'p3',
                type: { names: ['(text : string) => {text: string}'] },
                description: 'a p3 description'
              }
            ],
            returns: [
              {
                type: { names: ['Promise<(text : string) => {text: string}>'] },
                description: 'the result description'
              }
            ]
          })
        );
      });

      it(`process acceptTypeScriptType: fixes member's type info if type is specified as TypeScript, syntax 1.`, () => {
        const doclet = {
          kind: 'member',
          name: 'm1',
          comment: '/** @type {() => {name: string}} the m1 */',
          meta: { path: 'path', filename: 'filename' }
        };
        systemUndertest.handlers.newDoclet({ doclet });
        expect(doclet).toEqual(
          jasmine.objectContaining({
            type: { names: ['() => {name: string}'] },
            description: 'the m1'
          })
        );
      });

      it(`process acceptTypeScriptType: fixes member's type info if type is specified as TypeScript, syntax 2.`, () => {
        const doclet = {
          kind: 'member',
          name: 'm1',
          description: 'the m1',
          comment: '"/**\n   * the m1\n   * @type {() => {name: string}}\n   */"',
          meta: { path: 'path', filename: 'filename' }
        };
        systemUndertest.handlers.newDoclet({ doclet });
        expect(doclet).toEqual(
          jasmine.objectContaining({
            type: { names: ['() => {name: string}'] },
            description: 'the m1'
          })
        );
      });
    });
  });
});
