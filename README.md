# kis-jsdoc-plugin

A jsdoc plugin associated with a custom template that generates markdown documentation in a 'Keep It Simple' way.

## Role

The role of this plugin is to:

* generate a markdown documentation based on jsdoc comments of your code
* and enable you to enrich automatically the documentation in a simple way.

## Limitations

### Jsdoc tags

Only the following jsdoc tags are currently used: `@augments, @class, @constant, @example, @member, @module, @param, @private, @public, @return, @see, @static, @type`.

Only `@module` is required. Other tags will be determined thanks to assumptions. See [which assumptions is done when a jsdoc tag is missing](./doc/tags-assumptions.md).

### Javascript files

Your javascript file must be:

* An __ecmascript6 class__. In this case the jsdoc tag `@class` is optional.

```javascript
/**
 * Defines my Ecmascript6 class.
 */
export class MyClass {
```

* A __javascript module__. In this case the jsdoc tag `@module` is __required__. You can specify a name, otherwise the name of the file will be used.

```javascript
/**
 * Defines my javascript module.
 * @module
 */
export function f() {
```

## Installation

Install `kis-jsdoc-plugin`

```shell
npm install --save-dev kis-jsdoc-plugin
```

Modify your `jsdoc` config file to reference the `kis-jsdoc-plugin` plugin and the `markdown` custom template.

```json
{
  "tags": {
    "allowUnknownTags": true
  },
  "opts": {
    "template": "node_modules/kis-jsdoc-plugin/templates/markdown",
    "encoding": "utf8",
    "destination": "./doc/",
    "recurse": true
  },
  "plugins": ["node_modules/kis-jsdoc-plugin"],
  "templates": {
    "markdown": {
      "tocfilename": "toc.md"
    }
  }
}
```
