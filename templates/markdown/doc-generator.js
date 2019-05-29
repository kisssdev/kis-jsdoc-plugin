/* eslint-disable import/no-extraneous-dependencies */
/**
 * Defines a markdown document generator that uses handlebars templates.
 * @module
 * @category Core
 */
const fs = require('fs-extra');
const path = require('path');
const Handlebars = require('handlebars');
// eslint-disable-next-line import/no-unresolved
const logger = require('jsdoc/util/logger');
// eslint-disable-next-line import/no-unresolved
const env = require('jsdoc/env');

/**
 * The configuration of the document generator.
 */
const config = {
  imageext: (env.conf.templates && env.conf.templates.markdown && env.conf.templates.markdown.imageext) || 'svg',
  docFolder: env.opts.destination,
  rootFolder: env.opts.template,
  encoding: env.opts.encoding,
  tocfilename:
    (env.conf.templates && env.conf.templates.markdown && env.conf.templates.markdown.tocfilename) || 'toc.md',
  tocOrder: (env.conf.templates && env.conf.templates.markdown && env.conf.templates.markdown.tocOrder) || {},
  externallinks: (env.conf.templates && env.conf.templates.markdown && env.conf.templates.markdown.externallinks) || {},
  badgecolors: (env.conf.templates && env.conf.templates.markdown && env.conf.templates.markdown.badgecolors) || {},
};

/**
 * The order of constants, functions and members based on their access
 */
const order = { public: 0, protected: 1, private: 2 };

/**
 * Sorts doclets by their access property
 * @param {Doclet} d1 - first doclet
 * @param {Doclet} d2 - second doclet
 */
const accessSorter = (d1, d2) => order[d1.access] - order[d2.access];

/**
 * Converts an array of object to a dictionary.
 * @param {Array.<Object>} arr - The array of objects to convert to dictionary.
 * @param {function} keyGenerator - The function used to define the key of the object added to the dictionary.
 * @param {function} [valueGenerator=(item, index)=>item] - The function used to define the value of the object added to the dictionary.
 * @return {Object} The object acting as a dictionary.
 * @example
 * let res = toDictionary([{n:'a', v:1}, {n:'b', v:2}], o => o.n, o => o.v);
 * // res is {a: 1, b: 2 }
 * @example
 * let res = toDictionary([{n:'a', v:1}, {n:'b', v:2}], o => o.n);
 * // res is {a: {n:'a', v:1}, b: {n:'b', v:2} }
 */
const toDictionary = (arr, keyGenerator, valueGenerator = item => item) => arr.reduce((acc, item, index) => {
  acc[keyGenerator(item, index)] = valueGenerator(item, index);
  return acc;
}, {});

/**
 * Converts an array of object to an object containing arrays.
 * The value produced by the specified keySelector is used to define the properties of the resulting object.
 * @param {Array.<Object>} arr - The array of objects to convert to dictionary.
 * @param {function} keySelector - The function used to define the key.
 * @param {function} [valueSelector=(item, index)=>item] - The function used to define the value.
 * @return {Object} The resulting object.
 * @example
 * let res = keyBy([{n:'a', v:1}, {n:'b', v:2}, {n:'a', v:3}], o => o.n, o => o.v);
 * // res is {a: [1, 3], b: [2] }
 * @example
 * let res = keyBy([{n:'a', v:1}, {n:'b', v:2}, {n:'a', v:3}], o => o.n);
 * // res is {a: [{n:'a', v:1}, {n:'a', v:3}], b: [{n:'b', v:2}] }
 */
const keyBy = (arr, keySelector, valueSelector = item => item) => arr.reduce((acc, item) => {
  const valuesArray = acc[keySelector(item)] || [];
  valuesArray.push(valueSelector(item));
  acc[keySelector(item)] = valuesArray;
  return acc;
}, {});

/**
 * Transforms {\@link MyClass} or {\@link url|A text} inline tags within the specified JSDoc doclet
 * to a markdown link to the associated type documentation.
 * @param {Doclet} doclet - The JSDoc doclet to transform.
 * @param {Object.<string>} typesIndex - The types index - associating a type with its documentation file.
 */
