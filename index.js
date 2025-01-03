/**
 * Defines a JSDoc plugin that adds custom properties to doclets and provides a new category tag.
 * @module
 * @category JSDocPlugin
 */

const path = require('path');
const fs = require('fs');
const lineColumn = require('line-column');
// @ts-ignore
const env = require('jsdoc/env');

/**
 * The configuration of the JSDoc plugin.
 */
const config = {
  rootFolder: env.pwd,
  docFolder: env.opts.destination,
  includes: (env.opts.includes || 'public,protected,private').toLowerCase().replace(' ', '').split(','),
  badgecolors:
    (env.conf &&
      env.conf.templates &&
      env.conf.templates.markdown &&
      env.conf.templates.markdown.badgecolors) ||
    {}
};

const exportedClasses = [];
/**
 * Extracts the type expression from a comment string
 * @param {string} string - the comment string
 * @returns {string} the type expression
 */
function extractTypeExpression(string) {
  let count = 0;
  let position = 0;
  let expression = '';
  const startIndex = string.search(/\{[^@]/);
  let textStartIndex;

  if (startIndex !== -1) {
    // advance to the first character in the type expression
    position = textStartIndex = startIndex + 1;
    count++;
    while (position < string.length) {
      switch (string[position]) {
        case '\\': {
          // backslash is an escape character, so skip the next character
          position++;
          break;
        }
        case '{': {
          count++;
          break;
        }
        case '}': {
          count--;
          break;
        }
        default:
        // do nothing
      }
      if (count === 0) {
        expression = string.slice(textStartIndex, position).trim();
        break;
      }
      position++;
    }
  }
  return expression.replaceAll(`{`, '{').replaceAll(`}`, '}');
}

/**
 * Gets the absolute file path corresponding to the specified doclet.
 * @param {Doclet} d - the specified doclet
 * @returns {string} the absolute file path
 */
const getFilePath = d => path.join(d.meta.path, d.meta.filename);

/**
 * Get the module name corresponding to the given filename and path.
 * In case of index.js the folder name is used.
 * @param {string} filename - the given filename
 * @param {string} folderPath - the given folder path containing the file
 * @returns {string} the module name
 */
const getModuleName = (filename, folderPath) => {
  const shortname = path.basename(filename, path.extname(filename));
  const namespacePath = path.relative(config.rootFolder, folderPath).split(path.sep);
  namespacePath.shift();
  if (shortname !== 'index') namespacePath.push(shortname);
  return namespacePath.join('/');
};

/**
 * Defines the default process on doclet: applying the 'value' function defined on the configuration object to the specified key/property of the doclet instance.
 * @param {object} cf - The configuration object.
 * @param {string} k - The key/property of the object.
 * @returns {Function} A function that takes a doclet as input and sets the corresponding key/property with the 'value' function.
 */
const defaultProcess = (cf, k) => d => {
  d[k] = cf.value(d);
};

/**
 * The configuration of the doclet processing.
 * Each key of the configuration object defines a process:
 * - either explicitly if the 'process' function is defined,
 * - either implictly if the 'value' function is defined : in such case the process consists of applying a value to the corresponding key property of the doclet instance.
 * - In both cases, the process is executed if there is no 'condition' function, or if the 'condition' function evaluates to true.
 * @type {DocletProcessorConfiguration}
 */
const processConfig = {
  isExportedClass: {
    // add 'isExportedClass' property that indicates if the class is exported
    condition: d =>
      d.kind === 'class' &&
      d.meta.code &&
      d.meta.code.name &&
      (d.meta.code.name.startsWith('export') || (d.tags && d.tags.some(t => t.title === 'export'))),
    process: d => exportedClasses.push(d.name)
  },
  tocDescription: {
    // add 'tocDescription' property that represents the description of a module that appears in the toc
    condition: d => d.kind === 'module' && !d.tocDescription,
    value: d => d.description
  },
  valuecode: {
    // add 'valuecode' property that represents the source code of a constant
    condition: d => d.kind === 'constant',
    value: d => {
      const sourcefile = getFilePath(d);
      const source = fs.readFileSync(sourcefile, 'utf8');
      const indexedSource = lineColumn(source);
      const { loc } = d.meta.code.node;
      const code = source.slice(
        indexedSource.toIndex(loc.start.line, loc.start.column + 1),
        indexedSource.toIndex(loc.end.line, loc.end.column + 1)
      );
      return code.includes(' =') ? code.slice(code.indexOf(' =') + 3, -1) : code;
    }
  },
  screenshot: {
    // add 'screenshot' property that indicates if the documented has a related snapshot image?
    condition: d => {
      if (!['module', 'class'].includes(d.kind)) return false;
      // the relative path of the screenshot file
      const filename = `${d.kind}_${path.basename(d.meta.filename, path.extname(d.meta.filename))}.png`;
      const filepath = path.join(config.docFolder, 'images/screenshots', filename);
      return fs.existsSync(filepath);
    },
    value: d => `${d.kind}_${path.basename(d.meta.filename, path.extname(d.meta.filename))}.png`
  },
  category: {
    // modify the 'category' property: add a default value ('other') if none found
    condition: d => !d.category && ['module', 'class'].includes(d.kind),
    value: () => 'other'
  },
  categorycolor: {
    // add 'categorycolor' property
    value: d => config.badgecolors[d.category] || 'blue'
  },
  static: {
    // add 'relativepath' property that indicates if the documented object is static?
    value: d => d.scope === 'static'
  },
  hasParameters: {
    // add 'hasParameters' property that indicates if the documented object has @param or @returns tags?
    value: d => (d.params && d.params.length > 0) || (d.returns && d.returns.length > 0)
  },
  relativepath: {
    // add 'relativepath' property that indicates the relative path from the documentation to the source code
    value: d => {
      const filepath = getFilePath(d); // the absolute path of the source file
      return path.relative(config.docFolder, filepath); // the relative path of the source file from the documentation folder
    }
  },
  type: {
    // add 'type' property that indicates the type of a member when type is expressed as typescript expression that throws error on JSDoc 4
    condition: d => d.kind === 'member' && d.comment && !d.type,
    value: d => ({ names: [extractTypeExpression(d.comment)] })
  },
  memberof: {
    // modify the 'memberof' property: fix 'export default var'
    condition: d => d.kind !== 'module' && !d.memberof && d.longname && d.longname.startsWith('module:'),
    value: d => d.longname
  },
  access: {
    // modify the 'access' property: add a default value ('private') if none found
    condition: d => !d.access,
    value: d => {
      if (d.memberof && exportedClasses.includes(d.memberof) && d.name.charAt(0) !== '_') return 'public';
      if (
        (d.kind === 'constant' || d.kind === 'function' || d.kind === 'member') &&
        d.meta.code &&
        d.meta.code.name &&
        d.meta.code.name.length > 0 &&
        (d.meta.code.name.startsWith('exports.') || d.meta.code.name === 'module.exports')
      ) {
        return 'public';
      }
      return 'private';
    }
  },
  included: {
    // add 'included' property that indicates if the comment is to be included in the doc
    value: d => ['module', 'class'].includes(d.kind) || config.includes.includes(d.access)
  },
  isDefault: {
    // add 'isDefault' property that indicates if the documented object is the default export of the module
    condition: d => d.kind !== 'module' && d.name && d.name.startsWith('module:'),
    process: d => {
      d.isDefault = true;
      d.name = 'default';
    }
  },
  fixUndocumented: {
    // fix a jsdoc regression: constructors are forced to undocumented on some conditions
    // so the publish handler has been modified to include also undocumented
    // and truly undocumented doclets are marked as 'included': false so that they can be removed
    condition: d => d.undocumented === true,
    process: d => {
      d.included = false;
    }
  }
};

/**
 * Processes the specified doclet to add or modify properties based on the processConfig object.
 * @param {Doclet} doclet - the specified doclet
 * @returns {void}
 */
const processDoclet = doclet =>
  Object.keys(processConfig)
    .filter(k => processConfig[k].condition === undefined || processConfig[k].condition(doclet))
    .forEach(k => (processConfig[k].process || defaultProcess(processConfig[k], k))(doclet));

/**
 * Processes the parsed doclets to provide a better hierarchy.
 * @param {Doclet[]} doclets - The array of parsed doclets.
 */
const processDoclets = doclets => {
  // 1: all js files with comments
  const documentedFiles = new Set(doclets.filter(d => !d.undocumented).map(d => getFilePath(d)));
  // 2: js files documented as @module
  const documentedAsModuleFiles = new Set(
    doclets.filter(d => d.kind === 'module' && !d.undocumented).map(d => getFilePath(d))
  );
  // define the (1-2) remaining files that will now be documented through new 'parent' module doclets
  const toDocumentAsModuleFiles = [...documentedFiles].filter(x => !documentedAsModuleFiles.has(x));
  // retrieve documented global class and functions and configure memberof so that they will be attached
  // to their new 'parent' module doclets
  const classDoclets = doclets.filter(d => d.kind === 'class' && d.scope === 'global' && !d.undocumented);
  classDoclets.forEach(d => {
    const moduleName = getModuleName(d.meta.filename, d.meta.path);
    d.memberof = `module:${moduleName}`;
  });
  const functionsDoclets = doclets.filter(
    d => d.kind === 'function' && d.scope === 'global' && !d.undocumented
  );
  functionsDoclets.forEach(d => {
    const moduleName = getModuleName(d.meta.filename, d.meta.path);
    d.memberof = `module:${moduleName}`;
  });
  // class dictionary to copy some class properties to the new 'parent' module doclets
  const documentedAsClassFiles = new Map(classDoclets.map(d => [getFilePath(d), d]));
  // the new parent module doclets to be created
  const modules = toDocumentAsModuleFiles.map(f => {
    const classDoclet = documentedAsClassFiles.has(f) ? documentedAsClassFiles.get(f) : {};
    const moduleName = getModuleName(path.basename(f), path.dirname(f));
    const doclet = {
      tocDescription: classDoclet.classdesc || `Module ${moduleName}`,
      meta: {
        filename: path.basename(f),
        path: path.dirname(f)
      },
      kind: 'module',
      category: classDoclet.category,
      name: moduleName,
      longname: `module:${moduleName}`
    };
    processDoclet(doclet);
    return doclet;
  });
  modules.forEach(m => doclets.push(m));
};

/**
 * Defines the event handlers of the JSDoc plugin.
 * @type {JsDocPluginEventHandlers}
 */
exports.handlers = {
  parseComplete: parseCompleteEvent => {
    const { doclets } = parseCompleteEvent;
    processDoclets(doclets);
  },
  newDoclet: newDocletEvent => {
    const { doclet } = newDocletEvent;
    processDoclet(doclet);
  }
};

/**
 * Defines a new JSDoc tag 'category' that accepts a text value.
 * This adds a corresponding 'category' property on the corresponding doclet.
 * @type {JsDocPluginTagCreator}
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
