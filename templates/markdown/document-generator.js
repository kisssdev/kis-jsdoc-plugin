/**
 * Defines a markdown document generator that uses handlebars templates.
 * @module
 * @category Core
 */
const fs = require('fs-extra');
const path = require('path');
const Handlebars = require('handlebars');
// @ts-ignore
const logger = require('jsdoc/util/logger');
// @ts-ignore
const env = require('jsdoc/env');

/**
 * The configuration of the document generator.
 */
const config = {
  imageext:
    (env.conf.templates && env.conf.templates.markdown && env.conf.templates.markdown.imageext) || 'svg',
  docFolder: env.opts.destination,
  rootFolder: env.opts.template,
  encoding: env.opts.encoding,
  tocfilename:
    (env.conf.templates && env.conf.templates.markdown && env.conf.templates.markdown.tocfilename) ||
    'toc.md',
  tocOrder: (env.conf.templates && env.conf.templates.markdown && env.conf.templates.markdown.tocOrder) || {},
  externallinks:
    (env.conf.templates && env.conf.templates.markdown && env.conf.templates.markdown.externallinks) || {},
  badgecolors:
    (env.conf.templates && env.conf.templates.markdown && env.conf.templates.markdown.badgecolors) || {}
};

/**
 * The order of constants, functions and members based on their access
 */
const order = { public: 0, protected: 1, private: 2 };

/**
 * Sorts doclets by their access property
 * @param {Doclet} d1 first doclet
 * @param {Doclet} d2 second doclet
 * @returns {number} the order delta
 */
const accessSorter = (d1, d2) => order[d1.access] - order[d2.access];

/**
 * Converts an array of object to a dictionary.
 * @param {object[]} array the array of objects to convert to dictionary
 * @param {Function} keyGenerator the function used to define the key of the object added to the dictionary
 * @param {Function} [valueGenerator] the function used to define the value of the object added to the dictionary
 * @returns {object} The object acting as a dictionary.
 * @example
 * let res = toDictionary([{n:'a', v:1}, {n:'b', v:2}], o => o.n, o => o.v);
 * // res is {a: 1, b: 2 }
 * @example
 * let res = toDictionary([{n:'a', v:1}, {n:'b', v:2}], o => o.n);
 * // res is {a: {n:'a', v:1}, b: {n:'b', v:2} }
 */
const toDictionary = (array, keyGenerator, valueGenerator = item => item) =>
  array.reduce((accumulator, item, index) => {
    accumulator[keyGenerator(item, index)] = valueGenerator(item, index);
    return accumulator;
  }, {});

/**
 * Converts an array of object to an object containing arrays.
 * The value produced by the specified keySelector is used to define the properties of the resulting object.
 * @param {object[]} array the array of objects to convert to dictionary
 * @param {Function} keySelector the function used to define the key
 * @param {Function} [valueSelector] the function used to define the value
 * @returns {object} The resulting object.
 * @example
 * let res = keyBy([{n:'a', v:1}, {n:'b', v:2}, {n:'a', v:3}], o => o.n, o => o.v);
 * // res is {a: [1, 3], b: [2] }
 * @example
 * let res = keyBy([{n:'a', v:1}, {n:'b', v:2}, {n:'a', v:3}], o => o.n);
 * // res is {a: [{n:'a', v:1}, {n:'a', v:3}], b: [{n:'b', v:2}] }
 */
const keyBy = (array, keySelector, valueSelector = item => item) =>
  array.reduce((accumulator, item) => {
    const valuesArray = accumulator[keySelector(item)] || [];
    valuesArray.push(valueSelector(item));
    accumulator[keySelector(item)] = valuesArray;
    return accumulator;
  }, {});

/**
 * Transforms {\@link MyClass} or {\@link url|A text} inline tags within the specified JSDoc doclet
 * to a markdown link to the associated type documentation.
 * @param {Doclet} doclet the JSDoc doclet to transform
 * @param {Record<string, string>} typesIndex the types index - associating a type with its documentation file
 */
