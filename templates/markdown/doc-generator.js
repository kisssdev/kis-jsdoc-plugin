/**
 * Defines a markdown document generator that uses handlebars templates.
 * @module
 */
const fs = require('fs-extra');
const path = require('path');
const Handlebars = require('handlebars');
const logger = require('jsdoc/util/logger');

/**
 * The configuration of the document generator.
 */
const config = {
  docFolder: env.opts.destination,
  rootFolder: env.opts.template,
  encoding: env.opts.encoding,
  tocfilename: (env.conf.templates && env.conf.templates['markdown'] && env.conf.templates['markdown'].tocfilename) || 'toc.md'
};

/**
 * Converts an array of object to a dictionary.
 * @param {Array.<Object>} arr - The array of objects to convert to dictionary.
 * @param {function} keyGenerator - The function used to set the key of the object added to the dictionary.
 * @param {function} [valueGenerator=(item, index)=>item] - The function used to set the value of the object added to the dictionary.
 * @return {Object} The object acting as a dictionary.
 */
const toDictionary = (arr, keyGenerator, valueGenerator = (item, index) => item) => arr.reduce((acc, item, index) => {
  acc[keyGenerator(item, index)] = valueGenerator(item, index);
  return acc;
}, {});

/**
 * Converts an array of object to an object containing arrays.
 * The value produced by the specified keyGenerator is used to define the properties of the resulting object.
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
const keyBy = (arr, keySelector, valueSelector = item => item) => arr.reduce((acc, item, index) => {
  let valuesArray = acc[keySelector(item)] || [];
  valuesArray.push(valueSelector(item));
  acc[keySelector(item)] = valuesArray;
  return acc;
}, {});

/**
 * Transforms {\@link MyClass} or {\@link url|A text} inline tags within the specified jsdoc doclet
 * to a markdown link to the associated type documentation.
 * @param {Doclet} doclet - The jsdoc doclet to transform.
 * @param {Object.<string>} typesIndex - The types index - associating a type with its documentation file.
 */
function generateLinks(doclet, typesIndex) {
  const regexp = /\{@link\s+([^|\s]+)(|[^\{]+)?\}/ig; // capture only {@link namepathOrURL} or {@link namepathOrURL|link text}
  const transformLinks = s => (regexp.test(s)) ?
    s.replace(regexp, (str, p1, p2) => {
      let label = (!p2) ? p1 : p2.substring(1);
      let link = typesIndex[p1] || p1;
      return `[${label}](${link})`;
    }) :
    s;
  ['classdesc', 'description', 'tocDescription'].forEach(s => doclet[s] = transformLinks(doclet[s]));
}

/**
 * Compiles the handlebars templates and defines a templates index.
 * @return {Object.<string>} The templates index - associating the name of the template with its handlebar compiled template.
 */
function compileTemplates() {
  let templates = {};
  let templatesFolder = path.join(config.rootFolder, 'templates');
  try {
    fs.readdirSync(templatesFolder, config.encoding).forEach(filename => {
      try {
        let templatePath = path.join(templatesFolder, filename);
        let templateName = path.basename(filename, path.extname(filename));
        let templateSource = fs.readFileSync(templatePath, config.encoding);
        templates[templateName] = Handlebars.compile(templateSource);
      } catch (err) {
        logger.error(`Unable to compile the template file ${filename}: ${err}`);
      }
    });
  } catch (e) {
    logger.error(`Unable to enumerate and compile template files: ${e}`);
  }
  return templates;
}

/**
 * Defines the name of the documentation file of the specified jsdoc doclet.
 * @param {Doclet} doclet - The specified jsdoc doclet.
 * @return {string} The documentation file name.
 */
function defineDocfilename(doclet) {
  let basename = path.basename(doclet.meta.filename, path.extname(doclet.meta.filename));
  if (basename === 'index') {
    const lastFolder = doclet.meta.path.split(path.sep).slice(-1)[0];
    basename = `${lastFolder}_${basename}`;
  }
  return `${doclet.kind}_${basename}.md`;
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
    let result = template(model);
    let docpath = path.join(config.docFolder, docfilename);
    fs.ensureDirSync(config.docFolder);
    fs.writeFile(docpath, result, config.encoding, err => {
      if (err) logger.error(`Unable to save ${docfilename}: ${err.message}`);
    });
  } catch (e) {
    logger.error(`Unable to generate ${docfilename}: ${e}`);
  }
}

/**
 * Generates the documentation for the given jsdoc doclet.
 * @param {Doclet} doclet - The jsdoc doclet for which the documentation will be generated.
 * @param {Template} template - The handlebars template.
 * @param {Object.<string>} typesIndex - The types index - associating a type with its documentation file.
 */
function generateDoc(doclet, template, typesIndex) {
  generateLinks(doclet, typesIndex);
  doclet.docfilename = defineDocfilename(doclet);
  generateDocfile(doclet, template, doclet.docfilename);
}

/**
 * Generates the table of contents for the given documentation root node.
 * @param {Object} rootNode - The documentation root node for which the table of contents will be generated.
 * @param {Template} template - The handlebars template.
 */
function generateToc(rootNode, template) {
  if (!rootNode.classes && !rootNode.modules) return;
  const docByCategory = keyBy([...(rootNode.classes || []), ...(rootNode.modules || [])], d => d.category);
  const toc = Object.keys(docByCategory).map(cat => ({
    name: cat,
    entries: docByCategory[cat]
  }));
  generateDocfile(toc, template, config.tocfilename);
}

/**
 * Copy the resources - i.e. images or svg - to the final documentation folder.
 */
function copyResources() {
  let resourcesFolder = path.join(config.rootFolder, 'resources');
  fs.copy(resourcesFolder, config.docFolder, err => {
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
    let prop = options.hash.on;
    const target = p => prop ? p[prop] : p;
    return context ? context.map(p => target(p)).filter(p => !p.includes('.')).join(', ') : '';
  });
  Handlebars.registerHelper('eachwhen', (context, options) => {
    // each options.hash is a property 'p' of the object 'o' on which we set a predicate to filter a value or a list of values (separated by ',')
    let predicates = Object.keys(options.hash).map(p => o => (options.hash[p]) ? (options.hash[p].split(',') || []).includes(o[p]) : true)
    // cumulate predicates as 'and'
    let predicate = predicates.reduce((prev, curr) => o => prev(o) && curr(o), o => true)
    return context.filter(predicate).map(o => options.fn(o)).reduce((prev, curr) => prev + curr, '')
  });
  Handlebars.registerHelper('link', (item, options) => {
    return (typesIndex[item]) ? `[${item}](${typesIndex[item]})` : `\`${item}\``;
  });
  return compileTemplates();
}

/**
 * Generates the documentation.
 *   @param {{classes: Array.<Doclet>, modules: Array.<Doclet>}} rootNode - The documentation root node.
 */
exports.generateDoc = (rootNode) => {
  // generate an index of the class type <-> doc file
  const typesIndex = toDictionary(rootNode.classes || [], d => d.name, d => defineDocfilename(d));
  // create handlebars helpers and compile templates
  const templates = initHandlebars(typesIndex);
  // generate doc file for classes and modules
  if (rootNode.classes) rootNode.classes.forEach(d => generateDoc(d, templates[d.kind], typesIndex));
  if (rootNode.modules) rootNode.modules.forEach(d => generateDoc(d, templates[d.kind], typesIndex));
  // generate the TOC
  generateToc(rootNode, templates.toc);
  // copy the resources
  copyResources();
};