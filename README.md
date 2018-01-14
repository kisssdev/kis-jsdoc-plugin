# kis-jsdoc-plugin

A jsdoc plugin associated with a custom template that generates markdown documentation in a 'Keep It Simple' way.

## Description

The role of this plugin is to generate a markdown documentation of your project based on jsdoc comments of your code.

Developers are often reluctant to comment their code, and decorating comments with a lot of jsdoc tags like `@export, @private, @public, @class, @type`, and so on is a time-consuming and error-prone task. This plugin will help to auto determine such properties based on coding convention so that developers can focus on other tasks.

## Requirements

This plugin is written in EcmaScript 2015 so a version of node.js > to 6.4 is required. It has been developed and tested with the [3.5.5 release of jsdoc](https://github.com/jsdoc3/jsdoc/releases/tag/3.5.5).

## Installation

Install `kis-jsdoc-plugin` within you project:

```shell
npm install --save-dev kis-jsdoc-plugin
```

Create or modify your `.jsdoc.json` config file to reference the `kis-jsdoc-plugin` plugin and the `markdown` custom template:

```json
{
  "tags": {
    "allowUnknownTags": true
  },
  "source": {
    "include": ["./src"] // the path to your documented source code
  },
  "opts": {
    "template": "node_modules/kis-jsdoc-plugin/templates/markdown",
    "encoding": "utf8",
    "destination": "./doc/", // the path to the generated documentation
    "recurse": true
  },
  "plugins": ["node_modules/kis-jsdoc-plugin"],
  "templates": {
    "markdown": {
      "tocfilename": "toc.md" // the name of the table of contents file
    }
  }
}
```

## Running

Run jsdoc:

```shell
jsdoc -c ./.jsdoc.json
```

## Coding coventions

* _EcmaScript 2015_ classes do not need `@class` tag and if they are using __export__ declaration they do not need `@export` tag. All their members and methods are then considered public (no need for `@public` tag) except if they begin with _ (no need for `@private` tag).

```javascript
/**
 * Defines my EcmaScript2015 class.
 */
export class MyClass {

  /** @member {string} - The private member. */
  _bar;

  /** @member {string} - The public member. */
  foo;

  /**
   * The public method.
   */
  foobar() {
  }
}
```

* _CommonJS/node modules_ __do require__ a `@module` tag and functions or constants with export declaration do not need `@public` or `@export` tag. The name of the module is automatically computed based on the file name, but you can indicate yours.

```javascript
/**
 * Defines a JavaScript module.
 * @module
 */

/**
 * Defines a private function.
 */
function bar() {
}

/**
 * Defines a public function.
 * @param {number} x - The x parameter.
 */
exports.foo = x => ...;
```

## Automatic links to class documentation

* If all you EcmaScript classes have unique names and if you use the class name as parameters of your `@param`, `@return`, `@see` tags or {@link} inline tag, a link to the corresponding class documentation will be created.

```javascript
/**
 * Defines a new class using {@link MyClass}.
 * @see MyClass
 */
export class AnotherClass {

/**
 * Defines a public method.
 * @param {MyClass} class - The instance of the class.
 */
bar(class) {
```

## Category

This plugin register a new `@category` jsdoc tag. It will be used to generate the table of contents.

## Table of contents

A table of contents documentation is generated in a separated file. You can change the name in the configuration file.

## Screenshots

TODO

## Customization

TODO

## Known issues & limitations

Only the following jsdoc tags are currently used in markdown templates: `@augments, @class, @constant, @example, @member, @module, @param, @private, @public, @return, @see, @static, @type`.