function generateLinks(doclet, typesIndex) {
  const regexp = /\{@link\s+([^|\s]+)(|[^{]+)?\}/gi; // capture only {@link namepathOrURL} or {@link namepathOrURL|link text}
  const transformLinks = s =>
    regexp.test(s)
      ? s.replaceAll(regexp, (string, p1, p2) => {
          const label = p2 ? p2.slice(1) : p1;
          const link = typesIndex[p1] || p1;
          return `[${label}](${link})`;
        })
      : s;
  ['classdesc', 'description', 'tocDescription'].forEach(s => {
    doclet[s] = transformLinks(doclet[s]);
  });
}

/**
 * Transforms {\@link MyClass} or {\@link url|A text} inline tags within the specified JSDoc doclet
 * and all of its descendants to a markdown link to the associated type documentation.
 * @param {Doclet} doclet the JSDoc doclet to transform
 * @param {Record<string, string>} typesIndex the types index - associating a type with its documentation file
 */
function generateLinksRecursively(doclet, typesIndex) {
  generateLinks(doclet, typesIndex);
  if (doclet.classes) doclet.classes.forEach(c => generateLinksRecursively(c, typesIndex));
  if (doclet.functions) doclet.functions.forEach(c => generateLinksRecursively(c, typesIndex));
  if (doclet.constants) doclet.constants.forEach(c => generateLinksRecursively(c, typesIndex));
  if (doclet.parameters) doclet.parameters.forEach(c => generateLinks(c, typesIndex));
  if (doclet.returns) doclet.returns.forEach(c => generateLinks(c, typesIndex));
}

/**
 * Compiles the handlebars templates and defines a templates index in the given folder.
 * If registerAsPartial is true, templates are only precompiled and no index is returned.
 * @param {string} folder the folder that contains the handlebars templates
 * @param {boolean} registerAsPartial register as partial templates?
 * @returns {Record<string, any>} the templates index - associating the name of the template with its handlebar compiled template
 */
function compileTemplatesInFolder(folder, registerAsPartial = false) {
  const templates = {};
  fs.readdirSync(folder, { encoding: config.encoding, withFileTypes: true })
    .filter(d => !d.isDirectory())
    .forEach(f => {
      try {
        const templateName = path.basename(f.name, path.extname(f.name));
        /** @type {any} */
        const templateSource = fs.readFileSync(path.join(folder, f.name), config.encoding);
        if (registerAsPartial) {
          // let partial = Handlebars.precompile(templateSource);
          Handlebars.registerPartial(templateName, templateSource);
        } else {
          templates[templateName] = Handlebars.compile(templateSource);
        }
      } catch (error) {
        logger.error(`Unable to compile the template file ${f.name}: ${error}`);
      }
    });
  return templates;
}

/**
 * Compiles the handlebars templates and defines a templates index.
 * @returns {Record<string, any>} the templates index - associating the name of the template with its handlebar compiled template
 */
function compileTemplates() {
  let templates = {};
  const templatesFolder = path.join(config.rootFolder, 'templates');
  try {
    compileTemplatesInFolder(path.join(templatesFolder, 'partials'), true);
    templates = compileTemplatesInFolder(templatesFolder);
  } catch (error) {
    logger.error(`Unable to enumerate and compile template files: ${error}`);
  }
  return templates;
}

/**
 * Defines the name of the documentation file of the specified JSDoc doclet.
 * @param {Doclet} doclet the specified JSDoc doclet
 * @returns {string} the documentation file name
 */
function defineDocfilename(doclet) {
  const uniquePath = path
    .relative(env.pwd, doclet.meta.path)
    .replaceAll(new RegExp(`\\${path.sep}`, 'g'), '-');
  return `${uniquePath}_${path.basename(doclet.meta.filename, path.extname(doclet.meta.filename))}.md`;
}

/**
 * Generates the documentation file of the given model and handlebars template.
 * @param {object} model the model to use for the handlebars template
 * @param {Handlebars.TemplateDelegate} template the handlebars template
 * @param {string} docfilename the documentation file name
 */
function generateDocfile(model, template, docfilename) {
  if (!template) {
    logger.error(`There is no template for ${docfilename}`);
    return;
  }
  try {
    const result = template(model);
    const docfilepath = path.join(config.docFolder, docfilename);
    fs.ensureFileSync(docfilepath);
    fs.writeFile(docfilepath, result, config.encoding, error => {
      if (error) logger.error(`Unable to save ${docfilepath}: ${error.message}`);
    });
  } catch (error) {
    logger.error(`Unable to generate ${docfilename}: ${error}`);
  }
}

/**
 * Generates the documentation for the given JSDoc doclet.
 * @param {Doclet} doclet the JSDoc doclet for which the documentation will be generated
 * @param {Handlebars.TemplateDelegate} template the handlebars template
 * @param {Record<string, any>} typesIndex the types index - associating a type with its documentation file
 */
function generateDocument(doclet, template, typesIndex) {
  generateLinksRecursively(doclet, typesIndex);
  // sort children doclets by access
  if (doclet.functions) doclet.functions.sort(accessSorter);
  if (doclet.constants) doclet.constants.sort(accessSorter);
  if (doclet.classes) {
    doclet.classes.forEach(c => {
      if (c.functions) c.functions.sort(accessSorter);
      if (c.members) c.members.sort(accessSorter);
    });
  }
  generateDocfile(doclet, template, defineDocfilename(doclet));
}

/**
 * Generates the table of contents for the given documentation root node.
 * @param {object} rootNode the documentation root node for which the table of contents will be generated
 * @param {Handlebars.TemplateDelegate} template the handlebars template
 */
function generateToc(rootNode, template) {
  if (!rootNode.modules) return;
  const documentByCategory = keyBy([...(rootNode.modules || [])], d => d.category);
  const colorByCategory = config.badgecolors;
  const tocSorter = (c1, c2) => config.tocOrder[c1] - config.tocOrder[c2];
  const toc = Object.keys(documentByCategory)
    .sort(tocSorter)
    .map(cat => ({
      name: cat,
      entries: documentByCategory[cat],
      color: colorByCategory[cat] || 'blue'
    }));
  generateDocfile(toc, template, config.tocfilename);
}

/**
 * Copies the resources - i.e. images or svg - to the final documentation folder.
 */
function copyResources() {
  const resourcesFolder = path.join(config.rootFolder, 'resources');
  fs.copy(resourcesFolder, config.docFolder, error => {
    if (error) logger.error(`Unable to copy resources in documentation folder ${config.docFolder}: ${error}`);
  });
}

/**
 * Initializes handlebars, registers custom helpers and compilates templates.
 * @param {string} typesIndex the types index - associating a type with its documentation file
 * @returns {Record<string, any>} the templates index - associating the name of the template with its handlebar compiled template
 */
function initHandlebars(typesIndex) {
  Handlebars.registerHelper('join', (context, options) => {
    const property = options.hash.on;
    const target = p => (property ? p[property] : p);
    return context
      ? context
          .map(p => target(p))
          .filter(p => !p.includes('.'))
          .join(', ')
      : '';
  });
  const options = { imageext: config.imageext };
  Handlebars.registerHelper('link', item =>
    item && typesIndex[item] ? `[${item}](${typesIndex[item]})` : `\`${item}\``
  );
  Handlebars.registerHelper('inMdTable', item => (item ? item.replaceAll('|', String.raw`\|`) : item));
  Handlebars.registerHelper('options', context => options[context]);
  return compileTemplates();
}

/**
 * Generates the documentation.
 *   @param {Doclet} rootNode The documentation root node
 *   @param {Record<string, any>} [_options] The options.
 */
exports.generateDoc = (rootNode, _options) => {
  // generate an index of the class type <-> doc file
  const classes = (rootNode.modules || []).filter(m => m.classes !== undefined).flatMap(m => m.classes) || [];
  const all = classes.concat(rootNode.modules).filter(d => d && d.name && d.name.length > 0);
  const typesIndex = toDictionary(
    all,
    d => d.name,
    d => defineDocfilename(d)
  );
  Object.entries(config.externallinks).forEach(([key, value]) => {
    typesIndex[key] = value;
  });
  // create handlebars helpers and compile templates
  const templates = initHandlebars(typesIndex);
  // generate doc file for each modules
  if (rootNode.modules) rootNode.modules.forEach(d => generateDocument(d, templates.module, typesIndex));
  // generate the TOC
  generateToc(rootNode, templates.toc);
  // copy the resources
  copyResources();
};
