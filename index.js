/**
 * Defines a jsdoc plugin that adds custom properties to doclets and provides a new category tag.
 * @module
 */

const path = require('path');
const fs = require('fs');
const lineColumn = require('line-column');
/* eslint-disable import/no-unresolved */
const env = require('jsdoc/env');

const exportedClasses = [];

/**
 * Converts a Kebab cased string in a Pascal cased string.
 * @param {string} s - The string in Kebab casing to convert in Pascal casing.
 * @return {string} - The Pascal cased string.
 */
const hyphenToPascal = (s) => s.replace(/(-|^)([a-z])/gi, (match, delimiter, hyphenated) => hyphenated.toUpperCase());

/**
 * Defines the default process on doclet: applying the 'value' function defined on the configuration object to the specified key/property of the doclet instance.
 * @param {Object} cf - The configuration object.
 * @param {string} k - The key/property of the object.
 * @return {function} A function that takes a doclet as input and sets the corresponding key/property with the 'value' function.
 */
const defaultProcess = (cf, k) => (d) => {
  /* eslint-disable no-param-reassign */
  d[k] = cf.value(d);
};

/**
 * The configuration of the jsdoc plugin.
 */
const config = {
  docFolder: env.opts.destination
};

/**
 * Configuration used to process jsdoc doclet instance.
 * Each key of the configuration object defines a process:
 * - either explicitly with the 'process' function,
 * - either implictly by applying a value to the corresponding key property of the doclet instance. In such case, the 'value' function is used.
 * In both cases, the process is executed if there is no 'condition' function, or if the 'condition' function evaluates to true.
 * @type {Object.<{condition: function, process: function, value: function}>}
 */
const processConfig = {
  isExportedClass: {
    condition: (d) =>
      d.kind === 'class' &&
      (d.meta.code.name.startsWith('export') || (d.tags && d.tags.some((t) => t.title === 'export'))),
    process: (d) => exportedClasses.push(d.name)
  },
  tocDescription: {
    // the description of a class or a module that appears in the toc
    condition: (d) => ['module', 'class'].includes(d.kind),
    value: (d) => (d.kind === 'module' ? d.description : d.classdesc)
  },
  valuecode: {
    // the source code of a constant
    condition: (d) => d.kind === 'constant',
    value: (d) => {
      const sourcefile = path.join(d.meta.path, d.meta.filename);
      const source = fs.readFileSync(sourcefile, 'utf8');
      const indexedSource = lineColumn(source);
      const { loc } = d.meta.code.node;
      const code = source.substring(
        indexedSource.toIndex(loc.start.line, loc.start.column + 1),
        indexedSource.toIndex(loc.end.line, loc.end.column + 1)
      );
      return code.slice(code.indexOf(' =') + 3, -1);
    }
  },
  screenshot: {
    // the path to a screenshot
    condition: (d) => {
      if (!['module', 'class'].includes(d.kind)) return false;
      // the relative path of the screenshot file
      const filename = `${d.kind}_${path.basename(d.meta.filename, path.extname(d.meta.filename))}.png`;
      const filepath = path.join(config.docFolder, 'images/screenshots', filename);
      return fs.existsSync(filepath);
    },
    value: (d) => `${d.kind}_${path.basename(d.meta.filename, path.extname(d.meta.filename))}.png`
  },
  category: {
    // the category
    condition: (d) => !d.category && ['module', 'class'].includes(d.kind),
    value: () => 'other'
  },
  static: {
    // is the documented object static?
    value: (d) => d.scope === 'static'
  },
  hasParameters: {
    // has the documented object @param or @return tags?
    value: (d) => (d.params && d.params.length > 0) || (d.returns && d.returns.length > 0)
  },
  relativepath: {
    // the relative path from the documentation to the source code
    value: (d) => {
      const filepath = path.join(d.meta.path, d.meta.filename); // the absolute path of the source file
      return path.relative(config.docFolder, filepath); // the relative path of the source file from the documentation folder
    }
  },
  type: {
    // a shortcut to the type of a member
    condition: (d) => d.kind === 'member' && d.returns && d.returns.length > 0,
    value: (d) => d.returns[0].type
  },
  access: {
    // the accessibility of the documented object
    condition: (d) => !d.access,
    value: (d) => {
      if (d.memberof && exportedClasses.includes(d.memberof) && d.name.charAt(0) !== '_') return 'public';
      if ((d.kind === 'constant' || d.kind === 'function') && d.meta.code.name.startsWith('exports.')) return 'public';
      return 'private';
    }
  },
  name: {
    // the name of a module to deal with index.js within a folder
    condition: (d) => d.kind === 'module',
    value: (d) => {
      const filename = path.basename(d.meta.filename, path.extname(d.meta.filename));
      if (filename !== 'index') {
        return hyphenToPascal(filename);
      }
      const folder = d.meta.path.split(path.sep).slice(-1)[0];
      return hyphenToPascal(folder);
    }
  },
  inject: {
    // is the documented object decorated with the @inject decorator?
    condition: (d) => d.kind === 'class' && d.meta.code.node.decorators && d.meta.code.node.decorators.length > 0,
    value: (d) => {
      return d.meta.code.node.decorators
        .map((dec) => {
          let decoratorName = '';
          if (dec.expression.type === 'Identifier') decoratorName = dec.expression.name;
          if (dec.expression.type === 'CallExpression') decoratorName = dec.expression.callee.name;
          return decoratorName;
        })
        .includes('inject');
    }
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
  newDoclet: (e) => {
    const { doclet } = e;
    Object.keys(processConfig)
      .filter((k) => processConfig[k].condition === undefined || processConfig[k].condition(doclet))
      .forEach((k) => (processConfig[k].process || defaultProcess(processConfig[k], k))(doclet));
  }
};

/**
 * This plugin defines a new jsdoc tag 'category' that accepts a text value.
 * This adds a corresponding 'category' property on the corresponding doclet.
 * @param {Object} dictionary - The jsdoc dictionary.
 * @example
 * \@category Model
 */
exports.defineTags = (dictionary) => {
  dictionary.defineTag('category', {
    onTagged: (doclet, tag) => {
      doclet.category = tag.text.toLocaleLowerCase();
    }
  });
};
