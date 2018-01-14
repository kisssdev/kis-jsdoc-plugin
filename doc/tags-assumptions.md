# jsdoc tags assumptions

## @class

* Except if you provide a name, classes are named by default by their file name.
* Classes names are expected to be unique in order for the links to be correct.

## @module

* The tag is required but its value is not.
* In case you don't provide a value, modules are named by default by their file name or the folder name if the file name is `index.js`.

## @public / @private

* All methods of classes prefixed with a '_' are considered as private; otherwise public.

## @constant