function generateLinks(doclet, typesIndex) {
  const regexp = /\{@link\s+([^|\s]+)(|[^{]+)?\}/gi; // capture only {@link namepathOrURL} or {@link namepathOrURL|link text}
  const transformLinks = s => (regexp.test(s)
    ? s.replace(regexp, (str, p1, p2) => {
      const label = !p2 ? p1 : p2.substring(1);
      const link = typesIndex[p1.toLowerCase()] || p1;
      return `[${label}](${link})`;
    })
    : s);
  /* eslint-disable no-param-reassign */
  ['classdesc', 'description', 'tocDescription'].forEach((s) => {
    doclet[s] = transformLinks(doclet[s]);
  });
}

/**
 * Compiles the handlebars templates and defines a templates index in the given folder.
 * If registerAsPartial is true, templates are only precompiled and no index is returned.
 * @return {Object.<string>} The templates index - associating the name of the template with its handlebar compiled template.
 */
function compileTemplatesInFolder(folder, registerAsPartial = false) {
  const templates = {};
  fs.readdirSync(folder, { encoding: config.encoding, withFileTypes: true })
    .filter(d => !d.isDirectory())
    .forEach((f) => {
      try {
        const templateName = path.basename(f.name, path.extname(f.name));
        const templateSource = fs.readFileSync(path.join(folder, f.name), config.encoding);
        if (registerAsPartial) {
          // let partial = Handlebars.precompile(templateSource);
          Handlebars.registerPartial(templateName, templateSource);
        } else {
          templates[templateName] = Handlebars.compile(templateSource);
        }
      } catch (err) {
        logger.error(`Unable to compile the template file ${f.name}: ${err}`);
      }
    });
  return templates;
}

/**
 * Compiles the handlebars templates and defines a templates index.
 * @return {Object.<string>} The templates index - associating the name of the template with its handlebar compiled template.
 */
function compileTemplates() {
  let templates = {};
  const templatesFolder = path.join(config.rootFolder, 'templates');
  try {
    compileTemplatesInFolder(path.join(templatesFolder, 'partials'), true);
    templates = compileTemplatesInFolder(templatesFolder);
  } catch (e) {
    logger.error(`Unable to enumerate and compile template files: ${e}`);
  }
  return templates;
}

/**
 * Defines the name of the documentation file of the specified JSDoc doclet.
 * @param {Doclet} doclet - The specified JSDoc doclet.
 * @return {string} The documentation file name.
 */
function defineDocfilename(doclet) {
  const uniquePath = path.relative(env.pwd, doclet.meta.path).replace(new RegExp(`\\${path.sep}`, 'g'), '-');
  return `${uniquePath}_${path.basename(doclet.meta.filename, path.extname(doclet.meta.filename))}.md`;
}

/**
 * Generates the documentation file of the given model and handlebars template.
 * @param {Object} model - The model to use for the handlebars template.
 * @param {Template} template - The handlebars template.
 * @param {string} docfilename - The documentation file name.
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
    fs.writeFile(docfilepath, result, config.encoding, (err) => {
      if (err) logger.error(`Unable to save ${docfilepath}: ${err.message}`);
    });
  } catch (e) {
    logger.error(`Unable to generate ${docfilename}: ${e}`);
  }
}

/**
 * Generates the documentation for the given JSDoc doclet.
 * @param {Doclet} doclet - The JSDoc doclet for which the documentation will be generated.
 * @param {Template} template - The handlebars template.
 * @param {Object.<string>} typesIndex - The types index - associating a type with its documentation file.
 */
function generateDoc(doclet, template, typesIndex) {
  generateLinks(doclet, typesIndex);
  // sort children doclets by access
  if (doclet.functions) doclet.functions.sort(accessSorter);
  if (doclet.constants) doclet.constants.sort(accessSorter);
  if (doclet.classes) {
    doclet.classes.forEach((c) => {
      if (c.functions) c.functions.sort(accessSorter);
      if (c.members) c.members.sort(accessSorter);
    });
  }
  generateDocfile(doclet, template, defineDocfilename(doclet));
}

/**
 * Generates the table of contents for the given documentation root node.
 * @param {Object} rootNode - The documentation root node for which the table of contents will be generated.
 * @param {Template} template - The handlebars template.
 */
function generateToc(rootNode, template) {
  if (!rootNode.modules) return;
  const docByCategory = keyBy([...(rootNode.modules || [])], d => d.category);
  const colorByCategory = config.badgecolors;
  const tocSorter = (c1, c2) => config.tocOrder[c1] - config.tocOrder[c2];
  const toc = Object.keys(docByCategory)
    .sort(tocSorter)
    .map(cat => ({
      name: cat,
      entries: docByCategory[cat],
      color: colorByCategory[cat] || 'blue',
    }));
  generateDocfile(toc, template, config.tocfilename);
}

/**
 * Copies the resources - i.e. images or svg - to the final documentation folder.
 */
function copyResources() {
  const resourcesFolder = path.join(config.rootFolder, 'resources');
  fs.copy(resourcesFolder, config.docFolder, (err) => {
    if (err) logger.error(`Unable to copy resources in documentation folder ${config.docFolder}: ${err}`);
  });
}

/**
 * Initializes handlebars, registers custom helpers and compilates templates.
 * @param {Object.<string>} typesIndex - The types index - associating a type with its documentation file.
 * @return {Object.<string>} The templates index - associating the name of the template with its handlebar compiled template.
 */
function initHandlebars(typesIndex) {
  Handlebars.registerHelper('join', (context, options) => {
    const prop = options.hash.on;
    const target = p => (prop ? p[prop] : p);
    return context
      ? context
        .map(p => target(p))
        .filter(p => !p.includes('.'))
        .join(', ')
      : '';
  });
  const options = { imageext: config.imageext };
  Handlebars.registerHelper('link',
    item => (item && typesIndex[item.toLowerCase()] ? `[${item}](${typesIndex[item.toLowerCase()]})` : `\`${item}\``));
  Handlebars.registerHelper('options', context => options[context]);
  return compileTemplates();
}

/**
 * Generates the documentation.
 *   @param {{classes: Array.<Doclet>, modules: Array.<Doclet>}} rootNode - The documentation root node.
 */
exports.generateDoc = (rootNode) => {
  // generate an index of the class type <-> doc file
  const typesIndex = toDictionary(rootNode.modules || [], d => d.name.toLowerCase(), d => defineDocfilename(d));
  Object.entries(config.externallinks).forEach(([key, value]) => {
    typesIndex[key.toLowerCase()] = value;
  });
  // create handlebars helpers and compile templates
  const templates = initHandlebars(typesIndex);
  // generate doc file for each modules
  if (rootNode.modules) rootNode.modules.forEach(d => generateDoc(d, templates.module, typesIndex));
  // generate the TOC
  generateToc(rootNode, templates.toc);
  // copy the resources
  copyResources();
};
