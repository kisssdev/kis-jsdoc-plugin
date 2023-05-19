/**
 * Defines a JSDoc template that creates a code tree based on the JSDoc doclets
 * and calls the docgenerator.
 * @module
 * @category JSDocTemplate
 */

const docGenerator = require('./doc-generator');

/**
 * Configuration used to build the documentation tree.
 * Each key is a JSDoc doclet kind, expliciting the children collection name that will be created
 * and if a recursive parsing is required to build this collection.
 * @type {Object.<{childrenCollection: string, recurse: boolean}>}
 */
const configuration = {
  namespace: { childrenCollection: 'namespaces', recurse: true },
  module: { childrenCollection: 'modules', recurse: true },
  class: { childrenCollection: 'classes', recurse: true },
  mixin: { childrenCollection: 'mixins', recurse: true },
  function: { childrenCollection: 'functions', recurse: false },
  member: { childrenCollection: 'members', recurse: false },
  event: { childrenCollection: 'events', recurse: false },
  constant: { childrenCollection: 'constants', recurse: false },
};

/**
 * Attaches the given JSDoc doclet to the given parent node.
 * @param {Doclet} doclet - The JSDoc doclet to attach.
 * @param {Doclet} parentNode - The parent node on which to attach the JSDoc doclet.
 * @param {Array.<Doclet>} doclets - The array of all JSDoc doclets.
 */
function attachToParent(doclet, parentNode, doclets) {
  // identify the process depending of the doclet kind
  const process = configuration[doclet.kind];
  if (!process) return; // nothing to process
  // create the parent node children collection if not present
  /* eslint-disable no-param-reassign */
  if (!parentNode[process.childrenCollection]) parentNode[process.childrenCollection] = [];
  // add the child node to the parent node children collection
  parentNode[process.childrenCollection].push(doclet);
  // recurse the process if applicable
  /* eslint-disable no-use-before-define */
  if (process.recurse) buildTree(doclet, doclets, doclet.longname);
}

/**
 * Builds the documentation tree recursively.
 * @param {Doclet} parentNode - The parent node.
 * @param {Array.<Doclet>} doclets - The array of all JSDoc doclets.
 * @param {string} parentLongname - The JSDoc long name of the parent.
 */
function buildTree(parentNode, doclets, parentLongname) {
  doclets
    .filter((doclet) => doclet.memberof === parentLongname)
    .forEach((doclet) => attachToParent(doclet, parentNode, doclets));
}

/**
 * Builds a tree of JSDoc doclet data and generates documentation.
 *   @param {TAFFY} data - The database containing comments and tags.
 *   @param {Object} opts - The JSDoc options.
 */
exports.publish = (data, opts) => {
  // filter Taffy database to remove undocumented doclets
  data([{ included: false }, { kind: 'package' }]).remove();

  // build the documentation tree
  const rootNode = {};
  buildTree(rootNode, data().get());

  // generate the doc
  docGenerator.generateDoc(rootNode, opts);
};
