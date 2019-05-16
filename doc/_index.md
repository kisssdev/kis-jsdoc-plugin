# Module `KisJsdocPlugin`

![category:jsdocplugin](https://img.shields.io/badge/category-jsdocplugin-009663.svg?style=flat-square)

Defines a JSDoc plugin that adds custom properties to doclets and provides a new category tag.

[Source file](..\index.js)

## Functions

### `defineTags(dictionary)`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Defines a new JSDoc tag &#x27;category&#x27; that accepts a text value.
This adds a corresponding &#x27;category&#x27; property on the corresponding doclet.

Parameters | Type | Description
--- | --- | ---
__dictionary__ | `Object` | *The JSDoc dictionary.*

#### Examples

```javascript
@category Model
```

---

### `getFilePath(d) ► string`

![modifier: private](images/badges/modifier-private.svg)

Gets the absolute file path corresponding to the specified doclet.

Parameters | Type | Description
--- | --- | ---
__d__ | `Doclet` | *the specified doclet*
__*return*__ | `string` | *the absolute file path*

---

### `hyphenToPascal(s) ► string`

![modifier: private](images/badges/modifier-private.svg)

Converts a Kebab cased string in a Pascal cased string.

Parameters | Type | Description
--- | --- | ---
__s__ | `string` | *The string in Kebab casing to convert in Pascal casing.*
__*return*__ | `string` | *- The Pascal cased string.*

---

### `getModuleName(filename, folderPath) ► string`

![modifier: private](images/badges/modifier-private.svg)

Get the module name corresponding to the given filename and path.
In case of index.js the folder name is used.

Parameters | Type | Description
--- | --- | ---
__filename__ | `string` | *the given filename*
__folderPath__ | `string` | *the given folder path containing the file*
__*return*__ | `string` | *the module name*

---

### `defaultProcess(cf, k) ► function`

![modifier: private](images/badges/modifier-private.svg)

Defines the default process on doclet: applying the &#x27;value&#x27; function defined on the configuration object to the specified key/property of the doclet instance.

Parameters | Type | Description
--- | --- | ---
__cf__ | `Object` | *The configuration object.*
__k__ | `string` | *The key/property of the object.*
__*return*__ | `function` | *A function that takes a doclet as input and sets the corresponding key/property with the &#x27;value&#x27; function.*

---

### `processDoclet(doclet)`

![modifier: private](images/badges/modifier-private.svg)

Processes the specified doclet to add or modify properties based on the processConfig object.

Parameters | Type | Description
--- | --- | ---
__doclet__ | `Doclet` | *the specified doclet*

---

### `processDoclets(doclets)`

![modifier: private](images/badges/modifier-private.svg)

Processes the parsed doclets to provide a better hierarchy.

Parameters | Type | Description
--- | --- | ---
__doclets__ | `Array.<Doclet>` | *The array of parsed doclets.*

---

## Members

### `handlers`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Defines the event handlers of the JSDoc plugin.


---

## Constants

### `config`

![modifier: private](images/badges/modifier-private.svg)

The configuration of the JSDoc plugin.

#### Value

```javascript
{
  docFolder: env.opts.destination,
  includes: (env.opts.includes || 'public,protected,private')
    .toLowerCase()
    .replace(' ', '')
    .split(','),
  badgecolors: (env.conf && env.conf.templates
    && env.conf.templates.markdown && env.conf.templates.markdown.badgecolors) || {},
}
```

---

### `processConfig`

![modifier: private](images/badges/modifier-private.svg)

The configuration of the doclet processing.
Each key of the configuration object defines a process:
- either explicitly if the &#x27;process&#x27; function is defined,
- either implictly if the &#x27;value&#x27; function is defined : in such case the process consists of applying a value to the corresponding key property of the doclet instance.
- In both cases, the process is executed if there is no &#x27;condition&#x27; function, or if the &#x27;condition&#x27; function evaluates to true.

#### Value

```javascript

      d.kind === 'class' && d.meta.code && d.meta.code.name &&
      (d.meta.code.name.startsWith('export') || (d.tags && d.tags.some(t => t.title === 'export'))),
    process: d => exportedClasses.push(d.name),
  },
  tocDescription: {
    // new 'tocDescription' property that represents the description of a module that appears in the toc
    condition: d => d.kind === 'module' && !d.tocDescription,
    value: d => d.description,
  },
  valuecode: {
    // new 'valuecode' property that represents the source code of a constant
    condition: d => d.kind === 'constant',
    value: (d) => {
      const sourcefile = getFilePath(d);
      const source = fs.readFileSync(sourcefile, 'utf8');
      const indexedSource = lineColumn(source);
      const { loc } = d.meta.code.node;
      const code = source.substring(
        indexedSource.toIndex(loc.start.line, loc.start.column + 1),
        indexedSource.toIndex(loc.end.line, loc.end.column + 1)
      );
      return code.indexOf(' =') === -1 ? code : code.slice(code.indexOf(' =') + 3, -1);
    },
  },
  screenshot: {
    // new 'screenshot' property that indicates if the documented has a related snapshot image?
    condition: (d) => {
      if (!['module', 'class'].includes(d.kind)) return false;
      // the relative path of the screenshot file
      const filename = `${d.kind}_${path.basename(d.meta.filename, path.extname(d.meta.filename))}.png`;
      const filepath = path.join(config.docFolder, 'images/screenshots', filename);
      return fs.existsSync(filepath);
    },
    value: d => `${d.kind}_${path.basename(d.meta.filename, path.extname(d.meta.filename))}.png`,
  },
  category: {
    // modify the 'category' property: add a default value ('other') if none found
    condition: d => !d.category && ['module', 'class'].includes(d.kind),
    value: () => 'other',
  },
  categorycolor: {
    // new 'categorycolor' property
    value: d => config.badgecolors[d.category] || 'blue',
  },
  static: {
    // new 'relativepath' property that indicates if the documented object is static?
    value: d => d.scope === 'static',
  },
  hasParameters: {
    // new 'hasParameters' property that indicates if the documented object has @param or @return tags?
    value: d => (d.params && d.params.length > 0) || (d.returns && d.returns.length > 0),
  },
  relativepath: {
    // new 'relativepath' property that indicates the relative path from the documentation to the source code
    value: (d) => {
      const filepath = getFilePath(d); // the absolute path of the source file
      return path.relative(config.docFolder, filepath); // the relative path of the source file from the documentation folder
    },
  },
  type: {
    // new 'type' property that indicates the type of a member
    condition: d => d.kind === 'member' && d.returns && d.returns.length > 0,
    value: d => d.returns[0].type,
  },
  memberof: {
    // modify the 'memberof' property: fix 'export default var'
    condition: d => d.kind !== 'module' && !d.memberof && d.longname && d.longname.startsWith('module:'),
    value: d => d.longname,
  },
  access: {
    // modify the 'access' property: add a default value ('private') if none found
    condition: d => !d.access,
    value: (d) => {
      if (d.memberof && exportedClasses.includes(d.memberof) && d.name.charAt(0) !== '_') return 'public';
      if ((d.kind === 'constant' || d.kind === 'function' || d.kind === 'member') &&
        (d.meta.code && d.meta.code.name && d.meta.code.name.length > 0 &&
          (d.meta.code.name.startsWith('exports.') || d.meta.code.name === 'module.exports'))) return 'public';
      return 'private';
    },
  },
  included: {
    // new 'included' property that indicates if the comment is to be included in the doc
    value: d => ['module', 'class'].includes(d.kind) || config.includes.includes(d.access),
  },
  name: {
    // modify the 'name' property of a module to deal with index.js within a folder
    condition: d => d.kind === 'module',
    value: d => getModuleName(d.meta.filename, d.meta.path),
  },
  isDefault: {
    // new 'isDefault' property that indicates if the documented object is the default export of the module
    condition: d => d.kind !== 'module' && d.name && d.name.startsWith('module:'),
    process: (d) => { d.isDefault = true; d.name = 'default'; },
  },
  inject: {
    // new 'inject' property that indicates if the documented object is decorated with the @inject decorator
    condition: d => d.kind === 'class' && d.meta.code && d.meta.code.node && d.meta.code.node.decorators
      && d.meta.code.node.decorators.length > 0,
    value: d => d.meta.code.node.decorators
      .map((dec) => {
        let decoratorName = '';
        if (dec.expression.type === 'Identifier') decoratorName = dec.expression.name;
        if (dec.expression.type === 'CallExpression') decoratorName = dec.expression.callee.name;
        return decoratorName;
      })
      .includes('inject'),
  },

```

---
