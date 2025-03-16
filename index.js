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

const tagModule = 'module:';

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
 * @param {string} string the comment string
 * @returns {string | undefined} the type expression
 */
function extractTypeExpression(string) {
  if (!string) return;
  let count = 0;
  let position = 0;
  let expression;
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
  return expression?.replaceAll(`{`, '{')?.replaceAll(`}`, '}');
}

/**
 * Extracts the type, name and description of the 'param' tag.
 * @param {string} line the comment line
 * @returns {Doclet | undefined} list of parameters
 */
function extractParametersInfo(line) {
  if (!line || !line.includes('@param')) return;
  const type = extractTypeExpression(line);
  if (!type) return;
  const position = line.indexOf(type) + type.length + 1;
  const nameStartIndex = position + line.slice(position).search(/[^\s]/);
  const nameEndIndex = nameStartIndex + line.slice(nameStartIndex).search(/\s/);
  const name = line.slice(nameStartIndex, nameEndIndex);
  const descriptionStartIndex = nameEndIndex + line.slice(nameEndIndex).search(/[^\s]/);
  const description = line.slice(descriptionStartIndex);
  return { type: { names: [type] }, name, description };
}

/**
 * Extracts the type and description of the specified tag.
 * @param {string} line the comment line
 * @param {'return' | 'type'} tag the specified tag
 * @returns {Doclet | undefined} list of parameters
 */
