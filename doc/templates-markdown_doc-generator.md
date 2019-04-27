# Module `DocGenerator`

![category:core](https://img.shields.io/badge/category-core-9f9f9f.svg?style=flat-square)

Defines a markdown document generator that uses handlebars templates.

[Source file](..\templates\markdown\doc-generator.js)

## Functions

### `generateDoc(rootNode)`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Generates the documentation.
Parameters | Type | Description
--- | --- | ---
__rootNode__ | `Object` | *The documentation root node.*

---

### `accessSorter(d1, d2)`

![modifier: private](images/badges/modifier-private.svg)

Sorts doclets by their access property
Parameters | Type | Description
--- | --- | ---
__d1__ | `Doclet` | *first doclet*
__d2__ | `Doclet` | *second doclet*

---

### `toDictionary(arr, keyGenerator, valueGenerator) ► Object`

![modifier: private](images/badges/modifier-private.svg)

Converts an array of object to a dictionary.
Parameters | Type | Description
--- | --- | ---
__arr__ | `Array.<Object>` | *The array of objects to convert to dictionary.*
__keyGenerator__ | `function` | *The function used to define the key of the object added to the dictionary.*
__valueGenerator__ | `function` | *The function used to define the value of the object added to the dictionary.*
__*return*__ | `Object` | *The object acting as a dictionary.*

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

### `keyBy(arr, keySelector, valueSelector) ► Object`

![modifier: private](images/badges/modifier-private.svg)

Converts an array of object to an object containing arrays.
The value produced by the specified keySelector is used to define the properties of the resulting object.
Parameters | Type | Description
--- | --- | ---
__arr__ | `Array.<Object>` | *The array of objects to convert to dictionary.*
__keySelector__ | `function` | *The function used to define the key.*
__valueSelector__ | `function` | *The function used to define the value.*
__*return*__ | `Object` | *The resulting object.*

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

Transforms {@link MyClass} or {@link url|A text} inline tags within the specified JSDoc doclet
to a markdown link to the associated type documentation.
Parameters | Type | Description
--- | --- | ---
__doclet__ | `Doclet` | *The JSDoc doclet to transform.*
__typesIndex__ | `Object.<string>` | *The types index - associating a type with its documentation file.*

---

### `compileTemplatesInFolder() ► Object.<string>`

![modifier: private](images/badges/modifier-private.svg)

Compiles the handlebars templates and defines a templates index in the given folder.
If registerAsPartial is true, templates are only precompiled and no index is returned.
Parameters | Type | Description
--- | --- | ---
__*return*__ | `Object.<string>` | *The templates index - associating the name of the template with its handlebar compiled template.*

---

### `compileTemplates() ► Object.<string>`

![modifier: private](images/badges/modifier-private.svg)

Compiles the handlebars templates and defines a templates index.
Parameters | Type | Description
--- | --- | ---
__*return*__ | `Object.<string>` | *The templates index - associating the name of the template with its handlebar compiled template.*

---

### `defineDocfilename(doclet) ► string`

![modifier: private](images/badges/modifier-private.svg)

Defines the name of the documentation file of the specified JSDoc doclet.
Parameters | Type | Description
--- | --- | ---
__doclet__ | `Doclet` | *The specified JSDoc doclet.*
__*return*__ | `string` | *The documentation file name.*

---

### `generateDocfile(model, template, docfilename)`

![modifier: private](images/badges/modifier-private.svg)

Generates the documentation file of the given model and handlebars template.
Parameters | Type | Description
--- | --- | ---
__model__ | `Object` | *The model to use for the handlebars template.*
__template__ | `Template` | *The handlebars template.*
__docfilename__ | `string` | *The documentation file name.*

---

### `generateDoc(doclet, template, typesIndex)`

![modifier: private](images/badges/modifier-private.svg)

Generates the documentation for the given JSDoc doclet.
Parameters | Type | Description
--- | --- | ---
__doclet__ | `Doclet` | *The JSDoc doclet for which the documentation will be generated.*
__template__ | `Template` | *The handlebars template.*
__typesIndex__ | `Object.<string>` | *The types index - associating a type with its documentation file.*

---

### `generateToc(rootNode, template)`

![modifier: private](images/badges/modifier-private.svg)

Generates the table of contents for the given documentation root node.
Parameters | Type | Description
--- | --- | ---
__rootNode__ | `Object` | *The documentation root node for which the table of contents will be generated.*
__template__ | `Template` | *The handlebars template.*

---

### `copyResources()`

![modifier: private](images/badges/modifier-private.svg)

Copies the resources - i.e. images or svg - to the final documentation folder.

---

### `initHandlebars(typesIndex) ► Object.<string>`

![modifier: private](images/badges/modifier-private.svg)

Initializes handlebars, registers custom helpers and compilates templates.
Parameters | Type | Description
--- | --- | ---
__typesIndex__ | `Object.<string>` | *The types index - associating a type with its documentation file.*
__*return*__ | `Object.<string>` | *The templates index - associating the name of the template with its handlebar compiled template.*

---

## Constants

### `config`

![modifier: private](images/badges/modifier-private.svg)

The configuration of the document generator.

#### Value

```javascript
{
  imageext: (env.conf.templates && env.conf.templates.markdown && env.conf.templates.markdown.imageext) || 'svg',
  docFolder: env.opts.destination,
  rootFolder: env.opts.template,
  encoding: env.opts.encoding,
  tocfilename:
    (env.conf.templates && env.conf.templates.markdown && env.conf.templates.markdown.tocfilename) || 'toc.md',
  tocOrder: (env.conf.templates && env.conf.templates.markdown && env.conf.templates.markdown.tocOrder) || {},
  externallinks: (env.conf.templates && env.conf.templates.markdown && env.conf.templates.markdown.externallinks) || {},
  badgecolors: (env.conf.templates && env.conf.templates.markdown && env.conf.templates.markdown.badgecolors) || {},
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
