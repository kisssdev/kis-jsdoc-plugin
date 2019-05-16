# kis-jsdoc-plugin

A [JSDoc](http://usejsdoc.org/index.html) plugin associated with a custom template that generates markdown documentation in a 'Keep It Simple' way.

## Description

- The role of this plugin is to generate a markdown documentation of your project based on JSDoc comments of your code.
- It will auto infer properties like `@export, @private, @public, @class` for EcmaScript projects with modules and export/import syntax.
- It generates a markdown file for each of your commented source file and a markdown __table of contents__.
- You can add __categories__ in order to sort your documentation in the table of contents.
- You can add __screenshots__ to documented modules or classes.

## Requirements

This plugin is written in EcmaScript 2015 so a version of node.js > to 6.4 is required. It has been developed and tested with the [3.5.5 release of JSDoc](https://github.com/jsdoc3/jsdoc/releases/tag/3.5.5).

## Installation

Install `kis-jsdoc-plugin` within you project:

```shell
npm install --save-dev kis-jsdoc-plugin
```

Create or modify your `.jsdoc.json` config file to reference the `kis-jsdoc-plugin` plugin and the `markdown` custom template:

```javascript
{
  "tags": {
    "allowUnknownTags": true
  },
  "source": {
    "include": ["./src"] /* the path to your documented source code */
  },
  "opts": {
    "template": "node_modules/kis-jsdoc-plugin/templates/markdown",
    "encoding": "utf8",
    "destination": "./doc/", /* the path to the generated documentation */
    "recurse": true
  },
  "plugins": ["node_modules/kis-jsdoc-plugin"],
  "templates": {
    "markdown": {
      "tocfilename": "toc.md" /* the name of the table of contents file */
    }
  }
}
```

## Running

Run JSDoc:

```shell
jsdoc -c ./.jsdoc.json
```

## Coding coventions

- _EcmaScript 2015_ classes do not need `@class` tag and if they are using __export__ declaration they do not need `@export` tag. All their members and methods are then considered public (no need for `@public` tag) except if they begin with _ (no need for `@private` tag).

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

- _CommonJS/node modules_ __do require__ a `@module` tag and functions or constants with export declaration do not need `@public` or `@export` tag. The name of the module is automatically computed based on the file name, but you can indicate yours.

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

If all you EcmaScript classes have unique names and if you use the class name as parameters of your `@param`, `@return`, `@see` tags or {@link} inline tag, a markdown link to the corresponding class documentation will be created.

```javascript
/**
 * Defines a new class using {@link MyClass}.
 * @see MyClass
 */
export class AnotherClass {

/**
 * Defines a public method.
 * @param {MyClass} myClass - The instance of the class.
 */
bar(myClass) {
```

You can also add external links to classes in the configuration file like this:

```javascript
{
  "templates": {
      "externallinks": {
        "HttpClient": "https://aurelia.io/docs/api/fetch-client/class/HttpClient",
        "Router": "https://aurelia.io/docs/api/router/class/AppRouter",
        "Promise": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise"
      }
   }
 }
```

The following comment in your code:

```javascript
  /**
   * Creates an instance of the SettingsService with the specified parameters.
   * @param {HttpClient} client - the fetch http client
   */
  constructor(client) {
```

will generate this:

Creates an instance of the SettingsService with the specified parameters.

Parameters | Type | Description
--- | --- | ---
__client__ | [HttpClient](https://aurelia.io/docs/api/fetch-client/class/HttpClient) | *the fetch http client*

## Exclude private code

You can opt out the generation of private members or functions with the following configuration:

```javascript
{
  "opts": {
    "includes": "public"  /* default is "public,protected,private" */
  },
```

## Modifiers badges

The modifiers like `public, private, protected, static, abstract` are represented by an svg badge. You can opt out for a png file in case svg does not fit your need. Use this configuration:

```javascript
{
  "templates": {
    "markdown": {
      "imageext": "png"  /* default is "svg" */
```

## Category

This plugin register a new `@category` JSDoc tag. It will be used to generate the table of contents.
You can add whatever category you want.

```javascript
/**
 * Implements the user settings.
 * @category Model
 */
export class UserSettings {
```

You can modify the order of the categories in the table of contents with the following configuration:
```javascript
{
  "templates": {
    "markdown": {
      "tocOrder": {
        "model": 1,
        "viewmodel": 2
      }
```

A badge will be generated for the category and you can define the _color_ with the following configuration:

```javascript
{
  "templates": {
    "markdown": {
      "badgecolors": {
        "model": "009663",
        "viewmodel": "00A800"
      }
```

## Table of contents

A table of contents documentation is generated in a separated file. You can change the name in the configuration file:

```javascript
{
  "templates": {
    "markdown": {
      "tocfilename": "toc.md"
    }
```

## Screenshots

For a module or class, you can add a png image to the `{your_doc_folder}/images/screenshots` folder with the same name as the original source file and the image will be added to the corresponding documentation markdown file.

## Customization

You can provide your own [handlebars](https://handlebarsjs.com) templates for the markdown generation by specifying the folder in the configuration file:

```javascript
{
  "opts": {
    "template": "{your_template_folder}",  /* the default is node_modules/kis-jsdoc-plugin/templates/markdown */
```

You need to provide two handlebars files :

- __toc.hbs__, that will be used for the table of contents
- __module.hbs__, that will be used for each documented javascript file.

You can also provide [handlebars partials](https://handlebarsjs.com/partials.html) in the `partials` subfolder and they will be precompiled and registered by their filenames.

Note that the doclet object model for each documented javascript has the following hierarchy:

- module
  - constants
  - functions
    - params
    - examples
  - members
    - examples
  - classes
    - classes _(the constructors of the class)_
      - params
      - examples
    - functions _(the methods of the class)_
      - params
      - examples
    - members

## Project documentation

The project documentantion has been self generated by this plugin and the table of contents is available here:
[Table of contents](./doc/toc.md)

## Known issues & limitations

Only the following JSDoc tags are currently used in markdown templates: `@augments, @class, @constant, @example, @member, @module, @param, @private, @public, @return, @see, @static, @type`.