function extractTagInfo(line, tag) {
  if (!line || !line.includes(tag)) return;
  const type = extractTypeExpression(line);
  if (!type) return;
  const position = line.indexOf(type) + type.length + 1;
  const descriptionStartIndex = position + line.slice(position).search(/[^\s]/);
  const trailingCommentIndex = line.slice(descriptionStartIndex).search(/\*\//);
  const description =
    trailingCommentIndex === -1
      ? line.slice(descriptionStartIndex)
      : line.slice(descriptionStartIndex, descriptionStartIndex + trailingCommentIndex - 1);
  return { type: { names: [type] }, description };
}

/**
 * Tries to populate 'params' and 'return' type and description on the specified doclet if not provided but found through comment
 * @param {Doclet} doclet the doclet to process
 */
function populateFunctionInfo(doclet) {
  if (doclet.comment?.length <= 0) return;
  const parameterLines = doclet.comment.split(/\n/).filter(l => l.includes('@param'));
  if (parameterLines?.length !== doclet.params?.length) return;
  for (const [index, parameterLine] of parameterLines.entries()) {
    const parameterInfo = extractParametersInfo(parameterLine);
    if (parameterInfo && !doclet.params[index].type) {
      doclet.params[index].type = parameterInfo.type;
      doclet.params[index].description = parameterInfo.description;
    }
  }
  const returnLines = doclet.comment.split(/\n/).filter(l => l.includes('@return'));
  if (returnLines?.length !== doclet.returns?.length) return;
  for (const [index, returnLine] of returnLines.entries()) {
    const returnInfo = extractTagInfo(returnLine, 'return');
    if (returnInfo && !doclet.returns[index].type) {
      doclet.returns[index].type = returnInfo.type;
      doclet.returns[index].description = returnInfo.description;
    }
  }
}

/**
 * Tries to populate type and description on the specified doclet if not provided but found through comment
 * @param {Doclet} doclet the doclet to process
 */
function populateMemberInfo(doclet) {
  if (doclet.comment?.length <= 0) return;
  const typeLines = doclet.comment.split(/\n/).filter(l => l.includes('@type'));
  if (typeLines?.length !== 1) return;
  const typeLine = typeLines[0];
  const typeInfo = extractTagInfo(typeLine, 'type');
  if (typeInfo?.type && !doclet.type) doclet.type = typeInfo.type;
  if (typeInfo?.description && !doclet.description) doclet.description = typeInfo.description;
}

/**
 * Gets the absolute file path corresponding to the specified doclet.
 * @param {Doclet} d the specified doclet
 * @returns {string} the absolute file path
 */
const getFilePath = d => path.join(d.meta.path, d.meta.filename);

/**
 * Get the module name corresponding to the given filename and path.
 * In case of index.js the folder name is used.
 * @param {string} filename the given filename
 * @param {string} folderPath the given folder path containing the file
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
 * @param {object} cf the configuration object
 * @param {string} k the key/property of the object
 * @returns {Function} a function that takes a doclet as input and sets the corresponding key/property with the 'value' function
 */
const defaultProcess = (cf, k) => d => {
  d[k] = cf.value(d);
  return d;
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
    // and add this class to the list of exported classes
    condition: d =>
      d.kind === 'class' &&
      d.meta.code &&
      d.meta.code.name &&
      (d.meta.code.name.startsWith('export') || (d.tags && d.tags.some(t => t.title === 'export'))),
    process: d => {
      exportedClasses.push(d.name);
      return d;
    }
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
      return path.relative(config.docFolder, filepath).replaceAll(path.sep, path.posix.sep); // the relative path of the source file from the documentation folder
    }
  },
  fixDotPathForModule: {
    // fix a jsdoc issue: 'longname' and 'memberof' are corrupted when file path contains a dot: 'module' string appears in the middle of 'longname'
    condition: d => d.longname?.indexOf(tagModule) > 0 && d.kind === 'module',
    process: d => {
      d.name = d.longname.replace(tagModule, '');
      d.longname = tagModule + d.name;
      if (d.memberof) delete d.memberof;
      return d;
    }
  },
  fixDotPathForNonModule: {
    // fix a jsdoc issue: 'longname' and 'memberof' are corrupted when file path contains a dot: 'module' string appears in the middle of 'longname'
    condition: d => d.longname?.indexOf(tagModule) > 0 && d.kind !== 'module',
    process: d => {
      d.longname = tagModule + d.longname.replace(tagModule, '');
      d.memberof = tagModule + d.memberof.replace(tagModule, '');
      return d;
    }
  },
  memberof: {
    // modify the 'memberof' property: fix 'export default var'
    condition: d => d.kind !== 'module' && !d.memberof && d.longname && d.longname.startsWith(tagModule),
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
    condition: d => d.kind !== 'module' && d.name && d.name.startsWith(tagModule),
    process: d => {
      d.isDefault = true;
      d.name = 'default';
      return d;
    }
  },
  fixUndocumented: {
    // fix a jsdoc regression: constructors are forced to undocumented on some conditions
    // so the publish handler has been modified to include also undocumented
    // and truly undocumented doclets are marked as 'included': false so that they can be removed
    condition: d => d.undocumented === true,
    process: d => {
      d.included = false;
      return d;
    }
  },
  acceptTypeScriptType: {
    // add 'type' property when type tag is expressed as some funky typescript expression
    // causing JSDoc to throw an error preventing type to be defined
    // but still can be retrieved from the comment property
    condition: d => d.comment?.length > 0,
    process: d => {
      if (d.kind === 'member' && !d.type) {
        populateMemberInfo(d);
      }
      if (d.kind === 'function' || d.kind === 'constant') {
        populateFunctionInfo(d);
      }
      return d;
    }
  }
};

/**
 * Processes the specified doclet to add or modify properties based on the processConfig object.
 * @param {Doclet} doclet the specified doclet to modify
 * @returns {Doclet} the modified doclet
 */
function processDoclet(doclet) {
  let modifiedDoclet = doclet;
  for (const k of Object.keys(processConfig)) {
    if (processConfig[k].condition && processConfig[k].condition(doclet) === false) continue;
    modifiedDoclet = (processConfig[k].process || defaultProcess(processConfig[k], k))(modifiedDoclet);
  }
  return modifiedDoclet;
}

/**
 * Processes the parsed doclets to provide a better hierarchy.
 * @param {Doclet[]} doclets the array of parsed doclets
 */
function processDoclets(doclets) {
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
}

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
