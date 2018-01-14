/**
 * Defines a jsdoc plugin that adds custom properties to doclets and provides a new category tag.
 * @module
 */

const path = require('path');
const fs = require('fs');
const lineColumn = require('line-column');

const exportedClasses = [];

/**
 * Converts a Kebab cased string in a Pascal cased string.
 * @param {string} s - The string in Kebab casing to convert in Pascal casing.
 * @return {string} - The Pascal cased string.
 */
const hyphenToPascal = s => s.replace(/(\-|^)([a-z])/gi, (match, delimiter, hyphenated) => hyphenated.toUpperCase());

/**
 * Defines the default process on doclet: applying the 'value' function defined on the configuration object to the specified key/property of the doclet instance.
 * @param {Object} cf - The configuration object.
 * @param {string} k - The key/property of the object.
 * @return {function} A function that takes a doclet as input and sets the corresponding key/property with the 'value' function.
 */
const defaultProcess = (cf, k) => d => {
  d[k] = cf.value(d);
};

/**
 * Configuration used to process jsdoc doclet instance.
 * Each key of the configuration object defines a process:
 * - either explicitly with the 'process' function,
 * - either implictly by applying a value to the corresponding key property of the doclet instance. In such case, the 'value' function is used.
 * The process is executed if there is no 'condition' function, or if the condition evaluates to true.
 * @type {Object.<{condition: function, process: function, value: function}>}
 */
const configuration = {
  isExportedClass: {
    condition: d => d.kind === 'class' && (
      d.meta.code.node.type.startsWith('Export') ||
      d.tags && d.tags.some(t => t.title === 'export')),
    process: d => exportedClasses.push(d.name)
  },
  tocDescription: { // the description of a class or a module that appears in the toc
    condition: d => ['module', 'class'].includes(d.kind),
    value: d => d.kind === 'module' ? d.description : d.classdesc
  },
  valuecode: { // the source code of a constant
    condition: d => d.kind === 'constant' ,
    value: d => {
      let sourcefile = path.join(d.meta.path, d.meta.filename);
      let source = fs.readFileSync(sourcefile, 'utf8');
      let indexedSource = lineColumn(source);
      let loc = d.meta.code.node.loc;
      let code = source.substring(indexedSource.toIndex(loc.start.line, loc.start.column + 1), indexedSource.toIndex(loc.end.line, loc.end.column + 1));
      return code.slice(code.indexOf(' =') + 3, -1);
    }
  },
  screenshot: { // the path to a screenshot
    condition: d => {
      if (!['module', 'class'].includes(d.kind)) return false;
      // the relative path of the screenshot file
      let filename = `${d.kind}_` + path.basename(d.meta.filename, path.extname(d.meta.filename)) + '.png';
      let filepath = path.join(env.opts.destination, 'images/screenshots', filename);
      return fs.existsSync(filepath);
    },
    value: d => `${d.kind}_` + path.basename(d.meta.filename, path.extname(d.meta.filename)) + '.png'
  },
  category: { // the category
    condition: d => !d.category && ['module', 'class'].includes(d.kind),
    value: d => 'other'
  },
  static: { // is the documented object static?
    value: d => d.scope === 'static'
  },
  hasParameters: { // has the documented object @param or @return tags?
    value: d => (d.params && d.params.length > 0) || (d.returns && d.returns.length > 0)
  },
  relativepath: { // the relative path from the documentation to the source code
    value: d => {
      let filepath = path.join(d.meta.path, d.meta.filename); // the absolute path of the source file
      return path.relative(env.opts.destination, filepath); // the relative path of the source file from the documentation folder
    }
  },
  type: { // a shortcut to the type of a member
    condition: d => d.kind === 'member' && d.returns && d.returns.length > 0,
    value: d => d.returns[0].type
  },
  access: { // the accessibility of the documented object
    condition: d => !(d.access),
    value: d => {
      if (d.memberof && exportedClasses.includes(d.memberof) && d.name.charAt(0) !== '_') return 'public';
      if ((d.kind === 'constant' || d.kind === 'function') && d.meta.code.name.startsWith('exports.')) return 'public';
      return 'private';
    }
  },
  name: { // the name of a module to deal with index.js within a folder
    condition: d => d.kind === 'module',
    value: d => {
      const filename = path.basename(d.meta.filename, path.extname(d.meta.filename));
      if (filename !== 'index') {
        return hyphenToPascal(filename);
      }
      let folder = d.meta.path.split(path.sep).slice(-1)[0];
      return hyphenToPascal(folder);
    }
  },
  inject: { // is the documented object decorated with the @inject decorator?
    condition: d => d.kind === 'class' && d.meta.code.node.decorators && d.meta.code.node.decorators.length > 0,
    value: d => d.meta.code.node.decorators.map(dec => dec.expression.callee.name).includes('inject')
  }
};

/**
 * This plugin completes the jsdoc doclet with new properties when the doclet is created.
 */
exports.handlers = {
  /**
   * Add a category property based on the @category tag, or 'other' if none is provided.
   * @param {Object} e - The parsing event.
   */
  newDoclet: e => {
    let doclet = e.doclet;
    Object.keys(configuration)
      .filter(k => configuration[k].condition === undefined || configuration[k].condition(doclet))
      .forEach(k => (configuration[k].process || defaultProcess(configuration[k], k))(doclet));
  }
};

/**
 * This plugin defines a new jsdoc tag 'category' that accepts a text value.
 * This adds a corresponding 'category' property on the corresponding doclet.
 * @param {Object} dictionary - The jsdoc dictionary.
 * @example
 * \@category Model
 */
exports.defineTags = dictionary => {
  dictionary.defineTag('category', {
    onTagged: (doclet, tag) => {
      doclet.category = tag.text.toLocaleLowerCase();
    }
  });
};