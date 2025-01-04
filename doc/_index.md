# Module `index`

![category:jsdocplugin](https://img.shields.io/badge/category-jsdocplugin-009663.svg?style=flat-square)

Defines a JSDoc plugin that adds custom properties to doclets and provides a new category tag.

[Source file](..\index.js)

## Functions

### `defineTags()`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Defines a new JSDoc tag &#x27;category&#x27; that accepts a text value.
This adds a corresponding &#x27;category&#x27; property on the corresponding doclet.

#### Examples

```javascript
@category Model
```

---

### `extractTypeExpression(string) ► string`

![modifier: private](images/badges/modifier-private.svg)

Extracts the type expression from a comment string

Parameters | Type | Description
--- | --- | ---
__string__ | `string` | *the comment string*
__*return*__ | `string` | *the type expression*

---

### `extractParametersInfo(line) ► Doclet`

![modifier: private](images/badges/modifier-private.svg)

Extracts the type, name and description of the &#x27;param&#x27; tag.

Parameters | Type | Description
--- | --- | ---
__line__ | `string` | *the comment line*
__*return*__ | `Doclet` | *list of parameters*

---

### `extractTagInfo(line, tag) ► Doclet`

![modifier: private](images/badges/modifier-private.svg)

Extracts the type and description of the specified tag.

Parameters | Type | Description
--- | --- | ---
__line__ | `string` | *the comment line*
__tag__ | `'return'` | *the specified tag*
__*return*__ | `Doclet` | *list of parameters*

---

### `populateFunctionInfo(doclet)`

![modifier: private](images/badges/modifier-private.svg)

Tries to populate &#x27;params&#x27; and &#x27;return&#x27; type and description on the specified doclet if not provided but found through comment

Parameters | Type | Description
--- | --- | ---
__doclet__ | `Doclet` | *the doclet to process*

---

### `populateMemberInfo(doclet)`

![modifier: private](images/badges/modifier-private.svg)

Tries to populate type and description on the specified doclet if not provided but found through comment

Parameters | Type | Description
--- | --- | ---
__doclet__ | `Doclet` | *the doclet to process*

---

### `getFilePath(d) ► string`

![modifier: private](images/badges/modifier-private.svg)

Gets the absolute file path corresponding to the specified doclet.

Parameters | Type | Description
--- | --- | ---
__d__ | `Doclet` | *the specified doclet*
__*return*__ | `string` | *the absolute file path*

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
__cf__ | `object` | *the configuration object*
__k__ | `string` | *the key/property of the object*
__*return*__ | `function` | *a function that takes a doclet as input and sets the corresponding key/property with the &#x27;value&#x27; function*

---

### `processDoclet(doclet) ► Doclet`

![modifier: private](images/badges/modifier-private.svg)

Processes the specified doclet to add or modify properties based on the processConfig object.

Parameters | Type | Description
--- | --- | ---
__doclet__ | `Doclet` | *the specified doclet to modify*
__*return*__ | `Doclet` | *the modified doclet*

---

### `processDoclets(doclets)`

![modifier: private](images/badges/modifier-private.svg)

Processes the parsed doclets to provide a better hierarchy.

Parameters | Type | Description
--- | --- | ---
__doclets__ | `Array.<Doclet>` | *the array of parsed doclets*

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
  rootFolder: env.pwd,
  docFolder: env.opts.destination,
  includes: (env.opts.includes || 'public,protected,private').toLowerCase().replace(' ', '').split(','),
  badgecolors:
    (env.conf &&
      env.conf.templates &&
      env.conf.templates.markdown &&
      env.conf.templates.markdown.badgecolors) ||
    {}
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
      return path.relative(config.docFolder, filepath); // the relative path of the source file from the documentation folder
    }
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

```

---
