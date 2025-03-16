# Module `templates/markdown/document-generator`

![category:core](https://img.shields.io/badge/category-core-9f9f9f.svg?style=flat-square)

Defines a markdown document generator that uses handlebars templates.

[Source file](../templates/markdown/document-generator.js)

## Functions

### `generateDoc(rootNode, _options)`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Generates the documentation.

Parameters | Type | Description
--- | --- | ---
__rootNode__ | `Doclet` | *The documentation root node*
___options__ | `Record.<string, any>` | *The options.*

---

### `accessSorter(d1, d2) ► number`

![modifier: private](images/badges/modifier-private.svg)

Sorts doclets by their access property

Parameters | Type | Description
--- | --- | ---
__d1__ | `Doclet` | *first doclet*
__d2__ | `Doclet` | *second doclet*
__*return*__ | `number` | *the order delta*

---

### `toDictionary(array, keyGenerator, valueGenerator) ► object`

![modifier: private](images/badges/modifier-private.svg)

Converts an array of object to a dictionary.

Parameters | Type | Description
--- | --- | ---
__array__ | `Array.<object>` | *the array of objects to convert to dictionary*
__keyGenerator__ | `function` | *the function used to define the key of the object added to the dictionary*
__valueGenerator__ | `function` | *the function used to define the value of the object added to the dictionary*
__*return*__ | `object` | *The object acting as a dictionary.*

#### Examples

```javascript
let res = toDictionary([{n:'a', v:1}, {n:'b', v:2}], o => o.n, o => o.v);
// res is {a: 1, b: 2 }
```
```javascript
let res = toDictionary([{n:'a', v:1}, {n:'b', v:2}], o => o.n);
// res is {a: {n:'a', v:1}, b: {n:'b', v:2} }
```

---

### `keyBy(array, keySelector, valueSelector) ► object`

![modifier: private](images/badges/modifier-private.svg)

Converts an array of object to an object containing arrays.
The value produced by the specified keySelector is used to define the properties of the resulting object.

Parameters | Type | Description
--- | --- | ---
__array__ | `Array.<object>` | *the array of objects to convert to dictionary*
__keySelector__ | `function` | *the function used to define the key*
__valueSelector__ | `function` | *the function used to define the value*
__*return*__ | `object` | *The resulting object.*

#### Examples

```javascript
let res = keyBy([{n:'a', v:1}, {n:'b', v:2}, {n:'a', v:3}], o => o.n, o => o.v);
// res is {a: [1, 3], b: [2] }
```
```javascript
let res = keyBy([{n:'a', v:1}, {n:'b', v:2}, {n:'a', v:3}], o => o.n);
// res is {a: [{n:'a', v:1}, {n:'a', v:3}], b: [{n:'b', v:2}] }
```

---

### `generateLinks(doclet, typesIndex)`

![modifier: private](images/badges/modifier-private.svg)

Transforms [MyClass](MyClass) or [A text](url) inline tags within the specified JSDoc doclet
to a markdown link to the associated type documentation.

Parameters | Type | Description
--- | --- | ---
__doclet__ | `Doclet` | *the JSDoc doclet to transform*
__typesIndex__ | `Record.<string, string>` | *the types index - associating a type with its documentation file*

---

### `generateLinksRecursively(doclet, typesIndex)`

![modifier: private](images/badges/modifier-private.svg)

Transforms [MyClass](MyClass) or [A text](url) inline tags within the specified JSDoc doclet
and all of its descendants to a markdown link to the associated type documentation.

Parameters | Type | Description
--- | --- | ---
__doclet__ | `Doclet` | *the JSDoc doclet to transform*
__typesIndex__ | `Record.<string, string>` | *the types index - associating a type with its documentation file*

---

### `compileTemplatesInFolder(folder, registerAsPartial) ► Record.<string, any>`

![modifier: private](images/badges/modifier-private.svg)

Compiles the handlebars templates and defines a templates index in the given folder.
If registerAsPartial is true, templates are only precompiled and no index is returned.

Parameters | Type | Description
--- | --- | ---
__folder__ | `string` | *the folder that contains the handlebars templates*
__registerAsPartial__ | `boolean` | *register as partial templates?*
__*return*__ | `Record.<string, any>` | *the templates index - associating the name of the template with its handlebar compiled template*

---

### `compileTemplates() ► Record.<string, any>`

![modifier: private](images/badges/modifier-private.svg)

Compiles the handlebars templates and defines a templates index.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Record.<string, any>` | *the templates index - associating the name of the template with its handlebar compiled template*

---

### `defineDocfilename(doclet) ► string`

![modifier: private](images/badges/modifier-private.svg)

Defines the name of the documentation file of the specified JSDoc doclet.

Parameters | Type | Description
--- | --- | ---
__doclet__ | `Doclet` | *the specified JSDoc doclet*
__*return*__ | `string` | *the documentation file name*

---

### `generateDocfile(model, template, docfilename)`

![modifier: private](images/badges/modifier-private.svg)

Generates the documentation file of the given model and handlebars template.

Parameters | Type | Description
--- | --- | ---
__model__ | `object` | *the model to use for the handlebars template*
__template__ | `Handlebars.TemplateDelegate` | *the handlebars template*
__docfilename__ | `string` | *the documentation file name*

---

### `generateDocument(doclet, template, typesIndex)`

![modifier: private](images/badges/modifier-private.svg)

Generates the documentation for the given JSDoc doclet.

Parameters | Type | Description
--- | --- | ---
__doclet__ | `Doclet` | *the JSDoc doclet for which the documentation will be generated*
__template__ | `Handlebars.TemplateDelegate` | *the handlebars template*
__typesIndex__ | `Record.<string, any>` | *the types index - associating a type with its documentation file*

---

### `generateToc(rootNode, template)`

![modifier: private](images/badges/modifier-private.svg)

Generates the table of contents for the given documentation root node.

Parameters | Type | Description
--- | --- | ---
__rootNode__ | `object` | *the documentation root node for which the table of contents will be generated*
__template__ | `Handlebars.TemplateDelegate` | *the handlebars template*

---

### `copyResources()`

![modifier: private](images/badges/modifier-private.svg)

Copies the resources - i.e. images or svg - to the final documentation folder.

---

### `initHandlebars(typesIndex) ► Record.<string, any>`

![modifier: private](images/badges/modifier-private.svg)

Initializes handlebars, registers custom helpers and compilates templates.

Parameters | Type | Description
--- | --- | ---
__typesIndex__ | `string` | *the types index - associating a type with its documentation file*
__*return*__ | `Record.<string, any>` | *the templates index - associating the name of the template with its handlebar compiled template*

---

## Constants

### `config`

![modifier: private](images/badges/modifier-private.svg)

The configuration of the document generator.

#### Value

```javascript
{
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
}
```

---

### `order`

![modifier: private](images/badges/modifier-private.svg)

The order of constants, functions and members based on their access

#### Value

```javascript
{ public: 0, protected: 1, private: 2 }
```

---
