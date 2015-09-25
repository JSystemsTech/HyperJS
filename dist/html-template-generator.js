(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.htmlTemplateGenerator = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":3}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
(function (global){
/**
 * @license
 * lodash 3.10.1 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern -d -o ./index.js`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
;(function() {

  /** Used as a safe reference for `undefined` in pre-ES5 environments. */
  var undefined;

  /** Used as the semantic version number. */
  var VERSION = '3.10.1';

  /** Used to compose bitmasks for wrapper metadata. */
  var BIND_FLAG = 1,
      BIND_KEY_FLAG = 2,
      CURRY_BOUND_FLAG = 4,
      CURRY_FLAG = 8,
      CURRY_RIGHT_FLAG = 16,
      PARTIAL_FLAG = 32,
      PARTIAL_RIGHT_FLAG = 64,
      ARY_FLAG = 128,
      REARG_FLAG = 256;

  /** Used as default options for `_.trunc`. */
  var DEFAULT_TRUNC_LENGTH = 30,
      DEFAULT_TRUNC_OMISSION = '...';

  /** Used to detect when a function becomes hot. */
  var HOT_COUNT = 150,
      HOT_SPAN = 16;

  /** Used as the size to enable large array optimizations. */
  var LARGE_ARRAY_SIZE = 200;

  /** Used to indicate the type of lazy iteratees. */
  var LAZY_FILTER_FLAG = 1,
      LAZY_MAP_FLAG = 2;

  /** Used as the `TypeError` message for "Functions" methods. */
  var FUNC_ERROR_TEXT = 'Expected a function';

  /** Used as the internal argument placeholder. */
  var PLACEHOLDER = '__lodash_placeholder__';

  /** `Object#toString` result references. */
  var argsTag = '[object Arguments]',
      arrayTag = '[object Array]',
      boolTag = '[object Boolean]',
      dateTag = '[object Date]',
      errorTag = '[object Error]',
      funcTag = '[object Function]',
      mapTag = '[object Map]',
      numberTag = '[object Number]',
      objectTag = '[object Object]',
      regexpTag = '[object RegExp]',
      setTag = '[object Set]',
      stringTag = '[object String]',
      weakMapTag = '[object WeakMap]';

  var arrayBufferTag = '[object ArrayBuffer]',
      float32Tag = '[object Float32Array]',
      float64Tag = '[object Float64Array]',
      int8Tag = '[object Int8Array]',
      int16Tag = '[object Int16Array]',
      int32Tag = '[object Int32Array]',
      uint8Tag = '[object Uint8Array]',
      uint8ClampedTag = '[object Uint8ClampedArray]',
      uint16Tag = '[object Uint16Array]',
      uint32Tag = '[object Uint32Array]';

  /** Used to match empty string literals in compiled template source. */
  var reEmptyStringLeading = /\b__p \+= '';/g,
      reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
      reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

  /** Used to match HTML entities and HTML characters. */
  var reEscapedHtml = /&(?:amp|lt|gt|quot|#39|#96);/g,
      reUnescapedHtml = /[&<>"'`]/g,
      reHasEscapedHtml = RegExp(reEscapedHtml.source),
      reHasUnescapedHtml = RegExp(reUnescapedHtml.source);

  /** Used to match template delimiters. */
  var reEscape = /<%-([\s\S]+?)%>/g,
      reEvaluate = /<%([\s\S]+?)%>/g,
      reInterpolate = /<%=([\s\S]+?)%>/g;

  /** Used to match property names within property paths. */
  var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\n\\]|\\.)*?\1)\]/,
      reIsPlainProp = /^\w*$/,
      rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\n\\]|\\.)*?)\2)\]/g;

  /**
   * Used to match `RegExp` [syntax characters](http://ecma-international.org/ecma-262/6.0/#sec-patterns)
   * and those outlined by [`EscapeRegExpPattern`](http://ecma-international.org/ecma-262/6.0/#sec-escaperegexppattern).
   */
  var reRegExpChars = /^[:!,]|[\\^$.*+?()[\]{}|\/]|(^[0-9a-fA-Fnrtuvx])|([\n\r\u2028\u2029])/g,
      reHasRegExpChars = RegExp(reRegExpChars.source);

  /** Used to match [combining diacritical marks](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks). */
  var reComboMark = /[\u0300-\u036f\ufe20-\ufe23]/g;

  /** Used to match backslashes in property paths. */
  var reEscapeChar = /\\(\\)?/g;

  /** Used to match [ES template delimiters](http://ecma-international.org/ecma-262/6.0/#sec-template-literal-lexical-components). */
  var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;

  /** Used to match `RegExp` flags from their coerced string values. */
  var reFlags = /\w*$/;

  /** Used to detect hexadecimal string values. */
  var reHasHexPrefix = /^0[xX]/;

  /** Used to detect host constructors (Safari > 5). */
  var reIsHostCtor = /^\[object .+?Constructor\]$/;

  /** Used to detect unsigned integer values. */
  var reIsUint = /^\d+$/;

  /** Used to match latin-1 supplementary letters (excluding mathematical operators). */
  var reLatin1 = /[\xc0-\xd6\xd8-\xde\xdf-\xf6\xf8-\xff]/g;

  /** Used to ensure capturing order of template delimiters. */
  var reNoMatch = /($^)/;

  /** Used to match unescaped characters in compiled string literals. */
  var reUnescapedString = /['\n\r\u2028\u2029\\]/g;

  /** Used to match words to create compound words. */
  var reWords = (function() {
    var upper = '[A-Z\\xc0-\\xd6\\xd8-\\xde]',
        lower = '[a-z\\xdf-\\xf6\\xf8-\\xff]+';

    return RegExp(upper + '+(?=' + upper + lower + ')|' + upper + '?' + lower + '|' + upper + '+|[0-9]+', 'g');
  }());

  /** Used to assign default `context` object properties. */
  var contextProps = [
    'Array', 'ArrayBuffer', 'Date', 'Error', 'Float32Array', 'Float64Array',
    'Function', 'Int8Array', 'Int16Array', 'Int32Array', 'Math', 'Number',
    'Object', 'RegExp', 'Set', 'String', '_', 'clearTimeout', 'isFinite',
    'parseFloat', 'parseInt', 'setTimeout', 'TypeError', 'Uint8Array',
    'Uint8ClampedArray', 'Uint16Array', 'Uint32Array', 'WeakMap'
  ];

  /** Used to make template sourceURLs easier to identify. */
  var templateCounter = -1;

  /** Used to identify `toStringTag` values of typed arrays. */
  var typedArrayTags = {};
  typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
  typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
  typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
  typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
  typedArrayTags[uint32Tag] = true;
  typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
  typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
  typedArrayTags[dateTag] = typedArrayTags[errorTag] =
  typedArrayTags[funcTag] = typedArrayTags[mapTag] =
  typedArrayTags[numberTag] = typedArrayTags[objectTag] =
  typedArrayTags[regexpTag] = typedArrayTags[setTag] =
  typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;

  /** Used to identify `toStringTag` values supported by `_.clone`. */
  var cloneableTags = {};
  cloneableTags[argsTag] = cloneableTags[arrayTag] =
  cloneableTags[arrayBufferTag] = cloneableTags[boolTag] =
  cloneableTags[dateTag] = cloneableTags[float32Tag] =
  cloneableTags[float64Tag] = cloneableTags[int8Tag] =
  cloneableTags[int16Tag] = cloneableTags[int32Tag] =
  cloneableTags[numberTag] = cloneableTags[objectTag] =
  cloneableTags[regexpTag] = cloneableTags[stringTag] =
  cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] =
  cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
  cloneableTags[errorTag] = cloneableTags[funcTag] =
  cloneableTags[mapTag] = cloneableTags[setTag] =
  cloneableTags[weakMapTag] = false;

  /** Used to map latin-1 supplementary letters to basic latin letters. */
  var deburredLetters = {
    '\xc0': 'A',  '\xc1': 'A', '\xc2': 'A', '\xc3': 'A', '\xc4': 'A', '\xc5': 'A',
    '\xe0': 'a',  '\xe1': 'a', '\xe2': 'a', '\xe3': 'a', '\xe4': 'a', '\xe5': 'a',
    '\xc7': 'C',  '\xe7': 'c',
    '\xd0': 'D',  '\xf0': 'd',
    '\xc8': 'E',  '\xc9': 'E', '\xca': 'E', '\xcb': 'E',
    '\xe8': 'e',  '\xe9': 'e', '\xea': 'e', '\xeb': 'e',
    '\xcC': 'I',  '\xcd': 'I', '\xce': 'I', '\xcf': 'I',
    '\xeC': 'i',  '\xed': 'i', '\xee': 'i', '\xef': 'i',
    '\xd1': 'N',  '\xf1': 'n',
    '\xd2': 'O',  '\xd3': 'O', '\xd4': 'O', '\xd5': 'O', '\xd6': 'O', '\xd8': 'O',
    '\xf2': 'o',  '\xf3': 'o', '\xf4': 'o', '\xf5': 'o', '\xf6': 'o', '\xf8': 'o',
    '\xd9': 'U',  '\xda': 'U', '\xdb': 'U', '\xdc': 'U',
    '\xf9': 'u',  '\xfa': 'u', '\xfb': 'u', '\xfc': 'u',
    '\xdd': 'Y',  '\xfd': 'y', '\xff': 'y',
    '\xc6': 'Ae', '\xe6': 'ae',
    '\xde': 'Th', '\xfe': 'th',
    '\xdf': 'ss'
  };

  /** Used to map characters to HTML entities. */
  var htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '`': '&#96;'
  };

  /** Used to map HTML entities to characters. */
  var htmlUnescapes = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#96;': '`'
  };

  /** Used to determine if values are of the language type `Object`. */
  var objectTypes = {
    'function': true,
    'object': true
  };

  /** Used to escape characters for inclusion in compiled regexes. */
  var regexpEscapes = {
    '0': 'x30', '1': 'x31', '2': 'x32', '3': 'x33', '4': 'x34',
    '5': 'x35', '6': 'x36', '7': 'x37', '8': 'x38', '9': 'x39',
    'A': 'x41', 'B': 'x42', 'C': 'x43', 'D': 'x44', 'E': 'x45', 'F': 'x46',
    'a': 'x61', 'b': 'x62', 'c': 'x63', 'd': 'x64', 'e': 'x65', 'f': 'x66',
    'n': 'x6e', 'r': 'x72', 't': 'x74', 'u': 'x75', 'v': 'x76', 'x': 'x78'
  };

  /** Used to escape characters for inclusion in compiled string literals. */
  var stringEscapes = {
    '\\': '\\',
    "'": "'",
    '\n': 'n',
    '\r': 'r',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  /** Detect free variable `exports`. */
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

  /** Detect free variable `module`. */
  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;

  /** Detect free variable `global` from Node.js. */
  var freeGlobal = freeExports && freeModule && typeof global == 'object' && global && global.Object && global;

  /** Detect free variable `self`. */
  var freeSelf = objectTypes[typeof self] && self && self.Object && self;

  /** Detect free variable `window`. */
  var freeWindow = objectTypes[typeof window] && window && window.Object && window;

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;

  /**
   * Used as a reference to the global object.
   *
   * The `this` value is used if it's the global object to avoid Greasemonkey's
   * restricted `window` object, otherwise the `window` object is used.
   */
  var root = freeGlobal || ((freeWindow !== (this && this.window)) && freeWindow) || freeSelf || this;

  /*--------------------------------------------------------------------------*/

  /**
   * The base implementation of `compareAscending` which compares values and
   * sorts them in ascending order without guaranteeing a stable sort.
   *
   * @private
   * @param {*} value The value to compare.
   * @param {*} other The other value to compare.
   * @returns {number} Returns the sort order indicator for `value`.
   */
  function baseCompareAscending(value, other) {
    if (value !== other) {
      var valIsNull = value === null,
          valIsUndef = value === undefined,
          valIsReflexive = value === value;

      var othIsNull = other === null,
          othIsUndef = other === undefined,
          othIsReflexive = other === other;

      if ((value > other && !othIsNull) || !valIsReflexive ||
          (valIsNull && !othIsUndef && othIsReflexive) ||
          (valIsUndef && othIsReflexive)) {
        return 1;
      }
      if ((value < other && !valIsNull) || !othIsReflexive ||
          (othIsNull && !valIsUndef && valIsReflexive) ||
          (othIsUndef && valIsReflexive)) {
        return -1;
      }
    }
    return 0;
  }

  /**
   * The base implementation of `_.findIndex` and `_.findLastIndex` without
   * support for callback shorthands and `this` binding.
   *
   * @private
   * @param {Array} array The array to search.
   * @param {Function} predicate The function invoked per iteration.
   * @param {boolean} [fromRight] Specify iterating from right to left.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function baseFindIndex(array, predicate, fromRight) {
    var length = array.length,
        index = fromRight ? length : -1;

    while ((fromRight ? index-- : ++index < length)) {
      if (predicate(array[index], index, array)) {
        return index;
      }
    }
    return -1;
  }

  /**
   * The base implementation of `_.indexOf` without support for binary searches.
   *
   * @private
   * @param {Array} array The array to search.
   * @param {*} value The value to search for.
   * @param {number} fromIndex The index to search from.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function baseIndexOf(array, value, fromIndex) {
    if (value !== value) {
      return indexOfNaN(array, fromIndex);
    }
    var index = fromIndex - 1,
        length = array.length;

    while (++index < length) {
      if (array[index] === value) {
        return index;
      }
    }
    return -1;
  }

  /**
   * The base implementation of `_.isFunction` without support for environments
   * with incorrect `typeof` results.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
   */
  function baseIsFunction(value) {
    // Avoid a Chakra JIT bug in compatibility modes of IE 11.
    // See https://github.com/jashkenas/underscore/issues/1621 for more details.
    return typeof value == 'function' || false;
  }

  /**
   * Converts `value` to a string if it's not one. An empty string is returned
   * for `null` or `undefined` values.
   *
   * @private
   * @param {*} value The value to process.
   * @returns {string} Returns the string.
   */
  function baseToString(value) {
    return value == null ? '' : (value + '');
  }

  /**
   * Used by `_.trim` and `_.trimLeft` to get the index of the first character
   * of `string` that is not found in `chars`.
   *
   * @private
   * @param {string} string The string to inspect.
   * @param {string} chars The characters to find.
   * @returns {number} Returns the index of the first character not found in `chars`.
   */
  function charsLeftIndex(string, chars) {
    var index = -1,
        length = string.length;

    while (++index < length && chars.indexOf(string.charAt(index)) > -1) {}
    return index;
  }

  /**
   * Used by `_.trim` and `_.trimRight` to get the index of the last character
   * of `string` that is not found in `chars`.
   *
   * @private
   * @param {string} string The string to inspect.
   * @param {string} chars The characters to find.
   * @returns {number} Returns the index of the last character not found in `chars`.
   */
  function charsRightIndex(string, chars) {
    var index = string.length;

    while (index-- && chars.indexOf(string.charAt(index)) > -1) {}
    return index;
  }

  /**
   * Used by `_.sortBy` to compare transformed elements of a collection and stable
   * sort them in ascending order.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @returns {number} Returns the sort order indicator for `object`.
   */
  function compareAscending(object, other) {
    return baseCompareAscending(object.criteria, other.criteria) || (object.index - other.index);
  }

  /**
   * Used by `_.sortByOrder` to compare multiple properties of a value to another
   * and stable sort them.
   *
   * If `orders` is unspecified, all valuess are sorted in ascending order. Otherwise,
   * a value is sorted in ascending order if its corresponding order is "asc", and
   * descending if "desc".
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {boolean[]} orders The order to sort by for each property.
   * @returns {number} Returns the sort order indicator for `object`.
   */
  function compareMultiple(object, other, orders) {
    var index = -1,
        objCriteria = object.criteria,
        othCriteria = other.criteria,
        length = objCriteria.length,
        ordersLength = orders.length;

    while (++index < length) {
      var result = baseCompareAscending(objCriteria[index], othCriteria[index]);
      if (result) {
        if (index >= ordersLength) {
          return result;
        }
        var order = orders[index];
        return result * ((order === 'asc' || order === true) ? 1 : -1);
      }
    }
    // Fixes an `Array#sort` bug in the JS engine embedded in Adobe applications
    // that causes it, under certain circumstances, to provide the same value for
    // `object` and `other`. See https://github.com/jashkenas/underscore/pull/1247
    // for more details.
    //
    // This also ensures a stable sort in V8 and other engines.
    // See https://code.google.com/p/v8/issues/detail?id=90 for more details.
    return object.index - other.index;
  }

  /**
   * Used by `_.deburr` to convert latin-1 supplementary letters to basic latin letters.
   *
   * @private
   * @param {string} letter The matched letter to deburr.
   * @returns {string} Returns the deburred letter.
   */
  function deburrLetter(letter) {
    return deburredLetters[letter];
  }

  /**
   * Used by `_.escape` to convert characters to HTML entities.
   *
   * @private
   * @param {string} chr The matched character to escape.
   * @returns {string} Returns the escaped character.
   */
  function escapeHtmlChar(chr) {
    return htmlEscapes[chr];
  }

  /**
   * Used by `_.escapeRegExp` to escape characters for inclusion in compiled regexes.
   *
   * @private
   * @param {string} chr The matched character to escape.
   * @param {string} leadingChar The capture group for a leading character.
   * @param {string} whitespaceChar The capture group for a whitespace character.
   * @returns {string} Returns the escaped character.
   */
  function escapeRegExpChar(chr, leadingChar, whitespaceChar) {
    if (leadingChar) {
      chr = regexpEscapes[chr];
    } else if (whitespaceChar) {
      chr = stringEscapes[chr];
    }
    return '\\' + chr;
  }

  /**
   * Used by `_.template` to escape characters for inclusion in compiled string literals.
   *
   * @private
   * @param {string} chr The matched character to escape.
   * @returns {string} Returns the escaped character.
   */
  function escapeStringChar(chr) {
    return '\\' + stringEscapes[chr];
  }

  /**
   * Gets the index at which the first occurrence of `NaN` is found in `array`.
   *
   * @private
   * @param {Array} array The array to search.
   * @param {number} fromIndex The index to search from.
   * @param {boolean} [fromRight] Specify iterating from right to left.
   * @returns {number} Returns the index of the matched `NaN`, else `-1`.
   */
  function indexOfNaN(array, fromIndex, fromRight) {
    var length = array.length,
        index = fromIndex + (fromRight ? 0 : -1);

    while ((fromRight ? index-- : ++index < length)) {
      var other = array[index];
      if (other !== other) {
        return index;
      }
    }
    return -1;
  }

  /**
   * Checks if `value` is object-like.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
   */
  function isObjectLike(value) {
    return !!value && typeof value == 'object';
  }

  /**
   * Used by `trimmedLeftIndex` and `trimmedRightIndex` to determine if a
   * character code is whitespace.
   *
   * @private
   * @param {number} charCode The character code to inspect.
   * @returns {boolean} Returns `true` if `charCode` is whitespace, else `false`.
   */
  function isSpace(charCode) {
    return ((charCode <= 160 && (charCode >= 9 && charCode <= 13) || charCode == 32 || charCode == 160) || charCode == 5760 || charCode == 6158 ||
      (charCode >= 8192 && (charCode <= 8202 || charCode == 8232 || charCode == 8233 || charCode == 8239 || charCode == 8287 || charCode == 12288 || charCode == 65279)));
  }

  /**
   * Replaces all `placeholder` elements in `array` with an internal placeholder
   * and returns an array of their indexes.
   *
   * @private
   * @param {Array} array The array to modify.
   * @param {*} placeholder The placeholder to replace.
   * @returns {Array} Returns the new array of placeholder indexes.
   */
  function replaceHolders(array, placeholder) {
    var index = -1,
        length = array.length,
        resIndex = -1,
        result = [];

    while (++index < length) {
      if (array[index] === placeholder) {
        array[index] = PLACEHOLDER;
        result[++resIndex] = index;
      }
    }
    return result;
  }

  /**
   * An implementation of `_.uniq` optimized for sorted arrays without support
   * for callback shorthands and `this` binding.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {Function} [iteratee] The function invoked per iteration.
   * @returns {Array} Returns the new duplicate-value-free array.
   */
  function sortedUniq(array, iteratee) {
    var seen,
        index = -1,
        length = array.length,
        resIndex = -1,
        result = [];

    while (++index < length) {
      var value = array[index],
          computed = iteratee ? iteratee(value, index, array) : value;

      if (!index || seen !== computed) {
        seen = computed;
        result[++resIndex] = value;
      }
    }
    return result;
  }

  /**
   * Used by `_.trim` and `_.trimLeft` to get the index of the first non-whitespace
   * character of `string`.
   *
   * @private
   * @param {string} string The string to inspect.
   * @returns {number} Returns the index of the first non-whitespace character.
   */
  function trimmedLeftIndex(string) {
    var index = -1,
        length = string.length;

    while (++index < length && isSpace(string.charCodeAt(index))) {}
    return index;
  }

  /**
   * Used by `_.trim` and `_.trimRight` to get the index of the last non-whitespace
   * character of `string`.
   *
   * @private
   * @param {string} string The string to inspect.
   * @returns {number} Returns the index of the last non-whitespace character.
   */
  function trimmedRightIndex(string) {
    var index = string.length;

    while (index-- && isSpace(string.charCodeAt(index))) {}
    return index;
  }

  /**
   * Used by `_.unescape` to convert HTML entities to characters.
   *
   * @private
   * @param {string} chr The matched character to unescape.
   * @returns {string} Returns the unescaped character.
   */
  function unescapeHtmlChar(chr) {
    return htmlUnescapes[chr];
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Create a new pristine `lodash` function using the given `context` object.
   *
   * @static
   * @memberOf _
   * @category Utility
   * @param {Object} [context=root] The context object.
   * @returns {Function} Returns a new `lodash` function.
   * @example
   *
   * _.mixin({ 'foo': _.constant('foo') });
   *
   * var lodash = _.runInContext();
   * lodash.mixin({ 'bar': lodash.constant('bar') });
   *
   * _.isFunction(_.foo);
   * // => true
   * _.isFunction(_.bar);
   * // => false
   *
   * lodash.isFunction(lodash.foo);
   * // => false
   * lodash.isFunction(lodash.bar);
   * // => true
   *
   * // using `context` to mock `Date#getTime` use in `_.now`
   * var mock = _.runInContext({
   *   'Date': function() {
   *     return { 'getTime': getTimeMock };
   *   }
   * });
   *
   * // or creating a suped-up `defer` in Node.js
   * var defer = _.runInContext({ 'setTimeout': setImmediate }).defer;
   */
  function runInContext(context) {
    // Avoid issues with some ES3 environments that attempt to use values, named
    // after built-in constructors like `Object`, for the creation of literals.
    // ES5 clears this up by stating that literals must use built-in constructors.
    // See https://es5.github.io/#x11.1.5 for more details.
    context = context ? _.defaults(root.Object(), context, _.pick(root, contextProps)) : root;

    /** Native constructor references. */
    var Array = context.Array,
        Date = context.Date,
        Error = context.Error,
        Function = context.Function,
        Math = context.Math,
        Number = context.Number,
        Object = context.Object,
        RegExp = context.RegExp,
        String = context.String,
        TypeError = context.TypeError;

    /** Used for native method references. */
    var arrayProto = Array.prototype,
        objectProto = Object.prototype,
        stringProto = String.prototype;

    /** Used to resolve the decompiled source of functions. */
    var fnToString = Function.prototype.toString;

    /** Used to check objects for own properties. */
    var hasOwnProperty = objectProto.hasOwnProperty;

    /** Used to generate unique IDs. */
    var idCounter = 0;

    /**
     * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objToString = objectProto.toString;

    /** Used to restore the original `_` reference in `_.noConflict`. */
    var oldDash = root._;

    /** Used to detect if a method is native. */
    var reIsNative = RegExp('^' +
      fnToString.call(hasOwnProperty).replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
      .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
    );

    /** Native method references. */
    var ArrayBuffer = context.ArrayBuffer,
        clearTimeout = context.clearTimeout,
        parseFloat = context.parseFloat,
        pow = Math.pow,
        propertyIsEnumerable = objectProto.propertyIsEnumerable,
        Set = getNative(context, 'Set'),
        setTimeout = context.setTimeout,
        splice = arrayProto.splice,
        Uint8Array = context.Uint8Array,
        WeakMap = getNative(context, 'WeakMap');

    /* Native method references for those with the same name as other `lodash` methods. */
    var nativeCeil = Math.ceil,
        nativeCreate = getNative(Object, 'create'),
        nativeFloor = Math.floor,
        nativeIsArray = getNative(Array, 'isArray'),
        nativeIsFinite = context.isFinite,
        nativeKeys = getNative(Object, 'keys'),
        nativeMax = Math.max,
        nativeMin = Math.min,
        nativeNow = getNative(Date, 'now'),
        nativeParseInt = context.parseInt,
        nativeRandom = Math.random;

    /** Used as references for `-Infinity` and `Infinity`. */
    var NEGATIVE_INFINITY = Number.NEGATIVE_INFINITY,
        POSITIVE_INFINITY = Number.POSITIVE_INFINITY;

    /** Used as references for the maximum length and index of an array. */
    var MAX_ARRAY_LENGTH = 4294967295,
        MAX_ARRAY_INDEX = MAX_ARRAY_LENGTH - 1,
        HALF_MAX_ARRAY_LENGTH = MAX_ARRAY_LENGTH >>> 1;

    /**
     * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
     * of an array-like value.
     */
    var MAX_SAFE_INTEGER = 9007199254740991;

    /** Used to store function metadata. */
    var metaMap = WeakMap && new WeakMap;

    /** Used to lookup unminified function names. */
    var realNames = {};

    /*------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object which wraps `value` to enable implicit chaining.
     * Methods that operate on and return arrays, collections, and functions can
     * be chained together. Methods that retrieve a single value or may return a
     * primitive value will automatically end the chain returning the unwrapped
     * value. Explicit chaining may be enabled using `_.chain`. The execution of
     * chained methods is lazy, that is, execution is deferred until `_#value`
     * is implicitly or explicitly called.
     *
     * Lazy evaluation allows several methods to support shortcut fusion. Shortcut
     * fusion is an optimization strategy which merge iteratee calls; this can help
     * to avoid the creation of intermediate data structures and greatly reduce the
     * number of iteratee executions.
     *
     * Chaining is supported in custom builds as long as the `_#value` method is
     * directly or indirectly included in the build.
     *
     * In addition to lodash methods, wrappers have `Array` and `String` methods.
     *
     * The wrapper `Array` methods are:
     * `concat`, `join`, `pop`, `push`, `reverse`, `shift`, `slice`, `sort`,
     * `splice`, and `unshift`
     *
     * The wrapper `String` methods are:
     * `replace` and `split`
     *
     * The wrapper methods that support shortcut fusion are:
     * `compact`, `drop`, `dropRight`, `dropRightWhile`, `dropWhile`, `filter`,
     * `first`, `initial`, `last`, `map`, `pluck`, `reject`, `rest`, `reverse`,
     * `slice`, `take`, `takeRight`, `takeRightWhile`, `takeWhile`, `toArray`,
     * and `where`
     *
     * The chainable wrapper methods are:
     * `after`, `ary`, `assign`, `at`, `before`, `bind`, `bindAll`, `bindKey`,
     * `callback`, `chain`, `chunk`, `commit`, `compact`, `concat`, `constant`,
     * `countBy`, `create`, `curry`, `debounce`, `defaults`, `defaultsDeep`,
     * `defer`, `delay`, `difference`, `drop`, `dropRight`, `dropRightWhile`,
     * `dropWhile`, `fill`, `filter`, `flatten`, `flattenDeep`, `flow`, `flowRight`,
     * `forEach`, `forEachRight`, `forIn`, `forInRight`, `forOwn`, `forOwnRight`,
     * `functions`, `groupBy`, `indexBy`, `initial`, `intersection`, `invert`,
     * `invoke`, `keys`, `keysIn`, `map`, `mapKeys`, `mapValues`, `matches`,
     * `matchesProperty`, `memoize`, `merge`, `method`, `methodOf`, `mixin`,
     * `modArgs`, `negate`, `omit`, `once`, `pairs`, `partial`, `partialRight`,
     * `partition`, `pick`, `plant`, `pluck`, `property`, `propertyOf`, `pull`,
     * `pullAt`, `push`, `range`, `rearg`, `reject`, `remove`, `rest`, `restParam`,
     * `reverse`, `set`, `shuffle`, `slice`, `sort`, `sortBy`, `sortByAll`,
     * `sortByOrder`, `splice`, `spread`, `take`, `takeRight`, `takeRightWhile`,
     * `takeWhile`, `tap`, `throttle`, `thru`, `times`, `toArray`, `toPlainObject`,
     * `transform`, `union`, `uniq`, `unshift`, `unzip`, `unzipWith`, `values`,
     * `valuesIn`, `where`, `without`, `wrap`, `xor`, `zip`, `zipObject`, `zipWith`
     *
     * The wrapper methods that are **not** chainable by default are:
     * `add`, `attempt`, `camelCase`, `capitalize`, `ceil`, `clone`, `cloneDeep`,
     * `deburr`, `endsWith`, `escape`, `escapeRegExp`, `every`, `find`, `findIndex`,
     * `findKey`, `findLast`, `findLastIndex`, `findLastKey`, `findWhere`, `first`,
     * `floor`, `get`, `gt`, `gte`, `has`, `identity`, `includes`, `indexOf`,
     * `inRange`, `isArguments`, `isArray`, `isBoolean`, `isDate`, `isElement`,
     * `isEmpty`, `isEqual`, `isError`, `isFinite` `isFunction`, `isMatch`,
     * `isNative`, `isNaN`, `isNull`, `isNumber`, `isObject`, `isPlainObject`,
     * `isRegExp`, `isString`, `isUndefined`, `isTypedArray`, `join`, `kebabCase`,
     * `last`, `lastIndexOf`, `lt`, `lte`, `max`, `min`, `noConflict`, `noop`,
     * `now`, `pad`, `padLeft`, `padRight`, `parseInt`, `pop`, `random`, `reduce`,
     * `reduceRight`, `repeat`, `result`, `round`, `runInContext`, `shift`, `size`,
     * `snakeCase`, `some`, `sortedIndex`, `sortedLastIndex`, `startCase`,
     * `startsWith`, `sum`, `template`, `trim`, `trimLeft`, `trimRight`, `trunc`,
     * `unescape`, `uniqueId`, `value`, and `words`
     *
     * The wrapper method `sample` will return a wrapped value when `n` is provided,
     * otherwise an unwrapped value is returned.
     *
     * @name _
     * @constructor
     * @category Chain
     * @param {*} value The value to wrap in a `lodash` instance.
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * var wrapped = _([1, 2, 3]);
     *
     * // returns an unwrapped value
     * wrapped.reduce(function(total, n) {
     *   return total + n;
     * });
     * // => 6
     *
     * // returns a wrapped value
     * var squares = wrapped.map(function(n) {
     *   return n * n;
     * });
     *
     * _.isArray(squares);
     * // => false
     *
     * _.isArray(squares.value());
     * // => true
     */
    function lodash(value) {
      if (isObjectLike(value) && !isArray(value) && !(value instanceof LazyWrapper)) {
        if (value instanceof LodashWrapper) {
          return value;
        }
        if (hasOwnProperty.call(value, '__chain__') && hasOwnProperty.call(value, '__wrapped__')) {
          return wrapperClone(value);
        }
      }
      return new LodashWrapper(value);
    }

    /**
     * The function whose prototype all chaining wrappers inherit from.
     *
     * @private
     */
    function baseLodash() {
      // No operation performed.
    }

    /**
     * The base constructor for creating `lodash` wrapper objects.
     *
     * @private
     * @param {*} value The value to wrap.
     * @param {boolean} [chainAll] Enable chaining for all wrapper methods.
     * @param {Array} [actions=[]] Actions to peform to resolve the unwrapped value.
     */
    function LodashWrapper(value, chainAll, actions) {
      this.__wrapped__ = value;
      this.__actions__ = actions || [];
      this.__chain__ = !!chainAll;
    }

    /**
     * An object environment feature flags.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    var support = lodash.support = {};

    /**
     * By default, the template delimiters used by lodash are like those in
     * embedded Ruby (ERB). Change the following template settings to use
     * alternative delimiters.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    lodash.templateSettings = {

      /**
       * Used to detect `data` property values to be HTML-escaped.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'escape': reEscape,

      /**
       * Used to detect code to be evaluated.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'evaluate': reEvaluate,

      /**
       * Used to detect `data` property values to inject.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'interpolate': reInterpolate,

      /**
       * Used to reference the data object in the template text.
       *
       * @memberOf _.templateSettings
       * @type string
       */
      'variable': '',

      /**
       * Used to import variables into the compiled template.
       *
       * @memberOf _.templateSettings
       * @type Object
       */
      'imports': {

        /**
         * A reference to the `lodash` function.
         *
         * @memberOf _.templateSettings.imports
         * @type Function
         */
        '_': lodash
      }
    };

    /*------------------------------------------------------------------------*/

    /**
     * Creates a lazy wrapper object which wraps `value` to enable lazy evaluation.
     *
     * @private
     * @param {*} value The value to wrap.
     */
    function LazyWrapper(value) {
      this.__wrapped__ = value;
      this.__actions__ = [];
      this.__dir__ = 1;
      this.__filtered__ = false;
      this.__iteratees__ = [];
      this.__takeCount__ = POSITIVE_INFINITY;
      this.__views__ = [];
    }

    /**
     * Creates a clone of the lazy wrapper object.
     *
     * @private
     * @name clone
     * @memberOf LazyWrapper
     * @returns {Object} Returns the cloned `LazyWrapper` object.
     */
    function lazyClone() {
      var result = new LazyWrapper(this.__wrapped__);
      result.__actions__ = arrayCopy(this.__actions__);
      result.__dir__ = this.__dir__;
      result.__filtered__ = this.__filtered__;
      result.__iteratees__ = arrayCopy(this.__iteratees__);
      result.__takeCount__ = this.__takeCount__;
      result.__views__ = arrayCopy(this.__views__);
      return result;
    }

    /**
     * Reverses the direction of lazy iteration.
     *
     * @private
     * @name reverse
     * @memberOf LazyWrapper
     * @returns {Object} Returns the new reversed `LazyWrapper` object.
     */
    function lazyReverse() {
      if (this.__filtered__) {
        var result = new LazyWrapper(this);
        result.__dir__ = -1;
        result.__filtered__ = true;
      } else {
        result = this.clone();
        result.__dir__ *= -1;
      }
      return result;
    }

    /**
     * Extracts the unwrapped value from its lazy wrapper.
     *
     * @private
     * @name value
     * @memberOf LazyWrapper
     * @returns {*} Returns the unwrapped value.
     */
    function lazyValue() {
      var array = this.__wrapped__.value(),
          dir = this.__dir__,
          isArr = isArray(array),
          isRight = dir < 0,
          arrLength = isArr ? array.length : 0,
          view = getView(0, arrLength, this.__views__),
          start = view.start,
          end = view.end,
          length = end - start,
          index = isRight ? end : (start - 1),
          iteratees = this.__iteratees__,
          iterLength = iteratees.length,
          resIndex = 0,
          takeCount = nativeMin(length, this.__takeCount__);

      if (!isArr || arrLength < LARGE_ARRAY_SIZE || (arrLength == length && takeCount == length)) {
        return baseWrapperValue((isRight && isArr) ? array.reverse() : array, this.__actions__);
      }
      var result = [];

      outer:
      while (length-- && resIndex < takeCount) {
        index += dir;

        var iterIndex = -1,
            value = array[index];

        while (++iterIndex < iterLength) {
          var data = iteratees[iterIndex],
              iteratee = data.iteratee,
              type = data.type,
              computed = iteratee(value);

          if (type == LAZY_MAP_FLAG) {
            value = computed;
          } else if (!computed) {
            if (type == LAZY_FILTER_FLAG) {
              continue outer;
            } else {
              break outer;
            }
          }
        }
        result[resIndex++] = value;
      }
      return result;
    }

    /*------------------------------------------------------------------------*/

    /**
     * Creates a cache object to store key/value pairs.
     *
     * @private
     * @static
     * @name Cache
     * @memberOf _.memoize
     */
    function MapCache() {
      this.__data__ = {};
    }

    /**
     * Removes `key` and its value from the cache.
     *
     * @private
     * @name delete
     * @memberOf _.memoize.Cache
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed successfully, else `false`.
     */
    function mapDelete(key) {
      return this.has(key) && delete this.__data__[key];
    }

    /**
     * Gets the cached value for `key`.
     *
     * @private
     * @name get
     * @memberOf _.memoize.Cache
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the cached value.
     */
    function mapGet(key) {
      return key == '__proto__' ? undefined : this.__data__[key];
    }

    /**
     * Checks if a cached value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf _.memoize.Cache
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function mapHas(key) {
      return key != '__proto__' && hasOwnProperty.call(this.__data__, key);
    }

    /**
     * Sets `value` to `key` of the cache.
     *
     * @private
     * @name set
     * @memberOf _.memoize.Cache
     * @param {string} key The key of the value to cache.
     * @param {*} value The value to cache.
     * @returns {Object} Returns the cache object.
     */
    function mapSet(key, value) {
      if (key != '__proto__') {
        this.__data__[key] = value;
      }
      return this;
    }

    /*------------------------------------------------------------------------*/

    /**
     *
     * Creates a cache object to store unique values.
     *
     * @private
     * @param {Array} [values] The values to cache.
     */
    function SetCache(values) {
      var length = values ? values.length : 0;

      this.data = { 'hash': nativeCreate(null), 'set': new Set };
      while (length--) {
        this.push(values[length]);
      }
    }

    /**
     * Checks if `value` is in `cache` mimicking the return signature of
     * `_.indexOf` by returning `0` if the value is found, else `-1`.
     *
     * @private
     * @param {Object} cache The cache to search.
     * @param {*} value The value to search for.
     * @returns {number} Returns `0` if `value` is found, else `-1`.
     */
    function cacheIndexOf(cache, value) {
      var data = cache.data,
          result = (typeof value == 'string' || isObject(value)) ? data.set.has(value) : data.hash[value];

      return result ? 0 : -1;
    }

    /**
     * Adds `value` to the cache.
     *
     * @private
     * @name push
     * @memberOf SetCache
     * @param {*} value The value to cache.
     */
    function cachePush(value) {
      var data = this.data;
      if (typeof value == 'string' || isObject(value)) {
        data.set.add(value);
      } else {
        data.hash[value] = true;
      }
    }

    /*------------------------------------------------------------------------*/

    /**
     * Creates a new array joining `array` with `other`.
     *
     * @private
     * @param {Array} array The array to join.
     * @param {Array} other The other array to join.
     * @returns {Array} Returns the new concatenated array.
     */
    function arrayConcat(array, other) {
      var index = -1,
          length = array.length,
          othIndex = -1,
          othLength = other.length,
          result = Array(length + othLength);

      while (++index < length) {
        result[index] = array[index];
      }
      while (++othIndex < othLength) {
        result[index++] = other[othIndex];
      }
      return result;
    }

    /**
     * Copies the values of `source` to `array`.
     *
     * @private
     * @param {Array} source The array to copy values from.
     * @param {Array} [array=[]] The array to copy values to.
     * @returns {Array} Returns `array`.
     */
    function arrayCopy(source, array) {
      var index = -1,
          length = source.length;

      array || (array = Array(length));
      while (++index < length) {
        array[index] = source[index];
      }
      return array;
    }

    /**
     * A specialized version of `_.forEach` for arrays without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns `array`.
     */
    function arrayEach(array, iteratee) {
      var index = -1,
          length = array.length;

      while (++index < length) {
        if (iteratee(array[index], index, array) === false) {
          break;
        }
      }
      return array;
    }

    /**
     * A specialized version of `_.forEachRight` for arrays without support for
     * callback shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns `array`.
     */
    function arrayEachRight(array, iteratee) {
      var length = array.length;

      while (length--) {
        if (iteratee(array[length], length, array) === false) {
          break;
        }
      }
      return array;
    }

    /**
     * A specialized version of `_.every` for arrays without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {boolean} Returns `true` if all elements pass the predicate check,
     *  else `false`.
     */
    function arrayEvery(array, predicate) {
      var index = -1,
          length = array.length;

      while (++index < length) {
        if (!predicate(array[index], index, array)) {
          return false;
        }
      }
      return true;
    }

    /**
     * A specialized version of `baseExtremum` for arrays which invokes `iteratee`
     * with one argument: (value).
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {Function} comparator The function used to compare values.
     * @param {*} exValue The initial extremum value.
     * @returns {*} Returns the extremum value.
     */
    function arrayExtremum(array, iteratee, comparator, exValue) {
      var index = -1,
          length = array.length,
          computed = exValue,
          result = computed;

      while (++index < length) {
        var value = array[index],
            current = +iteratee(value);

        if (comparator(current, computed)) {
          computed = current;
          result = value;
        }
      }
      return result;
    }

    /**
     * A specialized version of `_.filter` for arrays without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {Array} Returns the new filtered array.
     */
    function arrayFilter(array, predicate) {
      var index = -1,
          length = array.length,
          resIndex = -1,
          result = [];

      while (++index < length) {
        var value = array[index];
        if (predicate(value, index, array)) {
          result[++resIndex] = value;
        }
      }
      return result;
    }

    /**
     * A specialized version of `_.map` for arrays without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns the new mapped array.
     */
    function arrayMap(array, iteratee) {
      var index = -1,
          length = array.length,
          result = Array(length);

      while (++index < length) {
        result[index] = iteratee(array[index], index, array);
      }
      return result;
    }

    /**
     * Appends the elements of `values` to `array`.
     *
     * @private
     * @param {Array} array The array to modify.
     * @param {Array} values The values to append.
     * @returns {Array} Returns `array`.
     */
    function arrayPush(array, values) {
      var index = -1,
          length = values.length,
          offset = array.length;

      while (++index < length) {
        array[offset + index] = values[index];
      }
      return array;
    }

    /**
     * A specialized version of `_.reduce` for arrays without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {*} [accumulator] The initial value.
     * @param {boolean} [initFromArray] Specify using the first element of `array`
     *  as the initial value.
     * @returns {*} Returns the accumulated value.
     */
    function arrayReduce(array, iteratee, accumulator, initFromArray) {
      var index = -1,
          length = array.length;

      if (initFromArray && length) {
        accumulator = array[++index];
      }
      while (++index < length) {
        accumulator = iteratee(accumulator, array[index], index, array);
      }
      return accumulator;
    }

    /**
     * A specialized version of `_.reduceRight` for arrays without support for
     * callback shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {*} [accumulator] The initial value.
     * @param {boolean} [initFromArray] Specify using the last element of `array`
     *  as the initial value.
     * @returns {*} Returns the accumulated value.
     */
    function arrayReduceRight(array, iteratee, accumulator, initFromArray) {
      var length = array.length;
      if (initFromArray && length) {
        accumulator = array[--length];
      }
      while (length--) {
        accumulator = iteratee(accumulator, array[length], length, array);
      }
      return accumulator;
    }

    /**
     * A specialized version of `_.some` for arrays without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {boolean} Returns `true` if any element passes the predicate check,
     *  else `false`.
     */
    function arraySome(array, predicate) {
      var index = -1,
          length = array.length;

      while (++index < length) {
        if (predicate(array[index], index, array)) {
          return true;
        }
      }
      return false;
    }

    /**
     * A specialized version of `_.sum` for arrays without support for callback
     * shorthands and `this` binding..
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {number} Returns the sum.
     */
    function arraySum(array, iteratee) {
      var length = array.length,
          result = 0;

      while (length--) {
        result += +iteratee(array[length]) || 0;
      }
      return result;
    }

    /**
     * Used by `_.defaults` to customize its `_.assign` use.
     *
     * @private
     * @param {*} objectValue The destination object property value.
     * @param {*} sourceValue The source object property value.
     * @returns {*} Returns the value to assign to the destination object.
     */
    function assignDefaults(objectValue, sourceValue) {
      return objectValue === undefined ? sourceValue : objectValue;
    }

    /**
     * Used by `_.template` to customize its `_.assign` use.
     *
     * **Note:** This function is like `assignDefaults` except that it ignores
     * inherited property values when checking if a property is `undefined`.
     *
     * @private
     * @param {*} objectValue The destination object property value.
     * @param {*} sourceValue The source object property value.
     * @param {string} key The key associated with the object and source values.
     * @param {Object} object The destination object.
     * @returns {*} Returns the value to assign to the destination object.
     */
    function assignOwnDefaults(objectValue, sourceValue, key, object) {
      return (objectValue === undefined || !hasOwnProperty.call(object, key))
        ? sourceValue
        : objectValue;
    }

    /**
     * A specialized version of `_.assign` for customizing assigned values without
     * support for argument juggling, multiple sources, and `this` binding `customizer`
     * functions.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {Function} customizer The function to customize assigned values.
     * @returns {Object} Returns `object`.
     */
    function assignWith(object, source, customizer) {
      var index = -1,
          props = keys(source),
          length = props.length;

      while (++index < length) {
        var key = props[index],
            value = object[key],
            result = customizer(value, source[key], key, object, source);

        if ((result === result ? (result !== value) : (value === value)) ||
            (value === undefined && !(key in object))) {
          object[key] = result;
        }
      }
      return object;
    }

    /**
     * The base implementation of `_.assign` without support for argument juggling,
     * multiple sources, and `customizer` functions.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @returns {Object} Returns `object`.
     */
    function baseAssign(object, source) {
      return source == null
        ? object
        : baseCopy(source, keys(source), object);
    }

    /**
     * The base implementation of `_.at` without support for string collections
     * and individual key arguments.
     *
     * @private
     * @param {Array|Object} collection The collection to iterate over.
     * @param {number[]|string[]} props The property names or indexes of elements to pick.
     * @returns {Array} Returns the new array of picked elements.
     */
    function baseAt(collection, props) {
      var index = -1,
          isNil = collection == null,
          isArr = !isNil && isArrayLike(collection),
          length = isArr ? collection.length : 0,
          propsLength = props.length,
          result = Array(propsLength);

      while(++index < propsLength) {
        var key = props[index];
        if (isArr) {
          result[index] = isIndex(key, length) ? collection[key] : undefined;
        } else {
          result[index] = isNil ? undefined : collection[key];
        }
      }
      return result;
    }

    /**
     * Copies properties of `source` to `object`.
     *
     * @private
     * @param {Object} source The object to copy properties from.
     * @param {Array} props The property names to copy.
     * @param {Object} [object={}] The object to copy properties to.
     * @returns {Object} Returns `object`.
     */
    function baseCopy(source, props, object) {
      object || (object = {});

      var index = -1,
          length = props.length;

      while (++index < length) {
        var key = props[index];
        object[key] = source[key];
      }
      return object;
    }

    /**
     * The base implementation of `_.callback` which supports specifying the
     * number of arguments to provide to `func`.
     *
     * @private
     * @param {*} [func=_.identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {number} [argCount] The number of arguments to provide to `func`.
     * @returns {Function} Returns the callback.
     */
    function baseCallback(func, thisArg, argCount) {
      var type = typeof func;
      if (type == 'function') {
        return thisArg === undefined
          ? func
          : bindCallback(func, thisArg, argCount);
      }
      if (func == null) {
        return identity;
      }
      if (type == 'object') {
        return baseMatches(func);
      }
      return thisArg === undefined
        ? property(func)
        : baseMatchesProperty(func, thisArg);
    }

    /**
     * The base implementation of `_.clone` without support for argument juggling
     * and `this` binding `customizer` functions.
     *
     * @private
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @param {Function} [customizer] The function to customize cloning values.
     * @param {string} [key] The key of `value`.
     * @param {Object} [object] The object `value` belongs to.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates clones with source counterparts.
     * @returns {*} Returns the cloned value.
     */
    function baseClone(value, isDeep, customizer, key, object, stackA, stackB) {
      var result;
      if (customizer) {
        result = object ? customizer(value, key, object) : customizer(value);
      }
      if (result !== undefined) {
        return result;
      }
      if (!isObject(value)) {
        return value;
      }
      var isArr = isArray(value);
      if (isArr) {
        result = initCloneArray(value);
        if (!isDeep) {
          return arrayCopy(value, result);
        }
      } else {
        var tag = objToString.call(value),
            isFunc = tag == funcTag;

        if (tag == objectTag || tag == argsTag || (isFunc && !object)) {
          result = initCloneObject(isFunc ? {} : value);
          if (!isDeep) {
            return baseAssign(result, value);
          }
        } else {
          return cloneableTags[tag]
            ? initCloneByTag(value, tag, isDeep)
            : (object ? value : {});
        }
      }
      // Check for circular references and return its corresponding clone.
      stackA || (stackA = []);
      stackB || (stackB = []);

      var length = stackA.length;
      while (length--) {
        if (stackA[length] == value) {
          return stackB[length];
        }
      }
      // Add the source value to the stack of traversed objects and associate it with its clone.
      stackA.push(value);
      stackB.push(result);

      // Recursively populate clone (susceptible to call stack limits).
      (isArr ? arrayEach : baseForOwn)(value, function(subValue, key) {
        result[key] = baseClone(subValue, isDeep, customizer, key, value, stackA, stackB);
      });
      return result;
    }

    /**
     * The base implementation of `_.create` without support for assigning
     * properties to the created object.
     *
     * @private
     * @param {Object} prototype The object to inherit from.
     * @returns {Object} Returns the new object.
     */
    var baseCreate = (function() {
      function object() {}
      return function(prototype) {
        if (isObject(prototype)) {
          object.prototype = prototype;
          var result = new object;
          object.prototype = undefined;
        }
        return result || {};
      };
    }());

    /**
     * The base implementation of `_.delay` and `_.defer` which accepts an index
     * of where to slice the arguments to provide to `func`.
     *
     * @private
     * @param {Function} func The function to delay.
     * @param {number} wait The number of milliseconds to delay invocation.
     * @param {Object} args The arguments provide to `func`.
     * @returns {number} Returns the timer id.
     */
    function baseDelay(func, wait, args) {
      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      return setTimeout(function() { func.apply(undefined, args); }, wait);
    }

    /**
     * The base implementation of `_.difference` which accepts a single array
     * of values to exclude.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {Array} values The values to exclude.
     * @returns {Array} Returns the new array of filtered values.
     */
    function baseDifference(array, values) {
      var length = array ? array.length : 0,
          result = [];

      if (!length) {
        return result;
      }
      var index = -1,
          indexOf = getIndexOf(),
          isCommon = indexOf == baseIndexOf,
          cache = (isCommon && values.length >= LARGE_ARRAY_SIZE) ? createCache(values) : null,
          valuesLength = values.length;

      if (cache) {
        indexOf = cacheIndexOf;
        isCommon = false;
        values = cache;
      }
      outer:
      while (++index < length) {
        var value = array[index];

        if (isCommon && value === value) {
          var valuesIndex = valuesLength;
          while (valuesIndex--) {
            if (values[valuesIndex] === value) {
              continue outer;
            }
          }
          result.push(value);
        }
        else if (indexOf(values, value, 0) < 0) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.forEach` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array|Object|string} Returns `collection`.
     */
    var baseEach = createBaseEach(baseForOwn);

    /**
     * The base implementation of `_.forEachRight` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array|Object|string} Returns `collection`.
     */
    var baseEachRight = createBaseEach(baseForOwnRight, true);

    /**
     * The base implementation of `_.every` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {boolean} Returns `true` if all elements pass the predicate check,
     *  else `false`
     */
    function baseEvery(collection, predicate) {
      var result = true;
      baseEach(collection, function(value, index, collection) {
        result = !!predicate(value, index, collection);
        return result;
      });
      return result;
    }

    /**
     * Gets the extremum value of `collection` invoking `iteratee` for each value
     * in `collection` to generate the criterion by which the value is ranked.
     * The `iteratee` is invoked with three arguments: (value, index|key, collection).
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {Function} comparator The function used to compare values.
     * @param {*} exValue The initial extremum value.
     * @returns {*} Returns the extremum value.
     */
    function baseExtremum(collection, iteratee, comparator, exValue) {
      var computed = exValue,
          result = computed;

      baseEach(collection, function(value, index, collection) {
        var current = +iteratee(value, index, collection);
        if (comparator(current, computed) || (current === exValue && current === result)) {
          computed = current;
          result = value;
        }
      });
      return result;
    }

    /**
     * The base implementation of `_.fill` without an iteratee call guard.
     *
     * @private
     * @param {Array} array The array to fill.
     * @param {*} value The value to fill `array` with.
     * @param {number} [start=0] The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns `array`.
     */
    function baseFill(array, value, start, end) {
      var length = array.length;

      start = start == null ? 0 : (+start || 0);
      if (start < 0) {
        start = -start > length ? 0 : (length + start);
      }
      end = (end === undefined || end > length) ? length : (+end || 0);
      if (end < 0) {
        end += length;
      }
      length = start > end ? 0 : (end >>> 0);
      start >>>= 0;

      while (start < length) {
        array[start++] = value;
      }
      return array;
    }

    /**
     * The base implementation of `_.filter` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {Array} Returns the new filtered array.
     */
    function baseFilter(collection, predicate) {
      var result = [];
      baseEach(collection, function(value, index, collection) {
        if (predicate(value, index, collection)) {
          result.push(value);
        }
      });
      return result;
    }

    /**
     * The base implementation of `_.find`, `_.findLast`, `_.findKey`, and `_.findLastKey`,
     * without support for callback shorthands and `this` binding, which iterates
     * over `collection` using the provided `eachFunc`.
     *
     * @private
     * @param {Array|Object|string} collection The collection to search.
     * @param {Function} predicate The function invoked per iteration.
     * @param {Function} eachFunc The function to iterate over `collection`.
     * @param {boolean} [retKey] Specify returning the key of the found element
     *  instead of the element itself.
     * @returns {*} Returns the found element or its key, else `undefined`.
     */
    function baseFind(collection, predicate, eachFunc, retKey) {
      var result;
      eachFunc(collection, function(value, key, collection) {
        if (predicate(value, key, collection)) {
          result = retKey ? key : value;
          return false;
        }
      });
      return result;
    }

    /**
     * The base implementation of `_.flatten` with added support for restricting
     * flattening and specifying the start index.
     *
     * @private
     * @param {Array} array The array to flatten.
     * @param {boolean} [isDeep] Specify a deep flatten.
     * @param {boolean} [isStrict] Restrict flattening to arrays-like objects.
     * @param {Array} [result=[]] The initial result value.
     * @returns {Array} Returns the new flattened array.
     */
    function baseFlatten(array, isDeep, isStrict, result) {
      result || (result = []);

      var index = -1,
          length = array.length;

      while (++index < length) {
        var value = array[index];
        if (isObjectLike(value) && isArrayLike(value) &&
            (isStrict || isArray(value) || isArguments(value))) {
          if (isDeep) {
            // Recursively flatten arrays (susceptible to call stack limits).
            baseFlatten(value, isDeep, isStrict, result);
          } else {
            arrayPush(result, value);
          }
        } else if (!isStrict) {
          result[result.length] = value;
        }
      }
      return result;
    }

    /**
     * The base implementation of `baseForIn` and `baseForOwn` which iterates
     * over `object` properties returned by `keysFunc` invoking `iteratee` for
     * each property. Iteratee functions may exit iteration early by explicitly
     * returning `false`.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {Function} keysFunc The function to get the keys of `object`.
     * @returns {Object} Returns `object`.
     */
    var baseFor = createBaseFor();

    /**
     * This function is like `baseFor` except that it iterates over properties
     * in the opposite order.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {Function} keysFunc The function to get the keys of `object`.
     * @returns {Object} Returns `object`.
     */
    var baseForRight = createBaseFor(true);

    /**
     * The base implementation of `_.forIn` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Object} Returns `object`.
     */
    function baseForIn(object, iteratee) {
      return baseFor(object, iteratee, keysIn);
    }

    /**
     * The base implementation of `_.forOwn` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Object} Returns `object`.
     */
    function baseForOwn(object, iteratee) {
      return baseFor(object, iteratee, keys);
    }

    /**
     * The base implementation of `_.forOwnRight` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Object} Returns `object`.
     */
    function baseForOwnRight(object, iteratee) {
      return baseForRight(object, iteratee, keys);
    }

    /**
     * The base implementation of `_.functions` which creates an array of
     * `object` function property names filtered from those provided.
     *
     * @private
     * @param {Object} object The object to inspect.
     * @param {Array} props The property names to filter.
     * @returns {Array} Returns the new array of filtered property names.
     */
    function baseFunctions(object, props) {
      var index = -1,
          length = props.length,
          resIndex = -1,
          result = [];

      while (++index < length) {
        var key = props[index];
        if (isFunction(object[key])) {
          result[++resIndex] = key;
        }
      }
      return result;
    }

    /**
     * The base implementation of `get` without support for string paths
     * and default values.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array} path The path of the property to get.
     * @param {string} [pathKey] The key representation of path.
     * @returns {*} Returns the resolved value.
     */
    function baseGet(object, path, pathKey) {
      if (object == null) {
        return;
      }
      if (pathKey !== undefined && pathKey in toObject(object)) {
        path = [pathKey];
      }
      var index = 0,
          length = path.length;

      while (object != null && index < length) {
        object = object[path[index++]];
      }
      return (index && index == length) ? object : undefined;
    }

    /**
     * The base implementation of `_.isEqual` without support for `this` binding
     * `customizer` functions.
     *
     * @private
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @param {Function} [customizer] The function to customize comparing values.
     * @param {boolean} [isLoose] Specify performing partial comparisons.
     * @param {Array} [stackA] Tracks traversed `value` objects.
     * @param {Array} [stackB] Tracks traversed `other` objects.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     */
    function baseIsEqual(value, other, customizer, isLoose, stackA, stackB) {
      if (value === other) {
        return true;
      }
      if (value == null || other == null || (!isObject(value) && !isObjectLike(other))) {
        return value !== value && other !== other;
      }
      return baseIsEqualDeep(value, other, baseIsEqual, customizer, isLoose, stackA, stackB);
    }

    /**
     * A specialized version of `baseIsEqual` for arrays and objects which performs
     * deep comparisons and tracks traversed objects enabling objects with circular
     * references to be compared.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Function} [customizer] The function to customize comparing objects.
     * @param {boolean} [isLoose] Specify performing partial comparisons.
     * @param {Array} [stackA=[]] Tracks traversed `value` objects.
     * @param {Array} [stackB=[]] Tracks traversed `other` objects.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function baseIsEqualDeep(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
      var objIsArr = isArray(object),
          othIsArr = isArray(other),
          objTag = arrayTag,
          othTag = arrayTag;

      if (!objIsArr) {
        objTag = objToString.call(object);
        if (objTag == argsTag) {
          objTag = objectTag;
        } else if (objTag != objectTag) {
          objIsArr = isTypedArray(object);
        }
      }
      if (!othIsArr) {
        othTag = objToString.call(other);
        if (othTag == argsTag) {
          othTag = objectTag;
        } else if (othTag != objectTag) {
          othIsArr = isTypedArray(other);
        }
      }
      var objIsObj = objTag == objectTag,
          othIsObj = othTag == objectTag,
          isSameTag = objTag == othTag;

      if (isSameTag && !(objIsArr || objIsObj)) {
        return equalByTag(object, other, objTag);
      }
      if (!isLoose) {
        var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
            othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

        if (objIsWrapped || othIsWrapped) {
          return equalFunc(objIsWrapped ? object.value() : object, othIsWrapped ? other.value() : other, customizer, isLoose, stackA, stackB);
        }
      }
      if (!isSameTag) {
        return false;
      }
      // Assume cyclic values are equal.
      // For more information on detecting circular references see https://es5.github.io/#JO.
      stackA || (stackA = []);
      stackB || (stackB = []);

      var length = stackA.length;
      while (length--) {
        if (stackA[length] == object) {
          return stackB[length] == other;
        }
      }
      // Add `object` and `other` to the stack of traversed objects.
      stackA.push(object);
      stackB.push(other);

      var result = (objIsArr ? equalArrays : equalObjects)(object, other, equalFunc, customizer, isLoose, stackA, stackB);

      stackA.pop();
      stackB.pop();

      return result;
    }

    /**
     * The base implementation of `_.isMatch` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Object} object The object to inspect.
     * @param {Array} matchData The propery names, values, and compare flags to match.
     * @param {Function} [customizer] The function to customize comparing objects.
     * @returns {boolean} Returns `true` if `object` is a match, else `false`.
     */
    function baseIsMatch(object, matchData, customizer) {
      var index = matchData.length,
          length = index,
          noCustomizer = !customizer;

      if (object == null) {
        return !length;
      }
      object = toObject(object);
      while (index--) {
        var data = matchData[index];
        if ((noCustomizer && data[2])
              ? data[1] !== object[data[0]]
              : !(data[0] in object)
            ) {
          return false;
        }
      }
      while (++index < length) {
        data = matchData[index];
        var key = data[0],
            objValue = object[key],
            srcValue = data[1];

        if (noCustomizer && data[2]) {
          if (objValue === undefined && !(key in object)) {
            return false;
          }
        } else {
          var result = customizer ? customizer(objValue, srcValue, key) : undefined;
          if (!(result === undefined ? baseIsEqual(srcValue, objValue, customizer, true) : result)) {
            return false;
          }
        }
      }
      return true;
    }

    /**
     * The base implementation of `_.map` without support for callback shorthands
     * and `this` binding.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns the new mapped array.
     */
    function baseMap(collection, iteratee) {
      var index = -1,
          result = isArrayLike(collection) ? Array(collection.length) : [];

      baseEach(collection, function(value, key, collection) {
        result[++index] = iteratee(value, key, collection);
      });
      return result;
    }

    /**
     * The base implementation of `_.matches` which does not clone `source`.
     *
     * @private
     * @param {Object} source The object of property values to match.
     * @returns {Function} Returns the new function.
     */
    function baseMatches(source) {
      var matchData = getMatchData(source);
      if (matchData.length == 1 && matchData[0][2]) {
        var key = matchData[0][0],
            value = matchData[0][1];

        return function(object) {
          if (object == null) {
            return false;
          }
          return object[key] === value && (value !== undefined || (key in toObject(object)));
        };
      }
      return function(object) {
        return baseIsMatch(object, matchData);
      };
    }

    /**
     * The base implementation of `_.matchesProperty` which does not clone `srcValue`.
     *
     * @private
     * @param {string} path The path of the property to get.
     * @param {*} srcValue The value to compare.
     * @returns {Function} Returns the new function.
     */
    function baseMatchesProperty(path, srcValue) {
      var isArr = isArray(path),
          isCommon = isKey(path) && isStrictComparable(srcValue),
          pathKey = (path + '');

      path = toPath(path);
      return function(object) {
        if (object == null) {
          return false;
        }
        var key = pathKey;
        object = toObject(object);
        if ((isArr || !isCommon) && !(key in object)) {
          object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
          if (object == null) {
            return false;
          }
          key = last(path);
          object = toObject(object);
        }
        return object[key] === srcValue
          ? (srcValue !== undefined || (key in object))
          : baseIsEqual(srcValue, object[key], undefined, true);
      };
    }

    /**
     * The base implementation of `_.merge` without support for argument juggling,
     * multiple sources, and `this` binding `customizer` functions.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {Function} [customizer] The function to customize merged values.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates values with source counterparts.
     * @returns {Object} Returns `object`.
     */
    function baseMerge(object, source, customizer, stackA, stackB) {
      if (!isObject(object)) {
        return object;
      }
      var isSrcArr = isArrayLike(source) && (isArray(source) || isTypedArray(source)),
          props = isSrcArr ? undefined : keys(source);

      arrayEach(props || source, function(srcValue, key) {
        if (props) {
          key = srcValue;
          srcValue = source[key];
        }
        if (isObjectLike(srcValue)) {
          stackA || (stackA = []);
          stackB || (stackB = []);
          baseMergeDeep(object, source, key, baseMerge, customizer, stackA, stackB);
        }
        else {
          var value = object[key],
              result = customizer ? customizer(value, srcValue, key, object, source) : undefined,
              isCommon = result === undefined;

          if (isCommon) {
            result = srcValue;
          }
          if ((result !== undefined || (isSrcArr && !(key in object))) &&
              (isCommon || (result === result ? (result !== value) : (value === value)))) {
            object[key] = result;
          }
        }
      });
      return object;
    }

    /**
     * A specialized version of `baseMerge` for arrays and objects which performs
     * deep merges and tracks traversed objects enabling objects with circular
     * references to be merged.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {string} key The key of the value to merge.
     * @param {Function} mergeFunc The function to merge values.
     * @param {Function} [customizer] The function to customize merged values.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates values with source counterparts.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function baseMergeDeep(object, source, key, mergeFunc, customizer, stackA, stackB) {
      var length = stackA.length,
          srcValue = source[key];

      while (length--) {
        if (stackA[length] == srcValue) {
          object[key] = stackB[length];
          return;
        }
      }
      var value = object[key],
          result = customizer ? customizer(value, srcValue, key, object, source) : undefined,
          isCommon = result === undefined;

      if (isCommon) {
        result = srcValue;
        if (isArrayLike(srcValue) && (isArray(srcValue) || isTypedArray(srcValue))) {
          result = isArray(value)
            ? value
            : (isArrayLike(value) ? arrayCopy(value) : []);
        }
        else if (isPlainObject(srcValue) || isArguments(srcValue)) {
          result = isArguments(value)
            ? toPlainObject(value)
            : (isPlainObject(value) ? value : {});
        }
        else {
          isCommon = false;
        }
      }
      // Add the source value to the stack of traversed objects and associate
      // it with its merged value.
      stackA.push(srcValue);
      stackB.push(result);

      if (isCommon) {
        // Recursively merge objects and arrays (susceptible to call stack limits).
        object[key] = mergeFunc(result, srcValue, customizer, stackA, stackB);
      } else if (result === result ? (result !== value) : (value === value)) {
        object[key] = result;
      }
    }

    /**
     * The base implementation of `_.property` without support for deep paths.
     *
     * @private
     * @param {string} key The key of the property to get.
     * @returns {Function} Returns the new function.
     */
    function baseProperty(key) {
      return function(object) {
        return object == null ? undefined : object[key];
      };
    }

    /**
     * A specialized version of `baseProperty` which supports deep paths.
     *
     * @private
     * @param {Array|string} path The path of the property to get.
     * @returns {Function} Returns the new function.
     */
    function basePropertyDeep(path) {
      var pathKey = (path + '');
      path = toPath(path);
      return function(object) {
        return baseGet(object, path, pathKey);
      };
    }

    /**
     * The base implementation of `_.pullAt` without support for individual
     * index arguments and capturing the removed elements.
     *
     * @private
     * @param {Array} array The array to modify.
     * @param {number[]} indexes The indexes of elements to remove.
     * @returns {Array} Returns `array`.
     */
    function basePullAt(array, indexes) {
      var length = array ? indexes.length : 0;
      while (length--) {
        var index = indexes[length];
        if (index != previous && isIndex(index)) {
          var previous = index;
          splice.call(array, index, 1);
        }
      }
      return array;
    }

    /**
     * The base implementation of `_.random` without support for argument juggling
     * and returning floating-point numbers.
     *
     * @private
     * @param {number} min The minimum possible value.
     * @param {number} max The maximum possible value.
     * @returns {number} Returns the random number.
     */
    function baseRandom(min, max) {
      return min + nativeFloor(nativeRandom() * (max - min + 1));
    }

    /**
     * The base implementation of `_.reduce` and `_.reduceRight` without support
     * for callback shorthands and `this` binding, which iterates over `collection`
     * using the provided `eachFunc`.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {*} accumulator The initial value.
     * @param {boolean} initFromCollection Specify using the first or last element
     *  of `collection` as the initial value.
     * @param {Function} eachFunc The function to iterate over `collection`.
     * @returns {*} Returns the accumulated value.
     */
    function baseReduce(collection, iteratee, accumulator, initFromCollection, eachFunc) {
      eachFunc(collection, function(value, index, collection) {
        accumulator = initFromCollection
          ? (initFromCollection = false, value)
          : iteratee(accumulator, value, index, collection);
      });
      return accumulator;
    }

    /**
     * The base implementation of `setData` without support for hot loop detection.
     *
     * @private
     * @param {Function} func The function to associate metadata with.
     * @param {*} data The metadata.
     * @returns {Function} Returns `func`.
     */
    var baseSetData = !metaMap ? identity : function(func, data) {
      metaMap.set(func, data);
      return func;
    };

    /**
     * The base implementation of `_.slice` without an iteratee call guard.
     *
     * @private
     * @param {Array} array The array to slice.
     * @param {number} [start=0] The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns the slice of `array`.
     */
    function baseSlice(array, start, end) {
      var index = -1,
          length = array.length;

      start = start == null ? 0 : (+start || 0);
      if (start < 0) {
        start = -start > length ? 0 : (length + start);
      }
      end = (end === undefined || end > length) ? length : (+end || 0);
      if (end < 0) {
        end += length;
      }
      length = start > end ? 0 : ((end - start) >>> 0);
      start >>>= 0;

      var result = Array(length);
      while (++index < length) {
        result[index] = array[index + start];
      }
      return result;
    }

    /**
     * The base implementation of `_.some` without support for callback shorthands
     * and `this` binding.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {boolean} Returns `true` if any element passes the predicate check,
     *  else `false`.
     */
    function baseSome(collection, predicate) {
      var result;

      baseEach(collection, function(value, index, collection) {
        result = predicate(value, index, collection);
        return !result;
      });
      return !!result;
    }

    /**
     * The base implementation of `_.sortBy` which uses `comparer` to define
     * the sort order of `array` and replaces criteria objects with their
     * corresponding values.
     *
     * @private
     * @param {Array} array The array to sort.
     * @param {Function} comparer The function to define sort order.
     * @returns {Array} Returns `array`.
     */
    function baseSortBy(array, comparer) {
      var length = array.length;

      array.sort(comparer);
      while (length--) {
        array[length] = array[length].value;
      }
      return array;
    }

    /**
     * The base implementation of `_.sortByOrder` without param guards.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function[]|Object[]|string[]} iteratees The iteratees to sort by.
     * @param {boolean[]} orders The sort orders of `iteratees`.
     * @returns {Array} Returns the new sorted array.
     */
    function baseSortByOrder(collection, iteratees, orders) {
      var callback = getCallback(),
          index = -1;

      iteratees = arrayMap(iteratees, function(iteratee) { return callback(iteratee); });

      var result = baseMap(collection, function(value) {
        var criteria = arrayMap(iteratees, function(iteratee) { return iteratee(value); });
        return { 'criteria': criteria, 'index': ++index, 'value': value };
      });

      return baseSortBy(result, function(object, other) {
        return compareMultiple(object, other, orders);
      });
    }

    /**
     * The base implementation of `_.sum` without support for callback shorthands
     * and `this` binding.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {number} Returns the sum.
     */
    function baseSum(collection, iteratee) {
      var result = 0;
      baseEach(collection, function(value, index, collection) {
        result += +iteratee(value, index, collection) || 0;
      });
      return result;
    }

    /**
     * The base implementation of `_.uniq` without support for callback shorthands
     * and `this` binding.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {Function} [iteratee] The function invoked per iteration.
     * @returns {Array} Returns the new duplicate-value-free array.
     */
    function baseUniq(array, iteratee) {
      var index = -1,
          indexOf = getIndexOf(),
          length = array.length,
          isCommon = indexOf == baseIndexOf,
          isLarge = isCommon && length >= LARGE_ARRAY_SIZE,
          seen = isLarge ? createCache() : null,
          result = [];

      if (seen) {
        indexOf = cacheIndexOf;
        isCommon = false;
      } else {
        isLarge = false;
        seen = iteratee ? [] : result;
      }
      outer:
      while (++index < length) {
        var value = array[index],
            computed = iteratee ? iteratee(value, index, array) : value;

        if (isCommon && value === value) {
          var seenIndex = seen.length;
          while (seenIndex--) {
            if (seen[seenIndex] === computed) {
              continue outer;
            }
          }
          if (iteratee) {
            seen.push(computed);
          }
          result.push(value);
        }
        else if (indexOf(seen, computed, 0) < 0) {
          if (iteratee || isLarge) {
            seen.push(computed);
          }
          result.push(value);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.values` and `_.valuesIn` which creates an
     * array of `object` property values corresponding to the property names
     * of `props`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array} props The property names to get values for.
     * @returns {Object} Returns the array of property values.
     */
    function baseValues(object, props) {
      var index = -1,
          length = props.length,
          result = Array(length);

      while (++index < length) {
        result[index] = object[props[index]];
      }
      return result;
    }

    /**
     * The base implementation of `_.dropRightWhile`, `_.dropWhile`, `_.takeRightWhile`,
     * and `_.takeWhile` without support for callback shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to query.
     * @param {Function} predicate The function invoked per iteration.
     * @param {boolean} [isDrop] Specify dropping elements instead of taking them.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Array} Returns the slice of `array`.
     */
    function baseWhile(array, predicate, isDrop, fromRight) {
      var length = array.length,
          index = fromRight ? length : -1;

      while ((fromRight ? index-- : ++index < length) && predicate(array[index], index, array)) {}
      return isDrop
        ? baseSlice(array, (fromRight ? 0 : index), (fromRight ? index + 1 : length))
        : baseSlice(array, (fromRight ? index + 1 : 0), (fromRight ? length : index));
    }

    /**
     * The base implementation of `wrapperValue` which returns the result of
     * performing a sequence of actions on the unwrapped `value`, where each
     * successive action is supplied the return value of the previous.
     *
     * @private
     * @param {*} value The unwrapped value.
     * @param {Array} actions Actions to peform to resolve the unwrapped value.
     * @returns {*} Returns the resolved value.
     */
    function baseWrapperValue(value, actions) {
      var result = value;
      if (result instanceof LazyWrapper) {
        result = result.value();
      }
      var index = -1,
          length = actions.length;

      while (++index < length) {
        var action = actions[index];
        result = action.func.apply(action.thisArg, arrayPush([result], action.args));
      }
      return result;
    }

    /**
     * Performs a binary search of `array` to determine the index at which `value`
     * should be inserted into `array` in order to maintain its sort order.
     *
     * @private
     * @param {Array} array The sorted array to inspect.
     * @param {*} value The value to evaluate.
     * @param {boolean} [retHighest] Specify returning the highest qualified index.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     */
    function binaryIndex(array, value, retHighest) {
      var low = 0,
          high = array ? array.length : low;

      if (typeof value == 'number' && value === value && high <= HALF_MAX_ARRAY_LENGTH) {
        while (low < high) {
          var mid = (low + high) >>> 1,
              computed = array[mid];

          if ((retHighest ? (computed <= value) : (computed < value)) && computed !== null) {
            low = mid + 1;
          } else {
            high = mid;
          }
        }
        return high;
      }
      return binaryIndexBy(array, value, identity, retHighest);
    }

    /**
     * This function is like `binaryIndex` except that it invokes `iteratee` for
     * `value` and each element of `array` to compute their sort ranking. The
     * iteratee is invoked with one argument; (value).
     *
     * @private
     * @param {Array} array The sorted array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {boolean} [retHighest] Specify returning the highest qualified index.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     */
    function binaryIndexBy(array, value, iteratee, retHighest) {
      value = iteratee(value);

      var low = 0,
          high = array ? array.length : 0,
          valIsNaN = value !== value,
          valIsNull = value === null,
          valIsUndef = value === undefined;

      while (low < high) {
        var mid = nativeFloor((low + high) / 2),
            computed = iteratee(array[mid]),
            isDef = computed !== undefined,
            isReflexive = computed === computed;

        if (valIsNaN) {
          var setLow = isReflexive || retHighest;
        } else if (valIsNull) {
          setLow = isReflexive && isDef && (retHighest || computed != null);
        } else if (valIsUndef) {
          setLow = isReflexive && (retHighest || isDef);
        } else if (computed == null) {
          setLow = false;
        } else {
          setLow = retHighest ? (computed <= value) : (computed < value);
        }
        if (setLow) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }
      return nativeMin(high, MAX_ARRAY_INDEX);
    }

    /**
     * A specialized version of `baseCallback` which only supports `this` binding
     * and specifying the number of arguments to provide to `func`.
     *
     * @private
     * @param {Function} func The function to bind.
     * @param {*} thisArg The `this` binding of `func`.
     * @param {number} [argCount] The number of arguments to provide to `func`.
     * @returns {Function} Returns the callback.
     */
    function bindCallback(func, thisArg, argCount) {
      if (typeof func != 'function') {
        return identity;
      }
      if (thisArg === undefined) {
        return func;
      }
      switch (argCount) {
        case 1: return function(value) {
          return func.call(thisArg, value);
        };
        case 3: return function(value, index, collection) {
          return func.call(thisArg, value, index, collection);
        };
        case 4: return function(accumulator, value, index, collection) {
          return func.call(thisArg, accumulator, value, index, collection);
        };
        case 5: return function(value, other, key, object, source) {
          return func.call(thisArg, value, other, key, object, source);
        };
      }
      return function() {
        return func.apply(thisArg, arguments);
      };
    }

    /**
     * Creates a clone of the given array buffer.
     *
     * @private
     * @param {ArrayBuffer} buffer The array buffer to clone.
     * @returns {ArrayBuffer} Returns the cloned array buffer.
     */
    function bufferClone(buffer) {
      var result = new ArrayBuffer(buffer.byteLength),
          view = new Uint8Array(result);

      view.set(new Uint8Array(buffer));
      return result;
    }

    /**
     * Creates an array that is the composition of partially applied arguments,
     * placeholders, and provided arguments into a single array of arguments.
     *
     * @private
     * @param {Array|Object} args The provided arguments.
     * @param {Array} partials The arguments to prepend to those provided.
     * @param {Array} holders The `partials` placeholder indexes.
     * @returns {Array} Returns the new array of composed arguments.
     */
    function composeArgs(args, partials, holders) {
      var holdersLength = holders.length,
          argsIndex = -1,
          argsLength = nativeMax(args.length - holdersLength, 0),
          leftIndex = -1,
          leftLength = partials.length,
          result = Array(leftLength + argsLength);

      while (++leftIndex < leftLength) {
        result[leftIndex] = partials[leftIndex];
      }
      while (++argsIndex < holdersLength) {
        result[holders[argsIndex]] = args[argsIndex];
      }
      while (argsLength--) {
        result[leftIndex++] = args[argsIndex++];
      }
      return result;
    }

    /**
     * This function is like `composeArgs` except that the arguments composition
     * is tailored for `_.partialRight`.
     *
     * @private
     * @param {Array|Object} args The provided arguments.
     * @param {Array} partials The arguments to append to those provided.
     * @param {Array} holders The `partials` placeholder indexes.
     * @returns {Array} Returns the new array of composed arguments.
     */
    function composeArgsRight(args, partials, holders) {
      var holdersIndex = -1,
          holdersLength = holders.length,
          argsIndex = -1,
          argsLength = nativeMax(args.length - holdersLength, 0),
          rightIndex = -1,
          rightLength = partials.length,
          result = Array(argsLength + rightLength);

      while (++argsIndex < argsLength) {
        result[argsIndex] = args[argsIndex];
      }
      var offset = argsIndex;
      while (++rightIndex < rightLength) {
        result[offset + rightIndex] = partials[rightIndex];
      }
      while (++holdersIndex < holdersLength) {
        result[offset + holders[holdersIndex]] = args[argsIndex++];
      }
      return result;
    }

    /**
     * Creates a `_.countBy`, `_.groupBy`, `_.indexBy`, or `_.partition` function.
     *
     * @private
     * @param {Function} setter The function to set keys and values of the accumulator object.
     * @param {Function} [initializer] The function to initialize the accumulator object.
     * @returns {Function} Returns the new aggregator function.
     */
    function createAggregator(setter, initializer) {
      return function(collection, iteratee, thisArg) {
        var result = initializer ? initializer() : {};
        iteratee = getCallback(iteratee, thisArg, 3);

        if (isArray(collection)) {
          var index = -1,
              length = collection.length;

          while (++index < length) {
            var value = collection[index];
            setter(result, value, iteratee(value, index, collection), collection);
          }
        } else {
          baseEach(collection, function(value, key, collection) {
            setter(result, value, iteratee(value, key, collection), collection);
          });
        }
        return result;
      };
    }

    /**
     * Creates a `_.assign`, `_.defaults`, or `_.merge` function.
     *
     * @private
     * @param {Function} assigner The function to assign values.
     * @returns {Function} Returns the new assigner function.
     */
    function createAssigner(assigner) {
      return restParam(function(object, sources) {
        var index = -1,
            length = object == null ? 0 : sources.length,
            customizer = length > 2 ? sources[length - 2] : undefined,
            guard = length > 2 ? sources[2] : undefined,
            thisArg = length > 1 ? sources[length - 1] : undefined;

        if (typeof customizer == 'function') {
          customizer = bindCallback(customizer, thisArg, 5);
          length -= 2;
        } else {
          customizer = typeof thisArg == 'function' ? thisArg : undefined;
          length -= (customizer ? 1 : 0);
        }
        if (guard && isIterateeCall(sources[0], sources[1], guard)) {
          customizer = length < 3 ? undefined : customizer;
          length = 1;
        }
        while (++index < length) {
          var source = sources[index];
          if (source) {
            assigner(object, source, customizer);
          }
        }
        return object;
      });
    }

    /**
     * Creates a `baseEach` or `baseEachRight` function.
     *
     * @private
     * @param {Function} eachFunc The function to iterate over a collection.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new base function.
     */
    function createBaseEach(eachFunc, fromRight) {
      return function(collection, iteratee) {
        var length = collection ? getLength(collection) : 0;
        if (!isLength(length)) {
          return eachFunc(collection, iteratee);
        }
        var index = fromRight ? length : -1,
            iterable = toObject(collection);

        while ((fromRight ? index-- : ++index < length)) {
          if (iteratee(iterable[index], index, iterable) === false) {
            break;
          }
        }
        return collection;
      };
    }

    /**
     * Creates a base function for `_.forIn` or `_.forInRight`.
     *
     * @private
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new base function.
     */
    function createBaseFor(fromRight) {
      return function(object, iteratee, keysFunc) {
        var iterable = toObject(object),
            props = keysFunc(object),
            length = props.length,
            index = fromRight ? length : -1;

        while ((fromRight ? index-- : ++index < length)) {
          var key = props[index];
          if (iteratee(iterable[key], key, iterable) === false) {
            break;
          }
        }
        return object;
      };
    }

    /**
     * Creates a function that wraps `func` and invokes it with the `this`
     * binding of `thisArg`.
     *
     * @private
     * @param {Function} func The function to bind.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @returns {Function} Returns the new bound function.
     */
    function createBindWrapper(func, thisArg) {
      var Ctor = createCtorWrapper(func);

      function wrapper() {
        var fn = (this && this !== root && this instanceof wrapper) ? Ctor : func;
        return fn.apply(thisArg, arguments);
      }
      return wrapper;
    }

    /**
     * Creates a `Set` cache object to optimize linear searches of large arrays.
     *
     * @private
     * @param {Array} [values] The values to cache.
     * @returns {null|Object} Returns the new cache object if `Set` is supported, else `null`.
     */
    function createCache(values) {
      return (nativeCreate && Set) ? new SetCache(values) : null;
    }

    /**
     * Creates a function that produces compound words out of the words in a
     * given string.
     *
     * @private
     * @param {Function} callback The function to combine each word.
     * @returns {Function} Returns the new compounder function.
     */
    function createCompounder(callback) {
      return function(string) {
        var index = -1,
            array = words(deburr(string)),
            length = array.length,
            result = '';

        while (++index < length) {
          result = callback(result, array[index], index);
        }
        return result;
      };
    }

    /**
     * Creates a function that produces an instance of `Ctor` regardless of
     * whether it was invoked as part of a `new` expression or by `call` or `apply`.
     *
     * @private
     * @param {Function} Ctor The constructor to wrap.
     * @returns {Function} Returns the new wrapped function.
     */
    function createCtorWrapper(Ctor) {
      return function() {
        // Use a `switch` statement to work with class constructors.
        // See http://ecma-international.org/ecma-262/6.0/#sec-ecmascript-function-objects-call-thisargument-argumentslist
        // for more details.
        var args = arguments;
        switch (args.length) {
          case 0: return new Ctor;
          case 1: return new Ctor(args[0]);
          case 2: return new Ctor(args[0], args[1]);
          case 3: return new Ctor(args[0], args[1], args[2]);
          case 4: return new Ctor(args[0], args[1], args[2], args[3]);
          case 5: return new Ctor(args[0], args[1], args[2], args[3], args[4]);
          case 6: return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5]);
          case 7: return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
        }
        var thisBinding = baseCreate(Ctor.prototype),
            result = Ctor.apply(thisBinding, args);

        // Mimic the constructor's `return` behavior.
        // See https://es5.github.io/#x13.2.2 for more details.
        return isObject(result) ? result : thisBinding;
      };
    }

    /**
     * Creates a `_.curry` or `_.curryRight` function.
     *
     * @private
     * @param {boolean} flag The curry bit flag.
     * @returns {Function} Returns the new curry function.
     */
    function createCurry(flag) {
      function curryFunc(func, arity, guard) {
        if (guard && isIterateeCall(func, arity, guard)) {
          arity = undefined;
        }
        var result = createWrapper(func, flag, undefined, undefined, undefined, undefined, undefined, arity);
        result.placeholder = curryFunc.placeholder;
        return result;
      }
      return curryFunc;
    }

    /**
     * Creates a `_.defaults` or `_.defaultsDeep` function.
     *
     * @private
     * @param {Function} assigner The function to assign values.
     * @param {Function} customizer The function to customize assigned values.
     * @returns {Function} Returns the new defaults function.
     */
    function createDefaults(assigner, customizer) {
      return restParam(function(args) {
        var object = args[0];
        if (object == null) {
          return object;
        }
        args.push(customizer);
        return assigner.apply(undefined, args);
      });
    }

    /**
     * Creates a `_.max` or `_.min` function.
     *
     * @private
     * @param {Function} comparator The function used to compare values.
     * @param {*} exValue The initial extremum value.
     * @returns {Function} Returns the new extremum function.
     */
    function createExtremum(comparator, exValue) {
      return function(collection, iteratee, thisArg) {
        if (thisArg && isIterateeCall(collection, iteratee, thisArg)) {
          iteratee = undefined;
        }
        iteratee = getCallback(iteratee, thisArg, 3);
        if (iteratee.length == 1) {
          collection = isArray(collection) ? collection : toIterable(collection);
          var result = arrayExtremum(collection, iteratee, comparator, exValue);
          if (!(collection.length && result === exValue)) {
            return result;
          }
        }
        return baseExtremum(collection, iteratee, comparator, exValue);
      };
    }

    /**
     * Creates a `_.find` or `_.findLast` function.
     *
     * @private
     * @param {Function} eachFunc The function to iterate over a collection.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new find function.
     */
    function createFind(eachFunc, fromRight) {
      return function(collection, predicate, thisArg) {
        predicate = getCallback(predicate, thisArg, 3);
        if (isArray(collection)) {
          var index = baseFindIndex(collection, predicate, fromRight);
          return index > -1 ? collection[index] : undefined;
        }
        return baseFind(collection, predicate, eachFunc);
      };
    }

    /**
     * Creates a `_.findIndex` or `_.findLastIndex` function.
     *
     * @private
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new find function.
     */
    function createFindIndex(fromRight) {
      return function(array, predicate, thisArg) {
        if (!(array && array.length)) {
          return -1;
        }
        predicate = getCallback(predicate, thisArg, 3);
        return baseFindIndex(array, predicate, fromRight);
      };
    }

    /**
     * Creates a `_.findKey` or `_.findLastKey` function.
     *
     * @private
     * @param {Function} objectFunc The function to iterate over an object.
     * @returns {Function} Returns the new find function.
     */
    function createFindKey(objectFunc) {
      return function(object, predicate, thisArg) {
        predicate = getCallback(predicate, thisArg, 3);
        return baseFind(object, predicate, objectFunc, true);
      };
    }

    /**
     * Creates a `_.flow` or `_.flowRight` function.
     *
     * @private
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new flow function.
     */
    function createFlow(fromRight) {
      return function() {
        var wrapper,
            length = arguments.length,
            index = fromRight ? length : -1,
            leftIndex = 0,
            funcs = Array(length);

        while ((fromRight ? index-- : ++index < length)) {
          var func = funcs[leftIndex++] = arguments[index];
          if (typeof func != 'function') {
            throw new TypeError(FUNC_ERROR_TEXT);
          }
          if (!wrapper && LodashWrapper.prototype.thru && getFuncName(func) == 'wrapper') {
            wrapper = new LodashWrapper([], true);
          }
        }
        index = wrapper ? -1 : length;
        while (++index < length) {
          func = funcs[index];

          var funcName = getFuncName(func),
              data = funcName == 'wrapper' ? getData(func) : undefined;

          if (data && isLaziable(data[0]) && data[1] == (ARY_FLAG | CURRY_FLAG | PARTIAL_FLAG | REARG_FLAG) && !data[4].length && data[9] == 1) {
            wrapper = wrapper[getFuncName(data[0])].apply(wrapper, data[3]);
          } else {
            wrapper = (func.length == 1 && isLaziable(func)) ? wrapper[funcName]() : wrapper.thru(func);
          }
        }
        return function() {
          var args = arguments,
              value = args[0];

          if (wrapper && args.length == 1 && isArray(value) && value.length >= LARGE_ARRAY_SIZE) {
            return wrapper.plant(value).value();
          }
          var index = 0,
              result = length ? funcs[index].apply(this, args) : value;

          while (++index < length) {
            result = funcs[index].call(this, result);
          }
          return result;
        };
      };
    }

    /**
     * Creates a function for `_.forEach` or `_.forEachRight`.
     *
     * @private
     * @param {Function} arrayFunc The function to iterate over an array.
     * @param {Function} eachFunc The function to iterate over a collection.
     * @returns {Function} Returns the new each function.
     */
    function createForEach(arrayFunc, eachFunc) {
      return function(collection, iteratee, thisArg) {
        return (typeof iteratee == 'function' && thisArg === undefined && isArray(collection))
          ? arrayFunc(collection, iteratee)
          : eachFunc(collection, bindCallback(iteratee, thisArg, 3));
      };
    }

    /**
     * Creates a function for `_.forIn` or `_.forInRight`.
     *
     * @private
     * @param {Function} objectFunc The function to iterate over an object.
     * @returns {Function} Returns the new each function.
     */
    function createForIn(objectFunc) {
      return function(object, iteratee, thisArg) {
        if (typeof iteratee != 'function' || thisArg !== undefined) {
          iteratee = bindCallback(iteratee, thisArg, 3);
        }
        return objectFunc(object, iteratee, keysIn);
      };
    }

    /**
     * Creates a function for `_.forOwn` or `_.forOwnRight`.
     *
     * @private
     * @param {Function} objectFunc The function to iterate over an object.
     * @returns {Function} Returns the new each function.
     */
    function createForOwn(objectFunc) {
      return function(object, iteratee, thisArg) {
        if (typeof iteratee != 'function' || thisArg !== undefined) {
          iteratee = bindCallback(iteratee, thisArg, 3);
        }
        return objectFunc(object, iteratee);
      };
    }

    /**
     * Creates a function for `_.mapKeys` or `_.mapValues`.
     *
     * @private
     * @param {boolean} [isMapKeys] Specify mapping keys instead of values.
     * @returns {Function} Returns the new map function.
     */
    function createObjectMapper(isMapKeys) {
      return function(object, iteratee, thisArg) {
        var result = {};
        iteratee = getCallback(iteratee, thisArg, 3);

        baseForOwn(object, function(value, key, object) {
          var mapped = iteratee(value, key, object);
          key = isMapKeys ? mapped : key;
          value = isMapKeys ? value : mapped;
          result[key] = value;
        });
        return result;
      };
    }

    /**
     * Creates a function for `_.padLeft` or `_.padRight`.
     *
     * @private
     * @param {boolean} [fromRight] Specify padding from the right.
     * @returns {Function} Returns the new pad function.
     */
    function createPadDir(fromRight) {
      return function(string, length, chars) {
        string = baseToString(string);
        return (fromRight ? string : '') + createPadding(string, length, chars) + (fromRight ? '' : string);
      };
    }

    /**
     * Creates a `_.partial` or `_.partialRight` function.
     *
     * @private
     * @param {boolean} flag The partial bit flag.
     * @returns {Function} Returns the new partial function.
     */
    function createPartial(flag) {
      var partialFunc = restParam(function(func, partials) {
        var holders = replaceHolders(partials, partialFunc.placeholder);
        return createWrapper(func, flag, undefined, partials, holders);
      });
      return partialFunc;
    }

    /**
     * Creates a function for `_.reduce` or `_.reduceRight`.
     *
     * @private
     * @param {Function} arrayFunc The function to iterate over an array.
     * @param {Function} eachFunc The function to iterate over a collection.
     * @returns {Function} Returns the new each function.
     */
    function createReduce(arrayFunc, eachFunc) {
      return function(collection, iteratee, accumulator, thisArg) {
        var initFromArray = arguments.length < 3;
        return (typeof iteratee == 'function' && thisArg === undefined && isArray(collection))
          ? arrayFunc(collection, iteratee, accumulator, initFromArray)
          : baseReduce(collection, getCallback(iteratee, thisArg, 4), accumulator, initFromArray, eachFunc);
      };
    }

    /**
     * Creates a function that wraps `func` and invokes it with optional `this`
     * binding of, partial application, and currying.
     *
     * @private
     * @param {Function|string} func The function or method name to reference.
     * @param {number} bitmask The bitmask of flags. See `createWrapper` for more details.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {Array} [partials] The arguments to prepend to those provided to the new function.
     * @param {Array} [holders] The `partials` placeholder indexes.
     * @param {Array} [partialsRight] The arguments to append to those provided to the new function.
     * @param {Array} [holdersRight] The `partialsRight` placeholder indexes.
     * @param {Array} [argPos] The argument positions of the new function.
     * @param {number} [ary] The arity cap of `func`.
     * @param {number} [arity] The arity of `func`.
     * @returns {Function} Returns the new wrapped function.
     */
    function createHybridWrapper(func, bitmask, thisArg, partials, holders, partialsRight, holdersRight, argPos, ary, arity) {
      var isAry = bitmask & ARY_FLAG,
          isBind = bitmask & BIND_FLAG,
          isBindKey = bitmask & BIND_KEY_FLAG,
          isCurry = bitmask & CURRY_FLAG,
          isCurryBound = bitmask & CURRY_BOUND_FLAG,
          isCurryRight = bitmask & CURRY_RIGHT_FLAG,
          Ctor = isBindKey ? undefined : createCtorWrapper(func);

      function wrapper() {
        // Avoid `arguments` object use disqualifying optimizations by
        // converting it to an array before providing it to other functions.
        var length = arguments.length,
            index = length,
            args = Array(length);

        while (index--) {
          args[index] = arguments[index];
        }
        if (partials) {
          args = composeArgs(args, partials, holders);
        }
        if (partialsRight) {
          args = composeArgsRight(args, partialsRight, holdersRight);
        }
        if (isCurry || isCurryRight) {
          var placeholder = wrapper.placeholder,
              argsHolders = replaceHolders(args, placeholder);

          length -= argsHolders.length;
          if (length < arity) {
            var newArgPos = argPos ? arrayCopy(argPos) : undefined,
                newArity = nativeMax(arity - length, 0),
                newsHolders = isCurry ? argsHolders : undefined,
                newHoldersRight = isCurry ? undefined : argsHolders,
                newPartials = isCurry ? args : undefined,
                newPartialsRight = isCurry ? undefined : args;

            bitmask |= (isCurry ? PARTIAL_FLAG : PARTIAL_RIGHT_FLAG);
            bitmask &= ~(isCurry ? PARTIAL_RIGHT_FLAG : PARTIAL_FLAG);

            if (!isCurryBound) {
              bitmask &= ~(BIND_FLAG | BIND_KEY_FLAG);
            }
            var newData = [func, bitmask, thisArg, newPartials, newsHolders, newPartialsRight, newHoldersRight, newArgPos, ary, newArity],
                result = createHybridWrapper.apply(undefined, newData);

            if (isLaziable(func)) {
              setData(result, newData);
            }
            result.placeholder = placeholder;
            return result;
          }
        }
        var thisBinding = isBind ? thisArg : this,
            fn = isBindKey ? thisBinding[func] : func;

        if (argPos) {
          args = reorder(args, argPos);
        }
        if (isAry && ary < args.length) {
          args.length = ary;
        }
        if (this && this !== root && this instanceof wrapper) {
          fn = Ctor || createCtorWrapper(func);
        }
        return fn.apply(thisBinding, args);
      }
      return wrapper;
    }

    /**
     * Creates the padding required for `string` based on the given `length`.
     * The `chars` string is truncated if the number of characters exceeds `length`.
     *
     * @private
     * @param {string} string The string to create padding for.
     * @param {number} [length=0] The padding length.
     * @param {string} [chars=' '] The string used as padding.
     * @returns {string} Returns the pad for `string`.
     */
    function createPadding(string, length, chars) {
      var strLength = string.length;
      length = +length;

      if (strLength >= length || !nativeIsFinite(length)) {
        return '';
      }
      var padLength = length - strLength;
      chars = chars == null ? ' ' : (chars + '');
      return repeat(chars, nativeCeil(padLength / chars.length)).slice(0, padLength);
    }

    /**
     * Creates a function that wraps `func` and invokes it with the optional `this`
     * binding of `thisArg` and the `partials` prepended to those provided to
     * the wrapper.
     *
     * @private
     * @param {Function} func The function to partially apply arguments to.
     * @param {number} bitmask The bitmask of flags. See `createWrapper` for more details.
     * @param {*} thisArg The `this` binding of `func`.
     * @param {Array} partials The arguments to prepend to those provided to the new function.
     * @returns {Function} Returns the new bound function.
     */
    function createPartialWrapper(func, bitmask, thisArg, partials) {
      var isBind = bitmask & BIND_FLAG,
          Ctor = createCtorWrapper(func);

      function wrapper() {
        // Avoid `arguments` object use disqualifying optimizations by
        // converting it to an array before providing it `func`.
        var argsIndex = -1,
            argsLength = arguments.length,
            leftIndex = -1,
            leftLength = partials.length,
            args = Array(leftLength + argsLength);

        while (++leftIndex < leftLength) {
          args[leftIndex] = partials[leftIndex];
        }
        while (argsLength--) {
          args[leftIndex++] = arguments[++argsIndex];
        }
        var fn = (this && this !== root && this instanceof wrapper) ? Ctor : func;
        return fn.apply(isBind ? thisArg : this, args);
      }
      return wrapper;
    }

    /**
     * Creates a `_.ceil`, `_.floor`, or `_.round` function.
     *
     * @private
     * @param {string} methodName The name of the `Math` method to use when rounding.
     * @returns {Function} Returns the new round function.
     */
    function createRound(methodName) {
      var func = Math[methodName];
      return function(number, precision) {
        precision = precision === undefined ? 0 : (+precision || 0);
        if (precision) {
          precision = pow(10, precision);
          return func(number * precision) / precision;
        }
        return func(number);
      };
    }

    /**
     * Creates a `_.sortedIndex` or `_.sortedLastIndex` function.
     *
     * @private
     * @param {boolean} [retHighest] Specify returning the highest qualified index.
     * @returns {Function} Returns the new index function.
     */
    function createSortedIndex(retHighest) {
      return function(array, value, iteratee, thisArg) {
        var callback = getCallback(iteratee);
        return (iteratee == null && callback === baseCallback)
          ? binaryIndex(array, value, retHighest)
          : binaryIndexBy(array, value, callback(iteratee, thisArg, 1), retHighest);
      };
    }

    /**
     * Creates a function that either curries or invokes `func` with optional
     * `this` binding and partially applied arguments.
     *
     * @private
     * @param {Function|string} func The function or method name to reference.
     * @param {number} bitmask The bitmask of flags.
     *  The bitmask may be composed of the following flags:
     *     1 - `_.bind`
     *     2 - `_.bindKey`
     *     4 - `_.curry` or `_.curryRight` of a bound function
     *     8 - `_.curry`
     *    16 - `_.curryRight`
     *    32 - `_.partial`
     *    64 - `_.partialRight`
     *   128 - `_.rearg`
     *   256 - `_.ary`
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {Array} [partials] The arguments to be partially applied.
     * @param {Array} [holders] The `partials` placeholder indexes.
     * @param {Array} [argPos] The argument positions of the new function.
     * @param {number} [ary] The arity cap of `func`.
     * @param {number} [arity] The arity of `func`.
     * @returns {Function} Returns the new wrapped function.
     */
    function createWrapper(func, bitmask, thisArg, partials, holders, argPos, ary, arity) {
      var isBindKey = bitmask & BIND_KEY_FLAG;
      if (!isBindKey && typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      var length = partials ? partials.length : 0;
      if (!length) {
        bitmask &= ~(PARTIAL_FLAG | PARTIAL_RIGHT_FLAG);
        partials = holders = undefined;
      }
      length -= (holders ? holders.length : 0);
      if (bitmask & PARTIAL_RIGHT_FLAG) {
        var partialsRight = partials,
            holdersRight = holders;

        partials = holders = undefined;
      }
      var data = isBindKey ? undefined : getData(func),
          newData = [func, bitmask, thisArg, partials, holders, partialsRight, holdersRight, argPos, ary, arity];

      if (data) {
        mergeData(newData, data);
        bitmask = newData[1];
        arity = newData[9];
      }
      newData[9] = arity == null
        ? (isBindKey ? 0 : func.length)
        : (nativeMax(arity - length, 0) || 0);

      if (bitmask == BIND_FLAG) {
        var result = createBindWrapper(newData[0], newData[2]);
      } else if ((bitmask == PARTIAL_FLAG || bitmask == (BIND_FLAG | PARTIAL_FLAG)) && !newData[4].length) {
        result = createPartialWrapper.apply(undefined, newData);
      } else {
        result = createHybridWrapper.apply(undefined, newData);
      }
      var setter = data ? baseSetData : setData;
      return setter(result, newData);
    }

    /**
     * A specialized version of `baseIsEqualDeep` for arrays with support for
     * partial deep comparisons.
     *
     * @private
     * @param {Array} array The array to compare.
     * @param {Array} other The other array to compare.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Function} [customizer] The function to customize comparing arrays.
     * @param {boolean} [isLoose] Specify performing partial comparisons.
     * @param {Array} [stackA] Tracks traversed `value` objects.
     * @param {Array} [stackB] Tracks traversed `other` objects.
     * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
     */
    function equalArrays(array, other, equalFunc, customizer, isLoose, stackA, stackB) {
      var index = -1,
          arrLength = array.length,
          othLength = other.length;

      if (arrLength != othLength && !(isLoose && othLength > arrLength)) {
        return false;
      }
      // Ignore non-index properties.
      while (++index < arrLength) {
        var arrValue = array[index],
            othValue = other[index],
            result = customizer ? customizer(isLoose ? othValue : arrValue, isLoose ? arrValue : othValue, index) : undefined;

        if (result !== undefined) {
          if (result) {
            continue;
          }
          return false;
        }
        // Recursively compare arrays (susceptible to call stack limits).
        if (isLoose) {
          if (!arraySome(other, function(othValue) {
                return arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB);
              })) {
            return false;
          }
        } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB))) {
          return false;
        }
      }
      return true;
    }

    /**
     * A specialized version of `baseIsEqualDeep` for comparing objects of
     * the same `toStringTag`.
     *
     * **Note:** This function only supports comparing values with tags of
     * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {string} tag The `toStringTag` of the objects to compare.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function equalByTag(object, other, tag) {
      switch (tag) {
        case boolTag:
        case dateTag:
          // Coerce dates and booleans to numbers, dates to milliseconds and booleans
          // to `1` or `0` treating invalid dates coerced to `NaN` as not equal.
          return +object == +other;

        case errorTag:
          return object.name == other.name && object.message == other.message;

        case numberTag:
          // Treat `NaN` vs. `NaN` as equal.
          return (object != +object)
            ? other != +other
            : object == +other;

        case regexpTag:
        case stringTag:
          // Coerce regexes to strings and treat strings primitives and string
          // objects as equal. See https://es5.github.io/#x15.10.6.4 for more details.
          return object == (other + '');
      }
      return false;
    }

    /**
     * A specialized version of `baseIsEqualDeep` for objects with support for
     * partial deep comparisons.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Function} [customizer] The function to customize comparing values.
     * @param {boolean} [isLoose] Specify performing partial comparisons.
     * @param {Array} [stackA] Tracks traversed `value` objects.
     * @param {Array} [stackB] Tracks traversed `other` objects.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function equalObjects(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
      var objProps = keys(object),
          objLength = objProps.length,
          othProps = keys(other),
          othLength = othProps.length;

      if (objLength != othLength && !isLoose) {
        return false;
      }
      var index = objLength;
      while (index--) {
        var key = objProps[index];
        if (!(isLoose ? key in other : hasOwnProperty.call(other, key))) {
          return false;
        }
      }
      var skipCtor = isLoose;
      while (++index < objLength) {
        key = objProps[index];
        var objValue = object[key],
            othValue = other[key],
            result = customizer ? customizer(isLoose ? othValue : objValue, isLoose? objValue : othValue, key) : undefined;

        // Recursively compare objects (susceptible to call stack limits).
        if (!(result === undefined ? equalFunc(objValue, othValue, customizer, isLoose, stackA, stackB) : result)) {
          return false;
        }
        skipCtor || (skipCtor = key == 'constructor');
      }
      if (!skipCtor) {
        var objCtor = object.constructor,
            othCtor = other.constructor;

        // Non `Object` object instances with different constructors are not equal.
        if (objCtor != othCtor &&
            ('constructor' in object && 'constructor' in other) &&
            !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
              typeof othCtor == 'function' && othCtor instanceof othCtor)) {
          return false;
        }
      }
      return true;
    }

    /**
     * Gets the appropriate "callback" function. If the `_.callback` method is
     * customized this function returns the custom method, otherwise it returns
     * the `baseCallback` function. If arguments are provided the chosen function
     * is invoked with them and its result is returned.
     *
     * @private
     * @returns {Function} Returns the chosen function or its result.
     */
    function getCallback(func, thisArg, argCount) {
      var result = lodash.callback || callback;
      result = result === callback ? baseCallback : result;
      return argCount ? result(func, thisArg, argCount) : result;
    }

    /**
     * Gets metadata for `func`.
     *
     * @private
     * @param {Function} func The function to query.
     * @returns {*} Returns the metadata for `func`.
     */
    var getData = !metaMap ? noop : function(func) {
      return metaMap.get(func);
    };

    /**
     * Gets the name of `func`.
     *
     * @private
     * @param {Function} func The function to query.
     * @returns {string} Returns the function name.
     */
    function getFuncName(func) {
      var result = func.name,
          array = realNames[result],
          length = array ? array.length : 0;

      while (length--) {
        var data = array[length],
            otherFunc = data.func;
        if (otherFunc == null || otherFunc == func) {
          return data.name;
        }
      }
      return result;
    }

    /**
     * Gets the appropriate "indexOf" function. If the `_.indexOf` method is
     * customized this function returns the custom method, otherwise it returns
     * the `baseIndexOf` function. If arguments are provided the chosen function
     * is invoked with them and its result is returned.
     *
     * @private
     * @returns {Function|number} Returns the chosen function or its result.
     */
    function getIndexOf(collection, target, fromIndex) {
      var result = lodash.indexOf || indexOf;
      result = result === indexOf ? baseIndexOf : result;
      return collection ? result(collection, target, fromIndex) : result;
    }

    /**
     * Gets the "length" property value of `object`.
     *
     * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
     * that affects Safari on at least iOS 8.1-8.3 ARM64.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {*} Returns the "length" value.
     */
    var getLength = baseProperty('length');

    /**
     * Gets the propery names, values, and compare flags of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the match data of `object`.
     */
    function getMatchData(object) {
      var result = pairs(object),
          length = result.length;

      while (length--) {
        result[length][2] = isStrictComparable(result[length][1]);
      }
      return result;
    }

    /**
     * Gets the native function at `key` of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {string} key The key of the method to get.
     * @returns {*} Returns the function if it's native, else `undefined`.
     */
    function getNative(object, key) {
      var value = object == null ? undefined : object[key];
      return isNative(value) ? value : undefined;
    }

    /**
     * Gets the view, applying any `transforms` to the `start` and `end` positions.
     *
     * @private
     * @param {number} start The start of the view.
     * @param {number} end The end of the view.
     * @param {Array} transforms The transformations to apply to the view.
     * @returns {Object} Returns an object containing the `start` and `end`
     *  positions of the view.
     */
    function getView(start, end, transforms) {
      var index = -1,
          length = transforms.length;

      while (++index < length) {
        var data = transforms[index],
            size = data.size;

        switch (data.type) {
          case 'drop':      start += size; break;
          case 'dropRight': end -= size; break;
          case 'take':      end = nativeMin(end, start + size); break;
          case 'takeRight': start = nativeMax(start, end - size); break;
        }
      }
      return { 'start': start, 'end': end };
    }

    /**
     * Initializes an array clone.
     *
     * @private
     * @param {Array} array The array to clone.
     * @returns {Array} Returns the initialized clone.
     */
    function initCloneArray(array) {
      var length = array.length,
          result = new array.constructor(length);

      // Add array properties assigned by `RegExp#exec`.
      if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
        result.index = array.index;
        result.input = array.input;
      }
      return result;
    }

    /**
     * Initializes an object clone.
     *
     * @private
     * @param {Object} object The object to clone.
     * @returns {Object} Returns the initialized clone.
     */
    function initCloneObject(object) {
      var Ctor = object.constructor;
      if (!(typeof Ctor == 'function' && Ctor instanceof Ctor)) {
        Ctor = Object;
      }
      return new Ctor;
    }

    /**
     * Initializes an object clone based on its `toStringTag`.
     *
     * **Note:** This function only supports cloning values with tags of
     * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
     *
     * @private
     * @param {Object} object The object to clone.
     * @param {string} tag The `toStringTag` of the object to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Object} Returns the initialized clone.
     */
    function initCloneByTag(object, tag, isDeep) {
      var Ctor = object.constructor;
      switch (tag) {
        case arrayBufferTag:
          return bufferClone(object);

        case boolTag:
        case dateTag:
          return new Ctor(+object);

        case float32Tag: case float64Tag:
        case int8Tag: case int16Tag: case int32Tag:
        case uint8Tag: case uint8ClampedTag: case uint16Tag: case uint32Tag:
          var buffer = object.buffer;
          return new Ctor(isDeep ? bufferClone(buffer) : buffer, object.byteOffset, object.length);

        case numberTag:
        case stringTag:
          return new Ctor(object);

        case regexpTag:
          var result = new Ctor(object.source, reFlags.exec(object));
          result.lastIndex = object.lastIndex;
      }
      return result;
    }

    /**
     * Invokes the method at `path` on `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array|string} path The path of the method to invoke.
     * @param {Array} args The arguments to invoke the method with.
     * @returns {*} Returns the result of the invoked method.
     */
    function invokePath(object, path, args) {
      if (object != null && !isKey(path, object)) {
        path = toPath(path);
        object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
        path = last(path);
      }
      var func = object == null ? object : object[path];
      return func == null ? undefined : func.apply(object, args);
    }

    /**
     * Checks if `value` is array-like.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
     */
    function isArrayLike(value) {
      return value != null && isLength(getLength(value));
    }

    /**
     * Checks if `value` is a valid array-like index.
     *
     * @private
     * @param {*} value The value to check.
     * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
     * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
     */
    function isIndex(value, length) {
      value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
      length = length == null ? MAX_SAFE_INTEGER : length;
      return value > -1 && value % 1 == 0 && value < length;
    }

    /**
     * Checks if the provided arguments are from an iteratee call.
     *
     * @private
     * @param {*} value The potential iteratee value argument.
     * @param {*} index The potential iteratee index or key argument.
     * @param {*} object The potential iteratee object argument.
     * @returns {boolean} Returns `true` if the arguments are from an iteratee call, else `false`.
     */
    function isIterateeCall(value, index, object) {
      if (!isObject(object)) {
        return false;
      }
      var type = typeof index;
      if (type == 'number'
          ? (isArrayLike(object) && isIndex(index, object.length))
          : (type == 'string' && index in object)) {
        var other = object[index];
        return value === value ? (value === other) : (other !== other);
      }
      return false;
    }

    /**
     * Checks if `value` is a property name and not a property path.
     *
     * @private
     * @param {*} value The value to check.
     * @param {Object} [object] The object to query keys on.
     * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
     */
    function isKey(value, object) {
      var type = typeof value;
      if ((type == 'string' && reIsPlainProp.test(value)) || type == 'number') {
        return true;
      }
      if (isArray(value)) {
        return false;
      }
      var result = !reIsDeepProp.test(value);
      return result || (object != null && value in toObject(object));
    }

    /**
     * Checks if `func` has a lazy counterpart.
     *
     * @private
     * @param {Function} func The function to check.
     * @returns {boolean} Returns `true` if `func` has a lazy counterpart, else `false`.
     */
    function isLaziable(func) {
      var funcName = getFuncName(func);
      if (!(funcName in LazyWrapper.prototype)) {
        return false;
      }
      var other = lodash[funcName];
      if (func === other) {
        return true;
      }
      var data = getData(other);
      return !!data && func === data[0];
    }

    /**
     * Checks if `value` is a valid array-like length.
     *
     * **Note:** This function is based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
     */
    function isLength(value) {
      return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
    }

    /**
     * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` if suitable for strict
     *  equality comparisons, else `false`.
     */
    function isStrictComparable(value) {
      return value === value && !isObject(value);
    }

    /**
     * Merges the function metadata of `source` into `data`.
     *
     * Merging metadata reduces the number of wrappers required to invoke a function.
     * This is possible because methods like `_.bind`, `_.curry`, and `_.partial`
     * may be applied regardless of execution order. Methods like `_.ary` and `_.rearg`
     * augment function arguments, making the order in which they are executed important,
     * preventing the merging of metadata. However, we make an exception for a safe
     * common case where curried functions have `_.ary` and or `_.rearg` applied.
     *
     * @private
     * @param {Array} data The destination metadata.
     * @param {Array} source The source metadata.
     * @returns {Array} Returns `data`.
     */
    function mergeData(data, source) {
      var bitmask = data[1],
          srcBitmask = source[1],
          newBitmask = bitmask | srcBitmask,
          isCommon = newBitmask < ARY_FLAG;

      var isCombo =
        (srcBitmask == ARY_FLAG && bitmask == CURRY_FLAG) ||
        (srcBitmask == ARY_FLAG && bitmask == REARG_FLAG && data[7].length <= source[8]) ||
        (srcBitmask == (ARY_FLAG | REARG_FLAG) && bitmask == CURRY_FLAG);

      // Exit early if metadata can't be merged.
      if (!(isCommon || isCombo)) {
        return data;
      }
      // Use source `thisArg` if available.
      if (srcBitmask & BIND_FLAG) {
        data[2] = source[2];
        // Set when currying a bound function.
        newBitmask |= (bitmask & BIND_FLAG) ? 0 : CURRY_BOUND_FLAG;
      }
      // Compose partial arguments.
      var value = source[3];
      if (value) {
        var partials = data[3];
        data[3] = partials ? composeArgs(partials, value, source[4]) : arrayCopy(value);
        data[4] = partials ? replaceHolders(data[3], PLACEHOLDER) : arrayCopy(source[4]);
      }
      // Compose partial right arguments.
      value = source[5];
      if (value) {
        partials = data[5];
        data[5] = partials ? composeArgsRight(partials, value, source[6]) : arrayCopy(value);
        data[6] = partials ? replaceHolders(data[5], PLACEHOLDER) : arrayCopy(source[6]);
      }
      // Use source `argPos` if available.
      value = source[7];
      if (value) {
        data[7] = arrayCopy(value);
      }
      // Use source `ary` if it's smaller.
      if (srcBitmask & ARY_FLAG) {
        data[8] = data[8] == null ? source[8] : nativeMin(data[8], source[8]);
      }
      // Use source `arity` if one is not provided.
      if (data[9] == null) {
        data[9] = source[9];
      }
      // Use source `func` and merge bitmasks.
      data[0] = source[0];
      data[1] = newBitmask;

      return data;
    }

    /**
     * Used by `_.defaultsDeep` to customize its `_.merge` use.
     *
     * @private
     * @param {*} objectValue The destination object property value.
     * @param {*} sourceValue The source object property value.
     * @returns {*} Returns the value to assign to the destination object.
     */
    function mergeDefaults(objectValue, sourceValue) {
      return objectValue === undefined ? sourceValue : merge(objectValue, sourceValue, mergeDefaults);
    }

    /**
     * A specialized version of `_.pick` which picks `object` properties specified
     * by `props`.
     *
     * @private
     * @param {Object} object The source object.
     * @param {string[]} props The property names to pick.
     * @returns {Object} Returns the new object.
     */
    function pickByArray(object, props) {
      object = toObject(object);

      var index = -1,
          length = props.length,
          result = {};

      while (++index < length) {
        var key = props[index];
        if (key in object) {
          result[key] = object[key];
        }
      }
      return result;
    }

    /**
     * A specialized version of `_.pick` which picks `object` properties `predicate`
     * returns truthy for.
     *
     * @private
     * @param {Object} object The source object.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {Object} Returns the new object.
     */
    function pickByCallback(object, predicate) {
      var result = {};
      baseForIn(object, function(value, key, object) {
        if (predicate(value, key, object)) {
          result[key] = value;
        }
      });
      return result;
    }

    /**
     * Reorder `array` according to the specified indexes where the element at
     * the first index is assigned as the first element, the element at
     * the second index is assigned as the second element, and so on.
     *
     * @private
     * @param {Array} array The array to reorder.
     * @param {Array} indexes The arranged array indexes.
     * @returns {Array} Returns `array`.
     */
    function reorder(array, indexes) {
      var arrLength = array.length,
          length = nativeMin(indexes.length, arrLength),
          oldArray = arrayCopy(array);

      while (length--) {
        var index = indexes[length];
        array[length] = isIndex(index, arrLength) ? oldArray[index] : undefined;
      }
      return array;
    }

    /**
     * Sets metadata for `func`.
     *
     * **Note:** If this function becomes hot, i.e. is invoked a lot in a short
     * period of time, it will trip its breaker and transition to an identity function
     * to avoid garbage collection pauses in V8. See [V8 issue 2070](https://code.google.com/p/v8/issues/detail?id=2070)
     * for more details.
     *
     * @private
     * @param {Function} func The function to associate metadata with.
     * @param {*} data The metadata.
     * @returns {Function} Returns `func`.
     */
    var setData = (function() {
      var count = 0,
          lastCalled = 0;

      return function(key, value) {
        var stamp = now(),
            remaining = HOT_SPAN - (stamp - lastCalled);

        lastCalled = stamp;
        if (remaining > 0) {
          if (++count >= HOT_COUNT) {
            return key;
          }
        } else {
          count = 0;
        }
        return baseSetData(key, value);
      };
    }());

    /**
     * A fallback implementation of `Object.keys` which creates an array of the
     * own enumerable property names of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     */
    function shimKeys(object) {
      var props = keysIn(object),
          propsLength = props.length,
          length = propsLength && object.length;

      var allowIndexes = !!length && isLength(length) &&
        (isArray(object) || isArguments(object));

      var index = -1,
          result = [];

      while (++index < propsLength) {
        var key = props[index];
        if ((allowIndexes && isIndex(key, length)) || hasOwnProperty.call(object, key)) {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * Converts `value` to an array-like object if it's not one.
     *
     * @private
     * @param {*} value The value to process.
     * @returns {Array|Object} Returns the array-like object.
     */
    function toIterable(value) {
      if (value == null) {
        return [];
      }
      if (!isArrayLike(value)) {
        return values(value);
      }
      return isObject(value) ? value : Object(value);
    }

    /**
     * Converts `value` to an object if it's not one.
     *
     * @private
     * @param {*} value The value to process.
     * @returns {Object} Returns the object.
     */
    function toObject(value) {
      return isObject(value) ? value : Object(value);
    }

    /**
     * Converts `value` to property path array if it's not one.
     *
     * @private
     * @param {*} value The value to process.
     * @returns {Array} Returns the property path array.
     */
    function toPath(value) {
      if (isArray(value)) {
        return value;
      }
      var result = [];
      baseToString(value).replace(rePropName, function(match, number, quote, string) {
        result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
      });
      return result;
    }

    /**
     * Creates a clone of `wrapper`.
     *
     * @private
     * @param {Object} wrapper The wrapper to clone.
     * @returns {Object} Returns the cloned wrapper.
     */
    function wrapperClone(wrapper) {
      return wrapper instanceof LazyWrapper
        ? wrapper.clone()
        : new LodashWrapper(wrapper.__wrapped__, wrapper.__chain__, arrayCopy(wrapper.__actions__));
    }

    /*------------------------------------------------------------------------*/

    /**
     * Creates an array of elements split into groups the length of `size`.
     * If `collection` can't be split evenly, the final chunk will be the remaining
     * elements.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to process.
     * @param {number} [size=1] The length of each chunk.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Array} Returns the new array containing chunks.
     * @example
     *
     * _.chunk(['a', 'b', 'c', 'd'], 2);
     * // => [['a', 'b'], ['c', 'd']]
     *
     * _.chunk(['a', 'b', 'c', 'd'], 3);
     * // => [['a', 'b', 'c'], ['d']]
     */
    function chunk(array, size, guard) {
      if (guard ? isIterateeCall(array, size, guard) : size == null) {
        size = 1;
      } else {
        size = nativeMax(nativeFloor(size) || 1, 1);
      }
      var index = 0,
          length = array ? array.length : 0,
          resIndex = -1,
          result = Array(nativeCeil(length / size));

      while (index < length) {
        result[++resIndex] = baseSlice(array, index, (index += size));
      }
      return result;
    }

    /**
     * Creates an array with all falsey values removed. The values `false`, `null`,
     * `0`, `""`, `undefined`, and `NaN` are falsey.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to compact.
     * @returns {Array} Returns the new array of filtered values.
     * @example
     *
     * _.compact([0, 1, false, 2, '', 3]);
     * // => [1, 2, 3]
     */
    function compact(array) {
      var index = -1,
          length = array ? array.length : 0,
          resIndex = -1,
          result = [];

      while (++index < length) {
        var value = array[index];
        if (value) {
          result[++resIndex] = value;
        }
      }
      return result;
    }

    /**
     * Creates an array of unique `array` values not included in the other
     * provided arrays using [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
     * for equality comparisons.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {...Array} [values] The arrays of values to exclude.
     * @returns {Array} Returns the new array of filtered values.
     * @example
     *
     * _.difference([1, 2, 3], [4, 2]);
     * // => [1, 3]
     */
    var difference = restParam(function(array, values) {
      return (isObjectLike(array) && isArrayLike(array))
        ? baseDifference(array, baseFlatten(values, false, true))
        : [];
    });

    /**
     * Creates a slice of `array` with `n` elements dropped from the beginning.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {number} [n=1] The number of elements to drop.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.drop([1, 2, 3]);
     * // => [2, 3]
     *
     * _.drop([1, 2, 3], 2);
     * // => [3]
     *
     * _.drop([1, 2, 3], 5);
     * // => []
     *
     * _.drop([1, 2, 3], 0);
     * // => [1, 2, 3]
     */
    function drop(array, n, guard) {
      var length = array ? array.length : 0;
      if (!length) {
        return [];
      }
      if (guard ? isIterateeCall(array, n, guard) : n == null) {
        n = 1;
      }
      return baseSlice(array, n < 0 ? 0 : n);
    }

    /**
     * Creates a slice of `array` with `n` elements dropped from the end.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {number} [n=1] The number of elements to drop.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.dropRight([1, 2, 3]);
     * // => [1, 2]
     *
     * _.dropRight([1, 2, 3], 2);
     * // => [1]
     *
     * _.dropRight([1, 2, 3], 5);
     * // => []
     *
     * _.dropRight([1, 2, 3], 0);
     * // => [1, 2, 3]
     */
    function dropRight(array, n, guard) {
      var length = array ? array.length : 0;
      if (!length) {
        return [];
      }
      if (guard ? isIterateeCall(array, n, guard) : n == null) {
        n = 1;
      }
      n = length - (+n || 0);
      return baseSlice(array, 0, n < 0 ? 0 : n);
    }

    /**
     * Creates a slice of `array` excluding elements dropped from the end.
     * Elements are dropped until `predicate` returns falsey. The predicate is
     * bound to `thisArg` and invoked with three arguments: (value, index, array).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that match the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.dropRightWhile([1, 2, 3], function(n) {
     *   return n > 1;
     * });
     * // => [1]
     *
     * var users = [
     *   { 'user': 'barney',  'active': true },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': false }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.pluck(_.dropRightWhile(users, { 'user': 'pebbles', 'active': false }), 'user');
     * // => ['barney', 'fred']
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.pluck(_.dropRightWhile(users, 'active', false), 'user');
     * // => ['barney']
     *
     * // using the `_.property` callback shorthand
     * _.pluck(_.dropRightWhile(users, 'active'), 'user');
     * // => ['barney', 'fred', 'pebbles']
     */
    function dropRightWhile(array, predicate, thisArg) {
      return (array && array.length)
        ? baseWhile(array, getCallback(predicate, thisArg, 3), true, true)
        : [];
    }

    /**
     * Creates a slice of `array` excluding elements dropped from the beginning.
     * Elements are dropped until `predicate` returns falsey. The predicate is
     * bound to `thisArg` and invoked with three arguments: (value, index, array).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.dropWhile([1, 2, 3], function(n) {
     *   return n < 3;
     * });
     * // => [3]
     *
     * var users = [
     *   { 'user': 'barney',  'active': false },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': true }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.pluck(_.dropWhile(users, { 'user': 'barney', 'active': false }), 'user');
     * // => ['fred', 'pebbles']
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.pluck(_.dropWhile(users, 'active', false), 'user');
     * // => ['pebbles']
     *
     * // using the `_.property` callback shorthand
     * _.pluck(_.dropWhile(users, 'active'), 'user');
     * // => ['barney', 'fred', 'pebbles']
     */
    function dropWhile(array, predicate, thisArg) {
      return (array && array.length)
        ? baseWhile(array, getCallback(predicate, thisArg, 3), true)
        : [];
    }

    /**
     * Fills elements of `array` with `value` from `start` up to, but not
     * including, `end`.
     *
     * **Note:** This method mutates `array`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to fill.
     * @param {*} value The value to fill `array` with.
     * @param {number} [start=0] The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = [1, 2, 3];
     *
     * _.fill(array, 'a');
     * console.log(array);
     * // => ['a', 'a', 'a']
     *
     * _.fill(Array(3), 2);
     * // => [2, 2, 2]
     *
     * _.fill([4, 6, 8], '*', 1, 2);
     * // => [4, '*', 8]
     */
    function fill(array, value, start, end) {
      var length = array ? array.length : 0;
      if (!length) {
        return [];
      }
      if (start && typeof start != 'number' && isIterateeCall(array, value, start)) {
        start = 0;
        end = length;
      }
      return baseFill(array, value, start, end);
    }

    /**
     * This method is like `_.find` except that it returns the index of the first
     * element `predicate` returns truthy for instead of the element itself.
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'active': false },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': true }
     * ];
     *
     * _.findIndex(users, function(chr) {
     *   return chr.user == 'barney';
     * });
     * // => 0
     *
     * // using the `_.matches` callback shorthand
     * _.findIndex(users, { 'user': 'fred', 'active': false });
     * // => 1
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.findIndex(users, 'active', false);
     * // => 0
     *
     * // using the `_.property` callback shorthand
     * _.findIndex(users, 'active');
     * // => 2
     */
    var findIndex = createFindIndex();

    /**
     * This method is like `_.findIndex` except that it iterates over elements
     * of `collection` from right to left.
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'active': true },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': false }
     * ];
     *
     * _.findLastIndex(users, function(chr) {
     *   return chr.user == 'pebbles';
     * });
     * // => 2
     *
     * // using the `_.matches` callback shorthand
     * _.findLastIndex(users, { 'user': 'barney', 'active': true });
     * // => 0
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.findLastIndex(users, 'active', false);
     * // => 2
     *
     * // using the `_.property` callback shorthand
     * _.findLastIndex(users, 'active');
     * // => 0
     */
    var findLastIndex = createFindIndex(true);

    /**
     * Gets the first element of `array`.
     *
     * @static
     * @memberOf _
     * @alias head
     * @category Array
     * @param {Array} array The array to query.
     * @returns {*} Returns the first element of `array`.
     * @example
     *
     * _.first([1, 2, 3]);
     * // => 1
     *
     * _.first([]);
     * // => undefined
     */
    function first(array) {
      return array ? array[0] : undefined;
    }

    /**
     * Flattens a nested array. If `isDeep` is `true` the array is recursively
     * flattened, otherwise it is only flattened a single level.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to flatten.
     * @param {boolean} [isDeep] Specify a deep flatten.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Array} Returns the new flattened array.
     * @example
     *
     * _.flatten([1, [2, 3, [4]]]);
     * // => [1, 2, 3, [4]]
     *
     * // using `isDeep`
     * _.flatten([1, [2, 3, [4]]], true);
     * // => [1, 2, 3, 4]
     */
    function flatten(array, isDeep, guard) {
      var length = array ? array.length : 0;
      if (guard && isIterateeCall(array, isDeep, guard)) {
        isDeep = false;
      }
      return length ? baseFlatten(array, isDeep) : [];
    }

    /**
     * Recursively flattens a nested array.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to recursively flatten.
     * @returns {Array} Returns the new flattened array.
     * @example
     *
     * _.flattenDeep([1, [2, 3, [4]]]);
     * // => [1, 2, 3, 4]
     */
    function flattenDeep(array) {
      var length = array ? array.length : 0;
      return length ? baseFlatten(array, true) : [];
    }

    /**
     * Gets the index at which the first occurrence of `value` is found in `array`
     * using [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
     * for equality comparisons. If `fromIndex` is negative, it is used as the offset
     * from the end of `array`. If `array` is sorted providing `true` for `fromIndex`
     * performs a faster binary search.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {boolean|number} [fromIndex=0] The index to search from or `true`
     *  to perform a binary search on a sorted array.
     * @returns {number} Returns the index of the matched value, else `-1`.
     * @example
     *
     * _.indexOf([1, 2, 1, 2], 2);
     * // => 1
     *
     * // using `fromIndex`
     * _.indexOf([1, 2, 1, 2], 2, 2);
     * // => 3
     *
     * // performing a binary search
     * _.indexOf([1, 1, 2, 2], 2, true);
     * // => 2
     */
    function indexOf(array, value, fromIndex) {
      var length = array ? array.length : 0;
      if (!length) {
        return -1;
      }
      if (typeof fromIndex == 'number') {
        fromIndex = fromIndex < 0 ? nativeMax(length + fromIndex, 0) : fromIndex;
      } else if (fromIndex) {
        var index = binaryIndex(array, value);
        if (index < length &&
            (value === value ? (value === array[index]) : (array[index] !== array[index]))) {
          return index;
        }
        return -1;
      }
      return baseIndexOf(array, value, fromIndex || 0);
    }

    /**
     * Gets all but the last element of `array`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.initial([1, 2, 3]);
     * // => [1, 2]
     */
    function initial(array) {
      return dropRight(array, 1);
    }

    /**
     * Creates an array of unique values that are included in all of the provided
     * arrays using [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
     * for equality comparisons.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {...Array} [arrays] The arrays to inspect.
     * @returns {Array} Returns the new array of shared values.
     * @example
     * _.intersection([1, 2], [4, 2], [2, 1]);
     * // => [2]
     */
    var intersection = restParam(function(arrays) {
      var othLength = arrays.length,
          othIndex = othLength,
          caches = Array(length),
          indexOf = getIndexOf(),
          isCommon = indexOf == baseIndexOf,
          result = [];

      while (othIndex--) {
        var value = arrays[othIndex] = isArrayLike(value = arrays[othIndex]) ? value : [];
        caches[othIndex] = (isCommon && value.length >= 120) ? createCache(othIndex && value) : null;
      }
      var array = arrays[0],
          index = -1,
          length = array ? array.length : 0,
          seen = caches[0];

      outer:
      while (++index < length) {
        value = array[index];
        if ((seen ? cacheIndexOf(seen, value) : indexOf(result, value, 0)) < 0) {
          var othIndex = othLength;
          while (--othIndex) {
            var cache = caches[othIndex];
            if ((cache ? cacheIndexOf(cache, value) : indexOf(arrays[othIndex], value, 0)) < 0) {
              continue outer;
            }
          }
          if (seen) {
            seen.push(value);
          }
          result.push(value);
        }
      }
      return result;
    });

    /**
     * Gets the last element of `array`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @returns {*} Returns the last element of `array`.
     * @example
     *
     * _.last([1, 2, 3]);
     * // => 3
     */
    function last(array) {
      var length = array ? array.length : 0;
      return length ? array[length - 1] : undefined;
    }

    /**
     * This method is like `_.indexOf` except that it iterates over elements of
     * `array` from right to left.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {boolean|number} [fromIndex=array.length-1] The index to search from
     *  or `true` to perform a binary search on a sorted array.
     * @returns {number} Returns the index of the matched value, else `-1`.
     * @example
     *
     * _.lastIndexOf([1, 2, 1, 2], 2);
     * // => 3
     *
     * // using `fromIndex`
     * _.lastIndexOf([1, 2, 1, 2], 2, 2);
     * // => 1
     *
     * // performing a binary search
     * _.lastIndexOf([1, 1, 2, 2], 2, true);
     * // => 3
     */
    function lastIndexOf(array, value, fromIndex) {
      var length = array ? array.length : 0;
      if (!length) {
        return -1;
      }
      var index = length;
      if (typeof fromIndex == 'number') {
        index = (fromIndex < 0 ? nativeMax(length + fromIndex, 0) : nativeMin(fromIndex || 0, length - 1)) + 1;
      } else if (fromIndex) {
        index = binaryIndex(array, value, true) - 1;
        var other = array[index];
        if (value === value ? (value === other) : (other !== other)) {
          return index;
        }
        return -1;
      }
      if (value !== value) {
        return indexOfNaN(array, index, true);
      }
      while (index--) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }

    /**
     * Removes all provided values from `array` using
     * [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
     * for equality comparisons.
     *
     * **Note:** Unlike `_.without`, this method mutates `array`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to modify.
     * @param {...*} [values] The values to remove.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = [1, 2, 3, 1, 2, 3];
     *
     * _.pull(array, 2, 3);
     * console.log(array);
     * // => [1, 1]
     */
    function pull() {
      var args = arguments,
          array = args[0];

      if (!(array && array.length)) {
        return array;
      }
      var index = 0,
          indexOf = getIndexOf(),
          length = args.length;

      while (++index < length) {
        var fromIndex = 0,
            value = args[index];

        while ((fromIndex = indexOf(array, value, fromIndex)) > -1) {
          splice.call(array, fromIndex, 1);
        }
      }
      return array;
    }

    /**
     * Removes elements from `array` corresponding to the given indexes and returns
     * an array of the removed elements. Indexes may be specified as an array of
     * indexes or as individual arguments.
     *
     * **Note:** Unlike `_.at`, this method mutates `array`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to modify.
     * @param {...(number|number[])} [indexes] The indexes of elements to remove,
     *  specified as individual indexes or arrays of indexes.
     * @returns {Array} Returns the new array of removed elements.
     * @example
     *
     * var array = [5, 10, 15, 20];
     * var evens = _.pullAt(array, 1, 3);
     *
     * console.log(array);
     * // => [5, 15]
     *
     * console.log(evens);
     * // => [10, 20]
     */
    var pullAt = restParam(function(array, indexes) {
      indexes = baseFlatten(indexes);

      var result = baseAt(array, indexes);
      basePullAt(array, indexes.sort(baseCompareAscending));
      return result;
    });

    /**
     * Removes all elements from `array` that `predicate` returns truthy for
     * and returns an array of the removed elements. The predicate is bound to
     * `thisArg` and invoked with three arguments: (value, index, array).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * **Note:** Unlike `_.filter`, this method mutates `array`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to modify.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the new array of removed elements.
     * @example
     *
     * var array = [1, 2, 3, 4];
     * var evens = _.remove(array, function(n) {
     *   return n % 2 == 0;
     * });
     *
     * console.log(array);
     * // => [1, 3]
     *
     * console.log(evens);
     * // => [2, 4]
     */
    function remove(array, predicate, thisArg) {
      var result = [];
      if (!(array && array.length)) {
        return result;
      }
      var index = -1,
          indexes = [],
          length = array.length;

      predicate = getCallback(predicate, thisArg, 3);
      while (++index < length) {
        var value = array[index];
        if (predicate(value, index, array)) {
          result.push(value);
          indexes.push(index);
        }
      }
      basePullAt(array, indexes);
      return result;
    }

    /**
     * Gets all but the first element of `array`.
     *
     * @static
     * @memberOf _
     * @alias tail
     * @category Array
     * @param {Array} array The array to query.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.rest([1, 2, 3]);
     * // => [2, 3]
     */
    function rest(array) {
      return drop(array, 1);
    }

    /**
     * Creates a slice of `array` from `start` up to, but not including, `end`.
     *
     * **Note:** This method is used instead of `Array#slice` to support node
     * lists in IE < 9 and to ensure dense arrays are returned.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to slice.
     * @param {number} [start=0] The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns the slice of `array`.
     */
    function slice(array, start, end) {
      var length = array ? array.length : 0;
      if (!length) {
        return [];
      }
      if (end && typeof end != 'number' && isIterateeCall(array, start, end)) {
        start = 0;
        end = length;
      }
      return baseSlice(array, start, end);
    }

    /**
     * Uses a binary search to determine the lowest index at which `value` should
     * be inserted into `array` in order to maintain its sort order. If an iteratee
     * function is provided it is invoked for `value` and each element of `array`
     * to compute their sort ranking. The iteratee is bound to `thisArg` and
     * invoked with one argument; (value).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The sorted array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     * @example
     *
     * _.sortedIndex([30, 50], 40);
     * // => 1
     *
     * _.sortedIndex([4, 4, 5, 5], 5);
     * // => 2
     *
     * var dict = { 'data': { 'thirty': 30, 'forty': 40, 'fifty': 50 } };
     *
     * // using an iteratee function
     * _.sortedIndex(['thirty', 'fifty'], 'forty', function(word) {
     *   return this.data[word];
     * }, dict);
     * // => 1
     *
     * // using the `_.property` callback shorthand
     * _.sortedIndex([{ 'x': 30 }, { 'x': 50 }], { 'x': 40 }, 'x');
     * // => 1
     */
    var sortedIndex = createSortedIndex();

    /**
     * This method is like `_.sortedIndex` except that it returns the highest
     * index at which `value` should be inserted into `array` in order to
     * maintain its sort order.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The sorted array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     * @example
     *
     * _.sortedLastIndex([4, 4, 5, 5], 5);
     * // => 4
     */
    var sortedLastIndex = createSortedIndex(true);

    /**
     * Creates a slice of `array` with `n` elements taken from the beginning.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {number} [n=1] The number of elements to take.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.take([1, 2, 3]);
     * // => [1]
     *
     * _.take([1, 2, 3], 2);
     * // => [1, 2]
     *
     * _.take([1, 2, 3], 5);
     * // => [1, 2, 3]
     *
     * _.take([1, 2, 3], 0);
     * // => []
     */
    function take(array, n, guard) {
      var length = array ? array.length : 0;
      if (!length) {
        return [];
      }
      if (guard ? isIterateeCall(array, n, guard) : n == null) {
        n = 1;
      }
      return baseSlice(array, 0, n < 0 ? 0 : n);
    }

    /**
     * Creates a slice of `array` with `n` elements taken from the end.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {number} [n=1] The number of elements to take.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.takeRight([1, 2, 3]);
     * // => [3]
     *
     * _.takeRight([1, 2, 3], 2);
     * // => [2, 3]
     *
     * _.takeRight([1, 2, 3], 5);
     * // => [1, 2, 3]
     *
     * _.takeRight([1, 2, 3], 0);
     * // => []
     */
    function takeRight(array, n, guard) {
      var length = array ? array.length : 0;
      if (!length) {
        return [];
      }
      if (guard ? isIterateeCall(array, n, guard) : n == null) {
        n = 1;
      }
      n = length - (+n || 0);
      return baseSlice(array, n < 0 ? 0 : n);
    }

    /**
     * Creates a slice of `array` with elements taken from the end. Elements are
     * taken until `predicate` returns falsey. The predicate is bound to `thisArg`
     * and invoked with three arguments: (value, index, array).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.takeRightWhile([1, 2, 3], function(n) {
     *   return n > 1;
     * });
     * // => [2, 3]
     *
     * var users = [
     *   { 'user': 'barney',  'active': true },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': false }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.pluck(_.takeRightWhile(users, { 'user': 'pebbles', 'active': false }), 'user');
     * // => ['pebbles']
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.pluck(_.takeRightWhile(users, 'active', false), 'user');
     * // => ['fred', 'pebbles']
     *
     * // using the `_.property` callback shorthand
     * _.pluck(_.takeRightWhile(users, 'active'), 'user');
     * // => []
     */
    function takeRightWhile(array, predicate, thisArg) {
      return (array && array.length)
        ? baseWhile(array, getCallback(predicate, thisArg, 3), false, true)
        : [];
    }

    /**
     * Creates a slice of `array` with elements taken from the beginning. Elements
     * are taken until `predicate` returns falsey. The predicate is bound to
     * `thisArg` and invoked with three arguments: (value, index, array).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.takeWhile([1, 2, 3], function(n) {
     *   return n < 3;
     * });
     * // => [1, 2]
     *
     * var users = [
     *   { 'user': 'barney',  'active': false },
     *   { 'user': 'fred',    'active': false},
     *   { 'user': 'pebbles', 'active': true }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.pluck(_.takeWhile(users, { 'user': 'barney', 'active': false }), 'user');
     * // => ['barney']
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.pluck(_.takeWhile(users, 'active', false), 'user');
     * // => ['barney', 'fred']
     *
     * // using the `_.property` callback shorthand
     * _.pluck(_.takeWhile(users, 'active'), 'user');
     * // => []
     */
    function takeWhile(array, predicate, thisArg) {
      return (array && array.length)
        ? baseWhile(array, getCallback(predicate, thisArg, 3))
        : [];
    }

    /**
     * Creates an array of unique values, in order, from all of the provided arrays
     * using [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
     * for equality comparisons.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {...Array} [arrays] The arrays to inspect.
     * @returns {Array} Returns the new array of combined values.
     * @example
     *
     * _.union([1, 2], [4, 2], [2, 1]);
     * // => [1, 2, 4]
     */
    var union = restParam(function(arrays) {
      return baseUniq(baseFlatten(arrays, false, true));
    });

    /**
     * Creates a duplicate-free version of an array, using
     * [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
     * for equality comparisons, in which only the first occurence of each element
     * is kept. Providing `true` for `isSorted` performs a faster search algorithm
     * for sorted arrays. If an iteratee function is provided it is invoked for
     * each element in the array to generate the criterion by which uniqueness
     * is computed. The `iteratee` is bound to `thisArg` and invoked with three
     * arguments: (value, index, array).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @alias unique
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {boolean} [isSorted] Specify the array is sorted.
     * @param {Function|Object|string} [iteratee] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Array} Returns the new duplicate-value-free array.
     * @example
     *
     * _.uniq([2, 1, 2]);
     * // => [2, 1]
     *
     * // using `isSorted`
     * _.uniq([1, 1, 2], true);
     * // => [1, 2]
     *
     * // using an iteratee function
     * _.uniq([1, 2.5, 1.5, 2], function(n) {
     *   return this.floor(n);
     * }, Math);
     * // => [1, 2.5]
     *
     * // using the `_.property` callback shorthand
     * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
     * // => [{ 'x': 1 }, { 'x': 2 }]
     */
    function uniq(array, isSorted, iteratee, thisArg) {
      var length = array ? array.length : 0;
      if (!length) {
        return [];
      }
      if (isSorted != null && typeof isSorted != 'boolean') {
        thisArg = iteratee;
        iteratee = isIterateeCall(array, isSorted, thisArg) ? undefined : isSorted;
        isSorted = false;
      }
      var callback = getCallback();
      if (!(iteratee == null && callback === baseCallback)) {
        iteratee = callback(iteratee, thisArg, 3);
      }
      return (isSorted && getIndexOf() == baseIndexOf)
        ? sortedUniq(array, iteratee)
        : baseUniq(array, iteratee);
    }

    /**
     * This method is like `_.zip` except that it accepts an array of grouped
     * elements and creates an array regrouping the elements to their pre-zip
     * configuration.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array of grouped elements to process.
     * @returns {Array} Returns the new array of regrouped elements.
     * @example
     *
     * var zipped = _.zip(['fred', 'barney'], [30, 40], [true, false]);
     * // => [['fred', 30, true], ['barney', 40, false]]
     *
     * _.unzip(zipped);
     * // => [['fred', 'barney'], [30, 40], [true, false]]
     */
    function unzip(array) {
      if (!(array && array.length)) {
        return [];
      }
      var index = -1,
          length = 0;

      array = arrayFilter(array, function(group) {
        if (isArrayLike(group)) {
          length = nativeMax(group.length, length);
          return true;
        }
      });
      var result = Array(length);
      while (++index < length) {
        result[index] = arrayMap(array, baseProperty(index));
      }
      return result;
    }

    /**
     * This method is like `_.unzip` except that it accepts an iteratee to specify
     * how regrouped values should be combined. The `iteratee` is bound to `thisArg`
     * and invoked with four arguments: (accumulator, value, index, group).
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array of grouped elements to process.
     * @param {Function} [iteratee] The function to combine regrouped values.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Array} Returns the new array of regrouped elements.
     * @example
     *
     * var zipped = _.zip([1, 2], [10, 20], [100, 200]);
     * // => [[1, 10, 100], [2, 20, 200]]
     *
     * _.unzipWith(zipped, _.add);
     * // => [3, 30, 300]
     */
    function unzipWith(array, iteratee, thisArg) {
      var length = array ? array.length : 0;
      if (!length) {
        return [];
      }
      var result = unzip(array);
      if (iteratee == null) {
        return result;
      }
      iteratee = bindCallback(iteratee, thisArg, 4);
      return arrayMap(result, function(group) {
        return arrayReduce(group, iteratee, undefined, true);
      });
    }

    /**
     * Creates an array excluding all provided values using
     * [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
     * for equality comparisons.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to filter.
     * @param {...*} [values] The values to exclude.
     * @returns {Array} Returns the new array of filtered values.
     * @example
     *
     * _.without([1, 2, 1, 3], 1, 2);
     * // => [3]
     */
    var without = restParam(function(array, values) {
      return isArrayLike(array)
        ? baseDifference(array, values)
        : [];
    });

    /**
     * Creates an array of unique values that is the [symmetric difference](https://en.wikipedia.org/wiki/Symmetric_difference)
     * of the provided arrays.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {...Array} [arrays] The arrays to inspect.
     * @returns {Array} Returns the new array of values.
     * @example
     *
     * _.xor([1, 2], [4, 2]);
     * // => [1, 4]
     */
    function xor() {
      var index = -1,
          length = arguments.length;

      while (++index < length) {
        var array = arguments[index];
        if (isArrayLike(array)) {
          var result = result
            ? arrayPush(baseDifference(result, array), baseDifference(array, result))
            : array;
        }
      }
      return result ? baseUniq(result) : [];
    }

    /**
     * Creates an array of grouped elements, the first of which contains the first
     * elements of the given arrays, the second of which contains the second elements
     * of the given arrays, and so on.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {...Array} [arrays] The arrays to process.
     * @returns {Array} Returns the new array of grouped elements.
     * @example
     *
     * _.zip(['fred', 'barney'], [30, 40], [true, false]);
     * // => [['fred', 30, true], ['barney', 40, false]]
     */
    var zip = restParam(unzip);

    /**
     * The inverse of `_.pairs`; this method returns an object composed from arrays
     * of property names and values. Provide either a single two dimensional array,
     * e.g. `[[key1, value1], [key2, value2]]` or two arrays, one of property names
     * and one of corresponding values.
     *
     * @static
     * @memberOf _
     * @alias object
     * @category Array
     * @param {Array} props The property names.
     * @param {Array} [values=[]] The property values.
     * @returns {Object} Returns the new object.
     * @example
     *
     * _.zipObject([['fred', 30], ['barney', 40]]);
     * // => { 'fred': 30, 'barney': 40 }
     *
     * _.zipObject(['fred', 'barney'], [30, 40]);
     * // => { 'fred': 30, 'barney': 40 }
     */
    function zipObject(props, values) {
      var index = -1,
          length = props ? props.length : 0,
          result = {};

      if (length && !values && !isArray(props[0])) {
        values = [];
      }
      while (++index < length) {
        var key = props[index];
        if (values) {
          result[key] = values[index];
        } else if (key) {
          result[key[0]] = key[1];
        }
      }
      return result;
    }

    /**
     * This method is like `_.zip` except that it accepts an iteratee to specify
     * how grouped values should be combined. The `iteratee` is bound to `thisArg`
     * and invoked with four arguments: (accumulator, value, index, group).
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {...Array} [arrays] The arrays to process.
     * @param {Function} [iteratee] The function to combine grouped values.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Array} Returns the new array of grouped elements.
     * @example
     *
     * _.zipWith([1, 2], [10, 20], [100, 200], _.add);
     * // => [111, 222]
     */
    var zipWith = restParam(function(arrays) {
      var length = arrays.length,
          iteratee = length > 2 ? arrays[length - 2] : undefined,
          thisArg = length > 1 ? arrays[length - 1] : undefined;

      if (length > 2 && typeof iteratee == 'function') {
        length -= 2;
      } else {
        iteratee = (length > 1 && typeof thisArg == 'function') ? (--length, thisArg) : undefined;
        thisArg = undefined;
      }
      arrays.length = length;
      return unzipWith(arrays, iteratee, thisArg);
    });

    /*------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object that wraps `value` with explicit method
     * chaining enabled.
     *
     * @static
     * @memberOf _
     * @category Chain
     * @param {*} value The value to wrap.
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'age': 36 },
     *   { 'user': 'fred',    'age': 40 },
     *   { 'user': 'pebbles', 'age': 1 }
     * ];
     *
     * var youngest = _.chain(users)
     *   .sortBy('age')
     *   .map(function(chr) {
     *     return chr.user + ' is ' + chr.age;
     *   })
     *   .first()
     *   .value();
     * // => 'pebbles is 1'
     */
    function chain(value) {
      var result = lodash(value);
      result.__chain__ = true;
      return result;
    }

    /**
     * This method invokes `interceptor` and returns `value`. The interceptor is
     * bound to `thisArg` and invoked with one argument; (value). The purpose of
     * this method is to "tap into" a method chain in order to perform operations
     * on intermediate results within the chain.
     *
     * @static
     * @memberOf _
     * @category Chain
     * @param {*} value The value to provide to `interceptor`.
     * @param {Function} interceptor The function to invoke.
     * @param {*} [thisArg] The `this` binding of `interceptor`.
     * @returns {*} Returns `value`.
     * @example
     *
     * _([1, 2, 3])
     *  .tap(function(array) {
     *    array.pop();
     *  })
     *  .reverse()
     *  .value();
     * // => [2, 1]
     */
    function tap(value, interceptor, thisArg) {
      interceptor.call(thisArg, value);
      return value;
    }

    /**
     * This method is like `_.tap` except that it returns the result of `interceptor`.
     *
     * @static
     * @memberOf _
     * @category Chain
     * @param {*} value The value to provide to `interceptor`.
     * @param {Function} interceptor The function to invoke.
     * @param {*} [thisArg] The `this` binding of `interceptor`.
     * @returns {*} Returns the result of `interceptor`.
     * @example
     *
     * _('  abc  ')
     *  .chain()
     *  .trim()
     *  .thru(function(value) {
     *    return [value];
     *  })
     *  .value();
     * // => ['abc']
     */
    function thru(value, interceptor, thisArg) {
      return interceptor.call(thisArg, value);
    }

    /**
     * Enables explicit method chaining on the wrapper object.
     *
     * @name chain
     * @memberOf _
     * @category Chain
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36 },
     *   { 'user': 'fred',   'age': 40 }
     * ];
     *
     * // without explicit chaining
     * _(users).first();
     * // => { 'user': 'barney', 'age': 36 }
     *
     * // with explicit chaining
     * _(users).chain()
     *   .first()
     *   .pick('user')
     *   .value();
     * // => { 'user': 'barney' }
     */
    function wrapperChain() {
      return chain(this);
    }

    /**
     * Executes the chained sequence and returns the wrapped result.
     *
     * @name commit
     * @memberOf _
     * @category Chain
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * var array = [1, 2];
     * var wrapped = _(array).push(3);
     *
     * console.log(array);
     * // => [1, 2]
     *
     * wrapped = wrapped.commit();
     * console.log(array);
     * // => [1, 2, 3]
     *
     * wrapped.last();
     * // => 3
     *
     * console.log(array);
     * // => [1, 2, 3]
     */
    function wrapperCommit() {
      return new LodashWrapper(this.value(), this.__chain__);
    }

    /**
     * Creates a new array joining a wrapped array with any additional arrays
     * and/or values.
     *
     * @name concat
     * @memberOf _
     * @category Chain
     * @param {...*} [values] The values to concatenate.
     * @returns {Array} Returns the new concatenated array.
     * @example
     *
     * var array = [1];
     * var wrapped = _(array).concat(2, [3], [[4]]);
     *
     * console.log(wrapped.value());
     * // => [1, 2, 3, [4]]
     *
     * console.log(array);
     * // => [1]
     */
    var wrapperConcat = restParam(function(values) {
      values = baseFlatten(values);
      return this.thru(function(array) {
        return arrayConcat(isArray(array) ? array : [toObject(array)], values);
      });
    });

    /**
     * Creates a clone of the chained sequence planting `value` as the wrapped value.
     *
     * @name plant
     * @memberOf _
     * @category Chain
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * var array = [1, 2];
     * var wrapped = _(array).map(function(value) {
     *   return Math.pow(value, 2);
     * });
     *
     * var other = [3, 4];
     * var otherWrapped = wrapped.plant(other);
     *
     * otherWrapped.value();
     * // => [9, 16]
     *
     * wrapped.value();
     * // => [1, 4]
     */
    function wrapperPlant(value) {
      var result,
          parent = this;

      while (parent instanceof baseLodash) {
        var clone = wrapperClone(parent);
        if (result) {
          previous.__wrapped__ = clone;
        } else {
          result = clone;
        }
        var previous = clone;
        parent = parent.__wrapped__;
      }
      previous.__wrapped__ = value;
      return result;
    }

    /**
     * Reverses the wrapped array so the first element becomes the last, the
     * second element becomes the second to last, and so on.
     *
     * **Note:** This method mutates the wrapped array.
     *
     * @name reverse
     * @memberOf _
     * @category Chain
     * @returns {Object} Returns the new reversed `lodash` wrapper instance.
     * @example
     *
     * var array = [1, 2, 3];
     *
     * _(array).reverse().value()
     * // => [3, 2, 1]
     *
     * console.log(array);
     * // => [3, 2, 1]
     */
    function wrapperReverse() {
      var value = this.__wrapped__;

      var interceptor = function(value) {
        return (wrapped && wrapped.__dir__ < 0) ? value : value.reverse();
      };
      if (value instanceof LazyWrapper) {
        var wrapped = value;
        if (this.__actions__.length) {
          wrapped = new LazyWrapper(this);
        }
        wrapped = wrapped.reverse();
        wrapped.__actions__.push({ 'func': thru, 'args': [interceptor], 'thisArg': undefined });
        return new LodashWrapper(wrapped, this.__chain__);
      }
      return this.thru(interceptor);
    }

    /**
     * Produces the result of coercing the unwrapped value to a string.
     *
     * @name toString
     * @memberOf _
     * @category Chain
     * @returns {string} Returns the coerced string value.
     * @example
     *
     * _([1, 2, 3]).toString();
     * // => '1,2,3'
     */
    function wrapperToString() {
      return (this.value() + '');
    }

    /**
     * Executes the chained sequence to extract the unwrapped value.
     *
     * @name value
     * @memberOf _
     * @alias run, toJSON, valueOf
     * @category Chain
     * @returns {*} Returns the resolved unwrapped value.
     * @example
     *
     * _([1, 2, 3]).value();
     * // => [1, 2, 3]
     */
    function wrapperValue() {
      return baseWrapperValue(this.__wrapped__, this.__actions__);
    }

    /*------------------------------------------------------------------------*/

    /**
     * Creates an array of elements corresponding to the given keys, or indexes,
     * of `collection`. Keys may be specified as individual arguments or as arrays
     * of keys.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {...(number|number[]|string|string[])} [props] The property names
     *  or indexes of elements to pick, specified individually or in arrays.
     * @returns {Array} Returns the new array of picked elements.
     * @example
     *
     * _.at(['a', 'b', 'c'], [0, 2]);
     * // => ['a', 'c']
     *
     * _.at(['barney', 'fred', 'pebbles'], 0, 2);
     * // => ['barney', 'pebbles']
     */
    var at = restParam(function(collection, props) {
      return baseAt(collection, baseFlatten(props));
    });

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` through `iteratee`. The corresponding value
     * of each key is the number of times the key was returned by `iteratee`.
     * The `iteratee` is bound to `thisArg` and invoked with three arguments:
     * (value, index|key, collection).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.countBy([4.3, 6.1, 6.4], function(n) {
     *   return Math.floor(n);
     * });
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy([4.3, 6.1, 6.4], function(n) {
     *   return this.floor(n);
     * }, Math);
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy(['one', 'two', 'three'], 'length');
     * // => { '3': 2, '5': 1 }
     */
    var countBy = createAggregator(function(result, value, key) {
      hasOwnProperty.call(result, key) ? ++result[key] : (result[key] = 1);
    });

    /**
     * Checks if `predicate` returns truthy for **all** elements of `collection`.
     * The predicate is bound to `thisArg` and invoked with three arguments:
     * (value, index|key, collection).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @alias all
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {boolean} Returns `true` if all elements pass the predicate check,
     *  else `false`.
     * @example
     *
     * _.every([true, 1, null, 'yes'], Boolean);
     * // => false
     *
     * var users = [
     *   { 'user': 'barney', 'active': false },
     *   { 'user': 'fred',   'active': false }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.every(users, { 'user': 'barney', 'active': false });
     * // => false
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.every(users, 'active', false);
     * // => true
     *
     * // using the `_.property` callback shorthand
     * _.every(users, 'active');
     * // => false
     */
    function every(collection, predicate, thisArg) {
      var func = isArray(collection) ? arrayEvery : baseEvery;
      if (thisArg && isIterateeCall(collection, predicate, thisArg)) {
        predicate = undefined;
      }
      if (typeof predicate != 'function' || thisArg !== undefined) {
        predicate = getCallback(predicate, thisArg, 3);
      }
      return func(collection, predicate);
    }

    /**
     * Iterates over elements of `collection`, returning an array of all elements
     * `predicate` returns truthy for. The predicate is bound to `thisArg` and
     * invoked with three arguments: (value, index|key, collection).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @alias select
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the new filtered array.
     * @example
     *
     * _.filter([4, 5, 6], function(n) {
     *   return n % 2 == 0;
     * });
     * // => [4, 6]
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36, 'active': true },
     *   { 'user': 'fred',   'age': 40, 'active': false }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.pluck(_.filter(users, { 'age': 36, 'active': true }), 'user');
     * // => ['barney']
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.pluck(_.filter(users, 'active', false), 'user');
     * // => ['fred']
     *
     * // using the `_.property` callback shorthand
     * _.pluck(_.filter(users, 'active'), 'user');
     * // => ['barney']
     */
    function filter(collection, predicate, thisArg) {
      var func = isArray(collection) ? arrayFilter : baseFilter;
      predicate = getCallback(predicate, thisArg, 3);
      return func(collection, predicate);
    }

    /**
     * Iterates over elements of `collection`, returning the first element
     * `predicate` returns truthy for. The predicate is bound to `thisArg` and
     * invoked with three arguments: (value, index|key, collection).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @alias detect
     * @category Collection
     * @param {Array|Object|string} collection The collection to search.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {*} Returns the matched element, else `undefined`.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'age': 36, 'active': true },
     *   { 'user': 'fred',    'age': 40, 'active': false },
     *   { 'user': 'pebbles', 'age': 1,  'active': true }
     * ];
     *
     * _.result(_.find(users, function(chr) {
     *   return chr.age < 40;
     * }), 'user');
     * // => 'barney'
     *
     * // using the `_.matches` callback shorthand
     * _.result(_.find(users, { 'age': 1, 'active': true }), 'user');
     * // => 'pebbles'
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.result(_.find(users, 'active', false), 'user');
     * // => 'fred'
     *
     * // using the `_.property` callback shorthand
     * _.result(_.find(users, 'active'), 'user');
     * // => 'barney'
     */
    var find = createFind(baseEach);

    /**
     * This method is like `_.find` except that it iterates over elements of
     * `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to search.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {*} Returns the matched element, else `undefined`.
     * @example
     *
     * _.findLast([1, 2, 3, 4], function(n) {
     *   return n % 2 == 1;
     * });
     * // => 3
     */
    var findLast = createFind(baseEachRight, true);

    /**
     * Performs a deep comparison between each element in `collection` and the
     * source object, returning the first element that has equivalent property
     * values.
     *
     * **Note:** This method supports comparing arrays, booleans, `Date` objects,
     * numbers, `Object` objects, regexes, and strings. Objects are compared by
     * their own, not inherited, enumerable properties. For comparing a single
     * own or inherited property value see `_.matchesProperty`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to search.
     * @param {Object} source The object of property values to match.
     * @returns {*} Returns the matched element, else `undefined`.
     * @example
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36, 'active': true },
     *   { 'user': 'fred',   'age': 40, 'active': false }
     * ];
     *
     * _.result(_.findWhere(users, { 'age': 36, 'active': true }), 'user');
     * // => 'barney'
     *
     * _.result(_.findWhere(users, { 'age': 40, 'active': false }), 'user');
     * // => 'fred'
     */
    function findWhere(collection, source) {
      return find(collection, baseMatches(source));
    }

    /**
     * Iterates over elements of `collection` invoking `iteratee` for each element.
     * The `iteratee` is bound to `thisArg` and invoked with three arguments:
     * (value, index|key, collection). Iteratee functions may exit iteration early
     * by explicitly returning `false`.
     *
     * **Note:** As with other "Collections" methods, objects with a "length" property
     * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
     * may be used for object iteration.
     *
     * @static
     * @memberOf _
     * @alias each
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2]).forEach(function(n) {
     *   console.log(n);
     * }).value();
     * // => logs each value from left to right and returns the array
     *
     * _.forEach({ 'a': 1, 'b': 2 }, function(n, key) {
     *   console.log(n, key);
     * });
     * // => logs each value-key pair and returns the object (iteration order is not guaranteed)
     */
    var forEach = createForEach(arrayEach, baseEach);

    /**
     * This method is like `_.forEach` except that it iterates over elements of
     * `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias eachRight
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2]).forEachRight(function(n) {
     *   console.log(n);
     * }).value();
     * // => logs each value from right to left and returns the array
     */
    var forEachRight = createForEach(arrayEachRight, baseEachRight);

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` through `iteratee`. The corresponding value
     * of each key is an array of the elements responsible for generating the key.
     * The `iteratee` is bound to `thisArg` and invoked with three arguments:
     * (value, index|key, collection).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.groupBy([4.2, 6.1, 6.4], function(n) {
     *   return Math.floor(n);
     * });
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * _.groupBy([4.2, 6.1, 6.4], function(n) {
     *   return this.floor(n);
     * }, Math);
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * // using the `_.property` callback shorthand
     * _.groupBy(['one', 'two', 'three'], 'length');
     * // => { '3': ['one', 'two'], '5': ['three'] }
     */
    var groupBy = createAggregator(function(result, value, key) {
      if (hasOwnProperty.call(result, key)) {
        result[key].push(value);
      } else {
        result[key] = [value];
      }
    });

    /**
     * Checks if `value` is in `collection` using
     * [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
     * for equality comparisons. If `fromIndex` is negative, it is used as the offset
     * from the end of `collection`.
     *
     * @static
     * @memberOf _
     * @alias contains, include
     * @category Collection
     * @param {Array|Object|string} collection The collection to search.
     * @param {*} target The value to search for.
     * @param {number} [fromIndex=0] The index to search from.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.reduce`.
     * @returns {boolean} Returns `true` if a matching element is found, else `false`.
     * @example
     *
     * _.includes([1, 2, 3], 1);
     * // => true
     *
     * _.includes([1, 2, 3], 1, 2);
     * // => false
     *
     * _.includes({ 'user': 'fred', 'age': 40 }, 'fred');
     * // => true
     *
     * _.includes('pebbles', 'eb');
     * // => true
     */
    function includes(collection, target, fromIndex, guard) {
      var length = collection ? getLength(collection) : 0;
      if (!isLength(length)) {
        collection = values(collection);
        length = collection.length;
      }
      if (typeof fromIndex != 'number' || (guard && isIterateeCall(target, fromIndex, guard))) {
        fromIndex = 0;
      } else {
        fromIndex = fromIndex < 0 ? nativeMax(length + fromIndex, 0) : (fromIndex || 0);
      }
      return (typeof collection == 'string' || !isArray(collection) && isString(collection))
        ? (fromIndex <= length && collection.indexOf(target, fromIndex) > -1)
        : (!!length && getIndexOf(collection, target, fromIndex) > -1);
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` through `iteratee`. The corresponding value
     * of each key is the last element responsible for generating the key. The
     * iteratee function is bound to `thisArg` and invoked with three arguments:
     * (value, index|key, collection).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * var keyData = [
     *   { 'dir': 'left', 'code': 97 },
     *   { 'dir': 'right', 'code': 100 }
     * ];
     *
     * _.indexBy(keyData, 'dir');
     * // => { 'left': { 'dir': 'left', 'code': 97 }, 'right': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(keyData, function(object) {
     *   return String.fromCharCode(object.code);
     * });
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(keyData, function(object) {
     *   return this.fromCharCode(object.code);
     * }, String);
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     */
    var indexBy = createAggregator(function(result, value, key) {
      result[key] = value;
    });

    /**
     * Invokes the method at `path` of each element in `collection`, returning
     * an array of the results of each invoked method. Any additional arguments
     * are provided to each invoked method. If `methodName` is a function it is
     * invoked for, and `this` bound to, each element in `collection`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Array|Function|string} path The path of the method to invoke or
     *  the function invoked per iteration.
     * @param {...*} [args] The arguments to invoke the method with.
     * @returns {Array} Returns the array of results.
     * @example
     *
     * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');
     * // => [[1, 5, 7], [1, 2, 3]]
     *
     * _.invoke([123, 456], String.prototype.split, '');
     * // => [['1', '2', '3'], ['4', '5', '6']]
     */
    var invoke = restParam(function(collection, path, args) {
      var index = -1,
          isFunc = typeof path == 'function',
          isProp = isKey(path),
          result = isArrayLike(collection) ? Array(collection.length) : [];

      baseEach(collection, function(value) {
        var func = isFunc ? path : ((isProp && value != null) ? value[path] : undefined);
        result[++index] = func ? func.apply(value, args) : invokePath(value, path, args);
      });
      return result;
    });

    /**
     * Creates an array of values by running each element in `collection` through
     * `iteratee`. The `iteratee` is bound to `thisArg` and invoked with three
     * arguments: (value, index|key, collection).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * Many lodash methods are guarded to work as iteratees for methods like
     * `_.every`, `_.filter`, `_.map`, `_.mapValues`, `_.reject`, and `_.some`.
     *
     * The guarded methods are:
     * `ary`, `callback`, `chunk`, `clone`, `create`, `curry`, `curryRight`,
     * `drop`, `dropRight`, `every`, `fill`, `flatten`, `invert`, `max`, `min`,
     * `parseInt`, `slice`, `sortBy`, `take`, `takeRight`, `template`, `trim`,
     * `trimLeft`, `trimRight`, `trunc`, `random`, `range`, `sample`, `some`,
     * `sum`, `uniq`, and `words`
     *
     * @static
     * @memberOf _
     * @alias collect
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Array} Returns the new mapped array.
     * @example
     *
     * function timesThree(n) {
     *   return n * 3;
     * }
     *
     * _.map([1, 2], timesThree);
     * // => [3, 6]
     *
     * _.map({ 'a': 1, 'b': 2 }, timesThree);
     * // => [3, 6] (iteration order is not guaranteed)
     *
     * var users = [
     *   { 'user': 'barney' },
     *   { 'user': 'fred' }
     * ];
     *
     * // using the `_.property` callback shorthand
     * _.map(users, 'user');
     * // => ['barney', 'fred']
     */
    function map(collection, iteratee, thisArg) {
      var func = isArray(collection) ? arrayMap : baseMap;
      iteratee = getCallback(iteratee, thisArg, 3);
      return func(collection, iteratee);
    }

    /**
     * Creates an array of elements split into two groups, the first of which
     * contains elements `predicate` returns truthy for, while the second of which
     * contains elements `predicate` returns falsey for. The predicate is bound
     * to `thisArg` and invoked with three arguments: (value, index|key, collection).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the array of grouped elements.
     * @example
     *
     * _.partition([1, 2, 3], function(n) {
     *   return n % 2;
     * });
     * // => [[1, 3], [2]]
     *
     * _.partition([1.2, 2.3, 3.4], function(n) {
     *   return this.floor(n) % 2;
     * }, Math);
     * // => [[1.2, 3.4], [2.3]]
     *
     * var users = [
     *   { 'user': 'barney',  'age': 36, 'active': false },
     *   { 'user': 'fred',    'age': 40, 'active': true },
     *   { 'user': 'pebbles', 'age': 1,  'active': false }
     * ];
     *
     * var mapper = function(array) {
     *   return _.pluck(array, 'user');
     * };
     *
     * // using the `_.matches` callback shorthand
     * _.map(_.partition(users, { 'age': 1, 'active': false }), mapper);
     * // => [['pebbles'], ['barney', 'fred']]
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.map(_.partition(users, 'active', false), mapper);
     * // => [['barney', 'pebbles'], ['fred']]
     *
     * // using the `_.property` callback shorthand
     * _.map(_.partition(users, 'active'), mapper);
     * // => [['fred'], ['barney', 'pebbles']]
     */
    var partition = createAggregator(function(result, value, key) {
      result[key ? 0 : 1].push(value);
    }, function() { return [[], []]; });

    /**
     * Gets the property value of `path` from all elements in `collection`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Array|string} path The path of the property to pluck.
     * @returns {Array} Returns the property values.
     * @example
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36 },
     *   { 'user': 'fred',   'age': 40 }
     * ];
     *
     * _.pluck(users, 'user');
     * // => ['barney', 'fred']
     *
     * var userIndex = _.indexBy(users, 'user');
     * _.pluck(userIndex, 'age');
     * // => [36, 40] (iteration order is not guaranteed)
     */
    function pluck(collection, path) {
      return map(collection, property(path));
    }

    /**
     * Reduces `collection` to a value which is the accumulated result of running
     * each element in `collection` through `iteratee`, where each successive
     * invocation is supplied the return value of the previous. If `accumulator`
     * is not provided the first element of `collection` is used as the initial
     * value. The `iteratee` is bound to `thisArg` and invoked with four arguments:
     * (accumulator, value, index|key, collection).
     *
     * Many lodash methods are guarded to work as iteratees for methods like
     * `_.reduce`, `_.reduceRight`, and `_.transform`.
     *
     * The guarded methods are:
     * `assign`, `defaults`, `defaultsDeep`, `includes`, `merge`, `sortByAll`,
     * and `sortByOrder`
     *
     * @static
     * @memberOf _
     * @alias foldl, inject
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [accumulator] The initial value.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * _.reduce([1, 2], function(total, n) {
     *   return total + n;
     * });
     * // => 3
     *
     * _.reduce({ 'a': 1, 'b': 2 }, function(result, n, key) {
     *   result[key] = n * 3;
     *   return result;
     * }, {});
     * // => { 'a': 3, 'b': 6 } (iteration order is not guaranteed)
     */
    var reduce = createReduce(arrayReduce, baseEach);

    /**
     * This method is like `_.reduce` except that it iterates over elements of
     * `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias foldr
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [accumulator] The initial value.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var array = [[0, 1], [2, 3], [4, 5]];
     *
     * _.reduceRight(array, function(flattened, other) {
     *   return flattened.concat(other);
     * }, []);
     * // => [4, 5, 2, 3, 0, 1]
     */
    var reduceRight = createReduce(arrayReduceRight, baseEachRight);

    /**
     * The opposite of `_.filter`; this method returns the elements of `collection`
     * that `predicate` does **not** return truthy for.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the new filtered array.
     * @example
     *
     * _.reject([1, 2, 3, 4], function(n) {
     *   return n % 2 == 0;
     * });
     * // => [1, 3]
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36, 'active': false },
     *   { 'user': 'fred',   'age': 40, 'active': true }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.pluck(_.reject(users, { 'age': 40, 'active': true }), 'user');
     * // => ['barney']
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.pluck(_.reject(users, 'active', false), 'user');
     * // => ['fred']
     *
     * // using the `_.property` callback shorthand
     * _.pluck(_.reject(users, 'active'), 'user');
     * // => ['barney']
     */
    function reject(collection, predicate, thisArg) {
      var func = isArray(collection) ? arrayFilter : baseFilter;
      predicate = getCallback(predicate, thisArg, 3);
      return func(collection, function(value, index, collection) {
        return !predicate(value, index, collection);
      });
    }

    /**
     * Gets a random element or `n` random elements from a collection.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to sample.
     * @param {number} [n] The number of elements to sample.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {*} Returns the random sample(s).
     * @example
     *
     * _.sample([1, 2, 3, 4]);
     * // => 2
     *
     * _.sample([1, 2, 3, 4], 2);
     * // => [3, 1]
     */
    function sample(collection, n, guard) {
      if (guard ? isIterateeCall(collection, n, guard) : n == null) {
        collection = toIterable(collection);
        var length = collection.length;
        return length > 0 ? collection[baseRandom(0, length - 1)] : undefined;
      }
      var index = -1,
          result = toArray(collection),
          length = result.length,
          lastIndex = length - 1;

      n = nativeMin(n < 0 ? 0 : (+n || 0), length);
      while (++index < n) {
        var rand = baseRandom(index, lastIndex),
            value = result[rand];

        result[rand] = result[index];
        result[index] = value;
      }
      result.length = n;
      return result;
    }

    /**
     * Creates an array of shuffled values, using a version of the
     * [Fisher-Yates shuffle](https://en.wikipedia.org/wiki/Fisher-Yates_shuffle).
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to shuffle.
     * @returns {Array} Returns the new shuffled array.
     * @example
     *
     * _.shuffle([1, 2, 3, 4]);
     * // => [4, 1, 3, 2]
     */
    function shuffle(collection) {
      return sample(collection, POSITIVE_INFINITY);
    }

    /**
     * Gets the size of `collection` by returning its length for array-like
     * values or the number of own enumerable properties for objects.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to inspect.
     * @returns {number} Returns the size of `collection`.
     * @example
     *
     * _.size([1, 2, 3]);
     * // => 3
     *
     * _.size({ 'a': 1, 'b': 2 });
     * // => 2
     *
     * _.size('pebbles');
     * // => 7
     */
    function size(collection) {
      var length = collection ? getLength(collection) : 0;
      return isLength(length) ? length : keys(collection).length;
    }

    /**
     * Checks if `predicate` returns truthy for **any** element of `collection`.
     * The function returns as soon as it finds a passing value and does not iterate
     * over the entire collection. The predicate is bound to `thisArg` and invoked
     * with three arguments: (value, index|key, collection).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @alias any
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {boolean} Returns `true` if any element passes the predicate check,
     *  else `false`.
     * @example
     *
     * _.some([null, 0, 'yes', false], Boolean);
     * // => true
     *
     * var users = [
     *   { 'user': 'barney', 'active': true },
     *   { 'user': 'fred',   'active': false }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.some(users, { 'user': 'barney', 'active': false });
     * // => false
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.some(users, 'active', false);
     * // => true
     *
     * // using the `_.property` callback shorthand
     * _.some(users, 'active');
     * // => true
     */
    function some(collection, predicate, thisArg) {
      var func = isArray(collection) ? arraySome : baseSome;
      if (thisArg && isIterateeCall(collection, predicate, thisArg)) {
        predicate = undefined;
      }
      if (typeof predicate != 'function' || thisArg !== undefined) {
        predicate = getCallback(predicate, thisArg, 3);
      }
      return func(collection, predicate);
    }

    /**
     * Creates an array of elements, sorted in ascending order by the results of
     * running each element in a collection through `iteratee`. This method performs
     * a stable sort, that is, it preserves the original sort order of equal elements.
     * The `iteratee` is bound to `thisArg` and invoked with three arguments:
     * (value, index|key, collection).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Array} Returns the new sorted array.
     * @example
     *
     * _.sortBy([1, 2, 3], function(n) {
     *   return Math.sin(n);
     * });
     * // => [3, 1, 2]
     *
     * _.sortBy([1, 2, 3], function(n) {
     *   return this.sin(n);
     * }, Math);
     * // => [3, 1, 2]
     *
     * var users = [
     *   { 'user': 'fred' },
     *   { 'user': 'pebbles' },
     *   { 'user': 'barney' }
     * ];
     *
     * // using the `_.property` callback shorthand
     * _.pluck(_.sortBy(users, 'user'), 'user');
     * // => ['barney', 'fred', 'pebbles']
     */
    function sortBy(collection, iteratee, thisArg) {
      if (collection == null) {
        return [];
      }
      if (thisArg && isIterateeCall(collection, iteratee, thisArg)) {
        iteratee = undefined;
      }
      var index = -1;
      iteratee = getCallback(iteratee, thisArg, 3);

      var result = baseMap(collection, function(value, key, collection) {
        return { 'criteria': iteratee(value, key, collection), 'index': ++index, 'value': value };
      });
      return baseSortBy(result, compareAscending);
    }

    /**
     * This method is like `_.sortBy` except that it can sort by multiple iteratees
     * or property names.
     *
     * If a property name is provided for an iteratee the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If an object is provided for an iteratee the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {...(Function|Function[]|Object|Object[]|string|string[])} iteratees
     *  The iteratees to sort by, specified as individual values or arrays of values.
     * @returns {Array} Returns the new sorted array.
     * @example
     *
     * var users = [
     *   { 'user': 'fred',   'age': 48 },
     *   { 'user': 'barney', 'age': 36 },
     *   { 'user': 'fred',   'age': 42 },
     *   { 'user': 'barney', 'age': 34 }
     * ];
     *
     * _.map(_.sortByAll(users, ['user', 'age']), _.values);
     * // => [['barney', 34], ['barney', 36], ['fred', 42], ['fred', 48]]
     *
     * _.map(_.sortByAll(users, 'user', function(chr) {
     *   return Math.floor(chr.age / 10);
     * }), _.values);
     * // => [['barney', 36], ['barney', 34], ['fred', 48], ['fred', 42]]
     */
    var sortByAll = restParam(function(collection, iteratees) {
      if (collection == null) {
        return [];
      }
      var guard = iteratees[2];
      if (guard && isIterateeCall(iteratees[0], iteratees[1], guard)) {
        iteratees.length = 1;
      }
      return baseSortByOrder(collection, baseFlatten(iteratees), []);
    });

    /**
     * This method is like `_.sortByAll` except that it allows specifying the
     * sort orders of the iteratees to sort by. If `orders` is unspecified, all
     * values are sorted in ascending order. Otherwise, a value is sorted in
     * ascending order if its corresponding order is "asc", and descending if "desc".
     *
     * If a property name is provided for an iteratee the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If an object is provided for an iteratee the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function[]|Object[]|string[]} iteratees The iteratees to sort by.
     * @param {boolean[]} [orders] The sort orders of `iteratees`.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.reduce`.
     * @returns {Array} Returns the new sorted array.
     * @example
     *
     * var users = [
     *   { 'user': 'fred',   'age': 48 },
     *   { 'user': 'barney', 'age': 34 },
     *   { 'user': 'fred',   'age': 42 },
     *   { 'user': 'barney', 'age': 36 }
     * ];
     *
     * // sort by `user` in ascending order and by `age` in descending order
     * _.map(_.sortByOrder(users, ['user', 'age'], ['asc', 'desc']), _.values);
     * // => [['barney', 36], ['barney', 34], ['fred', 48], ['fred', 42]]
     */
    function sortByOrder(collection, iteratees, orders, guard) {
      if (collection == null) {
        return [];
      }
      if (guard && isIterateeCall(iteratees, orders, guard)) {
        orders = undefined;
      }
      if (!isArray(iteratees)) {
        iteratees = iteratees == null ? [] : [iteratees];
      }
      if (!isArray(orders)) {
        orders = orders == null ? [] : [orders];
      }
      return baseSortByOrder(collection, iteratees, orders);
    }

    /**
     * Performs a deep comparison between each element in `collection` and the
     * source object, returning an array of all elements that have equivalent
     * property values.
     *
     * **Note:** This method supports comparing arrays, booleans, `Date` objects,
     * numbers, `Object` objects, regexes, and strings. Objects are compared by
     * their own, not inherited, enumerable properties. For comparing a single
     * own or inherited property value see `_.matchesProperty`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to search.
     * @param {Object} source The object of property values to match.
     * @returns {Array} Returns the new filtered array.
     * @example
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36, 'active': false, 'pets': ['hoppy'] },
     *   { 'user': 'fred',   'age': 40, 'active': true, 'pets': ['baby puss', 'dino'] }
     * ];
     *
     * _.pluck(_.where(users, { 'age': 36, 'active': false }), 'user');
     * // => ['barney']
     *
     * _.pluck(_.where(users, { 'pets': ['dino'] }), 'user');
     * // => ['fred']
     */
    function where(collection, source) {
      return filter(collection, baseMatches(source));
    }

    /*------------------------------------------------------------------------*/

    /**
     * Gets the number of milliseconds that have elapsed since the Unix epoch
     * (1 January 1970 00:00:00 UTC).
     *
     * @static
     * @memberOf _
     * @category Date
     * @example
     *
     * _.defer(function(stamp) {
     *   console.log(_.now() - stamp);
     * }, _.now());
     * // => logs the number of milliseconds it took for the deferred function to be invoked
     */
    var now = nativeNow || function() {
      return new Date().getTime();
    };

    /*------------------------------------------------------------------------*/

    /**
     * The opposite of `_.before`; this method creates a function that invokes
     * `func` once it is called `n` or more times.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {number} n The number of calls before `func` is invoked.
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var saves = ['profile', 'settings'];
     *
     * var done = _.after(saves.length, function() {
     *   console.log('done saving!');
     * });
     *
     * _.forEach(saves, function(type) {
     *   asyncSave({ 'type': type, 'complete': done });
     * });
     * // => logs 'done saving!' after the two async saves have completed
     */
    function after(n, func) {
      if (typeof func != 'function') {
        if (typeof n == 'function') {
          var temp = n;
          n = func;
          func = temp;
        } else {
          throw new TypeError(FUNC_ERROR_TEXT);
        }
      }
      n = nativeIsFinite(n = +n) ? n : 0;
      return function() {
        if (--n < 1) {
          return func.apply(this, arguments);
        }
      };
    }

    /**
     * Creates a function that accepts up to `n` arguments ignoring any
     * additional arguments.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to cap arguments for.
     * @param {number} [n=func.length] The arity cap.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Function} Returns the new function.
     * @example
     *
     * _.map(['6', '8', '10'], _.ary(parseInt, 1));
     * // => [6, 8, 10]
     */
    function ary(func, n, guard) {
      if (guard && isIterateeCall(func, n, guard)) {
        n = undefined;
      }
      n = (func && n == null) ? func.length : nativeMax(+n || 0, 0);
      return createWrapper(func, ARY_FLAG, undefined, undefined, undefined, undefined, n);
    }

    /**
     * Creates a function that invokes `func`, with the `this` binding and arguments
     * of the created function, while it is called less than `n` times. Subsequent
     * calls to the created function return the result of the last `func` invocation.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {number} n The number of calls at which `func` is no longer invoked.
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * jQuery('#add').on('click', _.before(5, addContactToList));
     * // => allows adding up to 4 contacts to the list
     */
    function before(n, func) {
      var result;
      if (typeof func != 'function') {
        if (typeof n == 'function') {
          var temp = n;
          n = func;
          func = temp;
        } else {
          throw new TypeError(FUNC_ERROR_TEXT);
        }
      }
      return function() {
        if (--n > 0) {
          result = func.apply(this, arguments);
        }
        if (n <= 1) {
          func = undefined;
        }
        return result;
      };
    }

    /**
     * Creates a function that invokes `func` with the `this` binding of `thisArg`
     * and prepends any additional `_.bind` arguments to those provided to the
     * bound function.
     *
     * The `_.bind.placeholder` value, which defaults to `_` in monolithic builds,
     * may be used as a placeholder for partially applied arguments.
     *
     * **Note:** Unlike native `Function#bind` this method does not set the "length"
     * property of bound functions.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to bind.
     * @param {*} thisArg The `this` binding of `func`.
     * @param {...*} [partials] The arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var greet = function(greeting, punctuation) {
     *   return greeting + ' ' + this.user + punctuation;
     * };
     *
     * var object = { 'user': 'fred' };
     *
     * var bound = _.bind(greet, object, 'hi');
     * bound('!');
     * // => 'hi fred!'
     *
     * // using placeholders
     * var bound = _.bind(greet, object, _, '!');
     * bound('hi');
     * // => 'hi fred!'
     */
    var bind = restParam(function(func, thisArg, partials) {
      var bitmask = BIND_FLAG;
      if (partials.length) {
        var holders = replaceHolders(partials, bind.placeholder);
        bitmask |= PARTIAL_FLAG;
      }
      return createWrapper(func, bitmask, thisArg, partials, holders);
    });

    /**
     * Binds methods of an object to the object itself, overwriting the existing
     * method. Method names may be specified as individual arguments or as arrays
     * of method names. If no method names are provided all enumerable function
     * properties, own and inherited, of `object` are bound.
     *
     * **Note:** This method does not set the "length" property of bound functions.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Object} object The object to bind and assign the bound methods to.
     * @param {...(string|string[])} [methodNames] The object method names to bind,
     *  specified as individual method names or arrays of method names.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var view = {
     *   'label': 'docs',
     *   'onClick': function() {
     *     console.log('clicked ' + this.label);
     *   }
     * };
     *
     * _.bindAll(view);
     * jQuery('#docs').on('click', view.onClick);
     * // => logs 'clicked docs' when the element is clicked
     */
    var bindAll = restParam(function(object, methodNames) {
      methodNames = methodNames.length ? baseFlatten(methodNames) : functions(object);

      var index = -1,
          length = methodNames.length;

      while (++index < length) {
        var key = methodNames[index];
        object[key] = createWrapper(object[key], BIND_FLAG, object);
      }
      return object;
    });

    /**
     * Creates a function that invokes the method at `object[key]` and prepends
     * any additional `_.bindKey` arguments to those provided to the bound function.
     *
     * This method differs from `_.bind` by allowing bound functions to reference
     * methods that may be redefined or don't yet exist.
     * See [Peter Michaux's article](http://peter.michaux.ca/articles/lazy-function-definition-pattern)
     * for more details.
     *
     * The `_.bindKey.placeholder` value, which defaults to `_` in monolithic
     * builds, may be used as a placeholder for partially applied arguments.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Object} object The object the method belongs to.
     * @param {string} key The key of the method.
     * @param {...*} [partials] The arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var object = {
     *   'user': 'fred',
     *   'greet': function(greeting, punctuation) {
     *     return greeting + ' ' + this.user + punctuation;
     *   }
     * };
     *
     * var bound = _.bindKey(object, 'greet', 'hi');
     * bound('!');
     * // => 'hi fred!'
     *
     * object.greet = function(greeting, punctuation) {
     *   return greeting + 'ya ' + this.user + punctuation;
     * };
     *
     * bound('!');
     * // => 'hiya fred!'
     *
     * // using placeholders
     * var bound = _.bindKey(object, 'greet', _, '!');
     * bound('hi');
     * // => 'hiya fred!'
     */
    var bindKey = restParam(function(object, key, partials) {
      var bitmask = BIND_FLAG | BIND_KEY_FLAG;
      if (partials.length) {
        var holders = replaceHolders(partials, bindKey.placeholder);
        bitmask |= PARTIAL_FLAG;
      }
      return createWrapper(key, bitmask, object, partials, holders);
    });

    /**
     * Creates a function that accepts one or more arguments of `func` that when
     * called either invokes `func` returning its result, if all `func` arguments
     * have been provided, or returns a function that accepts one or more of the
     * remaining `func` arguments, and so on. The arity of `func` may be specified
     * if `func.length` is not sufficient.
     *
     * The `_.curry.placeholder` value, which defaults to `_` in monolithic builds,
     * may be used as a placeholder for provided arguments.
     *
     * **Note:** This method does not set the "length" property of curried functions.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to curry.
     * @param {number} [arity=func.length] The arity of `func`.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Function} Returns the new curried function.
     * @example
     *
     * var abc = function(a, b, c) {
     *   return [a, b, c];
     * };
     *
     * var curried = _.curry(abc);
     *
     * curried(1)(2)(3);
     * // => [1, 2, 3]
     *
     * curried(1, 2)(3);
     * // => [1, 2, 3]
     *
     * curried(1, 2, 3);
     * // => [1, 2, 3]
     *
     * // using placeholders
     * curried(1)(_, 3)(2);
     * // => [1, 2, 3]
     */
    var curry = createCurry(CURRY_FLAG);

    /**
     * This method is like `_.curry` except that arguments are applied to `func`
     * in the manner of `_.partialRight` instead of `_.partial`.
     *
     * The `_.curryRight.placeholder` value, which defaults to `_` in monolithic
     * builds, may be used as a placeholder for provided arguments.
     *
     * **Note:** This method does not set the "length" property of curried functions.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to curry.
     * @param {number} [arity=func.length] The arity of `func`.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Function} Returns the new curried function.
     * @example
     *
     * var abc = function(a, b, c) {
     *   return [a, b, c];
     * };
     *
     * var curried = _.curryRight(abc);
     *
     * curried(3)(2)(1);
     * // => [1, 2, 3]
     *
     * curried(2, 3)(1);
     * // => [1, 2, 3]
     *
     * curried(1, 2, 3);
     * // => [1, 2, 3]
     *
     * // using placeholders
     * curried(3)(1, _)(2);
     * // => [1, 2, 3]
     */
    var curryRight = createCurry(CURRY_RIGHT_FLAG);

    /**
     * Creates a debounced function that delays invoking `func` until after `wait`
     * milliseconds have elapsed since the last time the debounced function was
     * invoked. The debounced function comes with a `cancel` method to cancel
     * delayed invocations. Provide an options object to indicate that `func`
     * should be invoked on the leading and/or trailing edge of the `wait` timeout.
     * Subsequent calls to the debounced function return the result of the last
     * `func` invocation.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is invoked
     * on the trailing edge of the timeout only if the the debounced function is
     * invoked more than once during the `wait` timeout.
     *
     * See [David Corbacho's article](http://drupalmotion.com/article/debounce-and-throttle-visual-explanation)
     * for details over the differences between `_.debounce` and `_.throttle`.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to debounce.
     * @param {number} [wait=0] The number of milliseconds to delay.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=false] Specify invoking on the leading
     *  edge of the timeout.
     * @param {number} [options.maxWait] The maximum time `func` is allowed to be
     *  delayed before it is invoked.
     * @param {boolean} [options.trailing=true] Specify invoking on the trailing
     *  edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // avoid costly calculations while the window size is in flux
     * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
     *
     * // invoke `sendMail` when the click event is fired, debouncing subsequent calls
     * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * }));
     *
     * // ensure `batchLog` is invoked once after 1 second of debounced calls
     * var source = new EventSource('/stream');
     * jQuery(source).on('message', _.debounce(batchLog, 250, {
     *   'maxWait': 1000
     * }));
     *
     * // cancel a debounced call
     * var todoChanges = _.debounce(batchLog, 1000);
     * Object.observe(models.todo, todoChanges);
     *
     * Object.observe(models, function(changes) {
     *   if (_.find(changes, { 'user': 'todo', 'type': 'delete'})) {
     *     todoChanges.cancel();
     *   }
     * }, ['delete']);
     *
     * // ...at some point `models.todo` is changed
     * models.todo.completed = true;
     *
     * // ...before 1 second has passed `models.todo` is deleted
     * // which cancels the debounced `todoChanges` call
     * delete models.todo;
     */
    function debounce(func, wait, options) {
      var args,
          maxTimeoutId,
          result,
          stamp,
          thisArg,
          timeoutId,
          trailingCall,
          lastCalled = 0,
          maxWait = false,
          trailing = true;

      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      wait = wait < 0 ? 0 : (+wait || 0);
      if (options === true) {
        var leading = true;
        trailing = false;
      } else if (isObject(options)) {
        leading = !!options.leading;
        maxWait = 'maxWait' in options && nativeMax(+options.maxWait || 0, wait);
        trailing = 'trailing' in options ? !!options.trailing : trailing;
      }

      function cancel() {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (maxTimeoutId) {
          clearTimeout(maxTimeoutId);
        }
        lastCalled = 0;
        maxTimeoutId = timeoutId = trailingCall = undefined;
      }

      function complete(isCalled, id) {
        if (id) {
          clearTimeout(id);
        }
        maxTimeoutId = timeoutId = trailingCall = undefined;
        if (isCalled) {
          lastCalled = now();
          result = func.apply(thisArg, args);
          if (!timeoutId && !maxTimeoutId) {
            args = thisArg = undefined;
          }
        }
      }

      function delayed() {
        var remaining = wait - (now() - stamp);
        if (remaining <= 0 || remaining > wait) {
          complete(trailingCall, maxTimeoutId);
        } else {
          timeoutId = setTimeout(delayed, remaining);
        }
      }

      function maxDelayed() {
        complete(trailing, timeoutId);
      }

      function debounced() {
        args = arguments;
        stamp = now();
        thisArg = this;
        trailingCall = trailing && (timeoutId || !leading);

        if (maxWait === false) {
          var leadingCall = leading && !timeoutId;
        } else {
          if (!maxTimeoutId && !leading) {
            lastCalled = stamp;
          }
          var remaining = maxWait - (stamp - lastCalled),
              isCalled = remaining <= 0 || remaining > maxWait;

          if (isCalled) {
            if (maxTimeoutId) {
              maxTimeoutId = clearTimeout(maxTimeoutId);
            }
            lastCalled = stamp;
            result = func.apply(thisArg, args);
          }
          else if (!maxTimeoutId) {
            maxTimeoutId = setTimeout(maxDelayed, remaining);
          }
        }
        if (isCalled && timeoutId) {
          timeoutId = clearTimeout(timeoutId);
        }
        else if (!timeoutId && wait !== maxWait) {
          timeoutId = setTimeout(delayed, wait);
        }
        if (leadingCall) {
          isCalled = true;
          result = func.apply(thisArg, args);
        }
        if (isCalled && !timeoutId && !maxTimeoutId) {
          args = thisArg = undefined;
        }
        return result;
      }
      debounced.cancel = cancel;
      return debounced;
    }

    /**
     * Defers invoking the `func` until the current call stack has cleared. Any
     * additional arguments are provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to defer.
     * @param {...*} [args] The arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.defer(function(text) {
     *   console.log(text);
     * }, 'deferred');
     * // logs 'deferred' after one or more milliseconds
     */
    var defer = restParam(function(func, args) {
      return baseDelay(func, 1, args);
    });

    /**
     * Invokes `func` after `wait` milliseconds. Any additional arguments are
     * provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to delay.
     * @param {number} wait The number of milliseconds to delay invocation.
     * @param {...*} [args] The arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.delay(function(text) {
     *   console.log(text);
     * }, 1000, 'later');
     * // => logs 'later' after one second
     */
    var delay = restParam(function(func, wait, args) {
      return baseDelay(func, wait, args);
    });

    /**
     * Creates a function that returns the result of invoking the provided
     * functions with the `this` binding of the created function, where each
     * successive invocation is supplied the return value of the previous.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {...Function} [funcs] Functions to invoke.
     * @returns {Function} Returns the new function.
     * @example
     *
     * function square(n) {
     *   return n * n;
     * }
     *
     * var addSquare = _.flow(_.add, square);
     * addSquare(1, 2);
     * // => 9
     */
    var flow = createFlow();

    /**
     * This method is like `_.flow` except that it creates a function that
     * invokes the provided functions from right to left.
     *
     * @static
     * @memberOf _
     * @alias backflow, compose
     * @category Function
     * @param {...Function} [funcs] Functions to invoke.
     * @returns {Function} Returns the new function.
     * @example
     *
     * function square(n) {
     *   return n * n;
     * }
     *
     * var addSquare = _.flowRight(square, _.add);
     * addSquare(1, 2);
     * // => 9
     */
    var flowRight = createFlow(true);

    /**
     * Creates a function that memoizes the result of `func`. If `resolver` is
     * provided it determines the cache key for storing the result based on the
     * arguments provided to the memoized function. By default, the first argument
     * provided to the memoized function is coerced to a string and used as the
     * cache key. The `func` is invoked with the `this` binding of the memoized
     * function.
     *
     * **Note:** The cache is exposed as the `cache` property on the memoized
     * function. Its creation may be customized by replacing the `_.memoize.Cache`
     * constructor with one whose instances implement the [`Map`](http://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-map-prototype-object)
     * method interface of `get`, `has`, and `set`.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to have its output memoized.
     * @param {Function} [resolver] The function to resolve the cache key.
     * @returns {Function} Returns the new memoizing function.
     * @example
     *
     * var upperCase = _.memoize(function(string) {
     *   return string.toUpperCase();
     * });
     *
     * upperCase('fred');
     * // => 'FRED'
     *
     * // modifying the result cache
     * upperCase.cache.set('fred', 'BARNEY');
     * upperCase('fred');
     * // => 'BARNEY'
     *
     * // replacing `_.memoize.Cache`
     * var object = { 'user': 'fred' };
     * var other = { 'user': 'barney' };
     * var identity = _.memoize(_.identity);
     *
     * identity(object);
     * // => { 'user': 'fred' }
     * identity(other);
     * // => { 'user': 'fred' }
     *
     * _.memoize.Cache = WeakMap;
     * var identity = _.memoize(_.identity);
     *
     * identity(object);
     * // => { 'user': 'fred' }
     * identity(other);
     * // => { 'user': 'barney' }
     */
    function memoize(func, resolver) {
      if (typeof func != 'function' || (resolver && typeof resolver != 'function')) {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      var memoized = function() {
        var args = arguments,
            key = resolver ? resolver.apply(this, args) : args[0],
            cache = memoized.cache;

        if (cache.has(key)) {
          return cache.get(key);
        }
        var result = func.apply(this, args);
        memoized.cache = cache.set(key, result);
        return result;
      };
      memoized.cache = new memoize.Cache;
      return memoized;
    }

    /**
     * Creates a function that runs each argument through a corresponding
     * transform function.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to wrap.
     * @param {...(Function|Function[])} [transforms] The functions to transform
     * arguments, specified as individual functions or arrays of functions.
     * @returns {Function} Returns the new function.
     * @example
     *
     * function doubled(n) {
     *   return n * 2;
     * }
     *
     * function square(n) {
     *   return n * n;
     * }
     *
     * var modded = _.modArgs(function(x, y) {
     *   return [x, y];
     * }, square, doubled);
     *
     * modded(1, 2);
     * // => [1, 4]
     *
     * modded(5, 10);
     * // => [25, 20]
     */
    var modArgs = restParam(function(func, transforms) {
      transforms = baseFlatten(transforms);
      if (typeof func != 'function' || !arrayEvery(transforms, baseIsFunction)) {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      var length = transforms.length;
      return restParam(function(args) {
        var index = nativeMin(args.length, length);
        while (index--) {
          args[index] = transforms[index](args[index]);
        }
        return func.apply(this, args);
      });
    });

    /**
     * Creates a function that negates the result of the predicate `func`. The
     * `func` predicate is invoked with the `this` binding and arguments of the
     * created function.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} predicate The predicate to negate.
     * @returns {Function} Returns the new function.
     * @example
     *
     * function isEven(n) {
     *   return n % 2 == 0;
     * }
     *
     * _.filter([1, 2, 3, 4, 5, 6], _.negate(isEven));
     * // => [1, 3, 5]
     */
    function negate(predicate) {
      if (typeof predicate != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      return function() {
        return !predicate.apply(this, arguments);
      };
    }

    /**
     * Creates a function that is restricted to invoking `func` once. Repeat calls
     * to the function return the value of the first call. The `func` is invoked
     * with the `this` binding and arguments of the created function.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var initialize = _.once(createApplication);
     * initialize();
     * initialize();
     * // `initialize` invokes `createApplication` once
     */
    function once(func) {
      return before(2, func);
    }

    /**
     * Creates a function that invokes `func` with `partial` arguments prepended
     * to those provided to the new function. This method is like `_.bind` except
     * it does **not** alter the `this` binding.
     *
     * The `_.partial.placeholder` value, which defaults to `_` in monolithic
     * builds, may be used as a placeholder for partially applied arguments.
     *
     * **Note:** This method does not set the "length" property of partially
     * applied functions.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [partials] The arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var greet = function(greeting, name) {
     *   return greeting + ' ' + name;
     * };
     *
     * var sayHelloTo = _.partial(greet, 'hello');
     * sayHelloTo('fred');
     * // => 'hello fred'
     *
     * // using placeholders
     * var greetFred = _.partial(greet, _, 'fred');
     * greetFred('hi');
     * // => 'hi fred'
     */
    var partial = createPartial(PARTIAL_FLAG);

    /**
     * This method is like `_.partial` except that partially applied arguments
     * are appended to those provided to the new function.
     *
     * The `_.partialRight.placeholder` value, which defaults to `_` in monolithic
     * builds, may be used as a placeholder for partially applied arguments.
     *
     * **Note:** This method does not set the "length" property of partially
     * applied functions.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [partials] The arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var greet = function(greeting, name) {
     *   return greeting + ' ' + name;
     * };
     *
     * var greetFred = _.partialRight(greet, 'fred');
     * greetFred('hi');
     * // => 'hi fred'
     *
     * // using placeholders
     * var sayHelloTo = _.partialRight(greet, 'hello', _);
     * sayHelloTo('fred');
     * // => 'hello fred'
     */
    var partialRight = createPartial(PARTIAL_RIGHT_FLAG);

    /**
     * Creates a function that invokes `func` with arguments arranged according
     * to the specified indexes where the argument value at the first index is
     * provided as the first argument, the argument value at the second index is
     * provided as the second argument, and so on.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to rearrange arguments for.
     * @param {...(number|number[])} indexes The arranged argument indexes,
     *  specified as individual indexes or arrays of indexes.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var rearged = _.rearg(function(a, b, c) {
     *   return [a, b, c];
     * }, 2, 0, 1);
     *
     * rearged('b', 'c', 'a')
     * // => ['a', 'b', 'c']
     *
     * var map = _.rearg(_.map, [1, 0]);
     * map(function(n) {
     *   return n * 3;
     * }, [1, 2, 3]);
     * // => [3, 6, 9]
     */
    var rearg = restParam(function(func, indexes) {
      return createWrapper(func, REARG_FLAG, undefined, undefined, undefined, baseFlatten(indexes));
    });

    /**
     * Creates a function that invokes `func` with the `this` binding of the
     * created function and arguments from `start` and beyond provided as an array.
     *
     * **Note:** This method is based on the [rest parameter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters).
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to apply a rest parameter to.
     * @param {number} [start=func.length-1] The start position of the rest parameter.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var say = _.restParam(function(what, names) {
     *   return what + ' ' + _.initial(names).join(', ') +
     *     (_.size(names) > 1 ? ', & ' : '') + _.last(names);
     * });
     *
     * say('hello', 'fred', 'barney', 'pebbles');
     * // => 'hello fred, barney, & pebbles'
     */
    function restParam(func, start) {
      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      start = nativeMax(start === undefined ? (func.length - 1) : (+start || 0), 0);
      return function() {
        var args = arguments,
            index = -1,
            length = nativeMax(args.length - start, 0),
            rest = Array(length);

        while (++index < length) {
          rest[index] = args[start + index];
        }
        switch (start) {
          case 0: return func.call(this, rest);
          case 1: return func.call(this, args[0], rest);
          case 2: return func.call(this, args[0], args[1], rest);
        }
        var otherArgs = Array(start + 1);
        index = -1;
        while (++index < start) {
          otherArgs[index] = args[index];
        }
        otherArgs[start] = rest;
        return func.apply(this, otherArgs);
      };
    }

    /**
     * Creates a function that invokes `func` with the `this` binding of the created
     * function and an array of arguments much like [`Function#apply`](https://es5.github.io/#x15.3.4.3).
     *
     * **Note:** This method is based on the [spread operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_operator).
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to spread arguments over.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var say = _.spread(function(who, what) {
     *   return who + ' says ' + what;
     * });
     *
     * say(['fred', 'hello']);
     * // => 'fred says hello'
     *
     * // with a Promise
     * var numbers = Promise.all([
     *   Promise.resolve(40),
     *   Promise.resolve(36)
     * ]);
     *
     * numbers.then(_.spread(function(x, y) {
     *   return x + y;
     * }));
     * // => a Promise of 76
     */
    function spread(func) {
      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      return function(array) {
        return func.apply(this, array);
      };
    }

    /**
     * Creates a throttled function that only invokes `func` at most once per
     * every `wait` milliseconds. The throttled function comes with a `cancel`
     * method to cancel delayed invocations. Provide an options object to indicate
     * that `func` should be invoked on the leading and/or trailing edge of the
     * `wait` timeout. Subsequent calls to the throttled function return the
     * result of the last `func` call.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is invoked
     * on the trailing edge of the timeout only if the the throttled function is
     * invoked more than once during the `wait` timeout.
     *
     * See [David Corbacho's article](http://drupalmotion.com/article/debounce-and-throttle-visual-explanation)
     * for details over the differences between `_.throttle` and `_.debounce`.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to throttle.
     * @param {number} [wait=0] The number of milliseconds to throttle invocations to.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=true] Specify invoking on the leading
     *  edge of the timeout.
     * @param {boolean} [options.trailing=true] Specify invoking on the trailing
     *  edge of the timeout.
     * @returns {Function} Returns the new throttled function.
     * @example
     *
     * // avoid excessively updating the position while scrolling
     * jQuery(window).on('scroll', _.throttle(updatePosition, 100));
     *
     * // invoke `renewToken` when the click event is fired, but not more than once every 5 minutes
     * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {
     *   'trailing': false
     * }));
     *
     * // cancel a trailing throttled call
     * jQuery(window).on('popstate', throttled.cancel);
     */
    function throttle(func, wait, options) {
      var leading = true,
          trailing = true;

      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      if (options === false) {
        leading = false;
      } else if (isObject(options)) {
        leading = 'leading' in options ? !!options.leading : leading;
        trailing = 'trailing' in options ? !!options.trailing : trailing;
      }
      return debounce(func, wait, { 'leading': leading, 'maxWait': +wait, 'trailing': trailing });
    }

    /**
     * Creates a function that provides `value` to the wrapper function as its
     * first argument. Any additional arguments provided to the function are
     * appended to those provided to the wrapper function. The wrapper is invoked
     * with the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {*} value The value to wrap.
     * @param {Function} wrapper The wrapper function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var p = _.wrap(_.escape, function(func, text) {
     *   return '<p>' + func(text) + '</p>';
     * });
     *
     * p('fred, barney, & pebbles');
     * // => '<p>fred, barney, &amp; pebbles</p>'
     */
    function wrap(value, wrapper) {
      wrapper = wrapper == null ? identity : wrapper;
      return createWrapper(wrapper, PARTIAL_FLAG, undefined, [value], []);
    }

    /*------------------------------------------------------------------------*/

    /**
     * Creates a clone of `value`. If `isDeep` is `true` nested objects are cloned,
     * otherwise they are assigned by reference. If `customizer` is provided it is
     * invoked to produce the cloned values. If `customizer` returns `undefined`
     * cloning is handled by the method instead. The `customizer` is bound to
     * `thisArg` and invoked with two argument; (value [, index|key, object]).
     *
     * **Note:** This method is loosely based on the
     * [structured clone algorithm](http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm).
     * The enumerable properties of `arguments` objects and objects created by
     * constructors other than `Object` are cloned to plain `Object` objects. An
     * empty object is returned for uncloneable values such as functions, DOM nodes,
     * Maps, Sets, and WeakMaps.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @param {Function} [customizer] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `customizer`.
     * @returns {*} Returns the cloned value.
     * @example
     *
     * var users = [
     *   { 'user': 'barney' },
     *   { 'user': 'fred' }
     * ];
     *
     * var shallow = _.clone(users);
     * shallow[0] === users[0];
     * // => true
     *
     * var deep = _.clone(users, true);
     * deep[0] === users[0];
     * // => false
     *
     * // using a customizer callback
     * var el = _.clone(document.body, function(value) {
     *   if (_.isElement(value)) {
     *     return value.cloneNode(false);
     *   }
     * });
     *
     * el === document.body
     * // => false
     * el.nodeName
     * // => BODY
     * el.childNodes.length;
     * // => 0
     */
    function clone(value, isDeep, customizer, thisArg) {
      if (isDeep && typeof isDeep != 'boolean' && isIterateeCall(value, isDeep, customizer)) {
        isDeep = false;
      }
      else if (typeof isDeep == 'function') {
        thisArg = customizer;
        customizer = isDeep;
        isDeep = false;
      }
      return typeof customizer == 'function'
        ? baseClone(value, isDeep, bindCallback(customizer, thisArg, 1))
        : baseClone(value, isDeep);
    }

    /**
     * Creates a deep clone of `value`. If `customizer` is provided it is invoked
     * to produce the cloned values. If `customizer` returns `undefined` cloning
     * is handled by the method instead. The `customizer` is bound to `thisArg`
     * and invoked with two argument; (value [, index|key, object]).
     *
     * **Note:** This method is loosely based on the
     * [structured clone algorithm](http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm).
     * The enumerable properties of `arguments` objects and objects created by
     * constructors other than `Object` are cloned to plain `Object` objects. An
     * empty object is returned for uncloneable values such as functions, DOM nodes,
     * Maps, Sets, and WeakMaps.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to deep clone.
     * @param {Function} [customizer] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `customizer`.
     * @returns {*} Returns the deep cloned value.
     * @example
     *
     * var users = [
     *   { 'user': 'barney' },
     *   { 'user': 'fred' }
     * ];
     *
     * var deep = _.cloneDeep(users);
     * deep[0] === users[0];
     * // => false
     *
     * // using a customizer callback
     * var el = _.cloneDeep(document.body, function(value) {
     *   if (_.isElement(value)) {
     *     return value.cloneNode(true);
     *   }
     * });
     *
     * el === document.body
     * // => false
     * el.nodeName
     * // => BODY
     * el.childNodes.length;
     * // => 20
     */
    function cloneDeep(value, customizer, thisArg) {
      return typeof customizer == 'function'
        ? baseClone(value, true, bindCallback(customizer, thisArg, 1))
        : baseClone(value, true);
    }

    /**
     * Checks if `value` is greater than `other`.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if `value` is greater than `other`, else `false`.
     * @example
     *
     * _.gt(3, 1);
     * // => true
     *
     * _.gt(3, 3);
     * // => false
     *
     * _.gt(1, 3);
     * // => false
     */
    function gt(value, other) {
      return value > other;
    }

    /**
     * Checks if `value` is greater than or equal to `other`.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if `value` is greater than or equal to `other`, else `false`.
     * @example
     *
     * _.gte(3, 1);
     * // => true
     *
     * _.gte(3, 3);
     * // => true
     *
     * _.gte(1, 3);
     * // => false
     */
    function gte(value, other) {
      return value >= other;
    }

    /**
     * Checks if `value` is classified as an `arguments` object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isArguments(function() { return arguments; }());
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    function isArguments(value) {
      return isObjectLike(value) && isArrayLike(value) &&
        hasOwnProperty.call(value, 'callee') && !propertyIsEnumerable.call(value, 'callee');
    }

    /**
     * Checks if `value` is classified as an `Array` object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isArray([1, 2, 3]);
     * // => true
     *
     * _.isArray(function() { return arguments; }());
     * // => false
     */
    var isArray = nativeIsArray || function(value) {
      return isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag;
    };

    /**
     * Checks if `value` is classified as a boolean primitive or object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isBoolean(false);
     * // => true
     *
     * _.isBoolean(null);
     * // => false
     */
    function isBoolean(value) {
      return value === true || value === false || (isObjectLike(value) && objToString.call(value) == boolTag);
    }

    /**
     * Checks if `value` is classified as a `Date` object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isDate(new Date);
     * // => true
     *
     * _.isDate('Mon April 23 2012');
     * // => false
     */
    function isDate(value) {
      return isObjectLike(value) && objToString.call(value) == dateTag;
    }

    /**
     * Checks if `value` is a DOM element.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a DOM element, else `false`.
     * @example
     *
     * _.isElement(document.body);
     * // => true
     *
     * _.isElement('<body>');
     * // => false
     */
    function isElement(value) {
      return !!value && value.nodeType === 1 && isObjectLike(value) && !isPlainObject(value);
    }

    /**
     * Checks if `value` is empty. A value is considered empty unless it is an
     * `arguments` object, array, string, or jQuery-like collection with a length
     * greater than `0` or an object with own enumerable properties.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {Array|Object|string} value The value to inspect.
     * @returns {boolean} Returns `true` if `value` is empty, else `false`.
     * @example
     *
     * _.isEmpty(null);
     * // => true
     *
     * _.isEmpty(true);
     * // => true
     *
     * _.isEmpty(1);
     * // => true
     *
     * _.isEmpty([1, 2, 3]);
     * // => false
     *
     * _.isEmpty({ 'a': 1 });
     * // => false
     */
    function isEmpty(value) {
      if (value == null) {
        return true;
      }
      if (isArrayLike(value) && (isArray(value) || isString(value) || isArguments(value) ||
          (isObjectLike(value) && isFunction(value.splice)))) {
        return !value.length;
      }
      return !keys(value).length;
    }

    /**
     * Performs a deep comparison between two values to determine if they are
     * equivalent. If `customizer` is provided it is invoked to compare values.
     * If `customizer` returns `undefined` comparisons are handled by the method
     * instead. The `customizer` is bound to `thisArg` and invoked with three
     * arguments: (value, other [, index|key]).
     *
     * **Note:** This method supports comparing arrays, booleans, `Date` objects,
     * numbers, `Object` objects, regexes, and strings. Objects are compared by
     * their own, not inherited, enumerable properties. Functions and DOM nodes
     * are **not** supported. Provide a customizer function to extend support
     * for comparing other values.
     *
     * @static
     * @memberOf _
     * @alias eq
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @param {Function} [customizer] The function to customize value comparisons.
     * @param {*} [thisArg] The `this` binding of `customizer`.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'user': 'fred' };
     * var other = { 'user': 'fred' };
     *
     * object == other;
     * // => false
     *
     * _.isEqual(object, other);
     * // => true
     *
     * // using a customizer callback
     * var array = ['hello', 'goodbye'];
     * var other = ['hi', 'goodbye'];
     *
     * _.isEqual(array, other, function(value, other) {
     *   if (_.every([value, other], RegExp.prototype.test, /^h(?:i|ello)$/)) {
     *     return true;
     *   }
     * });
     * // => true
     */
    function isEqual(value, other, customizer, thisArg) {
      customizer = typeof customizer == 'function' ? bindCallback(customizer, thisArg, 3) : undefined;
      var result = customizer ? customizer(value, other) : undefined;
      return  result === undefined ? baseIsEqual(value, other, customizer) : !!result;
    }

    /**
     * Checks if `value` is an `Error`, `EvalError`, `RangeError`, `ReferenceError`,
     * `SyntaxError`, `TypeError`, or `URIError` object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an error object, else `false`.
     * @example
     *
     * _.isError(new Error);
     * // => true
     *
     * _.isError(Error);
     * // => false
     */
    function isError(value) {
      return isObjectLike(value) && typeof value.message == 'string' && objToString.call(value) == errorTag;
    }

    /**
     * Checks if `value` is a finite primitive number.
     *
     * **Note:** This method is based on [`Number.isFinite`](http://ecma-international.org/ecma-262/6.0/#sec-number.isfinite).
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a finite number, else `false`.
     * @example
     *
     * _.isFinite(10);
     * // => true
     *
     * _.isFinite('10');
     * // => false
     *
     * _.isFinite(true);
     * // => false
     *
     * _.isFinite(Object(10));
     * // => false
     *
     * _.isFinite(Infinity);
     * // => false
     */
    function isFinite(value) {
      return typeof value == 'number' && nativeIsFinite(value);
    }

    /**
     * Checks if `value` is classified as a `Function` object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     *
     * _.isFunction(/abc/);
     * // => false
     */
    function isFunction(value) {
      // The use of `Object#toString` avoids issues with the `typeof` operator
      // in older versions of Chrome and Safari which return 'function' for regexes
      // and Safari 8 equivalents which return 'object' for typed array constructors.
      return isObject(value) && objToString.call(value) == funcTag;
    }

    /**
     * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
    function isObject(value) {
      // Avoid a V8 JIT bug in Chrome 19-20.
      // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
      var type = typeof value;
      return !!value && (type == 'object' || type == 'function');
    }

    /**
     * Performs a deep comparison between `object` and `source` to determine if
     * `object` contains equivalent property values. If `customizer` is provided
     * it is invoked to compare values. If `customizer` returns `undefined`
     * comparisons are handled by the method instead. The `customizer` is bound
     * to `thisArg` and invoked with three arguments: (value, other, index|key).
     *
     * **Note:** This method supports comparing properties of arrays, booleans,
     * `Date` objects, numbers, `Object` objects, regexes, and strings. Functions
     * and DOM nodes are **not** supported. Provide a customizer function to extend
     * support for comparing other values.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {Object} object The object to inspect.
     * @param {Object} source The object of property values to match.
     * @param {Function} [customizer] The function to customize value comparisons.
     * @param {*} [thisArg] The `this` binding of `customizer`.
     * @returns {boolean} Returns `true` if `object` is a match, else `false`.
     * @example
     *
     * var object = { 'user': 'fred', 'age': 40 };
     *
     * _.isMatch(object, { 'age': 40 });
     * // => true
     *
     * _.isMatch(object, { 'age': 36 });
     * // => false
     *
     * // using a customizer callback
     * var object = { 'greeting': 'hello' };
     * var source = { 'greeting': 'hi' };
     *
     * _.isMatch(object, source, function(value, other) {
     *   return _.every([value, other], RegExp.prototype.test, /^h(?:i|ello)$/) || undefined;
     * });
     * // => true
     */
    function isMatch(object, source, customizer, thisArg) {
      customizer = typeof customizer == 'function' ? bindCallback(customizer, thisArg, 3) : undefined;
      return baseIsMatch(object, getMatchData(source), customizer);
    }

    /**
     * Checks if `value` is `NaN`.
     *
     * **Note:** This method is not the same as [`isNaN`](https://es5.github.io/#x15.1.2.4)
     * which returns `true` for `undefined` and other non-numeric values.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
     * @example
     *
     * _.isNaN(NaN);
     * // => true
     *
     * _.isNaN(new Number(NaN));
     * // => true
     *
     * isNaN(undefined);
     * // => true
     *
     * _.isNaN(undefined);
     * // => false
     */
    function isNaN(value) {
      // An `NaN` primitive is the only value that is not equal to itself.
      // Perform the `toStringTag` check first to avoid errors with some host objects in IE.
      return isNumber(value) && value != +value;
    }

    /**
     * Checks if `value` is a native function.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a native function, else `false`.
     * @example
     *
     * _.isNative(Array.prototype.push);
     * // => true
     *
     * _.isNative(_);
     * // => false
     */
    function isNative(value) {
      if (value == null) {
        return false;
      }
      if (isFunction(value)) {
        return reIsNative.test(fnToString.call(value));
      }
      return isObjectLike(value) && reIsHostCtor.test(value);
    }

    /**
     * Checks if `value` is `null`.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is `null`, else `false`.
     * @example
     *
     * _.isNull(null);
     * // => true
     *
     * _.isNull(void 0);
     * // => false
     */
    function isNull(value) {
      return value === null;
    }

    /**
     * Checks if `value` is classified as a `Number` primitive or object.
     *
     * **Note:** To exclude `Infinity`, `-Infinity`, and `NaN`, which are classified
     * as numbers, use the `_.isFinite` method.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isNumber(8.4);
     * // => true
     *
     * _.isNumber(NaN);
     * // => true
     *
     * _.isNumber('8.4');
     * // => false
     */
    function isNumber(value) {
      return typeof value == 'number' || (isObjectLike(value) && objToString.call(value) == numberTag);
    }

    /**
     * Checks if `value` is a plain object, that is, an object created by the
     * `Object` constructor or one with a `[[Prototype]]` of `null`.
     *
     * **Note:** This method assumes objects created by the `Object` constructor
     * have no inherited enumerable properties.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     * }
     *
     * _.isPlainObject(new Foo);
     * // => false
     *
     * _.isPlainObject([1, 2, 3]);
     * // => false
     *
     * _.isPlainObject({ 'x': 0, 'y': 0 });
     * // => true
     *
     * _.isPlainObject(Object.create(null));
     * // => true
     */
    function isPlainObject(value) {
      var Ctor;

      // Exit early for non `Object` objects.
      if (!(isObjectLike(value) && objToString.call(value) == objectTag && !isArguments(value)) ||
          (!hasOwnProperty.call(value, 'constructor') && (Ctor = value.constructor, typeof Ctor == 'function' && !(Ctor instanceof Ctor)))) {
        return false;
      }
      // IE < 9 iterates inherited properties before own properties. If the first
      // iterated property is an object's own property then there are no inherited
      // enumerable properties.
      var result;
      // In most environments an object's own properties are iterated before
      // its inherited properties. If the last iterated property is an object's
      // own property then there are no inherited enumerable properties.
      baseForIn(value, function(subValue, key) {
        result = key;
      });
      return result === undefined || hasOwnProperty.call(value, result);
    }

    /**
     * Checks if `value` is classified as a `RegExp` object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isRegExp(/abc/);
     * // => true
     *
     * _.isRegExp('/abc/');
     * // => false
     */
    function isRegExp(value) {
      return isObject(value) && objToString.call(value) == regexpTag;
    }

    /**
     * Checks if `value` is classified as a `String` primitive or object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isString('abc');
     * // => true
     *
     * _.isString(1);
     * // => false
     */
    function isString(value) {
      return typeof value == 'string' || (isObjectLike(value) && objToString.call(value) == stringTag);
    }

    /**
     * Checks if `value` is classified as a typed array.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isTypedArray(new Uint8Array);
     * // => true
     *
     * _.isTypedArray([]);
     * // => false
     */
    function isTypedArray(value) {
      return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[objToString.call(value)];
    }

    /**
     * Checks if `value` is `undefined`.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is `undefined`, else `false`.
     * @example
     *
     * _.isUndefined(void 0);
     * // => true
     *
     * _.isUndefined(null);
     * // => false
     */
    function isUndefined(value) {
      return value === undefined;
    }

    /**
     * Checks if `value` is less than `other`.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if `value` is less than `other`, else `false`.
     * @example
     *
     * _.lt(1, 3);
     * // => true
     *
     * _.lt(3, 3);
     * // => false
     *
     * _.lt(3, 1);
     * // => false
     */
    function lt(value, other) {
      return value < other;
    }

    /**
     * Checks if `value` is less than or equal to `other`.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if `value` is less than or equal to `other`, else `false`.
     * @example
     *
     * _.lte(1, 3);
     * // => true
     *
     * _.lte(3, 3);
     * // => true
     *
     * _.lte(3, 1);
     * // => false
     */
    function lte(value, other) {
      return value <= other;
    }

    /**
     * Converts `value` to an array.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to convert.
     * @returns {Array} Returns the converted array.
     * @example
     *
     * (function() {
     *   return _.toArray(arguments).slice(1);
     * }(1, 2, 3));
     * // => [2, 3]
     */
    function toArray(value) {
      var length = value ? getLength(value) : 0;
      if (!isLength(length)) {
        return values(value);
      }
      if (!length) {
        return [];
      }
      return arrayCopy(value);
    }

    /**
     * Converts `value` to a plain object flattening inherited enumerable
     * properties of `value` to own properties of the plain object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to convert.
     * @returns {Object} Returns the converted plain object.
     * @example
     *
     * function Foo() {
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.assign({ 'a': 1 }, new Foo);
     * // => { 'a': 1, 'b': 2 }
     *
     * _.assign({ 'a': 1 }, _.toPlainObject(new Foo));
     * // => { 'a': 1, 'b': 2, 'c': 3 }
     */
    function toPlainObject(value) {
      return baseCopy(value, keysIn(value));
    }

    /*------------------------------------------------------------------------*/

    /**
     * Recursively merges own enumerable properties of the source object(s), that
     * don't resolve to `undefined` into the destination object. Subsequent sources
     * overwrite property assignments of previous sources. If `customizer` is
     * provided it is invoked to produce the merged values of the destination and
     * source properties. If `customizer` returns `undefined` merging is handled
     * by the method instead. The `customizer` is bound to `thisArg` and invoked
     * with five arguments: (objectValue, sourceValue, key, object, source).
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The destination object.
     * @param {...Object} [sources] The source objects.
     * @param {Function} [customizer] The function to customize assigned values.
     * @param {*} [thisArg] The `this` binding of `customizer`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var users = {
     *   'data': [{ 'user': 'barney' }, { 'user': 'fred' }]
     * };
     *
     * var ages = {
     *   'data': [{ 'age': 36 }, { 'age': 40 }]
     * };
     *
     * _.merge(users, ages);
     * // => { 'data': [{ 'user': 'barney', 'age': 36 }, { 'user': 'fred', 'age': 40 }] }
     *
     * // using a customizer callback
     * var object = {
     *   'fruits': ['apple'],
     *   'vegetables': ['beet']
     * };
     *
     * var other = {
     *   'fruits': ['banana'],
     *   'vegetables': ['carrot']
     * };
     *
     * _.merge(object, other, function(a, b) {
     *   if (_.isArray(a)) {
     *     return a.concat(b);
     *   }
     * });
     * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot'] }
     */
    var merge = createAssigner(baseMerge);

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object. Subsequent sources overwrite property assignments of previous sources.
     * If `customizer` is provided it is invoked to produce the assigned values.
     * The `customizer` is bound to `thisArg` and invoked with five arguments:
     * (objectValue, sourceValue, key, object, source).
     *
     * **Note:** This method mutates `object` and is based on
     * [`Object.assign`](http://ecma-international.org/ecma-262/6.0/#sec-object.assign).
     *
     * @static
     * @memberOf _
     * @alias extend
     * @category Object
     * @param {Object} object The destination object.
     * @param {...Object} [sources] The source objects.
     * @param {Function} [customizer] The function to customize assigned values.
     * @param {*} [thisArg] The `this` binding of `customizer`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.assign({ 'user': 'barney' }, { 'age': 40 }, { 'user': 'fred' });
     * // => { 'user': 'fred', 'age': 40 }
     *
     * // using a customizer callback
     * var defaults = _.partialRight(_.assign, function(value, other) {
     *   return _.isUndefined(value) ? other : value;
     * });
     *
     * defaults({ 'user': 'barney' }, { 'age': 36 }, { 'user': 'fred' });
     * // => { 'user': 'barney', 'age': 36 }
     */
    var assign = createAssigner(function(object, source, customizer) {
      return customizer
        ? assignWith(object, source, customizer)
        : baseAssign(object, source);
    });

    /**
     * Creates an object that inherits from the given `prototype` object. If a
     * `properties` object is provided its own enumerable properties are assigned
     * to the created object.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} prototype The object to inherit from.
     * @param {Object} [properties] The properties to assign to the object.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Object} Returns the new object.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * function Circle() {
     *   Shape.call(this);
     * }
     *
     * Circle.prototype = _.create(Shape.prototype, {
     *   'constructor': Circle
     * });
     *
     * var circle = new Circle;
     * circle instanceof Circle;
     * // => true
     *
     * circle instanceof Shape;
     * // => true
     */
    function create(prototype, properties, guard) {
      var result = baseCreate(prototype);
      if (guard && isIterateeCall(prototype, properties, guard)) {
        properties = undefined;
      }
      return properties ? baseAssign(result, properties) : result;
    }

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object for all destination properties that resolve to `undefined`. Once a
     * property is set, additional values of the same property are ignored.
     *
     * **Note:** This method mutates `object`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The destination object.
     * @param {...Object} [sources] The source objects.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.defaults({ 'user': 'barney' }, { 'age': 36 }, { 'user': 'fred' });
     * // => { 'user': 'barney', 'age': 36 }
     */
    var defaults = createDefaults(assign, assignDefaults);

    /**
     * This method is like `_.defaults` except that it recursively assigns
     * default properties.
     *
     * **Note:** This method mutates `object`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The destination object.
     * @param {...Object} [sources] The source objects.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.defaultsDeep({ 'user': { 'name': 'barney' } }, { 'user': { 'name': 'fred', 'age': 36 } });
     * // => { 'user': { 'name': 'barney', 'age': 36 } }
     *
     */
    var defaultsDeep = createDefaults(merge, mergeDefaults);

    /**
     * This method is like `_.find` except that it returns the key of the first
     * element `predicate` returns truthy for instead of the element itself.
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {string|undefined} Returns the key of the matched element, else `undefined`.
     * @example
     *
     * var users = {
     *   'barney':  { 'age': 36, 'active': true },
     *   'fred':    { 'age': 40, 'active': false },
     *   'pebbles': { 'age': 1,  'active': true }
     * };
     *
     * _.findKey(users, function(chr) {
     *   return chr.age < 40;
     * });
     * // => 'barney' (iteration order is not guaranteed)
     *
     * // using the `_.matches` callback shorthand
     * _.findKey(users, { 'age': 1, 'active': true });
     * // => 'pebbles'
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.findKey(users, 'active', false);
     * // => 'fred'
     *
     * // using the `_.property` callback shorthand
     * _.findKey(users, 'active');
     * // => 'barney'
     */
    var findKey = createFindKey(baseForOwn);

    /**
     * This method is like `_.findKey` except that it iterates over elements of
     * a collection in the opposite order.
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {string|undefined} Returns the key of the matched element, else `undefined`.
     * @example
     *
     * var users = {
     *   'barney':  { 'age': 36, 'active': true },
     *   'fred':    { 'age': 40, 'active': false },
     *   'pebbles': { 'age': 1,  'active': true }
     * };
     *
     * _.findLastKey(users, function(chr) {
     *   return chr.age < 40;
     * });
     * // => returns `pebbles` assuming `_.findKey` returns `barney`
     *
     * // using the `_.matches` callback shorthand
     * _.findLastKey(users, { 'age': 36, 'active': true });
     * // => 'barney'
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.findLastKey(users, 'active', false);
     * // => 'fred'
     *
     * // using the `_.property` callback shorthand
     * _.findLastKey(users, 'active');
     * // => 'pebbles'
     */
    var findLastKey = createFindKey(baseForOwnRight);

    /**
     * Iterates over own and inherited enumerable properties of an object invoking
     * `iteratee` for each property. The `iteratee` is bound to `thisArg` and invoked
     * with three arguments: (value, key, object). Iteratee functions may exit
     * iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.forIn(new Foo, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'a', 'b', and 'c' (iteration order is not guaranteed)
     */
    var forIn = createForIn(baseFor);

    /**
     * This method is like `_.forIn` except that it iterates over properties of
     * `object` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.forInRight(new Foo, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'c', 'b', and 'a' assuming `_.forIn ` logs 'a', 'b', and 'c'
     */
    var forInRight = createForIn(baseForRight);

    /**
     * Iterates over own enumerable properties of an object invoking `iteratee`
     * for each property. The `iteratee` is bound to `thisArg` and invoked with
     * three arguments: (value, key, object). Iteratee functions may exit iteration
     * early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.forOwn(new Foo, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'a' and 'b' (iteration order is not guaranteed)
     */
    var forOwn = createForOwn(baseForOwn);

    /**
     * This method is like `_.forOwn` except that it iterates over properties of
     * `object` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.forOwnRight(new Foo, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'b' and 'a' assuming `_.forOwn` logs 'a' and 'b'
     */
    var forOwnRight = createForOwn(baseForOwnRight);

    /**
     * Creates an array of function property names from all enumerable properties,
     * own and inherited, of `object`.
     *
     * @static
     * @memberOf _
     * @alias methods
     * @category Object
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns the new array of property names.
     * @example
     *
     * _.functions(_);
     * // => ['after', 'ary', 'assign', ...]
     */
    function functions(object) {
      return baseFunctions(object, keysIn(object));
    }

    /**
     * Gets the property value at `path` of `object`. If the resolved value is
     * `undefined` the `defaultValue` is used in its place.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @param {Array|string} path The path of the property to get.
     * @param {*} [defaultValue] The value returned if the resolved value is `undefined`.
     * @returns {*} Returns the resolved value.
     * @example
     *
     * var object = { 'a': [{ 'b': { 'c': 3 } }] };
     *
     * _.get(object, 'a[0].b.c');
     * // => 3
     *
     * _.get(object, ['a', '0', 'b', 'c']);
     * // => 3
     *
     * _.get(object, 'a.b.c', 'default');
     * // => 'default'
     */
    function get(object, path, defaultValue) {
      var result = object == null ? undefined : baseGet(object, toPath(path), path + '');
      return result === undefined ? defaultValue : result;
    }

    /**
     * Checks if `path` is a direct property.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @param {Array|string} path The path to check.
     * @returns {boolean} Returns `true` if `path` is a direct property, else `false`.
     * @example
     *
     * var object = { 'a': { 'b': { 'c': 3 } } };
     *
     * _.has(object, 'a');
     * // => true
     *
     * _.has(object, 'a.b.c');
     * // => true
     *
     * _.has(object, ['a', 'b', 'c']);
     * // => true
     */
    function has(object, path) {
      if (object == null) {
        return false;
      }
      var result = hasOwnProperty.call(object, path);
      if (!result && !isKey(path)) {
        path = toPath(path);
        object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
        if (object == null) {
          return false;
        }
        path = last(path);
        result = hasOwnProperty.call(object, path);
      }
      return result || (isLength(object.length) && isIndex(path, object.length) &&
        (isArray(object) || isArguments(object)));
    }

    /**
     * Creates an object composed of the inverted keys and values of `object`.
     * If `object` contains duplicate values, subsequent values overwrite property
     * assignments of previous values unless `multiValue` is `true`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to invert.
     * @param {boolean} [multiValue] Allow multiple values per key.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Object} Returns the new inverted object.
     * @example
     *
     * var object = { 'a': 1, 'b': 2, 'c': 1 };
     *
     * _.invert(object);
     * // => { '1': 'c', '2': 'b' }
     *
     * // with `multiValue`
     * _.invert(object, true);
     * // => { '1': ['a', 'c'], '2': ['b'] }
     */
    function invert(object, multiValue, guard) {
      if (guard && isIterateeCall(object, multiValue, guard)) {
        multiValue = undefined;
      }
      var index = -1,
          props = keys(object),
          length = props.length,
          result = {};

      while (++index < length) {
        var key = props[index],
            value = object[key];

        if (multiValue) {
          if (hasOwnProperty.call(result, value)) {
            result[value].push(key);
          } else {
            result[value] = [key];
          }
        }
        else {
          result[value] = key;
        }
      }
      return result;
    }

    /**
     * Creates an array of the own enumerable property names of `object`.
     *
     * **Note:** Non-object values are coerced to objects. See the
     * [ES spec](http://ecma-international.org/ecma-262/6.0/#sec-object.keys)
     * for more details.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.keys(new Foo);
     * // => ['a', 'b'] (iteration order is not guaranteed)
     *
     * _.keys('hi');
     * // => ['0', '1']
     */
    var keys = !nativeKeys ? shimKeys : function(object) {
      var Ctor = object == null ? undefined : object.constructor;
      if ((typeof Ctor == 'function' && Ctor.prototype === object) ||
          (typeof object != 'function' && isArrayLike(object))) {
        return shimKeys(object);
      }
      return isObject(object) ? nativeKeys(object) : [];
    };

    /**
     * Creates an array of the own and inherited enumerable property names of `object`.
     *
     * **Note:** Non-object values are coerced to objects.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.keysIn(new Foo);
     * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
     */
    function keysIn(object) {
      if (object == null) {
        return [];
      }
      if (!isObject(object)) {
        object = Object(object);
      }
      var length = object.length;
      length = (length && isLength(length) &&
        (isArray(object) || isArguments(object)) && length) || 0;

      var Ctor = object.constructor,
          index = -1,
          isProto = typeof Ctor == 'function' && Ctor.prototype === object,
          result = Array(length),
          skipIndexes = length > 0;

      while (++index < length) {
        result[index] = (index + '');
      }
      for (var key in object) {
        if (!(skipIndexes && isIndex(key, length)) &&
            !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * The opposite of `_.mapValues`; this method creates an object with the
     * same values as `object` and keys generated by running each own enumerable
     * property of `object` through `iteratee`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns the new mapped object.
     * @example
     *
     * _.mapKeys({ 'a': 1, 'b': 2 }, function(value, key) {
     *   return key + value;
     * });
     * // => { 'a1': 1, 'b2': 2 }
     */
    var mapKeys = createObjectMapper(true);

    /**
     * Creates an object with the same keys as `object` and values generated by
     * running each own enumerable property of `object` through `iteratee`. The
     * iteratee function is bound to `thisArg` and invoked with three arguments:
     * (value, key, object).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns the new mapped object.
     * @example
     *
     * _.mapValues({ 'a': 1, 'b': 2 }, function(n) {
     *   return n * 3;
     * });
     * // => { 'a': 3, 'b': 6 }
     *
     * var users = {
     *   'fred':    { 'user': 'fred',    'age': 40 },
     *   'pebbles': { 'user': 'pebbles', 'age': 1 }
     * };
     *
     * // using the `_.property` callback shorthand
     * _.mapValues(users, 'age');
     * // => { 'fred': 40, 'pebbles': 1 } (iteration order is not guaranteed)
     */
    var mapValues = createObjectMapper();

    /**
     * The opposite of `_.pick`; this method creates an object composed of the
     * own and inherited enumerable properties of `object` that are not omitted.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The source object.
     * @param {Function|...(string|string[])} [predicate] The function invoked per
     *  iteration or property names to omit, specified as individual property
     *  names or arrays of property names.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Object} Returns the new object.
     * @example
     *
     * var object = { 'user': 'fred', 'age': 40 };
     *
     * _.omit(object, 'age');
     * // => { 'user': 'fred' }
     *
     * _.omit(object, _.isNumber);
     * // => { 'user': 'fred' }
     */
    var omit = restParam(function(object, props) {
      if (object == null) {
        return {};
      }
      if (typeof props[0] != 'function') {
        var props = arrayMap(baseFlatten(props), String);
        return pickByArray(object, baseDifference(keysIn(object), props));
      }
      var predicate = bindCallback(props[0], props[1], 3);
      return pickByCallback(object, function(value, key, object) {
        return !predicate(value, key, object);
      });
    });

    /**
     * Creates a two dimensional array of the key-value pairs for `object`,
     * e.g. `[[key1, value1], [key2, value2]]`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the new array of key-value pairs.
     * @example
     *
     * _.pairs({ 'barney': 36, 'fred': 40 });
     * // => [['barney', 36], ['fred', 40]] (iteration order is not guaranteed)
     */
    function pairs(object) {
      object = toObject(object);

      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        var key = props[index];
        result[index] = [key, object[key]];
      }
      return result;
    }

    /**
     * Creates an object composed of the picked `object` properties. Property
     * names may be specified as individual arguments or as arrays of property
     * names. If `predicate` is provided it is invoked for each property of `object`
     * picking the properties `predicate` returns truthy for. The predicate is
     * bound to `thisArg` and invoked with three arguments: (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The source object.
     * @param {Function|...(string|string[])} [predicate] The function invoked per
     *  iteration or property names to pick, specified as individual property
     *  names or arrays of property names.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Object} Returns the new object.
     * @example
     *
     * var object = { 'user': 'fred', 'age': 40 };
     *
     * _.pick(object, 'user');
     * // => { 'user': 'fred' }
     *
     * _.pick(object, _.isString);
     * // => { 'user': 'fred' }
     */
    var pick = restParam(function(object, props) {
      if (object == null) {
        return {};
      }
      return typeof props[0] == 'function'
        ? pickByCallback(object, bindCallback(props[0], props[1], 3))
        : pickByArray(object, baseFlatten(props));
    });

    /**
     * This method is like `_.get` except that if the resolved value is a function
     * it is invoked with the `this` binding of its parent object and its result
     * is returned.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @param {Array|string} path The path of the property to resolve.
     * @param {*} [defaultValue] The value returned if the resolved value is `undefined`.
     * @returns {*} Returns the resolved value.
     * @example
     *
     * var object = { 'a': [{ 'b': { 'c1': 3, 'c2': _.constant(4) } }] };
     *
     * _.result(object, 'a[0].b.c1');
     * // => 3
     *
     * _.result(object, 'a[0].b.c2');
     * // => 4
     *
     * _.result(object, 'a.b.c', 'default');
     * // => 'default'
     *
     * _.result(object, 'a.b.c', _.constant('default'));
     * // => 'default'
     */
    function result(object, path, defaultValue) {
      var result = object == null ? undefined : object[path];
      if (result === undefined) {
        if (object != null && !isKey(path, object)) {
          path = toPath(path);
          object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
          result = object == null ? undefined : object[last(path)];
        }
        result = result === undefined ? defaultValue : result;
      }
      return isFunction(result) ? result.call(object) : result;
    }

    /**
     * Sets the property value of `path` on `object`. If a portion of `path`
     * does not exist it is created.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to augment.
     * @param {Array|string} path The path of the property to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var object = { 'a': [{ 'b': { 'c': 3 } }] };
     *
     * _.set(object, 'a[0].b.c', 4);
     * console.log(object.a[0].b.c);
     * // => 4
     *
     * _.set(object, 'x[0].y.z', 5);
     * console.log(object.x[0].y.z);
     * // => 5
     */
    function set(object, path, value) {
      if (object == null) {
        return object;
      }
      var pathKey = (path + '');
      path = (object[pathKey] != null || isKey(path, object)) ? [pathKey] : toPath(path);

      var index = -1,
          length = path.length,
          lastIndex = length - 1,
          nested = object;

      while (nested != null && ++index < length) {
        var key = path[index];
        if (isObject(nested)) {
          if (index == lastIndex) {
            nested[key] = value;
          } else if (nested[key] == null) {
            nested[key] = isIndex(path[index + 1]) ? [] : {};
          }
        }
        nested = nested[key];
      }
      return object;
    }

    /**
     * An alternative to `_.reduce`; this method transforms `object` to a new
     * `accumulator` object which is the result of running each of its own enumerable
     * properties through `iteratee`, with each invocation potentially mutating
     * the `accumulator` object. The `iteratee` is bound to `thisArg` and invoked
     * with four arguments: (accumulator, value, key, object). Iteratee functions
     * may exit iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Array|Object} object The object to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [accumulator] The custom accumulator value.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * _.transform([2, 3, 4], function(result, n) {
     *   result.push(n *= n);
     *   return n % 2 == 0;
     * });
     * // => [4, 9]
     *
     * _.transform({ 'a': 1, 'b': 2 }, function(result, n, key) {
     *   result[key] = n * 3;
     * });
     * // => { 'a': 3, 'b': 6 }
     */
    function transform(object, iteratee, accumulator, thisArg) {
      var isArr = isArray(object) || isTypedArray(object);
      iteratee = getCallback(iteratee, thisArg, 4);

      if (accumulator == null) {
        if (isArr || isObject(object)) {
          var Ctor = object.constructor;
          if (isArr) {
            accumulator = isArray(object) ? new Ctor : [];
          } else {
            accumulator = baseCreate(isFunction(Ctor) ? Ctor.prototype : undefined);
          }
        } else {
          accumulator = {};
        }
      }
      (isArr ? arrayEach : baseForOwn)(object, function(value, index, object) {
        return iteratee(accumulator, value, index, object);
      });
      return accumulator;
    }

    /**
     * Creates an array of the own enumerable property values of `object`.
     *
     * **Note:** Non-object values are coerced to objects.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property values.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.values(new Foo);
     * // => [1, 2] (iteration order is not guaranteed)
     *
     * _.values('hi');
     * // => ['h', 'i']
     */
    function values(object) {
      return baseValues(object, keys(object));
    }

    /**
     * Creates an array of the own and inherited enumerable property values
     * of `object`.
     *
     * **Note:** Non-object values are coerced to objects.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property values.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.valuesIn(new Foo);
     * // => [1, 2, 3] (iteration order is not guaranteed)
     */
    function valuesIn(object) {
      return baseValues(object, keysIn(object));
    }

    /*------------------------------------------------------------------------*/

    /**
     * Checks if `n` is between `start` and up to but not including, `end`. If
     * `end` is not specified it is set to `start` with `start` then set to `0`.
     *
     * @static
     * @memberOf _
     * @category Number
     * @param {number} n The number to check.
     * @param {number} [start=0] The start of the range.
     * @param {number} end The end of the range.
     * @returns {boolean} Returns `true` if `n` is in the range, else `false`.
     * @example
     *
     * _.inRange(3, 2, 4);
     * // => true
     *
     * _.inRange(4, 8);
     * // => true
     *
     * _.inRange(4, 2);
     * // => false
     *
     * _.inRange(2, 2);
     * // => false
     *
     * _.inRange(1.2, 2);
     * // => true
     *
     * _.inRange(5.2, 4);
     * // => false
     */
    function inRange(value, start, end) {
      start = +start || 0;
      if (end === undefined) {
        end = start;
        start = 0;
      } else {
        end = +end || 0;
      }
      return value >= nativeMin(start, end) && value < nativeMax(start, end);
    }

    /**
     * Produces a random number between `min` and `max` (inclusive). If only one
     * argument is provided a number between `0` and the given number is returned.
     * If `floating` is `true`, or either `min` or `max` are floats, a floating-point
     * number is returned instead of an integer.
     *
     * @static
     * @memberOf _
     * @category Number
     * @param {number} [min=0] The minimum possible value.
     * @param {number} [max=1] The maximum possible value.
     * @param {boolean} [floating] Specify returning a floating-point number.
     * @returns {number} Returns the random number.
     * @example
     *
     * _.random(0, 5);
     * // => an integer between 0 and 5
     *
     * _.random(5);
     * // => also an integer between 0 and 5
     *
     * _.random(5, true);
     * // => a floating-point number between 0 and 5
     *
     * _.random(1.2, 5.2);
     * // => a floating-point number between 1.2 and 5.2
     */
    function random(min, max, floating) {
      if (floating && isIterateeCall(min, max, floating)) {
        max = floating = undefined;
      }
      var noMin = min == null,
          noMax = max == null;

      if (floating == null) {
        if (noMax && typeof min == 'boolean') {
          floating = min;
          min = 1;
        }
        else if (typeof max == 'boolean') {
          floating = max;
          noMax = true;
        }
      }
      if (noMin && noMax) {
        max = 1;
        noMax = false;
      }
      min = +min || 0;
      if (noMax) {
        max = min;
        min = 0;
      } else {
        max = +max || 0;
      }
      if (floating || min % 1 || max % 1) {
        var rand = nativeRandom();
        return nativeMin(min + (rand * (max - min + parseFloat('1e-' + ((rand + '').length - 1)))), max);
      }
      return baseRandom(min, max);
    }

    /*------------------------------------------------------------------------*/

    /**
     * Converts `string` to [camel case](https://en.wikipedia.org/wiki/CamelCase).
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to convert.
     * @returns {string} Returns the camel cased string.
     * @example
     *
     * _.camelCase('Foo Bar');
     * // => 'fooBar'
     *
     * _.camelCase('--foo-bar');
     * // => 'fooBar'
     *
     * _.camelCase('__foo_bar__');
     * // => 'fooBar'
     */
    var camelCase = createCompounder(function(result, word, index) {
      word = word.toLowerCase();
      return result + (index ? (word.charAt(0).toUpperCase() + word.slice(1)) : word);
    });

    /**
     * Capitalizes the first character of `string`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to capitalize.
     * @returns {string} Returns the capitalized string.
     * @example
     *
     * _.capitalize('fred');
     * // => 'Fred'
     */
    function capitalize(string) {
      string = baseToString(string);
      return string && (string.charAt(0).toUpperCase() + string.slice(1));
    }

    /**
     * Deburrs `string` by converting [latin-1 supplementary letters](https://en.wikipedia.org/wiki/Latin-1_Supplement_(Unicode_block)#Character_table)
     * to basic latin letters and removing [combining diacritical marks](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks).
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to deburr.
     * @returns {string} Returns the deburred string.
     * @example
     *
     * _.deburr('déjà vu');
     * // => 'deja vu'
     */
    function deburr(string) {
      string = baseToString(string);
      return string && string.replace(reLatin1, deburrLetter).replace(reComboMark, '');
    }

    /**
     * Checks if `string` ends with the given target string.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to search.
     * @param {string} [target] The string to search for.
     * @param {number} [position=string.length] The position to search from.
     * @returns {boolean} Returns `true` if `string` ends with `target`, else `false`.
     * @example
     *
     * _.endsWith('abc', 'c');
     * // => true
     *
     * _.endsWith('abc', 'b');
     * // => false
     *
     * _.endsWith('abc', 'b', 2);
     * // => true
     */
    function endsWith(string, target, position) {
      string = baseToString(string);
      target = (target + '');

      var length = string.length;
      position = position === undefined
        ? length
        : nativeMin(position < 0 ? 0 : (+position || 0), length);

      position -= target.length;
      return position >= 0 && string.indexOf(target, position) == position;
    }

    /**
     * Converts the characters "&", "<", ">", '"', "'", and "\`", in `string` to
     * their corresponding HTML entities.
     *
     * **Note:** No other characters are escaped. To escape additional characters
     * use a third-party library like [_he_](https://mths.be/he).
     *
     * Though the ">" character is escaped for symmetry, characters like
     * ">" and "/" don't need escaping in HTML and have no special meaning
     * unless they're part of a tag or unquoted attribute value.
     * See [Mathias Bynens's article](https://mathiasbynens.be/notes/ambiguous-ampersands)
     * (under "semi-related fun fact") for more details.
     *
     * Backticks are escaped because in Internet Explorer < 9, they can break out
     * of attribute values or HTML comments. See [#59](https://html5sec.org/#59),
     * [#102](https://html5sec.org/#102), [#108](https://html5sec.org/#108), and
     * [#133](https://html5sec.org/#133) of the [HTML5 Security Cheatsheet](https://html5sec.org/)
     * for more details.
     *
     * When working with HTML you should always [quote attribute values](http://wonko.com/post/html-escaping)
     * to reduce XSS vectors.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to escape.
     * @returns {string} Returns the escaped string.
     * @example
     *
     * _.escape('fred, barney, & pebbles');
     * // => 'fred, barney, &amp; pebbles'
     */
    function escape(string) {
      // Reset `lastIndex` because in IE < 9 `String#replace` does not.
      string = baseToString(string);
      return (string && reHasUnescapedHtml.test(string))
        ? string.replace(reUnescapedHtml, escapeHtmlChar)
        : string;
    }

    /**
     * Escapes the `RegExp` special characters "\", "/", "^", "$", ".", "|", "?",
     * "*", "+", "(", ")", "[", "]", "{" and "}" in `string`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to escape.
     * @returns {string} Returns the escaped string.
     * @example
     *
     * _.escapeRegExp('[lodash](https://lodash.com/)');
     * // => '\[lodash\]\(https:\/\/lodash\.com\/\)'
     */
    function escapeRegExp(string) {
      string = baseToString(string);
      return (string && reHasRegExpChars.test(string))
        ? string.replace(reRegExpChars, escapeRegExpChar)
        : (string || '(?:)');
    }

    /**
     * Converts `string` to [kebab case](https://en.wikipedia.org/wiki/Letter_case#Special_case_styles).
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to convert.
     * @returns {string} Returns the kebab cased string.
     * @example
     *
     * _.kebabCase('Foo Bar');
     * // => 'foo-bar'
     *
     * _.kebabCase('fooBar');
     * // => 'foo-bar'
     *
     * _.kebabCase('__foo_bar__');
     * // => 'foo-bar'
     */
    var kebabCase = createCompounder(function(result, word, index) {
      return result + (index ? '-' : '') + word.toLowerCase();
    });

    /**
     * Pads `string` on the left and right sides if it's shorter than `length`.
     * Padding characters are truncated if they can't be evenly divided by `length`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to pad.
     * @param {number} [length=0] The padding length.
     * @param {string} [chars=' '] The string used as padding.
     * @returns {string} Returns the padded string.
     * @example
     *
     * _.pad('abc', 8);
     * // => '  abc   '
     *
     * _.pad('abc', 8, '_-');
     * // => '_-abc_-_'
     *
     * _.pad('abc', 3);
     * // => 'abc'
     */
    function pad(string, length, chars) {
      string = baseToString(string);
      length = +length;

      var strLength = string.length;
      if (strLength >= length || !nativeIsFinite(length)) {
        return string;
      }
      var mid = (length - strLength) / 2,
          leftLength = nativeFloor(mid),
          rightLength = nativeCeil(mid);

      chars = createPadding('', rightLength, chars);
      return chars.slice(0, leftLength) + string + chars;
    }

    /**
     * Pads `string` on the left side if it's shorter than `length`. Padding
     * characters are truncated if they exceed `length`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to pad.
     * @param {number} [length=0] The padding length.
     * @param {string} [chars=' '] The string used as padding.
     * @returns {string} Returns the padded string.
     * @example
     *
     * _.padLeft('abc', 6);
     * // => '   abc'
     *
     * _.padLeft('abc', 6, '_-');
     * // => '_-_abc'
     *
     * _.padLeft('abc', 3);
     * // => 'abc'
     */
    var padLeft = createPadDir();

    /**
     * Pads `string` on the right side if it's shorter than `length`. Padding
     * characters are truncated if they exceed `length`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to pad.
     * @param {number} [length=0] The padding length.
     * @param {string} [chars=' '] The string used as padding.
     * @returns {string} Returns the padded string.
     * @example
     *
     * _.padRight('abc', 6);
     * // => 'abc   '
     *
     * _.padRight('abc', 6, '_-');
     * // => 'abc_-_'
     *
     * _.padRight('abc', 3);
     * // => 'abc'
     */
    var padRight = createPadDir(true);

    /**
     * Converts `string` to an integer of the specified radix. If `radix` is
     * `undefined` or `0`, a `radix` of `10` is used unless `value` is a hexadecimal,
     * in which case a `radix` of `16` is used.
     *
     * **Note:** This method aligns with the [ES5 implementation](https://es5.github.io/#E)
     * of `parseInt`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} string The string to convert.
     * @param {number} [radix] The radix to interpret `value` by.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {number} Returns the converted integer.
     * @example
     *
     * _.parseInt('08');
     * // => 8
     *
     * _.map(['6', '08', '10'], _.parseInt);
     * // => [6, 8, 10]
     */
    function parseInt(string, radix, guard) {
      // Firefox < 21 and Opera < 15 follow ES3 for `parseInt`.
      // Chrome fails to trim leading <BOM> whitespace characters.
      // See https://code.google.com/p/v8/issues/detail?id=3109 for more details.
      if (guard ? isIterateeCall(string, radix, guard) : radix == null) {
        radix = 0;
      } else if (radix) {
        radix = +radix;
      }
      string = trim(string);
      return nativeParseInt(string, radix || (reHasHexPrefix.test(string) ? 16 : 10));
    }

    /**
     * Repeats the given string `n` times.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to repeat.
     * @param {number} [n=0] The number of times to repeat the string.
     * @returns {string} Returns the repeated string.
     * @example
     *
     * _.repeat('*', 3);
     * // => '***'
     *
     * _.repeat('abc', 2);
     * // => 'abcabc'
     *
     * _.repeat('abc', 0);
     * // => ''
     */
    function repeat(string, n) {
      var result = '';
      string = baseToString(string);
      n = +n;
      if (n < 1 || !string || !nativeIsFinite(n)) {
        return result;
      }
      // Leverage the exponentiation by squaring algorithm for a faster repeat.
      // See https://en.wikipedia.org/wiki/Exponentiation_by_squaring for more details.
      do {
        if (n % 2) {
          result += string;
        }
        n = nativeFloor(n / 2);
        string += string;
      } while (n);

      return result;
    }

    /**
     * Converts `string` to [snake case](https://en.wikipedia.org/wiki/Snake_case).
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to convert.
     * @returns {string} Returns the snake cased string.
     * @example
     *
     * _.snakeCase('Foo Bar');
     * // => 'foo_bar'
     *
     * _.snakeCase('fooBar');
     * // => 'foo_bar'
     *
     * _.snakeCase('--foo-bar');
     * // => 'foo_bar'
     */
    var snakeCase = createCompounder(function(result, word, index) {
      return result + (index ? '_' : '') + word.toLowerCase();
    });

    /**
     * Converts `string` to [start case](https://en.wikipedia.org/wiki/Letter_case#Stylistic_or_specialised_usage).
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to convert.
     * @returns {string} Returns the start cased string.
     * @example
     *
     * _.startCase('--foo-bar');
     * // => 'Foo Bar'
     *
     * _.startCase('fooBar');
     * // => 'Foo Bar'
     *
     * _.startCase('__foo_bar__');
     * // => 'Foo Bar'
     */
    var startCase = createCompounder(function(result, word, index) {
      return result + (index ? ' ' : '') + (word.charAt(0).toUpperCase() + word.slice(1));
    });

    /**
     * Checks if `string` starts with the given target string.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to search.
     * @param {string} [target] The string to search for.
     * @param {number} [position=0] The position to search from.
     * @returns {boolean} Returns `true` if `string` starts with `target`, else `false`.
     * @example
     *
     * _.startsWith('abc', 'a');
     * // => true
     *
     * _.startsWith('abc', 'b');
     * // => false
     *
     * _.startsWith('abc', 'b', 1);
     * // => true
     */
    function startsWith(string, target, position) {
      string = baseToString(string);
      position = position == null
        ? 0
        : nativeMin(position < 0 ? 0 : (+position || 0), string.length);

      return string.lastIndexOf(target, position) == position;
    }

    /**
     * Creates a compiled template function that can interpolate data properties
     * in "interpolate" delimiters, HTML-escape interpolated data properties in
     * "escape" delimiters, and execute JavaScript in "evaluate" delimiters. Data
     * properties may be accessed as free variables in the template. If a setting
     * object is provided it takes precedence over `_.templateSettings` values.
     *
     * **Note:** In the development build `_.template` utilizes
     * [sourceURLs](http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl)
     * for easier debugging.
     *
     * For more information on precompiling templates see
     * [lodash's custom builds documentation](https://lodash.com/custom-builds).
     *
     * For more information on Chrome extension sandboxes see
     * [Chrome's extensions documentation](https://developer.chrome.com/extensions/sandboxingEval).
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The template string.
     * @param {Object} [options] The options object.
     * @param {RegExp} [options.escape] The HTML "escape" delimiter.
     * @param {RegExp} [options.evaluate] The "evaluate" delimiter.
     * @param {Object} [options.imports] An object to import into the template as free variables.
     * @param {RegExp} [options.interpolate] The "interpolate" delimiter.
     * @param {string} [options.sourceURL] The sourceURL of the template's compiled source.
     * @param {string} [options.variable] The data object variable name.
     * @param- {Object} [otherOptions] Enables the legacy `options` param signature.
     * @returns {Function} Returns the compiled template function.
     * @example
     *
     * // using the "interpolate" delimiter to create a compiled template
     * var compiled = _.template('hello <%= user %>!');
     * compiled({ 'user': 'fred' });
     * // => 'hello fred!'
     *
     * // using the HTML "escape" delimiter to escape data property values
     * var compiled = _.template('<b><%- value %></b>');
     * compiled({ 'value': '<script>' });
     * // => '<b>&lt;script&gt;</b>'
     *
     * // using the "evaluate" delimiter to execute JavaScript and generate HTML
     * var compiled = _.template('<% _.forEach(users, function(user) { %><li><%- user %></li><% }); %>');
     * compiled({ 'users': ['fred', 'barney'] });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the internal `print` function in "evaluate" delimiters
     * var compiled = _.template('<% print("hello " + user); %>!');
     * compiled({ 'user': 'barney' });
     * // => 'hello barney!'
     *
     * // using the ES delimiter as an alternative to the default "interpolate" delimiter
     * var compiled = _.template('hello ${ user }!');
     * compiled({ 'user': 'pebbles' });
     * // => 'hello pebbles!'
     *
     * // using custom template delimiters
     * _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
     * var compiled = _.template('hello {{ user }}!');
     * compiled({ 'user': 'mustache' });
     * // => 'hello mustache!'
     *
     * // using backslashes to treat delimiters as plain text
     * var compiled = _.template('<%= "\\<%- value %\\>" %>');
     * compiled({ 'value': 'ignored' });
     * // => '<%- value %>'
     *
     * // using the `imports` option to import `jQuery` as `jq`
     * var text = '<% jq.each(users, function(user) { %><li><%- user %></li><% }); %>';
     * var compiled = _.template(text, { 'imports': { 'jq': jQuery } });
     * compiled({ 'users': ['fred', 'barney'] });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the `sourceURL` option to specify a custom sourceURL for the template
     * var compiled = _.template('hello <%= user %>!', { 'sourceURL': '/basic/greeting.jst' });
     * compiled(data);
     * // => find the source of "greeting.jst" under the Sources tab or Resources panel of the web inspector
     *
     * // using the `variable` option to ensure a with-statement isn't used in the compiled template
     * var compiled = _.template('hi <%= data.user %>!', { 'variable': 'data' });
     * compiled.source;
     * // => function(data) {
     * //   var __t, __p = '';
     * //   __p += 'hi ' + ((__t = ( data.user )) == null ? '' : __t) + '!';
     * //   return __p;
     * // }
     *
     * // using the `source` property to inline compiled templates for meaningful
     * // line numbers in error messages and a stack trace
     * fs.writeFileSync(path.join(cwd, 'jst.js'), '\
     *   var JST = {\
     *     "main": ' + _.template(mainText).source + '\
     *   };\
     * ');
     */
    function template(string, options, otherOptions) {
      // Based on John Resig's `tmpl` implementation (http://ejohn.org/blog/javascript-micro-templating/)
      // and Laura Doktorova's doT.js (https://github.com/olado/doT).
      var settings = lodash.templateSettings;

      if (otherOptions && isIterateeCall(string, options, otherOptions)) {
        options = otherOptions = undefined;
      }
      string = baseToString(string);
      options = assignWith(baseAssign({}, otherOptions || options), settings, assignOwnDefaults);

      var imports = assignWith(baseAssign({}, options.imports), settings.imports, assignOwnDefaults),
          importsKeys = keys(imports),
          importsValues = baseValues(imports, importsKeys);

      var isEscaping,
          isEvaluating,
          index = 0,
          interpolate = options.interpolate || reNoMatch,
          source = "__p += '";

      // Compile the regexp to match each delimiter.
      var reDelimiters = RegExp(
        (options.escape || reNoMatch).source + '|' +
        interpolate.source + '|' +
        (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' +
        (options.evaluate || reNoMatch).source + '|$'
      , 'g');

      // Use a sourceURL for easier debugging.
      var sourceURL = '//# sourceURL=' +
        ('sourceURL' in options
          ? options.sourceURL
          : ('lodash.templateSources[' + (++templateCounter) + ']')
        ) + '\n';

      string.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
        interpolateValue || (interpolateValue = esTemplateValue);

        // Escape characters that can't be included in string literals.
        source += string.slice(index, offset).replace(reUnescapedString, escapeStringChar);

        // Replace delimiters with snippets.
        if (escapeValue) {
          isEscaping = true;
          source += "' +\n__e(" + escapeValue + ") +\n'";
        }
        if (evaluateValue) {
          isEvaluating = true;
          source += "';\n" + evaluateValue + ";\n__p += '";
        }
        if (interpolateValue) {
          source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
        }
        index = offset + match.length;

        // The JS engine embedded in Adobe products requires returning the `match`
        // string in order to produce the correct `offset` value.
        return match;
      });

      source += "';\n";

      // If `variable` is not specified wrap a with-statement around the generated
      // code to add the data object to the top of the scope chain.
      var variable = options.variable;
      if (!variable) {
        source = 'with (obj) {\n' + source + '\n}\n';
      }
      // Cleanup code by stripping empty strings.
      source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)
        .replace(reEmptyStringMiddle, '$1')
        .replace(reEmptyStringTrailing, '$1;');

      // Frame code as the function body.
      source = 'function(' + (variable || 'obj') + ') {\n' +
        (variable
          ? ''
          : 'obj || (obj = {});\n'
        ) +
        "var __t, __p = ''" +
        (isEscaping
           ? ', __e = _.escape'
           : ''
        ) +
        (isEvaluating
          ? ', __j = Array.prototype.join;\n' +
            "function print() { __p += __j.call(arguments, '') }\n"
          : ';\n'
        ) +
        source +
        'return __p\n}';

      var result = attempt(function() {
        return Function(importsKeys, sourceURL + 'return ' + source).apply(undefined, importsValues);
      });

      // Provide the compiled function's source by its `toString` method or
      // the `source` property as a convenience for inlining compiled templates.
      result.source = source;
      if (isError(result)) {
        throw result;
      }
      return result;
    }

    /**
     * Removes leading and trailing whitespace or specified characters from `string`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to trim.
     * @param {string} [chars=whitespace] The characters to trim.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {string} Returns the trimmed string.
     * @example
     *
     * _.trim('  abc  ');
     * // => 'abc'
     *
     * _.trim('-_-abc-_-', '_-');
     * // => 'abc'
     *
     * _.map(['  foo  ', '  bar  '], _.trim);
     * // => ['foo', 'bar']
     */
    function trim(string, chars, guard) {
      var value = string;
      string = baseToString(string);
      if (!string) {
        return string;
      }
      if (guard ? isIterateeCall(value, chars, guard) : chars == null) {
        return string.slice(trimmedLeftIndex(string), trimmedRightIndex(string) + 1);
      }
      chars = (chars + '');
      return string.slice(charsLeftIndex(string, chars), charsRightIndex(string, chars) + 1);
    }

    /**
     * Removes leading whitespace or specified characters from `string`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to trim.
     * @param {string} [chars=whitespace] The characters to trim.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {string} Returns the trimmed string.
     * @example
     *
     * _.trimLeft('  abc  ');
     * // => 'abc  '
     *
     * _.trimLeft('-_-abc-_-', '_-');
     * // => 'abc-_-'
     */
    function trimLeft(string, chars, guard) {
      var value = string;
      string = baseToString(string);
      if (!string) {
        return string;
      }
      if (guard ? isIterateeCall(value, chars, guard) : chars == null) {
        return string.slice(trimmedLeftIndex(string));
      }
      return string.slice(charsLeftIndex(string, (chars + '')));
    }

    /**
     * Removes trailing whitespace or specified characters from `string`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to trim.
     * @param {string} [chars=whitespace] The characters to trim.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {string} Returns the trimmed string.
     * @example
     *
     * _.trimRight('  abc  ');
     * // => '  abc'
     *
     * _.trimRight('-_-abc-_-', '_-');
     * // => '-_-abc'
     */
    function trimRight(string, chars, guard) {
      var value = string;
      string = baseToString(string);
      if (!string) {
        return string;
      }
      if (guard ? isIterateeCall(value, chars, guard) : chars == null) {
        return string.slice(0, trimmedRightIndex(string) + 1);
      }
      return string.slice(0, charsRightIndex(string, (chars + '')) + 1);
    }

    /**
     * Truncates `string` if it's longer than the given maximum string length.
     * The last characters of the truncated string are replaced with the omission
     * string which defaults to "...".
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to truncate.
     * @param {Object|number} [options] The options object or maximum string length.
     * @param {number} [options.length=30] The maximum string length.
     * @param {string} [options.omission='...'] The string to indicate text is omitted.
     * @param {RegExp|string} [options.separator] The separator pattern to truncate to.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {string} Returns the truncated string.
     * @example
     *
     * _.trunc('hi-diddly-ho there, neighborino');
     * // => 'hi-diddly-ho there, neighbo...'
     *
     * _.trunc('hi-diddly-ho there, neighborino', 24);
     * // => 'hi-diddly-ho there, n...'
     *
     * _.trunc('hi-diddly-ho there, neighborino', {
     *   'length': 24,
     *   'separator': ' '
     * });
     * // => 'hi-diddly-ho there,...'
     *
     * _.trunc('hi-diddly-ho there, neighborino', {
     *   'length': 24,
     *   'separator': /,? +/
     * });
     * // => 'hi-diddly-ho there...'
     *
     * _.trunc('hi-diddly-ho there, neighborino', {
     *   'omission': ' [...]'
     * });
     * // => 'hi-diddly-ho there, neig [...]'
     */
    function trunc(string, options, guard) {
      if (guard && isIterateeCall(string, options, guard)) {
        options = undefined;
      }
      var length = DEFAULT_TRUNC_LENGTH,
          omission = DEFAULT_TRUNC_OMISSION;

      if (options != null) {
        if (isObject(options)) {
          var separator = 'separator' in options ? options.separator : separator;
          length = 'length' in options ? (+options.length || 0) : length;
          omission = 'omission' in options ? baseToString(options.omission) : omission;
        } else {
          length = +options || 0;
        }
      }
      string = baseToString(string);
      if (length >= string.length) {
        return string;
      }
      var end = length - omission.length;
      if (end < 1) {
        return omission;
      }
      var result = string.slice(0, end);
      if (separator == null) {
        return result + omission;
      }
      if (isRegExp(separator)) {
        if (string.slice(end).search(separator)) {
          var match,
              newEnd,
              substring = string.slice(0, end);

          if (!separator.global) {
            separator = RegExp(separator.source, (reFlags.exec(separator) || '') + 'g');
          }
          separator.lastIndex = 0;
          while ((match = separator.exec(substring))) {
            newEnd = match.index;
          }
          result = result.slice(0, newEnd == null ? end : newEnd);
        }
      } else if (string.indexOf(separator, end) != end) {
        var index = result.lastIndexOf(separator);
        if (index > -1) {
          result = result.slice(0, index);
        }
      }
      return result + omission;
    }

    /**
     * The inverse of `_.escape`; this method converts the HTML entities
     * `&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`, and `&#96;` in `string` to their
     * corresponding characters.
     *
     * **Note:** No other HTML entities are unescaped. To unescape additional HTML
     * entities use a third-party library like [_he_](https://mths.be/he).
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to unescape.
     * @returns {string} Returns the unescaped string.
     * @example
     *
     * _.unescape('fred, barney, &amp; pebbles');
     * // => 'fred, barney, & pebbles'
     */
    function unescape(string) {
      string = baseToString(string);
      return (string && reHasEscapedHtml.test(string))
        ? string.replace(reEscapedHtml, unescapeHtmlChar)
        : string;
    }

    /**
     * Splits `string` into an array of its words.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to inspect.
     * @param {RegExp|string} [pattern] The pattern to match words.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Array} Returns the words of `string`.
     * @example
     *
     * _.words('fred, barney, & pebbles');
     * // => ['fred', 'barney', 'pebbles']
     *
     * _.words('fred, barney, & pebbles', /[^, ]+/g);
     * // => ['fred', 'barney', '&', 'pebbles']
     */
    function words(string, pattern, guard) {
      if (guard && isIterateeCall(string, pattern, guard)) {
        pattern = undefined;
      }
      string = baseToString(string);
      return string.match(pattern || reWords) || [];
    }

    /*------------------------------------------------------------------------*/

    /**
     * Attempts to invoke `func`, returning either the result or the caught error
     * object. Any additional arguments are provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Function} func The function to attempt.
     * @returns {*} Returns the `func` result or error object.
     * @example
     *
     * // avoid throwing errors for invalid selectors
     * var elements = _.attempt(function(selector) {
     *   return document.querySelectorAll(selector);
     * }, '>_>');
     *
     * if (_.isError(elements)) {
     *   elements = [];
     * }
     */
    var attempt = restParam(function(func, args) {
      try {
        return func.apply(undefined, args);
      } catch(e) {
        return isError(e) ? e : new Error(e);
      }
    });

    /**
     * Creates a function that invokes `func` with the `this` binding of `thisArg`
     * and arguments of the created function. If `func` is a property name the
     * created callback returns the property value for a given element. If `func`
     * is an object the created callback returns `true` for elements that contain
     * the equivalent object properties, otherwise it returns `false`.
     *
     * @static
     * @memberOf _
     * @alias iteratee
     * @category Utility
     * @param {*} [func=_.identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Function} Returns the callback.
     * @example
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36 },
     *   { 'user': 'fred',   'age': 40 }
     * ];
     *
     * // wrap to create custom callback shorthands
     * _.callback = _.wrap(_.callback, function(callback, func, thisArg) {
     *   var match = /^(.+?)__([gl]t)(.+)$/.exec(func);
     *   if (!match) {
     *     return callback(func, thisArg);
     *   }
     *   return function(object) {
     *     return match[2] == 'gt'
     *       ? object[match[1]] > match[3]
     *       : object[match[1]] < match[3];
     *   };
     * });
     *
     * _.filter(users, 'age__gt36');
     * // => [{ 'user': 'fred', 'age': 40 }]
     */
    function callback(func, thisArg, guard) {
      if (guard && isIterateeCall(func, thisArg, guard)) {
        thisArg = undefined;
      }
      return isObjectLike(func)
        ? matches(func)
        : baseCallback(func, thisArg);
    }

    /**
     * Creates a function that returns `value`.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {*} value The value to return from the new function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var object = { 'user': 'fred' };
     * var getter = _.constant(object);
     *
     * getter() === object;
     * // => true
     */
    function constant(value) {
      return function() {
        return value;
      };
    }

    /**
     * This method returns the first argument provided to it.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {*} value Any value.
     * @returns {*} Returns `value`.
     * @example
     *
     * var object = { 'user': 'fred' };
     *
     * _.identity(object) === object;
     * // => true
     */
    function identity(value) {
      return value;
    }

    /**
     * Creates a function that performs a deep comparison between a given object
     * and `source`, returning `true` if the given object has equivalent property
     * values, else `false`.
     *
     * **Note:** This method supports comparing arrays, booleans, `Date` objects,
     * numbers, `Object` objects, regexes, and strings. Objects are compared by
     * their own, not inherited, enumerable properties. For comparing a single
     * own or inherited property value see `_.matchesProperty`.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Object} source The object of property values to match.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36, 'active': true },
     *   { 'user': 'fred',   'age': 40, 'active': false }
     * ];
     *
     * _.filter(users, _.matches({ 'age': 40, 'active': false }));
     * // => [{ 'user': 'fred', 'age': 40, 'active': false }]
     */
    function matches(source) {
      return baseMatches(baseClone(source, true));
    }

    /**
     * Creates a function that compares the property value of `path` on a given
     * object to `value`.
     *
     * **Note:** This method supports comparing arrays, booleans, `Date` objects,
     * numbers, `Object` objects, regexes, and strings. Objects are compared by
     * their own, not inherited, enumerable properties.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Array|string} path The path of the property to get.
     * @param {*} srcValue The value to match.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var users = [
     *   { 'user': 'barney' },
     *   { 'user': 'fred' }
     * ];
     *
     * _.find(users, _.matchesProperty('user', 'fred'));
     * // => { 'user': 'fred' }
     */
    function matchesProperty(path, srcValue) {
      return baseMatchesProperty(path, baseClone(srcValue, true));
    }

    /**
     * Creates a function that invokes the method at `path` on a given object.
     * Any additional arguments are provided to the invoked method.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Array|string} path The path of the method to invoke.
     * @param {...*} [args] The arguments to invoke the method with.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var objects = [
     *   { 'a': { 'b': { 'c': _.constant(2) } } },
     *   { 'a': { 'b': { 'c': _.constant(1) } } }
     * ];
     *
     * _.map(objects, _.method('a.b.c'));
     * // => [2, 1]
     *
     * _.invoke(_.sortBy(objects, _.method(['a', 'b', 'c'])), 'a.b.c');
     * // => [1, 2]
     */
    var method = restParam(function(path, args) {
      return function(object) {
        return invokePath(object, path, args);
      };
    });

    /**
     * The opposite of `_.method`; this method creates a function that invokes
     * the method at a given path on `object`. Any additional arguments are
     * provided to the invoked method.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Object} object The object to query.
     * @param {...*} [args] The arguments to invoke the method with.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var array = _.times(3, _.constant),
     *     object = { 'a': array, 'b': array, 'c': array };
     *
     * _.map(['a[2]', 'c[0]'], _.methodOf(object));
     * // => [2, 0]
     *
     * _.map([['a', '2'], ['c', '0']], _.methodOf(object));
     * // => [2, 0]
     */
    var methodOf = restParam(function(object, args) {
      return function(path) {
        return invokePath(object, path, args);
      };
    });

    /**
     * Adds all own enumerable function properties of a source object to the
     * destination object. If `object` is a function then methods are added to
     * its prototype as well.
     *
     * **Note:** Use `_.runInContext` to create a pristine `lodash` function to
     * avoid conflicts caused by modifying the original.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Function|Object} [object=lodash] The destination object.
     * @param {Object} source The object of functions to add.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.chain=true] Specify whether the functions added
     *  are chainable.
     * @returns {Function|Object} Returns `object`.
     * @example
     *
     * function vowels(string) {
     *   return _.filter(string, function(v) {
     *     return /[aeiou]/i.test(v);
     *   });
     * }
     *
     * _.mixin({ 'vowels': vowels });
     * _.vowels('fred');
     * // => ['e']
     *
     * _('fred').vowels().value();
     * // => ['e']
     *
     * _.mixin({ 'vowels': vowels }, { 'chain': false });
     * _('fred').vowels();
     * // => ['e']
     */
    function mixin(object, source, options) {
      if (options == null) {
        var isObj = isObject(source),
            props = isObj ? keys(source) : undefined,
            methodNames = (props && props.length) ? baseFunctions(source, props) : undefined;

        if (!(methodNames ? methodNames.length : isObj)) {
          methodNames = false;
          options = source;
          source = object;
          object = this;
        }
      }
      if (!methodNames) {
        methodNames = baseFunctions(source, keys(source));
      }
      var chain = true,
          index = -1,
          isFunc = isFunction(object),
          length = methodNames.length;

      if (options === false) {
        chain = false;
      } else if (isObject(options) && 'chain' in options) {
        chain = options.chain;
      }
      while (++index < length) {
        var methodName = methodNames[index],
            func = source[methodName];

        object[methodName] = func;
        if (isFunc) {
          object.prototype[methodName] = (function(func) {
            return function() {
              var chainAll = this.__chain__;
              if (chain || chainAll) {
                var result = object(this.__wrapped__),
                    actions = result.__actions__ = arrayCopy(this.__actions__);

                actions.push({ 'func': func, 'args': arguments, 'thisArg': object });
                result.__chain__ = chainAll;
                return result;
              }
              return func.apply(object, arrayPush([this.value()], arguments));
            };
          }(func));
        }
      }
      return object;
    }

    /**
     * Reverts the `_` variable to its previous value and returns a reference to
     * the `lodash` function.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @returns {Function} Returns the `lodash` function.
     * @example
     *
     * var lodash = _.noConflict();
     */
    function noConflict() {
      root._ = oldDash;
      return this;
    }

    /**
     * A no-operation function that returns `undefined` regardless of the
     * arguments it receives.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @example
     *
     * var object = { 'user': 'fred' };
     *
     * _.noop(object) === undefined;
     * // => true
     */
    function noop() {
      // No operation performed.
    }

    /**
     * Creates a function that returns the property value at `path` on a
     * given object.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Array|string} path The path of the property to get.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var objects = [
     *   { 'a': { 'b': { 'c': 2 } } },
     *   { 'a': { 'b': { 'c': 1 } } }
     * ];
     *
     * _.map(objects, _.property('a.b.c'));
     * // => [2, 1]
     *
     * _.pluck(_.sortBy(objects, _.property(['a', 'b', 'c'])), 'a.b.c');
     * // => [1, 2]
     */
    function property(path) {
      return isKey(path) ? baseProperty(path) : basePropertyDeep(path);
    }

    /**
     * The opposite of `_.property`; this method creates a function that returns
     * the property value at a given path on `object`.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Object} object The object to query.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var array = [0, 1, 2],
     *     object = { 'a': array, 'b': array, 'c': array };
     *
     * _.map(['a[2]', 'c[0]'], _.propertyOf(object));
     * // => [2, 0]
     *
     * _.map([['a', '2'], ['c', '0']], _.propertyOf(object));
     * // => [2, 0]
     */
    function propertyOf(object) {
      return function(path) {
        return baseGet(object, toPath(path), path + '');
      };
    }

    /**
     * Creates an array of numbers (positive and/or negative) progressing from
     * `start` up to, but not including, `end`. If `end` is not specified it is
     * set to `start` with `start` then set to `0`. If `end` is less than `start`
     * a zero-length range is created unless a negative `step` is specified.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {number} [start=0] The start of the range.
     * @param {number} end The end of the range.
     * @param {number} [step=1] The value to increment or decrement by.
     * @returns {Array} Returns the new array of numbers.
     * @example
     *
     * _.range(4);
     * // => [0, 1, 2, 3]
     *
     * _.range(1, 5);
     * // => [1, 2, 3, 4]
     *
     * _.range(0, 20, 5);
     * // => [0, 5, 10, 15]
     *
     * _.range(0, -4, -1);
     * // => [0, -1, -2, -3]
     *
     * _.range(1, 4, 0);
     * // => [1, 1, 1]
     *
     * _.range(0);
     * // => []
     */
    function range(start, end, step) {
      if (step && isIterateeCall(start, end, step)) {
        end = step = undefined;
      }
      start = +start || 0;
      step = step == null ? 1 : (+step || 0);

      if (end == null) {
        end = start;
        start = 0;
      } else {
        end = +end || 0;
      }
      // Use `Array(length)` so engines like Chakra and V8 avoid slower modes.
      // See https://youtu.be/XAqIpGU8ZZk#t=17m25s for more details.
      var index = -1,
          length = nativeMax(nativeCeil((end - start) / (step || 1)), 0),
          result = Array(length);

      while (++index < length) {
        result[index] = start;
        start += step;
      }
      return result;
    }

    /**
     * Invokes the iteratee function `n` times, returning an array of the results
     * of each invocation. The `iteratee` is bound to `thisArg` and invoked with
     * one argument; (index).
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {number} n The number of times to invoke `iteratee`.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Array} Returns the array of results.
     * @example
     *
     * var diceRolls = _.times(3, _.partial(_.random, 1, 6, false));
     * // => [3, 6, 4]
     *
     * _.times(3, function(n) {
     *   mage.castSpell(n);
     * });
     * // => invokes `mage.castSpell(n)` three times with `n` of `0`, `1`, and `2`
     *
     * _.times(3, function(n) {
     *   this.cast(n);
     * }, mage);
     * // => also invokes `mage.castSpell(n)` three times
     */
    function times(n, iteratee, thisArg) {
      n = nativeFloor(n);

      // Exit early to avoid a JSC JIT bug in Safari 8
      // where `Array(0)` is treated as `Array(1)`.
      if (n < 1 || !nativeIsFinite(n)) {
        return [];
      }
      var index = -1,
          result = Array(nativeMin(n, MAX_ARRAY_LENGTH));

      iteratee = bindCallback(iteratee, thisArg, 1);
      while (++index < n) {
        if (index < MAX_ARRAY_LENGTH) {
          result[index] = iteratee(index);
        } else {
          iteratee(index);
        }
      }
      return result;
    }

    /**
     * Generates a unique ID. If `prefix` is provided the ID is appended to it.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {string} [prefix] The value to prefix the ID with.
     * @returns {string} Returns the unique ID.
     * @example
     *
     * _.uniqueId('contact_');
     * // => 'contact_104'
     *
     * _.uniqueId();
     * // => '105'
     */
    function uniqueId(prefix) {
      var id = ++idCounter;
      return baseToString(prefix) + id;
    }

    /*------------------------------------------------------------------------*/

    /**
     * Adds two numbers.
     *
     * @static
     * @memberOf _
     * @category Math
     * @param {number} augend The first number to add.
     * @param {number} addend The second number to add.
     * @returns {number} Returns the sum.
     * @example
     *
     * _.add(6, 4);
     * // => 10
     */
    function add(augend, addend) {
      return (+augend || 0) + (+addend || 0);
    }

    /**
     * Calculates `n` rounded up to `precision`.
     *
     * @static
     * @memberOf _
     * @category Math
     * @param {number} n The number to round up.
     * @param {number} [precision=0] The precision to round up to.
     * @returns {number} Returns the rounded up number.
     * @example
     *
     * _.ceil(4.006);
     * // => 5
     *
     * _.ceil(6.004, 2);
     * // => 6.01
     *
     * _.ceil(6040, -2);
     * // => 6100
     */
    var ceil = createRound('ceil');

    /**
     * Calculates `n` rounded down to `precision`.
     *
     * @static
     * @memberOf _
     * @category Math
     * @param {number} n The number to round down.
     * @param {number} [precision=0] The precision to round down to.
     * @returns {number} Returns the rounded down number.
     * @example
     *
     * _.floor(4.006);
     * // => 4
     *
     * _.floor(0.046, 2);
     * // => 0.04
     *
     * _.floor(4060, -2);
     * // => 4000
     */
    var floor = createRound('floor');

    /**
     * Gets the maximum value of `collection`. If `collection` is empty or falsey
     * `-Infinity` is returned. If an iteratee function is provided it is invoked
     * for each value in `collection` to generate the criterion by which the value
     * is ranked. The `iteratee` is bound to `thisArg` and invoked with three
     * arguments: (value, index, collection).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Math
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {*} Returns the maximum value.
     * @example
     *
     * _.max([4, 2, 8, 6]);
     * // => 8
     *
     * _.max([]);
     * // => -Infinity
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36 },
     *   { 'user': 'fred',   'age': 40 }
     * ];
     *
     * _.max(users, function(chr) {
     *   return chr.age;
     * });
     * // => { 'user': 'fred', 'age': 40 }
     *
     * // using the `_.property` callback shorthand
     * _.max(users, 'age');
     * // => { 'user': 'fred', 'age': 40 }
     */
    var max = createExtremum(gt, NEGATIVE_INFINITY);

    /**
     * Gets the minimum value of `collection`. If `collection` is empty or falsey
     * `Infinity` is returned. If an iteratee function is provided it is invoked
     * for each value in `collection` to generate the criterion by which the value
     * is ranked. The `iteratee` is bound to `thisArg` and invoked with three
     * arguments: (value, index, collection).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Math
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {*} Returns the minimum value.
     * @example
     *
     * _.min([4, 2, 8, 6]);
     * // => 2
     *
     * _.min([]);
     * // => Infinity
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36 },
     *   { 'user': 'fred',   'age': 40 }
     * ];
     *
     * _.min(users, function(chr) {
     *   return chr.age;
     * });
     * // => { 'user': 'barney', 'age': 36 }
     *
     * // using the `_.property` callback shorthand
     * _.min(users, 'age');
     * // => { 'user': 'barney', 'age': 36 }
     */
    var min = createExtremum(lt, POSITIVE_INFINITY);

    /**
     * Calculates `n` rounded to `precision`.
     *
     * @static
     * @memberOf _
     * @category Math
     * @param {number} n The number to round.
     * @param {number} [precision=0] The precision to round to.
     * @returns {number} Returns the rounded number.
     * @example
     *
     * _.round(4.006);
     * // => 4
     *
     * _.round(4.006, 2);
     * // => 4.01
     *
     * _.round(4060, -2);
     * // => 4100
     */
    var round = createRound('round');

    /**
     * Gets the sum of the values in `collection`.
     *
     * @static
     * @memberOf _
     * @category Math
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {number} Returns the sum.
     * @example
     *
     * _.sum([4, 6]);
     * // => 10
     *
     * _.sum({ 'a': 4, 'b': 6 });
     * // => 10
     *
     * var objects = [
     *   { 'n': 4 },
     *   { 'n': 6 }
     * ];
     *
     * _.sum(objects, function(object) {
     *   return object.n;
     * });
     * // => 10
     *
     * // using the `_.property` callback shorthand
     * _.sum(objects, 'n');
     * // => 10
     */
    function sum(collection, iteratee, thisArg) {
      if (thisArg && isIterateeCall(collection, iteratee, thisArg)) {
        iteratee = undefined;
      }
      iteratee = getCallback(iteratee, thisArg, 3);
      return iteratee.length == 1
        ? arraySum(isArray(collection) ? collection : toIterable(collection), iteratee)
        : baseSum(collection, iteratee);
    }

    /*------------------------------------------------------------------------*/

    // Ensure wrappers are instances of `baseLodash`.
    lodash.prototype = baseLodash.prototype;

    LodashWrapper.prototype = baseCreate(baseLodash.prototype);
    LodashWrapper.prototype.constructor = LodashWrapper;

    LazyWrapper.prototype = baseCreate(baseLodash.prototype);
    LazyWrapper.prototype.constructor = LazyWrapper;

    // Add functions to the `Map` cache.
    MapCache.prototype['delete'] = mapDelete;
    MapCache.prototype.get = mapGet;
    MapCache.prototype.has = mapHas;
    MapCache.prototype.set = mapSet;

    // Add functions to the `Set` cache.
    SetCache.prototype.push = cachePush;

    // Assign cache to `_.memoize`.
    memoize.Cache = MapCache;

    // Add functions that return wrapped values when chaining.
    lodash.after = after;
    lodash.ary = ary;
    lodash.assign = assign;
    lodash.at = at;
    lodash.before = before;
    lodash.bind = bind;
    lodash.bindAll = bindAll;
    lodash.bindKey = bindKey;
    lodash.callback = callback;
    lodash.chain = chain;
    lodash.chunk = chunk;
    lodash.compact = compact;
    lodash.constant = constant;
    lodash.countBy = countBy;
    lodash.create = create;
    lodash.curry = curry;
    lodash.curryRight = curryRight;
    lodash.debounce = debounce;
    lodash.defaults = defaults;
    lodash.defaultsDeep = defaultsDeep;
    lodash.defer = defer;
    lodash.delay = delay;
    lodash.difference = difference;
    lodash.drop = drop;
    lodash.dropRight = dropRight;
    lodash.dropRightWhile = dropRightWhile;
    lodash.dropWhile = dropWhile;
    lodash.fill = fill;
    lodash.filter = filter;
    lodash.flatten = flatten;
    lodash.flattenDeep = flattenDeep;
    lodash.flow = flow;
    lodash.flowRight = flowRight;
    lodash.forEach = forEach;
    lodash.forEachRight = forEachRight;
    lodash.forIn = forIn;
    lodash.forInRight = forInRight;
    lodash.forOwn = forOwn;
    lodash.forOwnRight = forOwnRight;
    lodash.functions = functions;
    lodash.groupBy = groupBy;
    lodash.indexBy = indexBy;
    lodash.initial = initial;
    lodash.intersection = intersection;
    lodash.invert = invert;
    lodash.invoke = invoke;
    lodash.keys = keys;
    lodash.keysIn = keysIn;
    lodash.map = map;
    lodash.mapKeys = mapKeys;
    lodash.mapValues = mapValues;
    lodash.matches = matches;
    lodash.matchesProperty = matchesProperty;
    lodash.memoize = memoize;
    lodash.merge = merge;
    lodash.method = method;
    lodash.methodOf = methodOf;
    lodash.mixin = mixin;
    lodash.modArgs = modArgs;
    lodash.negate = negate;
    lodash.omit = omit;
    lodash.once = once;
    lodash.pairs = pairs;
    lodash.partial = partial;
    lodash.partialRight = partialRight;
    lodash.partition = partition;
    lodash.pick = pick;
    lodash.pluck = pluck;
    lodash.property = property;
    lodash.propertyOf = propertyOf;
    lodash.pull = pull;
    lodash.pullAt = pullAt;
    lodash.range = range;
    lodash.rearg = rearg;
    lodash.reject = reject;
    lodash.remove = remove;
    lodash.rest = rest;
    lodash.restParam = restParam;
    lodash.set = set;
    lodash.shuffle = shuffle;
    lodash.slice = slice;
    lodash.sortBy = sortBy;
    lodash.sortByAll = sortByAll;
    lodash.sortByOrder = sortByOrder;
    lodash.spread = spread;
    lodash.take = take;
    lodash.takeRight = takeRight;
    lodash.takeRightWhile = takeRightWhile;
    lodash.takeWhile = takeWhile;
    lodash.tap = tap;
    lodash.throttle = throttle;
    lodash.thru = thru;
    lodash.times = times;
    lodash.toArray = toArray;
    lodash.toPlainObject = toPlainObject;
    lodash.transform = transform;
    lodash.union = union;
    lodash.uniq = uniq;
    lodash.unzip = unzip;
    lodash.unzipWith = unzipWith;
    lodash.values = values;
    lodash.valuesIn = valuesIn;
    lodash.where = where;
    lodash.without = without;
    lodash.wrap = wrap;
    lodash.xor = xor;
    lodash.zip = zip;
    lodash.zipObject = zipObject;
    lodash.zipWith = zipWith;

    // Add aliases.
    lodash.backflow = flowRight;
    lodash.collect = map;
    lodash.compose = flowRight;
    lodash.each = forEach;
    lodash.eachRight = forEachRight;
    lodash.extend = assign;
    lodash.iteratee = callback;
    lodash.methods = functions;
    lodash.object = zipObject;
    lodash.select = filter;
    lodash.tail = rest;
    lodash.unique = uniq;

    // Add functions to `lodash.prototype`.
    mixin(lodash, lodash);

    /*------------------------------------------------------------------------*/

    // Add functions that return unwrapped values when chaining.
    lodash.add = add;
    lodash.attempt = attempt;
    lodash.camelCase = camelCase;
    lodash.capitalize = capitalize;
    lodash.ceil = ceil;
    lodash.clone = clone;
    lodash.cloneDeep = cloneDeep;
    lodash.deburr = deburr;
    lodash.endsWith = endsWith;
    lodash.escape = escape;
    lodash.escapeRegExp = escapeRegExp;
    lodash.every = every;
    lodash.find = find;
    lodash.findIndex = findIndex;
    lodash.findKey = findKey;
    lodash.findLast = findLast;
    lodash.findLastIndex = findLastIndex;
    lodash.findLastKey = findLastKey;
    lodash.findWhere = findWhere;
    lodash.first = first;
    lodash.floor = floor;
    lodash.get = get;
    lodash.gt = gt;
    lodash.gte = gte;
    lodash.has = has;
    lodash.identity = identity;
    lodash.includes = includes;
    lodash.indexOf = indexOf;
    lodash.inRange = inRange;
    lodash.isArguments = isArguments;
    lodash.isArray = isArray;
    lodash.isBoolean = isBoolean;
    lodash.isDate = isDate;
    lodash.isElement = isElement;
    lodash.isEmpty = isEmpty;
    lodash.isEqual = isEqual;
    lodash.isError = isError;
    lodash.isFinite = isFinite;
    lodash.isFunction = isFunction;
    lodash.isMatch = isMatch;
    lodash.isNaN = isNaN;
    lodash.isNative = isNative;
    lodash.isNull = isNull;
    lodash.isNumber = isNumber;
    lodash.isObject = isObject;
    lodash.isPlainObject = isPlainObject;
    lodash.isRegExp = isRegExp;
    lodash.isString = isString;
    lodash.isTypedArray = isTypedArray;
    lodash.isUndefined = isUndefined;
    lodash.kebabCase = kebabCase;
    lodash.last = last;
    lodash.lastIndexOf = lastIndexOf;
    lodash.lt = lt;
    lodash.lte = lte;
    lodash.max = max;
    lodash.min = min;
    lodash.noConflict = noConflict;
    lodash.noop = noop;
    lodash.now = now;
    lodash.pad = pad;
    lodash.padLeft = padLeft;
    lodash.padRight = padRight;
    lodash.parseInt = parseInt;
    lodash.random = random;
    lodash.reduce = reduce;
    lodash.reduceRight = reduceRight;
    lodash.repeat = repeat;
    lodash.result = result;
    lodash.round = round;
    lodash.runInContext = runInContext;
    lodash.size = size;
    lodash.snakeCase = snakeCase;
    lodash.some = some;
    lodash.sortedIndex = sortedIndex;
    lodash.sortedLastIndex = sortedLastIndex;
    lodash.startCase = startCase;
    lodash.startsWith = startsWith;
    lodash.sum = sum;
    lodash.template = template;
    lodash.trim = trim;
    lodash.trimLeft = trimLeft;
    lodash.trimRight = trimRight;
    lodash.trunc = trunc;
    lodash.unescape = unescape;
    lodash.uniqueId = uniqueId;
    lodash.words = words;

    // Add aliases.
    lodash.all = every;
    lodash.any = some;
    lodash.contains = includes;
    lodash.eq = isEqual;
    lodash.detect = find;
    lodash.foldl = reduce;
    lodash.foldr = reduceRight;
    lodash.head = first;
    lodash.include = includes;
    lodash.inject = reduce;

    mixin(lodash, (function() {
      var source = {};
      baseForOwn(lodash, function(func, methodName) {
        if (!lodash.prototype[methodName]) {
          source[methodName] = func;
        }
      });
      return source;
    }()), false);

    /*------------------------------------------------------------------------*/

    // Add functions capable of returning wrapped and unwrapped values when chaining.
    lodash.sample = sample;

    lodash.prototype.sample = function(n) {
      if (!this.__chain__ && n == null) {
        return sample(this.value());
      }
      return this.thru(function(value) {
        return sample(value, n);
      });
    };

    /*------------------------------------------------------------------------*/

    /**
     * The semantic version number.
     *
     * @static
     * @memberOf _
     * @type string
     */
    lodash.VERSION = VERSION;

    // Assign default placeholders.
    arrayEach(['bind', 'bindKey', 'curry', 'curryRight', 'partial', 'partialRight'], function(methodName) {
      lodash[methodName].placeholder = lodash;
    });

    // Add `LazyWrapper` methods for `_.drop` and `_.take` variants.
    arrayEach(['drop', 'take'], function(methodName, index) {
      LazyWrapper.prototype[methodName] = function(n) {
        var filtered = this.__filtered__;
        if (filtered && !index) {
          return new LazyWrapper(this);
        }
        n = n == null ? 1 : nativeMax(nativeFloor(n) || 0, 0);

        var result = this.clone();
        if (filtered) {
          result.__takeCount__ = nativeMin(result.__takeCount__, n);
        } else {
          result.__views__.push({ 'size': n, 'type': methodName + (result.__dir__ < 0 ? 'Right' : '') });
        }
        return result;
      };

      LazyWrapper.prototype[methodName + 'Right'] = function(n) {
        return this.reverse()[methodName](n).reverse();
      };
    });

    // Add `LazyWrapper` methods that accept an `iteratee` value.
    arrayEach(['filter', 'map', 'takeWhile'], function(methodName, index) {
      var type = index + 1,
          isFilter = type != LAZY_MAP_FLAG;

      LazyWrapper.prototype[methodName] = function(iteratee, thisArg) {
        var result = this.clone();
        result.__iteratees__.push({ 'iteratee': getCallback(iteratee, thisArg, 1), 'type': type });
        result.__filtered__ = result.__filtered__ || isFilter;
        return result;
      };
    });

    // Add `LazyWrapper` methods for `_.first` and `_.last`.
    arrayEach(['first', 'last'], function(methodName, index) {
      var takeName = 'take' + (index ? 'Right' : '');

      LazyWrapper.prototype[methodName] = function() {
        return this[takeName](1).value()[0];
      };
    });

    // Add `LazyWrapper` methods for `_.initial` and `_.rest`.
    arrayEach(['initial', 'rest'], function(methodName, index) {
      var dropName = 'drop' + (index ? '' : 'Right');

      LazyWrapper.prototype[methodName] = function() {
        return this.__filtered__ ? new LazyWrapper(this) : this[dropName](1);
      };
    });

    // Add `LazyWrapper` methods for `_.pluck` and `_.where`.
    arrayEach(['pluck', 'where'], function(methodName, index) {
      var operationName = index ? 'filter' : 'map',
          createCallback = index ? baseMatches : property;

      LazyWrapper.prototype[methodName] = function(value) {
        return this[operationName](createCallback(value));
      };
    });

    LazyWrapper.prototype.compact = function() {
      return this.filter(identity);
    };

    LazyWrapper.prototype.reject = function(predicate, thisArg) {
      predicate = getCallback(predicate, thisArg, 1);
      return this.filter(function(value) {
        return !predicate(value);
      });
    };

    LazyWrapper.prototype.slice = function(start, end) {
      start = start == null ? 0 : (+start || 0);

      var result = this;
      if (result.__filtered__ && (start > 0 || end < 0)) {
        return new LazyWrapper(result);
      }
      if (start < 0) {
        result = result.takeRight(-start);
      } else if (start) {
        result = result.drop(start);
      }
      if (end !== undefined) {
        end = (+end || 0);
        result = end < 0 ? result.dropRight(-end) : result.take(end - start);
      }
      return result;
    };

    LazyWrapper.prototype.takeRightWhile = function(predicate, thisArg) {
      return this.reverse().takeWhile(predicate, thisArg).reverse();
    };

    LazyWrapper.prototype.toArray = function() {
      return this.take(POSITIVE_INFINITY);
    };

    // Add `LazyWrapper` methods to `lodash.prototype`.
    baseForOwn(LazyWrapper.prototype, function(func, methodName) {
      var checkIteratee = /^(?:filter|map|reject)|While$/.test(methodName),
          retUnwrapped = /^(?:first|last)$/.test(methodName),
          lodashFunc = lodash[retUnwrapped ? ('take' + (methodName == 'last' ? 'Right' : '')) : methodName];

      if (!lodashFunc) {
        return;
      }
      lodash.prototype[methodName] = function() {
        var args = retUnwrapped ? [1] : arguments,
            chainAll = this.__chain__,
            value = this.__wrapped__,
            isHybrid = !!this.__actions__.length,
            isLazy = value instanceof LazyWrapper,
            iteratee = args[0],
            useLazy = isLazy || isArray(value);

        if (useLazy && checkIteratee && typeof iteratee == 'function' && iteratee.length != 1) {
          // Avoid lazy use if the iteratee has a "length" value other than `1`.
          isLazy = useLazy = false;
        }
        var interceptor = function(value) {
          return (retUnwrapped && chainAll)
            ? lodashFunc(value, 1)[0]
            : lodashFunc.apply(undefined, arrayPush([value], args));
        };

        var action = { 'func': thru, 'args': [interceptor], 'thisArg': undefined },
            onlyLazy = isLazy && !isHybrid;

        if (retUnwrapped && !chainAll) {
          if (onlyLazy) {
            value = value.clone();
            value.__actions__.push(action);
            return func.call(value);
          }
          return lodashFunc.call(undefined, this.value())[0];
        }
        if (!retUnwrapped && useLazy) {
          value = onlyLazy ? value : new LazyWrapper(this);
          var result = func.apply(value, args);
          result.__actions__.push(action);
          return new LodashWrapper(result, chainAll);
        }
        return this.thru(interceptor);
      };
    });

    // Add `Array` and `String` methods to `lodash.prototype`.
    arrayEach(['join', 'pop', 'push', 'replace', 'shift', 'sort', 'splice', 'split', 'unshift'], function(methodName) {
      var func = (/^(?:replace|split)$/.test(methodName) ? stringProto : arrayProto)[methodName],
          chainName = /^(?:push|sort|unshift)$/.test(methodName) ? 'tap' : 'thru',
          retUnwrapped = /^(?:join|pop|replace|shift)$/.test(methodName);

      lodash.prototype[methodName] = function() {
        var args = arguments;
        if (retUnwrapped && !this.__chain__) {
          return func.apply(this.value(), args);
        }
        return this[chainName](function(value) {
          return func.apply(value, args);
        });
      };
    });

    // Map minified function names to their real names.
    baseForOwn(LazyWrapper.prototype, function(func, methodName) {
      var lodashFunc = lodash[methodName];
      if (lodashFunc) {
        var key = lodashFunc.name,
            names = realNames[key] || (realNames[key] = []);

        names.push({ 'name': methodName, 'func': lodashFunc });
      }
    });

    realNames[createHybridWrapper(undefined, BIND_KEY_FLAG).name] = [{ 'name': 'wrapper', 'func': undefined }];

    // Add functions to the lazy wrapper.
    LazyWrapper.prototype.clone = lazyClone;
    LazyWrapper.prototype.reverse = lazyReverse;
    LazyWrapper.prototype.value = lazyValue;

    // Add chaining functions to the `lodash` wrapper.
    lodash.prototype.chain = wrapperChain;
    lodash.prototype.commit = wrapperCommit;
    lodash.prototype.concat = wrapperConcat;
    lodash.prototype.plant = wrapperPlant;
    lodash.prototype.reverse = wrapperReverse;
    lodash.prototype.toString = wrapperToString;
    lodash.prototype.run = lodash.prototype.toJSON = lodash.prototype.valueOf = lodash.prototype.value = wrapperValue;

    // Add function aliases to the `lodash` wrapper.
    lodash.prototype.collect = lodash.prototype.map;
    lodash.prototype.head = lodash.prototype.first;
    lodash.prototype.select = lodash.prototype.filter;
    lodash.prototype.tail = lodash.prototype.rest;

    return lodash;
  }

  /*--------------------------------------------------------------------------*/

  // Export lodash.
  var _ = runInContext();

  // Some AMD build optimizers like r.js check for condition patterns like the following:
  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    // Expose lodash to the global object when an AMD loader is present to avoid
    // errors in cases where lodash is loaded by a script tag and not intended
    // as an AMD module. See http://requirejs.org/docs/errors.html#mismatch for
    // more details.
    root._ = _;

    // Define as an anonymous module so, through path mapping, it can be
    // referenced as the "underscore" module.
    define(function() {
      return _;
    });
  }
  // Check for `exports` after `define` in case a build optimizer adds an `exports` object.
  else if (freeExports && freeModule) {
    // Export for Node.js or RingoJS.
    if (moduleExports) {
      (freeModule.exports = _)._ = _;
    }
    // Export for Rhino with CommonJS support.
    else {
      freeExports._ = _;
    }
  }
  else {
    // Export for a browser or Rhino.
    root._ = _;
  }
}.call(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],5:[function(require,module,exports){
'use strict';

exports.Parser = require('./lib/tree_construction/parser');
exports.SimpleApiParser = require('./lib/simple_api/simple_api_parser');
exports.TreeSerializer =
exports.Serializer = require('./lib/serialization/serializer');
exports.JsDomParser = require('./lib/jsdom/jsdom_parser');

exports.TreeAdapters = {
    default: require('./lib/tree_adapters/default'),
    htmlparser2: require('./lib/tree_adapters/htmlparser2')
};

},{"./lib/jsdom/jsdom_parser":11,"./lib/serialization/serializer":13,"./lib/simple_api/simple_api_parser":14,"./lib/tree_adapters/default":20,"./lib/tree_adapters/htmlparser2":21,"./lib/tree_construction/parser":25}],6:[function(require,module,exports){
'use strict';

//Const
var VALID_DOCTYPE_NAME = 'html',
    QUIRKS_MODE_SYSTEM_ID = 'http://www.ibm.com/data/dtd/v11/ibmxhtml1-transitional.dtd',
    QUIRKS_MODE_PUBLIC_ID_PREFIXES = [
        "+//silmaril//dtd html pro v0r11 19970101//en",
        "-//advasoft ltd//dtd html 3.0 aswedit + extensions//en",
        "-//as//dtd html 3.0 aswedit + extensions//en",
        "-//ietf//dtd html 2.0 level 1//en",
        "-//ietf//dtd html 2.0 level 2//en",
        "-//ietf//dtd html 2.0 strict level 1//en",
        "-//ietf//dtd html 2.0 strict level 2//en",
        "-//ietf//dtd html 2.0 strict//en",
        "-//ietf//dtd html 2.0//en",
        "-//ietf//dtd html 2.1e//en",
        "-//ietf//dtd html 3.0//en",
        "-//ietf//dtd html 3.0//en//",
        "-//ietf//dtd html 3.2 final//en",
        "-//ietf//dtd html 3.2//en",
        "-//ietf//dtd html 3//en",
        "-//ietf//dtd html level 0//en",
        "-//ietf//dtd html level 0//en//2.0",
        "-//ietf//dtd html level 1//en",
        "-//ietf//dtd html level 1//en//2.0",
        "-//ietf//dtd html level 2//en",
        "-//ietf//dtd html level 2//en//2.0",
        "-//ietf//dtd html level 3//en",
        "-//ietf//dtd html level 3//en//3.0",
        "-//ietf//dtd html strict level 0//en",
        "-//ietf//dtd html strict level 0//en//2.0",
        "-//ietf//dtd html strict level 1//en",
        "-//ietf//dtd html strict level 1//en//2.0",
        "-//ietf//dtd html strict level 2//en",
        "-//ietf//dtd html strict level 2//en//2.0",
        "-//ietf//dtd html strict level 3//en",
        "-//ietf//dtd html strict level 3//en//3.0",
        "-//ietf//dtd html strict//en",
        "-//ietf//dtd html strict//en//2.0",
        "-//ietf//dtd html strict//en//3.0",
        "-//ietf//dtd html//en",
        "-//ietf//dtd html//en//2.0",
        "-//ietf//dtd html//en//3.0",
        "-//metrius//dtd metrius presentational//en",
        "-//microsoft//dtd internet explorer 2.0 html strict//en",
        "-//microsoft//dtd internet explorer 2.0 html//en",
        "-//microsoft//dtd internet explorer 2.0 tables//en",
        "-//microsoft//dtd internet explorer 3.0 html strict//en",
        "-//microsoft//dtd internet explorer 3.0 html//en",
        "-//microsoft//dtd internet explorer 3.0 tables//en",
        "-//netscape comm. corp.//dtd html//en",
        "-//netscape comm. corp.//dtd strict html//en",
        "-//o'reilly and associates//dtd html 2.0//en",
        "-//o'reilly and associates//dtd html extended 1.0//en",
        "-//spyglass//dtd html 2.0 extended//en",
        "-//sq//dtd html 2.0 hotmetal + extensions//en",
        "-//sun microsystems corp.//dtd hotjava html//en",
        "-//sun microsystems corp.//dtd hotjava strict html//en",
        "-//w3c//dtd html 3 1995-03-24//en",
        "-//w3c//dtd html 3.2 draft//en",
        "-//w3c//dtd html 3.2 final//en",
        "-//w3c//dtd html 3.2//en",
        "-//w3c//dtd html 3.2s draft//en",
        "-//w3c//dtd html 4.0 frameset//en",
        "-//w3c//dtd html 4.0 transitional//en",
        "-//w3c//dtd html experimental 19960712//en",
        "-//w3c//dtd html experimental 970421//en",
        "-//w3c//dtd w3 html//en",
        "-//w3o//dtd w3 html 3.0//en",
        "-//w3o//dtd w3 html 3.0//en//",
        "-//webtechs//dtd mozilla html 2.0//en",
        "-//webtechs//dtd mozilla html//en"
    ],
    QUIRKS_MODE_NO_SYSTEM_ID_PUBLIC_ID_PREFIXES = [
        '-//w3c//dtd html 4.01 frameset//',
        '-//w3c//dtd html 4.01 transitional//'
    ],
    QUIRKS_MODE_PUBLIC_IDS = [
        '-//w3o//dtd w3 html strict 3.0//en//',
        '-/w3c/dtd html 4.0 transitional/en',
        'html'
    ];


//Utils
function enquoteDoctypeId(id) {
    var quote = id.indexOf('"') !== -1 ? '\'' : '"';

    return quote + id + quote;
}


//API
exports.isQuirks = function (name, publicId, systemId) {
    if (name !== VALID_DOCTYPE_NAME)
        return true;

    if (systemId && systemId.toLowerCase() === QUIRKS_MODE_SYSTEM_ID)
        return true;

    if (publicId !== null) {
        publicId = publicId.toLowerCase();

        if (QUIRKS_MODE_PUBLIC_IDS.indexOf(publicId) > -1)
            return true;

        var prefixes = QUIRKS_MODE_PUBLIC_ID_PREFIXES;

        if (systemId === null)
            prefixes = prefixes.concat(QUIRKS_MODE_NO_SYSTEM_ID_PUBLIC_ID_PREFIXES);

        for (var i = 0; i < prefixes.length; i++) {
            if (publicId.indexOf(prefixes[i]) === 0)
                return true;
        }
    }

    return false;
};

exports.serializeContent = function (name, publicId, systemId) {
    var str = '!DOCTYPE ' + name;

    if (publicId !== null)
        str += ' PUBLIC ' + enquoteDoctypeId(publicId);

    else if (systemId !== null)
        str += ' SYSTEM';

    if (systemId !== null)
        str += ' ' + enquoteDoctypeId(systemId);

    return str;
};

},{}],7:[function(require,module,exports){
'use strict';

var Tokenizer = require('../tokenization/tokenizer'),
    HTML = require('./html');

//Aliases
var $ = HTML.TAG_NAMES,
    NS = HTML.NAMESPACES,
    ATTRS = HTML.ATTRS;


//MIME types
var MIME_TYPES = {
    TEXT_HTML: 'text/html',
    APPLICATION_XML: 'application/xhtml+xml'
};

//Attributes
var DEFINITION_URL_ATTR = 'definitionurl',
    ADJUSTED_DEFINITION_URL_ATTR = 'definitionURL',
    SVG_ATTRS_ADJUSTMENT_MAP = {
        'attributename': 'attributeName',
        'attributetype': 'attributeType',
        'basefrequency': 'baseFrequency',
        'baseprofile': 'baseProfile',
        'calcmode': 'calcMode',
        'clippathunits': 'clipPathUnits',
        'contentscripttype': 'contentScriptType',
        'contentstyletype': 'contentStyleType',
        'diffuseconstant': 'diffuseConstant',
        'edgemode': 'edgeMode',
        'externalresourcesrequired': 'externalResourcesRequired',
        'filterres': 'filterRes',
        'filterunits': 'filterUnits',
        'glyphref': 'glyphRef',
        'gradienttransform': 'gradientTransform',
        'gradientunits': 'gradientUnits',
        'kernelmatrix': 'kernelMatrix',
        'kernelunitlength': 'kernelUnitLength',
        'keypoints': 'keyPoints',
        'keysplines': 'keySplines',
        'keytimes': 'keyTimes',
        'lengthadjust': 'lengthAdjust',
        'limitingconeangle': 'limitingConeAngle',
        'markerheight': 'markerHeight',
        'markerunits': 'markerUnits',
        'markerwidth': 'markerWidth',
        'maskcontentunits': 'maskContentUnits',
        'maskunits': 'maskUnits',
        'numoctaves': 'numOctaves',
        'pathlength': 'pathLength',
        'patterncontentunits': 'patternContentUnits',
        'patterntransform': 'patternTransform',
        'patternunits': 'patternUnits',
        'pointsatx': 'pointsAtX',
        'pointsaty': 'pointsAtY',
        'pointsatz': 'pointsAtZ',
        'preservealpha': 'preserveAlpha',
        'preserveaspectratio': 'preserveAspectRatio',
        'primitiveunits': 'primitiveUnits',
        'refx': 'refX',
        'refy': 'refY',
        'repeatcount': 'repeatCount',
        'repeatdur': 'repeatDur',
        'requiredextensions': 'requiredExtensions',
        'requiredfeatures': 'requiredFeatures',
        'specularconstant': 'specularConstant',
        'specularexponent': 'specularExponent',
        'spreadmethod': 'spreadMethod',
        'startoffset': 'startOffset',
        'stddeviation': 'stdDeviation',
        'stitchtiles': 'stitchTiles',
        'surfacescale': 'surfaceScale',
        'systemlanguage': 'systemLanguage',
        'tablevalues': 'tableValues',
        'targetx': 'targetX',
        'targety': 'targetY',
        'textlength': 'textLength',
        'viewbox': 'viewBox',
        'viewtarget': 'viewTarget',
        'xchannelselector': 'xChannelSelector',
        'ychannelselector': 'yChannelSelector',
        'zoomandpan': 'zoomAndPan'
    },
    XML_ATTRS_ADJUSTMENT_MAP = {
        'xlink:actuate': {prefix: 'xlink', name: 'actuate', namespace: NS.XLINK},
        'xlink:arcrole': {prefix: 'xlink', name: 'arcrole', namespace: NS.XLINK},
        'xlink:href': {prefix: 'xlink', name: 'href', namespace: NS.XLINK},
        'xlink:role': {prefix: 'xlink', name: 'role', namespace: NS.XLINK},
        'xlink:show': {prefix: 'xlink', name: 'show', namespace: NS.XLINK},
        'xlink:title': {prefix: 'xlink', name: 'title', namespace: NS.XLINK},
        'xlink:type': {prefix: 'xlink', name: 'type', namespace: NS.XLINK},
        'xml:base': {prefix: 'xml', name: 'base', namespace: NS.XML},
        'xml:lang': {prefix: 'xml', name: 'lang', namespace: NS.XML},
        'xml:space': {prefix: 'xml', name: 'space', namespace: NS.XML},
        'xmlns': {prefix: '', name: 'xmlns', namespace: NS.XMLNS},
        'xmlns:xlink': {prefix: 'xmlns', name: 'xlink', namespace: NS.XMLNS}

    };

//SVG tag names adjustment map
var SVG_TAG_NAMES_ADJUSTMENT_MAP = {
    'altglyph': 'altGlyph',
    'altglyphdef': 'altGlyphDef',
    'altglyphitem': 'altGlyphItem',
    'animatecolor': 'animateColor',
    'animatemotion': 'animateMotion',
    'animatetransform': 'animateTransform',
    'clippath': 'clipPath',
    'feblend': 'feBlend',
    'fecolormatrix': 'feColorMatrix',
    'fecomponenttransfer': 'feComponentTransfer',
    'fecomposite': 'feComposite',
    'feconvolvematrix': 'feConvolveMatrix',
    'fediffuselighting': 'feDiffuseLighting',
    'fedisplacementmap': 'feDisplacementMap',
    'fedistantlight': 'feDistantLight',
    'feflood': 'feFlood',
    'fefunca': 'feFuncA',
    'fefuncb': 'feFuncB',
    'fefuncg': 'feFuncG',
    'fefuncr': 'feFuncR',
    'fegaussianblur': 'feGaussianBlur',
    'feimage': 'feImage',
    'femerge': 'feMerge',
    'femergenode': 'feMergeNode',
    'femorphology': 'feMorphology',
    'feoffset': 'feOffset',
    'fepointlight': 'fePointLight',
    'fespecularlighting': 'feSpecularLighting',
    'fespotlight': 'feSpotLight',
    'fetile': 'feTile',
    'feturbulence': 'feTurbulence',
    'foreignobject': 'foreignObject',
    'glyphref': 'glyphRef',
    'lineargradient': 'linearGradient',
    'radialgradient': 'radialGradient',
    'textpath': 'textPath'
};

//Tags that causes exit from foreign content
var EXITS_FOREIGN_CONTENT = {};

EXITS_FOREIGN_CONTENT[$.B] = true;
EXITS_FOREIGN_CONTENT[$.BIG] = true;
EXITS_FOREIGN_CONTENT[$.BLOCKQUOTE] = true;
EXITS_FOREIGN_CONTENT[$.BODY] = true;
EXITS_FOREIGN_CONTENT[$.BR] = true;
EXITS_FOREIGN_CONTENT[$.CENTER] = true;
EXITS_FOREIGN_CONTENT[$.CODE] = true;
EXITS_FOREIGN_CONTENT[$.DD] = true;
EXITS_FOREIGN_CONTENT[$.DIV] = true;
EXITS_FOREIGN_CONTENT[$.DL] = true;
EXITS_FOREIGN_CONTENT[$.DT] = true;
EXITS_FOREIGN_CONTENT[$.EM] = true;
EXITS_FOREIGN_CONTENT[$.EMBED] = true;
EXITS_FOREIGN_CONTENT[$.H1] = true;
EXITS_FOREIGN_CONTENT[$.H2] = true;
EXITS_FOREIGN_CONTENT[$.H3] = true;
EXITS_FOREIGN_CONTENT[$.H4] = true;
EXITS_FOREIGN_CONTENT[$.H5] = true;
EXITS_FOREIGN_CONTENT[$.H6] = true;
EXITS_FOREIGN_CONTENT[$.HEAD] = true;
EXITS_FOREIGN_CONTENT[$.HR] = true;
EXITS_FOREIGN_CONTENT[$.I] = true;
EXITS_FOREIGN_CONTENT[$.IMG] = true;
EXITS_FOREIGN_CONTENT[$.LI] = true;
EXITS_FOREIGN_CONTENT[$.LISTING] = true;
EXITS_FOREIGN_CONTENT[$.MENU] = true;
EXITS_FOREIGN_CONTENT[$.META] = true;
EXITS_FOREIGN_CONTENT[$.NOBR] = true;
EXITS_FOREIGN_CONTENT[$.OL] = true;
EXITS_FOREIGN_CONTENT[$.P] = true;
EXITS_FOREIGN_CONTENT[$.PRE] = true;
EXITS_FOREIGN_CONTENT[$.RUBY] = true;
EXITS_FOREIGN_CONTENT[$.S] = true;
EXITS_FOREIGN_CONTENT[$.SMALL] = true;
EXITS_FOREIGN_CONTENT[$.SPAN] = true;
EXITS_FOREIGN_CONTENT[$.STRONG] = true;
EXITS_FOREIGN_CONTENT[$.STRIKE] = true;
EXITS_FOREIGN_CONTENT[$.SUB] = true;
EXITS_FOREIGN_CONTENT[$.SUP] = true;
EXITS_FOREIGN_CONTENT[$.TABLE] = true;
EXITS_FOREIGN_CONTENT[$.TT] = true;
EXITS_FOREIGN_CONTENT[$.U] = true;
EXITS_FOREIGN_CONTENT[$.UL] = true;
EXITS_FOREIGN_CONTENT[$.VAR] = true;

//Check exit from foreign content
exports.causesExit = function (startTagToken) {
    var tn = startTagToken.tagName;

    if (tn === $.FONT && (Tokenizer.getTokenAttr(startTagToken, ATTRS.COLOR) !== null ||
        Tokenizer.getTokenAttr(startTagToken, ATTRS.SIZE) !== null ||
        Tokenizer.getTokenAttr(startTagToken, ATTRS.FACE) !== null)) {
        return true;
    }

    return EXITS_FOREIGN_CONTENT[tn];
};

//Token adjustments
exports.adjustTokenMathMLAttrs = function (token) {
    for (var i = 0; i < token.attrs.length; i++) {
        if (token.attrs[i].name === DEFINITION_URL_ATTR) {
            token.attrs[i].name = ADJUSTED_DEFINITION_URL_ATTR;
            break;
        }
    }
};

exports.adjustTokenSVGAttrs = function (token) {
    for (var i = 0; i < token.attrs.length; i++) {
        var adjustedAttrName = SVG_ATTRS_ADJUSTMENT_MAP[token.attrs[i].name];

        if (adjustedAttrName)
            token.attrs[i].name = adjustedAttrName;
    }
};

exports.adjustTokenXMLAttrs = function (token) {
    for (var i = 0; i < token.attrs.length; i++) {
        var adjustedAttrEntry = XML_ATTRS_ADJUSTMENT_MAP[token.attrs[i].name];

        if (adjustedAttrEntry) {
            token.attrs[i].prefix = adjustedAttrEntry.prefix;
            token.attrs[i].name = adjustedAttrEntry.name;
            token.attrs[i].namespace = adjustedAttrEntry.namespace;
        }
    }
};

exports.adjustTokenSVGTagName = function (token) {
    var adjustedTagName = SVG_TAG_NAMES_ADJUSTMENT_MAP[token.tagName];

    if (adjustedTagName)
        token.tagName = adjustedTagName;
};

//Integration points
exports.isMathMLTextIntegrationPoint = function (tn, ns) {
    return ns === NS.MATHML && (tn === $.MI || tn === $.MO || tn === $.MN || tn === $.MS || tn === $.MTEXT);
};

exports.isHtmlIntegrationPoint = function (tn, ns, attrs) {
    if (ns === NS.MATHML && tn === $.ANNOTATION_XML) {
        for (var i = 0; i < attrs.length; i++) {
            if (attrs[i].name === ATTRS.ENCODING) {
                var value = attrs[i].value.toLowerCase();

                return value === MIME_TYPES.TEXT_HTML || value === MIME_TYPES.APPLICATION_XML;
            }
        }
    }

    return ns === NS.SVG && (tn === $.FOREIGN_OBJECT || tn === $.DESC || tn === $.TITLE);
};

},{"../tokenization/tokenizer":19,"./html":8}],8:[function(require,module,exports){
'use strict';

var NS = exports.NAMESPACES = {
    HTML: 'http://www.w3.org/1999/xhtml',
    MATHML: 'http://www.w3.org/1998/Math/MathML',
    SVG: 'http://www.w3.org/2000/svg',
    XLINK: 'http://www.w3.org/1999/xlink',
    XML: 'http://www.w3.org/XML/1998/namespace',
    XMLNS: 'http://www.w3.org/2000/xmlns/'
};

exports.ATTRS = {
    TYPE: 'type',
    ACTION: 'action',
    ENCODING: 'encoding',
    PROMPT: 'prompt',
    NAME: 'name',
    COLOR: 'color',
    FACE: 'face',
    SIZE: 'size'
};

var $ = exports.TAG_NAMES = {
    A: 'a',
    ADDRESS: 'address',
    ANNOTATION_XML: 'annotation-xml',
    APPLET: 'applet',
    AREA: 'area',
    ARTICLE: 'article',
    ASIDE: 'aside',

    B: 'b',
    BASE: 'base',
    BASEFONT: 'basefont',
    BGSOUND: 'bgsound',
    BIG: 'big',
    BLOCKQUOTE: 'blockquote',
    BODY: 'body',
    BR: 'br',
    BUTTON: 'button',

    CAPTION: 'caption',
    CENTER: 'center',
    CODE: 'code',
    COL: 'col',
    COLGROUP: 'colgroup',
    COMMAND: 'command',

    DD: 'dd',
    DESC: 'desc',
    DETAILS: 'details',
    DIALOG: 'dialog',
    DIR: 'dir',
    DIV: 'div',
    DL: 'dl',
    DT: 'dt',

    EM: 'em',
    EMBED: 'embed',

    FIELDSET: 'fieldset',
    FIGCAPTION: 'figcaption',
    FIGURE: 'figure',
    FONT: 'font',
    FOOTER: 'footer',
    FOREIGN_OBJECT: 'foreignObject',
    FORM: 'form',
    FRAME: 'frame',
    FRAMESET: 'frameset',

    H1: 'h1',
    H2: 'h2',
    H3: 'h3',
    H4: 'h4',
    H5: 'h5',
    H6: 'h6',
    HEAD: 'head',
    HEADER: 'header',
    HGROUP: 'hgroup',
    HR: 'hr',
    HTML: 'html',

    I: 'i',
    IMG: 'img',
    IMAGE: 'image',
    INPUT: 'input',
    IFRAME: 'iframe',
    ISINDEX: 'isindex',

    KEYGEN: 'keygen',

    LABEL: 'label',
    LI: 'li',
    LINK: 'link',
    LISTING: 'listing',

    MAIN: 'main',
    MALIGNMARK: 'malignmark',
    MARQUEE: 'marquee',
    MATH: 'math',
    MENU: 'menu',
    MENUITEM: 'menuitem',
    META: 'meta',
    MGLYPH: 'mglyph',
    MI: 'mi',
    MO: 'mo',
    MN: 'mn',
    MS: 'ms',
    MTEXT: 'mtext',

    NAV: 'nav',
    NOBR: 'nobr',
    NOFRAMES: 'noframes',
    NOEMBED: 'noembed',
    NOSCRIPT: 'noscript',

    OBJECT: 'object',
    OL: 'ol',
    OPTGROUP: 'optgroup',
    OPTION: 'option',

    P: 'p',
    PARAM: 'param',
    PLAINTEXT: 'plaintext',
    PRE: 'pre',

    RP: 'rp',
    RT: 'rt',
    RUBY: 'ruby',

    S: 's',
    SCRIPT: 'script',
    SECTION: 'section',
    SELECT: 'select',
    SOURCE: 'source',
    SMALL: 'small',
    SPAN: 'span',
    STRIKE: 'strike',
    STRONG: 'strong',
    STYLE: 'style',
    SUB: 'sub',
    SUMMARY: 'summary',
    SUP: 'sup',

    TABLE: 'table',
    TBODY: 'tbody',
    TEMPLATE: 'template',
    TEXTAREA: 'textarea',
    TFOOT: 'tfoot',
    TD: 'td',
    TH: 'th',
    THEAD: 'thead',
    TITLE: 'title',
    TR: 'tr',
    TRACK: 'track',
    TT: 'tt',

    U: 'u',
    UL: 'ul',

    SVG: 'svg',

    VAR: 'var',

    WBR: 'wbr',

    XMP: 'xmp'
};

var SPECIAL_ELEMENTS = exports.SPECIAL_ELEMENTS = {};

SPECIAL_ELEMENTS[NS.HTML] = {};
SPECIAL_ELEMENTS[NS.HTML][$.ADDRESS] = true;
SPECIAL_ELEMENTS[NS.HTML][$.APPLET] = true;
SPECIAL_ELEMENTS[NS.HTML][$.AREA] = true;
SPECIAL_ELEMENTS[NS.HTML][$.ARTICLE] = true;
SPECIAL_ELEMENTS[NS.HTML][$.ASIDE] = true;
SPECIAL_ELEMENTS[NS.HTML][$.BASE] = true;
SPECIAL_ELEMENTS[NS.HTML][$.BASEFONT] = true;
SPECIAL_ELEMENTS[NS.HTML][$.BGSOUND] = true;
SPECIAL_ELEMENTS[NS.HTML][$.BLOCKQUOTE] = true;
SPECIAL_ELEMENTS[NS.HTML][$.BODY] = true;
SPECIAL_ELEMENTS[NS.HTML][$.BR] = true;
SPECIAL_ELEMENTS[NS.HTML][$.BUTTON] = true;
SPECIAL_ELEMENTS[NS.HTML][$.CAPTION] = true;
SPECIAL_ELEMENTS[NS.HTML][$.CENTER] = true;
SPECIAL_ELEMENTS[NS.HTML][$.COL] = true;
SPECIAL_ELEMENTS[NS.HTML][$.COLGROUP] = true;
SPECIAL_ELEMENTS[NS.HTML][$.DD] = true;
SPECIAL_ELEMENTS[NS.HTML][$.DETAILS] = true;
SPECIAL_ELEMENTS[NS.HTML][$.DIR] = true;
SPECIAL_ELEMENTS[NS.HTML][$.DIV] = true;
SPECIAL_ELEMENTS[NS.HTML][$.DL] = true;
SPECIAL_ELEMENTS[NS.HTML][$.DT] = true;
SPECIAL_ELEMENTS[NS.HTML][$.EMBED] = true;
SPECIAL_ELEMENTS[NS.HTML][$.FIELDSET] = true;
SPECIAL_ELEMENTS[NS.HTML][$.FIGCAPTION] = true;
SPECIAL_ELEMENTS[NS.HTML][$.FIGURE] = true;
SPECIAL_ELEMENTS[NS.HTML][$.FOOTER] = true;
SPECIAL_ELEMENTS[NS.HTML][$.FORM] = true;
SPECIAL_ELEMENTS[NS.HTML][$.FRAME] = true;
SPECIAL_ELEMENTS[NS.HTML][$.FRAMESET] = true;
SPECIAL_ELEMENTS[NS.HTML][$.H1] = true;
SPECIAL_ELEMENTS[NS.HTML][$.H2] = true;
SPECIAL_ELEMENTS[NS.HTML][$.H3] = true;
SPECIAL_ELEMENTS[NS.HTML][$.H4] = true;
SPECIAL_ELEMENTS[NS.HTML][$.H5] = true;
SPECIAL_ELEMENTS[NS.HTML][$.H6] = true;
SPECIAL_ELEMENTS[NS.HTML][$.HEAD] = true;
SPECIAL_ELEMENTS[NS.HTML][$.HEADER] = true;
SPECIAL_ELEMENTS[NS.HTML][$.HGROUP] = true;
SPECIAL_ELEMENTS[NS.HTML][$.HR] = true;
SPECIAL_ELEMENTS[NS.HTML][$.HTML] = true;
SPECIAL_ELEMENTS[NS.HTML][$.IFRAME] = true;
SPECIAL_ELEMENTS[NS.HTML][$.IMG] = true;
SPECIAL_ELEMENTS[NS.HTML][$.INPUT] = true;
SPECIAL_ELEMENTS[NS.HTML][$.ISINDEX] = true;
SPECIAL_ELEMENTS[NS.HTML][$.LI] = true;
SPECIAL_ELEMENTS[NS.HTML][$.LINK] = true;
SPECIAL_ELEMENTS[NS.HTML][$.LISTING] = true;
SPECIAL_ELEMENTS[NS.HTML][$.MAIN] = true;
SPECIAL_ELEMENTS[NS.HTML][$.MARQUEE] = true;
SPECIAL_ELEMENTS[NS.HTML][$.MENU] = true;
SPECIAL_ELEMENTS[NS.HTML][$.MENUITEM] = true;
SPECIAL_ELEMENTS[NS.HTML][$.META] = true;
SPECIAL_ELEMENTS[NS.HTML][$.NAV] = true;
SPECIAL_ELEMENTS[NS.HTML][$.NOEMBED] = true;
SPECIAL_ELEMENTS[NS.HTML][$.NOFRAMES] = true;
SPECIAL_ELEMENTS[NS.HTML][$.NOSCRIPT] = true;
SPECIAL_ELEMENTS[NS.HTML][$.OBJECT] = true;
SPECIAL_ELEMENTS[NS.HTML][$.OL] = true;
SPECIAL_ELEMENTS[NS.HTML][$.P] = true;
SPECIAL_ELEMENTS[NS.HTML][$.PARAM] = true;
SPECIAL_ELEMENTS[NS.HTML][$.PLAINTEXT] = true;
SPECIAL_ELEMENTS[NS.HTML][$.PRE] = true;
SPECIAL_ELEMENTS[NS.HTML][$.SCRIPT] = true;
SPECIAL_ELEMENTS[NS.HTML][$.SECTION] = true;
SPECIAL_ELEMENTS[NS.HTML][$.SELECT] = true;
SPECIAL_ELEMENTS[NS.HTML][$.SOURCE] = true;
SPECIAL_ELEMENTS[NS.HTML][$.STYLE] = true;
SPECIAL_ELEMENTS[NS.HTML][$.SUMMARY] = true;
SPECIAL_ELEMENTS[NS.HTML][$.TABLE] = true;
SPECIAL_ELEMENTS[NS.HTML][$.TBODY] = true;
SPECIAL_ELEMENTS[NS.HTML][$.TD] = true;
SPECIAL_ELEMENTS[NS.HTML][$.TEMPLATE] = true;
SPECIAL_ELEMENTS[NS.HTML][$.TEXTAREA] = true;
SPECIAL_ELEMENTS[NS.HTML][$.TFOOT] = true;
SPECIAL_ELEMENTS[NS.HTML][$.TH] = true;
SPECIAL_ELEMENTS[NS.HTML][$.THEAD] = true;
SPECIAL_ELEMENTS[NS.HTML][$.TITLE] = true;
SPECIAL_ELEMENTS[NS.HTML][$.TR] = true;
SPECIAL_ELEMENTS[NS.HTML][$.TRACK] = true;
SPECIAL_ELEMENTS[NS.HTML][$.UL] = true;
SPECIAL_ELEMENTS[NS.HTML][$.WBR] = true;
SPECIAL_ELEMENTS[NS.HTML][$.XMP] = true;

SPECIAL_ELEMENTS[NS.MATHML] = {};
SPECIAL_ELEMENTS[NS.MATHML][$.MI] = true;
SPECIAL_ELEMENTS[NS.MATHML][$.MO] = true;
SPECIAL_ELEMENTS[NS.MATHML][$.MN] = true;
SPECIAL_ELEMENTS[NS.MATHML][$.MS] = true;
SPECIAL_ELEMENTS[NS.MATHML][$.MTEXT] = true;
SPECIAL_ELEMENTS[NS.MATHML][$.ANNOTATION_XML] = true;

SPECIAL_ELEMENTS[NS.SVG] = {};
SPECIAL_ELEMENTS[NS.SVG][$.TITLE] = true;
SPECIAL_ELEMENTS[NS.SVG][$.FOREIGN_OBJECT] = true;
SPECIAL_ELEMENTS[NS.SVG][$.DESC] = true;

},{}],9:[function(require,module,exports){
'use strict';

exports.REPLACEMENT_CHARACTER = '\uFFFD';

exports.CODE_POINTS = {
    EOF: -1,
    NULL: 0x00,
    TABULATION: 0x09,
    CARRIAGE_RETURN: 0x0D,
    LINE_FEED: 0x0A,
    FORM_FEED: 0x0C,
    SPACE: 0x20,
    EXCLAMATION_MARK: 0x21,
    QUOTATION_MARK: 0x22,
    NUMBER_SIGN: 0x23,
    AMPERSAND: 0x26,
    APOSTROPHE: 0x27,
    HYPHEN_MINUS: 0x2D,
    SOLIDUS: 0x2F,
    DIGIT_0: 0x30,
    DIGIT_9: 0x39,
    SEMICOLON: 0x3B,
    LESS_THAN_SIGN: 0x3C,
    EQUALS_SIGN: 0x3D,
    GREATER_THAN_SIGN: 0x3E,
    QUESTION_MARK: 0x3F,
    LATIN_CAPITAL_A: 0x41,
    LATIN_CAPITAL_F: 0x46,
    LATIN_CAPITAL_X: 0x58,
    LATIN_CAPITAL_Z: 0x5A,
    GRAVE_ACCENT: 0x60,
    LATIN_SMALL_A: 0x61,
    LATIN_SMALL_F: 0x66,
    LATIN_SMALL_X: 0x78,
    LATIN_SMALL_Z: 0x7A,
    BOM: 0xFEFF,
    REPLACEMENT_CHARACTER: 0xFFFD
};

exports.CODE_POINT_SEQUENCES = {
    DASH_DASH_STRING: [0x2D, 0x2D], //--
    DOCTYPE_STRING: [0x44, 0x4F, 0x43, 0x54, 0x59, 0x50, 0x45], //DOCTYPE
    CDATA_START_STRING: [0x5B, 0x43, 0x44, 0x41, 0x54, 0x41, 0x5B], //[CDATA[
    CDATA_END_STRING: [0x5D, 0x5D, 0x3E], //]]>
    SCRIPT_STRING: [0x73, 0x63, 0x72, 0x69, 0x70, 0x74], //script
    PUBLIC_STRING: [0x50, 0x55, 0x42, 0x4C, 0x49, 0x43], //PUBLIC
    SYSTEM_STRING: [0x53, 0x59, 0x53, 0x54, 0x45, 0x4D] //SYSTEM
};

},{}],10:[function(require,module,exports){
'use strict';

exports.mergeOptions = function (defaults, options) {
    options = options || {};

    return [defaults, options].reduce(function (merged, optObj) {
        Object.keys(optObj).forEach(function (key) {
            merged[key] = optObj[key];
        });

        return merged;
    }, {});
};

},{}],11:[function(require,module,exports){
(function (process){
'use strict';

var Parser = require('../tree_construction/parser'),
    ParsingUnit = require('./parsing_unit');

//API
exports.parseDocument = function (html, treeAdapter) {
    //NOTE: this should be reentrant, so we create new parser here
    var parser = new Parser(treeAdapter),
        parsingUnit = new ParsingUnit(parser);

    //NOTE: override parser loop method
    parser._runParsingLoop = function () {
        parsingUnit.parsingLoopLock = true;

        while (!parsingUnit.suspended && !this.stopped)
            this._iterateParsingLoop();

        parsingUnit.parsingLoopLock = false;

        if (this.stopped)
            parsingUnit.callback(this.document);
    };

    //NOTE: wait while parserController will be adopted by calling code, then
    //start parsing
    process.nextTick(function () {
        parser.parse(html);
    });

    return parsingUnit;
};

exports.parseInnerHtml = function (innerHtml, contextElement, treeAdapter) {
    //NOTE: this should be reentrant, so we create new parser here
    var parser = new Parser(treeAdapter);

    return parser.parseFragment(innerHtml, contextElement);
};
}).call(this,require('_process'))
},{"../tree_construction/parser":25,"./parsing_unit":12,"_process":3}],12:[function(require,module,exports){
'use strict';

var ParsingUnit = module.exports = function (parser) {
    this.parser = parser;
    this.suspended = false;
    this.parsingLoopLock = false;
    this.callback = null;
};

ParsingUnit.prototype._stateGuard = function (suspend) {
    if (this.suspended && suspend)
        throw new Error('parse5: Parser was already suspended. Please, check your control flow logic.');

    else if (!this.suspended && !suspend)
        throw new Error('parse5: Parser was already resumed. Please, check your control flow logic.');

    return suspend;
};

ParsingUnit.prototype.suspend = function () {
    this.suspended = this._stateGuard(true);

    return this;
};

ParsingUnit.prototype.resume = function () {
    this.suspended = this._stateGuard(false);

    //NOTE: don't enter parsing loop if it is locked. Without this lock _runParsingLoop() may be called
    //while parsing loop is still running. E.g. when suspend() and resume() called synchronously.
    if (!this.parsingLoopLock)
        this.parser._runParsingLoop();

    return this;
};

ParsingUnit.prototype.documentWrite = function (html) {
    this.parser.tokenizer.preprocessor.write(html);

    return this;
};

ParsingUnit.prototype.handleScripts = function (scriptHandler) {
    this.parser.scriptHandler = scriptHandler;

    return this;
};

ParsingUnit.prototype.done = function (callback) {
    this.callback = callback;

    return this;
};

},{}],13:[function(require,module,exports){
'use strict';

var DefaultTreeAdapter = require('../tree_adapters/default'),
    Doctype = require('../common/doctype'),
    Utils = require('../common/utils'),
    HTML = require('../common/html');

//Aliases
var $ = HTML.TAG_NAMES,
    NS = HTML.NAMESPACES;

//Default serializer options
var DEFAULT_OPTIONS = {
    encodeHtmlEntities: true
};

//Escaping regexes
var AMP_REGEX = /&/g,
    NBSP_REGEX = /\u00a0/g,
    DOUBLE_QUOTE_REGEX = /"/g,
    LT_REGEX = /</g,
    GT_REGEX = />/g;

//Escape string
function escapeString(str, attrMode) {
    str = str
        .replace(AMP_REGEX, '&amp;')
        .replace(NBSP_REGEX, '&nbsp;');

    if (attrMode)
        str = str.replace(DOUBLE_QUOTE_REGEX, '&quot;');

    else {
        str = str
            .replace(LT_REGEX, '&lt;')
            .replace(GT_REGEX, '&gt;');
    }

    return str;
}


//Enquote doctype ID



//Serializer
var Serializer = module.exports = function (treeAdapter, options) {
    this.treeAdapter = treeAdapter || DefaultTreeAdapter;
    this.options = Utils.mergeOptions(DEFAULT_OPTIONS, options);
};


//API
Serializer.prototype.serialize = function (node) {
    this.html = '';
    this._serializeChildNodes(node);

    return this.html;
};


//Internals
Serializer.prototype._serializeChildNodes = function (parentNode) {
    var childNodes = this.treeAdapter.getChildNodes(parentNode);

    if (childNodes) {
        for (var i = 0, cnLength = childNodes.length; i < cnLength; i++) {
            var currentNode = childNodes[i];

            if (this.treeAdapter.isElementNode(currentNode))
                this._serializeElement(currentNode);

            else if (this.treeAdapter.isTextNode(currentNode))
                this._serializeTextNode(currentNode);

            else if (this.treeAdapter.isCommentNode(currentNode))
                this._serializeCommentNode(currentNode);

            else if (this.treeAdapter.isDocumentTypeNode(currentNode))
                this._serializeDocumentTypeNode(currentNode);
        }
    }
};

Serializer.prototype._serializeElement = function (node) {
    var tn = this.treeAdapter.getTagName(node),
        ns = this.treeAdapter.getNamespaceURI(node),
        qualifiedTn = (ns === NS.HTML || ns === NS.SVG || ns === NS.MATHML) ? tn : (ns + ':' + tn);

    this.html += '<' + qualifiedTn;
    this._serializeAttributes(node);
    this.html += '>';

    if (tn !== $.AREA && tn !== $.BASE && tn !== $.BASEFONT && tn !== $.BGSOUND && tn !== $.BR && tn !== $.BR &&
        tn !== $.COL && tn !== $.EMBED && tn !== $.FRAME && tn !== $.HR && tn !== $.IMG && tn !== $.INPUT &&
        tn !== $.KEYGEN && tn !== $.LINK && tn !== $.MENUITEM && tn !== $.META && tn !== $.PARAM && tn !== $.SOURCE &&
        tn !== $.TRACK && tn !== $.WBR) {

        if (tn === $.PRE || tn === $.TEXTAREA || tn === $.LISTING) {
            var firstChild = this.treeAdapter.getFirstChild(node);

            if (firstChild && this.treeAdapter.isTextNode(firstChild)) {
                var content = this.treeAdapter.getTextNodeContent(firstChild);

                if (content[0] === '\n')
                    this.html += '\n';
            }
        }

        var childNodesHolder = tn === $.TEMPLATE && ns === NS.HTML ?
                               this.treeAdapter.getChildNodes(node)[0] :
                               node;

        this._serializeChildNodes(childNodesHolder);
        this.html += '</' + qualifiedTn + '>';
    }
};

Serializer.prototype._serializeAttributes = function (node) {
    var attrs = this.treeAdapter.getAttrList(node);

    for (var i = 0, attrsLength = attrs.length; i < attrsLength; i++) {
        var attr = attrs[i],
            value = this.options.encodeHtmlEntities ? escapeString(attr.value, true) : attr.value;

        this.html += ' ';

        if (!attr.namespace)
            this.html += attr.name;

        else if (attr.namespace === NS.XML)
            this.html += 'xml:' + attr.name;

        else if (attr.namespace === NS.XMLNS) {
            if (attr.name !== 'xmlns')
                this.html += 'xmlns:';

            this.html += attr.name;
        }

        else if (attr.namespace === NS.XLINK)
            this.html += 'xlink:' + attr.name;

        else
            this.html += attr.namespace + ':' + attr.name;

        this.html += '="' + value + '"';
    }
};

Serializer.prototype._serializeTextNode = function (node) {
    var content = this.treeAdapter.getTextNodeContent(node),
        parent = this.treeAdapter.getParentNode(node),
        parentTn = void 0;

    if (parent && this.treeAdapter.isElementNode(parent))
        parentTn = this.treeAdapter.getTagName(parent);

    if (parentTn === $.STYLE || parentTn === $.SCRIPT || parentTn === $.XMP || parentTn === $.IFRAME ||
        parentTn === $.NOEMBED || parentTn === $.NOFRAMES || parentTn === $.PLAINTEXT || parentTn === $.NOSCRIPT) {
        this.html += content;
    }

    else
        this.html += this.options.encodeHtmlEntities ? escapeString(content, false) : content;
};

Serializer.prototype._serializeCommentNode = function (node) {
    this.html += '<!--' + this.treeAdapter.getCommentNodeContent(node) + '-->';
};

Serializer.prototype._serializeDocumentTypeNode = function (node) {
    var name = this.treeAdapter.getDocumentTypeNodeName(node),
        publicId = this.treeAdapter.getDocumentTypeNodePublicId(node),
        systemId = this.treeAdapter.getDocumentTypeNodeSystemId(node);

    this.html += '<' + Doctype.serializeContent(name, publicId, systemId) + '>';
};

},{"../common/doctype":6,"../common/html":8,"../common/utils":10,"../tree_adapters/default":20}],14:[function(require,module,exports){
'use strict';

var Tokenizer = require('../tokenization/tokenizer'),
    TokenizerProxy = require('./tokenizer_proxy'),
    Utils = require('../common/utils');

//Default options
var DEFAULT_OPTIONS = {
    decodeHtmlEntities: true,
    locationInfo: false
};

//Skipping handler
function skip() {
    //NOTE: do nothing =)
}

//SimpleApiParser
var SimpleApiParser = module.exports = function (handlers, options) {
    this.options = Utils.mergeOptions(DEFAULT_OPTIONS, options);
    this.handlers = {
        doctype: this._wrapHandler(handlers.doctype),
        startTag: this._wrapHandler(handlers.startTag),
        endTag: this._wrapHandler(handlers.endTag),
        text: this._wrapHandler(handlers.text),
        comment: this._wrapHandler(handlers.comment)
    };
};

SimpleApiParser.prototype._wrapHandler = function (handler) {
    var parser = this;

    handler = handler || skip;

    if (this.options.locationInfo) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            args.push(parser.currentTokenLocation);
            handler.apply(handler, args);
        };
    }

    return handler;
};

//API
SimpleApiParser.prototype.parse = function (html) {
    var token = null;

    this._reset(html);

    do {
        token = this.tokenizerProxy.getNextToken();

        if (token.type === Tokenizer.CHARACTER_TOKEN ||
            token.type === Tokenizer.WHITESPACE_CHARACTER_TOKEN ||
            token.type === Tokenizer.NULL_CHARACTER_TOKEN) {

            if (this.options.locationInfo) {
                if (this.pendingText === null)
                    this.currentTokenLocation = token.location;

                else
                    this.currentTokenLocation.end = token.location.end;
            }

            this.pendingText = (this.pendingText || '') + token.chars;
        }

        else {
            this._emitPendingText();
            this._handleToken(token);
        }
    } while (token.type !== Tokenizer.EOF_TOKEN);
};

//Internals
SimpleApiParser.prototype._handleToken = function (token) {
    if (this.options.locationInfo)
        this.currentTokenLocation = token.location;

    if (token.type === Tokenizer.START_TAG_TOKEN)
        this.handlers.startTag(token.tagName, token.attrs, token.selfClosing);

    else if (token.type === Tokenizer.END_TAG_TOKEN)
        this.handlers.endTag(token.tagName);

    else if (token.type === Tokenizer.COMMENT_TOKEN)
        this.handlers.comment(token.data);

    else if (token.type === Tokenizer.DOCTYPE_TOKEN)
        this.handlers.doctype(token.name, token.publicId, token.systemId);

};

SimpleApiParser.prototype._reset = function (html) {
    this.tokenizerProxy = new TokenizerProxy(html, this.options);
    this.pendingText = null;
    this.currentTokenLocation = null;
};

SimpleApiParser.prototype._emitPendingText = function () {
    if (this.pendingText !== null) {
        this.handlers.text(this.pendingText);
        this.pendingText = null;
    }
};

},{"../common/utils":10,"../tokenization/tokenizer":19,"./tokenizer_proxy":15}],15:[function(require,module,exports){
'use strict';

var Tokenizer = require('../tokenization/tokenizer'),
    ForeignContent = require('../common/foreign_content'),
    UNICODE = require('../common/unicode'),
    HTML = require('../common/html');

//Aliases
var $ = HTML.TAG_NAMES,
    NS = HTML.NAMESPACES;


//Tokenizer proxy
//NOTE: this proxy simulates adjustment of the Tokenizer which performed by standard parser during tree construction.
var TokenizerProxy = module.exports = function (html, options) {
    this.tokenizer = new Tokenizer(html, options);

    this.namespaceStack = [];
    this.namespaceStackTop = -1;
    this.currentNamespace = null;
    this.inForeignContent = false;
};

//API
TokenizerProxy.prototype.getNextToken = function () {
    var token = this.tokenizer.getNextToken();

    if (token.type === Tokenizer.START_TAG_TOKEN)
        this._handleStartTagToken(token);

    else if (token.type === Tokenizer.END_TAG_TOKEN)
        this._handleEndTagToken(token);

    else if (token.type === Tokenizer.NULL_CHARACTER_TOKEN && this.inForeignContent) {
        token.type = Tokenizer.CHARACTER_TOKEN;
        token.chars = UNICODE.REPLACEMENT_CHARACTER;
    }

    return token;
};

//Namespace stack mutations
TokenizerProxy.prototype._enterNamespace = function (namespace) {
    this.namespaceStackTop++;
    this.namespaceStack.push(namespace);

    this.inForeignContent = namespace !== NS.HTML;
    this.currentNamespace = namespace;
    this.tokenizer.allowCDATA = this.inForeignContent;
};

TokenizerProxy.prototype._leaveCurrentNamespace = function () {
    this.namespaceStackTop--;
    this.namespaceStack.pop();

    this.currentNamespace = this.namespaceStack[this.namespaceStackTop];
    this.inForeignContent = this.currentNamespace !== NS.HTML;
    this.tokenizer.allowCDATA = this.inForeignContent;
};

//Token handlers
TokenizerProxy.prototype._ensureTokenizerMode = function (tn) {
    if (tn === $.TEXTAREA || tn === $.TITLE)
        this.tokenizer.state = Tokenizer.MODE.RCDATA;

    else if (tn === $.PLAINTEXT)
        this.tokenizer.state = Tokenizer.MODE.PLAINTEXT;

    else if (tn === $.SCRIPT)
        this.tokenizer.state = Tokenizer.MODE.SCRIPT_DATA;

    else if (tn === $.STYLE || tn === $.IFRAME || tn === $.XMP ||
             tn === $.NOEMBED || tn === $.NOFRAMES || tn === $.NOSCRIPT) {
        this.tokenizer.state = Tokenizer.MODE.RAWTEXT;
    }
};

TokenizerProxy.prototype._handleStartTagToken = function (token) {
    var tn = token.tagName;

    if (tn === $.SVG)
        this._enterNamespace(NS.SVG);

    else if (tn === $.MATH)
        this._enterNamespace(NS.MATHML);

    else {
        if (this.inForeignContent) {
            if (ForeignContent.causesExit(token))
                this._leaveCurrentNamespace();

            else if (ForeignContent.isMathMLTextIntegrationPoint(tn, this.currentNamespace) ||
                     ForeignContent.isHtmlIntegrationPoint(tn, this.currentNamespace, token.attrs)) {
                this._enterNamespace(NS.HTML);
            }
        }

        else
            this._ensureTokenizerMode(tn);
    }
};

TokenizerProxy.prototype._handleEndTagToken = function (token) {
    var tn = token.tagName;

    if (!this.inForeignContent) {
        var previousNs = this.namespaceStack[this.namespaceStackTop - 1];

        //NOTE: check for exit from integration point
        if (ForeignContent.isMathMLTextIntegrationPoint(tn, previousNs) ||
            ForeignContent.isHtmlIntegrationPoint(tn, previousNs, token.attrs)) {
            this._leaveCurrentNamespace();
        }

        else if (tn === $.SCRIPT)
            this.tokenizer.state = Tokenizer.MODE.DATA;
    }

    else if ((tn === $.SVG && this.currentNamespace === NS.SVG) ||
             (tn === $.MATH && this.currentNamespace === NS.MATHML))
        this._leaveCurrentNamespace();
};

},{"../common/foreign_content":7,"../common/html":8,"../common/unicode":9,"../tokenization/tokenizer":19}],16:[function(require,module,exports){
'use strict';

exports.assign = function (tokenizer) {
    //NOTE: obtain Tokenizer proto this way to avoid module circular references
    var tokenizerProto = Object.getPrototypeOf(tokenizer);

    tokenizer.tokenStartLoc = -1;

    //NOTE: add location info builder method
    tokenizer._attachLocationInfo = function (token) {
        token.location = {
            start: this.tokenStartLoc,
            end: -1
        };
    };

    //NOTE: patch token creation methods and attach location objects
    tokenizer._createStartTagToken = function (tagNameFirstCh) {
        tokenizerProto._createStartTagToken.call(this, tagNameFirstCh);
        this._attachLocationInfo(this.currentToken);
    };

    tokenizer._createEndTagToken = function (tagNameFirstCh) {
        tokenizerProto._createEndTagToken.call(this, tagNameFirstCh);
        this._attachLocationInfo(this.currentToken);
    };

    tokenizer._createCommentToken = function () {
        tokenizerProto._createCommentToken.call(this);
        this._attachLocationInfo(this.currentToken);
    };

    tokenizer._createDoctypeToken = function (doctypeNameFirstCh) {
        tokenizerProto._createDoctypeToken.call(this, doctypeNameFirstCh);
        this._attachLocationInfo(this.currentToken);
    };

    tokenizer._createCharacterToken = function (type, ch) {
        tokenizerProto._createCharacterToken.call(this, type, ch);
        this._attachLocationInfo(this.currentCharacterToken);
    };

    //NOTE: patch token emission methods to determine end location
    tokenizer._emitCurrentToken = function () {
        //NOTE: if we have pending character token make it's end location equal to the
        //current token's start location.
        if (this.currentCharacterToken)
            this.currentCharacterToken.location.end = this.currentToken.location.start;

        this.currentToken.location.end = this.preprocessor.pos + 1;
        tokenizerProto._emitCurrentToken.call(this);
    };

    tokenizer._emitCurrentCharacterToken = function () {
        //NOTE: if we have character token and it's location wasn't set in the _emitCurrentToken(),
        //then set it's location at the current preprocessor position
        if (this.currentCharacterToken && this.currentCharacterToken.location.end === -1) {
            //NOTE: we don't need to increment preprocessor position, since character token
            //emission is always forced by the start of the next character token here.
            //So, we already have advanced position.
            this.currentCharacterToken.location.end = this.preprocessor.pos;
        }

        tokenizerProto._emitCurrentCharacterToken.call(this);
    };

    //NOTE: patch initial states for each mode to obtain token start position
    Object.keys(tokenizerProto.MODE)

        .map(function (modeName) {
            return tokenizerProto.MODE[modeName];
        })

        .forEach(function (state) {
            tokenizer[state] = function (cp) {
                this.tokenStartLoc = this.preprocessor.pos;
                tokenizerProto[state].call(this, cp);
            };
        });
};

},{}],17:[function(require,module,exports){
'use strict';

//NOTE: this file contains auto generated trie structure that is used for named entity references consumption
//(see: http://www.whatwg.org/specs/web-apps/current-work/multipage/tokenization.html#tokenizing-character-references and
//http://www.whatwg.org/specs/web-apps/current-work/multipage/named-character-references.html#named-character-references)
module.exports = {
    0x41: {l: {0x61: {l: {0x63: {l: {0x75: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [193]}}, c: [193]}}}}}}}}}, 0x62: {l: {0x72: {l: {0x65: {l: {0x76: {l: {0x65: {l: {0x3B: {c: [258]}}}}}}}}}}}, 0x63: {l: {0x69: {l: {0x72: {l: {0x63: {l: {0x3B: {c: [194]}}, c: [194]}}}}}, 0x79: {l: {0x3B: {c: [1040]}}}}}, 0x45: {l: {0x6C: {l: {0x69: {l: {0x67: {l: {0x3B: {c: [198]}}, c: [198]}}}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120068]}}}}}, 0x67: {l: {0x72: {l: {0x61: {l: {0x76: {l: {0x65: {l: {0x3B: {c: [192]}}, c: [192]}}}}}}}}}, 0x6C: {l: {0x70: {l: {0x68: {l: {0x61: {l: {0x3B: {c: [913]}}}}}}}}}, 0x6D: {l: {0x61: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [256]}}}}}}}}}, 0x4D: {l: {0x50: {l: {0x3B: {c: [38]}}, c: [38]}}}, 0x6E: {l: {0x64: {l: {0x3B: {c: [10835]}}}}}, 0x6F: {l: {0x67: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [260]}}}}}}}, 0x70: {l: {0x66: {l: {0x3B: {c: [120120]}}}}}}}, 0x70: {l: {0x70: {l: {0x6C: {l: {0x79: {l: {0x46: {l: {0x75: {l: {0x6E: {l: {0x63: {l: {0x74: {l: {0x69: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [8289]}}}}}}}}}}}}}}}}}}}}}}}}}, 0x72: {l: {0x69: {l: {0x6E: {l: {0x67: {l: {0x3B: {c: [197]}}, c: [197]}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [119964]}}}}}, 0x73: {l: {0x69: {l: {0x67: {l: {0x6E: {l: {0x3B: {c: [8788]}}}}}}}}}}}, 0x74: {l: {0x69: {l: {0x6C: {l: {0x64: {l: {0x65: {l: {0x3B: {c: [195]}}, c: [195]}}}}}}}}}, 0x75: {l: {0x6D: {l: {0x6C: {l: {0x3B: {c: [196]}}, c: [196]}}}}}}},
    0x61: {l: {0x61: {l: {0x63: {l: {0x75: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [225]}}, c: [225]}}}}}}}}}, 0x62: {l: {0x72: {l: {0x65: {l: {0x76: {l: {0x65: {l: {0x3B: {c: [259]}}}}}}}}}}}, 0x63: {l: {0x3B: {c: [8766]}, 0x64: {l: {0x3B: {c: [8767]}}}, 0x45: {l: {0x3B: {c: [8766, 819]}}}, 0x69: {l: {0x72: {l: {0x63: {l: {0x3B: {c: [226]}}, c: [226]}}}}}, 0x75: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [180]}}, c: [180]}}}}}, 0x79: {l: {0x3B: {c: [1072]}}}}}, 0x65: {l: {0x6C: {l: {0x69: {l: {0x67: {l: {0x3B: {c: [230]}}, c: [230]}}}}}}}, 0x66: {l: {0x3B: {c: [8289]}, 0x72: {l: {0x3B: {c: [120094]}}}}}, 0x67: {l: {0x72: {l: {0x61: {l: {0x76: {l: {0x65: {l: {0x3B: {c: [224]}}, c: [224]}}}}}}}}}, 0x6C: {l: {0x65: {l: {0x66: {l: {0x73: {l: {0x79: {l: {0x6D: {l: {0x3B: {c: [8501]}}}}}}}}}, 0x70: {l: {0x68: {l: {0x3B: {c: [8501]}}}}}}}, 0x70: {l: {0x68: {l: {0x61: {l: {0x3B: {c: [945]}}}}}}}}}, 0x6D: {l: {0x61: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [257]}}}}}, 0x6C: {l: {0x67: {l: {0x3B: {c: [10815]}}}}}}}, 0x70: {l: {0x3B: {c: [38]}}, c: [38]}}}, 0x6E: {l: {0x64: {l: {0x61: {l: {0x6E: {l: {0x64: {l: {0x3B: {c: [10837]}}}}}}}, 0x3B: {c: [8743]}, 0x64: {l: {0x3B: {c: [10844]}}}, 0x73: {l: {0x6C: {l: {0x6F: {l: {0x70: {l: {0x65: {l: {0x3B: {c: [10840]}}}}}}}}}}}, 0x76: {l: {0x3B: {c: [10842]}}}}}, 0x67: {l: {0x3B: {c: [8736]}, 0x65: {l: {0x3B: {c: [10660]}}}, 0x6C: {l: {0x65: {l: {0x3B: {c: [8736]}}}}}, 0x6D: {l: {0x73: {l: {0x64: {l: {0x61: {l: {0x61: {l: {0x3B: {c: [10664]}}}, 0x62: {l: {0x3B: {c: [10665]}}}, 0x63: {l: {0x3B: {c: [10666]}}}, 0x64: {l: {0x3B: {c: [10667]}}}, 0x65: {l: {0x3B: {c: [10668]}}}, 0x66: {l: {0x3B: {c: [10669]}}}, 0x67: {l: {0x3B: {c: [10670]}}}, 0x68: {l: {0x3B: {c: [10671]}}}}}, 0x3B: {c: [8737]}}}}}}}, 0x72: {l: {0x74: {l: {0x3B: {c: [8735]}, 0x76: {l: {0x62: {l: {0x3B: {c: [8894]}, 0x64: {l: {0x3B: {c: [10653]}}}}}}}}}}}, 0x73: {l: {0x70: {l: {0x68: {l: {0x3B: {c: [8738]}}}}}, 0x74: {l: {0x3B: {c: [197]}}}}}, 0x7A: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [9084]}}}}}}}}}}}}}, 0x6F: {l: {0x67: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [261]}}}}}}}, 0x70: {l: {0x66: {l: {0x3B: {c: [120146]}}}}}}}, 0x70: {l: {0x61: {l: {0x63: {l: {0x69: {l: {0x72: {l: {0x3B: {c: [10863]}}}}}}}}}, 0x3B: {c: [8776]}, 0x45: {l: {0x3B: {c: [10864]}}}, 0x65: {l: {0x3B: {c: [8778]}}}, 0x69: {l: {0x64: {l: {0x3B: {c: [8779]}}}}}, 0x6F: {l: {0x73: {l: {0x3B: {c: [39]}}}}}, 0x70: {l: {0x72: {l: {0x6F: {l: {0x78: {l: {0x3B: {c: [8776]}, 0x65: {l: {0x71: {l: {0x3B: {c: [8778]}}}}}}}}}}}}}}}, 0x72: {l: {0x69: {l: {0x6E: {l: {0x67: {l: {0x3B: {c: [229]}}, c: [229]}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [119990]}}}}}, 0x74: {l: {0x3B: {c: [42]}}}, 0x79: {l: {0x6D: {l: {0x70: {l: {0x3B: {c: [8776]}, 0x65: {l: {0x71: {l: {0x3B: {c: [8781]}}}}}}}}}}}}}, 0x74: {l: {0x69: {l: {0x6C: {l: {0x64: {l: {0x65: {l: {0x3B: {c: [227]}}, c: [227]}}}}}}}}}, 0x75: {l: {0x6D: {l: {0x6C: {l: {0x3B: {c: [228]}}, c: [228]}}}}}, 0x77: {l: {0x63: {l: {0x6F: {l: {0x6E: {l: {0x69: {l: {0x6E: {l: {0x74: {l: {0x3B: {c: [8755]}}}}}}}}}}}}}, 0x69: {l: {0x6E: {l: {0x74: {l: {0x3B: {c: [10769]}}}}}}}}}}},
    0x62: {l: {0x61: {l: {0x63: {l: {0x6B: {l: {0x63: {l: {0x6F: {l: {0x6E: {l: {0x67: {l: {0x3B: {c: [8780]}}}}}}}}}, 0x65: {l: {0x70: {l: {0x73: {l: {0x69: {l: {0x6C: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [1014]}}}}}}}}}}}}}}}, 0x70: {l: {0x72: {l: {0x69: {l: {0x6D: {l: {0x65: {l: {0x3B: {c: [8245]}}}}}}}}}}}, 0x73: {l: {0x69: {l: {0x6D: {l: {0x3B: {c: [8765]}, 0x65: {l: {0x71: {l: {0x3B: {c: [8909]}}}}}}}}}}}}}}}, 0x72: {l: {0x76: {l: {0x65: {l: {0x65: {l: {0x3B: {c: [8893]}}}}}}}, 0x77: {l: {0x65: {l: {0x64: {l: {0x3B: {c: [8965]}, 0x67: {l: {0x65: {l: {0x3B: {c: [8965]}}}}}}}}}}}}}}}, 0x62: {l: {0x72: {l: {0x6B: {l: {0x3B: {c: [9141]}, 0x74: {l: {0x62: {l: {0x72: {l: {0x6B: {l: {0x3B: {c: [9142]}}}}}}}}}}}}}}}, 0x63: {l: {0x6F: {l: {0x6E: {l: {0x67: {l: {0x3B: {c: [8780]}}}}}}}, 0x79: {l: {0x3B: {c: [1073]}}}}}, 0x64: {l: {0x71: {l: {0x75: {l: {0x6F: {l: {0x3B: {c: [8222]}}}}}}}}}, 0x65: {l: {0x63: {l: {0x61: {l: {0x75: {l: {0x73: {l: {0x3B: {c: [8757]}, 0x65: {l: {0x3B: {c: [8757]}}}}}}}}}}}, 0x6D: {l: {0x70: {l: {0x74: {l: {0x79: {l: {0x76: {l: {0x3B: {c: [10672]}}}}}}}}}}}, 0x70: {l: {0x73: {l: {0x69: {l: {0x3B: {c: [1014]}}}}}}}, 0x72: {l: {0x6E: {l: {0x6F: {l: {0x75: {l: {0x3B: {c: [8492]}}}}}}}}}, 0x74: {l: {0x61: {l: {0x3B: {c: [946]}}}, 0x68: {l: {0x3B: {c: [8502]}}}, 0x77: {l: {0x65: {l: {0x65: {l: {0x6E: {l: {0x3B: {c: [8812]}}}}}}}}}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120095]}}}}}, 0x69: {l: {0x67: {l: {0x63: {l: {0x61: {l: {0x70: {l: {0x3B: {c: [8898]}}}}}, 0x69: {l: {0x72: {l: {0x63: {l: {0x3B: {c: [9711]}}}}}}}, 0x75: {l: {0x70: {l: {0x3B: {c: [8899]}}}}}}}, 0x6F: {l: {0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [10752]}}}}}}}, 0x70: {l: {0x6C: {l: {0x75: {l: {0x73: {l: {0x3B: {c: [10753]}}}}}}}}}, 0x74: {l: {0x69: {l: {0x6D: {l: {0x65: {l: {0x73: {l: {0x3B: {c: [10754]}}}}}}}}}}}}}, 0x73: {l: {0x71: {l: {0x63: {l: {0x75: {l: {0x70: {l: {0x3B: {c: [10758]}}}}}}}}}, 0x74: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [9733]}}}}}}}}}, 0x74: {l: {0x72: {l: {0x69: {l: {0x61: {l: {0x6E: {l: {0x67: {l: {0x6C: {l: {0x65: {l: {0x64: {l: {0x6F: {l: {0x77: {l: {0x6E: {l: {0x3B: {c: [9661]}}}}}}}}}, 0x75: {l: {0x70: {l: {0x3B: {c: [9651]}}}}}}}}}}}}}}}}}}}}}, 0x75: {l: {0x70: {l: {0x6C: {l: {0x75: {l: {0x73: {l: {0x3B: {c: [10756]}}}}}}}}}}}, 0x76: {l: {0x65: {l: {0x65: {l: {0x3B: {c: [8897]}}}}}}}, 0x77: {l: {0x65: {l: {0x64: {l: {0x67: {l: {0x65: {l: {0x3B: {c: [8896]}}}}}}}}}}}}}}}, 0x6B: {l: {0x61: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [10509]}}}}}}}}}}}, 0x6C: {l: {0x61: {l: {0x63: {l: {0x6B: {l: {0x6C: {l: {0x6F: {l: {0x7A: {l: {0x65: {l: {0x6E: {l: {0x67: {l: {0x65: {l: {0x3B: {c: [10731]}}}}}}}}}}}}}}}, 0x73: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x72: {l: {0x65: {l: {0x3B: {c: [9642]}}}}}}}}}}}}}, 0x74: {l: {0x72: {l: {0x69: {l: {0x61: {l: {0x6E: {l: {0x67: {l: {0x6C: {l: {0x65: {l: {0x3B: {c: [9652]}, 0x64: {l: {0x6F: {l: {0x77: {l: {0x6E: {l: {0x3B: {c: [9662]}}}}}}}}}, 0x6C: {l: {0x65: {l: {0x66: {l: {0x74: {l: {0x3B: {c: [9666]}}}}}}}}}, 0x72: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x3B: {c: [9656]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x6E: {l: {0x6B: {l: {0x3B: {c: [9251]}}}}}}}, 0x6B: {l: {0x31: {l: {0x32: {l: {0x3B: {c: [9618]}}}, 0x34: {l: {0x3B: {c: [9617]}}}}}, 0x33: {l: {0x34: {l: {0x3B: {c: [9619]}}}}}}}, 0x6F: {l: {0x63: {l: {0x6B: {l: {0x3B: {c: [9608]}}}}}}}}}, 0x6E: {l: {0x65: {l: {0x3B: {c: [61, 8421]}, 0x71: {l: {0x75: {l: {0x69: {l: {0x76: {l: {0x3B: {c: [8801, 8421]}}}}}}}}}}}, 0x6F: {l: {0x74: {l: {0x3B: {c: [8976]}}}}}}}, 0x4E: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [10989]}}}}}}}, 0x6F: {l: {0x70: {l: {0x66: {l: {0x3B: {c: [120147]}}}}}, 0x74: {l: {0x3B: {c: [8869]}, 0x74: {l: {0x6F: {l: {0x6D: {l: {0x3B: {c: [8869]}}}}}}}}}, 0x77: {l: {0x74: {l: {0x69: {l: {0x65: {l: {0x3B: {c: [8904]}}}}}}}}}, 0x78: {l: {0x62: {l: {0x6F: {l: {0x78: {l: {0x3B: {c: [10697]}}}}}}}, 0x64: {l: {0x6C: {l: {0x3B: {c: [9488]}}}, 0x4C: {l: {0x3B: {c: [9557]}}}, 0x72: {l: {0x3B: {c: [9484]}}}, 0x52: {l: {0x3B: {c: [9554]}}}}}, 0x44: {l: {0x6C: {l: {0x3B: {c: [9558]}}}, 0x4C: {l: {0x3B: {c: [9559]}}}, 0x72: {l: {0x3B: {c: [9555]}}}, 0x52: {l: {0x3B: {c: [9556]}}}}}, 0x68: {l: {0x3B: {c: [9472]}, 0x64: {l: {0x3B: {c: [9516]}}}, 0x44: {l: {0x3B: {c: [9573]}}}, 0x75: {l: {0x3B: {c: [9524]}}}, 0x55: {l: {0x3B: {c: [9576]}}}}}, 0x48: {l: {0x3B: {c: [9552]}, 0x64: {l: {0x3B: {c: [9572]}}}, 0x44: {l: {0x3B: {c: [9574]}}}, 0x75: {l: {0x3B: {c: [9575]}}}, 0x55: {l: {0x3B: {c: [9577]}}}}}, 0x6D: {l: {0x69: {l: {0x6E: {l: {0x75: {l: {0x73: {l: {0x3B: {c: [8863]}}}}}}}}}}}, 0x70: {l: {0x6C: {l: {0x75: {l: {0x73: {l: {0x3B: {c: [8862]}}}}}}}}}, 0x74: {l: {0x69: {l: {0x6D: {l: {0x65: {l: {0x73: {l: {0x3B: {c: [8864]}}}}}}}}}}}, 0x75: {l: {0x6C: {l: {0x3B: {c: [9496]}}}, 0x4C: {l: {0x3B: {c: [9563]}}}, 0x72: {l: {0x3B: {c: [9492]}}}, 0x52: {l: {0x3B: {c: [9560]}}}}}, 0x55: {l: {0x6C: {l: {0x3B: {c: [9564]}}}, 0x4C: {l: {0x3B: {c: [9565]}}}, 0x72: {l: {0x3B: {c: [9561]}}}, 0x52: {l: {0x3B: {c: [9562]}}}}}, 0x76: {l: {0x3B: {c: [9474]}, 0x68: {l: {0x3B: {c: [9532]}}}, 0x48: {l: {0x3B: {c: [9578]}}}, 0x6C: {l: {0x3B: {c: [9508]}}}, 0x4C: {l: {0x3B: {c: [9569]}}}, 0x72: {l: {0x3B: {c: [9500]}}}, 0x52: {l: {0x3B: {c: [9566]}}}}}, 0x56: {l: {0x3B: {c: [9553]}, 0x68: {l: {0x3B: {c: [9579]}}}, 0x48: {l: {0x3B: {c: [9580]}}}, 0x6C: {l: {0x3B: {c: [9570]}}}, 0x4C: {l: {0x3B: {c: [9571]}}}, 0x72: {l: {0x3B: {c: [9567]}}}, 0x52: {l: {0x3B: {c: [9568]}}}}}}}}}, 0x70: {l: {0x72: {l: {0x69: {l: {0x6D: {l: {0x65: {l: {0x3B: {c: [8245]}}}}}}}}}}}, 0x72: {l: {0x65: {l: {0x76: {l: {0x65: {l: {0x3B: {c: [728]}}}}}}}, 0x76: {l: {0x62: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [166]}}, c: [166]}}}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [119991]}}}}}, 0x65: {l: {0x6D: {l: {0x69: {l: {0x3B: {c: [8271]}}}}}}}, 0x69: {l: {0x6D: {l: {0x3B: {c: [8765]}, 0x65: {l: {0x3B: {c: [8909]}}}}}}}, 0x6F: {l: {0x6C: {l: {0x62: {l: {0x3B: {c: [10693]}}}, 0x3B: {c: [92]}, 0x68: {l: {0x73: {l: {0x75: {l: {0x62: {l: {0x3B: {c: [10184]}}}}}}}}}}}}}}}, 0x75: {l: {0x6C: {l: {0x6C: {l: {0x3B: {c: [8226]}, 0x65: {l: {0x74: {l: {0x3B: {c: [8226]}}}}}}}}}, 0x6D: {l: {0x70: {l: {0x3B: {c: [8782]}, 0x45: {l: {0x3B: {c: [10926]}}}, 0x65: {l: {0x3B: {c: [8783]}, 0x71: {l: {0x3B: {c: [8783]}}}}}}}}}}}}},
    0x42: {l: {0x61: {l: {0x63: {l: {0x6B: {l: {0x73: {l: {0x6C: {l: {0x61: {l: {0x73: {l: {0x68: {l: {0x3B: {c: [8726]}}}}}}}}}}}}}}}, 0x72: {l: {0x76: {l: {0x3B: {c: [10983]}}}, 0x77: {l: {0x65: {l: {0x64: {l: {0x3B: {c: [8966]}}}}}}}}}}}, 0x63: {l: {0x79: {l: {0x3B: {c: [1041]}}}}}, 0x65: {l: {0x63: {l: {0x61: {l: {0x75: {l: {0x73: {l: {0x65: {l: {0x3B: {c: [8757]}}}}}}}}}}}, 0x72: {l: {0x6E: {l: {0x6F: {l: {0x75: {l: {0x6C: {l: {0x6C: {l: {0x69: {l: {0x73: {l: {0x3B: {c: [8492]}}}}}}}}}}}}}}}}}, 0x74: {l: {0x61: {l: {0x3B: {c: [914]}}}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120069]}}}}}, 0x6F: {l: {0x70: {l: {0x66: {l: {0x3B: {c: [120121]}}}}}}}, 0x72: {l: {0x65: {l: {0x76: {l: {0x65: {l: {0x3B: {c: [728]}}}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [8492]}}}}}}}, 0x75: {l: {0x6D: {l: {0x70: {l: {0x65: {l: {0x71: {l: {0x3B: {c: [8782]}}}}}}}}}}}}},
    0x43: {l: {0x61: {l: {0x63: {l: {0x75: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [262]}}}}}}}}}, 0x70: {l: {0x3B: {c: [8914]}, 0x69: {l: {0x74: {l: {0x61: {l: {0x6C: {l: {0x44: {l: {0x69: {l: {0x66: {l: {0x66: {l: {0x65: {l: {0x72: {l: {0x65: {l: {0x6E: {l: {0x74: {l: {0x69: {l: {0x61: {l: {0x6C: {l: {0x44: {l: {0x3B: {c: [8517]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x79: {l: {0x6C: {l: {0x65: {l: {0x79: {l: {0x73: {l: {0x3B: {c: [8493]}}}}}}}}}}}}}, 0x63: {l: {0x61: {l: {0x72: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [268]}}}}}}}}}, 0x65: {l: {0x64: {l: {0x69: {l: {0x6C: {l: {0x3B: {c: [199]}}, c: [199]}}}}}}}, 0x69: {l: {0x72: {l: {0x63: {l: {0x3B: {c: [264]}}}}}}}, 0x6F: {l: {0x6E: {l: {0x69: {l: {0x6E: {l: {0x74: {l: {0x3B: {c: [8752]}}}}}}}}}}}}}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [266]}}}}}}}, 0x65: {l: {0x64: {l: {0x69: {l: {0x6C: {l: {0x6C: {l: {0x61: {l: {0x3B: {c: [184]}}}}}}}}}}}, 0x6E: {l: {0x74: {l: {0x65: {l: {0x72: {l: {0x44: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [183]}}}}}}}}}}}}}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [8493]}}}}}, 0x48: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1063]}}}}}}}, 0x68: {l: {0x69: {l: {0x3B: {c: [935]}}}}}, 0x69: {l: {0x72: {l: {0x63: {l: {0x6C: {l: {0x65: {l: {0x44: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [8857]}}}}}}}, 0x4D: {l: {0x69: {l: {0x6E: {l: {0x75: {l: {0x73: {l: {0x3B: {c: [8854]}}}}}}}}}}}, 0x50: {l: {0x6C: {l: {0x75: {l: {0x73: {l: {0x3B: {c: [8853]}}}}}}}}}, 0x54: {l: {0x69: {l: {0x6D: {l: {0x65: {l: {0x73: {l: {0x3B: {c: [8855]}}}}}}}}}}}}}}}}}}}}}, 0x6C: {l: {0x6F: {l: {0x63: {l: {0x6B: {l: {0x77: {l: {0x69: {l: {0x73: {l: {0x65: {l: {0x43: {l: {0x6F: {l: {0x6E: {l: {0x74: {l: {0x6F: {l: {0x75: {l: {0x72: {l: {0x49: {l: {0x6E: {l: {0x74: {l: {0x65: {l: {0x67: {l: {0x72: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8754]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x73: {l: {0x65: {l: {0x43: {l: {0x75: {l: {0x72: {l: {0x6C: {l: {0x79: {l: {0x44: {l: {0x6F: {l: {0x75: {l: {0x62: {l: {0x6C: {l: {0x65: {l: {0x51: {l: {0x75: {l: {0x6F: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [8221]}}}}}}}}}}}}}}}}}}}}}}}, 0x51: {l: {0x75: {l: {0x6F: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [8217]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x6F: {l: {0x6C: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [8759]}, 0x65: {l: {0x3B: {c: [10868]}}}}}}}}}, 0x6E: {l: {0x67: {l: {0x72: {l: {0x75: {l: {0x65: {l: {0x6E: {l: {0x74: {l: {0x3B: {c: [8801]}}}}}}}}}}}}}, 0x69: {l: {0x6E: {l: {0x74: {l: {0x3B: {c: [8751]}}}}}}}, 0x74: {l: {0x6F: {l: {0x75: {l: {0x72: {l: {0x49: {l: {0x6E: {l: {0x74: {l: {0x65: {l: {0x67: {l: {0x72: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8750]}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x70: {l: {0x66: {l: {0x3B: {c: [8450]}}}, 0x72: {l: {0x6F: {l: {0x64: {l: {0x75: {l: {0x63: {l: {0x74: {l: {0x3B: {c: [8720]}}}}}}}}}}}}}}}, 0x75: {l: {0x6E: {l: {0x74: {l: {0x65: {l: {0x72: {l: {0x43: {l: {0x6C: {l: {0x6F: {l: {0x63: {l: {0x6B: {l: {0x77: {l: {0x69: {l: {0x73: {l: {0x65: {l: {0x43: {l: {0x6F: {l: {0x6E: {l: {0x74: {l: {0x6F: {l: {0x75: {l: {0x72: {l: {0x49: {l: {0x6E: {l: {0x74: {l: {0x65: {l: {0x67: {l: {0x72: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8755]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x4F: {l: {0x50: {l: {0x59: {l: {0x3B: {c: [169]}}, c: [169]}}}}}, 0x72: {l: {0x6F: {l: {0x73: {l: {0x73: {l: {0x3B: {c: [10799]}}}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [119966]}}}}}}}, 0x75: {l: {0x70: {l: {0x43: {l: {0x61: {l: {0x70: {l: {0x3B: {c: [8781]}}}}}}}, 0x3B: {c: [8915]}}}}}}},
    0x63: {l: {0x61: {l: {0x63: {l: {0x75: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [263]}}}}}}}}}, 0x70: {l: {0x61: {l: {0x6E: {l: {0x64: {l: {0x3B: {c: [10820]}}}}}}}, 0x62: {l: {0x72: {l: {0x63: {l: {0x75: {l: {0x70: {l: {0x3B: {c: [10825]}}}}}}}}}}}, 0x63: {l: {0x61: {l: {0x70: {l: {0x3B: {c: [10827]}}}}}, 0x75: {l: {0x70: {l: {0x3B: {c: [10823]}}}}}}}, 0x3B: {c: [8745]}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [10816]}}}}}}}, 0x73: {l: {0x3B: {c: [8745, 65024]}}}}}, 0x72: {l: {0x65: {l: {0x74: {l: {0x3B: {c: [8257]}}}}}, 0x6F: {l: {0x6E: {l: {0x3B: {c: [711]}}}}}}}}}, 0x63: {l: {0x61: {l: {0x70: {l: {0x73: {l: {0x3B: {c: [10829]}}}}}, 0x72: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [269]}}}}}}}}}, 0x65: {l: {0x64: {l: {0x69: {l: {0x6C: {l: {0x3B: {c: [231]}}, c: [231]}}}}}}}, 0x69: {l: {0x72: {l: {0x63: {l: {0x3B: {c: [265]}}}}}}}, 0x75: {l: {0x70: {l: {0x73: {l: {0x3B: {c: [10828]}, 0x73: {l: {0x6D: {l: {0x3B: {c: [10832]}}}}}}}}}}}}}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [267]}}}}}}}, 0x65: {l: {0x64: {l: {0x69: {l: {0x6C: {l: {0x3B: {c: [184]}}, c: [184]}}}}}, 0x6D: {l: {0x70: {l: {0x74: {l: {0x79: {l: {0x76: {l: {0x3B: {c: [10674]}}}}}}}}}}}, 0x6E: {l: {0x74: {l: {0x3B: {c: [162]}, 0x65: {l: {0x72: {l: {0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [183]}}}}}}}}}}}}, c: [162]}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120096]}}}}}, 0x68: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1095]}}}}}, 0x65: {l: {0x63: {l: {0x6B: {l: {0x3B: {c: [10003]}, 0x6D: {l: {0x61: {l: {0x72: {l: {0x6B: {l: {0x3B: {c: [10003]}}}}}}}}}}}}}}}, 0x69: {l: {0x3B: {c: [967]}}}}}, 0x69: {l: {0x72: {l: {0x63: {l: {0x3B: {c: [710]}, 0x65: {l: {0x71: {l: {0x3B: {c: [8791]}}}}}, 0x6C: {l: {0x65: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x6C: {l: {0x65: {l: {0x66: {l: {0x74: {l: {0x3B: {c: [8634]}}}}}}}}}, 0x72: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x3B: {c: [8635]}}}}}}}}}}}}}}}}}}}}}, 0x64: {l: {0x61: {l: {0x73: {l: {0x74: {l: {0x3B: {c: [8859]}}}}}}}, 0x63: {l: {0x69: {l: {0x72: {l: {0x63: {l: {0x3B: {c: [8858]}}}}}}}}}, 0x64: {l: {0x61: {l: {0x73: {l: {0x68: {l: {0x3B: {c: [8861]}}}}}}}}}, 0x52: {l: {0x3B: {c: [174]}}}, 0x53: {l: {0x3B: {c: [9416]}}}}}}}}}}}, 0x3B: {c: [9675]}, 0x45: {l: {0x3B: {c: [10691]}}}, 0x65: {l: {0x3B: {c: [8791]}}}, 0x66: {l: {0x6E: {l: {0x69: {l: {0x6E: {l: {0x74: {l: {0x3B: {c: [10768]}}}}}}}}}}}, 0x6D: {l: {0x69: {l: {0x64: {l: {0x3B: {c: [10991]}}}}}}}, 0x73: {l: {0x63: {l: {0x69: {l: {0x72: {l: {0x3B: {c: [10690]}}}}}}}}}}}}}, 0x6C: {l: {0x75: {l: {0x62: {l: {0x73: {l: {0x3B: {c: [9827]}, 0x75: {l: {0x69: {l: {0x74: {l: {0x3B: {c: [9827]}}}}}}}}}}}}}}}, 0x6F: {l: {0x6C: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [58]}, 0x65: {l: {0x3B: {c: [8788]}, 0x71: {l: {0x3B: {c: [8788]}}}}}}}}}}}, 0x6D: {l: {0x6D: {l: {0x61: {l: {0x3B: {c: [44]}, 0x74: {l: {0x3B: {c: [64]}}}}}}}, 0x70: {l: {0x3B: {c: [8705]}, 0x66: {l: {0x6E: {l: {0x3B: {c: [8728]}}}}}, 0x6C: {l: {0x65: {l: {0x6D: {l: {0x65: {l: {0x6E: {l: {0x74: {l: {0x3B: {c: [8705]}}}}}}}}}, 0x78: {l: {0x65: {l: {0x73: {l: {0x3B: {c: [8450]}}}}}}}}}}}}}}}, 0x6E: {l: {0x67: {l: {0x3B: {c: [8773]}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [10861]}}}}}}}}}, 0x69: {l: {0x6E: {l: {0x74: {l: {0x3B: {c: [8750]}}}}}}}}}, 0x70: {l: {0x66: {l: {0x3B: {c: [120148]}}}, 0x72: {l: {0x6F: {l: {0x64: {l: {0x3B: {c: [8720]}}}}}}}, 0x79: {l: {0x3B: {c: [169]}, 0x73: {l: {0x72: {l: {0x3B: {c: [8471]}}}}}}, c: [169]}}}}}, 0x72: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [8629]}}}}}}}, 0x6F: {l: {0x73: {l: {0x73: {l: {0x3B: {c: [10007]}}}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [119992]}}}}}, 0x75: {l: {0x62: {l: {0x3B: {c: [10959]}, 0x65: {l: {0x3B: {c: [10961]}}}}}, 0x70: {l: {0x3B: {c: [10960]}, 0x65: {l: {0x3B: {c: [10962]}}}}}}}}}, 0x74: {l: {0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [8943]}}}}}}}}}, 0x75: {l: {0x64: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6C: {l: {0x3B: {c: [10552]}}}, 0x72: {l: {0x3B: {c: [10549]}}}}}}}}}}}, 0x65: {l: {0x70: {l: {0x72: {l: {0x3B: {c: [8926]}}}}}, 0x73: {l: {0x63: {l: {0x3B: {c: [8927]}}}}}}}, 0x6C: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [8630]}, 0x70: {l: {0x3B: {c: [10557]}}}}}}}}}}}, 0x70: {l: {0x62: {l: {0x72: {l: {0x63: {l: {0x61: {l: {0x70: {l: {0x3B: {c: [10824]}}}}}}}}}}}, 0x63: {l: {0x61: {l: {0x70: {l: {0x3B: {c: [10822]}}}}}, 0x75: {l: {0x70: {l: {0x3B: {c: [10826]}}}}}}}, 0x3B: {c: [8746]}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [8845]}}}}}}}, 0x6F: {l: {0x72: {l: {0x3B: {c: [10821]}}}}}, 0x73: {l: {0x3B: {c: [8746, 65024]}}}}}, 0x72: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [8631]}, 0x6D: {l: {0x3B: {c: [10556]}}}}}}}}}, 0x6C: {l: {0x79: {l: {0x65: {l: {0x71: {l: {0x70: {l: {0x72: {l: {0x65: {l: {0x63: {l: {0x3B: {c: [8926]}}}}}}}}}, 0x73: {l: {0x75: {l: {0x63: {l: {0x63: {l: {0x3B: {c: [8927]}}}}}}}}}}}}}, 0x76: {l: {0x65: {l: {0x65: {l: {0x3B: {c: [8910]}}}}}}}, 0x77: {l: {0x65: {l: {0x64: {l: {0x67: {l: {0x65: {l: {0x3B: {c: [8911]}}}}}}}}}}}}}}}, 0x72: {l: {0x65: {l: {0x6E: {l: {0x3B: {c: [164]}}, c: [164]}}}}}, 0x76: {l: {0x65: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x6C: {l: {0x65: {l: {0x66: {l: {0x74: {l: {0x3B: {c: [8630]}}}}}}}}}, 0x72: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x3B: {c: [8631]}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x76: {l: {0x65: {l: {0x65: {l: {0x3B: {c: [8910]}}}}}}}, 0x77: {l: {0x65: {l: {0x64: {l: {0x3B: {c: [8911]}}}}}}}}}, 0x77: {l: {0x63: {l: {0x6F: {l: {0x6E: {l: {0x69: {l: {0x6E: {l: {0x74: {l: {0x3B: {c: [8754]}}}}}}}}}}}}}, 0x69: {l: {0x6E: {l: {0x74: {l: {0x3B: {c: [8753]}}}}}}}}}, 0x79: {l: {0x6C: {l: {0x63: {l: {0x74: {l: {0x79: {l: {0x3B: {c: [9005]}}}}}}}}}}}}},
    0x64: {l: {0x61: {l: {0x67: {l: {0x67: {l: {0x65: {l: {0x72: {l: {0x3B: {c: [8224]}}}}}}}}}, 0x6C: {l: {0x65: {l: {0x74: {l: {0x68: {l: {0x3B: {c: [8504]}}}}}}}}}, 0x72: {l: {0x72: {l: {0x3B: {c: [8595]}}}}}, 0x73: {l: {0x68: {l: {0x3B: {c: [8208]}, 0x76: {l: {0x3B: {c: [8867]}}}}}}}}}, 0x41: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [8659]}}}}}}}, 0x62: {l: {0x6B: {l: {0x61: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [10511]}}}}}}}}}}}, 0x6C: {l: {0x61: {l: {0x63: {l: {0x3B: {c: [733]}}}}}}}}}, 0x63: {l: {0x61: {l: {0x72: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [271]}}}}}}}}}, 0x79: {l: {0x3B: {c: [1076]}}}}}, 0x64: {l: {0x61: {l: {0x67: {l: {0x67: {l: {0x65: {l: {0x72: {l: {0x3B: {c: [8225]}}}}}}}}}, 0x72: {l: {0x72: {l: {0x3B: {c: [8650]}}}}}}}, 0x3B: {c: [8518]}, 0x6F: {l: {0x74: {l: {0x73: {l: {0x65: {l: {0x71: {l: {0x3B: {c: [10871]}}}}}}}}}}}}}, 0x65: {l: {0x67: {l: {0x3B: {c: [176]}}, c: [176]}, 0x6C: {l: {0x74: {l: {0x61: {l: {0x3B: {c: [948]}}}}}}}, 0x6D: {l: {0x70: {l: {0x74: {l: {0x79: {l: {0x76: {l: {0x3B: {c: [10673]}}}}}}}}}}}}}, 0x66: {l: {0x69: {l: {0x73: {l: {0x68: {l: {0x74: {l: {0x3B: {c: [10623]}}}}}}}}}, 0x72: {l: {0x3B: {c: [120097]}}}}}, 0x48: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10597]}}}}}}}, 0x68: {l: {0x61: {l: {0x72: {l: {0x6C: {l: {0x3B: {c: [8643]}}}, 0x72: {l: {0x3B: {c: [8642]}}}}}}}}}, 0x69: {l: {0x61: {l: {0x6D: {l: {0x3B: {c: [8900]}, 0x6F: {l: {0x6E: {l: {0x64: {l: {0x3B: {c: [8900]}, 0x73: {l: {0x75: {l: {0x69: {l: {0x74: {l: {0x3B: {c: [9830]}}}}}}}}}}}}}}}, 0x73: {l: {0x3B: {c: [9830]}}}}}}}, 0x65: {l: {0x3B: {c: [168]}}}, 0x67: {l: {0x61: {l: {0x6D: {l: {0x6D: {l: {0x61: {l: {0x3B: {c: [989]}}}}}}}}}}}, 0x73: {l: {0x69: {l: {0x6E: {l: {0x3B: {c: [8946]}}}}}}}, 0x76: {l: {0x3B: {c: [247]}, 0x69: {l: {0x64: {l: {0x65: {l: {0x3B: {c: [247]}, 0x6F: {l: {0x6E: {l: {0x74: {l: {0x69: {l: {0x6D: {l: {0x65: {l: {0x73: {l: {0x3B: {c: [8903]}}}}}}}}}}}}}}}}, c: [247]}}}}}, 0x6F: {l: {0x6E: {l: {0x78: {l: {0x3B: {c: [8903]}}}}}}}}}}}, 0x6A: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1106]}}}}}}}, 0x6C: {l: {0x63: {l: {0x6F: {l: {0x72: {l: {0x6E: {l: {0x3B: {c: [8990]}}}}}}}, 0x72: {l: {0x6F: {l: {0x70: {l: {0x3B: {c: [8973]}}}}}}}}}}}, 0x6F: {l: {0x6C: {l: {0x6C: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [36]}}}}}}}}}, 0x70: {l: {0x66: {l: {0x3B: {c: [120149]}}}}}, 0x74: {l: {0x3B: {c: [729]}, 0x65: {l: {0x71: {l: {0x3B: {c: [8784]}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [8785]}}}}}}}}}}}, 0x6D: {l: {0x69: {l: {0x6E: {l: {0x75: {l: {0x73: {l: {0x3B: {c: [8760]}}}}}}}}}}}, 0x70: {l: {0x6C: {l: {0x75: {l: {0x73: {l: {0x3B: {c: [8724]}}}}}}}}}, 0x73: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x72: {l: {0x65: {l: {0x3B: {c: [8865]}}}}}}}}}}}}}}}, 0x75: {l: {0x62: {l: {0x6C: {l: {0x65: {l: {0x62: {l: {0x61: {l: {0x72: {l: {0x77: {l: {0x65: {l: {0x64: {l: {0x67: {l: {0x65: {l: {0x3B: {c: [8966]}}}}}}}}}}}}}}}}}}}}}}}}}, 0x77: {l: {0x6E: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8595]}}}}}}}}}}}, 0x64: {l: {0x6F: {l: {0x77: {l: {0x6E: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x73: {l: {0x3B: {c: [8650]}}}}}}}}}}}}}}}}}}}}}, 0x68: {l: {0x61: {l: {0x72: {l: {0x70: {l: {0x6F: {l: {0x6F: {l: {0x6E: {l: {0x6C: {l: {0x65: {l: {0x66: {l: {0x74: {l: {0x3B: {c: [8643]}}}}}}}}}, 0x72: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x3B: {c: [8642]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x72: {l: {0x62: {l: {0x6B: {l: {0x61: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [10512]}}}}}}}}}}}}}, 0x63: {l: {0x6F: {l: {0x72: {l: {0x6E: {l: {0x3B: {c: [8991]}}}}}}}, 0x72: {l: {0x6F: {l: {0x70: {l: {0x3B: {c: [8972]}}}}}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [119993]}}}, 0x79: {l: {0x3B: {c: [1109]}}}}}, 0x6F: {l: {0x6C: {l: {0x3B: {c: [10742]}}}}}, 0x74: {l: {0x72: {l: {0x6F: {l: {0x6B: {l: {0x3B: {c: [273]}}}}}}}}}}}, 0x74: {l: {0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [8945]}}}}}}}, 0x72: {l: {0x69: {l: {0x3B: {c: [9663]}, 0x66: {l: {0x3B: {c: [9662]}}}}}}}}}, 0x75: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [8693]}}}}}}}, 0x68: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10607]}}}}}}}}}, 0x77: {l: {0x61: {l: {0x6E: {l: {0x67: {l: {0x6C: {l: {0x65: {l: {0x3B: {c: [10662]}}}}}}}}}}}}}, 0x7A: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1119]}}}}}, 0x69: {l: {0x67: {l: {0x72: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [10239]}}}}}}}}}}}}}}}}},
    0x44: {l: {0x61: {l: {0x67: {l: {0x67: {l: {0x65: {l: {0x72: {l: {0x3B: {c: [8225]}}}}}}}}}, 0x72: {l: {0x72: {l: {0x3B: {c: [8609]}}}}}, 0x73: {l: {0x68: {l: {0x76: {l: {0x3B: {c: [10980]}}}}}}}}}, 0x63: {l: {0x61: {l: {0x72: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [270]}}}}}}}}}, 0x79: {l: {0x3B: {c: [1044]}}}}}, 0x44: {l: {0x3B: {c: [8517]}, 0x6F: {l: {0x74: {l: {0x72: {l: {0x61: {l: {0x68: {l: {0x64: {l: {0x3B: {c: [10513]}}}}}}}}}}}}}}}, 0x65: {l: {0x6C: {l: {0x3B: {c: [8711]}, 0x74: {l: {0x61: {l: {0x3B: {c: [916]}}}}}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120071]}}}}}, 0x69: {l: {0x61: {l: {0x63: {l: {0x72: {l: {0x69: {l: {0x74: {l: {0x69: {l: {0x63: {l: {0x61: {l: {0x6C: {l: {0x41: {l: {0x63: {l: {0x75: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [180]}}}}}}}}}}}, 0x44: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [729]}}}, 0x75: {l: {0x62: {l: {0x6C: {l: {0x65: {l: {0x41: {l: {0x63: {l: {0x75: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [733]}}}}}}}}}}}}}}}}}}}}}}}, 0x47: {l: {0x72: {l: {0x61: {l: {0x76: {l: {0x65: {l: {0x3B: {c: [96]}}}}}}}}}}}, 0x54: {l: {0x69: {l: {0x6C: {l: {0x64: {l: {0x65: {l: {0x3B: {c: [732]}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x6D: {l: {0x6F: {l: {0x6E: {l: {0x64: {l: {0x3B: {c: [8900]}}}}}}}}}}}, 0x66: {l: {0x66: {l: {0x65: {l: {0x72: {l: {0x65: {l: {0x6E: {l: {0x74: {l: {0x69: {l: {0x61: {l: {0x6C: {l: {0x44: {l: {0x3B: {c: [8518]}}}}}}}}}}}}}}}}}}}}}}}}}, 0x4A: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1026]}}}}}}}, 0x6F: {l: {0x70: {l: {0x66: {l: {0x3B: {c: [120123]}}}}}, 0x74: {l: {0x3B: {c: [168]}, 0x44: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [8412]}}}}}}}, 0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8784]}}}}}}}}}}}}}, 0x75: {l: {0x62: {l: {0x6C: {l: {0x65: {l: {0x43: {l: {0x6F: {l: {0x6E: {l: {0x74: {l: {0x6F: {l: {0x75: {l: {0x72: {l: {0x49: {l: {0x6E: {l: {0x74: {l: {0x65: {l: {0x67: {l: {0x72: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8751]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x44: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [168]}}}, 0x77: {l: {0x6E: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8659]}}}}}}}}}}}}}}}}}}}, 0x4C: {l: {0x65: {l: {0x66: {l: {0x74: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8656]}}}}}}}}}}}, 0x52: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8660]}}}}}}}}}}}}}}}}}}}}}, 0x54: {l: {0x65: {l: {0x65: {l: {0x3B: {c: [10980]}}}}}}}}}}}}}, 0x6F: {l: {0x6E: {l: {0x67: {l: {0x4C: {l: {0x65: {l: {0x66: {l: {0x74: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [10232]}}}}}}}}}}}, 0x52: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [10234]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x52: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [10233]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x52: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8658]}}}}}}}}}}}, 0x54: {l: {0x65: {l: {0x65: {l: {0x3B: {c: [8872]}}}}}}}}}}}}}}}}}, 0x55: {l: {0x70: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8657]}}}}}}}}}}}, 0x44: {l: {0x6F: {l: {0x77: {l: {0x6E: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8661]}}}}}}}}}}}}}}}}}}}}}}}, 0x56: {l: {0x65: {l: {0x72: {l: {0x74: {l: {0x69: {l: {0x63: {l: {0x61: {l: {0x6C: {l: {0x42: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [8741]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x77: {l: {0x6E: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x42: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10515]}}}}}}}, 0x3B: {c: [8595]}, 0x55: {l: {0x70: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8693]}}}}}}}}}}}}}}}}}}}}}}}}}, 0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8659]}}}}}}}}}}}, 0x42: {l: {0x72: {l: {0x65: {l: {0x76: {l: {0x65: {l: {0x3B: {c: [785]}}}}}}}}}}}, 0x4C: {l: {0x65: {l: {0x66: {l: {0x74: {l: {0x52: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x56: {l: {0x65: {l: {0x63: {l: {0x74: {l: {0x6F: {l: {0x72: {l: {0x3B: {c: [10576]}}}}}}}}}}}}}}}}}}}}}}}, 0x54: {l: {0x65: {l: {0x65: {l: {0x56: {l: {0x65: {l: {0x63: {l: {0x74: {l: {0x6F: {l: {0x72: {l: {0x3B: {c: [10590]}}}}}}}}}}}}}}}}}}}, 0x56: {l: {0x65: {l: {0x63: {l: {0x74: {l: {0x6F: {l: {0x72: {l: {0x42: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10582]}}}}}}}, 0x3B: {c: [8637]}}}}}}}}}}}}}}}}}}}}}, 0x52: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x54: {l: {0x65: {l: {0x65: {l: {0x56: {l: {0x65: {l: {0x63: {l: {0x74: {l: {0x6F: {l: {0x72: {l: {0x3B: {c: [10591]}}}}}}}}}}}}}}}}}}}, 0x56: {l: {0x65: {l: {0x63: {l: {0x74: {l: {0x6F: {l: {0x72: {l: {0x42: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10583]}}}}}}}, 0x3B: {c: [8641]}}}}}}}}}}}}}}}}}}}}}}}, 0x54: {l: {0x65: {l: {0x65: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8615]}}}}}}}}}}}, 0x3B: {c: [8868]}}}}}}}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [119967]}}}}}, 0x74: {l: {0x72: {l: {0x6F: {l: {0x6B: {l: {0x3B: {c: [272]}}}}}}}}}}}, 0x53: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1029]}}}}}}}, 0x5A: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1039]}}}}}}}}},
    0x45: {l: {0x61: {l: {0x63: {l: {0x75: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [201]}}, c: [201]}}}}}}}}}, 0x63: {l: {0x61: {l: {0x72: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [282]}}}}}}}}}, 0x69: {l: {0x72: {l: {0x63: {l: {0x3B: {c: [202]}}, c: [202]}}}}}, 0x79: {l: {0x3B: {c: [1069]}}}}}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [278]}}}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120072]}}}}}, 0x67: {l: {0x72: {l: {0x61: {l: {0x76: {l: {0x65: {l: {0x3B: {c: [200]}}, c: [200]}}}}}}}}}, 0x6C: {l: {0x65: {l: {0x6D: {l: {0x65: {l: {0x6E: {l: {0x74: {l: {0x3B: {c: [8712]}}}}}}}}}}}}}, 0x6D: {l: {0x61: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [274]}}}}}}}, 0x70: {l: {0x74: {l: {0x79: {l: {0x53: {l: {0x6D: {l: {0x61: {l: {0x6C: {l: {0x6C: {l: {0x53: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x72: {l: {0x65: {l: {0x3B: {c: [9723]}}}}}}}}}}}}}}}}}}}}}}}, 0x56: {l: {0x65: {l: {0x72: {l: {0x79: {l: {0x53: {l: {0x6D: {l: {0x61: {l: {0x6C: {l: {0x6C: {l: {0x53: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x72: {l: {0x65: {l: {0x3B: {c: [9643]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x4E: {l: {0x47: {l: {0x3B: {c: [330]}}}}}, 0x6F: {l: {0x67: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [280]}}}}}}}, 0x70: {l: {0x66: {l: {0x3B: {c: [120124]}}}}}}}, 0x70: {l: {0x73: {l: {0x69: {l: {0x6C: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [917]}}}}}}}}}}}}}, 0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [10869]}, 0x54: {l: {0x69: {l: {0x6C: {l: {0x64: {l: {0x65: {l: {0x3B: {c: [8770]}}}}}}}}}}}}}}}, 0x69: {l: {0x6C: {l: {0x69: {l: {0x62: {l: {0x72: {l: {0x69: {l: {0x75: {l: {0x6D: {l: {0x3B: {c: [8652]}}}}}}}}}}}}}}}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [8496]}}}}}, 0x69: {l: {0x6D: {l: {0x3B: {c: [10867]}}}}}}}, 0x74: {l: {0x61: {l: {0x3B: {c: [919]}}}}}, 0x54: {l: {0x48: {l: {0x3B: {c: [208]}}, c: [208]}}}, 0x75: {l: {0x6D: {l: {0x6C: {l: {0x3B: {c: [203]}}, c: [203]}}}}}, 0x78: {l: {0x69: {l: {0x73: {l: {0x74: {l: {0x73: {l: {0x3B: {c: [8707]}}}}}}}}}, 0x70: {l: {0x6F: {l: {0x6E: {l: {0x65: {l: {0x6E: {l: {0x74: {l: {0x69: {l: {0x61: {l: {0x6C: {l: {0x45: {l: {0x3B: {c: [8519]}}}}}}}}}}}}}}}}}}}}}}}}},
    0x65: {l: {0x61: {l: {0x63: {l: {0x75: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [233]}}, c: [233]}}}}}}}, 0x73: {l: {0x74: {l: {0x65: {l: {0x72: {l: {0x3B: {c: [10862]}}}}}}}}}}}, 0x63: {l: {0x61: {l: {0x72: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [283]}}}}}}}}}, 0x69: {l: {0x72: {l: {0x63: {l: {0x3B: {c: [234]}}, c: [234]}, 0x3B: {c: [8790]}}}}}, 0x6F: {l: {0x6C: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [8789]}}}}}}}}}, 0x79: {l: {0x3B: {c: [1101]}}}}}, 0x44: {l: {0x44: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [10871]}}}}}}}, 0x6F: {l: {0x74: {l: {0x3B: {c: [8785]}}}}}}}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [279]}}}}}}}, 0x65: {l: {0x3B: {c: [8519]}}}, 0x66: {l: {0x44: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [8786]}}}}}}}, 0x72: {l: {0x3B: {c: [120098]}}}}}, 0x67: {l: {0x3B: {c: [10906]}, 0x72: {l: {0x61: {l: {0x76: {l: {0x65: {l: {0x3B: {c: [232]}}, c: [232]}}}}}}}, 0x73: {l: {0x3B: {c: [10902]}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [10904]}}}}}}}}}}}, 0x6C: {l: {0x3B: {c: [10905]}, 0x69: {l: {0x6E: {l: {0x74: {l: {0x65: {l: {0x72: {l: {0x73: {l: {0x3B: {c: [9191]}}}}}}}}}}}}}, 0x6C: {l: {0x3B: {c: [8467]}}}, 0x73: {l: {0x3B: {c: [10901]}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [10903]}}}}}}}}}}}, 0x6D: {l: {0x61: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [275]}}}}}}}, 0x70: {l: {0x74: {l: {0x79: {l: {0x3B: {c: [8709]}, 0x73: {l: {0x65: {l: {0x74: {l: {0x3B: {c: [8709]}}}}}}}, 0x76: {l: {0x3B: {c: [8709]}}}}}}}}}, 0x73: {l: {0x70: {l: {0x31: {l: {0x33: {l: {0x3B: {c: [8196]}}}, 0x34: {l: {0x3B: {c: [8197]}}}}}, 0x3B: {c: [8195]}}}}}}}, 0x6E: {l: {0x67: {l: {0x3B: {c: [331]}}}, 0x73: {l: {0x70: {l: {0x3B: {c: [8194]}}}}}}}, 0x6F: {l: {0x67: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [281]}}}}}}}, 0x70: {l: {0x66: {l: {0x3B: {c: [120150]}}}}}}}, 0x70: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [8917]}, 0x73: {l: {0x6C: {l: {0x3B: {c: [10723]}}}}}}}}}, 0x6C: {l: {0x75: {l: {0x73: {l: {0x3B: {c: [10865]}}}}}}}, 0x73: {l: {0x69: {l: {0x3B: {c: [949]}, 0x6C: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [949]}}}}}}}, 0x76: {l: {0x3B: {c: [1013]}}}}}}}}}, 0x71: {l: {0x63: {l: {0x69: {l: {0x72: {l: {0x63: {l: {0x3B: {c: [8790]}}}}}}}, 0x6F: {l: {0x6C: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [8789]}}}}}}}}}}}, 0x73: {l: {0x69: {l: {0x6D: {l: {0x3B: {c: [8770]}}}}}, 0x6C: {l: {0x61: {l: {0x6E: {l: {0x74: {l: {0x67: {l: {0x74: {l: {0x72: {l: {0x3B: {c: [10902]}}}}}}}, 0x6C: {l: {0x65: {l: {0x73: {l: {0x73: {l: {0x3B: {c: [10901]}}}}}}}}}}}}}}}}}}}, 0x75: {l: {0x61: {l: {0x6C: {l: {0x73: {l: {0x3B: {c: [61]}}}}}}}, 0x65: {l: {0x73: {l: {0x74: {l: {0x3B: {c: [8799]}}}}}}}, 0x69: {l: {0x76: {l: {0x3B: {c: [8801]}, 0x44: {l: {0x44: {l: {0x3B: {c: [10872]}}}}}}}}}}}, 0x76: {l: {0x70: {l: {0x61: {l: {0x72: {l: {0x73: {l: {0x6C: {l: {0x3B: {c: [10725]}}}}}}}}}}}}}}}, 0x72: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [10609]}}}}}}}, 0x44: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [8787]}}}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [8495]}}}}}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [8784]}}}}}}}, 0x69: {l: {0x6D: {l: {0x3B: {c: [8770]}}}}}}}, 0x74: {l: {0x61: {l: {0x3B: {c: [951]}}}, 0x68: {l: {0x3B: {c: [240]}}, c: [240]}}}, 0x75: {l: {0x6D: {l: {0x6C: {l: {0x3B: {c: [235]}}, c: [235]}}}, 0x72: {l: {0x6F: {l: {0x3B: {c: [8364]}}}}}}}, 0x78: {l: {0x63: {l: {0x6C: {l: {0x3B: {c: [33]}}}}}, 0x69: {l: {0x73: {l: {0x74: {l: {0x3B: {c: [8707]}}}}}}}, 0x70: {l: {0x65: {l: {0x63: {l: {0x74: {l: {0x61: {l: {0x74: {l: {0x69: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [8496]}}}}}}}}}}}}}}}}}, 0x6F: {l: {0x6E: {l: {0x65: {l: {0x6E: {l: {0x74: {l: {0x69: {l: {0x61: {l: {0x6C: {l: {0x65: {l: {0x3B: {c: [8519]}}}}}}}}}}}}}}}}}}}}}}}}},
    0x66: {l: {0x61: {l: {0x6C: {l: {0x6C: {l: {0x69: {l: {0x6E: {l: {0x67: {l: {0x64: {l: {0x6F: {l: {0x74: {l: {0x73: {l: {0x65: {l: {0x71: {l: {0x3B: {c: [8786]}}}}}}}}}}}}}}}}}}}}}}}}}, 0x63: {l: {0x79: {l: {0x3B: {c: [1092]}}}}}, 0x65: {l: {0x6D: {l: {0x61: {l: {0x6C: {l: {0x65: {l: {0x3B: {c: [9792]}}}}}}}}}}}, 0x66: {l: {0x69: {l: {0x6C: {l: {0x69: {l: {0x67: {l: {0x3B: {c: [64259]}}}}}}}}}, 0x6C: {l: {0x69: {l: {0x67: {l: {0x3B: {c: [64256]}}}}}, 0x6C: {l: {0x69: {l: {0x67: {l: {0x3B: {c: [64260]}}}}}}}}}, 0x72: {l: {0x3B: {c: [120099]}}}}}, 0x69: {l: {0x6C: {l: {0x69: {l: {0x67: {l: {0x3B: {c: [64257]}}}}}}}}}, 0x6A: {l: {0x6C: {l: {0x69: {l: {0x67: {l: {0x3B: {c: [102, 106]}}}}}}}}}, 0x6C: {l: {0x61: {l: {0x74: {l: {0x3B: {c: [9837]}}}}}, 0x6C: {l: {0x69: {l: {0x67: {l: {0x3B: {c: [64258]}}}}}}}, 0x74: {l: {0x6E: {l: {0x73: {l: {0x3B: {c: [9649]}}}}}}}}}, 0x6E: {l: {0x6F: {l: {0x66: {l: {0x3B: {c: [402]}}}}}}}, 0x6F: {l: {0x70: {l: {0x66: {l: {0x3B: {c: [120151]}}}}}, 0x72: {l: {0x61: {l: {0x6C: {l: {0x6C: {l: {0x3B: {c: [8704]}}}}}}}, 0x6B: {l: {0x3B: {c: [8916]}, 0x76: {l: {0x3B: {c: [10969]}}}}}}}}}, 0x70: {l: {0x61: {l: {0x72: {l: {0x74: {l: {0x69: {l: {0x6E: {l: {0x74: {l: {0x3B: {c: [10765]}}}}}}}}}}}}}}}, 0x72: {l: {0x61: {l: {0x63: {l: {0x31: {l: {0x32: {l: {0x3B: {c: [189]}}, c: [189]}, 0x33: {l: {0x3B: {c: [8531]}}}, 0x34: {l: {0x3B: {c: [188]}}, c: [188]}, 0x35: {l: {0x3B: {c: [8533]}}}, 0x36: {l: {0x3B: {c: [8537]}}}, 0x38: {l: {0x3B: {c: [8539]}}}}}, 0x32: {l: {0x33: {l: {0x3B: {c: [8532]}}}, 0x35: {l: {0x3B: {c: [8534]}}}}}, 0x33: {l: {0x34: {l: {0x3B: {c: [190]}}, c: [190]}, 0x35: {l: {0x3B: {c: [8535]}}}, 0x38: {l: {0x3B: {c: [8540]}}}}}, 0x34: {l: {0x35: {l: {0x3B: {c: [8536]}}}}}, 0x35: {l: {0x36: {l: {0x3B: {c: [8538]}}}, 0x38: {l: {0x3B: {c: [8541]}}}}}, 0x37: {l: {0x38: {l: {0x3B: {c: [8542]}}}}}}}, 0x73: {l: {0x6C: {l: {0x3B: {c: [8260]}}}}}}}, 0x6F: {l: {0x77: {l: {0x6E: {l: {0x3B: {c: [8994]}}}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [119995]}}}}}}}}},
    0x46: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1060]}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120073]}}}}}, 0x69: {l: {0x6C: {l: {0x6C: {l: {0x65: {l: {0x64: {l: {0x53: {l: {0x6D: {l: {0x61: {l: {0x6C: {l: {0x6C: {l: {0x53: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x72: {l: {0x65: {l: {0x3B: {c: [9724]}}}}}}}}}}}}}}}}}}}}}}}, 0x56: {l: {0x65: {l: {0x72: {l: {0x79: {l: {0x53: {l: {0x6D: {l: {0x61: {l: {0x6C: {l: {0x6C: {l: {0x53: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x72: {l: {0x65: {l: {0x3B: {c: [9642]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x6F: {l: {0x70: {l: {0x66: {l: {0x3B: {c: [120125]}}}}}, 0x72: {l: {0x41: {l: {0x6C: {l: {0x6C: {l: {0x3B: {c: [8704]}}}}}}}}}, 0x75: {l: {0x72: {l: {0x69: {l: {0x65: {l: {0x72: {l: {0x74: {l: {0x72: {l: {0x66: {l: {0x3B: {c: [8497]}}}}}}}}}}}}}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [8497]}}}}}}}}},
    0x67: {l: {0x61: {l: {0x63: {l: {0x75: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [501]}}}}}}}}}, 0x6D: {l: {0x6D: {l: {0x61: {l: {0x3B: {c: [947]}, 0x64: {l: {0x3B: {c: [989]}}}}}}}}}, 0x70: {l: {0x3B: {c: [10886]}}}}}, 0x62: {l: {0x72: {l: {0x65: {l: {0x76: {l: {0x65: {l: {0x3B: {c: [287]}}}}}}}}}}}, 0x63: {l: {0x69: {l: {0x72: {l: {0x63: {l: {0x3B: {c: [285]}}}}}}}, 0x79: {l: {0x3B: {c: [1075]}}}}}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [289]}}}}}}}, 0x65: {l: {0x3B: {c: [8805]}, 0x6C: {l: {0x3B: {c: [8923]}}}, 0x71: {l: {0x3B: {c: [8805]}, 0x71: {l: {0x3B: {c: [8807]}}}, 0x73: {l: {0x6C: {l: {0x61: {l: {0x6E: {l: {0x74: {l: {0x3B: {c: [10878]}}}}}}}}}}}}}, 0x73: {l: {0x63: {l: {0x63: {l: {0x3B: {c: [10921]}}}}}, 0x3B: {c: [10878]}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [10880]}, 0x6F: {l: {0x3B: {c: [10882]}, 0x6C: {l: {0x3B: {c: [10884]}}}}}}}}}}}, 0x6C: {l: {0x3B: {c: [8923, 65024]}, 0x65: {l: {0x73: {l: {0x3B: {c: [10900]}}}}}}}}}}}, 0x45: {l: {0x3B: {c: [8807]}, 0x6C: {l: {0x3B: {c: [10892]}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120100]}}}}}, 0x67: {l: {0x3B: {c: [8811]}, 0x67: {l: {0x3B: {c: [8921]}}}}}, 0x69: {l: {0x6D: {l: {0x65: {l: {0x6C: {l: {0x3B: {c: [8503]}}}}}}}}}, 0x6A: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1107]}}}}}}}, 0x6C: {l: {0x61: {l: {0x3B: {c: [10917]}}}, 0x3B: {c: [8823]}, 0x45: {l: {0x3B: {c: [10898]}}}, 0x6A: {l: {0x3B: {c: [10916]}}}}}, 0x6E: {l: {0x61: {l: {0x70: {l: {0x3B: {c: [10890]}, 0x70: {l: {0x72: {l: {0x6F: {l: {0x78: {l: {0x3B: {c: [10890]}}}}}}}}}}}}}, 0x65: {l: {0x3B: {c: [10888]}, 0x71: {l: {0x3B: {c: [10888]}, 0x71: {l: {0x3B: {c: [8809]}}}}}}}, 0x45: {l: {0x3B: {c: [8809]}}}, 0x73: {l: {0x69: {l: {0x6D: {l: {0x3B: {c: [8935]}}}}}}}}}, 0x6F: {l: {0x70: {l: {0x66: {l: {0x3B: {c: [120152]}}}}}}}, 0x72: {l: {0x61: {l: {0x76: {l: {0x65: {l: {0x3B: {c: [96]}}}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [8458]}}}}}, 0x69: {l: {0x6D: {l: {0x3B: {c: [8819]}, 0x65: {l: {0x3B: {c: [10894]}}}, 0x6C: {l: {0x3B: {c: [10896]}}}}}}}}}, 0x74: {l: {0x63: {l: {0x63: {l: {0x3B: {c: [10919]}}}, 0x69: {l: {0x72: {l: {0x3B: {c: [10874]}}}}}}}, 0x3B: {c: [62]}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [8919]}}}}}}}, 0x6C: {l: {0x50: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10645]}}}}}}}}}, 0x71: {l: {0x75: {l: {0x65: {l: {0x73: {l: {0x74: {l: {0x3B: {c: [10876]}}}}}}}}}}}, 0x72: {l: {0x61: {l: {0x70: {l: {0x70: {l: {0x72: {l: {0x6F: {l: {0x78: {l: {0x3B: {c: [10886]}}}}}}}}}}}, 0x72: {l: {0x72: {l: {0x3B: {c: [10616]}}}}}}}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [8919]}}}}}}}, 0x65: {l: {0x71: {l: {0x6C: {l: {0x65: {l: {0x73: {l: {0x73: {l: {0x3B: {c: [8923]}}}}}}}}}, 0x71: {l: {0x6C: {l: {0x65: {l: {0x73: {l: {0x73: {l: {0x3B: {c: [10892]}}}}}}}}}}}}}}}, 0x6C: {l: {0x65: {l: {0x73: {l: {0x73: {l: {0x3B: {c: [8823]}}}}}}}}}, 0x73: {l: {0x69: {l: {0x6D: {l: {0x3B: {c: [8819]}}}}}}}}}}, c: [62]}, 0x76: {l: {0x65: {l: {0x72: {l: {0x74: {l: {0x6E: {l: {0x65: {l: {0x71: {l: {0x71: {l: {0x3B: {c: [8809, 65024]}}}}}}}}}}}}}}}, 0x6E: {l: {0x45: {l: {0x3B: {c: [8809, 65024]}}}}}}}}},
    0x47: {l: {0x61: {l: {0x6D: {l: {0x6D: {l: {0x61: {l: {0x3B: {c: [915]}, 0x64: {l: {0x3B: {c: [988]}}}}}}}}}}}, 0x62: {l: {0x72: {l: {0x65: {l: {0x76: {l: {0x65: {l: {0x3B: {c: [286]}}}}}}}}}}}, 0x63: {l: {0x65: {l: {0x64: {l: {0x69: {l: {0x6C: {l: {0x3B: {c: [290]}}}}}}}}}, 0x69: {l: {0x72: {l: {0x63: {l: {0x3B: {c: [284]}}}}}}}, 0x79: {l: {0x3B: {c: [1043]}}}}}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [288]}}}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120074]}}}}}, 0x67: {l: {0x3B: {c: [8921]}}}, 0x4A: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1027]}}}}}}}, 0x6F: {l: {0x70: {l: {0x66: {l: {0x3B: {c: [120126]}}}}}}}, 0x72: {l: {0x65: {l: {0x61: {l: {0x74: {l: {0x65: {l: {0x72: {l: {0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8805]}, 0x4C: {l: {0x65: {l: {0x73: {l: {0x73: {l: {0x3B: {c: [8923]}}}}}}}}}}}}}}}}}}}, 0x46: {l: {0x75: {l: {0x6C: {l: {0x6C: {l: {0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8807]}}}}}}}}}}}}}}}}}}}, 0x47: {l: {0x72: {l: {0x65: {l: {0x61: {l: {0x74: {l: {0x65: {l: {0x72: {l: {0x3B: {c: [10914]}}}}}}}}}}}}}}}, 0x4C: {l: {0x65: {l: {0x73: {l: {0x73: {l: {0x3B: {c: [8823]}}}}}}}}}, 0x53: {l: {0x6C: {l: {0x61: {l: {0x6E: {l: {0x74: {l: {0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [10878]}}}}}}}}}}}}}}}}}}}}}, 0x54: {l: {0x69: {l: {0x6C: {l: {0x64: {l: {0x65: {l: {0x3B: {c: [8819]}}}}}}}}}}}}}}}}}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [119970]}}}}}}}, 0x54: {l: {0x3B: {c: [62]}}, c: [62]}, 0x74: {l: {0x3B: {c: [8811]}}}}},
    0x48: {l: {0x61: {l: {0x63: {l: {0x65: {l: {0x6B: {l: {0x3B: {c: [711]}}}}}}}, 0x74: {l: {0x3B: {c: [94]}}}}}, 0x41: {l: {0x52: {l: {0x44: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1066]}}}}}}}}}}}, 0x63: {l: {0x69: {l: {0x72: {l: {0x63: {l: {0x3B: {c: [292]}}}}}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [8460]}}}}}, 0x69: {l: {0x6C: {l: {0x62: {l: {0x65: {l: {0x72: {l: {0x74: {l: {0x53: {l: {0x70: {l: {0x61: {l: {0x63: {l: {0x65: {l: {0x3B: {c: [8459]}}}}}}}}}}}}}}}}}}}}}}}, 0x6F: {l: {0x70: {l: {0x66: {l: {0x3B: {c: [8461]}}}}}, 0x72: {l: {0x69: {l: {0x7A: {l: {0x6F: {l: {0x6E: {l: {0x74: {l: {0x61: {l: {0x6C: {l: {0x4C: {l: {0x69: {l: {0x6E: {l: {0x65: {l: {0x3B: {c: [9472]}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [8459]}}}}}, 0x74: {l: {0x72: {l: {0x6F: {l: {0x6B: {l: {0x3B: {c: [294]}}}}}}}}}}}, 0x75: {l: {0x6D: {l: {0x70: {l: {0x44: {l: {0x6F: {l: {0x77: {l: {0x6E: {l: {0x48: {l: {0x75: {l: {0x6D: {l: {0x70: {l: {0x3B: {c: [8782]}}}}}}}}}}}}}}}}}, 0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8783]}}}}}}}}}}}}}}}}}}},
    0x68: {l: {0x61: {l: {0x69: {l: {0x72: {l: {0x73: {l: {0x70: {l: {0x3B: {c: [8202]}}}}}}}}}, 0x6C: {l: {0x66: {l: {0x3B: {c: [189]}}}}}, 0x6D: {l: {0x69: {l: {0x6C: {l: {0x74: {l: {0x3B: {c: [8459]}}}}}}}}}, 0x72: {l: {0x64: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1098]}}}}}}}, 0x72: {l: {0x63: {l: {0x69: {l: {0x72: {l: {0x3B: {c: [10568]}}}}}}}, 0x3B: {c: [8596]}, 0x77: {l: {0x3B: {c: [8621]}}}}}}}}}, 0x41: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [8660]}}}}}}}, 0x62: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [8463]}}}}}}}, 0x63: {l: {0x69: {l: {0x72: {l: {0x63: {l: {0x3B: {c: [293]}}}}}}}}}, 0x65: {l: {0x61: {l: {0x72: {l: {0x74: {l: {0x73: {l: {0x3B: {c: [9829]}, 0x75: {l: {0x69: {l: {0x74: {l: {0x3B: {c: [9829]}}}}}}}}}}}}}}}, 0x6C: {l: {0x6C: {l: {0x69: {l: {0x70: {l: {0x3B: {c: [8230]}}}}}}}}}, 0x72: {l: {0x63: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [8889]}}}}}}}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120101]}}}}}, 0x6B: {l: {0x73: {l: {0x65: {l: {0x61: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [10533]}}}}}}}}}}}, 0x77: {l: {0x61: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [10534]}}}}}}}}}}}}}}}, 0x6F: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [8703]}}}}}}}, 0x6D: {l: {0x74: {l: {0x68: {l: {0x74: {l: {0x3B: {c: [8763]}}}}}}}}}, 0x6F: {l: {0x6B: {l: {0x6C: {l: {0x65: {l: {0x66: {l: {0x74: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8617]}}}}}}}}}}}}}}}}}}}, 0x72: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8618]}}}}}}}}}}}}}}}}}}}}}}}}}, 0x70: {l: {0x66: {l: {0x3B: {c: [120153]}}}}}, 0x72: {l: {0x62: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [8213]}}}}}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [119997]}}}}}, 0x6C: {l: {0x61: {l: {0x73: {l: {0x68: {l: {0x3B: {c: [8463]}}}}}}}}}, 0x74: {l: {0x72: {l: {0x6F: {l: {0x6B: {l: {0x3B: {c: [295]}}}}}}}}}}}, 0x79: {l: {0x62: {l: {0x75: {l: {0x6C: {l: {0x6C: {l: {0x3B: {c: [8259]}}}}}}}}}, 0x70: {l: {0x68: {l: {0x65: {l: {0x6E: {l: {0x3B: {c: [8208]}}}}}}}}}}}}},
    0x49: {l: {0x61: {l: {0x63: {l: {0x75: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [205]}}, c: [205]}}}}}}}}}, 0x63: {l: {0x69: {l: {0x72: {l: {0x63: {l: {0x3B: {c: [206]}}, c: [206]}}}}}, 0x79: {l: {0x3B: {c: [1048]}}}}}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [304]}}}}}}}, 0x45: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1045]}}}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [8465]}}}}}, 0x67: {l: {0x72: {l: {0x61: {l: {0x76: {l: {0x65: {l: {0x3B: {c: [204]}}, c: [204]}}}}}}}}}, 0x4A: {l: {0x6C: {l: {0x69: {l: {0x67: {l: {0x3B: {c: [306]}}}}}}}}}, 0x6D: {l: {0x61: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [298]}}}}}, 0x67: {l: {0x69: {l: {0x6E: {l: {0x61: {l: {0x72: {l: {0x79: {l: {0x49: {l: {0x3B: {c: [8520]}}}}}}}}}}}}}}}}}, 0x3B: {c: [8465]}, 0x70: {l: {0x6C: {l: {0x69: {l: {0x65: {l: {0x73: {l: {0x3B: {c: [8658]}}}}}}}}}}}}}, 0x6E: {l: {0x74: {l: {0x3B: {c: [8748]}, 0x65: {l: {0x67: {l: {0x72: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8747]}}}}}}}}}, 0x72: {l: {0x73: {l: {0x65: {l: {0x63: {l: {0x74: {l: {0x69: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [8898]}}}}}}}}}}}}}}}}}}}}}, 0x76: {l: {0x69: {l: {0x73: {l: {0x69: {l: {0x62: {l: {0x6C: {l: {0x65: {l: {0x43: {l: {0x6F: {l: {0x6D: {l: {0x6D: {l: {0x61: {l: {0x3B: {c: [8291]}}}}}}}}}}}, 0x54: {l: {0x69: {l: {0x6D: {l: {0x65: {l: {0x73: {l: {0x3B: {c: [8290]}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x4F: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1025]}}}}}}}, 0x6F: {l: {0x67: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [302]}}}}}}}, 0x70: {l: {0x66: {l: {0x3B: {c: [120128]}}}}}, 0x74: {l: {0x61: {l: {0x3B: {c: [921]}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [8464]}}}}}}}, 0x74: {l: {0x69: {l: {0x6C: {l: {0x64: {l: {0x65: {l: {0x3B: {c: [296]}}}}}}}}}}}, 0x75: {l: {0x6B: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1030]}}}}}}}, 0x6D: {l: {0x6C: {l: {0x3B: {c: [207]}}, c: [207]}}}}}}},
    0x69: {l: {0x61: {l: {0x63: {l: {0x75: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [237]}}, c: [237]}}}}}}}}}, 0x63: {l: {0x3B: {c: [8291]}, 0x69: {l: {0x72: {l: {0x63: {l: {0x3B: {c: [238]}}, c: [238]}}}}}, 0x79: {l: {0x3B: {c: [1080]}}}}}, 0x65: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1077]}}}}}, 0x78: {l: {0x63: {l: {0x6C: {l: {0x3B: {c: [161]}}, c: [161]}}}}}}}, 0x66: {l: {0x66: {l: {0x3B: {c: [8660]}}}, 0x72: {l: {0x3B: {c: [120102]}}}}}, 0x67: {l: {0x72: {l: {0x61: {l: {0x76: {l: {0x65: {l: {0x3B: {c: [236]}}, c: [236]}}}}}}}}}, 0x69: {l: {0x3B: {c: [8520]}, 0x69: {l: {0x69: {l: {0x6E: {l: {0x74: {l: {0x3B: {c: [10764]}}}}}}}, 0x6E: {l: {0x74: {l: {0x3B: {c: [8749]}}}}}}}, 0x6E: {l: {0x66: {l: {0x69: {l: {0x6E: {l: {0x3B: {c: [10716]}}}}}}}}}, 0x6F: {l: {0x74: {l: {0x61: {l: {0x3B: {c: [8489]}}}}}}}}}, 0x6A: {l: {0x6C: {l: {0x69: {l: {0x67: {l: {0x3B: {c: [307]}}}}}}}}}, 0x6D: {l: {0x61: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [299]}}}}}, 0x67: {l: {0x65: {l: {0x3B: {c: [8465]}}}, 0x6C: {l: {0x69: {l: {0x6E: {l: {0x65: {l: {0x3B: {c: [8464]}}}}}}}}}, 0x70: {l: {0x61: {l: {0x72: {l: {0x74: {l: {0x3B: {c: [8465]}}}}}}}}}}}, 0x74: {l: {0x68: {l: {0x3B: {c: [305]}}}}}}}, 0x6F: {l: {0x66: {l: {0x3B: {c: [8887]}}}}}, 0x70: {l: {0x65: {l: {0x64: {l: {0x3B: {c: [437]}}}}}}}}}, 0x6E: {l: {0x63: {l: {0x61: {l: {0x72: {l: {0x65: {l: {0x3B: {c: [8453]}}}}}}}}}, 0x3B: {c: [8712]}, 0x66: {l: {0x69: {l: {0x6E: {l: {0x3B: {c: [8734]}, 0x74: {l: {0x69: {l: {0x65: {l: {0x3B: {c: [10717]}}}}}}}}}}}}}, 0x6F: {l: {0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [305]}}}}}}}}}, 0x74: {l: {0x63: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8890]}}}}}}}, 0x3B: {c: [8747]}, 0x65: {l: {0x67: {l: {0x65: {l: {0x72: {l: {0x73: {l: {0x3B: {c: [8484]}}}}}}}}}, 0x72: {l: {0x63: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8890]}}}}}}}}}}}, 0x6C: {l: {0x61: {l: {0x72: {l: {0x68: {l: {0x6B: {l: {0x3B: {c: [10775]}}}}}}}}}}}, 0x70: {l: {0x72: {l: {0x6F: {l: {0x64: {l: {0x3B: {c: [10812]}}}}}}}}}}}}}, 0x6F: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1105]}}}}}, 0x67: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [303]}}}}}}}, 0x70: {l: {0x66: {l: {0x3B: {c: [120154]}}}}}, 0x74: {l: {0x61: {l: {0x3B: {c: [953]}}}}}}}, 0x70: {l: {0x72: {l: {0x6F: {l: {0x64: {l: {0x3B: {c: [10812]}}}}}}}}}, 0x71: {l: {0x75: {l: {0x65: {l: {0x73: {l: {0x74: {l: {0x3B: {c: [191]}}, c: [191]}}}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [119998]}}}}}, 0x69: {l: {0x6E: {l: {0x3B: {c: [8712]}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [8949]}}}}}}}, 0x45: {l: {0x3B: {c: [8953]}}}, 0x73: {l: {0x3B: {c: [8948]}, 0x76: {l: {0x3B: {c: [8947]}}}}}, 0x76: {l: {0x3B: {c: [8712]}}}}}}}}}, 0x74: {l: {0x3B: {c: [8290]}, 0x69: {l: {0x6C: {l: {0x64: {l: {0x65: {l: {0x3B: {c: [297]}}}}}}}}}}}, 0x75: {l: {0x6B: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1110]}}}}}}}, 0x6D: {l: {0x6C: {l: {0x3B: {c: [239]}}, c: [239]}}}}}}},
    0x4A: {l: {0x63: {l: {0x69: {l: {0x72: {l: {0x63: {l: {0x3B: {c: [308]}}}}}}}, 0x79: {l: {0x3B: {c: [1049]}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120077]}}}}}, 0x6F: {l: {0x70: {l: {0x66: {l: {0x3B: {c: [120129]}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [119973]}}}}}, 0x65: {l: {0x72: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1032]}}}}}}}}}}}, 0x75: {l: {0x6B: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1028]}}}}}}}}}}},
    0x6A: {l: {0x63: {l: {0x69: {l: {0x72: {l: {0x63: {l: {0x3B: {c: [309]}}}}}}}, 0x79: {l: {0x3B: {c: [1081]}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120103]}}}}}, 0x6D: {l: {0x61: {l: {0x74: {l: {0x68: {l: {0x3B: {c: [567]}}}}}}}}}, 0x6F: {l: {0x70: {l: {0x66: {l: {0x3B: {c: [120155]}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [119999]}}}}}, 0x65: {l: {0x72: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1112]}}}}}}}}}}}, 0x75: {l: {0x6B: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1108]}}}}}}}}}}},
    0x4B: {l: {0x61: {l: {0x70: {l: {0x70: {l: {0x61: {l: {0x3B: {c: [922]}}}}}}}}}, 0x63: {l: {0x65: {l: {0x64: {l: {0x69: {l: {0x6C: {l: {0x3B: {c: [310]}}}}}}}}}, 0x79: {l: {0x3B: {c: [1050]}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120078]}}}}}, 0x48: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1061]}}}}}}}, 0x4A: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1036]}}}}}}}, 0x6F: {l: {0x70: {l: {0x66: {l: {0x3B: {c: [120130]}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [119974]}}}}}}}}},
    0x6B: {l: {0x61: {l: {0x70: {l: {0x70: {l: {0x61: {l: {0x3B: {c: [954]}, 0x76: {l: {0x3B: {c: [1008]}}}}}}}}}}}, 0x63: {l: {0x65: {l: {0x64: {l: {0x69: {l: {0x6C: {l: {0x3B: {c: [311]}}}}}}}}}, 0x79: {l: {0x3B: {c: [1082]}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120104]}}}}}, 0x67: {l: {0x72: {l: {0x65: {l: {0x65: {l: {0x6E: {l: {0x3B: {c: [312]}}}}}}}}}}}, 0x68: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1093]}}}}}}}, 0x6A: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1116]}}}}}}}, 0x6F: {l: {0x70: {l: {0x66: {l: {0x3B: {c: [120156]}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [120000]}}}}}}}}},
    0x6C: {l: {0x41: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [8666]}}}}}}}, 0x72: {l: {0x72: {l: {0x3B: {c: [8656]}}}}}, 0x74: {l: {0x61: {l: {0x69: {l: {0x6C: {l: {0x3B: {c: [10523]}}}}}}}}}}}, 0x61: {l: {0x63: {l: {0x75: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [314]}}}}}}}}}, 0x65: {l: {0x6D: {l: {0x70: {l: {0x74: {l: {0x79: {l: {0x76: {l: {0x3B: {c: [10676]}}}}}}}}}}}}}, 0x67: {l: {0x72: {l: {0x61: {l: {0x6E: {l: {0x3B: {c: [8466]}}}}}}}}}, 0x6D: {l: {0x62: {l: {0x64: {l: {0x61: {l: {0x3B: {c: [955]}}}}}}}}}, 0x6E: {l: {0x67: {l: {0x3B: {c: [10216]}, 0x64: {l: {0x3B: {c: [10641]}}}, 0x6C: {l: {0x65: {l: {0x3B: {c: [10216]}}}}}}}}}, 0x70: {l: {0x3B: {c: [10885]}}}, 0x71: {l: {0x75: {l: {0x6F: {l: {0x3B: {c: [171]}}, c: [171]}}}}}, 0x72: {l: {0x72: {l: {0x62: {l: {0x3B: {c: [8676]}, 0x66: {l: {0x73: {l: {0x3B: {c: [10527]}}}}}}}, 0x3B: {c: [8592]}, 0x66: {l: {0x73: {l: {0x3B: {c: [10525]}}}}}, 0x68: {l: {0x6B: {l: {0x3B: {c: [8617]}}}}}, 0x6C: {l: {0x70: {l: {0x3B: {c: [8619]}}}}}, 0x70: {l: {0x6C: {l: {0x3B: {c: [10553]}}}}}, 0x73: {l: {0x69: {l: {0x6D: {l: {0x3B: {c: [10611]}}}}}}}, 0x74: {l: {0x6C: {l: {0x3B: {c: [8610]}}}}}}}}}, 0x74: {l: {0x61: {l: {0x69: {l: {0x6C: {l: {0x3B: {c: [10521]}}}}}}}, 0x3B: {c: [10923]}, 0x65: {l: {0x3B: {c: [10925]}, 0x73: {l: {0x3B: {c: [10925, 65024]}}}}}}}}}, 0x62: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [10508]}}}}}}}, 0x62: {l: {0x72: {l: {0x6B: {l: {0x3B: {c: [10098]}}}}}}}, 0x72: {l: {0x61: {l: {0x63: {l: {0x65: {l: {0x3B: {c: [123]}}}, 0x6B: {l: {0x3B: {c: [91]}}}}}}}, 0x6B: {l: {0x65: {l: {0x3B: {c: [10635]}}}, 0x73: {l: {0x6C: {l: {0x64: {l: {0x3B: {c: [10639]}}}, 0x75: {l: {0x3B: {c: [10637]}}}}}}}}}}}}}, 0x42: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [10510]}}}}}}}}}, 0x63: {l: {0x61: {l: {0x72: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [318]}}}}}}}}}, 0x65: {l: {0x64: {l: {0x69: {l: {0x6C: {l: {0x3B: {c: [316]}}}}}}}, 0x69: {l: {0x6C: {l: {0x3B: {c: [8968]}}}}}}}, 0x75: {l: {0x62: {l: {0x3B: {c: [123]}}}}}, 0x79: {l: {0x3B: {c: [1083]}}}}}, 0x64: {l: {0x63: {l: {0x61: {l: {0x3B: {c: [10550]}}}}}, 0x71: {l: {0x75: {l: {0x6F: {l: {0x3B: {c: [8220]}, 0x72: {l: {0x3B: {c: [8222]}}}}}}}}}, 0x72: {l: {0x64: {l: {0x68: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10599]}}}}}}}}}, 0x75: {l: {0x73: {l: {0x68: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10571]}}}}}}}}}}}}}, 0x73: {l: {0x68: {l: {0x3B: {c: [8626]}}}}}}}, 0x65: {l: {0x3B: {c: [8804]}, 0x66: {l: {0x74: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8592]}, 0x74: {l: {0x61: {l: {0x69: {l: {0x6C: {l: {0x3B: {c: [8610]}}}}}}}}}}}}}}}}}}}, 0x68: {l: {0x61: {l: {0x72: {l: {0x70: {l: {0x6F: {l: {0x6F: {l: {0x6E: {l: {0x64: {l: {0x6F: {l: {0x77: {l: {0x6E: {l: {0x3B: {c: [8637]}}}}}}}}}, 0x75: {l: {0x70: {l: {0x3B: {c: [8636]}}}}}}}}}}}}}}}}}}}, 0x6C: {l: {0x65: {l: {0x66: {l: {0x74: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x73: {l: {0x3B: {c: [8647]}}}}}}}}}}}}}}}}}}}}}, 0x72: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8596]}, 0x73: {l: {0x3B: {c: [8646]}}}}}}}}}}}}}, 0x68: {l: {0x61: {l: {0x72: {l: {0x70: {l: {0x6F: {l: {0x6F: {l: {0x6E: {l: {0x73: {l: {0x3B: {c: [8651]}}}}}}}}}}}}}}}}}, 0x73: {l: {0x71: {l: {0x75: {l: {0x69: {l: {0x67: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8621]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x74: {l: {0x68: {l: {0x72: {l: {0x65: {l: {0x65: {l: {0x74: {l: {0x69: {l: {0x6D: {l: {0x65: {l: {0x73: {l: {0x3B: {c: [8907]}}}}}}}}}}}}}}}}}}}}}}}}}, 0x67: {l: {0x3B: {c: [8922]}}}, 0x71: {l: {0x3B: {c: [8804]}, 0x71: {l: {0x3B: {c: [8806]}}}, 0x73: {l: {0x6C: {l: {0x61: {l: {0x6E: {l: {0x74: {l: {0x3B: {c: [10877]}}}}}}}}}}}}}, 0x73: {l: {0x63: {l: {0x63: {l: {0x3B: {c: [10920]}}}}}, 0x3B: {c: [10877]}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [10879]}, 0x6F: {l: {0x3B: {c: [10881]}, 0x72: {l: {0x3B: {c: [10883]}}}}}}}}}}}, 0x67: {l: {0x3B: {c: [8922, 65024]}, 0x65: {l: {0x73: {l: {0x3B: {c: [10899]}}}}}}}, 0x73: {l: {0x61: {l: {0x70: {l: {0x70: {l: {0x72: {l: {0x6F: {l: {0x78: {l: {0x3B: {c: [10885]}}}}}}}}}}}}}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [8918]}}}}}}}, 0x65: {l: {0x71: {l: {0x67: {l: {0x74: {l: {0x72: {l: {0x3B: {c: [8922]}}}}}}}, 0x71: {l: {0x67: {l: {0x74: {l: {0x72: {l: {0x3B: {c: [10891]}}}}}}}}}}}}}, 0x67: {l: {0x74: {l: {0x72: {l: {0x3B: {c: [8822]}}}}}}}, 0x73: {l: {0x69: {l: {0x6D: {l: {0x3B: {c: [8818]}}}}}}}}}}}}}, 0x45: {l: {0x3B: {c: [8806]}, 0x67: {l: {0x3B: {c: [10891]}}}}}, 0x66: {l: {0x69: {l: {0x73: {l: {0x68: {l: {0x74: {l: {0x3B: {c: [10620]}}}}}}}}}, 0x6C: {l: {0x6F: {l: {0x6F: {l: {0x72: {l: {0x3B: {c: [8970]}}}}}}}}}, 0x72: {l: {0x3B: {c: [120105]}}}}}, 0x67: {l: {0x3B: {c: [8822]}, 0x45: {l: {0x3B: {c: [10897]}}}}}, 0x48: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10594]}}}}}}}, 0x68: {l: {0x61: {l: {0x72: {l: {0x64: {l: {0x3B: {c: [8637]}}}, 0x75: {l: {0x3B: {c: [8636]}, 0x6C: {l: {0x3B: {c: [10602]}}}}}}}}}, 0x62: {l: {0x6C: {l: {0x6B: {l: {0x3B: {c: [9604]}}}}}}}}}, 0x6A: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1113]}}}}}}}, 0x6C: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [8647]}}}}}}}, 0x3B: {c: [8810]}, 0x63: {l: {0x6F: {l: {0x72: {l: {0x6E: {l: {0x65: {l: {0x72: {l: {0x3B: {c: [8990]}}}}}}}}}}}}}, 0x68: {l: {0x61: {l: {0x72: {l: {0x64: {l: {0x3B: {c: [10603]}}}}}}}}}, 0x74: {l: {0x72: {l: {0x69: {l: {0x3B: {c: [9722]}}}}}}}}}, 0x6D: {l: {0x69: {l: {0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [320]}}}}}}}}}, 0x6F: {l: {0x75: {l: {0x73: {l: {0x74: {l: {0x61: {l: {0x63: {l: {0x68: {l: {0x65: {l: {0x3B: {c: [9136]}}}}}}}}}, 0x3B: {c: [9136]}}}}}}}}}}}, 0x6E: {l: {0x61: {l: {0x70: {l: {0x3B: {c: [10889]}, 0x70: {l: {0x72: {l: {0x6F: {l: {0x78: {l: {0x3B: {c: [10889]}}}}}}}}}}}}}, 0x65: {l: {0x3B: {c: [10887]}, 0x71: {l: {0x3B: {c: [10887]}, 0x71: {l: {0x3B: {c: [8808]}}}}}}}, 0x45: {l: {0x3B: {c: [8808]}}}, 0x73: {l: {0x69: {l: {0x6D: {l: {0x3B: {c: [8934]}}}}}}}}}, 0x6F: {l: {0x61: {l: {0x6E: {l: {0x67: {l: {0x3B: {c: [10220]}}}}}, 0x72: {l: {0x72: {l: {0x3B: {c: [8701]}}}}}}}, 0x62: {l: {0x72: {l: {0x6B: {l: {0x3B: {c: [10214]}}}}}}}, 0x6E: {l: {0x67: {l: {0x6C: {l: {0x65: {l: {0x66: {l: {0x74: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [10229]}}}}}}}}}}}, 0x72: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [10231]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x6D: {l: {0x61: {l: {0x70: {l: {0x73: {l: {0x74: {l: {0x6F: {l: {0x3B: {c: [10236]}}}}}}}}}}}}}, 0x72: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [10230]}}}}}}}}}}}}}}}}}}}}}}}}}, 0x6F: {l: {0x70: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x6C: {l: {0x65: {l: {0x66: {l: {0x74: {l: {0x3B: {c: [8619]}}}}}}}}}, 0x72: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x3B: {c: [8620]}}}}}}}}}}}}}}}}}}}}}}}}}, 0x70: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10629]}}}}}, 0x66: {l: {0x3B: {c: [120157]}}}, 0x6C: {l: {0x75: {l: {0x73: {l: {0x3B: {c: [10797]}}}}}}}}}, 0x74: {l: {0x69: {l: {0x6D: {l: {0x65: {l: {0x73: {l: {0x3B: {c: [10804]}}}}}}}}}}}, 0x77: {l: {0x61: {l: {0x73: {l: {0x74: {l: {0x3B: {c: [8727]}}}}}}}, 0x62: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [95]}}}}}}}}}, 0x7A: {l: {0x3B: {c: [9674]}, 0x65: {l: {0x6E: {l: {0x67: {l: {0x65: {l: {0x3B: {c: [9674]}}}}}}}}}, 0x66: {l: {0x3B: {c: [10731]}}}}}}}, 0x70: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [40]}, 0x6C: {l: {0x74: {l: {0x3B: {c: [10643]}}}}}}}}}}}, 0x72: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [8646]}}}}}}}, 0x63: {l: {0x6F: {l: {0x72: {l: {0x6E: {l: {0x65: {l: {0x72: {l: {0x3B: {c: [8991]}}}}}}}}}}}}}, 0x68: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [8651]}, 0x64: {l: {0x3B: {c: [10605]}}}}}}}}}, 0x6D: {l: {0x3B: {c: [8206]}}}, 0x74: {l: {0x72: {l: {0x69: {l: {0x3B: {c: [8895]}}}}}}}}}, 0x73: {l: {0x61: {l: {0x71: {l: {0x75: {l: {0x6F: {l: {0x3B: {c: [8249]}}}}}}}}}, 0x63: {l: {0x72: {l: {0x3B: {c: [120001]}}}}}, 0x68: {l: {0x3B: {c: [8624]}}}, 0x69: {l: {0x6D: {l: {0x3B: {c: [8818]}, 0x65: {l: {0x3B: {c: [10893]}}}, 0x67: {l: {0x3B: {c: [10895]}}}}}}}, 0x71: {l: {0x62: {l: {0x3B: {c: [91]}}}, 0x75: {l: {0x6F: {l: {0x3B: {c: [8216]}, 0x72: {l: {0x3B: {c: [8218]}}}}}}}}}, 0x74: {l: {0x72: {l: {0x6F: {l: {0x6B: {l: {0x3B: {c: [322]}}}}}}}}}}}, 0x74: {l: {0x63: {l: {0x63: {l: {0x3B: {c: [10918]}}}, 0x69: {l: {0x72: {l: {0x3B: {c: [10873]}}}}}}}, 0x3B: {c: [60]}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [8918]}}}}}}}, 0x68: {l: {0x72: {l: {0x65: {l: {0x65: {l: {0x3B: {c: [8907]}}}}}}}}}, 0x69: {l: {0x6D: {l: {0x65: {l: {0x73: {l: {0x3B: {c: [8905]}}}}}}}}}, 0x6C: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [10614]}}}}}}}}}, 0x71: {l: {0x75: {l: {0x65: {l: {0x73: {l: {0x74: {l: {0x3B: {c: [10875]}}}}}}}}}}}, 0x72: {l: {0x69: {l: {0x3B: {c: [9667]}, 0x65: {l: {0x3B: {c: [8884]}}}, 0x66: {l: {0x3B: {c: [9666]}}}}}, 0x50: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10646]}}}}}}}}}}, c: [60]}, 0x75: {l: {0x72: {l: {0x64: {l: {0x73: {l: {0x68: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10570]}}}}}}}}}}}, 0x75: {l: {0x68: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10598]}}}}}}}}}}}}}, 0x76: {l: {0x65: {l: {0x72: {l: {0x74: {l: {0x6E: {l: {0x65: {l: {0x71: {l: {0x71: {l: {0x3B: {c: [8808, 65024]}}}}}}}}}}}}}}}, 0x6E: {l: {0x45: {l: {0x3B: {c: [8808, 65024]}}}}}}}}},
    0x4C: {l: {0x61: {l: {0x63: {l: {0x75: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [313]}}}}}}}}}, 0x6D: {l: {0x62: {l: {0x64: {l: {0x61: {l: {0x3B: {c: [923]}}}}}}}}}, 0x6E: {l: {0x67: {l: {0x3B: {c: [10218]}}}}}, 0x70: {l: {0x6C: {l: {0x61: {l: {0x63: {l: {0x65: {l: {0x74: {l: {0x72: {l: {0x66: {l: {0x3B: {c: [8466]}}}}}}}}}}}}}}}}}, 0x72: {l: {0x72: {l: {0x3B: {c: [8606]}}}}}}}, 0x63: {l: {0x61: {l: {0x72: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [317]}}}}}}}}}, 0x65: {l: {0x64: {l: {0x69: {l: {0x6C: {l: {0x3B: {c: [315]}}}}}}}}}, 0x79: {l: {0x3B: {c: [1051]}}}}}, 0x65: {l: {0x66: {l: {0x74: {l: {0x41: {l: {0x6E: {l: {0x67: {l: {0x6C: {l: {0x65: {l: {0x42: {l: {0x72: {l: {0x61: {l: {0x63: {l: {0x6B: {l: {0x65: {l: {0x74: {l: {0x3B: {c: [10216]}}}}}}}}}}}}}}}}}}}}}}}, 0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x42: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [8676]}}}}}}}, 0x3B: {c: [8592]}, 0x52: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8646]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8656]}}}}}}}}}}}, 0x43: {l: {0x65: {l: {0x69: {l: {0x6C: {l: {0x69: {l: {0x6E: {l: {0x67: {l: {0x3B: {c: [8968]}}}}}}}}}}}}}}}, 0x44: {l: {0x6F: {l: {0x75: {l: {0x62: {l: {0x6C: {l: {0x65: {l: {0x42: {l: {0x72: {l: {0x61: {l: {0x63: {l: {0x6B: {l: {0x65: {l: {0x74: {l: {0x3B: {c: [10214]}}}}}}}}}}}}}}}}}}}}}}}, 0x77: {l: {0x6E: {l: {0x54: {l: {0x65: {l: {0x65: {l: {0x56: {l: {0x65: {l: {0x63: {l: {0x74: {l: {0x6F: {l: {0x72: {l: {0x3B: {c: [10593]}}}}}}}}}}}}}}}}}}}, 0x56: {l: {0x65: {l: {0x63: {l: {0x74: {l: {0x6F: {l: {0x72: {l: {0x42: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10585]}}}}}}}, 0x3B: {c: [8643]}}}}}}}}}}}}}}}}}}}}}, 0x46: {l: {0x6C: {l: {0x6F: {l: {0x6F: {l: {0x72: {l: {0x3B: {c: [8970]}}}}}}}}}}}, 0x52: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8596]}}}}}}}}}}}, 0x56: {l: {0x65: {l: {0x63: {l: {0x74: {l: {0x6F: {l: {0x72: {l: {0x3B: {c: [10574]}}}}}}}}}}}}}}}}}}}}}}}, 0x72: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8660]}}}}}}}}}}}}}}}}}}}}}, 0x54: {l: {0x65: {l: {0x65: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8612]}}}}}}}}}}}, 0x3B: {c: [8867]}, 0x56: {l: {0x65: {l: {0x63: {l: {0x74: {l: {0x6F: {l: {0x72: {l: {0x3B: {c: [10586]}}}}}}}}}}}}}}}}}, 0x72: {l: {0x69: {l: {0x61: {l: {0x6E: {l: {0x67: {l: {0x6C: {l: {0x65: {l: {0x42: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10703]}}}}}}}, 0x3B: {c: [8882]}, 0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8884]}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x55: {l: {0x70: {l: {0x44: {l: {0x6F: {l: {0x77: {l: {0x6E: {l: {0x56: {l: {0x65: {l: {0x63: {l: {0x74: {l: {0x6F: {l: {0x72: {l: {0x3B: {c: [10577]}}}}}}}}}}}}}}}}}}}}}, 0x54: {l: {0x65: {l: {0x65: {l: {0x56: {l: {0x65: {l: {0x63: {l: {0x74: {l: {0x6F: {l: {0x72: {l: {0x3B: {c: [10592]}}}}}}}}}}}}}}}}}}}, 0x56: {l: {0x65: {l: {0x63: {l: {0x74: {l: {0x6F: {l: {0x72: {l: {0x42: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10584]}}}}}}}, 0x3B: {c: [8639]}}}}}}}}}}}}}}}}}, 0x56: {l: {0x65: {l: {0x63: {l: {0x74: {l: {0x6F: {l: {0x72: {l: {0x42: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10578]}}}}}}}, 0x3B: {c: [8636]}}}}}}}}}}}}}}}}}, 0x73: {l: {0x73: {l: {0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x47: {l: {0x72: {l: {0x65: {l: {0x61: {l: {0x74: {l: {0x65: {l: {0x72: {l: {0x3B: {c: [8922]}}}}}}}}}}}}}}}}}}}}}}}}}, 0x46: {l: {0x75: {l: {0x6C: {l: {0x6C: {l: {0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8806]}}}}}}}}}}}}}}}}}}}, 0x47: {l: {0x72: {l: {0x65: {l: {0x61: {l: {0x74: {l: {0x65: {l: {0x72: {l: {0x3B: {c: [8822]}}}}}}}}}}}}}}}, 0x4C: {l: {0x65: {l: {0x73: {l: {0x73: {l: {0x3B: {c: [10913]}}}}}}}}}, 0x53: {l: {0x6C: {l: {0x61: {l: {0x6E: {l: {0x74: {l: {0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [10877]}}}}}}}}}}}}}}}}}}}}}, 0x54: {l: {0x69: {l: {0x6C: {l: {0x64: {l: {0x65: {l: {0x3B: {c: [8818]}}}}}}}}}}}}}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120079]}}}}}, 0x4A: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1033]}}}}}}}, 0x6C: {l: {0x3B: {c: [8920]}, 0x65: {l: {0x66: {l: {0x74: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8666]}}}}}}}}}}}}}}}}}}}, 0x6D: {l: {0x69: {l: {0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [319]}}}}}}}}}}}, 0x6F: {l: {0x6E: {l: {0x67: {l: {0x4C: {l: {0x65: {l: {0x66: {l: {0x74: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [10229]}}}}}}}}}}}, 0x52: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [10231]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x6C: {l: {0x65: {l: {0x66: {l: {0x74: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [10232]}}}}}}}}}}}, 0x72: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [10234]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x52: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [10230]}}}}}}}}}}}}}}}}}}}}}, 0x72: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [10233]}}}}}}}}}}}}}}}}}}}}}}}}}, 0x70: {l: {0x66: {l: {0x3B: {c: [120131]}}}}}, 0x77: {l: {0x65: {l: {0x72: {l: {0x4C: {l: {0x65: {l: {0x66: {l: {0x74: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8601]}}}}}}}}}}}}}}}}}}}, 0x52: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8600]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [8466]}}}}}, 0x68: {l: {0x3B: {c: [8624]}}}, 0x74: {l: {0x72: {l: {0x6F: {l: {0x6B: {l: {0x3B: {c: [321]}}}}}}}}}}}, 0x54: {l: {0x3B: {c: [60]}}, c: [60]}, 0x74: {l: {0x3B: {c: [8810]}}}}},
    0x6D: {l: {0x61: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [175]}}, c: [175]}}}, 0x6C: {l: {0x65: {l: {0x3B: {c: [9794]}}}, 0x74: {l: {0x3B: {c: [10016]}, 0x65: {l: {0x73: {l: {0x65: {l: {0x3B: {c: [10016]}}}}}}}}}}}, 0x70: {l: {0x3B: {c: [8614]}, 0x73: {l: {0x74: {l: {0x6F: {l: {0x3B: {c: [8614]}, 0x64: {l: {0x6F: {l: {0x77: {l: {0x6E: {l: {0x3B: {c: [8615]}}}}}}}}}, 0x6C: {l: {0x65: {l: {0x66: {l: {0x74: {l: {0x3B: {c: [8612]}}}}}}}}}, 0x75: {l: {0x70: {l: {0x3B: {c: [8613]}}}}}}}}}}}}}, 0x72: {l: {0x6B: {l: {0x65: {l: {0x72: {l: {0x3B: {c: [9646]}}}}}}}}}}}, 0x63: {l: {0x6F: {l: {0x6D: {l: {0x6D: {l: {0x61: {l: {0x3B: {c: [10793]}}}}}}}}}, 0x79: {l: {0x3B: {c: [1084]}}}}}, 0x64: {l: {0x61: {l: {0x73: {l: {0x68: {l: {0x3B: {c: [8212]}}}}}}}}}, 0x44: {l: {0x44: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [8762]}}}}}}}}}, 0x65: {l: {0x61: {l: {0x73: {l: {0x75: {l: {0x72: {l: {0x65: {l: {0x64: {l: {0x61: {l: {0x6E: {l: {0x67: {l: {0x6C: {l: {0x65: {l: {0x3B: {c: [8737]}}}}}}}}}}}}}}}}}}}}}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120106]}}}}}, 0x68: {l: {0x6F: {l: {0x3B: {c: [8487]}}}}}, 0x69: {l: {0x63: {l: {0x72: {l: {0x6F: {l: {0x3B: {c: [181]}}, c: [181]}}}}}, 0x64: {l: {0x61: {l: {0x73: {l: {0x74: {l: {0x3B: {c: [42]}}}}}}}, 0x63: {l: {0x69: {l: {0x72: {l: {0x3B: {c: [10992]}}}}}}}, 0x3B: {c: [8739]}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [183]}}, c: [183]}}}}}}}, 0x6E: {l: {0x75: {l: {0x73: {l: {0x62: {l: {0x3B: {c: [8863]}}}, 0x3B: {c: [8722]}, 0x64: {l: {0x3B: {c: [8760]}, 0x75: {l: {0x3B: {c: [10794]}}}}}}}}}}}}}, 0x6C: {l: {0x63: {l: {0x70: {l: {0x3B: {c: [10971]}}}}}, 0x64: {l: {0x72: {l: {0x3B: {c: [8230]}}}}}}}, 0x6E: {l: {0x70: {l: {0x6C: {l: {0x75: {l: {0x73: {l: {0x3B: {c: [8723]}}}}}}}}}}}, 0x6F: {l: {0x64: {l: {0x65: {l: {0x6C: {l: {0x73: {l: {0x3B: {c: [8871]}}}}}}}}}, 0x70: {l: {0x66: {l: {0x3B: {c: [120158]}}}}}}}, 0x70: {l: {0x3B: {c: [8723]}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [120002]}}}}}, 0x74: {l: {0x70: {l: {0x6F: {l: {0x73: {l: {0x3B: {c: [8766]}}}}}}}}}}}, 0x75: {l: {0x3B: {c: [956]}, 0x6C: {l: {0x74: {l: {0x69: {l: {0x6D: {l: {0x61: {l: {0x70: {l: {0x3B: {c: [8888]}}}}}}}}}}}}}, 0x6D: {l: {0x61: {l: {0x70: {l: {0x3B: {c: [8888]}}}}}}}}}}},
    0x4D: {l: {0x61: {l: {0x70: {l: {0x3B: {c: [10501]}}}}}, 0x63: {l: {0x79: {l: {0x3B: {c: [1052]}}}}}, 0x65: {l: {0x64: {l: {0x69: {l: {0x75: {l: {0x6D: {l: {0x53: {l: {0x70: {l: {0x61: {l: {0x63: {l: {0x65: {l: {0x3B: {c: [8287]}}}}}}}}}}}}}}}}}}}, 0x6C: {l: {0x6C: {l: {0x69: {l: {0x6E: {l: {0x74: {l: {0x72: {l: {0x66: {l: {0x3B: {c: [8499]}}}}}}}}}}}}}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120080]}}}}}, 0x69: {l: {0x6E: {l: {0x75: {l: {0x73: {l: {0x50: {l: {0x6C: {l: {0x75: {l: {0x73: {l: {0x3B: {c: [8723]}}}}}}}}}}}}}}}}}, 0x6F: {l: {0x70: {l: {0x66: {l: {0x3B: {c: [120132]}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [8499]}}}}}}}, 0x75: {l: {0x3B: {c: [924]}}}}},
    0x6E: {l: {0x61: {l: {0x62: {l: {0x6C: {l: {0x61: {l: {0x3B: {c: [8711]}}}}}}}, 0x63: {l: {0x75: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [324]}}}}}}}}}, 0x6E: {l: {0x67: {l: {0x3B: {c: [8736, 8402]}}}}}, 0x70: {l: {0x3B: {c: [8777]}, 0x45: {l: {0x3B: {c: [10864, 824]}}}, 0x69: {l: {0x64: {l: {0x3B: {c: [8779, 824]}}}}}, 0x6F: {l: {0x73: {l: {0x3B: {c: [329]}}}}}, 0x70: {l: {0x72: {l: {0x6F: {l: {0x78: {l: {0x3B: {c: [8777]}}}}}}}}}}}, 0x74: {l: {0x75: {l: {0x72: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [9838]}, 0x73: {l: {0x3B: {c: [8469]}}}}}}}, 0x3B: {c: [9838]}}}}}}}}}, 0x62: {l: {0x73: {l: {0x70: {l: {0x3B: {c: [160]}}, c: [160]}}}, 0x75: {l: {0x6D: {l: {0x70: {l: {0x3B: {c: [8782, 824]}, 0x65: {l: {0x3B: {c: [8783, 824]}}}}}}}}}}}, 0x63: {l: {0x61: {l: {0x70: {l: {0x3B: {c: [10819]}}}, 0x72: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [328]}}}}}}}}}, 0x65: {l: {0x64: {l: {0x69: {l: {0x6C: {l: {0x3B: {c: [326]}}}}}}}}}, 0x6F: {l: {0x6E: {l: {0x67: {l: {0x3B: {c: [8775]}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [10861, 824]}}}}}}}}}}}}}, 0x75: {l: {0x70: {l: {0x3B: {c: [10818]}}}}}, 0x79: {l: {0x3B: {c: [1085]}}}}}, 0x64: {l: {0x61: {l: {0x73: {l: {0x68: {l: {0x3B: {c: [8211]}}}}}}}}}, 0x65: {l: {0x61: {l: {0x72: {l: {0x68: {l: {0x6B: {l: {0x3B: {c: [10532]}}}}}, 0x72: {l: {0x3B: {c: [8599]}, 0x6F: {l: {0x77: {l: {0x3B: {c: [8599]}}}}}}}}}}}, 0x41: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [8663]}}}}}}}, 0x3B: {c: [8800]}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [8784, 824]}}}}}}}, 0x71: {l: {0x75: {l: {0x69: {l: {0x76: {l: {0x3B: {c: [8802]}}}}}}}}}, 0x73: {l: {0x65: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10536]}}}}}}}, 0x69: {l: {0x6D: {l: {0x3B: {c: [8770, 824]}}}}}}}, 0x78: {l: {0x69: {l: {0x73: {l: {0x74: {l: {0x3B: {c: [8708]}, 0x73: {l: {0x3B: {c: [8708]}}}}}}}}}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120107]}}}}}, 0x67: {l: {0x45: {l: {0x3B: {c: [8807, 824]}}}, 0x65: {l: {0x3B: {c: [8817]}, 0x71: {l: {0x3B: {c: [8817]}, 0x71: {l: {0x3B: {c: [8807, 824]}}}, 0x73: {l: {0x6C: {l: {0x61: {l: {0x6E: {l: {0x74: {l: {0x3B: {c: [10878, 824]}}}}}}}}}}}}}, 0x73: {l: {0x3B: {c: [10878, 824]}}}}}, 0x73: {l: {0x69: {l: {0x6D: {l: {0x3B: {c: [8821]}}}}}}}, 0x74: {l: {0x3B: {c: [8815]}, 0x72: {l: {0x3B: {c: [8815]}}}}}}}, 0x47: {l: {0x67: {l: {0x3B: {c: [8921, 824]}}}, 0x74: {l: {0x3B: {c: [8811, 8402]}, 0x76: {l: {0x3B: {c: [8811, 824]}}}}}}}, 0x68: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [8622]}}}}}}}, 0x41: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [8654]}}}}}}}, 0x70: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10994]}}}}}}}}}, 0x69: {l: {0x3B: {c: [8715]}, 0x73: {l: {0x3B: {c: [8956]}, 0x64: {l: {0x3B: {c: [8954]}}}}}, 0x76: {l: {0x3B: {c: [8715]}}}}}, 0x6A: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1114]}}}}}}}, 0x6C: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [8602]}}}}}}}, 0x41: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [8653]}}}}}}}, 0x64: {l: {0x72: {l: {0x3B: {c: [8229]}}}}}, 0x45: {l: {0x3B: {c: [8806, 824]}}}, 0x65: {l: {0x3B: {c: [8816]}, 0x66: {l: {0x74: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8602]}}}}}}}}}}}, 0x72: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8622]}}}}}}}}}}}}}}}}}}}}}}}}}, 0x71: {l: {0x3B: {c: [8816]}, 0x71: {l: {0x3B: {c: [8806, 824]}}}, 0x73: {l: {0x6C: {l: {0x61: {l: {0x6E: {l: {0x74: {l: {0x3B: {c: [10877, 824]}}}}}}}}}}}}}, 0x73: {l: {0x3B: {c: [10877, 824]}, 0x73: {l: {0x3B: {c: [8814]}}}}}}}, 0x73: {l: {0x69: {l: {0x6D: {l: {0x3B: {c: [8820]}}}}}}}, 0x74: {l: {0x3B: {c: [8814]}, 0x72: {l: {0x69: {l: {0x3B: {c: [8938]}, 0x65: {l: {0x3B: {c: [8940]}}}}}}}}}}}, 0x4C: {l: {0x65: {l: {0x66: {l: {0x74: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8653]}}}}}}}}}}}, 0x72: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8654]}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x6C: {l: {0x3B: {c: [8920, 824]}}}, 0x74: {l: {0x3B: {c: [8810, 8402]}, 0x76: {l: {0x3B: {c: [8810, 824]}}}}}}}, 0x6D: {l: {0x69: {l: {0x64: {l: {0x3B: {c: [8740]}}}}}}}, 0x6F: {l: {0x70: {l: {0x66: {l: {0x3B: {c: [120159]}}}}}, 0x74: {l: {0x3B: {c: [172]}, 0x69: {l: {0x6E: {l: {0x3B: {c: [8713]}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [8949, 824]}}}}}}}, 0x45: {l: {0x3B: {c: [8953, 824]}}}, 0x76: {l: {0x61: {l: {0x3B: {c: [8713]}}}, 0x62: {l: {0x3B: {c: [8951]}}}, 0x63: {l: {0x3B: {c: [8950]}}}}}}}}}, 0x6E: {l: {0x69: {l: {0x3B: {c: [8716]}, 0x76: {l: {0x61: {l: {0x3B: {c: [8716]}}}, 0x62: {l: {0x3B: {c: [8958]}}}, 0x63: {l: {0x3B: {c: [8957]}}}}}}}}}}, c: [172]}}}, 0x70: {l: {0x61: {l: {0x72: {l: {0x61: {l: {0x6C: {l: {0x6C: {l: {0x65: {l: {0x6C: {l: {0x3B: {c: [8742]}}}}}}}}}}}, 0x3B: {c: [8742]}, 0x73: {l: {0x6C: {l: {0x3B: {c: [11005, 8421]}}}}}, 0x74: {l: {0x3B: {c: [8706, 824]}}}}}}}, 0x6F: {l: {0x6C: {l: {0x69: {l: {0x6E: {l: {0x74: {l: {0x3B: {c: [10772]}}}}}}}}}}}, 0x72: {l: {0x3B: {c: [8832]}, 0x63: {l: {0x75: {l: {0x65: {l: {0x3B: {c: [8928]}}}}}}}, 0x65: {l: {0x63: {l: {0x3B: {c: [8832]}, 0x65: {l: {0x71: {l: {0x3B: {c: [10927, 824]}}}}}}}, 0x3B: {c: [10927, 824]}}}}}}}, 0x72: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x63: {l: {0x3B: {c: [10547, 824]}}}, 0x3B: {c: [8603]}, 0x77: {l: {0x3B: {c: [8605, 824]}}}}}}}}}, 0x41: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [8655]}}}}}}}, 0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8603]}}}}}}}}}}}}}}}}}}}, 0x74: {l: {0x72: {l: {0x69: {l: {0x3B: {c: [8939]}, 0x65: {l: {0x3B: {c: [8941]}}}}}}}}}}}, 0x52: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8655]}}}}}}}}}}}}}}}}}}}}}, 0x73: {l: {0x63: {l: {0x3B: {c: [8833]}, 0x63: {l: {0x75: {l: {0x65: {l: {0x3B: {c: [8929]}}}}}}}, 0x65: {l: {0x3B: {c: [10928, 824]}}}, 0x72: {l: {0x3B: {c: [120003]}}}}}, 0x68: {l: {0x6F: {l: {0x72: {l: {0x74: {l: {0x6D: {l: {0x69: {l: {0x64: {l: {0x3B: {c: [8740]}}}}}}}, 0x70: {l: {0x61: {l: {0x72: {l: {0x61: {l: {0x6C: {l: {0x6C: {l: {0x65: {l: {0x6C: {l: {0x3B: {c: [8742]}}}}}}}}}}}}}}}}}}}}}}}}}, 0x69: {l: {0x6D: {l: {0x3B: {c: [8769]}, 0x65: {l: {0x3B: {c: [8772]}, 0x71: {l: {0x3B: {c: [8772]}}}}}}}}}, 0x6D: {l: {0x69: {l: {0x64: {l: {0x3B: {c: [8740]}}}}}}}, 0x70: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [8742]}}}}}}}, 0x71: {l: {0x73: {l: {0x75: {l: {0x62: {l: {0x65: {l: {0x3B: {c: [8930]}}}}}, 0x70: {l: {0x65: {l: {0x3B: {c: [8931]}}}}}}}}}}}, 0x75: {l: {0x62: {l: {0x3B: {c: [8836]}, 0x45: {l: {0x3B: {c: [10949, 824]}}}, 0x65: {l: {0x3B: {c: [8840]}}}, 0x73: {l: {0x65: {l: {0x74: {l: {0x3B: {c: [8834, 8402]}, 0x65: {l: {0x71: {l: {0x3B: {c: [8840]}, 0x71: {l: {0x3B: {c: [10949, 824]}}}}}}}}}}}}}}}, 0x63: {l: {0x63: {l: {0x3B: {c: [8833]}, 0x65: {l: {0x71: {l: {0x3B: {c: [10928, 824]}}}}}}}}}, 0x70: {l: {0x3B: {c: [8837]}, 0x45: {l: {0x3B: {c: [10950, 824]}}}, 0x65: {l: {0x3B: {c: [8841]}}}, 0x73: {l: {0x65: {l: {0x74: {l: {0x3B: {c: [8835, 8402]}, 0x65: {l: {0x71: {l: {0x3B: {c: [8841]}, 0x71: {l: {0x3B: {c: [10950, 824]}}}}}}}}}}}}}}}}}}}, 0x74: {l: {0x67: {l: {0x6C: {l: {0x3B: {c: [8825]}}}}}, 0x69: {l: {0x6C: {l: {0x64: {l: {0x65: {l: {0x3B: {c: [241]}}, c: [241]}}}}}}}, 0x6C: {l: {0x67: {l: {0x3B: {c: [8824]}}}}}, 0x72: {l: {0x69: {l: {0x61: {l: {0x6E: {l: {0x67: {l: {0x6C: {l: {0x65: {l: {0x6C: {l: {0x65: {l: {0x66: {l: {0x74: {l: {0x3B: {c: [8938]}, 0x65: {l: {0x71: {l: {0x3B: {c: [8940]}}}}}}}}}}}}}, 0x72: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x3B: {c: [8939]}, 0x65: {l: {0x71: {l: {0x3B: {c: [8941]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x75: {l: {0x3B: {c: [957]}, 0x6D: {l: {0x3B: {c: [35]}, 0x65: {l: {0x72: {l: {0x6F: {l: {0x3B: {c: [8470]}}}}}}}, 0x73: {l: {0x70: {l: {0x3B: {c: [8199]}}}}}}}}}, 0x76: {l: {0x61: {l: {0x70: {l: {0x3B: {c: [8781, 8402]}}}}}, 0x64: {l: {0x61: {l: {0x73: {l: {0x68: {l: {0x3B: {c: [8876]}}}}}}}}}, 0x44: {l: {0x61: {l: {0x73: {l: {0x68: {l: {0x3B: {c: [8877]}}}}}}}}}, 0x67: {l: {0x65: {l: {0x3B: {c: [8805, 8402]}}}, 0x74: {l: {0x3B: {c: [62, 8402]}}}}}, 0x48: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [10500]}}}}}}}}}, 0x69: {l: {0x6E: {l: {0x66: {l: {0x69: {l: {0x6E: {l: {0x3B: {c: [10718]}}}}}}}}}}}, 0x6C: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [10498]}}}}}}}, 0x65: {l: {0x3B: {c: [8804, 8402]}}}, 0x74: {l: {0x3B: {c: [60, 8402]}, 0x72: {l: {0x69: {l: {0x65: {l: {0x3B: {c: [8884, 8402]}}}}}}}}}}}, 0x72: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [10499]}}}}}}}, 0x74: {l: {0x72: {l: {0x69: {l: {0x65: {l: {0x3B: {c: [8885, 8402]}}}}}}}}}}}, 0x73: {l: {0x69: {l: {0x6D: {l: {0x3B: {c: [8764, 8402]}}}}}}}}}, 0x56: {l: {0x64: {l: {0x61: {l: {0x73: {l: {0x68: {l: {0x3B: {c: [8878]}}}}}}}}}, 0x44: {l: {0x61: {l: {0x73: {l: {0x68: {l: {0x3B: {c: [8879]}}}}}}}}}}}, 0x77: {l: {0x61: {l: {0x72: {l: {0x68: {l: {0x6B: {l: {0x3B: {c: [10531]}}}}}, 0x72: {l: {0x3B: {c: [8598]}, 0x6F: {l: {0x77: {l: {0x3B: {c: [8598]}}}}}}}}}}}, 0x41: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [8662]}}}}}}}, 0x6E: {l: {0x65: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10535]}}}}}}}}}}}}},
    0x4E: {l: {0x61: {l: {0x63: {l: {0x75: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [323]}}}}}}}}}}}, 0x63: {l: {0x61: {l: {0x72: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [327]}}}}}}}}}, 0x65: {l: {0x64: {l: {0x69: {l: {0x6C: {l: {0x3B: {c: [325]}}}}}}}}}, 0x79: {l: {0x3B: {c: [1053]}}}}}, 0x65: {l: {0x67: {l: {0x61: {l: {0x74: {l: {0x69: {l: {0x76: {l: {0x65: {l: {0x4D: {l: {0x65: {l: {0x64: {l: {0x69: {l: {0x75: {l: {0x6D: {l: {0x53: {l: {0x70: {l: {0x61: {l: {0x63: {l: {0x65: {l: {0x3B: {c: [8203]}}}}}}}}}}}}}}}}}}}}}}}, 0x54: {l: {0x68: {l: {0x69: {l: {0x63: {l: {0x6B: {l: {0x53: {l: {0x70: {l: {0x61: {l: {0x63: {l: {0x65: {l: {0x3B: {c: [8203]}}}}}}}}}}}}}}}, 0x6E: {l: {0x53: {l: {0x70: {l: {0x61: {l: {0x63: {l: {0x65: {l: {0x3B: {c: [8203]}}}}}}}}}}}}}}}}}}}, 0x56: {l: {0x65: {l: {0x72: {l: {0x79: {l: {0x54: {l: {0x68: {l: {0x69: {l: {0x6E: {l: {0x53: {l: {0x70: {l: {0x61: {l: {0x63: {l: {0x65: {l: {0x3B: {c: [8203]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x73: {l: {0x74: {l: {0x65: {l: {0x64: {l: {0x47: {l: {0x72: {l: {0x65: {l: {0x61: {l: {0x74: {l: {0x65: {l: {0x72: {l: {0x47: {l: {0x72: {l: {0x65: {l: {0x61: {l: {0x74: {l: {0x65: {l: {0x72: {l: {0x3B: {c: [8811]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x4C: {l: {0x65: {l: {0x73: {l: {0x73: {l: {0x4C: {l: {0x65: {l: {0x73: {l: {0x73: {l: {0x3B: {c: [8810]}}}}}}}}}}}}}}}}}}}}}}}}}, 0x77: {l: {0x4C: {l: {0x69: {l: {0x6E: {l: {0x65: {l: {0x3B: {c: [10]}}}}}}}}}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120081]}}}}}, 0x4A: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1034]}}}}}}}, 0x6F: {l: {0x42: {l: {0x72: {l: {0x65: {l: {0x61: {l: {0x6B: {l: {0x3B: {c: [8288]}}}}}}}}}}}, 0x6E: {l: {0x42: {l: {0x72: {l: {0x65: {l: {0x61: {l: {0x6B: {l: {0x69: {l: {0x6E: {l: {0x67: {l: {0x53: {l: {0x70: {l: {0x61: {l: {0x63: {l: {0x65: {l: {0x3B: {c: [160]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x70: {l: {0x66: {l: {0x3B: {c: [8469]}}}}}, 0x74: {l: {0x3B: {c: [10988]}, 0x43: {l: {0x6F: {l: {0x6E: {l: {0x67: {l: {0x72: {l: {0x75: {l: {0x65: {l: {0x6E: {l: {0x74: {l: {0x3B: {c: [8802]}}}}}}}}}}}}}}}}}, 0x75: {l: {0x70: {l: {0x43: {l: {0x61: {l: {0x70: {l: {0x3B: {c: [8813]}}}}}}}}}}}}}, 0x44: {l: {0x6F: {l: {0x75: {l: {0x62: {l: {0x6C: {l: {0x65: {l: {0x56: {l: {0x65: {l: {0x72: {l: {0x74: {l: {0x69: {l: {0x63: {l: {0x61: {l: {0x6C: {l: {0x42: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [8742]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x45: {l: {0x6C: {l: {0x65: {l: {0x6D: {l: {0x65: {l: {0x6E: {l: {0x74: {l: {0x3B: {c: [8713]}}}}}}}}}}}}}, 0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8800]}, 0x54: {l: {0x69: {l: {0x6C: {l: {0x64: {l: {0x65: {l: {0x3B: {c: [8770, 824]}}}}}}}}}}}}}}}}}}}, 0x78: {l: {0x69: {l: {0x73: {l: {0x74: {l: {0x73: {l: {0x3B: {c: [8708]}}}}}}}}}}}}}, 0x47: {l: {0x72: {l: {0x65: {l: {0x61: {l: {0x74: {l: {0x65: {l: {0x72: {l: {0x3B: {c: [8815]}, 0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8817]}}}}}}}}}}}, 0x46: {l: {0x75: {l: {0x6C: {l: {0x6C: {l: {0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8807, 824]}}}}}}}}}}}}}}}}}}}, 0x47: {l: {0x72: {l: {0x65: {l: {0x61: {l: {0x74: {l: {0x65: {l: {0x72: {l: {0x3B: {c: [8811, 824]}}}}}}}}}}}}}}}, 0x4C: {l: {0x65: {l: {0x73: {l: {0x73: {l: {0x3B: {c: [8825]}}}}}}}}}, 0x53: {l: {0x6C: {l: {0x61: {l: {0x6E: {l: {0x74: {l: {0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [10878, 824]}}}}}}}}}}}}}}}}}}}}}, 0x54: {l: {0x69: {l: {0x6C: {l: {0x64: {l: {0x65: {l: {0x3B: {c: [8821]}}}}}}}}}}}}}}}}}}}}}}}}}, 0x48: {l: {0x75: {l: {0x6D: {l: {0x70: {l: {0x44: {l: {0x6F: {l: {0x77: {l: {0x6E: {l: {0x48: {l: {0x75: {l: {0x6D: {l: {0x70: {l: {0x3B: {c: [8782, 824]}}}}}}}}}}}}}}}}}, 0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8783, 824]}}}}}}}}}}}}}}}}}}}, 0x4C: {l: {0x65: {l: {0x66: {l: {0x74: {l: {0x54: {l: {0x72: {l: {0x69: {l: {0x61: {l: {0x6E: {l: {0x67: {l: {0x6C: {l: {0x65: {l: {0x42: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10703, 824]}}}}}}}, 0x3B: {c: [8938]}, 0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8940]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x73: {l: {0x73: {l: {0x3B: {c: [8814]}, 0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8816]}}}}}}}}}}}, 0x47: {l: {0x72: {l: {0x65: {l: {0x61: {l: {0x74: {l: {0x65: {l: {0x72: {l: {0x3B: {c: [8824]}}}}}}}}}}}}}}}, 0x4C: {l: {0x65: {l: {0x73: {l: {0x73: {l: {0x3B: {c: [8810, 824]}}}}}}}}}, 0x53: {l: {0x6C: {l: {0x61: {l: {0x6E: {l: {0x74: {l: {0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [10877, 824]}}}}}}}}}}}}}}}}}}}}}, 0x54: {l: {0x69: {l: {0x6C: {l: {0x64: {l: {0x65: {l: {0x3B: {c: [8820]}}}}}}}}}}}}}}}}}}}, 0x4E: {l: {0x65: {l: {0x73: {l: {0x74: {l: {0x65: {l: {0x64: {l: {0x47: {l: {0x72: {l: {0x65: {l: {0x61: {l: {0x74: {l: {0x65: {l: {0x72: {l: {0x47: {l: {0x72: {l: {0x65: {l: {0x61: {l: {0x74: {l: {0x65: {l: {0x72: {l: {0x3B: {c: [10914, 824]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x4C: {l: {0x65: {l: {0x73: {l: {0x73: {l: {0x4C: {l: {0x65: {l: {0x73: {l: {0x73: {l: {0x3B: {c: [10913, 824]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x50: {l: {0x72: {l: {0x65: {l: {0x63: {l: {0x65: {l: {0x64: {l: {0x65: {l: {0x73: {l: {0x3B: {c: [8832]}, 0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [10927, 824]}}}}}}}}}}}, 0x53: {l: {0x6C: {l: {0x61: {l: {0x6E: {l: {0x74: {l: {0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8928]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x52: {l: {0x65: {l: {0x76: {l: {0x65: {l: {0x72: {l: {0x73: {l: {0x65: {l: {0x45: {l: {0x6C: {l: {0x65: {l: {0x6D: {l: {0x65: {l: {0x6E: {l: {0x74: {l: {0x3B: {c: [8716]}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x54: {l: {0x72: {l: {0x69: {l: {0x61: {l: {0x6E: {l: {0x67: {l: {0x6C: {l: {0x65: {l: {0x42: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10704, 824]}}}}}}}, 0x3B: {c: [8939]}, 0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8941]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x53: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x72: {l: {0x65: {l: {0x53: {l: {0x75: {l: {0x62: {l: {0x73: {l: {0x65: {l: {0x74: {l: {0x3B: {c: [8847, 824]}, 0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8930]}}}}}}}}}}}}}}}}}}}, 0x70: {l: {0x65: {l: {0x72: {l: {0x73: {l: {0x65: {l: {0x74: {l: {0x3B: {c: [8848, 824]}, 0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8931]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x75: {l: {0x62: {l: {0x73: {l: {0x65: {l: {0x74: {l: {0x3B: {c: [8834, 8402]}, 0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8840]}}}}}}}}}}}}}}}}}}}, 0x63: {l: {0x63: {l: {0x65: {l: {0x65: {l: {0x64: {l: {0x73: {l: {0x3B: {c: [8833]}, 0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [10928, 824]}}}}}}}}}}}, 0x53: {l: {0x6C: {l: {0x61: {l: {0x6E: {l: {0x74: {l: {0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8929]}}}}}}}}}}}}}}}}}}}}}, 0x54: {l: {0x69: {l: {0x6C: {l: {0x64: {l: {0x65: {l: {0x3B: {c: [8831, 824]}}}}}}}}}}}}}}}}}}}}}}}, 0x70: {l: {0x65: {l: {0x72: {l: {0x73: {l: {0x65: {l: {0x74: {l: {0x3B: {c: [8835, 8402]}, 0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8841]}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x54: {l: {0x69: {l: {0x6C: {l: {0x64: {l: {0x65: {l: {0x3B: {c: [8769]}, 0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8772]}}}}}}}}}}}, 0x46: {l: {0x75: {l: {0x6C: {l: {0x6C: {l: {0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8775]}}}}}}}}}}}}}}}}}}}, 0x54: {l: {0x69: {l: {0x6C: {l: {0x64: {l: {0x65: {l: {0x3B: {c: [8777]}}}}}}}}}}}}}}}}}}}}}, 0x56: {l: {0x65: {l: {0x72: {l: {0x74: {l: {0x69: {l: {0x63: {l: {0x61: {l: {0x6C: {l: {0x42: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [8740]}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [119977]}}}}}}}, 0x74: {l: {0x69: {l: {0x6C: {l: {0x64: {l: {0x65: {l: {0x3B: {c: [209]}}, c: [209]}}}}}}}}}, 0x75: {l: {0x3B: {c: [925]}}}}},
    0x4F: {l: {0x61: {l: {0x63: {l: {0x75: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [211]}}, c: [211]}}}}}}}}}, 0x63: {l: {0x69: {l: {0x72: {l: {0x63: {l: {0x3B: {c: [212]}}, c: [212]}}}}}, 0x79: {l: {0x3B: {c: [1054]}}}}}, 0x64: {l: {0x62: {l: {0x6C: {l: {0x61: {l: {0x63: {l: {0x3B: {c: [336]}}}}}}}}}}}, 0x45: {l: {0x6C: {l: {0x69: {l: {0x67: {l: {0x3B: {c: [338]}}}}}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120082]}}}}}, 0x67: {l: {0x72: {l: {0x61: {l: {0x76: {l: {0x65: {l: {0x3B: {c: [210]}}, c: [210]}}}}}}}}}, 0x6D: {l: {0x61: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [332]}}}}}}}, 0x65: {l: {0x67: {l: {0x61: {l: {0x3B: {c: [937]}}}}}}}, 0x69: {l: {0x63: {l: {0x72: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [927]}}}}}}}}}}}}}, 0x6F: {l: {0x70: {l: {0x66: {l: {0x3B: {c: [120134]}}}}}}}, 0x70: {l: {0x65: {l: {0x6E: {l: {0x43: {l: {0x75: {l: {0x72: {l: {0x6C: {l: {0x79: {l: {0x44: {l: {0x6F: {l: {0x75: {l: {0x62: {l: {0x6C: {l: {0x65: {l: {0x51: {l: {0x75: {l: {0x6F: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [8220]}}}}}}}}}}}}}}}}}}}}}}}, 0x51: {l: {0x75: {l: {0x6F: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [8216]}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x72: {l: {0x3B: {c: [10836]}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [119978]}}}}}, 0x6C: {l: {0x61: {l: {0x73: {l: {0x68: {l: {0x3B: {c: [216]}}, c: [216]}}}}}}}}}, 0x74: {l: {0x69: {l: {0x6C: {l: {0x64: {l: {0x65: {l: {0x3B: {c: [213]}}, c: [213]}}}}}, 0x6D: {l: {0x65: {l: {0x73: {l: {0x3B: {c: [10807]}}}}}}}}}}}, 0x75: {l: {0x6D: {l: {0x6C: {l: {0x3B: {c: [214]}}, c: [214]}}}}}, 0x76: {l: {0x65: {l: {0x72: {l: {0x42: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [8254]}}}}}, 0x72: {l: {0x61: {l: {0x63: {l: {0x65: {l: {0x3B: {c: [9182]}}}, 0x6B: {l: {0x65: {l: {0x74: {l: {0x3B: {c: [9140]}}}}}}}}}}}}}}}, 0x50: {l: {0x61: {l: {0x72: {l: {0x65: {l: {0x6E: {l: {0x74: {l: {0x68: {l: {0x65: {l: {0x73: {l: {0x69: {l: {0x73: {l: {0x3B: {c: [9180]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}},
    0x6F: {l: {0x61: {l: {0x63: {l: {0x75: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [243]}}, c: [243]}}}}}}}, 0x73: {l: {0x74: {l: {0x3B: {c: [8859]}}}}}}}, 0x63: {l: {0x69: {l: {0x72: {l: {0x63: {l: {0x3B: {c: [244]}}, c: [244]}, 0x3B: {c: [8858]}}}}}, 0x79: {l: {0x3B: {c: [1086]}}}}}, 0x64: {l: {0x61: {l: {0x73: {l: {0x68: {l: {0x3B: {c: [8861]}}}}}}}, 0x62: {l: {0x6C: {l: {0x61: {l: {0x63: {l: {0x3B: {c: [337]}}}}}}}}}, 0x69: {l: {0x76: {l: {0x3B: {c: [10808]}}}}}, 0x6F: {l: {0x74: {l: {0x3B: {c: [8857]}}}}}, 0x73: {l: {0x6F: {l: {0x6C: {l: {0x64: {l: {0x3B: {c: [10684]}}}}}}}}}}}, 0x65: {l: {0x6C: {l: {0x69: {l: {0x67: {l: {0x3B: {c: [339]}}}}}}}}}, 0x66: {l: {0x63: {l: {0x69: {l: {0x72: {l: {0x3B: {c: [10687]}}}}}}}, 0x72: {l: {0x3B: {c: [120108]}}}}}, 0x67: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [731]}}}}}, 0x72: {l: {0x61: {l: {0x76: {l: {0x65: {l: {0x3B: {c: [242]}}, c: [242]}}}}}}}, 0x74: {l: {0x3B: {c: [10689]}}}}}, 0x68: {l: {0x62: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10677]}}}}}}}, 0x6D: {l: {0x3B: {c: [937]}}}}}, 0x69: {l: {0x6E: {l: {0x74: {l: {0x3B: {c: [8750]}}}}}}}, 0x6C: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [8634]}}}}}}}, 0x63: {l: {0x69: {l: {0x72: {l: {0x3B: {c: [10686]}}}}}, 0x72: {l: {0x6F: {l: {0x73: {l: {0x73: {l: {0x3B: {c: [10683]}}}}}}}}}}}, 0x69: {l: {0x6E: {l: {0x65: {l: {0x3B: {c: [8254]}}}}}}}, 0x74: {l: {0x3B: {c: [10688]}}}}}, 0x6D: {l: {0x61: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [333]}}}}}}}, 0x65: {l: {0x67: {l: {0x61: {l: {0x3B: {c: [969]}}}}}}}, 0x69: {l: {0x63: {l: {0x72: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [959]}}}}}}}}}, 0x64: {l: {0x3B: {c: [10678]}}}, 0x6E: {l: {0x75: {l: {0x73: {l: {0x3B: {c: [8854]}}}}}}}}}}}, 0x6F: {l: {0x70: {l: {0x66: {l: {0x3B: {c: [120160]}}}}}}}, 0x70: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10679]}}}}}, 0x65: {l: {0x72: {l: {0x70: {l: {0x3B: {c: [10681]}}}}}}}, 0x6C: {l: {0x75: {l: {0x73: {l: {0x3B: {c: [8853]}}}}}}}}}, 0x72: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [8635]}}}}}}}, 0x3B: {c: [8744]}, 0x64: {l: {0x3B: {c: [10845]}, 0x65: {l: {0x72: {l: {0x3B: {c: [8500]}, 0x6F: {l: {0x66: {l: {0x3B: {c: [8500]}}}}}}}}}, 0x66: {l: {0x3B: {c: [170]}}, c: [170]}, 0x6D: {l: {0x3B: {c: [186]}}, c: [186]}}}, 0x69: {l: {0x67: {l: {0x6F: {l: {0x66: {l: {0x3B: {c: [8886]}}}}}}}}}, 0x6F: {l: {0x72: {l: {0x3B: {c: [10838]}}}}}, 0x73: {l: {0x6C: {l: {0x6F: {l: {0x70: {l: {0x65: {l: {0x3B: {c: [10839]}}}}}}}}}}}, 0x76: {l: {0x3B: {c: [10843]}}}}}, 0x53: {l: {0x3B: {c: [9416]}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [8500]}}}}}, 0x6C: {l: {0x61: {l: {0x73: {l: {0x68: {l: {0x3B: {c: [248]}}, c: [248]}}}}}}}, 0x6F: {l: {0x6C: {l: {0x3B: {c: [8856]}}}}}}}, 0x74: {l: {0x69: {l: {0x6C: {l: {0x64: {l: {0x65: {l: {0x3B: {c: [245]}}, c: [245]}}}}}, 0x6D: {l: {0x65: {l: {0x73: {l: {0x61: {l: {0x73: {l: {0x3B: {c: [10806]}}}}}, 0x3B: {c: [8855]}}}}}}}}}}}, 0x75: {l: {0x6D: {l: {0x6C: {l: {0x3B: {c: [246]}}, c: [246]}}}}}, 0x76: {l: {0x62: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [9021]}}}}}}}}}}},
    0x70: {l: {0x61: {l: {0x72: {l: {0x61: {l: {0x3B: {c: [182]}, 0x6C: {l: {0x6C: {l: {0x65: {l: {0x6C: {l: {0x3B: {c: [8741]}}}}}}}}}}, c: [182]}, 0x3B: {c: [8741]}, 0x73: {l: {0x69: {l: {0x6D: {l: {0x3B: {c: [10995]}}}}}, 0x6C: {l: {0x3B: {c: [11005]}}}}}, 0x74: {l: {0x3B: {c: [8706]}}}}}}}, 0x63: {l: {0x79: {l: {0x3B: {c: [1087]}}}}}, 0x65: {l: {0x72: {l: {0x63: {l: {0x6E: {l: {0x74: {l: {0x3B: {c: [37]}}}}}}}, 0x69: {l: {0x6F: {l: {0x64: {l: {0x3B: {c: [46]}}}}}}}, 0x6D: {l: {0x69: {l: {0x6C: {l: {0x3B: {c: [8240]}}}}}}}, 0x70: {l: {0x3B: {c: [8869]}}}, 0x74: {l: {0x65: {l: {0x6E: {l: {0x6B: {l: {0x3B: {c: [8241]}}}}}}}}}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120109]}}}}}, 0x68: {l: {0x69: {l: {0x3B: {c: [966]}, 0x76: {l: {0x3B: {c: [981]}}}}}, 0x6D: {l: {0x6D: {l: {0x61: {l: {0x74: {l: {0x3B: {c: [8499]}}}}}}}}}, 0x6F: {l: {0x6E: {l: {0x65: {l: {0x3B: {c: [9742]}}}}}}}}}, 0x69: {l: {0x3B: {c: [960]}, 0x74: {l: {0x63: {l: {0x68: {l: {0x66: {l: {0x6F: {l: {0x72: {l: {0x6B: {l: {0x3B: {c: [8916]}}}}}}}}}}}}}}}, 0x76: {l: {0x3B: {c: [982]}}}}}, 0x6C: {l: {0x61: {l: {0x6E: {l: {0x63: {l: {0x6B: {l: {0x3B: {c: [8463]}, 0x68: {l: {0x3B: {c: [8462]}}}}}}}, 0x6B: {l: {0x76: {l: {0x3B: {c: [8463]}}}}}}}}}, 0x75: {l: {0x73: {l: {0x61: {l: {0x63: {l: {0x69: {l: {0x72: {l: {0x3B: {c: [10787]}}}}}}}}}, 0x62: {l: {0x3B: {c: [8862]}}}, 0x63: {l: {0x69: {l: {0x72: {l: {0x3B: {c: [10786]}}}}}}}, 0x3B: {c: [43]}, 0x64: {l: {0x6F: {l: {0x3B: {c: [8724]}}}, 0x75: {l: {0x3B: {c: [10789]}}}}}, 0x65: {l: {0x3B: {c: [10866]}}}, 0x6D: {l: {0x6E: {l: {0x3B: {c: [177]}}, c: [177]}}}, 0x73: {l: {0x69: {l: {0x6D: {l: {0x3B: {c: [10790]}}}}}}}, 0x74: {l: {0x77: {l: {0x6F: {l: {0x3B: {c: [10791]}}}}}}}}}}}}}, 0x6D: {l: {0x3B: {c: [177]}}}, 0x6F: {l: {0x69: {l: {0x6E: {l: {0x74: {l: {0x69: {l: {0x6E: {l: {0x74: {l: {0x3B: {c: [10773]}}}}}}}}}}}}}, 0x70: {l: {0x66: {l: {0x3B: {c: [120161]}}}}}, 0x75: {l: {0x6E: {l: {0x64: {l: {0x3B: {c: [163]}}, c: [163]}}}}}}}, 0x72: {l: {0x61: {l: {0x70: {l: {0x3B: {c: [10935]}}}}}, 0x3B: {c: [8826]}, 0x63: {l: {0x75: {l: {0x65: {l: {0x3B: {c: [8828]}}}}}}}, 0x65: {l: {0x63: {l: {0x61: {l: {0x70: {l: {0x70: {l: {0x72: {l: {0x6F: {l: {0x78: {l: {0x3B: {c: [10935]}}}}}}}}}}}}}, 0x3B: {c: [8826]}, 0x63: {l: {0x75: {l: {0x72: {l: {0x6C: {l: {0x79: {l: {0x65: {l: {0x71: {l: {0x3B: {c: [8828]}}}}}}}}}}}}}}}, 0x65: {l: {0x71: {l: {0x3B: {c: [10927]}}}}}, 0x6E: {l: {0x61: {l: {0x70: {l: {0x70: {l: {0x72: {l: {0x6F: {l: {0x78: {l: {0x3B: {c: [10937]}}}}}}}}}}}}}, 0x65: {l: {0x71: {l: {0x71: {l: {0x3B: {c: [10933]}}}}}}}, 0x73: {l: {0x69: {l: {0x6D: {l: {0x3B: {c: [8936]}}}}}}}}}, 0x73: {l: {0x69: {l: {0x6D: {l: {0x3B: {c: [8830]}}}}}}}}}, 0x3B: {c: [10927]}}}, 0x45: {l: {0x3B: {c: [10931]}}}, 0x69: {l: {0x6D: {l: {0x65: {l: {0x3B: {c: [8242]}, 0x73: {l: {0x3B: {c: [8473]}}}}}}}}}, 0x6E: {l: {0x61: {l: {0x70: {l: {0x3B: {c: [10937]}}}}}, 0x45: {l: {0x3B: {c: [10933]}}}, 0x73: {l: {0x69: {l: {0x6D: {l: {0x3B: {c: [8936]}}}}}}}}}, 0x6F: {l: {0x64: {l: {0x3B: {c: [8719]}}}, 0x66: {l: {0x61: {l: {0x6C: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [9006]}}}}}}}}}, 0x6C: {l: {0x69: {l: {0x6E: {l: {0x65: {l: {0x3B: {c: [8978]}}}}}}}}}, 0x73: {l: {0x75: {l: {0x72: {l: {0x66: {l: {0x3B: {c: [8979]}}}}}}}}}}}, 0x70: {l: {0x3B: {c: [8733]}, 0x74: {l: {0x6F: {l: {0x3B: {c: [8733]}}}}}}}}}, 0x73: {l: {0x69: {l: {0x6D: {l: {0x3B: {c: [8830]}}}}}}}, 0x75: {l: {0x72: {l: {0x65: {l: {0x6C: {l: {0x3B: {c: [8880]}}}}}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [120005]}}}}}, 0x69: {l: {0x3B: {c: [968]}}}}}, 0x75: {l: {0x6E: {l: {0x63: {l: {0x73: {l: {0x70: {l: {0x3B: {c: [8200]}}}}}}}}}}}}},
    0x50: {l: {0x61: {l: {0x72: {l: {0x74: {l: {0x69: {l: {0x61: {l: {0x6C: {l: {0x44: {l: {0x3B: {c: [8706]}}}}}}}}}}}}}}}, 0x63: {l: {0x79: {l: {0x3B: {c: [1055]}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120083]}}}}}, 0x68: {l: {0x69: {l: {0x3B: {c: [934]}}}}}, 0x69: {l: {0x3B: {c: [928]}}}, 0x6C: {l: {0x75: {l: {0x73: {l: {0x4D: {l: {0x69: {l: {0x6E: {l: {0x75: {l: {0x73: {l: {0x3B: {c: [177]}}}}}}}}}}}}}}}}}, 0x6F: {l: {0x69: {l: {0x6E: {l: {0x63: {l: {0x61: {l: {0x72: {l: {0x65: {l: {0x70: {l: {0x6C: {l: {0x61: {l: {0x6E: {l: {0x65: {l: {0x3B: {c: [8460]}}}}}}}}}}}}}}}}}}}}}}}, 0x70: {l: {0x66: {l: {0x3B: {c: [8473]}}}}}}}, 0x72: {l: {0x3B: {c: [10939]}, 0x65: {l: {0x63: {l: {0x65: {l: {0x64: {l: {0x65: {l: {0x73: {l: {0x3B: {c: [8826]}, 0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [10927]}}}}}}}}}}}, 0x53: {l: {0x6C: {l: {0x61: {l: {0x6E: {l: {0x74: {l: {0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8828]}}}}}}}}}}}}}}}}}}}}}, 0x54: {l: {0x69: {l: {0x6C: {l: {0x64: {l: {0x65: {l: {0x3B: {c: [8830]}}}}}}}}}}}}}}}}}}}}}}}, 0x69: {l: {0x6D: {l: {0x65: {l: {0x3B: {c: [8243]}}}}}}}, 0x6F: {l: {0x64: {l: {0x75: {l: {0x63: {l: {0x74: {l: {0x3B: {c: [8719]}}}}}}}}}, 0x70: {l: {0x6F: {l: {0x72: {l: {0x74: {l: {0x69: {l: {0x6F: {l: {0x6E: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8733]}}}}}, 0x3B: {c: [8759]}}}}}}}}}}}}}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [119979]}}}}}, 0x69: {l: {0x3B: {c: [936]}}}}}}},
    0x51: {l: {0x66: {l: {0x72: {l: {0x3B: {c: [120084]}}}}}, 0x6F: {l: {0x70: {l: {0x66: {l: {0x3B: {c: [8474]}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [119980]}}}}}}}, 0x55: {l: {0x4F: {l: {0x54: {l: {0x3B: {c: [34]}}, c: [34]}}}}}}},
    0x71: {l: {0x66: {l: {0x72: {l: {0x3B: {c: [120110]}}}}}, 0x69: {l: {0x6E: {l: {0x74: {l: {0x3B: {c: [10764]}}}}}}}, 0x6F: {l: {0x70: {l: {0x66: {l: {0x3B: {c: [120162]}}}}}}}, 0x70: {l: {0x72: {l: {0x69: {l: {0x6D: {l: {0x65: {l: {0x3B: {c: [8279]}}}}}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [120006]}}}}}}}, 0x75: {l: {0x61: {l: {0x74: {l: {0x65: {l: {0x72: {l: {0x6E: {l: {0x69: {l: {0x6F: {l: {0x6E: {l: {0x73: {l: {0x3B: {c: [8461]}}}}}}}}}}}}}}}, 0x69: {l: {0x6E: {l: {0x74: {l: {0x3B: {c: [10774]}}}}}}}}}}}, 0x65: {l: {0x73: {l: {0x74: {l: {0x3B: {c: [63]}, 0x65: {l: {0x71: {l: {0x3B: {c: [8799]}}}}}}}}}}}, 0x6F: {l: {0x74: {l: {0x3B: {c: [34]}}, c: [34]}}}}}}},
    0x72: {l: {0x41: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [8667]}}}}}}}, 0x72: {l: {0x72: {l: {0x3B: {c: [8658]}}}}}, 0x74: {l: {0x61: {l: {0x69: {l: {0x6C: {l: {0x3B: {c: [10524]}}}}}}}}}}}, 0x61: {l: {0x63: {l: {0x65: {l: {0x3B: {c: [8765, 817]}}}, 0x75: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [341]}}}}}}}}}, 0x64: {l: {0x69: {l: {0x63: {l: {0x3B: {c: [8730]}}}}}}}, 0x65: {l: {0x6D: {l: {0x70: {l: {0x74: {l: {0x79: {l: {0x76: {l: {0x3B: {c: [10675]}}}}}}}}}}}}}, 0x6E: {l: {0x67: {l: {0x3B: {c: [10217]}, 0x64: {l: {0x3B: {c: [10642]}}}, 0x65: {l: {0x3B: {c: [10661]}}}, 0x6C: {l: {0x65: {l: {0x3B: {c: [10217]}}}}}}}}}, 0x71: {l: {0x75: {l: {0x6F: {l: {0x3B: {c: [187]}}, c: [187]}}}}}, 0x72: {l: {0x72: {l: {0x61: {l: {0x70: {l: {0x3B: {c: [10613]}}}}}, 0x62: {l: {0x3B: {c: [8677]}, 0x66: {l: {0x73: {l: {0x3B: {c: [10528]}}}}}}}, 0x63: {l: {0x3B: {c: [10547]}}}, 0x3B: {c: [8594]}, 0x66: {l: {0x73: {l: {0x3B: {c: [10526]}}}}}, 0x68: {l: {0x6B: {l: {0x3B: {c: [8618]}}}}}, 0x6C: {l: {0x70: {l: {0x3B: {c: [8620]}}}}}, 0x70: {l: {0x6C: {l: {0x3B: {c: [10565]}}}}}, 0x73: {l: {0x69: {l: {0x6D: {l: {0x3B: {c: [10612]}}}}}}}, 0x74: {l: {0x6C: {l: {0x3B: {c: [8611]}}}}}, 0x77: {l: {0x3B: {c: [8605]}}}}}}}, 0x74: {l: {0x61: {l: {0x69: {l: {0x6C: {l: {0x3B: {c: [10522]}}}}}}}, 0x69: {l: {0x6F: {l: {0x3B: {c: [8758]}, 0x6E: {l: {0x61: {l: {0x6C: {l: {0x73: {l: {0x3B: {c: [8474]}}}}}}}}}}}}}}}}}, 0x62: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [10509]}}}}}}}, 0x62: {l: {0x72: {l: {0x6B: {l: {0x3B: {c: [10099]}}}}}}}, 0x72: {l: {0x61: {l: {0x63: {l: {0x65: {l: {0x3B: {c: [125]}}}, 0x6B: {l: {0x3B: {c: [93]}}}}}}}, 0x6B: {l: {0x65: {l: {0x3B: {c: [10636]}}}, 0x73: {l: {0x6C: {l: {0x64: {l: {0x3B: {c: [10638]}}}, 0x75: {l: {0x3B: {c: [10640]}}}}}}}}}}}}}, 0x42: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [10511]}}}}}}}}}, 0x63: {l: {0x61: {l: {0x72: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [345]}}}}}}}}}, 0x65: {l: {0x64: {l: {0x69: {l: {0x6C: {l: {0x3B: {c: [343]}}}}}}}, 0x69: {l: {0x6C: {l: {0x3B: {c: [8969]}}}}}}}, 0x75: {l: {0x62: {l: {0x3B: {c: [125]}}}}}, 0x79: {l: {0x3B: {c: [1088]}}}}}, 0x64: {l: {0x63: {l: {0x61: {l: {0x3B: {c: [10551]}}}}}, 0x6C: {l: {0x64: {l: {0x68: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10601]}}}}}}}}}}}, 0x71: {l: {0x75: {l: {0x6F: {l: {0x3B: {c: [8221]}, 0x72: {l: {0x3B: {c: [8221]}}}}}}}}}, 0x73: {l: {0x68: {l: {0x3B: {c: [8627]}}}}}}}, 0x65: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8476]}, 0x69: {l: {0x6E: {l: {0x65: {l: {0x3B: {c: [8475]}}}}}}}, 0x70: {l: {0x61: {l: {0x72: {l: {0x74: {l: {0x3B: {c: [8476]}}}}}}}}}, 0x73: {l: {0x3B: {c: [8477]}}}}}}}, 0x63: {l: {0x74: {l: {0x3B: {c: [9645]}}}}}, 0x67: {l: {0x3B: {c: [174]}}, c: [174]}}}, 0x66: {l: {0x69: {l: {0x73: {l: {0x68: {l: {0x74: {l: {0x3B: {c: [10621]}}}}}}}}}, 0x6C: {l: {0x6F: {l: {0x6F: {l: {0x72: {l: {0x3B: {c: [8971]}}}}}}}}}, 0x72: {l: {0x3B: {c: [120111]}}}}}, 0x48: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10596]}}}}}}}, 0x68: {l: {0x61: {l: {0x72: {l: {0x64: {l: {0x3B: {c: [8641]}}}, 0x75: {l: {0x3B: {c: [8640]}, 0x6C: {l: {0x3B: {c: [10604]}}}}}}}}}, 0x6F: {l: {0x3B: {c: [961]}, 0x76: {l: {0x3B: {c: [1009]}}}}}}}, 0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8594]}, 0x74: {l: {0x61: {l: {0x69: {l: {0x6C: {l: {0x3B: {c: [8611]}}}}}}}}}}}}}}}}}}}, 0x68: {l: {0x61: {l: {0x72: {l: {0x70: {l: {0x6F: {l: {0x6F: {l: {0x6E: {l: {0x64: {l: {0x6F: {l: {0x77: {l: {0x6E: {l: {0x3B: {c: [8641]}}}}}}}}}, 0x75: {l: {0x70: {l: {0x3B: {c: [8640]}}}}}}}}}}}}}}}}}}}, 0x6C: {l: {0x65: {l: {0x66: {l: {0x74: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x73: {l: {0x3B: {c: [8644]}}}}}}}}}}}}}, 0x68: {l: {0x61: {l: {0x72: {l: {0x70: {l: {0x6F: {l: {0x6F: {l: {0x6E: {l: {0x73: {l: {0x3B: {c: [8652]}}}}}}}}}}}}}}}}}}}}}}}}}, 0x72: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x73: {l: {0x3B: {c: [8649]}}}}}}}}}}}}}}}}}}}}}}}, 0x73: {l: {0x71: {l: {0x75: {l: {0x69: {l: {0x67: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8605]}}}}}}}}}}}}}}}}}}}}}, 0x74: {l: {0x68: {l: {0x72: {l: {0x65: {l: {0x65: {l: {0x74: {l: {0x69: {l: {0x6D: {l: {0x65: {l: {0x73: {l: {0x3B: {c: [8908]}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x6E: {l: {0x67: {l: {0x3B: {c: [730]}}}}}, 0x73: {l: {0x69: {l: {0x6E: {l: {0x67: {l: {0x64: {l: {0x6F: {l: {0x74: {l: {0x73: {l: {0x65: {l: {0x71: {l: {0x3B: {c: [8787]}}}}}}}}}}}}}}}}}}}}}}}, 0x6C: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [8644]}}}}}}}, 0x68: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [8652]}}}}}}}, 0x6D: {l: {0x3B: {c: [8207]}}}}}, 0x6D: {l: {0x6F: {l: {0x75: {l: {0x73: {l: {0x74: {l: {0x61: {l: {0x63: {l: {0x68: {l: {0x65: {l: {0x3B: {c: [9137]}}}}}}}}}, 0x3B: {c: [9137]}}}}}}}}}}}, 0x6E: {l: {0x6D: {l: {0x69: {l: {0x64: {l: {0x3B: {c: [10990]}}}}}}}}}, 0x6F: {l: {0x61: {l: {0x6E: {l: {0x67: {l: {0x3B: {c: [10221]}}}}}, 0x72: {l: {0x72: {l: {0x3B: {c: [8702]}}}}}}}, 0x62: {l: {0x72: {l: {0x6B: {l: {0x3B: {c: [10215]}}}}}}}, 0x70: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10630]}}}}}, 0x66: {l: {0x3B: {c: [120163]}}}, 0x6C: {l: {0x75: {l: {0x73: {l: {0x3B: {c: [10798]}}}}}}}}}, 0x74: {l: {0x69: {l: {0x6D: {l: {0x65: {l: {0x73: {l: {0x3B: {c: [10805]}}}}}}}}}}}}}, 0x70: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [41]}, 0x67: {l: {0x74: {l: {0x3B: {c: [10644]}}}}}}}}}, 0x70: {l: {0x6F: {l: {0x6C: {l: {0x69: {l: {0x6E: {l: {0x74: {l: {0x3B: {c: [10770]}}}}}}}}}}}}}}}, 0x72: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [8649]}}}}}}}}}, 0x73: {l: {0x61: {l: {0x71: {l: {0x75: {l: {0x6F: {l: {0x3B: {c: [8250]}}}}}}}}}, 0x63: {l: {0x72: {l: {0x3B: {c: [120007]}}}}}, 0x68: {l: {0x3B: {c: [8625]}}}, 0x71: {l: {0x62: {l: {0x3B: {c: [93]}}}, 0x75: {l: {0x6F: {l: {0x3B: {c: [8217]}, 0x72: {l: {0x3B: {c: [8217]}}}}}}}}}}}, 0x74: {l: {0x68: {l: {0x72: {l: {0x65: {l: {0x65: {l: {0x3B: {c: [8908]}}}}}}}}}, 0x69: {l: {0x6D: {l: {0x65: {l: {0x73: {l: {0x3B: {c: [8906]}}}}}}}}}, 0x72: {l: {0x69: {l: {0x3B: {c: [9657]}, 0x65: {l: {0x3B: {c: [8885]}}}, 0x66: {l: {0x3B: {c: [9656]}}}, 0x6C: {l: {0x74: {l: {0x72: {l: {0x69: {l: {0x3B: {c: [10702]}}}}}}}}}}}}}}}, 0x75: {l: {0x6C: {l: {0x75: {l: {0x68: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10600]}}}}}}}}}}}}}, 0x78: {l: {0x3B: {c: [8478]}}}}},
    0x52: {l: {0x61: {l: {0x63: {l: {0x75: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [340]}}}}}}}}}, 0x6E: {l: {0x67: {l: {0x3B: {c: [10219]}}}}}, 0x72: {l: {0x72: {l: {0x3B: {c: [8608]}, 0x74: {l: {0x6C: {l: {0x3B: {c: [10518]}}}}}}}}}}}, 0x42: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [10512]}}}}}}}}}, 0x63: {l: {0x61: {l: {0x72: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [344]}}}}}}}}}, 0x65: {l: {0x64: {l: {0x69: {l: {0x6C: {l: {0x3B: {c: [342]}}}}}}}}}, 0x79: {l: {0x3B: {c: [1056]}}}}}, 0x65: {l: {0x3B: {c: [8476]}, 0x76: {l: {0x65: {l: {0x72: {l: {0x73: {l: {0x65: {l: {0x45: {l: {0x6C: {l: {0x65: {l: {0x6D: {l: {0x65: {l: {0x6E: {l: {0x74: {l: {0x3B: {c: [8715]}}}}}}}}}}}}}, 0x71: {l: {0x75: {l: {0x69: {l: {0x6C: {l: {0x69: {l: {0x62: {l: {0x72: {l: {0x69: {l: {0x75: {l: {0x6D: {l: {0x3B: {c: [8651]}}}}}}}}}}}}}}}}}}}}}}}, 0x55: {l: {0x70: {l: {0x45: {l: {0x71: {l: {0x75: {l: {0x69: {l: {0x6C: {l: {0x69: {l: {0x62: {l: {0x72: {l: {0x69: {l: {0x75: {l: {0x6D: {l: {0x3B: {c: [10607]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x45: {l: {0x47: {l: {0x3B: {c: [174]}}, c: [174]}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [8476]}}}}}, 0x68: {l: {0x6F: {l: {0x3B: {c: [929]}}}}}, 0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x41: {l: {0x6E: {l: {0x67: {l: {0x6C: {l: {0x65: {l: {0x42: {l: {0x72: {l: {0x61: {l: {0x63: {l: {0x6B: {l: {0x65: {l: {0x74: {l: {0x3B: {c: [10217]}}}}}}}}}}}}}}}}}}}}}}}, 0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x42: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [8677]}}}}}}}, 0x3B: {c: [8594]}, 0x4C: {l: {0x65: {l: {0x66: {l: {0x74: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8644]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8658]}}}}}}}}}}}, 0x43: {l: {0x65: {l: {0x69: {l: {0x6C: {l: {0x69: {l: {0x6E: {l: {0x67: {l: {0x3B: {c: [8969]}}}}}}}}}}}}}}}, 0x44: {l: {0x6F: {l: {0x75: {l: {0x62: {l: {0x6C: {l: {0x65: {l: {0x42: {l: {0x72: {l: {0x61: {l: {0x63: {l: {0x6B: {l: {0x65: {l: {0x74: {l: {0x3B: {c: [10215]}}}}}}}}}}}}}}}}}}}}}}}, 0x77: {l: {0x6E: {l: {0x54: {l: {0x65: {l: {0x65: {l: {0x56: {l: {0x65: {l: {0x63: {l: {0x74: {l: {0x6F: {l: {0x72: {l: {0x3B: {c: [10589]}}}}}}}}}}}}}}}}}}}, 0x56: {l: {0x65: {l: {0x63: {l: {0x74: {l: {0x6F: {l: {0x72: {l: {0x42: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10581]}}}}}}}, 0x3B: {c: [8642]}}}}}}}}}}}}}}}}}}}}}, 0x46: {l: {0x6C: {l: {0x6F: {l: {0x6F: {l: {0x72: {l: {0x3B: {c: [8971]}}}}}}}}}}}, 0x54: {l: {0x65: {l: {0x65: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8614]}}}}}}}}}}}, 0x3B: {c: [8866]}, 0x56: {l: {0x65: {l: {0x63: {l: {0x74: {l: {0x6F: {l: {0x72: {l: {0x3B: {c: [10587]}}}}}}}}}}}}}}}}}, 0x72: {l: {0x69: {l: {0x61: {l: {0x6E: {l: {0x67: {l: {0x6C: {l: {0x65: {l: {0x42: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10704]}}}}}}}, 0x3B: {c: [8883]}, 0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8885]}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x55: {l: {0x70: {l: {0x44: {l: {0x6F: {l: {0x77: {l: {0x6E: {l: {0x56: {l: {0x65: {l: {0x63: {l: {0x74: {l: {0x6F: {l: {0x72: {l: {0x3B: {c: [10575]}}}}}}}}}}}}}}}}}}}}}, 0x54: {l: {0x65: {l: {0x65: {l: {0x56: {l: {0x65: {l: {0x63: {l: {0x74: {l: {0x6F: {l: {0x72: {l: {0x3B: {c: [10588]}}}}}}}}}}}}}}}}}}}, 0x56: {l: {0x65: {l: {0x63: {l: {0x74: {l: {0x6F: {l: {0x72: {l: {0x42: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10580]}}}}}}}, 0x3B: {c: [8638]}}}}}}}}}}}}}}}}}, 0x56: {l: {0x65: {l: {0x63: {l: {0x74: {l: {0x6F: {l: {0x72: {l: {0x42: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10579]}}}}}}}, 0x3B: {c: [8640]}}}}}}}}}}}}}}}}}}}}}, 0x6F: {l: {0x70: {l: {0x66: {l: {0x3B: {c: [8477]}}}}}, 0x75: {l: {0x6E: {l: {0x64: {l: {0x49: {l: {0x6D: {l: {0x70: {l: {0x6C: {l: {0x69: {l: {0x65: {l: {0x73: {l: {0x3B: {c: [10608]}}}}}}}}}}}}}}}}}}}}}}}, 0x72: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8667]}}}}}}}}}}}}}}}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [8475]}}}}}, 0x68: {l: {0x3B: {c: [8625]}}}}}, 0x75: {l: {0x6C: {l: {0x65: {l: {0x44: {l: {0x65: {l: {0x6C: {l: {0x61: {l: {0x79: {l: {0x65: {l: {0x64: {l: {0x3B: {c: [10740]}}}}}}}}}}}}}}}}}}}}}}},
    0x53: {l: {0x61: {l: {0x63: {l: {0x75: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [346]}}}}}}}}}}}, 0x63: {l: {0x61: {l: {0x72: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [352]}}}}}}}}}, 0x3B: {c: [10940]}, 0x65: {l: {0x64: {l: {0x69: {l: {0x6C: {l: {0x3B: {c: [350]}}}}}}}}}, 0x69: {l: {0x72: {l: {0x63: {l: {0x3B: {c: [348]}}}}}}}, 0x79: {l: {0x3B: {c: [1057]}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120086]}}}}}, 0x48: {l: {0x43: {l: {0x48: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1065]}}}}}}}}}, 0x63: {l: {0x79: {l: {0x3B: {c: [1064]}}}}}}}, 0x68: {l: {0x6F: {l: {0x72: {l: {0x74: {l: {0x44: {l: {0x6F: {l: {0x77: {l: {0x6E: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8595]}}}}}}}}}}}}}}}}}}}, 0x4C: {l: {0x65: {l: {0x66: {l: {0x74: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8592]}}}}}}}}}}}}}}}}}}}, 0x52: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8594]}}}}}}}}}}}}}}}}}}}}}, 0x55: {l: {0x70: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8593]}}}}}}}}}}}}}}}}}}}}}}}, 0x69: {l: {0x67: {l: {0x6D: {l: {0x61: {l: {0x3B: {c: [931]}}}}}}}}}, 0x6D: {l: {0x61: {l: {0x6C: {l: {0x6C: {l: {0x43: {l: {0x69: {l: {0x72: {l: {0x63: {l: {0x6C: {l: {0x65: {l: {0x3B: {c: [8728]}}}}}}}}}}}}}}}}}}}}}, 0x4F: {l: {0x46: {l: {0x54: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1068]}}}}}}}}}}}, 0x6F: {l: {0x70: {l: {0x66: {l: {0x3B: {c: [120138]}}}}}}}, 0x71: {l: {0x72: {l: {0x74: {l: {0x3B: {c: [8730]}}}}}, 0x75: {l: {0x61: {l: {0x72: {l: {0x65: {l: {0x3B: {c: [9633]}, 0x49: {l: {0x6E: {l: {0x74: {l: {0x65: {l: {0x72: {l: {0x73: {l: {0x65: {l: {0x63: {l: {0x74: {l: {0x69: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [8851]}}}}}}}}}}}}}}}}}}}}}}}}}, 0x53: {l: {0x75: {l: {0x62: {l: {0x73: {l: {0x65: {l: {0x74: {l: {0x3B: {c: [8847]}, 0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8849]}}}}}}}}}}}}}}}}}}}, 0x70: {l: {0x65: {l: {0x72: {l: {0x73: {l: {0x65: {l: {0x74: {l: {0x3B: {c: [8848]}, 0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8850]}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x55: {l: {0x6E: {l: {0x69: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [8852]}}}}}}}}}}}}}}}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [119982]}}}}}}}, 0x74: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [8902]}}}}}}}, 0x75: {l: {0x62: {l: {0x3B: {c: [8912]}, 0x73: {l: {0x65: {l: {0x74: {l: {0x3B: {c: [8912]}, 0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8838]}}}}}}}}}}}}}}}}}}}, 0x63: {l: {0x63: {l: {0x65: {l: {0x65: {l: {0x64: {l: {0x73: {l: {0x3B: {c: [8827]}, 0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [10928]}}}}}}}}}}}, 0x53: {l: {0x6C: {l: {0x61: {l: {0x6E: {l: {0x74: {l: {0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8829]}}}}}}}}}}}}}}}}}}}}}, 0x54: {l: {0x69: {l: {0x6C: {l: {0x64: {l: {0x65: {l: {0x3B: {c: [8831]}}}}}}}}}}}}}}}}}}}}}, 0x68: {l: {0x54: {l: {0x68: {l: {0x61: {l: {0x74: {l: {0x3B: {c: [8715]}}}}}}}}}}}}}, 0x6D: {l: {0x3B: {c: [8721]}}}, 0x70: {l: {0x3B: {c: [8913]}, 0x65: {l: {0x72: {l: {0x73: {l: {0x65: {l: {0x74: {l: {0x3B: {c: [8835]}, 0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8839]}}}}}}}}}}}}}}}}}}}}}, 0x73: {l: {0x65: {l: {0x74: {l: {0x3B: {c: [8913]}}}}}}}}}}}}},
    0x73: {l: {0x61: {l: {0x63: {l: {0x75: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [347]}}}}}}}}}}}, 0x62: {l: {0x71: {l: {0x75: {l: {0x6F: {l: {0x3B: {c: [8218]}}}}}}}}}, 0x63: {l: {0x61: {l: {0x70: {l: {0x3B: {c: [10936]}}}, 0x72: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [353]}}}}}}}}}, 0x3B: {c: [8827]}, 0x63: {l: {0x75: {l: {0x65: {l: {0x3B: {c: [8829]}}}}}}}, 0x65: {l: {0x3B: {c: [10928]}, 0x64: {l: {0x69: {l: {0x6C: {l: {0x3B: {c: [351]}}}}}}}}}, 0x45: {l: {0x3B: {c: [10932]}}}, 0x69: {l: {0x72: {l: {0x63: {l: {0x3B: {c: [349]}}}}}}}, 0x6E: {l: {0x61: {l: {0x70: {l: {0x3B: {c: [10938]}}}}}, 0x45: {l: {0x3B: {c: [10934]}}}, 0x73: {l: {0x69: {l: {0x6D: {l: {0x3B: {c: [8937]}}}}}}}}}, 0x70: {l: {0x6F: {l: {0x6C: {l: {0x69: {l: {0x6E: {l: {0x74: {l: {0x3B: {c: [10771]}}}}}}}}}}}}}, 0x73: {l: {0x69: {l: {0x6D: {l: {0x3B: {c: [8831]}}}}}}}, 0x79: {l: {0x3B: {c: [1089]}}}}}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x62: {l: {0x3B: {c: [8865]}}}, 0x3B: {c: [8901]}, 0x65: {l: {0x3B: {c: [10854]}}}}}}}}}, 0x65: {l: {0x61: {l: {0x72: {l: {0x68: {l: {0x6B: {l: {0x3B: {c: [10533]}}}}}, 0x72: {l: {0x3B: {c: [8600]}, 0x6F: {l: {0x77: {l: {0x3B: {c: [8600]}}}}}}}}}}}, 0x41: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [8664]}}}}}}}, 0x63: {l: {0x74: {l: {0x3B: {c: [167]}}, c: [167]}}}, 0x6D: {l: {0x69: {l: {0x3B: {c: [59]}}}}}, 0x73: {l: {0x77: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10537]}}}}}}}}}, 0x74: {l: {0x6D: {l: {0x69: {l: {0x6E: {l: {0x75: {l: {0x73: {l: {0x3B: {c: [8726]}}}}}}}}}, 0x6E: {l: {0x3B: {c: [8726]}}}}}}}, 0x78: {l: {0x74: {l: {0x3B: {c: [10038]}}}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120112]}, 0x6F: {l: {0x77: {l: {0x6E: {l: {0x3B: {c: [8994]}}}}}}}}}}}, 0x68: {l: {0x61: {l: {0x72: {l: {0x70: {l: {0x3B: {c: [9839]}}}}}}}, 0x63: {l: {0x68: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1097]}}}}}}}, 0x79: {l: {0x3B: {c: [1096]}}}}}, 0x6F: {l: {0x72: {l: {0x74: {l: {0x6D: {l: {0x69: {l: {0x64: {l: {0x3B: {c: [8739]}}}}}}}, 0x70: {l: {0x61: {l: {0x72: {l: {0x61: {l: {0x6C: {l: {0x6C: {l: {0x65: {l: {0x6C: {l: {0x3B: {c: [8741]}}}}}}}}}}}}}}}}}}}}}}}, 0x79: {l: {0x3B: {c: [173]}}, c: [173]}}}, 0x69: {l: {0x67: {l: {0x6D: {l: {0x61: {l: {0x3B: {c: [963]}, 0x66: {l: {0x3B: {c: [962]}}}, 0x76: {l: {0x3B: {c: [962]}}}}}}}}}, 0x6D: {l: {0x3B: {c: [8764]}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [10858]}}}}}}}, 0x65: {l: {0x3B: {c: [8771]}, 0x71: {l: {0x3B: {c: [8771]}}}}}, 0x67: {l: {0x3B: {c: [10910]}, 0x45: {l: {0x3B: {c: [10912]}}}}}, 0x6C: {l: {0x3B: {c: [10909]}, 0x45: {l: {0x3B: {c: [10911]}}}}}, 0x6E: {l: {0x65: {l: {0x3B: {c: [8774]}}}}}, 0x70: {l: {0x6C: {l: {0x75: {l: {0x73: {l: {0x3B: {c: [10788]}}}}}}}}}, 0x72: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [10610]}}}}}}}}}}}}}, 0x6C: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [8592]}}}}}}}}}, 0x6D: {l: {0x61: {l: {0x6C: {l: {0x6C: {l: {0x73: {l: {0x65: {l: {0x74: {l: {0x6D: {l: {0x69: {l: {0x6E: {l: {0x75: {l: {0x73: {l: {0x3B: {c: [8726]}}}}}}}}}}}}}}}}}}}}}, 0x73: {l: {0x68: {l: {0x70: {l: {0x3B: {c: [10803]}}}}}}}}}, 0x65: {l: {0x70: {l: {0x61: {l: {0x72: {l: {0x73: {l: {0x6C: {l: {0x3B: {c: [10724]}}}}}}}}}}}}}, 0x69: {l: {0x64: {l: {0x3B: {c: [8739]}}}, 0x6C: {l: {0x65: {l: {0x3B: {c: [8995]}}}}}}}, 0x74: {l: {0x3B: {c: [10922]}, 0x65: {l: {0x3B: {c: [10924]}, 0x73: {l: {0x3B: {c: [10924, 65024]}}}}}}}}}, 0x6F: {l: {0x66: {l: {0x74: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1100]}}}}}}}}}, 0x6C: {l: {0x62: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [9023]}}}}}, 0x3B: {c: [10692]}}}, 0x3B: {c: [47]}}}, 0x70: {l: {0x66: {l: {0x3B: {c: [120164]}}}}}}}, 0x70: {l: {0x61: {l: {0x64: {l: {0x65: {l: {0x73: {l: {0x3B: {c: [9824]}, 0x75: {l: {0x69: {l: {0x74: {l: {0x3B: {c: [9824]}}}}}}}}}}}}}, 0x72: {l: {0x3B: {c: [8741]}}}}}}}, 0x71: {l: {0x63: {l: {0x61: {l: {0x70: {l: {0x3B: {c: [8851]}, 0x73: {l: {0x3B: {c: [8851, 65024]}}}}}}}, 0x75: {l: {0x70: {l: {0x3B: {c: [8852]}, 0x73: {l: {0x3B: {c: [8852, 65024]}}}}}}}}}, 0x73: {l: {0x75: {l: {0x62: {l: {0x3B: {c: [8847]}, 0x65: {l: {0x3B: {c: [8849]}}}, 0x73: {l: {0x65: {l: {0x74: {l: {0x3B: {c: [8847]}, 0x65: {l: {0x71: {l: {0x3B: {c: [8849]}}}}}}}}}}}}}, 0x70: {l: {0x3B: {c: [8848]}, 0x65: {l: {0x3B: {c: [8850]}}}, 0x73: {l: {0x65: {l: {0x74: {l: {0x3B: {c: [8848]}, 0x65: {l: {0x71: {l: {0x3B: {c: [8850]}}}}}}}}}}}}}}}}}, 0x75: {l: {0x61: {l: {0x72: {l: {0x65: {l: {0x3B: {c: [9633]}}}, 0x66: {l: {0x3B: {c: [9642]}}}}}}}, 0x3B: {c: [9633]}, 0x66: {l: {0x3B: {c: [9642]}}}}}}}, 0x72: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [8594]}}}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [120008]}}}}}, 0x65: {l: {0x74: {l: {0x6D: {l: {0x6E: {l: {0x3B: {c: [8726]}}}}}}}}}, 0x6D: {l: {0x69: {l: {0x6C: {l: {0x65: {l: {0x3B: {c: [8995]}}}}}}}}}, 0x74: {l: {0x61: {l: {0x72: {l: {0x66: {l: {0x3B: {c: [8902]}}}}}}}}}}}, 0x74: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [9734]}, 0x66: {l: {0x3B: {c: [9733]}}}}}}}, 0x72: {l: {0x61: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x65: {l: {0x70: {l: {0x73: {l: {0x69: {l: {0x6C: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [1013]}}}}}}}}}}}}}}}, 0x70: {l: {0x68: {l: {0x69: {l: {0x3B: {c: [981]}}}}}}}}}}}}}}}}}, 0x6E: {l: {0x73: {l: {0x3B: {c: [175]}}}}}}}}}, 0x75: {l: {0x62: {l: {0x3B: {c: [8834]}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [10941]}}}}}}}, 0x45: {l: {0x3B: {c: [10949]}}}, 0x65: {l: {0x3B: {c: [8838]}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [10947]}}}}}}}}}, 0x6D: {l: {0x75: {l: {0x6C: {l: {0x74: {l: {0x3B: {c: [10945]}}}}}}}}}, 0x6E: {l: {0x45: {l: {0x3B: {c: [10955]}}}, 0x65: {l: {0x3B: {c: [8842]}}}}}, 0x70: {l: {0x6C: {l: {0x75: {l: {0x73: {l: {0x3B: {c: [10943]}}}}}}}}}, 0x72: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [10617]}}}}}}}}}, 0x73: {l: {0x65: {l: {0x74: {l: {0x3B: {c: [8834]}, 0x65: {l: {0x71: {l: {0x3B: {c: [8838]}, 0x71: {l: {0x3B: {c: [10949]}}}}}}}, 0x6E: {l: {0x65: {l: {0x71: {l: {0x3B: {c: [8842]}, 0x71: {l: {0x3B: {c: [10955]}}}}}}}}}}}}}, 0x69: {l: {0x6D: {l: {0x3B: {c: [10951]}}}}}, 0x75: {l: {0x62: {l: {0x3B: {c: [10965]}}}, 0x70: {l: {0x3B: {c: [10963]}}}}}}}}}, 0x63: {l: {0x63: {l: {0x61: {l: {0x70: {l: {0x70: {l: {0x72: {l: {0x6F: {l: {0x78: {l: {0x3B: {c: [10936]}}}}}}}}}}}}}, 0x3B: {c: [8827]}, 0x63: {l: {0x75: {l: {0x72: {l: {0x6C: {l: {0x79: {l: {0x65: {l: {0x71: {l: {0x3B: {c: [8829]}}}}}}}}}}}}}}}, 0x65: {l: {0x71: {l: {0x3B: {c: [10928]}}}}}, 0x6E: {l: {0x61: {l: {0x70: {l: {0x70: {l: {0x72: {l: {0x6F: {l: {0x78: {l: {0x3B: {c: [10938]}}}}}}}}}}}}}, 0x65: {l: {0x71: {l: {0x71: {l: {0x3B: {c: [10934]}}}}}}}, 0x73: {l: {0x69: {l: {0x6D: {l: {0x3B: {c: [8937]}}}}}}}}}, 0x73: {l: {0x69: {l: {0x6D: {l: {0x3B: {c: [8831]}}}}}}}}}}}, 0x6D: {l: {0x3B: {c: [8721]}}}, 0x6E: {l: {0x67: {l: {0x3B: {c: [9834]}}}}}, 0x70: {l: {0x31: {l: {0x3B: {c: [185]}}, c: [185]}, 0x32: {l: {0x3B: {c: [178]}}, c: [178]}, 0x33: {l: {0x3B: {c: [179]}}, c: [179]}, 0x3B: {c: [8835]}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [10942]}}}}}, 0x73: {l: {0x75: {l: {0x62: {l: {0x3B: {c: [10968]}}}}}}}}}, 0x45: {l: {0x3B: {c: [10950]}}}, 0x65: {l: {0x3B: {c: [8839]}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [10948]}}}}}}}}}, 0x68: {l: {0x73: {l: {0x6F: {l: {0x6C: {l: {0x3B: {c: [10185]}}}}}, 0x75: {l: {0x62: {l: {0x3B: {c: [10967]}}}}}}}}}, 0x6C: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [10619]}}}}}}}}}, 0x6D: {l: {0x75: {l: {0x6C: {l: {0x74: {l: {0x3B: {c: [10946]}}}}}}}}}, 0x6E: {l: {0x45: {l: {0x3B: {c: [10956]}}}, 0x65: {l: {0x3B: {c: [8843]}}}}}, 0x70: {l: {0x6C: {l: {0x75: {l: {0x73: {l: {0x3B: {c: [10944]}}}}}}}}}, 0x73: {l: {0x65: {l: {0x74: {l: {0x3B: {c: [8835]}, 0x65: {l: {0x71: {l: {0x3B: {c: [8839]}, 0x71: {l: {0x3B: {c: [10950]}}}}}}}, 0x6E: {l: {0x65: {l: {0x71: {l: {0x3B: {c: [8843]}, 0x71: {l: {0x3B: {c: [10956]}}}}}}}}}}}}}, 0x69: {l: {0x6D: {l: {0x3B: {c: [10952]}}}}}, 0x75: {l: {0x62: {l: {0x3B: {c: [10964]}}}, 0x70: {l: {0x3B: {c: [10966]}}}}}}}}}}}, 0x77: {l: {0x61: {l: {0x72: {l: {0x68: {l: {0x6B: {l: {0x3B: {c: [10534]}}}}}, 0x72: {l: {0x3B: {c: [8601]}, 0x6F: {l: {0x77: {l: {0x3B: {c: [8601]}}}}}}}}}}}, 0x41: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [8665]}}}}}}}, 0x6E: {l: {0x77: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10538]}}}}}}}}}}}, 0x7A: {l: {0x6C: {l: {0x69: {l: {0x67: {l: {0x3B: {c: [223]}}, c: [223]}}}}}}}}},
    0x54: {l: {0x61: {l: {0x62: {l: {0x3B: {c: [9]}}}, 0x75: {l: {0x3B: {c: [932]}}}}}, 0x63: {l: {0x61: {l: {0x72: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [356]}}}}}}}}}, 0x65: {l: {0x64: {l: {0x69: {l: {0x6C: {l: {0x3B: {c: [354]}}}}}}}}}, 0x79: {l: {0x3B: {c: [1058]}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120087]}}}}}, 0x68: {l: {0x65: {l: {0x72: {l: {0x65: {l: {0x66: {l: {0x6F: {l: {0x72: {l: {0x65: {l: {0x3B: {c: [8756]}}}}}}}}}}}}}, 0x74: {l: {0x61: {l: {0x3B: {c: [920]}}}}}}}, 0x69: {l: {0x63: {l: {0x6B: {l: {0x53: {l: {0x70: {l: {0x61: {l: {0x63: {l: {0x65: {l: {0x3B: {c: [8287, 8202]}}}}}}}}}}}}}}}, 0x6E: {l: {0x53: {l: {0x70: {l: {0x61: {l: {0x63: {l: {0x65: {l: {0x3B: {c: [8201]}}}}}}}}}}}}}}}}}, 0x48: {l: {0x4F: {l: {0x52: {l: {0x4E: {l: {0x3B: {c: [222]}}, c: [222]}}}}}}}, 0x69: {l: {0x6C: {l: {0x64: {l: {0x65: {l: {0x3B: {c: [8764]}, 0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8771]}}}}}}}}}}}, 0x46: {l: {0x75: {l: {0x6C: {l: {0x6C: {l: {0x45: {l: {0x71: {l: {0x75: {l: {0x61: {l: {0x6C: {l: {0x3B: {c: [8773]}}}}}}}}}}}}}}}}}}}, 0x54: {l: {0x69: {l: {0x6C: {l: {0x64: {l: {0x65: {l: {0x3B: {c: [8776]}}}}}}}}}}}}}}}}}}}, 0x6F: {l: {0x70: {l: {0x66: {l: {0x3B: {c: [120139]}}}}}}}, 0x52: {l: {0x41: {l: {0x44: {l: {0x45: {l: {0x3B: {c: [8482]}}}}}}}}}, 0x72: {l: {0x69: {l: {0x70: {l: {0x6C: {l: {0x65: {l: {0x44: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [8411]}}}}}}}}}}}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [119983]}}}}}, 0x74: {l: {0x72: {l: {0x6F: {l: {0x6B: {l: {0x3B: {c: [358]}}}}}}}}}}}, 0x53: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1062]}}}}}, 0x48: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1035]}}}}}}}}}}},
    0x74: {l: {0x61: {l: {0x72: {l: {0x67: {l: {0x65: {l: {0x74: {l: {0x3B: {c: [8982]}}}}}}}}}, 0x75: {l: {0x3B: {c: [964]}}}}}, 0x62: {l: {0x72: {l: {0x6B: {l: {0x3B: {c: [9140]}}}}}}}, 0x63: {l: {0x61: {l: {0x72: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [357]}}}}}}}}}, 0x65: {l: {0x64: {l: {0x69: {l: {0x6C: {l: {0x3B: {c: [355]}}}}}}}}}, 0x79: {l: {0x3B: {c: [1090]}}}}}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [8411]}}}}}}}, 0x65: {l: {0x6C: {l: {0x72: {l: {0x65: {l: {0x63: {l: {0x3B: {c: [8981]}}}}}}}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120113]}}}}}, 0x68: {l: {0x65: {l: {0x72: {l: {0x65: {l: {0x34: {l: {0x3B: {c: [8756]}}}, 0x66: {l: {0x6F: {l: {0x72: {l: {0x65: {l: {0x3B: {c: [8756]}}}}}}}}}}}}}, 0x74: {l: {0x61: {l: {0x3B: {c: [952]}, 0x73: {l: {0x79: {l: {0x6D: {l: {0x3B: {c: [977]}}}}}}}, 0x76: {l: {0x3B: {c: [977]}}}}}}}}}, 0x69: {l: {0x63: {l: {0x6B: {l: {0x61: {l: {0x70: {l: {0x70: {l: {0x72: {l: {0x6F: {l: {0x78: {l: {0x3B: {c: [8776]}}}}}}}}}}}}}, 0x73: {l: {0x69: {l: {0x6D: {l: {0x3B: {c: [8764]}}}}}}}}}}}, 0x6E: {l: {0x73: {l: {0x70: {l: {0x3B: {c: [8201]}}}}}}}}}, 0x6B: {l: {0x61: {l: {0x70: {l: {0x3B: {c: [8776]}}}}}, 0x73: {l: {0x69: {l: {0x6D: {l: {0x3B: {c: [8764]}}}}}}}}}, 0x6F: {l: {0x72: {l: {0x6E: {l: {0x3B: {c: [254]}}, c: [254]}}}}}}}, 0x69: {l: {0x6C: {l: {0x64: {l: {0x65: {l: {0x3B: {c: [732]}}}}}}}, 0x6D: {l: {0x65: {l: {0x73: {l: {0x62: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10801]}}}}}, 0x3B: {c: [8864]}}}, 0x3B: {c: [215]}, 0x64: {l: {0x3B: {c: [10800]}}}}, c: [215]}}}}}, 0x6E: {l: {0x74: {l: {0x3B: {c: [8749]}}}}}}}, 0x6F: {l: {0x65: {l: {0x61: {l: {0x3B: {c: [10536]}}}}}, 0x70: {l: {0x62: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [9014]}}}}}}}, 0x63: {l: {0x69: {l: {0x72: {l: {0x3B: {c: [10993]}}}}}}}, 0x3B: {c: [8868]}, 0x66: {l: {0x3B: {c: [120165]}, 0x6F: {l: {0x72: {l: {0x6B: {l: {0x3B: {c: [10970]}}}}}}}}}}}, 0x73: {l: {0x61: {l: {0x3B: {c: [10537]}}}}}}}, 0x70: {l: {0x72: {l: {0x69: {l: {0x6D: {l: {0x65: {l: {0x3B: {c: [8244]}}}}}}}}}}}, 0x72: {l: {0x61: {l: {0x64: {l: {0x65: {l: {0x3B: {c: [8482]}}}}}}}, 0x69: {l: {0x61: {l: {0x6E: {l: {0x67: {l: {0x6C: {l: {0x65: {l: {0x3B: {c: [9653]}, 0x64: {l: {0x6F: {l: {0x77: {l: {0x6E: {l: {0x3B: {c: [9663]}}}}}}}}}, 0x6C: {l: {0x65: {l: {0x66: {l: {0x74: {l: {0x3B: {c: [9667]}, 0x65: {l: {0x71: {l: {0x3B: {c: [8884]}}}}}}}}}}}}}, 0x71: {l: {0x3B: {c: [8796]}}}, 0x72: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x3B: {c: [9657]}, 0x65: {l: {0x71: {l: {0x3B: {c: [8885]}}}}}}}}}}}}}}}}}}}}}}}}}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [9708]}}}}}}}, 0x65: {l: {0x3B: {c: [8796]}}}, 0x6D: {l: {0x69: {l: {0x6E: {l: {0x75: {l: {0x73: {l: {0x3B: {c: [10810]}}}}}}}}}}}, 0x70: {l: {0x6C: {l: {0x75: {l: {0x73: {l: {0x3B: {c: [10809]}}}}}}}}}, 0x73: {l: {0x62: {l: {0x3B: {c: [10701]}}}}}, 0x74: {l: {0x69: {l: {0x6D: {l: {0x65: {l: {0x3B: {c: [10811]}}}}}}}}}}}, 0x70: {l: {0x65: {l: {0x7A: {l: {0x69: {l: {0x75: {l: {0x6D: {l: {0x3B: {c: [9186]}}}}}}}}}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [120009]}}}, 0x79: {l: {0x3B: {c: [1094]}}}}}, 0x68: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1115]}}}}}}}, 0x74: {l: {0x72: {l: {0x6F: {l: {0x6B: {l: {0x3B: {c: [359]}}}}}}}}}}}, 0x77: {l: {0x69: {l: {0x78: {l: {0x74: {l: {0x3B: {c: [8812]}}}}}}}, 0x6F: {l: {0x68: {l: {0x65: {l: {0x61: {l: {0x64: {l: {0x6C: {l: {0x65: {l: {0x66: {l: {0x74: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8606]}}}}}}}}}}}}}}}}}}}, 0x72: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8608]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}},
    0x55: {l: {0x61: {l: {0x63: {l: {0x75: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [218]}}, c: [218]}}}}}}}, 0x72: {l: {0x72: {l: {0x3B: {c: [8607]}, 0x6F: {l: {0x63: {l: {0x69: {l: {0x72: {l: {0x3B: {c: [10569]}}}}}}}}}}}}}}}, 0x62: {l: {0x72: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1038]}}}}}, 0x65: {l: {0x76: {l: {0x65: {l: {0x3B: {c: [364]}}}}}}}}}}}, 0x63: {l: {0x69: {l: {0x72: {l: {0x63: {l: {0x3B: {c: [219]}}, c: [219]}}}}}, 0x79: {l: {0x3B: {c: [1059]}}}}}, 0x64: {l: {0x62: {l: {0x6C: {l: {0x61: {l: {0x63: {l: {0x3B: {c: [368]}}}}}}}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120088]}}}}}, 0x67: {l: {0x72: {l: {0x61: {l: {0x76: {l: {0x65: {l: {0x3B: {c: [217]}}, c: [217]}}}}}}}}}, 0x6D: {l: {0x61: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [362]}}}}}}}}}, 0x6E: {l: {0x64: {l: {0x65: {l: {0x72: {l: {0x42: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [95]}}}}}, 0x72: {l: {0x61: {l: {0x63: {l: {0x65: {l: {0x3B: {c: [9183]}}}, 0x6B: {l: {0x65: {l: {0x74: {l: {0x3B: {c: [9141]}}}}}}}}}}}}}}}, 0x50: {l: {0x61: {l: {0x72: {l: {0x65: {l: {0x6E: {l: {0x74: {l: {0x68: {l: {0x65: {l: {0x73: {l: {0x69: {l: {0x73: {l: {0x3B: {c: [9181]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x69: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [8899]}, 0x50: {l: {0x6C: {l: {0x75: {l: {0x73: {l: {0x3B: {c: [8846]}}}}}}}}}}}}}}}}}, 0x6F: {l: {0x67: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [370]}}}}}}}, 0x70: {l: {0x66: {l: {0x3B: {c: [120140]}}}}}}}, 0x70: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x42: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10514]}}}}}}}, 0x3B: {c: [8593]}, 0x44: {l: {0x6F: {l: {0x77: {l: {0x6E: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8645]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8657]}}}}}}}}}}}, 0x44: {l: {0x6F: {l: {0x77: {l: {0x6E: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8597]}}}}}}}}}}}}}}}}}}}, 0x64: {l: {0x6F: {l: {0x77: {l: {0x6E: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8661]}}}}}}}}}}}}}}}}}}}, 0x45: {l: {0x71: {l: {0x75: {l: {0x69: {l: {0x6C: {l: {0x69: {l: {0x62: {l: {0x72: {l: {0x69: {l: {0x75: {l: {0x6D: {l: {0x3B: {c: [10606]}}}}}}}}}}}}}}}}}}}}}}}, 0x70: {l: {0x65: {l: {0x72: {l: {0x4C: {l: {0x65: {l: {0x66: {l: {0x74: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8598]}}}}}}}}}}}}}}}}}}}, 0x52: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8599]}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x73: {l: {0x69: {l: {0x3B: {c: [978]}, 0x6C: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [933]}}}}}}}}}}}, 0x54: {l: {0x65: {l: {0x65: {l: {0x41: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8613]}}}}}}}}}}}, 0x3B: {c: [8869]}}}}}}}}}, 0x72: {l: {0x69: {l: {0x6E: {l: {0x67: {l: {0x3B: {c: [366]}}}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [119984]}}}}}}}, 0x74: {l: {0x69: {l: {0x6C: {l: {0x64: {l: {0x65: {l: {0x3B: {c: [360]}}}}}}}}}}}, 0x75: {l: {0x6D: {l: {0x6C: {l: {0x3B: {c: [220]}}, c: [220]}}}}}}},
    0x75: {l: {0x61: {l: {0x63: {l: {0x75: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [250]}}, c: [250]}}}}}}}, 0x72: {l: {0x72: {l: {0x3B: {c: [8593]}}}}}}}, 0x41: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [8657]}}}}}}}, 0x62: {l: {0x72: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1118]}}}}}, 0x65: {l: {0x76: {l: {0x65: {l: {0x3B: {c: [365]}}}}}}}}}}}, 0x63: {l: {0x69: {l: {0x72: {l: {0x63: {l: {0x3B: {c: [251]}}, c: [251]}}}}}, 0x79: {l: {0x3B: {c: [1091]}}}}}, 0x64: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [8645]}}}}}}}, 0x62: {l: {0x6C: {l: {0x61: {l: {0x63: {l: {0x3B: {c: [369]}}}}}}}}}, 0x68: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10606]}}}}}}}}}, 0x66: {l: {0x69: {l: {0x73: {l: {0x68: {l: {0x74: {l: {0x3B: {c: [10622]}}}}}}}}}, 0x72: {l: {0x3B: {c: [120114]}}}}}, 0x67: {l: {0x72: {l: {0x61: {l: {0x76: {l: {0x65: {l: {0x3B: {c: [249]}}, c: [249]}}}}}}}}}, 0x48: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10595]}}}}}}}, 0x68: {l: {0x61: {l: {0x72: {l: {0x6C: {l: {0x3B: {c: [8639]}}}, 0x72: {l: {0x3B: {c: [8638]}}}}}}}, 0x62: {l: {0x6C: {l: {0x6B: {l: {0x3B: {c: [9600]}}}}}}}}}, 0x6C: {l: {0x63: {l: {0x6F: {l: {0x72: {l: {0x6E: {l: {0x3B: {c: [8988]}, 0x65: {l: {0x72: {l: {0x3B: {c: [8988]}}}}}}}}}}}, 0x72: {l: {0x6F: {l: {0x70: {l: {0x3B: {c: [8975]}}}}}}}}}, 0x74: {l: {0x72: {l: {0x69: {l: {0x3B: {c: [9720]}}}}}}}}}, 0x6D: {l: {0x61: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [363]}}}}}}}, 0x6C: {l: {0x3B: {c: [168]}}, c: [168]}}}, 0x6F: {l: {0x67: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [371]}}}}}}}, 0x70: {l: {0x66: {l: {0x3B: {c: [120166]}}}}}}}, 0x70: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8593]}}}}}}}}}}}, 0x64: {l: {0x6F: {l: {0x77: {l: {0x6E: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x3B: {c: [8597]}}}}}}}}}}}}}}}}}}}, 0x68: {l: {0x61: {l: {0x72: {l: {0x70: {l: {0x6F: {l: {0x6F: {l: {0x6E: {l: {0x6C: {l: {0x65: {l: {0x66: {l: {0x74: {l: {0x3B: {c: [8639]}}}}}}}}}, 0x72: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x3B: {c: [8638]}}}}}}}}}}}}}}}}}}}}}}}}}, 0x6C: {l: {0x75: {l: {0x73: {l: {0x3B: {c: [8846]}}}}}}}, 0x73: {l: {0x69: {l: {0x3B: {c: [965]}, 0x68: {l: {0x3B: {c: [978]}}}, 0x6C: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [965]}}}}}}}}}}}, 0x75: {l: {0x70: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x6F: {l: {0x77: {l: {0x73: {l: {0x3B: {c: [8648]}}}}}}}}}}}}}}}}}}}, 0x72: {l: {0x63: {l: {0x6F: {l: {0x72: {l: {0x6E: {l: {0x3B: {c: [8989]}, 0x65: {l: {0x72: {l: {0x3B: {c: [8989]}}}}}}}}}}}, 0x72: {l: {0x6F: {l: {0x70: {l: {0x3B: {c: [8974]}}}}}}}}}, 0x69: {l: {0x6E: {l: {0x67: {l: {0x3B: {c: [367]}}}}}}}, 0x74: {l: {0x72: {l: {0x69: {l: {0x3B: {c: [9721]}}}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [120010]}}}}}}}, 0x74: {l: {0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [8944]}}}}}}}, 0x69: {l: {0x6C: {l: {0x64: {l: {0x65: {l: {0x3B: {c: [361]}}}}}}}}}, 0x72: {l: {0x69: {l: {0x3B: {c: [9653]}, 0x66: {l: {0x3B: {c: [9652]}}}}}}}}}, 0x75: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [8648]}}}}}}}, 0x6D: {l: {0x6C: {l: {0x3B: {c: [252]}}, c: [252]}}}}}, 0x77: {l: {0x61: {l: {0x6E: {l: {0x67: {l: {0x6C: {l: {0x65: {l: {0x3B: {c: [10663]}}}}}}}}}}}}}}},
    0x76: {l: {0x61: {l: {0x6E: {l: {0x67: {l: {0x72: {l: {0x74: {l: {0x3B: {c: [10652]}}}}}}}}}, 0x72: {l: {0x65: {l: {0x70: {l: {0x73: {l: {0x69: {l: {0x6C: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [1013]}}}}}}}}}}}}}}}, 0x6B: {l: {0x61: {l: {0x70: {l: {0x70: {l: {0x61: {l: {0x3B: {c: [1008]}}}}}}}}}}}, 0x6E: {l: {0x6F: {l: {0x74: {l: {0x68: {l: {0x69: {l: {0x6E: {l: {0x67: {l: {0x3B: {c: [8709]}}}}}}}}}}}}}}}, 0x70: {l: {0x68: {l: {0x69: {l: {0x3B: {c: [981]}}}}}, 0x69: {l: {0x3B: {c: [982]}}}, 0x72: {l: {0x6F: {l: {0x70: {l: {0x74: {l: {0x6F: {l: {0x3B: {c: [8733]}}}}}}}}}}}}}, 0x72: {l: {0x3B: {c: [8597]}, 0x68: {l: {0x6F: {l: {0x3B: {c: [1009]}}}}}}}, 0x73: {l: {0x69: {l: {0x67: {l: {0x6D: {l: {0x61: {l: {0x3B: {c: [962]}}}}}}}}}, 0x75: {l: {0x62: {l: {0x73: {l: {0x65: {l: {0x74: {l: {0x6E: {l: {0x65: {l: {0x71: {l: {0x3B: {c: [8842, 65024]}, 0x71: {l: {0x3B: {c: [10955, 65024]}}}}}}}}}}}}}}}}}, 0x70: {l: {0x73: {l: {0x65: {l: {0x74: {l: {0x6E: {l: {0x65: {l: {0x71: {l: {0x3B: {c: [8843, 65024]}, 0x71: {l: {0x3B: {c: [10956, 65024]}}}}}}}}}}}}}}}}}}}}}, 0x74: {l: {0x68: {l: {0x65: {l: {0x74: {l: {0x61: {l: {0x3B: {c: [977]}}}}}}}}}, 0x72: {l: {0x69: {l: {0x61: {l: {0x6E: {l: {0x67: {l: {0x6C: {l: {0x65: {l: {0x6C: {l: {0x65: {l: {0x66: {l: {0x74: {l: {0x3B: {c: [8882]}}}}}}}}}, 0x72: {l: {0x69: {l: {0x67: {l: {0x68: {l: {0x74: {l: {0x3B: {c: [8883]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, 0x41: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [8661]}}}}}}}, 0x42: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10984]}, 0x76: {l: {0x3B: {c: [10985]}}}}}}}}}, 0x63: {l: {0x79: {l: {0x3B: {c: [1074]}}}}}, 0x64: {l: {0x61: {l: {0x73: {l: {0x68: {l: {0x3B: {c: [8866]}}}}}}}}}, 0x44: {l: {0x61: {l: {0x73: {l: {0x68: {l: {0x3B: {c: [8872]}}}}}}}}}, 0x65: {l: {0x65: {l: {0x62: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [8891]}}}}}}}, 0x3B: {c: [8744]}, 0x65: {l: {0x71: {l: {0x3B: {c: [8794]}}}}}}}, 0x6C: {l: {0x6C: {l: {0x69: {l: {0x70: {l: {0x3B: {c: [8942]}}}}}}}}}, 0x72: {l: {0x62: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [124]}}}}}}}, 0x74: {l: {0x3B: {c: [124]}}}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120115]}}}}}, 0x6C: {l: {0x74: {l: {0x72: {l: {0x69: {l: {0x3B: {c: [8882]}}}}}}}}}, 0x6E: {l: {0x73: {l: {0x75: {l: {0x62: {l: {0x3B: {c: [8834, 8402]}}}, 0x70: {l: {0x3B: {c: [8835, 8402]}}}}}}}}}, 0x6F: {l: {0x70: {l: {0x66: {l: {0x3B: {c: [120167]}}}}}}}, 0x70: {l: {0x72: {l: {0x6F: {l: {0x70: {l: {0x3B: {c: [8733]}}}}}}}}}, 0x72: {l: {0x74: {l: {0x72: {l: {0x69: {l: {0x3B: {c: [8883]}}}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [120011]}}}}}, 0x75: {l: {0x62: {l: {0x6E: {l: {0x45: {l: {0x3B: {c: [10955, 65024]}}}, 0x65: {l: {0x3B: {c: [8842, 65024]}}}}}}}, 0x70: {l: {0x6E: {l: {0x45: {l: {0x3B: {c: [10956, 65024]}}}, 0x65: {l: {0x3B: {c: [8843, 65024]}}}}}}}}}}}, 0x7A: {l: {0x69: {l: {0x67: {l: {0x7A: {l: {0x61: {l: {0x67: {l: {0x3B: {c: [10650]}}}}}}}}}}}}}}},
    0x56: {l: {0x62: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10987]}}}}}}}, 0x63: {l: {0x79: {l: {0x3B: {c: [1042]}}}}}, 0x64: {l: {0x61: {l: {0x73: {l: {0x68: {l: {0x3B: {c: [8873]}, 0x6C: {l: {0x3B: {c: [10982]}}}}}}}}}}}, 0x44: {l: {0x61: {l: {0x73: {l: {0x68: {l: {0x3B: {c: [8875]}}}}}}}}}, 0x65: {l: {0x65: {l: {0x3B: {c: [8897]}}}, 0x72: {l: {0x62: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [8214]}}}}}}}, 0x74: {l: {0x3B: {c: [8214]}, 0x69: {l: {0x63: {l: {0x61: {l: {0x6C: {l: {0x42: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [8739]}}}}}}}, 0x4C: {l: {0x69: {l: {0x6E: {l: {0x65: {l: {0x3B: {c: [124]}}}}}}}}}, 0x53: {l: {0x65: {l: {0x70: {l: {0x61: {l: {0x72: {l: {0x61: {l: {0x74: {l: {0x6F: {l: {0x72: {l: {0x3B: {c: [10072]}}}}}}}}}}}}}}}}}}}, 0x54: {l: {0x69: {l: {0x6C: {l: {0x64: {l: {0x65: {l: {0x3B: {c: [8768]}}}}}}}}}}}}}}}}}}}}}, 0x79: {l: {0x54: {l: {0x68: {l: {0x69: {l: {0x6E: {l: {0x53: {l: {0x70: {l: {0x61: {l: {0x63: {l: {0x65: {l: {0x3B: {c: [8202]}}}}}}}}}}}}}}}}}}}}}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120089]}}}}}, 0x6F: {l: {0x70: {l: {0x66: {l: {0x3B: {c: [120141]}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [119985]}}}}}}}, 0x76: {l: {0x64: {l: {0x61: {l: {0x73: {l: {0x68: {l: {0x3B: {c: [8874]}}}}}}}}}}}}},
    0x57: {l: {0x63: {l: {0x69: {l: {0x72: {l: {0x63: {l: {0x3B: {c: [372]}}}}}}}}}, 0x65: {l: {0x64: {l: {0x67: {l: {0x65: {l: {0x3B: {c: [8896]}}}}}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120090]}}}}}, 0x6F: {l: {0x70: {l: {0x66: {l: {0x3B: {c: [120142]}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [119986]}}}}}}}}},
    0x77: {l: {0x63: {l: {0x69: {l: {0x72: {l: {0x63: {l: {0x3B: {c: [373]}}}}}}}}}, 0x65: {l: {0x64: {l: {0x62: {l: {0x61: {l: {0x72: {l: {0x3B: {c: [10847]}}}}}}}, 0x67: {l: {0x65: {l: {0x3B: {c: [8743]}, 0x71: {l: {0x3B: {c: [8793]}}}}}}}}}, 0x69: {l: {0x65: {l: {0x72: {l: {0x70: {l: {0x3B: {c: [8472]}}}}}}}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120116]}}}}}, 0x6F: {l: {0x70: {l: {0x66: {l: {0x3B: {c: [120168]}}}}}}}, 0x70: {l: {0x3B: {c: [8472]}}}, 0x72: {l: {0x3B: {c: [8768]}, 0x65: {l: {0x61: {l: {0x74: {l: {0x68: {l: {0x3B: {c: [8768]}}}}}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [120012]}}}}}}}}},
    0x78: {l: {0x63: {l: {0x61: {l: {0x70: {l: {0x3B: {c: [8898]}}}}}, 0x69: {l: {0x72: {l: {0x63: {l: {0x3B: {c: [9711]}}}}}}}, 0x75: {l: {0x70: {l: {0x3B: {c: [8899]}}}}}}}, 0x64: {l: {0x74: {l: {0x72: {l: {0x69: {l: {0x3B: {c: [9661]}}}}}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120117]}}}}}, 0x68: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [10231]}}}}}}}, 0x41: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [10234]}}}}}}}}}, 0x69: {l: {0x3B: {c: [958]}}}, 0x6C: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [10229]}}}}}}}, 0x41: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [10232]}}}}}}}}}, 0x6D: {l: {0x61: {l: {0x70: {l: {0x3B: {c: [10236]}}}}}}}, 0x6E: {l: {0x69: {l: {0x73: {l: {0x3B: {c: [8955]}}}}}}}, 0x6F: {l: {0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [10752]}}}}}}}, 0x70: {l: {0x66: {l: {0x3B: {c: [120169]}}}, 0x6C: {l: {0x75: {l: {0x73: {l: {0x3B: {c: [10753]}}}}}}}}}, 0x74: {l: {0x69: {l: {0x6D: {l: {0x65: {l: {0x3B: {c: [10754]}}}}}}}}}}}, 0x72: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [10230]}}}}}}}, 0x41: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [10233]}}}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [120013]}}}}}, 0x71: {l: {0x63: {l: {0x75: {l: {0x70: {l: {0x3B: {c: [10758]}}}}}}}}}}}, 0x75: {l: {0x70: {l: {0x6C: {l: {0x75: {l: {0x73: {l: {0x3B: {c: [10756]}}}}}}}}}, 0x74: {l: {0x72: {l: {0x69: {l: {0x3B: {c: [9651]}}}}}}}}}, 0x76: {l: {0x65: {l: {0x65: {l: {0x3B: {c: [8897]}}}}}}}, 0x77: {l: {0x65: {l: {0x64: {l: {0x67: {l: {0x65: {l: {0x3B: {c: [8896]}}}}}}}}}}}}},
    0x58: {l: {0x66: {l: {0x72: {l: {0x3B: {c: [120091]}}}}}, 0x69: {l: {0x3B: {c: [926]}}}, 0x6F: {l: {0x70: {l: {0x66: {l: {0x3B: {c: [120143]}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [119987]}}}}}}}}},
    0x59: {l: {0x61: {l: {0x63: {l: {0x75: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [221]}}, c: [221]}}}}}}}}}, 0x41: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1071]}}}}}}}, 0x63: {l: {0x69: {l: {0x72: {l: {0x63: {l: {0x3B: {c: [374]}}}}}}}, 0x79: {l: {0x3B: {c: [1067]}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120092]}}}}}, 0x49: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1031]}}}}}}}, 0x6F: {l: {0x70: {l: {0x66: {l: {0x3B: {c: [120144]}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [119988]}}}}}}}, 0x55: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1070]}}}}}}}, 0x75: {l: {0x6D: {l: {0x6C: {l: {0x3B: {c: [376]}}}}}}}}},
    0x79: {l: {0x61: {l: {0x63: {l: {0x75: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [253]}}, c: [253]}}}}}, 0x79: {l: {0x3B: {c: [1103]}}}}}}}, 0x63: {l: {0x69: {l: {0x72: {l: {0x63: {l: {0x3B: {c: [375]}}}}}}}, 0x79: {l: {0x3B: {c: [1099]}}}}}, 0x65: {l: {0x6E: {l: {0x3B: {c: [165]}}, c: [165]}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120118]}}}}}, 0x69: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1111]}}}}}}}, 0x6F: {l: {0x70: {l: {0x66: {l: {0x3B: {c: [120170]}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [120014]}}}}}}}, 0x75: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1102]}}}}}, 0x6D: {l: {0x6C: {l: {0x3B: {c: [255]}}, c: [255]}}}}}}},
    0x5A: {l: {0x61: {l: {0x63: {l: {0x75: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [377]}}}}}}}}}}}, 0x63: {l: {0x61: {l: {0x72: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [381]}}}}}}}}}, 0x79: {l: {0x3B: {c: [1047]}}}}}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [379]}}}}}}}, 0x65: {l: {0x72: {l: {0x6F: {l: {0x57: {l: {0x69: {l: {0x64: {l: {0x74: {l: {0x68: {l: {0x53: {l: {0x70: {l: {0x61: {l: {0x63: {l: {0x65: {l: {0x3B: {c: [8203]}}}}}}}}}}}}}}}}}}}}}}}}}, 0x74: {l: {0x61: {l: {0x3B: {c: [918]}}}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [8488]}}}}}, 0x48: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1046]}}}}}}}, 0x6F: {l: {0x70: {l: {0x66: {l: {0x3B: {c: [8484]}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [119989]}}}}}}}}},
    0x7A: {l: {0x61: {l: {0x63: {l: {0x75: {l: {0x74: {l: {0x65: {l: {0x3B: {c: [378]}}}}}}}}}}}, 0x63: {l: {0x61: {l: {0x72: {l: {0x6F: {l: {0x6E: {l: {0x3B: {c: [382]}}}}}}}}}, 0x79: {l: {0x3B: {c: [1079]}}}}}, 0x64: {l: {0x6F: {l: {0x74: {l: {0x3B: {c: [380]}}}}}}}, 0x65: {l: {0x65: {l: {0x74: {l: {0x72: {l: {0x66: {l: {0x3B: {c: [8488]}}}}}}}}}, 0x74: {l: {0x61: {l: {0x3B: {c: [950]}}}}}}}, 0x66: {l: {0x72: {l: {0x3B: {c: [120119]}}}}}, 0x68: {l: {0x63: {l: {0x79: {l: {0x3B: {c: [1078]}}}}}}}, 0x69: {l: {0x67: {l: {0x72: {l: {0x61: {l: {0x72: {l: {0x72: {l: {0x3B: {c: [8669]}}}}}}}}}}}}}, 0x6F: {l: {0x70: {l: {0x66: {l: {0x3B: {c: [120171]}}}}}}}, 0x73: {l: {0x63: {l: {0x72: {l: {0x3B: {c: [120015]}}}}}}}, 0x77: {l: {0x6A: {l: {0x3B: {c: [8205]}}}, 0x6E: {l: {0x6A: {l: {0x3B: {c: [8204]}}}}}}}}}
};
},{}],18:[function(require,module,exports){
'use strict';

var UNICODE = require('../common/unicode');

//Aliases
var $ = UNICODE.CODE_POINTS;

//Utils

//OPTIMIZATION: these utility functions should not be moved out of this module. V8 Crankshaft will not inline
//this functions if they will be situated in another module due to context switch.
//Always perform inlining check before modifying this functions ('node --trace-inlining').
function isReservedCodePoint(cp) {
    return cp >= 0xD800 && cp <= 0xDFFF || cp > 0x10FFFF;
}

function isSurrogatePair(cp1, cp2) {
    return cp1 >= 0xD800 && cp1 <= 0xDBFF && cp2 >= 0xDC00 && cp2 <= 0xDFFF;
}

function getSurrogatePairCodePoint(cp1, cp2) {
    return (cp1 - 0xD800) * 0x400 + 0x2400 + cp2;
}

//Preprocessor
//NOTE: HTML input preprocessing
//(see: http://www.whatwg.org/specs/web-apps/current-work/multipage/parsing.html#preprocessing-the-input-stream)
var Preprocessor = module.exports = function (html) {
    this.write(html);

    //NOTE: one leading U+FEFF BYTE ORDER MARK character must be ignored if any are present in the input stream.
    this.pos = this.html.charCodeAt(0) === $.BOM ? 0 : -1;

    this.gapStack = [];
    this.lastGapPos = -1;
    this.skipNextNewLine = false;
};

Preprocessor.prototype.write = function (html) {
    if (this.html) {
        this.html = this.html.substring(0, this.pos + 1) +
                    html +
                    this.html.substring(this.pos + 1, this.html.length);

    }
    else
        this.html = html;


    this.lastCharPos = this.html.length - 1;
};

Preprocessor.prototype.advanceAndPeekCodePoint = function () {
    this.pos++;

    if (this.pos > this.lastCharPos)
        return $.EOF;

    var cp = this.html.charCodeAt(this.pos);

    //NOTE: any U+000A LINE FEED (LF) characters that immediately follow a U+000D CARRIAGE RETURN (CR) character
    //must be ignored.
    if (this.skipNextNewLine && cp === $.LINE_FEED) {
        this.skipNextNewLine = false;
        this._addGap();
        return this.advanceAndPeekCodePoint();
    }

    //NOTE: all U+000D CARRIAGE RETURN (CR) characters must be converted to U+000A LINE FEED (LF) characters
    if (cp === $.CARRIAGE_RETURN) {
        this.skipNextNewLine = true;
        return $.LINE_FEED;
    }

    this.skipNextNewLine = false;

    //OPTIMIZATION: first perform check if the code point in the allowed range that covers most common
    //HTML input (e.g. ASCII codes) to avoid performance-cost operations for high-range code points.
    return cp >= 0xD800 ? this._processHighRangeCodePoint(cp) : cp;
};

Preprocessor.prototype._processHighRangeCodePoint = function (cp) {
    //NOTE: try to peek a surrogate pair
    if (this.pos !== this.lastCharPos) {
        var nextCp = this.html.charCodeAt(this.pos + 1);

        if (isSurrogatePair(cp, nextCp)) {
            //NOTE: we have a surrogate pair. Peek pair character and recalculate code point.
            this.pos++;
            cp = getSurrogatePairCodePoint(cp, nextCp);

            //NOTE: add gap that should be avoided during retreat
            this._addGap();
        }
    }

    if (isReservedCodePoint(cp))
        cp = $.REPLACEMENT_CHARACTER;

    return cp;
};

Preprocessor.prototype._addGap = function () {
    this.gapStack.push(this.lastGapPos);
    this.lastGapPos = this.pos;
};

Preprocessor.prototype.retreat = function () {
    if (this.pos === this.lastGapPos) {
        this.lastGapPos = this.gapStack.pop();
        this.pos--;
    }

    this.pos--;
};

},{"../common/unicode":9}],19:[function(require,module,exports){
'use strict';

var Preprocessor = require('./preprocessor'),
    LocationInfoMixin = require('./location_info_mixin'),
    UNICODE = require('../common/unicode'),
    NAMED_ENTITY_TRIE = require('./named_entity_trie');

//Aliases
var $ = UNICODE.CODE_POINTS,
    $$ = UNICODE.CODE_POINT_SEQUENCES;

//Replacement code points for numeric entities
var NUMERIC_ENTITY_REPLACEMENTS = {
    0x00: 0xFFFD, 0x0D: 0x000D, 0x80: 0x20AC, 0x81: 0x0081, 0x82: 0x201A, 0x83: 0x0192, 0x84: 0x201E,
    0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02C6, 0x89: 0x2030, 0x8A: 0x0160, 0x8B: 0x2039,
    0x8C: 0x0152, 0x8D: 0x008D, 0x8E: 0x017D, 0x8F: 0x008F, 0x90: 0x0090, 0x91: 0x2018, 0x92: 0x2019,
    0x93: 0x201C, 0x94: 0x201D, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014, 0x98: 0x02DC, 0x99: 0x2122,
    0x9A: 0x0161, 0x9B: 0x203A, 0x9C: 0x0153, 0x9D: 0x009D, 0x9E: 0x017E, 0x9F: 0x0178
};

//States
var DATA_STATE = 'DATA_STATE',
    CHARACTER_REFERENCE_IN_DATA_STATE = 'CHARACTER_REFERENCE_IN_DATA_STATE',
    RCDATA_STATE = 'RCDATA_STATE',
    CHARACTER_REFERENCE_IN_RCDATA_STATE = 'CHARACTER_REFERENCE_IN_RCDATA_STATE',
    RAWTEXT_STATE = 'RAWTEXT_STATE',
    SCRIPT_DATA_STATE = 'SCRIPT_DATA_STATE',
    PLAINTEXT_STATE = 'PLAINTEXT_STATE',
    TAG_OPEN_STATE = 'TAG_OPEN_STATE',
    END_TAG_OPEN_STATE = 'END_TAG_OPEN_STATE',
    TAG_NAME_STATE = 'TAG_NAME_STATE',
    RCDATA_LESS_THAN_SIGN_STATE = 'RCDATA_LESS_THAN_SIGN_STATE',
    RCDATA_END_TAG_OPEN_STATE = 'RCDATA_END_TAG_OPEN_STATE',
    RCDATA_END_TAG_NAME_STATE = 'RCDATA_END_TAG_NAME_STATE',
    RAWTEXT_LESS_THAN_SIGN_STATE = 'RAWTEXT_LESS_THAN_SIGN_STATE',
    RAWTEXT_END_TAG_OPEN_STATE = 'RAWTEXT_END_TAG_OPEN_STATE',
    RAWTEXT_END_TAG_NAME_STATE = 'RAWTEXT_END_TAG_NAME_STATE',
    SCRIPT_DATA_LESS_THAN_SIGN_STATE = 'SCRIPT_DATA_LESS_THAN_SIGN_STATE',
    SCRIPT_DATA_END_TAG_OPEN_STATE = 'SCRIPT_DATA_END_TAG_OPEN_STATE',
    SCRIPT_DATA_END_TAG_NAME_STATE = 'SCRIPT_DATA_END_TAG_NAME_STATE',
    SCRIPT_DATA_ESCAPE_START_STATE = 'SCRIPT_DATA_ESCAPE_START_STATE',
    SCRIPT_DATA_ESCAPE_START_DASH_STATE = 'SCRIPT_DATA_ESCAPE_START_DASH_STATE',
    SCRIPT_DATA_ESCAPED_STATE = 'SCRIPT_DATA_ESCAPED_STATE',
    SCRIPT_DATA_ESCAPED_DASH_STATE = 'SCRIPT_DATA_ESCAPED_DASH_STATE',
    SCRIPT_DATA_ESCAPED_DASH_DASH_STATE = 'SCRIPT_DATA_ESCAPED_DASH_DASH_STATE',
    SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN_STATE = 'SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN_STATE',
    SCRIPT_DATA_ESCAPED_END_TAG_OPEN_STATE = 'SCRIPT_DATA_ESCAPED_END_TAG_OPEN_STATE',
    SCRIPT_DATA_ESCAPED_END_TAG_NAME_STATE = 'SCRIPT_DATA_ESCAPED_END_TAG_NAME_STATE',
    SCRIPT_DATA_DOUBLE_ESCAPE_START_STATE = 'SCRIPT_DATA_DOUBLE_ESCAPE_START_STATE',
    SCRIPT_DATA_DOUBLE_ESCAPED_STATE = 'SCRIPT_DATA_DOUBLE_ESCAPED_STATE',
    SCRIPT_DATA_DOUBLE_ESCAPED_DASH_STATE = 'SCRIPT_DATA_DOUBLE_ESCAPED_DASH_STATE',
    SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH_STATE = 'SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH_STATE',
    SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN_STATE = 'SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN_STATE',
    SCRIPT_DATA_DOUBLE_ESCAPE_END_STATE = 'SCRIPT_DATA_DOUBLE_ESCAPE_END_STATE',
    BEFORE_ATTRIBUTE_NAME_STATE = 'BEFORE_ATTRIBUTE_NAME_STATE',
    ATTRIBUTE_NAME_STATE = 'ATTRIBUTE_NAME_STATE',
    AFTER_ATTRIBUTE_NAME_STATE = 'AFTER_ATTRIBUTE_NAME_STATE',
    BEFORE_ATTRIBUTE_VALUE_STATE = 'BEFORE_ATTRIBUTE_VALUE_STATE',
    ATTRIBUTE_VALUE_DOUBLE_QUOTED_STATE = 'ATTRIBUTE_VALUE_DOUBLE_QUOTED_STATE',
    ATTRIBUTE_VALUE_SINGLE_QUOTED_STATE = 'ATTRIBUTE_VALUE_SINGLE_QUOTED_STATE',
    ATTRIBUTE_VALUE_UNQUOTED_STATE = 'ATTRIBUTE_VALUE_UNQUOTED_STATE',
    CHARACTER_REFERENCE_IN_ATTRIBUTE_VALUE_STATE = 'CHARACTER_REFERENCE_IN_ATTRIBUTE_VALUE_STATE',
    AFTER_ATTRIBUTE_VALUE_QUOTED_STATE = 'AFTER_ATTRIBUTE_VALUE_QUOTED_STATE',
    SELF_CLOSING_START_TAG_STATE = 'SELF_CLOSING_START_TAG_STATE',
    BOGUS_COMMENT_STATE = 'BOGUS_COMMENT_STATE',
    MARKUP_DECLARATION_OPEN_STATE = 'MARKUP_DECLARATION_OPEN_STATE',
    COMMENT_START_STATE = 'COMMENT_START_STATE',
    COMMENT_START_DASH_STATE = 'COMMENT_START_DASH_STATE',
    COMMENT_STATE = 'COMMENT_STATE',
    COMMENT_END_DASH_STATE = 'COMMENT_END_DASH_STATE',
    COMMENT_END_STATE = 'COMMENT_END_STATE',
    COMMENT_END_BANG_STATE = 'COMMENT_END_BANG_STATE',
    DOCTYPE_STATE = 'DOCTYPE_STATE',
    BEFORE_DOCTYPE_NAME_STATE = 'BEFORE_DOCTYPE_NAME_STATE',
    DOCTYPE_NAME_STATE = 'DOCTYPE_NAME_STATE',
    AFTER_DOCTYPE_NAME_STATE = 'AFTER_DOCTYPE_NAME_STATE',
    AFTER_DOCTYPE_PUBLIC_KEYWORD_STATE = 'AFTER_DOCTYPE_PUBLIC_KEYWORD_STATE',
    BEFORE_DOCTYPE_PUBLIC_IDENTIFIER_STATE = 'BEFORE_DOCTYPE_PUBLIC_IDENTIFIER_STATE',
    DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED_STATE = 'DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED_STATE',
    DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED_STATE = 'DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED_STATE',
    AFTER_DOCTYPE_PUBLIC_IDENTIFIER_STATE = 'AFTER_DOCTYPE_PUBLIC_IDENTIFIER_STATE',
    BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS_STATE = 'BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS_STATE',
    AFTER_DOCTYPE_SYSTEM_KEYWORD_STATE = 'AFTER_DOCTYPE_SYSTEM_KEYWORD_STATE',
    BEFORE_DOCTYPE_SYSTEM_IDENTIFIER_STATE = 'BEFORE_DOCTYPE_SYSTEM_IDENTIFIER_STATE',
    DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED_STATE = 'DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED_STATE',
    DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED_STATE = 'DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED_STATE',
    AFTER_DOCTYPE_SYSTEM_IDENTIFIER_STATE = 'AFTER_DOCTYPE_SYSTEM_IDENTIFIER_STATE',
    BOGUS_DOCTYPE_STATE = 'BOGUS_DOCTYPE_STATE',
    CDATA_SECTION_STATE = 'CDATA_SECTION_STATE';

//Utils

//OPTIMIZATION: these utility functions should not be moved out of this module. V8 Crankshaft will not inline
//this functions if they will be situated in another module due to context switch.
//Always perform inlining check before modifying this functions ('node --trace-inlining').
function isWhitespace(cp) {
    return cp === $.SPACE || cp === $.LINE_FEED || cp === $.TABULATION || cp === $.FORM_FEED;
}

function isAsciiDigit(cp) {
    return cp >= $.DIGIT_0 && cp <= $.DIGIT_9;
}

function isAsciiUpper(cp) {
    return cp >= $.LATIN_CAPITAL_A && cp <= $.LATIN_CAPITAL_Z;
}

function isAsciiLower(cp) {
    return cp >= $.LATIN_SMALL_A && cp <= $.LATIN_SMALL_Z;
}

function isAsciiAlphaNumeric(cp) {
    return isAsciiDigit(cp) || isAsciiUpper(cp) || isAsciiLower(cp);
}

function isDigit(cp, isHex) {
    return isAsciiDigit(cp) || (isHex && ((cp >= $.LATIN_CAPITAL_A && cp <= $.LATIN_CAPITAL_F) ||
                                          (cp >= $.LATIN_SMALL_A && cp <= $.LATIN_SMALL_F)));
}

function isReservedCodePoint(cp) {
    return cp >= 0xD800 && cp <= 0xDFFF || cp > 0x10FFFF;
}

function toAsciiLowerCodePoint(cp) {
    return cp + 0x0020;
}

//NOTE: String.fromCharCode() function can handle only characters from BMP subset.
//So, we need to workaround this manually.
//(see: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/String/fromCharCode#Getting_it_to_work_with_higher_values)
function toChar(cp) {
    if (cp <= 0xFFFF)
        return String.fromCharCode(cp);

    cp -= 0x10000;
    return String.fromCharCode(cp >>> 10 & 0x3FF | 0xD800) + String.fromCharCode(0xDC00 | cp & 0x3FF);
}

function toAsciiLowerChar(cp) {
    return String.fromCharCode(toAsciiLowerCodePoint(cp));
}

//Tokenizer
var Tokenizer = module.exports = function (html, options) {
    this.disableEntitiesDecoding = false;

    this.preprocessor = new Preprocessor(html);

    this.tokenQueue = [];

    this.allowCDATA = false;

    this.state = DATA_STATE;
    this.returnState = '';

    this.consumptionPos = 0;

    this.tempBuff = [];
    this.additionalAllowedCp = void 0;
    this.lastStartTagName = '';

    this.currentCharacterToken = null;
    this.currentToken = null;
    this.currentAttr = null;

    if (options) {
        this.disableEntitiesDecoding = !options.decodeHtmlEntities;

        if (options.locationInfo)
            LocationInfoMixin.assign(this);
    }
};

//Token types
Tokenizer.CHARACTER_TOKEN = 'CHARACTER_TOKEN';
Tokenizer.NULL_CHARACTER_TOKEN = 'NULL_CHARACTER_TOKEN';
Tokenizer.WHITESPACE_CHARACTER_TOKEN = 'WHITESPACE_CHARACTER_TOKEN';
Tokenizer.START_TAG_TOKEN = 'START_TAG_TOKEN';
Tokenizer.END_TAG_TOKEN = 'END_TAG_TOKEN';
Tokenizer.COMMENT_TOKEN = 'COMMENT_TOKEN';
Tokenizer.DOCTYPE_TOKEN = 'DOCTYPE_TOKEN';
Tokenizer.EOF_TOKEN = 'EOF_TOKEN';

//Tokenizer initial states for different modes
Tokenizer.MODE = Tokenizer.prototype.MODE = {
    DATA: DATA_STATE,
    RCDATA: RCDATA_STATE,
    RAWTEXT: RAWTEXT_STATE,
    SCRIPT_DATA: SCRIPT_DATA_STATE,
    PLAINTEXT: PLAINTEXT_STATE
};

//Static
Tokenizer.getTokenAttr = function (token, attrName) {
    for (var i = token.attrs.length - 1; i >= 0; i--) {
        if (token.attrs[i].name === attrName)
            return token.attrs[i].value;
    }

    return null;
};

//Get token
Tokenizer.prototype.getNextToken = function () {
    while (!this.tokenQueue.length)
        this[this.state](this._consume());

    return this.tokenQueue.shift();
};

//Consumption
Tokenizer.prototype._consume = function () {
    this.consumptionPos++;
    return this.preprocessor.advanceAndPeekCodePoint();
};

Tokenizer.prototype._unconsume = function () {
    this.consumptionPos--;
    this.preprocessor.retreat();
};

Tokenizer.prototype._unconsumeSeveral = function (count) {
    while (count--)
        this._unconsume();
};

Tokenizer.prototype._reconsumeInState = function (state) {
    this.state = state;
    this._unconsume();
};

Tokenizer.prototype._consumeSubsequentIfMatch = function (pattern, startCp, caseSensitive) {
    var rollbackPos = this.consumptionPos,
        isMatch = true,
        patternLength = pattern.length,
        patternPos = 0,
        cp = startCp,
        patternCp = void 0;

    for (; patternPos < patternLength; patternPos++) {
        if (patternPos > 0)
            cp = this._consume();

        if (cp === $.EOF) {
            isMatch = false;
            break;
        }

        patternCp = pattern[patternPos];

        if (cp !== patternCp && (caseSensitive || cp !== toAsciiLowerCodePoint(patternCp))) {
            isMatch = false;
            break;
        }
    }

    if (!isMatch)
        this._unconsumeSeveral(this.consumptionPos - rollbackPos);

    return isMatch;
};

//Lookahead
Tokenizer.prototype._lookahead = function () {
    var cp = this.preprocessor.advanceAndPeekCodePoint();
    this.preprocessor.retreat();

    return cp;
};

//Temp buffer
Tokenizer.prototype.isTempBufferEqualToScriptString = function () {
    if (this.tempBuff.length !== $$.SCRIPT_STRING.length)
        return false;

    for (var i = 0; i < this.tempBuff.length; i++) {
        if (this.tempBuff[i] !== $$.SCRIPT_STRING[i])
            return false;
    }

    return true;
};

//Token creation
Tokenizer.prototype.buildStartTagToken = function (tagName) {
    return {
        type: Tokenizer.START_TAG_TOKEN,
        tagName: tagName,
        selfClosing: false,
        attrs: []
    };
};

Tokenizer.prototype.buildEndTagToken = function (tagName) {
    return {
        type: Tokenizer.END_TAG_TOKEN,
        tagName: tagName,
        ignored: false,
        attrs: []
    };
};

Tokenizer.prototype._createStartTagToken = function (tagNameFirstCh) {
    this.currentToken = this.buildStartTagToken(tagNameFirstCh);
};

Tokenizer.prototype._createEndTagToken = function (tagNameFirstCh) {
    this.currentToken = this.buildEndTagToken(tagNameFirstCh);
};

Tokenizer.prototype._createCommentToken = function () {
    this.currentToken = {
        type: Tokenizer.COMMENT_TOKEN,
        data: ''
    };
};

Tokenizer.prototype._createDoctypeToken = function (doctypeNameFirstCh) {
    this.currentToken = {
        type: Tokenizer.DOCTYPE_TOKEN,
        name: doctypeNameFirstCh || '',
        forceQuirks: false,
        publicId: null,
        systemId: null
    };
};

Tokenizer.prototype._createCharacterToken = function (type, ch) {
    this.currentCharacterToken = {
        type: type,
        chars: ch
    };
};

//Tag attributes
Tokenizer.prototype._createAttr = function (attrNameFirstCh) {
    this.currentAttr = {
        name: attrNameFirstCh,
        value: ''
    };
};

Tokenizer.prototype._isDuplicateAttr = function () {
    return Tokenizer.getTokenAttr(this.currentToken, this.currentAttr.name) !== null;
};

Tokenizer.prototype._leaveAttrName = function (toState) {
    this.state = toState;

    if (!this._isDuplicateAttr())
        this.currentToken.attrs.push(this.currentAttr);
};

//Appropriate end tag token
//(see: http://www.whatwg.org/specs/web-apps/current-work/multipage/tokenization.html#appropriate-end-tag-token)
Tokenizer.prototype._isAppropriateEndTagToken = function () {
    return this.lastStartTagName === this.currentToken.tagName;
};

//Token emission
Tokenizer.prototype._emitCurrentToken = function () {
    this._emitCurrentCharacterToken();

    //NOTE: store emited start tag's tagName to determine is the following end tag token is appropriate.
    if (this.currentToken.type === Tokenizer.START_TAG_TOKEN)
        this.lastStartTagName = this.currentToken.tagName;

    this.tokenQueue.push(this.currentToken);
    this.currentToken = null;
};

Tokenizer.prototype._emitCurrentCharacterToken = function () {
    if (this.currentCharacterToken) {
        this.tokenQueue.push(this.currentCharacterToken);
        this.currentCharacterToken = null;
    }
};

Tokenizer.prototype._emitEOFToken = function () {
    this._emitCurrentCharacterToken();
    this.tokenQueue.push({type: Tokenizer.EOF_TOKEN});
};

//Characters emission

//OPTIMIZATION: specification uses only one type of character tokens (one token per character).
//This causes a huge memory overhead and a lot of unnecessary parser loops. parse5 uses 3 groups of characters.
//If we have a sequence of characters that belong to the same group, parser can process it
//as a single solid character token.
//So, there are 3 types of character tokens in parse5:
//1)NULL_CHARACTER_TOKEN - \u0000-character sequences (e.g. '\u0000\u0000\u0000')
//2)WHITESPACE_CHARACTER_TOKEN - any whitespace/new-line character sequences (e.g. '\n  \r\t   \f')
//3)CHARACTER_TOKEN - any character sequence which don't belong to groups 1 and 2 (e.g. 'abcdef1234@@#$%^')
Tokenizer.prototype._appendCharToCurrentCharacterToken = function (type, ch) {
    if (this.currentCharacterToken && this.currentCharacterToken.type !== type)
        this._emitCurrentCharacterToken();

    if (this.currentCharacterToken)
        this.currentCharacterToken.chars += ch;

    else
        this._createCharacterToken(type, ch);
};

Tokenizer.prototype._emitCodePoint = function (cp) {
    var type = Tokenizer.CHARACTER_TOKEN;

    if (isWhitespace(cp))
        type = Tokenizer.WHITESPACE_CHARACTER_TOKEN;

    else if (cp === $.NULL)
        type = Tokenizer.NULL_CHARACTER_TOKEN;

    this._appendCharToCurrentCharacterToken(type, toChar(cp));
};

Tokenizer.prototype._emitSeveralCodePoints = function (codePoints) {
    for (var i = 0; i < codePoints.length; i++)
        this._emitCodePoint(codePoints[i]);
};

//NOTE: used then we emit character explicitly. This is always a non-whitespace and a non-null character.
//So we can avoid additional checks here.
Tokenizer.prototype._emitChar = function (ch) {
    this._appendCharToCurrentCharacterToken(Tokenizer.CHARACTER_TOKEN, ch);
};

//Character reference tokenization
Tokenizer.prototype._consumeNumericEntity = function (isHex) {
    var digits = '',
        nextCp = void 0;

    do {
        digits += toChar(this._consume());
        nextCp = this._lookahead();
    } while (nextCp !== $.EOF && isDigit(nextCp, isHex));

    if (this._lookahead() === $.SEMICOLON)
        this._consume();

    var referencedCp = parseInt(digits, isHex ? 16 : 10),
        replacement = NUMERIC_ENTITY_REPLACEMENTS[referencedCp];

    if (replacement)
        return replacement;

    if (isReservedCodePoint(referencedCp))
        return $.REPLACEMENT_CHARACTER;

    return referencedCp;
};

Tokenizer.prototype._consumeNamedEntity = function (startCp, inAttr) {
    var referencedCodePoints = null,
        entityCodePointsCount = 0,
        cp = startCp,
        leaf = NAMED_ENTITY_TRIE[cp],
        consumedCount = 1,
        semicolonTerminated = false;

    for (; leaf && cp !== $.EOF; cp = this._consume(), consumedCount++, leaf = leaf.l && leaf.l[cp]) {
        if (leaf.c) {
            //NOTE: we have at least one named reference match. But we don't stop lookup at this point,
            //because longer matches still can be found (e.g. '&not' and '&notin;') except the case
            //then found match is terminated by semicolon.
            referencedCodePoints = leaf.c;
            entityCodePointsCount = consumedCount;

            if (cp === $.SEMICOLON) {
                semicolonTerminated = true;
                break;
            }
        }
    }

    if (referencedCodePoints) {
        if (!semicolonTerminated) {
            //NOTE: unconsume excess (e.g. 'it' in '&notit')
            this._unconsumeSeveral(consumedCount - entityCodePointsCount);

            //NOTE: If the character reference is being consumed as part of an attribute and the next character
            //is either a U+003D EQUALS SIGN character (=) or an alphanumeric ASCII character, then, for historical
            //reasons, all the characters that were matched after the U+0026 AMPERSAND character (&) must be
            //unconsumed, and nothing is returned.
            //However, if this next character is in fact a U+003D EQUALS SIGN character (=), then this is a
            //parse error, because some legacy user agents will misinterpret the markup in those cases.
            //(see: http://www.whatwg.org/specs/web-apps/current-work/multipage/tokenization.html#tokenizing-character-references)
            if (inAttr) {
                var nextCp = this._lookahead();

                if (nextCp === $.EQUALS_SIGN || isAsciiAlphaNumeric(nextCp)) {
                    this._unconsumeSeveral(entityCodePointsCount);
                    return null;
                }
            }
        }

        return referencedCodePoints;
    }

    this._unconsumeSeveral(consumedCount);

    return null;
};

Tokenizer.prototype._consumeCharacterReference = function (startCp, inAttr) {
    if (this.disableEntitiesDecoding || isWhitespace(startCp) || startCp === $.GREATER_THAN_SIGN ||
        startCp === $.AMPERSAND || startCp === this.additionalAllowedCp || startCp === $.EOF) {
        //NOTE: not a character reference. No characters are consumed, and nothing is returned.
        this._unconsume();
        return null;
    }

    else if (startCp === $.NUMBER_SIGN) {
        //NOTE: we have a numeric entity candidate, now we should determine if it's hex or decimal
        var isHex = false,
            nextCp = this._lookahead();

        if (nextCp === $.LATIN_SMALL_X || nextCp === $.LATIN_CAPITAL_X) {
            this._consume();
            isHex = true;
        }

        nextCp = this._lookahead();

        //NOTE: if we have at least one digit this is a numeric entity for sure, so we consume it
        if (nextCp !== $.EOF && isDigit(nextCp, isHex))
            return [this._consumeNumericEntity(isHex)];

        else {
            //NOTE: otherwise this is a bogus number entity and a parse error. Unconsume the number sign
            //and the 'x'-character if appropriate.
            this._unconsumeSeveral(isHex ? 2 : 1);
            return null;
        }
    }

    else
        return this._consumeNamedEntity(startCp, inAttr);
};

//State machine
var _ = Tokenizer.prototype;

//12.2.4.1 Data state
//------------------------------------------------------------------
_[DATA_STATE] = function dataState(cp) {
    if (cp === $.AMPERSAND)
        this.state = CHARACTER_REFERENCE_IN_DATA_STATE;

    else if (cp === $.LESS_THAN_SIGN)
        this.state = TAG_OPEN_STATE;

    else if (cp === $.NULL)
        this._emitCodePoint(cp);

    else if (cp === $.EOF)
        this._emitEOFToken();

    else
        this._emitCodePoint(cp);
};


//12.2.4.2 Character reference in data state
//------------------------------------------------------------------
_[CHARACTER_REFERENCE_IN_DATA_STATE] = function characterReferenceInDataState(cp) {
    this.state = DATA_STATE;
    this.additionalAllowedCp = void 0;

    var referencedCodePoints = this._consumeCharacterReference(cp, false);

    if (referencedCodePoints)
        this._emitSeveralCodePoints(referencedCodePoints);
    else
        this._emitChar('&');
};


//12.2.4.3 RCDATA state
//------------------------------------------------------------------
_[RCDATA_STATE] = function rcdataState(cp) {
    if (cp === $.AMPERSAND)
        this.state = CHARACTER_REFERENCE_IN_RCDATA_STATE;

    else if (cp === $.LESS_THAN_SIGN)
        this.state = RCDATA_LESS_THAN_SIGN_STATE;

    else if (cp === $.NULL)
        this._emitChar(UNICODE.REPLACEMENT_CHARACTER);

    else if (cp === $.EOF)
        this._emitEOFToken();

    else
        this._emitCodePoint(cp);
};


//12.2.4.4 Character reference in RCDATA state
//------------------------------------------------------------------
_[CHARACTER_REFERENCE_IN_RCDATA_STATE] = function characterReferenceInRcdataState(cp) {
    this.state = RCDATA_STATE;
    this.additionalAllowedCp = void 0;

    var referencedCodePoints = this._consumeCharacterReference(cp, false);

    if (referencedCodePoints)
        this._emitSeveralCodePoints(referencedCodePoints);
    else
        this._emitChar('&');
};


//12.2.4.5 RAWTEXT state
//------------------------------------------------------------------
_[RAWTEXT_STATE] = function rawtextState(cp) {
    if (cp === $.LESS_THAN_SIGN)
        this.state = RAWTEXT_LESS_THAN_SIGN_STATE;

    else if (cp === $.NULL)
        this._emitChar(UNICODE.REPLACEMENT_CHARACTER);

    else if (cp === $.EOF)
        this._emitEOFToken();

    else
        this._emitCodePoint(cp);
};


//12.2.4.6 Script data state
//------------------------------------------------------------------
_[SCRIPT_DATA_STATE] = function scriptDataState(cp) {
    if (cp === $.LESS_THAN_SIGN)
        this.state = SCRIPT_DATA_LESS_THAN_SIGN_STATE;

    else if (cp === $.NULL)
        this._emitChar(UNICODE.REPLACEMENT_CHARACTER);

    else if (cp === $.EOF)
        this._emitEOFToken();

    else
        this._emitCodePoint(cp);
};


//12.2.4.7 PLAINTEXT state
//------------------------------------------------------------------
_[PLAINTEXT_STATE] = function plaintextState(cp) {
    if (cp === $.NULL)
        this._emitChar(UNICODE.REPLACEMENT_CHARACTER);

    else if (cp === $.EOF)
        this._emitEOFToken();

    else
        this._emitCodePoint(cp);
};


//12.2.4.8 Tag open state
//------------------------------------------------------------------
_[TAG_OPEN_STATE] = function tagOpenState(cp) {
    if (cp === $.EXCLAMATION_MARK)
        this.state = MARKUP_DECLARATION_OPEN_STATE;

    else if (cp === $.SOLIDUS)
        this.state = END_TAG_OPEN_STATE;

    else if (isAsciiUpper(cp)) {
        this._createStartTagToken(toAsciiLowerChar(cp));
        this.state = TAG_NAME_STATE;
    }

    else if (isAsciiLower(cp)) {
        this._createStartTagToken(toChar(cp));
        this.state = TAG_NAME_STATE;
    }

    else if (cp === $.QUESTION_MARK) {
        //NOTE: call bogus comment state directly with current consumed character to avoid unnecessary reconsumption.
        this[BOGUS_COMMENT_STATE](cp);
    }

    else {
        this._emitChar('<');
        this._reconsumeInState(DATA_STATE);
    }
};


//12.2.4.9 End tag open state
//------------------------------------------------------------------
_[END_TAG_OPEN_STATE] = function endTagOpenState(cp) {
    if (isAsciiUpper(cp)) {
        this._createEndTagToken(toAsciiLowerChar(cp));
        this.state = TAG_NAME_STATE;
    }

    else if (isAsciiLower(cp)) {
        this._createEndTagToken(toChar(cp));
        this.state = TAG_NAME_STATE;
    }

    else if (cp === $.GREATER_THAN_SIGN)
        this.state = DATA_STATE;

    else if (cp === $.EOF) {
        this._reconsumeInState(DATA_STATE);
        this._emitChar('<');
        this._emitChar('/');
    }

    else {
        //NOTE: call bogus comment state directly with current consumed character to avoid unnecessary reconsumption.
        this[BOGUS_COMMENT_STATE](cp);
    }
};


//12.2.4.10 Tag name state
//------------------------------------------------------------------
_[TAG_NAME_STATE] = function tagNameState(cp) {
    if (isWhitespace(cp))
        this.state = BEFORE_ATTRIBUTE_NAME_STATE;

    else if (cp === $.SOLIDUS)
        this.state = SELF_CLOSING_START_TAG_STATE;

    else if (cp === $.GREATER_THAN_SIGN) {
        this.state = DATA_STATE;
        this._emitCurrentToken();
    }

    else if (isAsciiUpper(cp))
        this.currentToken.tagName += toAsciiLowerChar(cp);

    else if (cp === $.NULL)
        this.currentToken.tagName += UNICODE.REPLACEMENT_CHARACTER;

    else if (cp === $.EOF)
        this._reconsumeInState(DATA_STATE);

    else
        this.currentToken.tagName += toChar(cp);
};


//12.2.4.11 RCDATA less-than sign state
//------------------------------------------------------------------
_[RCDATA_LESS_THAN_SIGN_STATE] = function rcdataLessThanSignState(cp) {
    if (cp === $.SOLIDUS) {
        this.tempBuff = [];
        this.state = RCDATA_END_TAG_OPEN_STATE;
    }

    else {
        this._emitChar('<');
        this._reconsumeInState(RCDATA_STATE);
    }
};


//12.2.4.12 RCDATA end tag open state
//------------------------------------------------------------------
_[RCDATA_END_TAG_OPEN_STATE] = function rcdataEndTagOpenState(cp) {
    if (isAsciiUpper(cp)) {
        this._createEndTagToken(toAsciiLowerChar(cp));
        this.tempBuff.push(cp);
        this.state = RCDATA_END_TAG_NAME_STATE;
    }

    else if (isAsciiLower(cp)) {
        this._createEndTagToken(toChar(cp));
        this.tempBuff.push(cp);
        this.state = RCDATA_END_TAG_NAME_STATE;
    }

    else {
        this._emitChar('<');
        this._emitChar('/');
        this._reconsumeInState(RCDATA_STATE);
    }
};


//12.2.4.13 RCDATA end tag name state
//------------------------------------------------------------------
_[RCDATA_END_TAG_NAME_STATE] = function rcdataEndTagNameState(cp) {
    if (isAsciiUpper(cp)) {
        this.currentToken.tagName += toAsciiLowerChar(cp);
        this.tempBuff.push(cp);
    }

    else if (isAsciiLower(cp)) {
        this.currentToken.tagName += toChar(cp);
        this.tempBuff.push(cp);
    }

    else {
        if (this._isAppropriateEndTagToken()) {
            if (isWhitespace(cp)) {
                this.state = BEFORE_ATTRIBUTE_NAME_STATE;
                return;
            }

            if (cp === $.SOLIDUS) {
                this.state = SELF_CLOSING_START_TAG_STATE;
                return;
            }

            if (cp === $.GREATER_THAN_SIGN) {
                this.state = DATA_STATE;
                this._emitCurrentToken();
                return;
            }
        }

        this._emitChar('<');
        this._emitChar('/');
        this._emitSeveralCodePoints(this.tempBuff);
        this._reconsumeInState(RCDATA_STATE);
    }
};


//12.2.4.14 RAWTEXT less-than sign state
//------------------------------------------------------------------
_[RAWTEXT_LESS_THAN_SIGN_STATE] = function rawtextLessThanSignState(cp) {
    if (cp === $.SOLIDUS) {
        this.tempBuff = [];
        this.state = RAWTEXT_END_TAG_OPEN_STATE;
    }

    else {
        this._emitChar('<');
        this._reconsumeInState(RAWTEXT_STATE);
    }
};


//12.2.4.15 RAWTEXT end tag open state
//------------------------------------------------------------------
_[RAWTEXT_END_TAG_OPEN_STATE] = function rawtextEndTagOpenState(cp) {
    if (isAsciiUpper(cp)) {
        this._createEndTagToken(toAsciiLowerChar(cp));
        this.tempBuff.push(cp);
        this.state = RAWTEXT_END_TAG_NAME_STATE;
    }

    else if (isAsciiLower(cp)) {
        this._createEndTagToken(toChar(cp));
        this.tempBuff.push(cp);
        this.state = RAWTEXT_END_TAG_NAME_STATE;
    }

    else {
        this._emitChar('<');
        this._emitChar('/');
        this._reconsumeInState(RAWTEXT_STATE);
    }
};


//12.2.4.16 RAWTEXT end tag name state
//------------------------------------------------------------------
_[RAWTEXT_END_TAG_NAME_STATE] = function rawtextEndTagNameState(cp) {
    if (isAsciiUpper(cp)) {
        this.currentToken.tagName += toAsciiLowerChar(cp);
        this.tempBuff.push(cp);
    }

    else if (isAsciiLower(cp)) {
        this.currentToken.tagName += toChar(cp);
        this.tempBuff.push(cp);
    }

    else {
        if (this._isAppropriateEndTagToken()) {
            if (isWhitespace(cp)) {
                this.state = BEFORE_ATTRIBUTE_NAME_STATE;
                return;
            }

            if (cp === $.SOLIDUS) {
                this.state = SELF_CLOSING_START_TAG_STATE;
                return;
            }

            if (cp === $.GREATER_THAN_SIGN) {
                this._emitCurrentToken();
                this.state = DATA_STATE;
                return;
            }
        }

        this._emitChar('<');
        this._emitChar('/');
        this._emitSeveralCodePoints(this.tempBuff);
        this._reconsumeInState(RAWTEXT_STATE);
    }
};


//12.2.4.17 Script data less-than sign state
//------------------------------------------------------------------
_[SCRIPT_DATA_LESS_THAN_SIGN_STATE] = function scriptDataLessThanSignState(cp) {
    if (cp === $.SOLIDUS) {
        this.tempBuff = [];
        this.state = SCRIPT_DATA_END_TAG_OPEN_STATE;
    }

    else if (cp === $.EXCLAMATION_MARK) {
        this.state = SCRIPT_DATA_ESCAPE_START_STATE;
        this._emitChar('<');
        this._emitChar('!');
    }

    else {
        this._emitChar('<');
        this._reconsumeInState(SCRIPT_DATA_STATE);
    }
};


//12.2.4.18 Script data end tag open state
//------------------------------------------------------------------
_[SCRIPT_DATA_END_TAG_OPEN_STATE] = function scriptDataEndTagOpenState(cp) {
    if (isAsciiUpper(cp)) {
        this._createEndTagToken(toAsciiLowerChar(cp));
        this.tempBuff.push(cp);
        this.state = SCRIPT_DATA_END_TAG_NAME_STATE;
    }

    else if (isAsciiLower(cp)) {
        this._createEndTagToken(toChar(cp));
        this.tempBuff.push(cp);
        this.state = SCRIPT_DATA_END_TAG_NAME_STATE;
    }

    else {
        this._emitChar('<');
        this._emitChar('/');
        this._reconsumeInState(SCRIPT_DATA_STATE);
    }
};


//12.2.4.19 Script data end tag name state
//------------------------------------------------------------------
_[SCRIPT_DATA_END_TAG_NAME_STATE] = function scriptDataEndTagNameState(cp) {
    if (isAsciiUpper(cp)) {
        this.currentToken.tagName += toAsciiLowerChar(cp);
        this.tempBuff.push(cp);
    }

    else if (isAsciiLower(cp)) {
        this.currentToken.tagName += toChar(cp);
        this.tempBuff.push(cp);
    }

    else {
        if (this._isAppropriateEndTagToken()) {
            if (isWhitespace(cp)) {
                this.state = BEFORE_ATTRIBUTE_NAME_STATE;
                return;
            }

            else if (cp === $.SOLIDUS) {
                this.state = SELF_CLOSING_START_TAG_STATE;
                return;
            }

            else if (cp === $.GREATER_THAN_SIGN) {
                this._emitCurrentToken();
                this.state = DATA_STATE;
                return;
            }
        }

        this._emitChar('<');
        this._emitChar('/');
        this._emitSeveralCodePoints(this.tempBuff);
        this._reconsumeInState(SCRIPT_DATA_STATE);
    }
};


//12.2.4.20 Script data escape start state
//------------------------------------------------------------------
_[SCRIPT_DATA_ESCAPE_START_STATE] = function scriptDataEscapeStartState(cp) {
    if (cp === $.HYPHEN_MINUS) {
        this.state = SCRIPT_DATA_ESCAPE_START_DASH_STATE;
        this._emitChar('-');
    }

    else
        this._reconsumeInState(SCRIPT_DATA_STATE);
};


//12.2.4.21 Script data escape start dash state
//------------------------------------------------------------------
_[SCRIPT_DATA_ESCAPE_START_DASH_STATE] = function scriptDataEscapeStartDashState(cp) {
    if (cp === $.HYPHEN_MINUS) {
        this.state = SCRIPT_DATA_ESCAPED_DASH_DASH_STATE;
        this._emitChar('-');
    }

    else
        this._reconsumeInState(SCRIPT_DATA_STATE);
};


//12.2.4.22 Script data escaped state
//------------------------------------------------------------------
_[SCRIPT_DATA_ESCAPED_STATE] = function scriptDataEscapedState(cp) {
    if (cp === $.HYPHEN_MINUS) {
        this.state = SCRIPT_DATA_ESCAPED_DASH_STATE;
        this._emitChar('-');
    }

    else if (cp === $.LESS_THAN_SIGN)
        this.state = SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN_STATE;

    else if (cp === $.NULL)
        this._emitChar(UNICODE.REPLACEMENT_CHARACTER);

    else if (cp === $.EOF)
        this._reconsumeInState(DATA_STATE);

    else
        this._emitCodePoint(cp);
};


//12.2.4.23 Script data escaped dash state
//------------------------------------------------------------------
_[SCRIPT_DATA_ESCAPED_DASH_STATE] = function scriptDataEscapedDashState(cp) {
    if (cp === $.HYPHEN_MINUS) {
        this.state = SCRIPT_DATA_ESCAPED_DASH_DASH_STATE;
        this._emitChar('-');
    }

    else if (cp === $.LESS_THAN_SIGN)
        this.state = SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN_STATE;

    else if (cp === $.NULL) {
        this.state = SCRIPT_DATA_ESCAPED_STATE;
        this._emitChar(UNICODE.REPLACEMENT_CHARACTER);
    }

    else if (cp === $.EOF)
        this._reconsumeInState(DATA_STATE);

    else {
        this.state = SCRIPT_DATA_ESCAPED_STATE;
        this._emitCodePoint(cp);
    }
};


//12.2.4.24 Script data escaped dash dash state
//------------------------------------------------------------------
_[SCRIPT_DATA_ESCAPED_DASH_DASH_STATE] = function scriptDataEscapedDashDashState(cp) {
    if (cp === $.HYPHEN_MINUS)
        this._emitChar('-');

    else if (cp === $.LESS_THAN_SIGN)
        this.state = SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN_STATE;

    else if (cp === $.GREATER_THAN_SIGN) {
        this.state = SCRIPT_DATA_STATE;
        this._emitChar('>');
    }

    else if (cp === $.NULL) {
        this.state = SCRIPT_DATA_ESCAPED_STATE;
        this._emitChar(UNICODE.REPLACEMENT_CHARACTER);
    }

    else if (cp === $.EOF)
        this._reconsumeInState(DATA_STATE);

    else {
        this.state = SCRIPT_DATA_ESCAPED_STATE;
        this._emitCodePoint(cp);
    }
};


//12.2.4.25 Script data escaped less-than sign state
//------------------------------------------------------------------
_[SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN_STATE] = function scriptDataEscapedLessThanSignState(cp) {
    if (cp === $.SOLIDUS) {
        this.tempBuff = [];
        this.state = SCRIPT_DATA_ESCAPED_END_TAG_OPEN_STATE;
    }

    else if (isAsciiUpper(cp)) {
        this.tempBuff = [];
        this.tempBuff.push(toAsciiLowerCodePoint(cp));
        this.state = SCRIPT_DATA_DOUBLE_ESCAPE_START_STATE;
        this._emitChar('<');
        this._emitCodePoint(cp);
    }

    else if (isAsciiLower(cp)) {
        this.tempBuff = [];
        this.tempBuff.push(cp);
        this.state = SCRIPT_DATA_DOUBLE_ESCAPE_START_STATE;
        this._emitChar('<');
        this._emitCodePoint(cp);
    }

    else {
        this._emitChar('<');
        this._reconsumeInState(SCRIPT_DATA_ESCAPED_STATE);
    }
};


//12.2.4.26 Script data escaped end tag open state
//------------------------------------------------------------------
_[SCRIPT_DATA_ESCAPED_END_TAG_OPEN_STATE] = function scriptDataEscapedEndTagOpenState(cp) {
    if (isAsciiUpper(cp)) {
        this._createEndTagToken(toAsciiLowerChar(cp));
        this.tempBuff.push(cp);
        this.state = SCRIPT_DATA_ESCAPED_END_TAG_NAME_STATE;
    }

    else if (isAsciiLower(cp)) {
        this._createEndTagToken(toChar(cp));
        this.tempBuff.push(cp);
        this.state = SCRIPT_DATA_ESCAPED_END_TAG_NAME_STATE;
    }

    else {
        this._emitChar('<');
        this._emitChar('/');
        this._reconsumeInState(SCRIPT_DATA_ESCAPED_STATE);
    }
};


//12.2.4.27 Script data escaped end tag name state
//------------------------------------------------------------------
_[SCRIPT_DATA_ESCAPED_END_TAG_NAME_STATE] = function scriptDataEscapedEndTagNameState(cp) {
    if (isAsciiUpper(cp)) {
        this.currentToken.tagName += toAsciiLowerChar(cp);
        this.tempBuff.push(cp);
    }

    else if (isAsciiLower(cp)) {
        this.currentToken.tagName += toChar(cp);
        this.tempBuff.push(cp);
    }

    else {
        if (this._isAppropriateEndTagToken()) {
            if (isWhitespace(cp)) {
                this.state = BEFORE_ATTRIBUTE_NAME_STATE;
                return;
            }

            if (cp === $.SOLIDUS) {
                this.state = SELF_CLOSING_START_TAG_STATE;
                return;
            }

            if (cp === $.GREATER_THAN_SIGN) {
                this._emitCurrentToken();
                this.state = DATA_STATE;
                return;
            }
        }

        this._emitChar('<');
        this._emitChar('/');
        this._emitSeveralCodePoints(this.tempBuff);
        this._reconsumeInState(SCRIPT_DATA_ESCAPED_STATE);
    }
};


//12.2.4.28 Script data double escape start state
//------------------------------------------------------------------
_[SCRIPT_DATA_DOUBLE_ESCAPE_START_STATE] = function scriptDataDoubleEscapeStartState(cp) {
    if (isWhitespace(cp) || cp === $.SOLIDUS || cp === $.GREATER_THAN_SIGN) {
        this.state = this.isTempBufferEqualToScriptString() ? SCRIPT_DATA_DOUBLE_ESCAPED_STATE : SCRIPT_DATA_ESCAPED_STATE;
        this._emitCodePoint(cp);
    }

    else if (isAsciiUpper(cp)) {
        this.tempBuff.push(toAsciiLowerCodePoint(cp));
        this._emitCodePoint(cp);
    }

    else if (isAsciiLower(cp)) {
        this.tempBuff.push(cp);
        this._emitCodePoint(cp);
    }

    else
        this._reconsumeInState(SCRIPT_DATA_ESCAPED_STATE);
};


//12.2.4.29 Script data double escaped state
//------------------------------------------------------------------
_[SCRIPT_DATA_DOUBLE_ESCAPED_STATE] = function scriptDataDoubleEscapedState(cp) {
    if (cp === $.HYPHEN_MINUS) {
        this.state = SCRIPT_DATA_DOUBLE_ESCAPED_DASH_STATE;
        this._emitChar('-');
    }

    else if (cp === $.LESS_THAN_SIGN) {
        this.state = SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN_STATE;
        this._emitChar('<');
    }

    else if (cp === $.NULL)
        this._emitChar(UNICODE.REPLACEMENT_CHARACTER);

    else if (cp === $.EOF)
        this._reconsumeInState(DATA_STATE);

    else
        this._emitCodePoint(cp);
};


//12.2.4.30 Script data double escaped dash state
//------------------------------------------------------------------
_[SCRIPT_DATA_DOUBLE_ESCAPED_DASH_STATE] = function scriptDataDoubleEscapedDashState(cp) {
    if (cp === $.HYPHEN_MINUS) {
        this.state = SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH_STATE;
        this._emitChar('-');
    }

    else if (cp === $.LESS_THAN_SIGN) {
        this.state = SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN_STATE;
        this._emitChar('<');
    }

    else if (cp === $.NULL) {
        this.state = SCRIPT_DATA_DOUBLE_ESCAPED_STATE;
        this._emitChar(UNICODE.REPLACEMENT_CHARACTER);
    }

    else if (cp === $.EOF)
        this._reconsumeInState(DATA_STATE);

    else {
        this.state = SCRIPT_DATA_DOUBLE_ESCAPED_STATE;
        this._emitCodePoint(cp);
    }
};


//12.2.4.31 Script data double escaped dash dash state
//------------------------------------------------------------------
_[SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH_STATE] = function scriptDataDoubleEscapedDashDashState(cp) {
    if (cp === $.HYPHEN_MINUS)
        this._emitChar('-');

    else if (cp === $.LESS_THAN_SIGN) {
        this.state = SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN_STATE;
        this._emitChar('<');
    }

    else if (cp === $.GREATER_THAN_SIGN) {
        this.state = SCRIPT_DATA_STATE;
        this._emitChar('>');
    }

    else if (cp === $.NULL) {
        this.state = SCRIPT_DATA_DOUBLE_ESCAPED_STATE;
        this._emitChar(UNICODE.REPLACEMENT_CHARACTER);
    }

    else if (cp === $.EOF)
        this._reconsumeInState(DATA_STATE);

    else {
        this.state = SCRIPT_DATA_DOUBLE_ESCAPED_STATE;
        this._emitCodePoint(cp);
    }
};


//12.2.4.32 Script data double escaped less-than sign state
//------------------------------------------------------------------
_[SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN_STATE] = function scriptDataDoubleEscapedLessThanSignState(cp) {
    if (cp === $.SOLIDUS) {
        this.tempBuff = [];
        this.state = SCRIPT_DATA_DOUBLE_ESCAPE_END_STATE;
        this._emitChar('/');
    }

    else
        this._reconsumeInState(SCRIPT_DATA_DOUBLE_ESCAPED_STATE);
};


//12.2.4.33 Script data double escape end state
//------------------------------------------------------------------
_[SCRIPT_DATA_DOUBLE_ESCAPE_END_STATE] = function scriptDataDoubleEscapeEndState(cp) {
    if (isWhitespace(cp) || cp === $.SOLIDUS || cp === $.GREATER_THAN_SIGN) {
        this.state = this.isTempBufferEqualToScriptString() ? SCRIPT_DATA_ESCAPED_STATE : SCRIPT_DATA_DOUBLE_ESCAPED_STATE;

        this._emitCodePoint(cp);
    }

    else if (isAsciiUpper(cp)) {
        this.tempBuff.push(toAsciiLowerCodePoint(cp));
        this._emitCodePoint(cp);
    }

    else if (isAsciiLower(cp)) {
        this.tempBuff.push(cp);
        this._emitCodePoint(cp);
    }

    else
        this._reconsumeInState(SCRIPT_DATA_DOUBLE_ESCAPED_STATE);
};


//12.2.4.34 Before attribute name state
//------------------------------------------------------------------
_[BEFORE_ATTRIBUTE_NAME_STATE] = function beforeAttributeNameState(cp) {
    if (isWhitespace(cp))
        return;

    if (cp === $.SOLIDUS)
        this.state = SELF_CLOSING_START_TAG_STATE;

    else if (cp === $.GREATER_THAN_SIGN) {
        this.state = DATA_STATE;
        this._emitCurrentToken();
    }

    else if (isAsciiUpper(cp)) {
        this._createAttr(toAsciiLowerChar(cp));
        this.state = ATTRIBUTE_NAME_STATE;
    }

    else if (cp === $.NULL) {
        this._createAttr(UNICODE.REPLACEMENT_CHARACTER);
        this.state = ATTRIBUTE_NAME_STATE;
    }

    else if (cp === $.QUOTATION_MARK || cp === $.APOSTROPHE || cp === $.LESS_THAN_SIGN || cp === $.EQUALS_SIGN) {
        this._createAttr(toChar(cp));
        this.state = ATTRIBUTE_NAME_STATE;
    }

    else if (cp === $.EOF)
        this._reconsumeInState(DATA_STATE);

    else {
        this._createAttr(toChar(cp));
        this.state = ATTRIBUTE_NAME_STATE;
    }
};


//12.2.4.35 Attribute name state
//------------------------------------------------------------------
_[ATTRIBUTE_NAME_STATE] = function attributeNameState(cp) {
    if (isWhitespace(cp))
        this._leaveAttrName(AFTER_ATTRIBUTE_NAME_STATE);

    else if (cp === $.SOLIDUS)
        this._leaveAttrName(SELF_CLOSING_START_TAG_STATE);

    else if (cp === $.EQUALS_SIGN)
        this._leaveAttrName(BEFORE_ATTRIBUTE_VALUE_STATE);

    else if (cp === $.GREATER_THAN_SIGN) {
        this._leaveAttrName(DATA_STATE);
        this._emitCurrentToken();
    }

    else if (isAsciiUpper(cp))
        this.currentAttr.name += toAsciiLowerChar(cp);

    else if (cp === $.QUOTATION_MARK || cp === $.APOSTROPHE || cp === $.LESS_THAN_SIGN)
        this.currentAttr.name += toChar(cp);

    else if (cp === $.NULL)
        this.currentAttr.name += UNICODE.REPLACEMENT_CHARACTER;

    else if (cp === $.EOF)
        this._reconsumeInState(DATA_STATE);

    else
        this.currentAttr.name += toChar(cp);
};


//12.2.4.36 After attribute name state
//------------------------------------------------------------------
_[AFTER_ATTRIBUTE_NAME_STATE] = function afterAttributeNameState(cp) {
    if (isWhitespace(cp))
        return;

    if (cp === $.SOLIDUS)
        this.state = SELF_CLOSING_START_TAG_STATE;

    else if (cp === $.EQUALS_SIGN)
        this.state = BEFORE_ATTRIBUTE_VALUE_STATE;

    else if (cp === $.GREATER_THAN_SIGN) {
        this.state = DATA_STATE;
        this._emitCurrentToken();
    }

    else if (isAsciiUpper(cp)) {
        this._createAttr(toAsciiLowerChar(cp));
        this.state = ATTRIBUTE_NAME_STATE;
    }

    else if (cp === $.NULL) {
        this._createAttr(UNICODE.REPLACEMENT_CHARACTER);
        this.state = ATTRIBUTE_NAME_STATE;
    }

    else if (cp === $.QUOTATION_MARK || cp === $.APOSTROPHE || cp === $.LESS_THAN_SIGN) {
        this._createAttr(toChar(cp));
        this.state = ATTRIBUTE_NAME_STATE;
    }

    else if (cp === $.EOF)
        this._reconsumeInState(DATA_STATE);

    else {
        this._createAttr(toChar(cp));
        this.state = ATTRIBUTE_NAME_STATE;
    }
};


//12.2.4.37 Before attribute value state
//------------------------------------------------------------------
_[BEFORE_ATTRIBUTE_VALUE_STATE] = function beforeAttributeValueState(cp) {
    if (isWhitespace(cp))
        return;

    if (cp === $.QUOTATION_MARK)
        this.state = ATTRIBUTE_VALUE_DOUBLE_QUOTED_STATE;

    else if (cp === $.AMPERSAND)
        this._reconsumeInState(ATTRIBUTE_VALUE_UNQUOTED_STATE);

    else if (cp === $.APOSTROPHE)
        this.state = ATTRIBUTE_VALUE_SINGLE_QUOTED_STATE;

    else if (cp === $.NULL) {
        this.currentAttr.value += UNICODE.REPLACEMENT_CHARACTER;
        this.state = ATTRIBUTE_VALUE_UNQUOTED_STATE;
    }

    else if (cp === $.GREATER_THAN_SIGN) {
        this.state = DATA_STATE;
        this._emitCurrentToken();
    }

    else if (cp === $.LESS_THAN_SIGN || cp === $.EQUALS_SIGN || cp === $.GRAVE_ACCENT) {
        this.currentAttr.value += toChar(cp);
        this.state = ATTRIBUTE_VALUE_UNQUOTED_STATE;
    }

    else if (cp === $.EOF)
        this._reconsumeInState(DATA_STATE);

    else {
        this.currentAttr.value += toChar(cp);
        this.state = ATTRIBUTE_VALUE_UNQUOTED_STATE;
    }
};


//12.2.4.38 Attribute value (double-quoted) state
//------------------------------------------------------------------
_[ATTRIBUTE_VALUE_DOUBLE_QUOTED_STATE] = function attributeValueDoubleQuotedState(cp) {
    if (cp === $.QUOTATION_MARK)
        this.state = AFTER_ATTRIBUTE_VALUE_QUOTED_STATE;

    else if (cp === $.AMPERSAND) {
        this.additionalAllowedCp = $.QUOTATION_MARK;
        this.returnState = this.state;
        this.state = CHARACTER_REFERENCE_IN_ATTRIBUTE_VALUE_STATE;
    }

    else if (cp === $.NULL)
        this.currentAttr.value += UNICODE.REPLACEMENT_CHARACTER;

    else if (cp === $.EOF)
        this._reconsumeInState(DATA_STATE);

    else
        this.currentAttr.value += toChar(cp);
};


//12.2.4.39 Attribute value (single-quoted) state
//------------------------------------------------------------------
_[ATTRIBUTE_VALUE_SINGLE_QUOTED_STATE] = function attributeValueSingleQuotedState(cp) {
    if (cp === $.APOSTROPHE)
        this.state = AFTER_ATTRIBUTE_VALUE_QUOTED_STATE;

    else if (cp === $.AMPERSAND) {
        this.additionalAllowedCp = $.APOSTROPHE;
        this.returnState = this.state;
        this.state = CHARACTER_REFERENCE_IN_ATTRIBUTE_VALUE_STATE;
    }

    else if (cp === $.NULL)
        this.currentAttr.value += UNICODE.REPLACEMENT_CHARACTER;

    else if (cp === $.EOF)
        this._reconsumeInState(DATA_STATE);

    else
        this.currentAttr.value += toChar(cp);
};


//12.2.4.40 Attribute value (unquoted) state
//------------------------------------------------------------------
_[ATTRIBUTE_VALUE_UNQUOTED_STATE] = function attributeValueUnquotedState(cp) {
    if (isWhitespace(cp))
        this.state = BEFORE_ATTRIBUTE_NAME_STATE;

    else if (cp === $.AMPERSAND) {
        this.additionalAllowedCp = $.GREATER_THAN_SIGN;
        this.returnState = this.state;
        this.state = CHARACTER_REFERENCE_IN_ATTRIBUTE_VALUE_STATE;
    }

    else if (cp === $.GREATER_THAN_SIGN) {
        this.state = DATA_STATE;
        this._emitCurrentToken();
    }

    else if (cp === $.NULL)
        this.currentAttr.value += UNICODE.REPLACEMENT_CHARACTER;

    else if (cp === $.QUOTATION_MARK || cp === $.APOSTROPHE || cp === $.LESS_THAN_SIGN ||
             cp === $.EQUALS_SIGN || cp === $.GRAVE_ACCENT) {
        this.currentAttr.value += toChar(cp);
    }

    else if (cp === $.EOF)
        this._reconsumeInState(DATA_STATE);

    else
        this.currentAttr.value += toChar(cp);
};


//12.2.4.41 Character reference in attribute value state
//------------------------------------------------------------------
_[CHARACTER_REFERENCE_IN_ATTRIBUTE_VALUE_STATE] = function characterReferenceInAttributeValueState(cp) {
    var referencedCodePoints = this._consumeCharacterReference(cp, true);

    if (referencedCodePoints) {
        for (var i = 0; i < referencedCodePoints.length; i++)
            this.currentAttr.value += toChar(referencedCodePoints[i]);
    } else
        this.currentAttr.value += '&';

    this.state = this.returnState;
};


//12.2.4.42 After attribute value (quoted) state
//------------------------------------------------------------------
_[AFTER_ATTRIBUTE_VALUE_QUOTED_STATE] = function afterAttributeValueQuotedState(cp) {
    if (isWhitespace(cp))
        this.state = BEFORE_ATTRIBUTE_NAME_STATE;

    else if (cp === $.SOLIDUS)
        this.state = SELF_CLOSING_START_TAG_STATE;

    else if (cp === $.GREATER_THAN_SIGN) {
        this.state = DATA_STATE;
        this._emitCurrentToken();
    }

    else if (cp === $.EOF)
        this._reconsumeInState(DATA_STATE);

    else
        this._reconsumeInState(BEFORE_ATTRIBUTE_NAME_STATE);
};


//12.2.4.43 Self-closing start tag state
//------------------------------------------------------------------
_[SELF_CLOSING_START_TAG_STATE] = function selfClosingStartTagState(cp) {
    if (cp === $.GREATER_THAN_SIGN) {
        this.currentToken.selfClosing = true;
        this.state = DATA_STATE;
        this._emitCurrentToken();
    }

    else if (cp === $.EOF)
        this._reconsumeInState(DATA_STATE);

    else
        this._reconsumeInState(BEFORE_ATTRIBUTE_NAME_STATE);
};


//12.2.4.44 Bogus comment state
//------------------------------------------------------------------
_[BOGUS_COMMENT_STATE] = function bogusCommentState(cp) {
    this._createCommentToken();

    while (true) {
        if (cp === $.GREATER_THAN_SIGN) {
            this.state = DATA_STATE;
            break;
        }

        else if (cp === $.EOF) {
            this._reconsumeInState(DATA_STATE);
            break;
        }

        else {
            this.currentToken.data += cp === $.NULL ? UNICODE.REPLACEMENT_CHARACTER : toChar(cp);
            cp = this._consume();
        }
    }

    this._emitCurrentToken();
};


//12.2.4.45 Markup declaration open state
//------------------------------------------------------------------
_[MARKUP_DECLARATION_OPEN_STATE] = function markupDeclarationOpenState(cp) {
    if (this._consumeSubsequentIfMatch($$.DASH_DASH_STRING, cp, true)) {
        this._createCommentToken();
        this.state = COMMENT_START_STATE;
    }

    else if (this._consumeSubsequentIfMatch($$.DOCTYPE_STRING, cp, false))
        this.state = DOCTYPE_STATE;

    else if (this.allowCDATA && this._consumeSubsequentIfMatch($$.CDATA_START_STRING, cp, true))
        this.state = CDATA_SECTION_STATE;

    else {
        //NOTE: call bogus comment state directly with current consumed character to avoid unnecessary reconsumption.
        this[BOGUS_COMMENT_STATE](cp);
    }
};


//12.2.4.46 Comment start state
//------------------------------------------------------------------
_[COMMENT_START_STATE] = function commentStartState(cp) {
    if (cp === $.HYPHEN_MINUS)
        this.state = COMMENT_START_DASH_STATE;

    else if (cp === $.NULL) {
        this.currentToken.data += UNICODE.REPLACEMENT_CHARACTER;
        this.state = COMMENT_STATE;
    }

    else if (cp === $.GREATER_THAN_SIGN) {
        this.state = DATA_STATE;
        this._emitCurrentToken();
    }

    else if (cp === $.EOF) {
        this._emitCurrentToken();
        this._reconsumeInState(DATA_STATE);
    }

    else {
        this.currentToken.data += toChar(cp);
        this.state = COMMENT_STATE;
    }
};


//12.2.4.47 Comment start dash state
//------------------------------------------------------------------
_[COMMENT_START_DASH_STATE] = function commentStartDashState(cp) {
    if (cp === $.HYPHEN_MINUS)
        this.state = COMMENT_END_STATE;

    else if (cp === $.NULL) {
        this.currentToken.data += '-';
        this.currentToken.data += UNICODE.REPLACEMENT_CHARACTER;
        this.state = COMMENT_STATE;
    }

    else if (cp === $.GREATER_THAN_SIGN) {
        this.state = DATA_STATE;
        this._emitCurrentToken();
    }

    else if (cp === $.EOF) {
        this._emitCurrentToken();
        this._reconsumeInState(DATA_STATE);
    }

    else {
        this.currentToken.data += '-';
        this.currentToken.data += toChar(cp);
        this.state = COMMENT_STATE;
    }
};


//12.2.4.48 Comment state
//------------------------------------------------------------------
_[COMMENT_STATE] = function commentState(cp) {
    if (cp === $.HYPHEN_MINUS)
        this.state = COMMENT_END_DASH_STATE;

    else if (cp === $.NULL)
        this.currentToken.data += UNICODE.REPLACEMENT_CHARACTER;

    else if (cp === $.EOF) {
        this._emitCurrentToken();
        this._reconsumeInState(DATA_STATE);
    }

    else
        this.currentToken.data += toChar(cp);
};


//12.2.4.49 Comment end dash state
//------------------------------------------------------------------
_[COMMENT_END_DASH_STATE] = function commentEndDashState(cp) {
    if (cp === $.HYPHEN_MINUS)
        this.state = COMMENT_END_STATE;

    else if (cp === $.NULL) {
        this.currentToken.data += '-';
        this.currentToken.data += UNICODE.REPLACEMENT_CHARACTER;
        this.state = COMMENT_STATE;
    }

    else if (cp === $.EOF) {
        this._emitCurrentToken();
        this._reconsumeInState(DATA_STATE);
    }

    else {
        this.currentToken.data += '-';
        this.currentToken.data += toChar(cp);
        this.state = COMMENT_STATE;
    }
};


//12.2.4.50 Comment end state
//------------------------------------------------------------------
_[COMMENT_END_STATE] = function commentEndState(cp) {
    if (cp === $.GREATER_THAN_SIGN) {
        this.state = DATA_STATE;
        this._emitCurrentToken();
    }

    else if (cp === $.EXCLAMATION_MARK)
        this.state = COMMENT_END_BANG_STATE;

    else if (cp === $.HYPHEN_MINUS)
        this.currentToken.data += '-';

    else if (cp === $.NULL) {
        this.currentToken.data += '--';
        this.currentToken.data += UNICODE.REPLACEMENT_CHARACTER;
        this.state = COMMENT_STATE;
    }

    else if (cp === $.EOF) {
        this._reconsumeInState(DATA_STATE);
        this._emitCurrentToken();
    }

    else {
        this.currentToken.data += '--';
        this.currentToken.data += toChar(cp);
        this.state = COMMENT_STATE;
    }
};


//12.2.4.51 Comment end bang state
//------------------------------------------------------------------
_[COMMENT_END_BANG_STATE] = function commentEndBangState(cp) {
    if (cp === $.HYPHEN_MINUS) {
        this.currentToken.data += '--!';
        this.state = COMMENT_END_DASH_STATE;
    }

    else if (cp === $.GREATER_THAN_SIGN) {
        this.state = DATA_STATE;
        this._emitCurrentToken();
    }

    else if (cp === $.NULL) {
        this.currentToken.data += '--!';
        this.currentToken.data += UNICODE.REPLACEMENT_CHARACTER;
        this.state = COMMENT_STATE;
    }

    else if (cp === $.EOF) {
        this._emitCurrentToken();
        this._reconsumeInState(DATA_STATE);
    }

    else {
        this.currentToken.data += '--!';
        this.currentToken.data += toChar(cp);
        this.state = COMMENT_STATE;
    }
};


//12.2.4.52 DOCTYPE state
//------------------------------------------------------------------
_[DOCTYPE_STATE] = function doctypeState(cp) {
    if (isWhitespace(cp))
        this.state = BEFORE_DOCTYPE_NAME_STATE;

    else if (cp === $.EOF) {
        this._createDoctypeToken();
        this.currentToken.forceQuirks = true;
        this._emitCurrentToken();
        this._reconsumeInState(DATA_STATE);
    }

    else
        this._reconsumeInState(BEFORE_DOCTYPE_NAME_STATE);
};


//12.2.4.53 Before DOCTYPE name state
//------------------------------------------------------------------
_[BEFORE_DOCTYPE_NAME_STATE] = function beforeDoctypeNameState(cp) {
    if (isWhitespace(cp))
        return;

    if (isAsciiUpper(cp)) {
        this._createDoctypeToken(toAsciiLowerChar(cp));
        this.state = DOCTYPE_NAME_STATE;
    }

    else if (cp === $.GREATER_THAN_SIGN) {
        this._createDoctypeToken();
        this.currentToken.forceQuirks = true;
        this._emitCurrentToken();
        this.state = DATA_STATE;
    }

    else if (cp === $.EOF) {
        this._createDoctypeToken();
        this.currentToken.forceQuirks = true;
        this._emitCurrentToken();
        this._reconsumeInState(DATA_STATE);
    }

    else if (cp === $.NULL) {
        this._createDoctypeToken(UNICODE.REPLACEMENT_CHARACTER);
        this.state = DOCTYPE_NAME_STATE;
    }

    else {
        this._createDoctypeToken(toChar(cp));
        this.state = DOCTYPE_NAME_STATE;
    }
};


//12.2.4.54 DOCTYPE name state
//------------------------------------------------------------------
_[DOCTYPE_NAME_STATE] = function doctypeNameState(cp) {
    if (isWhitespace(cp))
        this.state = AFTER_DOCTYPE_NAME_STATE;

    else if (cp === $.GREATER_THAN_SIGN) {
        this._emitCurrentToken();
        this.state = DATA_STATE;
    }

    else if (isAsciiUpper(cp))
        this.currentToken.name += toAsciiLowerChar(cp);

    else if (cp === $.NULL)
        this.currentToken.name += UNICODE.REPLACEMENT_CHARACTER;

    else if (cp === $.EOF) {
        this.currentToken.forceQuirks = true;
        this._emitCurrentToken();
        this._reconsumeInState(DATA_STATE);
    }

    else
        this.currentToken.name += toChar(cp);
};


//12.2.4.55 After DOCTYPE name state
//------------------------------------------------------------------
_[AFTER_DOCTYPE_NAME_STATE] = function afterDoctypeNameState(cp) {
    if (isWhitespace(cp))
        return;

    if (cp === $.GREATER_THAN_SIGN) {
        this.state = DATA_STATE;
        this._emitCurrentToken();
    }

    else if (cp === $.EOF) {
        this.currentToken.forceQuirks = true;
        this._emitCurrentToken();
        this._reconsumeInState(DATA_STATE);
    }

    else if (this._consumeSubsequentIfMatch($$.PUBLIC_STRING, cp, false))
        this.state = AFTER_DOCTYPE_PUBLIC_KEYWORD_STATE;

    else if (this._consumeSubsequentIfMatch($$.SYSTEM_STRING, cp, false))
        this.state = AFTER_DOCTYPE_SYSTEM_KEYWORD_STATE;

    else {
        this.currentToken.forceQuirks = true;
        this.state = BOGUS_DOCTYPE_STATE;
    }
};


//12.2.4.56 After DOCTYPE public keyword state
//------------------------------------------------------------------
_[AFTER_DOCTYPE_PUBLIC_KEYWORD_STATE] = function afterDoctypePublicKeywordState(cp) {
    if (isWhitespace(cp))
        this.state = BEFORE_DOCTYPE_PUBLIC_IDENTIFIER_STATE;

    else if (cp === $.QUOTATION_MARK) {
        this.currentToken.publicId = '';
        this.state = DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED_STATE;
    }

    else if (cp === $.APOSTROPHE) {
        this.currentToken.publicId = '';
        this.state = DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED_STATE;
    }

    else if (cp === $.GREATER_THAN_SIGN) {
        this.currentToken.forceQuirks = true;
        this._emitCurrentToken();
        this.state = DATA_STATE;
    }

    else if (cp === $.EOF) {
        this.currentToken.forceQuirks = true;
        this._emitCurrentToken();
        this._reconsumeInState(DATA_STATE);
    }

    else {
        this.currentToken.forceQuirks = true;
        this.state = BOGUS_DOCTYPE_STATE;
    }
};


//12.2.4.57 Before DOCTYPE public identifier state
//------------------------------------------------------------------
_[BEFORE_DOCTYPE_PUBLIC_IDENTIFIER_STATE] = function beforeDoctypePublicIdentifierState(cp) {
    if (isWhitespace(cp))
        return;

    if (cp === $.QUOTATION_MARK) {
        this.currentToken.publicId = '';
        this.state = DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED_STATE;
    }

    else if (cp === $.APOSTROPHE) {
        this.currentToken.publicId = '';
        this.state = DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED_STATE;
    }

    else if (cp === $.GREATER_THAN_SIGN) {
        this.currentToken.forceQuirks = true;
        this._emitCurrentToken();
        this.state = DATA_STATE;
    }

    else if (cp === $.EOF) {
        this.currentToken.forceQuirks = true;
        this._emitCurrentToken();
        this._reconsumeInState(DATA_STATE);
    }

    else {
        this.currentToken.forceQuirks = true;
        this.state = BOGUS_DOCTYPE_STATE;
    }
};


//12.2.4.58 DOCTYPE public identifier (double-quoted) state
//------------------------------------------------------------------
_[DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED_STATE] = function doctypePublicIdentifierDoubleQuotedState(cp) {
    if (cp === $.QUOTATION_MARK)
        this.state = AFTER_DOCTYPE_PUBLIC_IDENTIFIER_STATE;

    else if (cp === $.NULL)
        this.currentToken.publicId += UNICODE.REPLACEMENT_CHARACTER;

    else if (cp === $.GREATER_THAN_SIGN) {
        this.currentToken.forceQuirks = true;
        this._emitCurrentToken();
        this.state = DATA_STATE;
    }

    else if (cp === $.EOF) {
        this.currentToken.forceQuirks = true;
        this._emitCurrentToken();
        this._reconsumeInState(DATA_STATE);
    }

    else
        this.currentToken.publicId += toChar(cp);
};


//12.2.4.59 DOCTYPE public identifier (single-quoted) state
//------------------------------------------------------------------
_[DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED_STATE] = function doctypePublicIdentifierSingleQuotedState(cp) {
    if (cp === $.APOSTROPHE)
        this.state = AFTER_DOCTYPE_PUBLIC_IDENTIFIER_STATE;

    else if (cp === $.NULL)
        this.currentToken.publicId += UNICODE.REPLACEMENT_CHARACTER;

    else if (cp === $.GREATER_THAN_SIGN) {
        this.currentToken.forceQuirks = true;
        this._emitCurrentToken();
        this.state = DATA_STATE;
    }

    else if (cp === $.EOF) {
        this.currentToken.forceQuirks = true;
        this._emitCurrentToken();
        this._reconsumeInState(DATA_STATE);
    }

    else
        this.currentToken.publicId += toChar(cp);
};


//12.2.4.60 After DOCTYPE public identifier state
//------------------------------------------------------------------
_[AFTER_DOCTYPE_PUBLIC_IDENTIFIER_STATE] = function afterDoctypePublicIdentifierState(cp) {
    if (isWhitespace(cp))
        this.state = BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS_STATE;

    else if (cp === $.GREATER_THAN_SIGN) {
        this._emitCurrentToken();
        this.state = DATA_STATE;
    }

    else if (cp === $.QUOTATION_MARK) {
        this.currentToken.systemId = '';
        this.state = DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED_STATE;
    }

    else if (cp === $.APOSTROPHE) {
        this.currentToken.systemId = '';
        this.state = DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED_STATE;
    }

    else if (cp === $.EOF) {
        this.currentToken.forceQuirks = true;
        this._emitCurrentToken();
        this._reconsumeInState(DATA_STATE);
    }

    else {
        this.currentToken.forceQuirks = true;
        this.state = BOGUS_DOCTYPE_STATE;
    }
};


//12.2.4.61 Between DOCTYPE public and system identifiers state
//------------------------------------------------------------------
_[BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS_STATE] = function betweenDoctypePublicAndSystemIdentifiersState(cp) {
    if (isWhitespace(cp))
        return;

    if (cp === $.GREATER_THAN_SIGN) {
        this._emitCurrentToken();
        this.state = DATA_STATE;
    }

    else if (cp === $.QUOTATION_MARK) {
        this.currentToken.systemId = '';
        this.state = DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED_STATE;
    }


    else if (cp === $.APOSTROPHE) {
        this.currentToken.systemId = '';
        this.state = DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED_STATE;
    }

    else if (cp === $.EOF) {
        this.currentToken.forceQuirks = true;
        this._emitCurrentToken();
        this._reconsumeInState(DATA_STATE);
    }

    else {
        this.currentToken.forceQuirks = true;
        this.state = BOGUS_DOCTYPE_STATE;
    }
};


//12.2.4.62 After DOCTYPE system keyword state
//------------------------------------------------------------------
_[AFTER_DOCTYPE_SYSTEM_KEYWORD_STATE] = function afterDoctypeSystemKeywordState(cp) {
    if (isWhitespace(cp))
        this.state = BEFORE_DOCTYPE_SYSTEM_IDENTIFIER_STATE;

    else if (cp === $.QUOTATION_MARK) {
        this.currentToken.systemId = '';
        this.state = DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED_STATE;
    }

    else if (cp === $.APOSTROPHE) {
        this.currentToken.systemId = '';
        this.state = DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED_STATE;
    }

    else if (cp === $.GREATER_THAN_SIGN) {
        this.currentToken.forceQuirks = true;
        this._emitCurrentToken();
        this.state = DATA_STATE;
    }

    else if (cp === $.EOF) {
        this.currentToken.forceQuirks = true;
        this._emitCurrentToken();
        this._reconsumeInState(DATA_STATE);
    }

    else {
        this.currentToken.forceQuirks = true;
        this.state = BOGUS_DOCTYPE_STATE;
    }
};


//12.2.4.63 Before DOCTYPE system identifier state
//------------------------------------------------------------------
_[BEFORE_DOCTYPE_SYSTEM_IDENTIFIER_STATE] = function beforeDoctypeSystemIdentifierState(cp) {
    if (isWhitespace(cp))
        return;

    if (cp === $.QUOTATION_MARK) {
        this.currentToken.systemId = '';
        this.state = DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED_STATE;
    }

    else if (cp === $.APOSTROPHE) {
        this.currentToken.systemId = '';
        this.state = DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED_STATE;
    }

    else if (cp === $.GREATER_THAN_SIGN) {
        this.currentToken.forceQuirks = true;
        this._emitCurrentToken();
        this.state = DATA_STATE;
    }

    else if (cp === $.EOF) {
        this.currentToken.forceQuirks = true;
        this._emitCurrentToken();
        this._reconsumeInState(DATA_STATE);
    }

    else {
        this.currentToken.forceQuirks = true;
        this.state = BOGUS_DOCTYPE_STATE;
    }
};


//12.2.4.64 DOCTYPE system identifier (double-quoted) state
//------------------------------------------------------------------
_[DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED_STATE] = function doctypeSystemIdentifierDoubleQuotedState(cp) {
    if (cp === $.QUOTATION_MARK)
        this.state = AFTER_DOCTYPE_SYSTEM_IDENTIFIER_STATE;

    else if (cp === $.GREATER_THAN_SIGN) {
        this.currentToken.forceQuirks = true;
        this._emitCurrentToken();
        this.state = DATA_STATE;
    }

    else if (cp === $.NULL)
        this.currentToken.systemId += UNICODE.REPLACEMENT_CHARACTER;

    else if (cp === $.EOF) {
        this.currentToken.forceQuirks = true;
        this._emitCurrentToken();
        this._reconsumeInState(DATA_STATE);
    }

    else
        this.currentToken.systemId += toChar(cp);
};


//12.2.4.65 DOCTYPE system identifier (single-quoted) state
//------------------------------------------------------------------
_[DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED_STATE] = function doctypeSystemIdentifierSingleQuotedState(cp) {
    if (cp === $.APOSTROPHE)
        this.state = AFTER_DOCTYPE_SYSTEM_IDENTIFIER_STATE;

    else if (cp === $.GREATER_THAN_SIGN) {
        this.currentToken.forceQuirks = true;
        this._emitCurrentToken();
        this.state = DATA_STATE;
    }

    else if (cp === $.NULL)
        this.currentToken.systemId += UNICODE.REPLACEMENT_CHARACTER;

    else if (cp === $.EOF) {
        this.currentToken.forceQuirks = true;
        this._emitCurrentToken();
        this._reconsumeInState(DATA_STATE);
    }

    else
        this.currentToken.systemId += toChar(cp);
};


//12.2.4.66 After DOCTYPE system identifier state
//------------------------------------------------------------------
_[AFTER_DOCTYPE_SYSTEM_IDENTIFIER_STATE] = function afterDoctypeSystemIdentifierState(cp) {
    if (isWhitespace(cp))
        return;

    if (cp === $.GREATER_THAN_SIGN) {
        this._emitCurrentToken();
        this.state = DATA_STATE;
    }

    else if (cp === $.EOF) {
        this.currentToken.forceQuirks = true;
        this._emitCurrentToken();
        this._reconsumeInState(DATA_STATE);
    }

    else
        this.state = BOGUS_DOCTYPE_STATE;
};


//12.2.4.67 Bogus DOCTYPE state
//------------------------------------------------------------------
_[BOGUS_DOCTYPE_STATE] = function bogusDoctypeState(cp) {
    if (cp === $.GREATER_THAN_SIGN) {
        this._emitCurrentToken();
        this.state = DATA_STATE;
    }

    else if (cp === $.EOF) {
        this._emitCurrentToken();
        this._reconsumeInState(DATA_STATE);
    }
};


//12.2.4.68 CDATA section state
//------------------------------------------------------------------
_[CDATA_SECTION_STATE] = function cdataSectionState(cp) {
    while (true) {
        if (cp === $.EOF) {
            this._reconsumeInState(DATA_STATE);
            break;
        }

        else if (this._consumeSubsequentIfMatch($$.CDATA_END_STRING, cp, true)) {
            this.state = DATA_STATE;
            break;
        }

        else {
            this._emitCodePoint(cp);
            cp = this._consume();
        }
    }
};

},{"../common/unicode":9,"./location_info_mixin":16,"./named_entity_trie":17,"./preprocessor":18}],20:[function(require,module,exports){
'use strict';

//Node construction
exports.createDocument = function () {
    return {
        nodeName: '#document',
        quirksMode: false,
        childNodes: []
    };
};

exports.createDocumentFragment = function () {
    return {
        nodeName: '#document-fragment',
        quirksMode: false,
        childNodes: []
    };
};

exports.createElement = function (tagName, namespaceURI, attrs) {
    return {
        nodeName: tagName,
        tagName: tagName,
        attrs: attrs,
        namespaceURI: namespaceURI,
        childNodes: [],
        parentNode: null
    };
};

exports.createCommentNode = function (data) {
    return {
        nodeName: '#comment',
        data: data,
        parentNode: null
    };
};

var createTextNode = function (value) {
    return {
        nodeName: '#text',
        value: value,
        parentNode: null
    }
};


//Tree mutation
exports.setDocumentType = function (document, name, publicId, systemId) {
    var doctypeNode = null;

    for (var i = 0; i < document.childNodes.length; i++) {
        if (document.childNodes[i].nodeName === '#documentType') {
            doctypeNode = document.childNodes[i];
            break;
        }
    }

    if (doctypeNode) {
        doctypeNode.name = name;
        doctypeNode.publicId = publicId;
        doctypeNode.systemId = systemId;
    }

    else {
        appendChild(document, {
            nodeName: '#documentType',
            name: name,
            publicId: publicId,
            systemId: systemId
        });
    }
};

exports.setQuirksMode = function (document) {
    document.quirksMode = true;
};

exports.isQuirksMode = function (document) {
    return document.quirksMode;
};

var appendChild = exports.appendChild = function (parentNode, newNode) {
    parentNode.childNodes.push(newNode);
    newNode.parentNode = parentNode;
};

var insertBefore = exports.insertBefore = function (parentNode, newNode, referenceNode) {
    var insertionIdx = parentNode.childNodes.indexOf(referenceNode);

    parentNode.childNodes.splice(insertionIdx, 0, newNode);
    newNode.parentNode = parentNode;
};

exports.detachNode = function (node) {
    if (node.parentNode) {
        var idx = node.parentNode.childNodes.indexOf(node);

        node.parentNode.childNodes.splice(idx, 1);
        node.parentNode = null;
    }
};

exports.insertText = function (parentNode, text) {
    if (parentNode.childNodes.length) {
        var prevNode = parentNode.childNodes[parentNode.childNodes.length - 1];

        if (prevNode.nodeName === '#text') {
            prevNode.value += text;
            return;
        }
    }

    appendChild(parentNode, createTextNode(text));
};

exports.insertTextBefore = function (parentNode, text, referenceNode) {
    var prevNode = parentNode.childNodes[parentNode.childNodes.indexOf(referenceNode) - 1];

    if (prevNode && prevNode.nodeName === '#text')
        prevNode.value += text;
    else
        insertBefore(parentNode, createTextNode(text), referenceNode);
};

exports.adoptAttributes = function (recipientNode, attrs) {
    var recipientAttrsMap = [];

    for (var i = 0; i < recipientNode.attrs.length; i++)
        recipientAttrsMap.push(recipientNode.attrs[i].name);

    for (var j = 0; j < attrs.length; j++) {
        if (recipientAttrsMap.indexOf(attrs[j].name) === -1)
            recipientNode.attrs.push(attrs[j]);
    }
};


//Tree traversing
exports.getFirstChild = function (node) {
    return node.childNodes[0];
};

exports.getChildNodes = function (node) {
    return node.childNodes;
};

exports.getParentNode = function (node) {
    return node.parentNode;
};

exports.getAttrList = function (node) {
    return node.attrs;
};

//Node data
exports.getTagName = function (element) {
    return element.tagName;
};

exports.getNamespaceURI = function (element) {
    return element.namespaceURI;
};

exports.getTextNodeContent = function (textNode) {
    return textNode.value;
};

exports.getCommentNodeContent = function (commentNode) {
    return commentNode.data;
};

exports.getDocumentTypeNodeName = function (doctypeNode) {
    return doctypeNode.name;
};

exports.getDocumentTypeNodePublicId = function (doctypeNode) {
    return doctypeNode.publicId;
};

exports.getDocumentTypeNodeSystemId = function (doctypeNode) {
    return doctypeNode.systemId;
};

//Node types
exports.isTextNode = function (node) {
    return node.nodeName === '#text';
};

exports.isCommentNode = function (node) {
    return node.nodeName === '#comment';
};

exports.isDocumentTypeNode = function (node) {
    return node.nodeName === '#documentType';
};

exports.isElementNode = function (node) {
    return !!node.tagName;
};

},{}],21:[function(require,module,exports){
'use strict';

var Doctype = require('../common/doctype');

//Conversion tables for DOM Level1 structure emulation
var nodeTypes = {
    element: 1,
    text: 3,
    cdata: 4,
    comment: 8
};

var nodePropertyShorthands = {
    tagName: 'name',
    childNodes: 'children',
    parentNode: 'parent',
    previousSibling: 'prev',
    nextSibling: 'next',
    nodeValue: 'data'
};

//Node
var Node = function (props) {
    for (var key in props) {
        if (props.hasOwnProperty(key))
            this[key] = props[key];
    }
};

Node.prototype = {
    get firstChild() {
        var children = this.children;
        return children && children[0] || null;
    },

    get lastChild() {
        var children = this.children;
        return children && children[children.length - 1] || null;
    },

    get nodeType() {
        return nodeTypes[this.type] || nodeTypes.element;
    }
};

Object.keys(nodePropertyShorthands).forEach(function (key) {
    var shorthand = nodePropertyShorthands[key];

    Object.defineProperty(Node.prototype, key, {
        get: function () {
            return this[shorthand] || null;
        },
        set: function (val) {
            this[shorthand] = val;
            return val;
        }
    });
});


//Node construction
exports.createDocument =
exports.createDocumentFragment = function () {
    return new Node({
        type: 'root',
        name: 'root',
        parent: null,
        prev: null,
        next: null,
        children: []
    });
};

exports.createElement = function (tagName, namespaceURI, attrs) {
    var attribs = {},
        attribsNamespace = {},
        attribsPrefix = {};

    for (var i = 0; i < attrs.length; i++) {
        var attrName = attrs[i].name;

        attribs[attrName] = attrs[i].value;
        attribsNamespace[attrName] = attrs[i].namespace;
        attribsPrefix[attrName] = attrs[i].prefix;
    }

    return new Node({
        type: tagName === 'script' || tagName === 'style' ? tagName : 'tag',
        name: tagName,
        namespace: namespaceURI,
        attribs: attribs,
        'x-attribsNamespace': attribsNamespace,
        'x-attribsPrefix': attribsPrefix,
        children: [],
        parent: null,
        prev: null,
        next: null
    });
};

exports.createCommentNode = function (data) {
    return new Node({
        type: 'comment',
        data: data,
        parent: null,
        prev: null,
        next: null
    });
};

var createTextNode = function (value) {
    return new Node({
        type: 'text',
        data: value,
        parent: null,
        prev: null,
        next: null
    });
};


//Tree mutation
exports.setDocumentType = function (document, name, publicId, systemId) {
    var data = Doctype.serializeContent(name, publicId, systemId),
        doctypeNode = null;

    for (var i = 0; i < document.children.length; i++) {
        if (document.children[i].type === 'directive' && document.children[i].name === '!doctype') {
            doctypeNode = document.children[i];
            break;
        }
    }

    if (doctypeNode) {
        doctypeNode.data = data;
        doctypeNode['x-name'] = name;
        doctypeNode['x-publicId'] = publicId;
        doctypeNode['x-systemId'] = systemId;
    }

    else {
        appendChild(document, new Node({
            type: 'directive',
            name: '!doctype',
            data: data,
            'x-name': name,
            'x-publicId': publicId,
            'x-systemId': systemId
        }));
    }

};

exports.setQuirksMode = function (document) {
    document.quirksMode = true;
};

exports.isQuirksMode = function (document) {
    return document.quirksMode;
};

var appendChild = exports.appendChild = function (parentNode, newNode) {
    var prev = parentNode.children[parentNode.children.length - 1];

    if (prev) {
        prev.next = newNode;
        newNode.prev = prev;
    }

    parentNode.children.push(newNode);
    newNode.parent = parentNode;
};

var insertBefore = exports.insertBefore = function (parentNode, newNode, referenceNode) {
    var insertionIdx = parentNode.children.indexOf(referenceNode),
        prev = referenceNode.prev;

    if (prev) {
        prev.next = newNode;
        newNode.prev = prev;
    }

    referenceNode.prev = newNode;
    newNode.next = referenceNode;

    parentNode.children.splice(insertionIdx, 0, newNode);
    newNode.parent = parentNode;
};

exports.detachNode = function (node) {
    if (node.parent) {
        var idx = node.parent.children.indexOf(node),
            prev = node.prev,
            next = node.next;

        node.prev = null;
        node.next = null;

        if (prev)
            prev.next = next;

        if (next)
            next.prev = prev;

        node.parent.children.splice(idx, 1);
        node.parent = null;
    }
};

exports.insertText = function (parentNode, text) {
    var lastChild = parentNode.children[parentNode.children.length - 1];

    if (lastChild && lastChild.type === 'text')
        lastChild.data += text;
    else
        appendChild(parentNode, createTextNode(text));
};

exports.insertTextBefore = function (parentNode, text, referenceNode) {
    var prevNode = parentNode.children[parentNode.children.indexOf(referenceNode) - 1];

    if (prevNode && prevNode.type === 'text')
        prevNode.data += text;
    else
        insertBefore(parentNode, createTextNode(text), referenceNode);
};

exports.adoptAttributes = function (recipientNode, attrs) {
    for (var i = 0; i < attrs.length; i++) {
        var attrName = attrs[i].name;

        if (typeof recipientNode.attribs[attrName] === 'undefined') {
            recipientNode.attribs[attrName] = attrs[i].value;
            recipientNode['x-attribsNamespace'][attrName] = attrs[i].namespace;
            recipientNode['x-attribsPrefix'][attrName] = attrs[i].prefix;
        }
    }
};


//Tree traversing
exports.getFirstChild = function (node) {
    return node.children[0];
};

exports.getChildNodes = function (node) {
    return node.children;
};

exports.getParentNode = function (node) {
    return node.parent;
};

exports.getAttrList = function (node) {
    var attrList = [];

    for (var name in node.attribs) {
        if (node.attribs.hasOwnProperty(name)) {
            attrList.push({
                name: name,
                value: node.attribs[name],
                namespace: node['x-attribsNamespace'][name],
                prefix: node['x-attribsPrefix'][name]
            });
        }
    }

    return attrList;
};


//Node data
exports.getTagName = function (element) {
    return element.name;
};

exports.getNamespaceURI = function (element) {
    return element.namespace;
};

exports.getTextNodeContent = function (textNode) {
    return textNode.data;
};

exports.getCommentNodeContent = function (commentNode) {
    return commentNode.data;
};

exports.getDocumentTypeNodeName = function (doctypeNode) {
    return doctypeNode['x-name'];
};

exports.getDocumentTypeNodePublicId = function (doctypeNode) {
    return doctypeNode['x-publicId'];
};

exports.getDocumentTypeNodeSystemId = function (doctypeNode) {
    return doctypeNode['x-systemId'];
};


//Node types
exports.isTextNode = function (node) {
    return node.type === 'text';
};

exports.isCommentNode = function (node) {
    return node.type === 'comment';
};

exports.isDocumentTypeNode = function (node) {
    return node.type === 'directive' && node.name === '!doctype';
};

exports.isElementNode = function (node) {
    return !!node.attribs;
};

},{"../common/doctype":6}],22:[function(require,module,exports){
'use strict';

//Const
var NOAH_ARK_CAPACITY = 3;

//List of formatting elements
var FormattingElementList = module.exports = function (treeAdapter) {
    this.length = 0;
    this.entries = [];
    this.treeAdapter = treeAdapter;
    this.bookmark = null;
};

//Entry types
FormattingElementList.MARKER_ENTRY = 'MARKER_ENTRY';
FormattingElementList.ELEMENT_ENTRY = 'ELEMENT_ENTRY';

//Noah Ark's condition
//OPTIMIZATION: at first we try to find possible candidates for exclusion using
//lightweight heuristics without thorough attributes check.
FormattingElementList.prototype._getNoahArkConditionCandidates = function (newElement) {
    var candidates = [];

    if (this.length >= NOAH_ARK_CAPACITY) {
        var neAttrsLength = this.treeAdapter.getAttrList(newElement).length,
            neTagName = this.treeAdapter.getTagName(newElement),
            neNamespaceURI = this.treeAdapter.getNamespaceURI(newElement);

        for (var i = this.length - 1; i >= 0; i--) {
            var entry = this.entries[i];

            if (entry.type === FormattingElementList.MARKER_ENTRY)
                break;

            var element = entry.element,
                elementAttrs = this.treeAdapter.getAttrList(element);

            if (this.treeAdapter.getTagName(element) === neTagName &&
                this.treeAdapter.getNamespaceURI(element) === neNamespaceURI &&
                elementAttrs.length === neAttrsLength) {
                candidates.push({idx: i, attrs: elementAttrs});
            }
        }
    }

    return candidates.length < NOAH_ARK_CAPACITY ? [] : candidates;
};

FormattingElementList.prototype._ensureNoahArkCondition = function (newElement) {
    var candidates = this._getNoahArkConditionCandidates(newElement),
        cLength = candidates.length;

    if (cLength) {
        var neAttrs = this.treeAdapter.getAttrList(newElement),
            neAttrsLength = neAttrs.length,
            neAttrsMap = {};

        //NOTE: build attrs map for the new element so we can perform fast lookups
        for (var i = 0; i < neAttrsLength; i++) {
            var neAttr = neAttrs[i];

            neAttrsMap[neAttr.name] = neAttr.value;
        }

        for (var i = 0; i < neAttrsLength; i++) {
            for (var j = 0; j < cLength; j++) {
                var cAttr = candidates[j].attrs[i];

                if (neAttrsMap[cAttr.name] !== cAttr.value) {
                    candidates.splice(j, 1);
                    cLength--;
                }

                if (candidates.length < NOAH_ARK_CAPACITY)
                    return;
            }
        }

        //NOTE: remove bottommost candidates until Noah's Ark condition will not be met
        for (var i = cLength - 1; i >= NOAH_ARK_CAPACITY - 1; i--) {
            this.entries.splice(candidates[i].idx, 1);
            this.length--;
        }
    }
};

//Mutations
FormattingElementList.prototype.insertMarker = function () {
    this.entries.push({type: FormattingElementList.MARKER_ENTRY});
    this.length++;
};

FormattingElementList.prototype.pushElement = function (element, token) {
    this._ensureNoahArkCondition(element);

    this.entries.push({
        type: FormattingElementList.ELEMENT_ENTRY,
        element: element,
        token: token
    });

    this.length++;
};

FormattingElementList.prototype.insertElementAfterBookmark = function (element, token) {
    var bookmarkIdx = this.length - 1;

    for (; bookmarkIdx >= 0; bookmarkIdx--) {
        if (this.entries[bookmarkIdx] === this.bookmark)
            break;
    }

    this.entries.splice(bookmarkIdx + 1, 0, {
        type: FormattingElementList.ELEMENT_ENTRY,
        element: element,
        token: token
    });

    this.length++;
};

FormattingElementList.prototype.removeEntry = function (entry) {
    for (var i = this.length - 1; i >= 0; i--) {
        if (this.entries[i] === entry) {
            this.entries.splice(i, 1);
            this.length--;
            break;
        }
    }
};

FormattingElementList.prototype.clearToLastMarker = function () {
    while (this.length) {
        var entry = this.entries.pop();

        this.length--;

        if (entry.type === FormattingElementList.MARKER_ENTRY)
            break;
    }
};

//Search
FormattingElementList.prototype.getElementEntryInScopeWithTagName = function (tagName) {
    for (var i = this.length - 1; i >= 0; i--) {
        var entry = this.entries[i];

        if (entry.type === FormattingElementList.MARKER_ENTRY)
            return null;

        if (this.treeAdapter.getTagName(entry.element) === tagName)
            return entry;
    }

    return null;
};

FormattingElementList.prototype.getElementEntry = function (element) {
    for (var i = this.length - 1; i >= 0; i--) {
        var entry = this.entries[i];

        if (entry.type === FormattingElementList.ELEMENT_ENTRY && entry.element == element)
            return entry;
    }

    return null;
};

},{}],23:[function(require,module,exports){
'use strict';

var OpenElementStack = require('./open_element_stack'),
    Tokenizer = require('../tokenization/tokenizer'),
    HTML = require('../common/html');


//Aliases
var $ = HTML.TAG_NAMES;


function setEndLocation(element, closingToken, treeAdapter) {
    var loc = element.__location;

    if (!loc)
        return;

    if (!loc.startTag) {
        loc.startTag = {
            start: loc.start,
            end: loc.end
        };
    }

    if (closingToken.location) {
        var tn = treeAdapter.getTagName(element),
            // NOTE: For cases like <p> <p> </p> - First 'p' closes without a closing tag and
            // for cases like <td> <p> </td> - 'p' closes without a closing tag
            isClosingEndTag = closingToken.type === Tokenizer.END_TAG_TOKEN &&
                              tn === closingToken.tagName;

        if (isClosingEndTag) {
            loc.endTag = {
                start: closingToken.location.start,
                end: closingToken.location.end
            };
        }

        loc.end = closingToken.location.end;
    }
}

//NOTE: patch open elements stack, so we can assign end location for the elements
function patchOpenElementsStack(stack, parser) {
    var treeAdapter = parser.treeAdapter;

    stack.pop = function () {
        setEndLocation(this.current, parser.currentToken, treeAdapter);
        OpenElementStack.prototype.pop.call(this);
    };

    stack.popAllUpToHtmlElement = function () {
        for (var i = this.stackTop; i > 0; i--)
            setEndLocation(this.items[i], parser.currentToken, treeAdapter);

        OpenElementStack.prototype.popAllUpToHtmlElement.call(this);
    };

    stack.remove = function (element) {
        setEndLocation(element, parser.currentToken, treeAdapter);
        OpenElementStack.prototype.remove.call(this, element);
    };
}

exports.assign = function (parser) {
    //NOTE: obtain Parser proto this way to avoid module circular references
    var parserProto = Object.getPrototypeOf(parser),
        treeAdapter = parser.treeAdapter;


    //NOTE: patch _reset method
    parser._reset = function (html, document, fragmentContext) {
        parserProto._reset.call(this, html, document, fragmentContext);

        this.attachableElementLocation = null;
        this.lastFosterParentingLocation = null;
        this.currentToken = null;

        patchOpenElementsStack(this.openElements, parser);
    };

    parser._processTokenInForeignContent = function (token) {
        this.currentToken = token;
        parserProto._processTokenInForeignContent.call(this, token);
    };

    parser._processToken = function (token) {
        this.currentToken = token;
        parserProto._processToken.call(this, token);

        //NOTE: <body> and <html> are never popped from the stack, so we need to updated
        //their end location explicitly.
        if (token.type === Tokenizer.END_TAG_TOKEN &&
            (token.tagName === $.HTML ||
            (token.tagName === $.BODY && this.openElements.hasInScope($.BODY)))) {
            for (var i = this.openElements.stackTop; i >= 0; i--) {
                var element = this.openElements.items[i];

                if (this.treeAdapter.getTagName(element) === token.tagName) {
                    setEndLocation(element, token, treeAdapter);
                    break;
                }
            }
        }
    };

    //Doctype
    parser._setDocumentType = function (token) {
        parserProto._setDocumentType.call(this, token);

        var documentChildren = this.treeAdapter.getChildNodes(this.document),
            cnLength = documentChildren.length;

        for (var i = 0; i < cnLength; i++) {
            var node = documentChildren[i];

            if (this.treeAdapter.isDocumentTypeNode(node)) {
                node.__location = token.location;
                break;
            }
        }
    };

    //Elements
    parser._attachElementToTree = function (element) {
        //NOTE: _attachElementToTree is called from _appendElement, _insertElement and _insertTemplate methods.
        //So we will use token location stored in this methods for the element.
        element.__location = this.attachableElementLocation || null;
        this.attachableElementLocation = null;
        parserProto._attachElementToTree.call(this, element);
    };

    parser._appendElement = function (token, namespaceURI) {
        this.attachableElementLocation = token.location;
        parserProto._appendElement.call(this, token, namespaceURI);
    };

    parser._insertElement = function (token, namespaceURI) {
        this.attachableElementLocation = token.location;
        parserProto._insertElement.call(this, token, namespaceURI);
    };

    parser._insertTemplate = function (token) {
        this.attachableElementLocation = token.location;
        parserProto._insertTemplate.call(this, token);

        var tmplContent = this.treeAdapter.getChildNodes(this.openElements.current)[0];

        tmplContent.__location = null;
    };

    parser._insertFakeRootElement = function () {
        parserProto._insertFakeRootElement.call(this);
        this.openElements.current.__location = null;
    };

    //Comments
    parser._appendCommentNode = function (token, parent) {
        parserProto._appendCommentNode.call(this, token, parent);

        var children = this.treeAdapter.getChildNodes(parent),
            commentNode = children[children.length - 1];

        commentNode.__location = token.location;
    };

    //Text
    parser._findFosterParentingLocation = function () {
        //NOTE: store last foster parenting location, so we will be able to find inserted text
        //in case of foster parenting
        this.lastFosterParentingLocation = parserProto._findFosterParentingLocation.call(this);
        return this.lastFosterParentingLocation;
    };

    parser._insertCharacters = function (token) {
        parserProto._insertCharacters.call(this, token);

        var hasFosterParent = this._shouldFosterParentOnInsertion(),
            parentingLocation = this.lastFosterParentingLocation,
            parent = (hasFosterParent && parentingLocation.parent) ||
                     this.openElements.currentTmplContent ||
                     this.openElements.current,
            siblings = this.treeAdapter.getChildNodes(parent),
            textNodeIdx = hasFosterParent && parentingLocation.beforeElement ?
                          siblings.indexOf(parentingLocation.beforeElement) - 1 :
                          siblings.length - 1,
            textNode = siblings[textNodeIdx];

        //NOTE: if we have location assigned by another token, then just update end position
        if (textNode.__location)
            textNode.__location.end = token.location.end;

        else
            textNode.__location = token.location;
    };
};


},{"../common/html":8,"../tokenization/tokenizer":19,"./open_element_stack":24}],24:[function(require,module,exports){
'use strict';

var HTML = require('../common/html');

//Aliases
var $ = HTML.TAG_NAMES,
    NS = HTML.NAMESPACES;

//Element utils

//OPTIMIZATION: Integer comparisons are low-cost, so we can use very fast tag name length filters here.
//It's faster than using dictionary.
function isImpliedEndTagRequired(tn) {
    switch (tn.length) {
        case 1:
            return tn === $.P;

        case 2:
            return tn === $.RP || tn === $.RT || tn === $.DD || tn === $.DT || tn === $.LI;

        case 6:
            return tn === $.OPTION;

        case 8:
            return tn === $.OPTGROUP;
    }

    return false;
}

function isScopingElement(tn, ns) {
    switch (tn.length) {
        case 2:
            if (tn === $.TD || tn === $.TH)
                return ns === NS.HTML;

            else if (tn === $.MI || tn === $.MO || tn == $.MN || tn === $.MS)
                return ns === NS.MATHML;

            break;

        case 4:
            if (tn === $.HTML)
                return ns === NS.HTML;

            else if (tn === $.DESC)
                return ns === NS.SVG;

            break;

        case 5:
            if (tn === $.TABLE)
                return ns === NS.HTML;

            else if (tn === $.MTEXT)
                return ns === NS.MATHML;

            else if (tn === $.TITLE)
                return ns === NS.SVG;

            break;

        case 6:
            return (tn === $.APPLET || tn === $.OBJECT) && ns === NS.HTML;

        case 7:
            return (tn === $.CAPTION || tn === $.MARQUEE) && ns === NS.HTML;

        case 8:
            return tn === $.TEMPLATE && ns === NS.HTML;

        case 13:
            return tn === $.FOREIGN_OBJECT && ns === NS.SVG;

        case 14:
            return tn === $.ANNOTATION_XML && ns === NS.MATHML;
    }

    return false;
}

//Stack of open elements
var OpenElementStack = module.exports = function (document, treeAdapter) {
    this.stackTop = -1;
    this.items = [];
    this.current = document;
    this.currentTagName = null;
    this.currentTmplContent = null;
    this.tmplCount = 0;
    this.treeAdapter = treeAdapter;
};

//Index of element
OpenElementStack.prototype._indexOf = function (element) {
    var idx = -1;

    for (var i = this.stackTop; i >= 0; i--) {
        if (this.items[i] === element) {
            idx = i;
            break;
        }
    }
    return idx;
};

//Update current element
OpenElementStack.prototype._isInTemplate = function () {
    if (this.currentTagName !== $.TEMPLATE)
        return false;

    return this.treeAdapter.getNamespaceURI(this.current) === NS.HTML;
};

OpenElementStack.prototype._updateCurrentElement = function () {
    this.current = this.items[this.stackTop];
    this.currentTagName = this.current && this.treeAdapter.getTagName(this.current);

    this.currentTmplContent = this._isInTemplate() ? this.treeAdapter.getChildNodes(this.current)[0] : null;
};

//Mutations
OpenElementStack.prototype.push = function (element) {
    this.items[++this.stackTop] = element;
    this._updateCurrentElement();

    if (this._isInTemplate())
        this.tmplCount++;

};

OpenElementStack.prototype.pop = function () {
    this.stackTop--;

    if (this.tmplCount > 0 && this._isInTemplate())
        this.tmplCount--;

    this._updateCurrentElement();
};

OpenElementStack.prototype.replace = function (oldElement, newElement) {
    var idx = this._indexOf(oldElement);
    this.items[idx] = newElement;

    if (idx === this.stackTop)
        this._updateCurrentElement();
};

OpenElementStack.prototype.insertAfter = function (referenceElement, newElement) {
    var insertionIdx = this._indexOf(referenceElement) + 1;

    this.items.splice(insertionIdx, 0, newElement);

    if (insertionIdx == ++this.stackTop)
        this._updateCurrentElement();
};

OpenElementStack.prototype.popUntilTagNamePopped = function (tagName) {
    while (this.stackTop > -1) {
        var tn = this.currentTagName;

        this.pop();

        if (tn === tagName)
            break;
    }
};

OpenElementStack.prototype.popUntilTemplatePopped = function () {
    while (this.stackTop > -1) {
        var tn = this.currentTagName,
            ns = this.treeAdapter.getNamespaceURI(this.current);

        this.pop();

        if (tn === $.TEMPLATE && ns === NS.HTML)
            break;
    }
};

OpenElementStack.prototype.popUntilElementPopped = function (element) {
    while (this.stackTop > -1) {
        var poppedElement = this.current;

        this.pop();

        if (poppedElement === element)
            break;
    }
};

OpenElementStack.prototype.popUntilNumberedHeaderPopped = function () {
    while (this.stackTop > -1) {
        var tn = this.currentTagName;

        this.pop();

        if (tn === $.H1 || tn === $.H2 || tn === $.H3 || tn === $.H4 || tn === $.H5 || tn === $.H6)
            break;
    }
};

OpenElementStack.prototype.popAllUpToHtmlElement = function () {
    //NOTE: here we assume that root <html> element is always first in the open element stack, so
    //we perform this fast stack clean up.
    this.stackTop = 0;
    this._updateCurrentElement();
};

OpenElementStack.prototype.clearBackToTableContext = function () {
    while (this.currentTagName !== $.TABLE && this.currentTagName !== $.TEMPLATE && this.currentTagName !== $.HTML)
        this.pop();
};

OpenElementStack.prototype.clearBackToTableBodyContext = function () {
    while (this.currentTagName !== $.TBODY && this.currentTagName !== $.TFOOT &&
           this.currentTagName !== $.THEAD && this.currentTagName !== $.TEMPLATE &&
           this.currentTagName !== $.HTML) {
        this.pop();
    }
};

OpenElementStack.prototype.clearBackToTableRowContext = function () {
    while (this.currentTagName !== $.TR && this.currentTagName !== $.TEMPLATE && this.currentTagName !== $.HTML)
        this.pop();
};

OpenElementStack.prototype.remove = function (element) {
    for (var i = this.stackTop; i >= 0; i--) {
        if (this.items[i] === element) {
            this.items.splice(i, 1);
            this.stackTop--;
            this._updateCurrentElement();
            break;
        }
    }
};

//Search
OpenElementStack.prototype.tryPeekProperlyNestedBodyElement = function () {
    //Properly nested <body> element (should be second element in stack).
    var element = this.items[1];
    return element && this.treeAdapter.getTagName(element) === $.BODY ? element : null;
};

OpenElementStack.prototype.contains = function (element) {
    return this._indexOf(element) > -1;
};

OpenElementStack.prototype.getCommonAncestor = function (element) {
    var elementIdx = this._indexOf(element);

    return --elementIdx >= 0 ? this.items[elementIdx] : null;
};

OpenElementStack.prototype.isRootHtmlElementCurrent = function () {
    return this.stackTop === 0 && this.currentTagName === $.HTML;
};

//Element in scope
OpenElementStack.prototype.hasInScope = function (tagName) {
    for (var i = this.stackTop; i >= 0; i--) {
        var tn = this.treeAdapter.getTagName(this.items[i]);

        if (tn === tagName)
            return true;

        var ns = this.treeAdapter.getNamespaceURI(this.items[i]);

        if (isScopingElement(tn, ns))
            return false;
    }

    return true;
};

OpenElementStack.prototype.hasNumberedHeaderInScope = function () {
    for (var i = this.stackTop; i >= 0; i--) {
        var tn = this.treeAdapter.getTagName(this.items[i]);

        if (tn === $.H1 || tn === $.H2 || tn === $.H3 || tn === $.H4 || tn === $.H5 || tn === $.H6)
            return true;

        if (isScopingElement(tn, this.treeAdapter.getNamespaceURI(this.items[i])))
            return false;
    }

    return true;
};

OpenElementStack.prototype.hasInListItemScope = function (tagName) {
    for (var i = this.stackTop; i >= 0; i--) {
        var tn = this.treeAdapter.getTagName(this.items[i]);

        if (tn === tagName)
            return true;

        var ns = this.treeAdapter.getNamespaceURI(this.items[i]);

        if (((tn === $.UL || tn === $.OL) && ns === NS.HTML) || isScopingElement(tn, ns))
            return false;
    }

    return true;
};

OpenElementStack.prototype.hasInButtonScope = function (tagName) {
    for (var i = this.stackTop; i >= 0; i--) {
        var tn = this.treeAdapter.getTagName(this.items[i]);

        if (tn === tagName)
            return true;

        var ns = this.treeAdapter.getNamespaceURI(this.items[i]);

        if ((tn === $.BUTTON && ns === NS.HTML) || isScopingElement(tn, ns))
            return false;
    }

    return true;
};

OpenElementStack.prototype.hasInTableScope = function (tagName) {
    for (var i = this.stackTop; i >= 0; i--) {
        var tn = this.treeAdapter.getTagName(this.items[i]);

        if (tn === tagName)
            return true;

        var ns = this.treeAdapter.getNamespaceURI(this.items[i]);

        if ((tn === $.TABLE || tn === $.TEMPLATE || tn === $.HTML) && ns === NS.HTML)
            return false;
    }

    return true;
};

OpenElementStack.prototype.hasTableBodyContextInTableScope = function () {
    for (var i = this.stackTop; i >= 0; i--) {
        var tn = this.treeAdapter.getTagName(this.items[i]);

        if (tn === $.TBODY || tn === $.THEAD || tn === $.TFOOT)
            return true;

        var ns = this.treeAdapter.getNamespaceURI(this.items[i]);

        if ((tn === $.TABLE || tn === $.HTML) && ns === NS.HTML)
            return false;
    }

    return true;
};

OpenElementStack.prototype.hasInSelectScope = function (tagName) {
    for (var i = this.stackTop; i >= 0; i--) {
        var tn = this.treeAdapter.getTagName(this.items[i]);

        if (tn === tagName)
            return true;

        var ns = this.treeAdapter.getNamespaceURI(this.items[i]);

        if (tn !== $.OPTION && tn !== $.OPTGROUP && ns === NS.HTML)
            return false;
    }

    return true;
};

//Implied end tags
OpenElementStack.prototype.generateImpliedEndTags = function () {
    while (isImpliedEndTagRequired(this.currentTagName))
        this.pop();
};

OpenElementStack.prototype.generateImpliedEndTagsWithExclusion = function (exclusionTagName) {
    while (isImpliedEndTagRequired(this.currentTagName) && this.currentTagName !== exclusionTagName)
        this.pop();
};

},{"../common/html":8}],25:[function(require,module,exports){
'use strict';

var Tokenizer = require('../tokenization/tokenizer'),
    OpenElementStack = require('./open_element_stack'),
    FormattingElementList = require('./formatting_element_list'),
    LocationInfoMixin = require('./location_info_mixin'),
    DefaultTreeAdapter = require('../tree_adapters/default'),
    Doctype = require('../common/doctype'),
    ForeignContent = require('../common/foreign_content'),
    Utils = require('../common/utils'),
    UNICODE = require('../common/unicode'),
    HTML = require('../common/html');

//Aliases
var $ = HTML.TAG_NAMES,
    NS = HTML.NAMESPACES,
    ATTRS = HTML.ATTRS;

//Default options
var DEFAULT_OPTIONS = {
    decodeHtmlEntities: true,
    locationInfo: false
};

//Misc constants
var SEARCHABLE_INDEX_DEFAULT_PROMPT = 'This is a searchable index. Enter search keywords: ',
    SEARCHABLE_INDEX_INPUT_NAME = 'isindex',
    HIDDEN_INPUT_TYPE = 'hidden';

//Adoption agency loops iteration count
var AA_OUTER_LOOP_ITER = 8,
    AA_INNER_LOOP_ITER = 3;

//Insertion modes
var INITIAL_MODE = 'INITIAL_MODE',
    BEFORE_HTML_MODE = 'BEFORE_HTML_MODE',
    BEFORE_HEAD_MODE = 'BEFORE_HEAD_MODE',
    IN_HEAD_MODE = 'IN_HEAD_MODE',
    AFTER_HEAD_MODE = 'AFTER_HEAD_MODE',
    IN_BODY_MODE = 'IN_BODY_MODE',
    TEXT_MODE = 'TEXT_MODE',
    IN_TABLE_MODE = 'IN_TABLE_MODE',
    IN_TABLE_TEXT_MODE = 'IN_TABLE_TEXT_MODE',
    IN_CAPTION_MODE = 'IN_CAPTION_MODE',
    IN_COLUMN_GROUP_MODE = 'IN_COLUMN_GROUP_MODE',
    IN_TABLE_BODY_MODE = 'IN_TABLE_BODY_MODE',
    IN_ROW_MODE = 'IN_ROW_MODE',
    IN_CELL_MODE = 'IN_CELL_MODE',
    IN_SELECT_MODE = 'IN_SELECT_MODE',
    IN_SELECT_IN_TABLE_MODE = 'IN_SELECT_IN_TABLE_MODE',
    IN_TEMPLATE_MODE = 'IN_TEMPLATE_MODE',
    AFTER_BODY_MODE = 'AFTER_BODY_MODE',
    IN_FRAMESET_MODE = 'IN_FRAMESET_MODE',
    AFTER_FRAMESET_MODE = 'AFTER_FRAMESET_MODE',
    AFTER_AFTER_BODY_MODE = 'AFTER_AFTER_BODY_MODE',
    AFTER_AFTER_FRAMESET_MODE = 'AFTER_AFTER_FRAMESET_MODE';

//Insertion mode reset map
var INSERTION_MODE_RESET_MAP = {};

INSERTION_MODE_RESET_MAP[$.TR] = IN_ROW_MODE;
INSERTION_MODE_RESET_MAP[$.TBODY] =
INSERTION_MODE_RESET_MAP[$.THEAD] =
INSERTION_MODE_RESET_MAP[$.TFOOT] = IN_TABLE_BODY_MODE;
INSERTION_MODE_RESET_MAP[$.CAPTION] = IN_CAPTION_MODE;
INSERTION_MODE_RESET_MAP[$.COLGROUP] = IN_COLUMN_GROUP_MODE;
INSERTION_MODE_RESET_MAP[$.TABLE] = IN_TABLE_MODE;
INSERTION_MODE_RESET_MAP[$.BODY] = IN_BODY_MODE;
INSERTION_MODE_RESET_MAP[$.FRAMESET] = IN_FRAMESET_MODE;

//Template insertion mode switch map
var TEMPLATE_INSERTION_MODE_SWITCH_MAP = {};

TEMPLATE_INSERTION_MODE_SWITCH_MAP[$.CAPTION] =
TEMPLATE_INSERTION_MODE_SWITCH_MAP[$.COLGROUP] =
TEMPLATE_INSERTION_MODE_SWITCH_MAP[$.TBODY] =
TEMPLATE_INSERTION_MODE_SWITCH_MAP[$.TFOOT] =
TEMPLATE_INSERTION_MODE_SWITCH_MAP[$.THEAD] = IN_TABLE_MODE;
TEMPLATE_INSERTION_MODE_SWITCH_MAP[$.COL] = IN_COLUMN_GROUP_MODE;
TEMPLATE_INSERTION_MODE_SWITCH_MAP[$.TR] = IN_TABLE_BODY_MODE;
TEMPLATE_INSERTION_MODE_SWITCH_MAP[$.TD] =
TEMPLATE_INSERTION_MODE_SWITCH_MAP[$.TH] = IN_ROW_MODE;

//Token handlers map for insertion modes
var _ = {};

_[INITIAL_MODE] = {};
_[INITIAL_MODE][Tokenizer.CHARACTER_TOKEN] =
_[INITIAL_MODE][Tokenizer.NULL_CHARACTER_TOKEN] = tokenInInitialMode;
_[INITIAL_MODE][Tokenizer.WHITESPACE_CHARACTER_TOKEN] = ignoreToken;
_[INITIAL_MODE][Tokenizer.COMMENT_TOKEN] = appendComment;
_[INITIAL_MODE][Tokenizer.DOCTYPE_TOKEN] = doctypeInInitialMode;
_[INITIAL_MODE][Tokenizer.START_TAG_TOKEN] =
_[INITIAL_MODE][Tokenizer.END_TAG_TOKEN] =
_[INITIAL_MODE][Tokenizer.EOF_TOKEN] = tokenInInitialMode;

_[BEFORE_HTML_MODE] = {};
_[BEFORE_HTML_MODE][Tokenizer.CHARACTER_TOKEN] =
_[BEFORE_HTML_MODE][Tokenizer.NULL_CHARACTER_TOKEN] = tokenBeforeHtml;
_[BEFORE_HTML_MODE][Tokenizer.WHITESPACE_CHARACTER_TOKEN] = ignoreToken;
_[BEFORE_HTML_MODE][Tokenizer.COMMENT_TOKEN] = appendComment;
_[BEFORE_HTML_MODE][Tokenizer.DOCTYPE_TOKEN] = ignoreToken;
_[BEFORE_HTML_MODE][Tokenizer.START_TAG_TOKEN] = startTagBeforeHtml;
_[BEFORE_HTML_MODE][Tokenizer.END_TAG_TOKEN] = endTagBeforeHtml;
_[BEFORE_HTML_MODE][Tokenizer.EOF_TOKEN] = tokenBeforeHtml;

_[BEFORE_HEAD_MODE] = {};
_[BEFORE_HEAD_MODE][Tokenizer.CHARACTER_TOKEN] =
_[BEFORE_HEAD_MODE][Tokenizer.NULL_CHARACTER_TOKEN] = tokenBeforeHead;
_[BEFORE_HEAD_MODE][Tokenizer.WHITESPACE_CHARACTER_TOKEN] = ignoreToken;
_[BEFORE_HEAD_MODE][Tokenizer.COMMENT_TOKEN] = appendComment;
_[BEFORE_HEAD_MODE][Tokenizer.DOCTYPE_TOKEN] = ignoreToken;
_[BEFORE_HEAD_MODE][Tokenizer.START_TAG_TOKEN] = startTagBeforeHead;
_[BEFORE_HEAD_MODE][Tokenizer.END_TAG_TOKEN] = endTagBeforeHead;
_[BEFORE_HEAD_MODE][Tokenizer.EOF_TOKEN] = tokenBeforeHead;

_[IN_HEAD_MODE] = {};
_[IN_HEAD_MODE][Tokenizer.CHARACTER_TOKEN] =
_[IN_HEAD_MODE][Tokenizer.NULL_CHARACTER_TOKEN] = tokenInHead;
_[IN_HEAD_MODE][Tokenizer.WHITESPACE_CHARACTER_TOKEN] = insertCharacters;
_[IN_HEAD_MODE][Tokenizer.COMMENT_TOKEN] = appendComment;
_[IN_HEAD_MODE][Tokenizer.DOCTYPE_TOKEN] = ignoreToken;
_[IN_HEAD_MODE][Tokenizer.START_TAG_TOKEN] = startTagInHead;
_[IN_HEAD_MODE][Tokenizer.END_TAG_TOKEN] = endTagInHead;
_[IN_HEAD_MODE][Tokenizer.EOF_TOKEN] = tokenInHead;

_[AFTER_HEAD_MODE] = {};
_[AFTER_HEAD_MODE][Tokenizer.CHARACTER_TOKEN] =
_[AFTER_HEAD_MODE][Tokenizer.NULL_CHARACTER_TOKEN] = tokenAfterHead;
_[AFTER_HEAD_MODE][Tokenizer.WHITESPACE_CHARACTER_TOKEN] = insertCharacters;
_[AFTER_HEAD_MODE][Tokenizer.COMMENT_TOKEN] = appendComment;
_[AFTER_HEAD_MODE][Tokenizer.DOCTYPE_TOKEN] = ignoreToken;
_[AFTER_HEAD_MODE][Tokenizer.START_TAG_TOKEN] = startTagAfterHead;
_[AFTER_HEAD_MODE][Tokenizer.END_TAG_TOKEN] = endTagAfterHead;
_[AFTER_HEAD_MODE][Tokenizer.EOF_TOKEN] = tokenAfterHead;

_[IN_BODY_MODE] = {};
_[IN_BODY_MODE][Tokenizer.CHARACTER_TOKEN] = characterInBody;
_[IN_BODY_MODE][Tokenizer.NULL_CHARACTER_TOKEN] = ignoreToken;
_[IN_BODY_MODE][Tokenizer.WHITESPACE_CHARACTER_TOKEN] = whitespaceCharacterInBody;
_[IN_BODY_MODE][Tokenizer.COMMENT_TOKEN] = appendComment;
_[IN_BODY_MODE][Tokenizer.DOCTYPE_TOKEN] = ignoreToken;
_[IN_BODY_MODE][Tokenizer.START_TAG_TOKEN] = startTagInBody;
_[IN_BODY_MODE][Tokenizer.END_TAG_TOKEN] = endTagInBody;
_[IN_BODY_MODE][Tokenizer.EOF_TOKEN] = eofInBody;

_[TEXT_MODE] = {};
_[TEXT_MODE][Tokenizer.CHARACTER_TOKEN] =
_[TEXT_MODE][Tokenizer.NULL_CHARACTER_TOKEN] =
_[TEXT_MODE][Tokenizer.WHITESPACE_CHARACTER_TOKEN] = insertCharacters;
_[TEXT_MODE][Tokenizer.COMMENT_TOKEN] =
_[TEXT_MODE][Tokenizer.DOCTYPE_TOKEN] =
_[TEXT_MODE][Tokenizer.START_TAG_TOKEN] = ignoreToken;
_[TEXT_MODE][Tokenizer.END_TAG_TOKEN] = endTagInText;
_[TEXT_MODE][Tokenizer.EOF_TOKEN] = eofInText;

_[IN_TABLE_MODE] = {};
_[IN_TABLE_MODE][Tokenizer.CHARACTER_TOKEN] =
_[IN_TABLE_MODE][Tokenizer.NULL_CHARACTER_TOKEN] =
_[IN_TABLE_MODE][Tokenizer.WHITESPACE_CHARACTER_TOKEN] = characterInTable;
_[IN_TABLE_MODE][Tokenizer.COMMENT_TOKEN] = appendComment;
_[IN_TABLE_MODE][Tokenizer.DOCTYPE_TOKEN] = ignoreToken;
_[IN_TABLE_MODE][Tokenizer.START_TAG_TOKEN] = startTagInTable;
_[IN_TABLE_MODE][Tokenizer.END_TAG_TOKEN] = endTagInTable;
_[IN_TABLE_MODE][Tokenizer.EOF_TOKEN] = eofInBody;

_[IN_TABLE_TEXT_MODE] = {};
_[IN_TABLE_TEXT_MODE][Tokenizer.CHARACTER_TOKEN] = characterInTableText;
_[IN_TABLE_TEXT_MODE][Tokenizer.NULL_CHARACTER_TOKEN] = ignoreToken;
_[IN_TABLE_TEXT_MODE][Tokenizer.WHITESPACE_CHARACTER_TOKEN] = whitespaceCharacterInTableText;
_[IN_TABLE_TEXT_MODE][Tokenizer.COMMENT_TOKEN] =
_[IN_TABLE_TEXT_MODE][Tokenizer.DOCTYPE_TOKEN] =
_[IN_TABLE_TEXT_MODE][Tokenizer.START_TAG_TOKEN] =
_[IN_TABLE_TEXT_MODE][Tokenizer.END_TAG_TOKEN] =
_[IN_TABLE_TEXT_MODE][Tokenizer.EOF_TOKEN] = tokenInTableText;

_[IN_CAPTION_MODE] = {};
_[IN_CAPTION_MODE][Tokenizer.CHARACTER_TOKEN] = characterInBody;
_[IN_CAPTION_MODE][Tokenizer.NULL_CHARACTER_TOKEN] = ignoreToken;
_[IN_CAPTION_MODE][Tokenizer.WHITESPACE_CHARACTER_TOKEN] = whitespaceCharacterInBody;
_[IN_CAPTION_MODE][Tokenizer.COMMENT_TOKEN] = appendComment;
_[IN_CAPTION_MODE][Tokenizer.DOCTYPE_TOKEN] = ignoreToken;
_[IN_CAPTION_MODE][Tokenizer.START_TAG_TOKEN] = startTagInCaption;
_[IN_CAPTION_MODE][Tokenizer.END_TAG_TOKEN] = endTagInCaption;
_[IN_CAPTION_MODE][Tokenizer.EOF_TOKEN] = eofInBody;

_[IN_COLUMN_GROUP_MODE] = {};
_[IN_COLUMN_GROUP_MODE][Tokenizer.CHARACTER_TOKEN] =
_[IN_COLUMN_GROUP_MODE][Tokenizer.NULL_CHARACTER_TOKEN] = tokenInColumnGroup;
_[IN_COLUMN_GROUP_MODE][Tokenizer.WHITESPACE_CHARACTER_TOKEN] = insertCharacters;
_[IN_COLUMN_GROUP_MODE][Tokenizer.COMMENT_TOKEN] = appendComment;
_[IN_COLUMN_GROUP_MODE][Tokenizer.DOCTYPE_TOKEN] = ignoreToken;
_[IN_COLUMN_GROUP_MODE][Tokenizer.START_TAG_TOKEN] = startTagInColumnGroup;
_[IN_COLUMN_GROUP_MODE][Tokenizer.END_TAG_TOKEN] = endTagInColumnGroup;
_[IN_COLUMN_GROUP_MODE][Tokenizer.EOF_TOKEN] = eofInBody;

_[IN_TABLE_BODY_MODE] = {};
_[IN_TABLE_BODY_MODE][Tokenizer.CHARACTER_TOKEN] =
_[IN_TABLE_BODY_MODE][Tokenizer.NULL_CHARACTER_TOKEN] =
_[IN_TABLE_BODY_MODE][Tokenizer.WHITESPACE_CHARACTER_TOKEN] = characterInTable;
_[IN_TABLE_BODY_MODE][Tokenizer.COMMENT_TOKEN] = appendComment;
_[IN_TABLE_BODY_MODE][Tokenizer.DOCTYPE_TOKEN] = ignoreToken;
_[IN_TABLE_BODY_MODE][Tokenizer.START_TAG_TOKEN] = startTagInTableBody;
_[IN_TABLE_BODY_MODE][Tokenizer.END_TAG_TOKEN] = endTagInTableBody;
_[IN_TABLE_BODY_MODE][Tokenizer.EOF_TOKEN] = eofInBody;

_[IN_ROW_MODE] = {};
_[IN_ROW_MODE][Tokenizer.CHARACTER_TOKEN] =
_[IN_ROW_MODE][Tokenizer.NULL_CHARACTER_TOKEN] =
_[IN_ROW_MODE][Tokenizer.WHITESPACE_CHARACTER_TOKEN] = characterInTable;
_[IN_ROW_MODE][Tokenizer.COMMENT_TOKEN] = appendComment;
_[IN_ROW_MODE][Tokenizer.DOCTYPE_TOKEN] = ignoreToken;
_[IN_ROW_MODE][Tokenizer.START_TAG_TOKEN] = startTagInRow;
_[IN_ROW_MODE][Tokenizer.END_TAG_TOKEN] = endTagInRow;
_[IN_ROW_MODE][Tokenizer.EOF_TOKEN] = eofInBody;

_[IN_CELL_MODE] = {};
_[IN_CELL_MODE][Tokenizer.CHARACTER_TOKEN] = characterInBody;
_[IN_CELL_MODE][Tokenizer.NULL_CHARACTER_TOKEN] = ignoreToken;
_[IN_CELL_MODE][Tokenizer.WHITESPACE_CHARACTER_TOKEN] = whitespaceCharacterInBody;
_[IN_CELL_MODE][Tokenizer.COMMENT_TOKEN] = appendComment;
_[IN_CELL_MODE][Tokenizer.DOCTYPE_TOKEN] = ignoreToken;
_[IN_CELL_MODE][Tokenizer.START_TAG_TOKEN] = startTagInCell;
_[IN_CELL_MODE][Tokenizer.END_TAG_TOKEN] = endTagInCell;
_[IN_CELL_MODE][Tokenizer.EOF_TOKEN] = eofInBody;

_[IN_SELECT_MODE] = {};
_[IN_SELECT_MODE][Tokenizer.CHARACTER_TOKEN] = insertCharacters;
_[IN_SELECT_MODE][Tokenizer.NULL_CHARACTER_TOKEN] = ignoreToken;
_[IN_SELECT_MODE][Tokenizer.WHITESPACE_CHARACTER_TOKEN] = insertCharacters;
_[IN_SELECT_MODE][Tokenizer.COMMENT_TOKEN] = appendComment;
_[IN_SELECT_MODE][Tokenizer.DOCTYPE_TOKEN] = ignoreToken;
_[IN_SELECT_MODE][Tokenizer.START_TAG_TOKEN] = startTagInSelect;
_[IN_SELECT_MODE][Tokenizer.END_TAG_TOKEN] = endTagInSelect;
_[IN_SELECT_MODE][Tokenizer.EOF_TOKEN] = eofInBody;

_[IN_SELECT_IN_TABLE_MODE] = {};
_[IN_SELECT_IN_TABLE_MODE][Tokenizer.CHARACTER_TOKEN] = insertCharacters;
_[IN_SELECT_IN_TABLE_MODE][Tokenizer.NULL_CHARACTER_TOKEN] = ignoreToken;
_[IN_SELECT_IN_TABLE_MODE][Tokenizer.WHITESPACE_CHARACTER_TOKEN] = insertCharacters;
_[IN_SELECT_IN_TABLE_MODE][Tokenizer.COMMENT_TOKEN] = appendComment;
_[IN_SELECT_IN_TABLE_MODE][Tokenizer.DOCTYPE_TOKEN] = ignoreToken;
_[IN_SELECT_IN_TABLE_MODE][Tokenizer.START_TAG_TOKEN] = startTagInSelectInTable;
_[IN_SELECT_IN_TABLE_MODE][Tokenizer.END_TAG_TOKEN] = endTagInSelectInTable;
_[IN_SELECT_IN_TABLE_MODE][Tokenizer.EOF_TOKEN] = eofInBody;

_[IN_TEMPLATE_MODE] = {};
_[IN_TEMPLATE_MODE][Tokenizer.CHARACTER_TOKEN] = characterInBody;
_[IN_TEMPLATE_MODE][Tokenizer.NULL_CHARACTER_TOKEN] = ignoreToken;
_[IN_TEMPLATE_MODE][Tokenizer.WHITESPACE_CHARACTER_TOKEN] = whitespaceCharacterInBody;
_[IN_TEMPLATE_MODE][Tokenizer.COMMENT_TOKEN] = appendComment;
_[IN_TEMPLATE_MODE][Tokenizer.DOCTYPE_TOKEN] = ignoreToken;
_[IN_TEMPLATE_MODE][Tokenizer.START_TAG_TOKEN] = startTagInTemplate;
_[IN_TEMPLATE_MODE][Tokenizer.END_TAG_TOKEN] = endTagInTemplate;
_[IN_TEMPLATE_MODE][Tokenizer.EOF_TOKEN] = eofInTemplate;

_[AFTER_BODY_MODE] = {};
_[AFTER_BODY_MODE][Tokenizer.CHARACTER_TOKEN] =
_[AFTER_BODY_MODE][Tokenizer.NULL_CHARACTER_TOKEN] = tokenAfterBody;
_[AFTER_BODY_MODE][Tokenizer.WHITESPACE_CHARACTER_TOKEN] = whitespaceCharacterInBody;
_[AFTER_BODY_MODE][Tokenizer.COMMENT_TOKEN] = appendCommentToRootHtmlElement;
_[AFTER_BODY_MODE][Tokenizer.DOCTYPE_TOKEN] = ignoreToken;
_[AFTER_BODY_MODE][Tokenizer.START_TAG_TOKEN] = startTagAfterBody;
_[AFTER_BODY_MODE][Tokenizer.END_TAG_TOKEN] = endTagAfterBody;
_[AFTER_BODY_MODE][Tokenizer.EOF_TOKEN] = stopParsing;

_[IN_FRAMESET_MODE] = {};
_[IN_FRAMESET_MODE][Tokenizer.CHARACTER_TOKEN] =
_[IN_FRAMESET_MODE][Tokenizer.NULL_CHARACTER_TOKEN] = ignoreToken;
_[IN_FRAMESET_MODE][Tokenizer.WHITESPACE_CHARACTER_TOKEN] = insertCharacters;
_[IN_FRAMESET_MODE][Tokenizer.COMMENT_TOKEN] = appendComment;
_[IN_FRAMESET_MODE][Tokenizer.DOCTYPE_TOKEN] = ignoreToken;
_[IN_FRAMESET_MODE][Tokenizer.START_TAG_TOKEN] = startTagInFrameset;
_[IN_FRAMESET_MODE][Tokenizer.END_TAG_TOKEN] = endTagInFrameset;
_[IN_FRAMESET_MODE][Tokenizer.EOF_TOKEN] = stopParsing;

_[AFTER_FRAMESET_MODE] = {};
_[AFTER_FRAMESET_MODE][Tokenizer.CHARACTER_TOKEN] =
_[AFTER_FRAMESET_MODE][Tokenizer.NULL_CHARACTER_TOKEN] = ignoreToken;
_[AFTER_FRAMESET_MODE][Tokenizer.WHITESPACE_CHARACTER_TOKEN] = insertCharacters;
_[AFTER_FRAMESET_MODE][Tokenizer.COMMENT_TOKEN] = appendComment;
_[AFTER_FRAMESET_MODE][Tokenizer.DOCTYPE_TOKEN] = ignoreToken;
_[AFTER_FRAMESET_MODE][Tokenizer.START_TAG_TOKEN] = startTagAfterFrameset;
_[AFTER_FRAMESET_MODE][Tokenizer.END_TAG_TOKEN] = endTagAfterFrameset;
_[AFTER_FRAMESET_MODE][Tokenizer.EOF_TOKEN] = stopParsing;

_[AFTER_AFTER_BODY_MODE] = {};
_[AFTER_AFTER_BODY_MODE][Tokenizer.CHARACTER_TOKEN] = tokenAfterAfterBody;
_[AFTER_AFTER_BODY_MODE][Tokenizer.NULL_CHARACTER_TOKEN] = tokenAfterAfterBody;
_[AFTER_AFTER_BODY_MODE][Tokenizer.WHITESPACE_CHARACTER_TOKEN] = whitespaceCharacterInBody;
_[AFTER_AFTER_BODY_MODE][Tokenizer.COMMENT_TOKEN] = appendCommentToDocument;
_[AFTER_AFTER_BODY_MODE][Tokenizer.DOCTYPE_TOKEN] = ignoreToken;
_[AFTER_AFTER_BODY_MODE][Tokenizer.START_TAG_TOKEN] = startTagAfterAfterBody;
_[AFTER_AFTER_BODY_MODE][Tokenizer.END_TAG_TOKEN] = tokenAfterAfterBody;
_[AFTER_AFTER_BODY_MODE][Tokenizer.EOF_TOKEN] = stopParsing;

_[AFTER_AFTER_FRAMESET_MODE] = {};
_[AFTER_AFTER_FRAMESET_MODE][Tokenizer.CHARACTER_TOKEN] =
_[AFTER_AFTER_FRAMESET_MODE][Tokenizer.NULL_CHARACTER_TOKEN] = ignoreToken;
_[AFTER_AFTER_FRAMESET_MODE][Tokenizer.WHITESPACE_CHARACTER_TOKEN] = whitespaceCharacterInBody;
_[AFTER_AFTER_FRAMESET_MODE][Tokenizer.COMMENT_TOKEN] = appendCommentToDocument;
_[AFTER_AFTER_FRAMESET_MODE][Tokenizer.DOCTYPE_TOKEN] = ignoreToken;
_[AFTER_AFTER_FRAMESET_MODE][Tokenizer.START_TAG_TOKEN] = startTagAfterAfterFrameset;
_[AFTER_AFTER_FRAMESET_MODE][Tokenizer.END_TAG_TOKEN] = ignoreToken;
_[AFTER_AFTER_FRAMESET_MODE][Tokenizer.EOF_TOKEN] = stopParsing;

//Searchable index building utils (<isindex> tag)
function getSearchableIndexFormAttrs(isindexStartTagToken) {
    var indexAction = Tokenizer.getTokenAttr(isindexStartTagToken, ATTRS.ACTION),
        attrs = [];

    if (indexAction !== null) {
        attrs.push({
            name: ATTRS.ACTION,
            value: indexAction
        });
    }

    return attrs;
}

function getSearchableIndexLabelText(isindexStartTagToken) {
    var indexPrompt = Tokenizer.getTokenAttr(isindexStartTagToken, ATTRS.PROMPT);

    return indexPrompt === null ? SEARCHABLE_INDEX_DEFAULT_PROMPT : indexPrompt;
}

function getSearchableIndexInputAttrs(isindexStartTagToken) {
    var isindexAttrs = isindexStartTagToken.attrs,
        inputAttrs = [];

    for (var i = 0; i < isindexAttrs.length; i++) {
        var name = isindexAttrs[i].name;

        if (name !== ATTRS.NAME && name !== ATTRS.ACTION && name !== ATTRS.PROMPT)
            inputAttrs.push(isindexAttrs[i]);
    }

    inputAttrs.push({
        name: ATTRS.NAME,
        value: SEARCHABLE_INDEX_INPUT_NAME
    });

    return inputAttrs;
}

//Parser
var Parser = module.exports = function (treeAdapter, options) {
    this.treeAdapter = treeAdapter || DefaultTreeAdapter;
    this.options = Utils.mergeOptions(DEFAULT_OPTIONS, options);
    this.scriptHandler = null;

    if (this.options.locationInfo)
        LocationInfoMixin.assign(this);
};

//API
Parser.prototype.parse = function (html) {
    var document = this.treeAdapter.createDocument();

    this._reset(html, document, null);
    this._runParsingLoop();

    return document;
};

Parser.prototype.parseFragment = function (html, fragmentContext) {
    //NOTE: use <template> element as a fragment context if context element was not provided,
    //so we will parse in "forgiving" manner
    if (!fragmentContext)
        fragmentContext = this.treeAdapter.createElement($.TEMPLATE, NS.HTML, []);

    //NOTE: create fake element which will be used as 'document' for fragment parsing.
    //This is important for jsdom there 'document' can't be recreated, therefore
    //fragment parsing causes messing of the main `document`.
    var documentMock = this.treeAdapter.createElement('documentmock', NS.HTML, []);

    this._reset(html, documentMock, fragmentContext);

    if (this.treeAdapter.getTagName(fragmentContext) === $.TEMPLATE)
        this._pushTmplInsertionMode(IN_TEMPLATE_MODE);

    this._initTokenizerForFragmentParsing();
    this._insertFakeRootElement();
    this._resetInsertionMode();
    this._findFormInFragmentContext();
    this._runParsingLoop();

    var rootElement = this.treeAdapter.getFirstChild(documentMock),
        fragment = this.treeAdapter.createDocumentFragment();

    this._adoptNodes(rootElement, fragment);

    return fragment;
};

//Reset state
Parser.prototype._reset = function (html, document, fragmentContext) {
    this.tokenizer = new Tokenizer(html, this.options);

    this.stopped = false;

    this.insertionMode = INITIAL_MODE;
    this.originalInsertionMode = '';

    this.document = document;
    this.fragmentContext = fragmentContext;

    this.headElement = null;
    this.formElement = null;

    this.openElements = new OpenElementStack(this.document, this.treeAdapter);
    this.activeFormattingElements = new FormattingElementList(this.treeAdapter);

    this.tmplInsertionModeStack = [];
    this.tmplInsertionModeStackTop = -1;
    this.currentTmplInsertionMode = null;

    this.pendingCharacterTokens = [];
    this.hasNonWhitespacePendingCharacterToken = false;

    this.framesetOk = true;
    this.skipNextNewLine = false;
    this.fosterParentingEnabled = false;
};

//Parsing loop
Parser.prototype._iterateParsingLoop = function () {
    this._setupTokenizerCDATAMode();

    var token = this.tokenizer.getNextToken();

    if (this.skipNextNewLine) {
        this.skipNextNewLine = false;

        if (token.type === Tokenizer.WHITESPACE_CHARACTER_TOKEN && token.chars[0] === '\n') {
            if (token.chars.length === 1)
                return;

            token.chars = token.chars.substr(1);
        }
    }

    if (this._shouldProcessTokenInForeignContent(token))
        this._processTokenInForeignContent(token);

    else
        this._processToken(token);
};

Parser.prototype._runParsingLoop = function () {
    while (!this.stopped)
        this._iterateParsingLoop();
};

//Text parsing
Parser.prototype._setupTokenizerCDATAMode = function () {
    var current = this._getAdjustedCurrentElement();

    this.tokenizer.allowCDATA = current && current !== this.document &&
                                this.treeAdapter.getNamespaceURI(current) !== NS.HTML &&
                                (!this._isHtmlIntegrationPoint(current)) &&
                                (!this._isMathMLTextIntegrationPoint(current));
};

Parser.prototype._switchToTextParsing = function (currentToken, nextTokenizerState) {
    this._insertElement(currentToken, NS.HTML);
    this.tokenizer.state = nextTokenizerState;
    this.originalInsertionMode = this.insertionMode;
    this.insertionMode = TEXT_MODE;
};

//Fragment parsing
Parser.prototype._getAdjustedCurrentElement = function () {
    return this.openElements.stackTop === 0 && this.fragmentContext ?
           this.fragmentContext :
           this.openElements.current;
};

Parser.prototype._findFormInFragmentContext = function () {
    var node = this.fragmentContext;

    do {
        if (this.treeAdapter.getTagName(node) === $.FORM) {
            this.formElement = node;
            break;
        }

        node = this.treeAdapter.getParentNode(node);
    } while (node);
};

Parser.prototype._initTokenizerForFragmentParsing = function () {
    var tn = this.treeAdapter.getTagName(this.fragmentContext);

    if (tn === $.TITLE || tn === $.TEXTAREA)
        this.tokenizer.state = Tokenizer.MODE.RCDATA;

    else if (tn === $.STYLE || tn === $.XMP || tn === $.IFRAME ||
             tn === $.NOEMBED || tn === $.NOFRAMES || tn === $.NOSCRIPT) {
        this.tokenizer.state = Tokenizer.MODE.RAWTEXT;
    }

    else if (tn === $.SCRIPT)
        this.tokenizer.state = Tokenizer.MODE.SCRIPT_DATA;

    else if (tn === $.PLAINTEXT)
        this.tokenizer.state = Tokenizer.MODE.PLAINTEXT;
};

//Tree mutation
Parser.prototype._setDocumentType = function (token) {
    this.treeAdapter.setDocumentType(this.document, token.name, token.publicId, token.systemId);
};

Parser.prototype._attachElementToTree = function (element) {
    if (this._shouldFosterParentOnInsertion())
        this._fosterParentElement(element);

    else {
        var parent = this.openElements.currentTmplContent || this.openElements.current;

        this.treeAdapter.appendChild(parent, element);
    }
};

Parser.prototype._appendElement = function (token, namespaceURI) {
    var element = this.treeAdapter.createElement(token.tagName, namespaceURI, token.attrs);

    this._attachElementToTree(element);
};

Parser.prototype._insertElement = function (token, namespaceURI) {
    var element = this.treeAdapter.createElement(token.tagName, namespaceURI, token.attrs);

    this._attachElementToTree(element);
    this.openElements.push(element);
};

Parser.prototype._insertTemplate = function (token) {
    var tmpl = this.treeAdapter.createElement(token.tagName, NS.HTML, token.attrs),
        content = this.treeAdapter.createDocumentFragment();

    this.treeAdapter.appendChild(tmpl, content);
    this._attachElementToTree(tmpl);
    this.openElements.push(tmpl);
};

Parser.prototype._insertFakeRootElement = function () {
    var element = this.treeAdapter.createElement($.HTML, NS.HTML, []);

    this.treeAdapter.appendChild(this.openElements.current, element);
    this.openElements.push(element);
};

Parser.prototype._appendCommentNode = function (token, parent) {
    var commentNode = this.treeAdapter.createCommentNode(token.data);

    this.treeAdapter.appendChild(parent, commentNode);
};

Parser.prototype._insertCharacters = function (token) {
    if (this._shouldFosterParentOnInsertion())
        this._fosterParentText(token.chars);

    else {
        var parent = this.openElements.currentTmplContent || this.openElements.current;

        this.treeAdapter.insertText(parent, token.chars);
    }
};

Parser.prototype._adoptNodes = function (donor, recipient) {
    while (true) {
        var child = this.treeAdapter.getFirstChild(donor);

        if (!child)
            break;

        this.treeAdapter.detachNode(child);
        this.treeAdapter.appendChild(recipient, child);
    }
};

//Token processing
Parser.prototype._shouldProcessTokenInForeignContent = function (token) {
    var current = this._getAdjustedCurrentElement();

    if (!current || current === this.document)
        return false;

    var ns = this.treeAdapter.getNamespaceURI(current);

    if (ns === NS.HTML)
        return false;

    if (this.treeAdapter.getTagName(current) === $.ANNOTATION_XML && ns === NS.MATHML &&
        token.type === Tokenizer.START_TAG_TOKEN && token.tagName === $.SVG) {
        return false;
    }

    var isCharacterToken = token.type === Tokenizer.CHARACTER_TOKEN ||
                           token.type === Tokenizer.NULL_CHARACTER_TOKEN ||
                           token.type === Tokenizer.WHITESPACE_CHARACTER_TOKEN,
        isMathMLTextStartTag = token.type === Tokenizer.START_TAG_TOKEN &&
                               token.tagName !== $.MGLYPH &&
                               token.tagName !== $.MALIGNMARK;

    if ((isMathMLTextStartTag || isCharacterToken) && this._isMathMLTextIntegrationPoint(current))
        return false;

    if ((token.type === Tokenizer.START_TAG_TOKEN || isCharacterToken) && this._isHtmlIntegrationPoint(current))
        return false;

    return token.type !== Tokenizer.EOF_TOKEN;
};

Parser.prototype._processToken = function (token) {
    _[this.insertionMode][token.type](this, token);
};

Parser.prototype._processTokenInBodyMode = function (token) {
    _[IN_BODY_MODE][token.type](this, token);
};

Parser.prototype._processTokenInForeignContent = function (token) {
    if (token.type === Tokenizer.CHARACTER_TOKEN)
        characterInForeignContent(this, token);

    else if (token.type === Tokenizer.NULL_CHARACTER_TOKEN)
        nullCharacterInForeignContent(this, token);

    else if (token.type === Tokenizer.WHITESPACE_CHARACTER_TOKEN)
        insertCharacters(this, token);

    else if (token.type === Tokenizer.COMMENT_TOKEN)
        appendComment(this, token);

    else if (token.type === Tokenizer.START_TAG_TOKEN)
        startTagInForeignContent(this, token);

    else if (token.type === Tokenizer.END_TAG_TOKEN)
        endTagInForeignContent(this, token);
};

Parser.prototype._processFakeStartTagWithAttrs = function (tagName, attrs) {
    var fakeToken = this.tokenizer.buildStartTagToken(tagName);

    fakeToken.attrs = attrs;
    this._processToken(fakeToken);
};

Parser.prototype._processFakeStartTag = function (tagName) {
    var fakeToken = this.tokenizer.buildStartTagToken(tagName);

    this._processToken(fakeToken);
    return fakeToken;
};

Parser.prototype._processFakeEndTag = function (tagName) {
    var fakeToken = this.tokenizer.buildEndTagToken(tagName);

    this._processToken(fakeToken);
    return fakeToken;
};

//Integration points
Parser.prototype._isMathMLTextIntegrationPoint = function (element) {
    var tn = this.treeAdapter.getTagName(element),
        ns = this.treeAdapter.getNamespaceURI(element);

    return ForeignContent.isMathMLTextIntegrationPoint(tn, ns);
};

Parser.prototype._isHtmlIntegrationPoint = function (element) {
    var tn = this.treeAdapter.getTagName(element),
        ns = this.treeAdapter.getNamespaceURI(element),
        attrs = this.treeAdapter.getAttrList(element);

    return ForeignContent.isHtmlIntegrationPoint(tn, ns, attrs);
};

//Active formatting elements reconstruction
Parser.prototype._reconstructActiveFormattingElements = function () {
    var listLength = this.activeFormattingElements.length;

    if (listLength) {
        var unopenIdx = listLength,
            entry = null;

        do {
            unopenIdx--;
            entry = this.activeFormattingElements.entries[unopenIdx];

            if (entry.type === FormattingElementList.MARKER_ENTRY || this.openElements.contains(entry.element)) {
                unopenIdx++;
                break;
            }
        } while (unopenIdx > 0);

        for (var i = unopenIdx; i < listLength; i++) {
            entry = this.activeFormattingElements.entries[i];
            this._insertElement(entry.token, this.treeAdapter.getNamespaceURI(entry.element));
            entry.element = this.openElements.current;
        }
    }
};

//Close elements
Parser.prototype._closeTableCell = function () {
    if (this.openElements.hasInTableScope($.TD))
        this._processFakeEndTag($.TD);

    else
        this._processFakeEndTag($.TH);
};

Parser.prototype._closePElement = function () {
    this.openElements.generateImpliedEndTagsWithExclusion($.P);
    this.openElements.popUntilTagNamePopped($.P);
};

//Insertion modes
Parser.prototype._resetInsertionMode = function () {
    for (var i = this.openElements.stackTop, last = false; i >= 0; i--) {
        var element = this.openElements.items[i];

        if (i === 0) {
            last = true;

            if (this.fragmentContext)
                element = this.fragmentContext;
        }

        var tn = this.treeAdapter.getTagName(element),
            newInsertionMode = INSERTION_MODE_RESET_MAP[tn];

        if (newInsertionMode) {
            this.insertionMode = newInsertionMode;
            break;
        }

        else if (!last && (tn === $.TD || tn === $.TH)) {
            this.insertionMode = IN_CELL_MODE;
            break;
        }

        else if (!last && tn === $.HEAD) {
            this.insertionMode = IN_HEAD_MODE;
            break;
        }

        else if (tn === $.SELECT) {
            this._resetInsertionModeForSelect(i);
            break;
        }

        else if (tn === $.TEMPLATE) {
            this.insertionMode = this.currentTmplInsertionMode;
            break;
        }

        else if (tn === $.HTML) {
            this.insertionMode = this.headElement ? AFTER_HEAD_MODE : BEFORE_HEAD_MODE;
            break;
        }

        else if (last) {
            this.insertionMode = IN_BODY_MODE;
            break;
        }
    }
};

Parser.prototype._resetInsertionModeForSelect = function (selectIdx) {
    if (selectIdx > 0) {
        for (var i = selectIdx - 1; i > 0; i--) {
            var ancestor = this.openElements.items[i],
                tn = this.treeAdapter.getTagName(ancestor);

            if (tn === $.TEMPLATE)
                break;

            else if (tn === $.TABLE) {
                this.insertionMode = IN_SELECT_IN_TABLE_MODE;
                return;
            }
        }
    }

    this.insertionMode = IN_SELECT_MODE;
};

Parser.prototype._pushTmplInsertionMode = function (mode) {
    this.tmplInsertionModeStack.push(mode);
    this.tmplInsertionModeStackTop++;
    this.currentTmplInsertionMode = mode;
};

Parser.prototype._popTmplInsertionMode = function () {
    this.tmplInsertionModeStack.pop();
    this.tmplInsertionModeStackTop--;
    this.currentTmplInsertionMode = this.tmplInsertionModeStack[this.tmplInsertionModeStackTop];
};

//Foster parenting
Parser.prototype._isElementCausesFosterParenting = function (element) {
    var tn = this.treeAdapter.getTagName(element);

    return tn === $.TABLE || tn === $.TBODY || tn === $.TFOOT || tn == $.THEAD || tn === $.TR;
};

Parser.prototype._shouldFosterParentOnInsertion = function () {
    return this.fosterParentingEnabled && this._isElementCausesFosterParenting(this.openElements.current);
};

Parser.prototype._findFosterParentingLocation = function () {
    var location = {
        parent: null,
        beforeElement: null
    };

    for (var i = this.openElements.stackTop; i >= 0; i--) {
        var openElement = this.openElements.items[i],
            tn = this.treeAdapter.getTagName(openElement),
            ns = this.treeAdapter.getNamespaceURI(openElement);

        if (tn === $.TEMPLATE && ns === NS.HTML) {
            location.parent = this.treeAdapter.getChildNodes(openElement)[0];
            break;
        }

        else if (tn === $.TABLE) {
            location.parent = this.treeAdapter.getParentNode(openElement);

            if (location.parent)
                location.beforeElement = openElement;
            else
                location.parent = this.openElements.items[i - 1];

            break;
        }
    }

    if (!location.parent)
        location.parent = this.openElements.items[0];

    return location;
};

Parser.prototype._fosterParentElement = function (element) {
    var location = this._findFosterParentingLocation();

    if (location.beforeElement)
        this.treeAdapter.insertBefore(location.parent, element, location.beforeElement);
    else
        this.treeAdapter.appendChild(location.parent, element);
};

Parser.prototype._fosterParentText = function (chars) {
    var location = this._findFosterParentingLocation();

    if (location.beforeElement)
        this.treeAdapter.insertTextBefore(location.parent, chars, location.beforeElement);
    else
        this.treeAdapter.insertText(location.parent, chars);
};

//Special elements
Parser.prototype._isSpecialElement = function (element) {
    var tn = this.treeAdapter.getTagName(element),
        ns = this.treeAdapter.getNamespaceURI(element);

    return HTML.SPECIAL_ELEMENTS[ns][tn];
};

//Adoption agency algorithm
//(see: http://www.whatwg.org/specs/web-apps/current-work/multipage/tree-construction.html#adoptionAgency)
//------------------------------------------------------------------

//Steps 5-8 of the algorithm
function aaObtainFormattingElementEntry(p, token) {
    var formattingElementEntry = p.activeFormattingElements.getElementEntryInScopeWithTagName(token.tagName);

    if (formattingElementEntry) {
        if (!p.openElements.contains(formattingElementEntry.element)) {
            p.activeFormattingElements.removeEntry(formattingElementEntry);
            formattingElementEntry = null;
        }

        else if (!p.openElements.hasInScope(token.tagName))
            formattingElementEntry = null;
    }

    else
        genericEndTagInBody(p, token);

    return formattingElementEntry;
}

//Steps 9 and 10 of the algorithm
function aaObtainFurthestBlock(p, formattingElementEntry) {
    var furthestBlock = null;

    for (var i = p.openElements.stackTop; i >= 0; i--) {
        var element = p.openElements.items[i];

        if (element === formattingElementEntry.element)
            break;

        if (p._isSpecialElement(element))
            furthestBlock = element;
    }

    if (!furthestBlock) {
        p.openElements.popUntilElementPopped(formattingElementEntry.element);
        p.activeFormattingElements.removeEntry(formattingElementEntry);
    }

    return furthestBlock;
}

//Step 13 of the algorithm
function aaInnerLoop(p, furthestBlock, formattingElement) {
    var element = null,
        lastElement = furthestBlock,
        nextElement = p.openElements.getCommonAncestor(furthestBlock);

    for (var i = 0; i < AA_INNER_LOOP_ITER; i++) {
        element = nextElement;

        //NOTE: store next element for the next loop iteration (it may be deleted from the stack by step 9.5)
        nextElement = p.openElements.getCommonAncestor(element);

        var elementEntry = p.activeFormattingElements.getElementEntry(element);

        if (!elementEntry) {
            p.openElements.remove(element);
            continue;
        }

        if (element === formattingElement)
            break;

        element = aaRecreateElementFromEntry(p, elementEntry);

        if (lastElement === furthestBlock)
            p.activeFormattingElements.bookmark = elementEntry;

        p.treeAdapter.detachNode(lastElement);
        p.treeAdapter.appendChild(element, lastElement);
        lastElement = element;
    }

    return lastElement;
}

//Step 13.7 of the algorithm
function aaRecreateElementFromEntry(p, elementEntry) {
    var ns = p.treeAdapter.getNamespaceURI(elementEntry.element),
        newElement = p.treeAdapter.createElement(elementEntry.token.tagName, ns, elementEntry.token.attrs);

    p.openElements.replace(elementEntry.element, newElement);
    elementEntry.element = newElement;

    return newElement;
}

//Step 14 of the algorithm
function aaInsertLastNodeInCommonAncestor(p, commonAncestor, lastElement) {
    if (p._isElementCausesFosterParenting(commonAncestor))
        p._fosterParentElement(lastElement);

    else {
        var tn = p.treeAdapter.getTagName(commonAncestor),
            ns = p.treeAdapter.getNamespaceURI(commonAncestor);

        if (tn === $.TEMPLATE && ns === NS.HTML)
            commonAncestor = p.treeAdapter.getChildNodes(commonAncestor)[0];

        p.treeAdapter.appendChild(commonAncestor, lastElement);
    }
}

//Steps 15-19 of the algorithm
function aaReplaceFormattingElement(p, furthestBlock, formattingElementEntry) {
    var ns = p.treeAdapter.getNamespaceURI(formattingElementEntry.element),
        token = formattingElementEntry.token,
        newElement = p.treeAdapter.createElement(token.tagName, ns, token.attrs);

    p._adoptNodes(furthestBlock, newElement);
    p.treeAdapter.appendChild(furthestBlock, newElement);

    p.activeFormattingElements.insertElementAfterBookmark(newElement, formattingElementEntry.token);
    p.activeFormattingElements.removeEntry(formattingElementEntry);

    p.openElements.remove(formattingElementEntry.element);
    p.openElements.insertAfter(furthestBlock, newElement);
}

//Algorithm entry point
function callAdoptionAgency(p, token) {
    for (var i = 0; i < AA_OUTER_LOOP_ITER; i++) {
        var formattingElementEntry = aaObtainFormattingElementEntry(p, token, formattingElementEntry);

        if (!formattingElementEntry)
            break;

        var furthestBlock = aaObtainFurthestBlock(p, formattingElementEntry);

        if (!furthestBlock)
            break;

        p.activeFormattingElements.bookmark = formattingElementEntry;

        var lastElement = aaInnerLoop(p, furthestBlock, formattingElementEntry.element),
            commonAncestor = p.openElements.getCommonAncestor(formattingElementEntry.element);

        p.treeAdapter.detachNode(lastElement);
        aaInsertLastNodeInCommonAncestor(p, commonAncestor, lastElement);
        aaReplaceFormattingElement(p, furthestBlock, formattingElementEntry);
    }
}


//Generic token handlers
//------------------------------------------------------------------
function ignoreToken(p, token) {
    //NOTE: do nothing =)
}

function appendComment(p, token) {
    p._appendCommentNode(token, p.openElements.currentTmplContent || p.openElements.current)
}

function appendCommentToRootHtmlElement(p, token) {
    p._appendCommentNode(token, p.openElements.items[0]);
}

function appendCommentToDocument(p, token) {
    p._appendCommentNode(token, p.document);
}

function insertCharacters(p, token) {
    p._insertCharacters(token);
}

function stopParsing(p, token) {
    p.stopped = true;
}

//12.2.5.4.1 The "initial" insertion mode
//------------------------------------------------------------------
function doctypeInInitialMode(p, token) {
    p._setDocumentType(token);

    if (token.forceQuirks || Doctype.isQuirks(token.name, token.publicId, token.systemId))
        p.treeAdapter.setQuirksMode(p.document);

    p.insertionMode = BEFORE_HTML_MODE;
}

function tokenInInitialMode(p, token) {
    p.treeAdapter.setQuirksMode(p.document);
    p.insertionMode = BEFORE_HTML_MODE;
    p._processToken(token);
}


//12.2.5.4.2 The "before html" insertion mode
//------------------------------------------------------------------
function startTagBeforeHtml(p, token) {
    if (token.tagName === $.HTML) {
        p._insertElement(token, NS.HTML);
        p.insertionMode = BEFORE_HEAD_MODE;
    }

    else
        tokenBeforeHtml(p, token);
}

function endTagBeforeHtml(p, token) {
    var tn = token.tagName;

    if (tn === $.HTML || tn === $.HEAD || tn === $.BODY || tn === $.BR)
        tokenBeforeHtml(p, token);
}

function tokenBeforeHtml(p, token) {
    p._insertFakeRootElement();
    p.insertionMode = BEFORE_HEAD_MODE;
    p._processToken(token);
}


//12.2.5.4.3 The "before head" insertion mode
//------------------------------------------------------------------
function startTagBeforeHead(p, token) {
    var tn = token.tagName;

    if (tn === $.HTML)
        startTagInBody(p, token);

    else if (tn === $.HEAD) {
        p._insertElement(token, NS.HTML);
        p.headElement = p.openElements.current;
        p.insertionMode = IN_HEAD_MODE;
    }

    else
        tokenBeforeHead(p, token);
}

function endTagBeforeHead(p, token) {
    var tn = token.tagName;

    if (tn === $.HEAD || tn === $.BODY || tn === $.HTML || tn === $.BR)
        tokenBeforeHead(p, token);
}

function tokenBeforeHead(p, token) {
    p._processFakeStartTag($.HEAD);
    p._processToken(token);
}


//12.2.5.4.4 The "in head" insertion mode
//------------------------------------------------------------------
function startTagInHead(p, token) {
    var tn = token.tagName;

    if (tn === $.HTML)
        startTagInBody(p, token);

    else if (tn === $.BASE || tn === $.BASEFONT || tn === $.BGSOUND ||
             tn === $.COMMAND || tn === $.LINK || tn === $.META) {
        p._appendElement(token, NS.HTML);
    }

    else if (tn === $.TITLE)
        p._switchToTextParsing(token, Tokenizer.MODE.RCDATA);

    //NOTE: here we assume that we always act as an interactive user agent with enabled scripting, so we parse
    //<noscript> as a rawtext.
    else if (tn === $.NOSCRIPT || tn === $.NOFRAMES || tn === $.STYLE)
        p._switchToTextParsing(token, Tokenizer.MODE.RAWTEXT);

    else if (tn === $.SCRIPT)
        p._switchToTextParsing(token, Tokenizer.MODE.SCRIPT_DATA);

    else if (tn === $.TEMPLATE) {
        p._insertTemplate(token, NS.HTML);
        p.activeFormattingElements.insertMarker();
        p.framesetOk = false;
        p.insertionMode = IN_TEMPLATE_MODE;
        p._pushTmplInsertionMode(IN_TEMPLATE_MODE);
    }

    else if (tn !== $.HEAD)
        tokenInHead(p, token);
}

function endTagInHead(p, token) {
    var tn = token.tagName;

    if (tn === $.HEAD) {
        p.openElements.pop();
        p.insertionMode = AFTER_HEAD_MODE;
    }

    else if (tn === $.BODY || tn === $.BR || tn === $.HTML)
        tokenInHead(p, token);

    else if (tn === $.TEMPLATE && p.openElements.tmplCount > 0) {
        p.openElements.generateImpliedEndTags();
        p.openElements.popUntilTemplatePopped();
        p.activeFormattingElements.clearToLastMarker();
        p._popTmplInsertionMode();
        p._resetInsertionMode();
    }
}

function tokenInHead(p, token) {
    p._processFakeEndTag($.HEAD);
    p._processToken(token);
}


//12.2.5.4.6 The "after head" insertion mode
//------------------------------------------------------------------
function startTagAfterHead(p, token) {
    var tn = token.tagName;

    if (tn === $.HTML)
        startTagInBody(p, token);

    else if (tn === $.BODY) {
        p._insertElement(token, NS.HTML);
        p.framesetOk = false;
        p.insertionMode = IN_BODY_MODE;
    }

    else if (tn === $.FRAMESET) {
        p._insertElement(token, NS.HTML);
        p.insertionMode = IN_FRAMESET_MODE;
    }

    else if (tn === $.BASE || tn === $.BASEFONT || tn === $.BGSOUND || tn === $.LINK || tn === $.META ||
             tn === $.NOFRAMES || tn === $.SCRIPT || tn === $.STYLE || tn === $.TEMPLATE || tn === $.TITLE) {
        p.openElements.push(p.headElement);
        startTagInHead(p, token);
        p.openElements.remove(p.headElement);
    }

    else if (tn !== $.HEAD)
        tokenAfterHead(p, token);
}

function endTagAfterHead(p, token) {
    var tn = token.tagName;

    if (tn === $.BODY || tn === $.HTML || tn === $.BR)
        tokenAfterHead(p, token);

    else if (tn === $.TEMPLATE)
        endTagInHead(p, token);
}

function tokenAfterHead(p, token) {
    p._processFakeStartTag($.BODY);
    p.framesetOk = true;
    p._processToken(token);
}


//12.2.5.4.7 The "in body" insertion mode
//------------------------------------------------------------------
function whitespaceCharacterInBody(p, token) {
    p._reconstructActiveFormattingElements();
    p._insertCharacters(token);
}

function characterInBody(p, token) {
    p._reconstructActiveFormattingElements();
    p._insertCharacters(token);
    p.framesetOk = false;
}

function htmlStartTagInBody(p, token) {
    if (p.openElements.tmplCount === 0)
        p.treeAdapter.adoptAttributes(p.openElements.items[0], token.attrs);
}

function bodyStartTagInBody(p, token) {
    var bodyElement = p.openElements.tryPeekProperlyNestedBodyElement();

    if (bodyElement && p.openElements.tmplCount === 0) {
        p.framesetOk = false;
        p.treeAdapter.adoptAttributes(bodyElement, token.attrs);
    }
}

function framesetStartTagInBody(p, token) {
    var bodyElement = p.openElements.tryPeekProperlyNestedBodyElement();

    if (p.framesetOk && bodyElement) {
        p.treeAdapter.detachNode(bodyElement);
        p.openElements.popAllUpToHtmlElement();
        p._insertElement(token, NS.HTML);
        p.insertionMode = IN_FRAMESET_MODE;
    }
}

function addressStartTagInBody(p, token) {
    if (p.openElements.hasInButtonScope($.P))
        p._closePElement();

    p._insertElement(token, NS.HTML);
}

function numberedHeaderStartTagInBody(p, token) {
    if (p.openElements.hasInButtonScope($.P))
        p._closePElement();

    var tn = p.openElements.currentTagName;

    if (tn === $.H1 || tn === $.H2 || tn === $.H3 || tn === $.H4 || tn === $.H5 || tn === $.H6)
        p.openElements.pop();

    p._insertElement(token, NS.HTML);
}

function preStartTagInBody(p, token) {
    if (p.openElements.hasInButtonScope($.P))
        p._closePElement();

    p._insertElement(token, NS.HTML);
    //NOTE: If the next token is a U+000A LINE FEED (LF) character token, then ignore that token and move
    //on to the next one. (Newlines at the start of pre blocks are ignored as an authoring convenience.)
    p.skipNextNewLine = true;
    p.framesetOk = false;
}

function formStartTagInBody(p, token) {
    var inTemplate = p.openElements.tmplCount > 0;

    if (!p.formElement || inTemplate) {
        if (p.openElements.hasInButtonScope($.P))
            p._closePElement();

        p._insertElement(token, NS.HTML);

        if (!inTemplate)
            p.formElement = p.openElements.current;
    }
}

function listItemStartTagInBody(p, token) {
    p.framesetOk = false;

    for (var i = p.openElements.stackTop; i >= 0; i--) {
        var element = p.openElements.items[i],
            tn = p.treeAdapter.getTagName(element);

        if ((token.tagName === $.LI && tn === $.LI) ||
            ((token.tagName === $.DD || token.tagName === $.DT) && (tn === $.DD || tn == $.DT))) {
            p._processFakeEndTag(tn);
            break;
        }

        if (tn !== $.ADDRESS && tn !== $.DIV && tn !== $.P && p._isSpecialElement(element))
            break;
    }

    if (p.openElements.hasInButtonScope($.P))
        p._closePElement();

    p._insertElement(token, NS.HTML);
}

function plaintextStartTagInBody(p, token) {
    if (p.openElements.hasInButtonScope($.P))
        p._closePElement();

    p._insertElement(token, NS.HTML);
    p.tokenizer.state = Tokenizer.MODE.PLAINTEXT;
}

function buttonStartTagInBody(p, token) {
    if (p.openElements.hasInScope($.BUTTON)) {
        p._processFakeEndTag($.BUTTON);
        buttonStartTagInBody(p, token);
    }

    else {
        p._reconstructActiveFormattingElements();
        p._insertElement(token, NS.HTML);
        p.framesetOk = false;
    }
}

function aStartTagInBody(p, token) {
    var activeElementEntry = p.activeFormattingElements.getElementEntryInScopeWithTagName($.A);

    if (activeElementEntry) {
        p._processFakeEndTag($.A);
        p.openElements.remove(activeElementEntry.element);
        p.activeFormattingElements.removeEntry(activeElementEntry);
    }

    p._reconstructActiveFormattingElements();
    p._insertElement(token, NS.HTML);
    p.activeFormattingElements.pushElement(p.openElements.current, token);
}

function bStartTagInBody(p, token) {
    p._reconstructActiveFormattingElements();
    p._insertElement(token, NS.HTML);
    p.activeFormattingElements.pushElement(p.openElements.current, token);
}

function nobrStartTagInBody(p, token) {
    p._reconstructActiveFormattingElements();

    if (p.openElements.hasInScope($.NOBR)) {
        p._processFakeEndTag($.NOBR);
        p._reconstructActiveFormattingElements();
    }

    p._insertElement(token, NS.HTML);
    p.activeFormattingElements.pushElement(p.openElements.current, token);
}

function appletStartTagInBody(p, token) {
    p._reconstructActiveFormattingElements();
    p._insertElement(token, NS.HTML);
    p.activeFormattingElements.insertMarker();
    p.framesetOk = false;
}

function tableStartTagInBody(p, token) {
    if (!p.treeAdapter.isQuirksMode(p.document) && p.openElements.hasInButtonScope($.P))
        p._closePElement();

    p._insertElement(token, NS.HTML);
    p.framesetOk = false;
    p.insertionMode = IN_TABLE_MODE;
}

function areaStartTagInBody(p, token) {
    p._reconstructActiveFormattingElements();
    p._appendElement(token, NS.HTML);
    p.framesetOk = false;
}

function inputStartTagInBody(p, token) {
    p._reconstructActiveFormattingElements();
    p._appendElement(token, NS.HTML);

    var inputType = Tokenizer.getTokenAttr(token, ATTRS.TYPE);

    if (!inputType || inputType.toLowerCase() !== HIDDEN_INPUT_TYPE)
        p.framesetOk = false;

}

function paramStartTagInBody(p, token) {
    p._appendElement(token, NS.HTML);
}

function hrStartTagInBody(p, token) {
    if (p.openElements.hasInButtonScope($.P))
        p._closePElement();

    p._appendElement(token, NS.HTML);
    p.framesetOk = false;
}

function imageStartTagInBody(p, token) {
    token.tagName = $.IMG;
    areaStartTagInBody(p, token);
}

function isindexStartTagInBody(p, token) {
    if (!p.formElement || p.openElements.tmplCount > 0) {
        p._processFakeStartTagWithAttrs($.FORM, getSearchableIndexFormAttrs(token));
        p._processFakeStartTag($.HR);
        p._processFakeStartTag($.LABEL);
        p.treeAdapter.insertText(p.openElements.current, getSearchableIndexLabelText(token));
        p._processFakeStartTagWithAttrs($.INPUT, getSearchableIndexInputAttrs(token));
        p._processFakeEndTag($.LABEL);
        p._processFakeStartTag($.HR);
        p._processFakeEndTag($.FORM);
    }
}

function textareaStartTagInBody(p, token) {
    p._insertElement(token, NS.HTML);
    //NOTE: If the next token is a U+000A LINE FEED (LF) character token, then ignore that token and move
    //on to the next one. (Newlines at the start of textarea elements are ignored as an authoring convenience.)
    p.skipNextNewLine = true;
    p.tokenizer.state = Tokenizer.MODE.RCDATA;
    p.originalInsertionMode = p.insertionMode;
    p.framesetOk = false;
    p.insertionMode = TEXT_MODE;
}

function xmpStartTagInBody(p, token) {
    if (p.openElements.hasInButtonScope($.P))
        p._closePElement();

    p._reconstructActiveFormattingElements();
    p.framesetOk = false;
    p._switchToTextParsing(token, Tokenizer.MODE.RAWTEXT);
}

function iframeStartTagInBody(p, token) {
    p.framesetOk = false;
    p._switchToTextParsing(token, Tokenizer.MODE.RAWTEXT);
}

//NOTE: here we assume that we always act as an user agent with enabled plugins, so we parse
//<noembed> as a rawtext.
function noembedStartTagInBody(p, token) {
    p._switchToTextParsing(token, Tokenizer.MODE.RAWTEXT);
}

function selectStartTagInBody(p, token) {
    p._reconstructActiveFormattingElements();
    p._insertElement(token, NS.HTML);
    p.framesetOk = false;

    if (p.insertionMode === IN_TABLE_MODE || p.insertionMode === IN_CAPTION_MODE ||
        p.insertionMode === IN_TABLE_BODY_MODE || p.insertionMode === IN_ROW_MODE ||
        p.insertionMode === IN_CELL_MODE) {
        p.insertionMode = IN_SELECT_IN_TABLE_MODE;
    }

    else
        p.insertionMode = IN_SELECT_MODE;
}

function optgroupStartTagInBody(p, token) {
    if (p.openElements.currentTagName === $.OPTION)
        p._processFakeEndTag($.OPTION);

    p._reconstructActiveFormattingElements();
    p._insertElement(token, NS.HTML);
}

function rpStartTagInBody(p, token) {
    if (p.openElements.hasInScope($.RUBY))
        p.openElements.generateImpliedEndTags();

    p._insertElement(token, NS.HTML);
}

function menuitemStartTagInBody(p, token) {
    p._appendElement(token, NS.HTML);
}

function mathStartTagInBody(p, token) {
    p._reconstructActiveFormattingElements();

    ForeignContent.adjustTokenMathMLAttrs(token);
    ForeignContent.adjustTokenXMLAttrs(token);

    if (token.selfClosing)
        p._appendElement(token, NS.MATHML);
    else
        p._insertElement(token, NS.MATHML);
}

function svgStartTagInBody(p, token) {
    p._reconstructActiveFormattingElements();

    ForeignContent.adjustTokenSVGAttrs(token);
    ForeignContent.adjustTokenXMLAttrs(token);

    if (token.selfClosing)
        p._appendElement(token, NS.SVG);
    else
        p._insertElement(token, NS.SVG);
}

function genericStartTagInBody(p, token) {
    p._reconstructActiveFormattingElements();
    p._insertElement(token, NS.HTML);
}

//OPTIMIZATION: Integer comparisons are low-cost, so we can use very fast tag name length filters here.
//It's faster than using dictionary.
function startTagInBody(p, token) {
    var tn = token.tagName;

    switch (tn.length) {
        case 1:
            if (tn === $.I || tn === $.S || tn === $.B || tn === $.U)
                bStartTagInBody(p, token);

            else if (tn === $.P)
                addressStartTagInBody(p, token);

            else if (tn === $.A)
                aStartTagInBody(p, token);

            else
                genericStartTagInBody(p, token);

            break;

        case 2:
            if (tn === $.DL || tn === $.OL || tn === $.UL)
                addressStartTagInBody(p, token);

            else if (tn === $.H1 || tn === $.H2 || tn === $.H3 || tn === $.H4 || tn === $.H5 || tn === $.H6)
                numberedHeaderStartTagInBody(p, token);

            else if (tn === $.LI || tn === $.DD || tn === $.DT)
                listItemStartTagInBody(p, token);

            else if (tn === $.EM || tn === $.TT)
                bStartTagInBody(p, token);

            else if (tn === $.BR)
                areaStartTagInBody(p, token);

            else if (tn === $.HR)
                hrStartTagInBody(p, token);

            else if (tn === $.RP || tn === $.RT)
                rpStartTagInBody(p, token);

            else if (tn !== $.TH && tn !== $.TD && tn !== $.TR)
                genericStartTagInBody(p, token);

            break;

        case 3:
            if (tn === $.DIV || tn === $.DIR || tn === $.NAV)
                addressStartTagInBody(p, token);

            else if (tn === $.PRE)
                preStartTagInBody(p, token);

            else if (tn === $.BIG)
                bStartTagInBody(p, token);

            else if (tn === $.IMG || tn === $.WBR)
                areaStartTagInBody(p, token);

            else if (tn === $.XMP)
                xmpStartTagInBody(p, token);

            else if (tn === $.SVG)
                svgStartTagInBody(p, token);

            else if (tn !== $.COL)
                genericStartTagInBody(p, token);

            break;

        case 4:
            if (tn === $.HTML)
                htmlStartTagInBody(p, token);

            else if (tn === $.BASE || tn === $.LINK || tn === $.META)
                startTagInHead(p, token);

            else if (tn === $.BODY)
                bodyStartTagInBody(p, token);

            else if (tn === $.MAIN || tn === $.MENU)
                addressStartTagInBody(p, token);

            else if (tn === $.FORM)
                formStartTagInBody(p, token);

            else if (tn === $.CODE || tn === $.FONT)
                bStartTagInBody(p, token);

            else if (tn === $.NOBR)
                nobrStartTagInBody(p, token);

            else if (tn === $.AREA)
                areaStartTagInBody(p, token);

            else if (tn === $.MATH)
                mathStartTagInBody(p, token);

            else if (tn !== $.HEAD)
                genericStartTagInBody(p, token);

            break;

        case 5:
            if (tn === $.STYLE || tn === $.TITLE)
                startTagInHead(p, token);

            else if (tn === $.ASIDE)
                addressStartTagInBody(p, token);

            else if (tn === $.SMALL)
                bStartTagInBody(p, token);

            else if (tn === $.TABLE)
                tableStartTagInBody(p, token);

            else if (tn === $.EMBED)
                areaStartTagInBody(p, token);

            else if (tn === $.INPUT)
                inputStartTagInBody(p, token);

            else if (tn === $.PARAM || tn === $.TRACK)
                paramStartTagInBody(p, token);

            else if (tn === $.IMAGE)
                imageStartTagInBody(p, token);

            else if (tn !== $.FRAME && tn !== $.TBODY && tn !== $.TFOOT && tn !== $.THEAD)
                genericStartTagInBody(p, token);

            break;

        case 6:
            if (tn === $.SCRIPT)
                startTagInHead(p, token);

            else if (tn === $.CENTER || tn === $.FIGURE || tn === $.FOOTER || tn === $.HEADER || tn === $.HGROUP)
                addressStartTagInBody(p, token);

            else if (tn === $.BUTTON)
                buttonStartTagInBody(p, token);

            else if (tn === $.STRIKE || tn === $.STRONG)
                bStartTagInBody(p, token);

            else if (tn === $.APPLET || tn === $.OBJECT)
                appletStartTagInBody(p, token);

            else if (tn === $.KEYGEN)
                areaStartTagInBody(p, token);

            else if (tn === $.SOURCE)
                paramStartTagInBody(p, token);

            else if (tn === $.IFRAME)
                iframeStartTagInBody(p, token);

            else if (tn === $.SELECT)
                selectStartTagInBody(p, token);

            else if (tn === $.OPTION)
                optgroupStartTagInBody(p, token);

            else
                genericStartTagInBody(p, token);

            break;

        case 7:
            if (tn === $.BGSOUND || tn === $.COMMAND)
                startTagInHead(p, token);

            else if (tn === $.DETAILS || tn === $.ADDRESS || tn === $.ARTICLE || tn === $.SECTION || tn === $.SUMMARY)
                addressStartTagInBody(p, token);

            else if (tn === $.LISTING)
                preStartTagInBody(p, token);

            else if (tn === $.MARQUEE)
                appletStartTagInBody(p, token);

            else if (tn === $.ISINDEX)
                isindexStartTagInBody(p, token);

            else if (tn === $.NOEMBED)
                noembedStartTagInBody(p, token);

            else if (tn !== $.CAPTION)
                genericStartTagInBody(p, token);

            break;

        case 8:
            if (tn === $.BASEFONT || tn === $.MENUITEM)
                menuitemStartTagInBody(p, token);

            else if (tn === $.FRAMESET)
                framesetStartTagInBody(p, token);

            else if (tn === $.FIELDSET)
                addressStartTagInBody(p, token);

            else if (tn === $.TEXTAREA)
                textareaStartTagInBody(p, token);

            else if (tn === $.TEMPLATE)
                startTagInHead(p, token);

            else if (tn === $.NOSCRIPT)
                noembedStartTagInBody(p, token);

            else if (tn === $.OPTGROUP)
                optgroupStartTagInBody(p, token);

            else if (tn !== $.COLGROUP)
                genericStartTagInBody(p, token);

            break;

        case 9:
            if (tn === $.PLAINTEXT)
                plaintextStartTagInBody(p, token);

            else
                genericStartTagInBody(p, token);

            break;

        case 10:
            if (tn === $.BLOCKQUOTE || tn === $.FIGCAPTION)
                addressStartTagInBody(p, token);

            else
                genericStartTagInBody(p, token);

            break;

        default:
            genericStartTagInBody(p, token);
    }
}

function bodyEndTagInBody(p, token) {
    if (p.openElements.hasInScope($.BODY))
        p.insertionMode = AFTER_BODY_MODE;

    else
        token.ignored = true;
}

function htmlEndTagInBody(p, token) {
    var fakeToken = p._processFakeEndTag($.BODY);

    if (!fakeToken.ignored)
        p._processToken(token);
}

function addressEndTagInBody(p, token) {
    var tn = token.tagName;

    if (p.openElements.hasInScope(tn)) {
        p.openElements.generateImpliedEndTags();
        p.openElements.popUntilTagNamePopped(tn);
    }
}

function formEndTagInBody(p, token) {
    var inTemplate = p.openElements.tmplCount > 0,
        formElement = p.formElement;

    if (!inTemplate)
        p.formElement = null;

    if ((formElement || inTemplate) && p.openElements.hasInScope($.FORM)) {
        p.openElements.generateImpliedEndTags();

        if (inTemplate)
            p.openElements.popUntilTagNamePopped($.FORM);

        else
            p.openElements.remove(formElement);
    }
}

function pEndTagInBody(p, token) {
    if (p.openElements.hasInButtonScope($.P)) {
        p.openElements.generateImpliedEndTagsWithExclusion($.P);
        p.openElements.popUntilTagNamePopped($.P);
    }

    else {
        p._processFakeStartTag($.P);
        p._processToken(token);
    }
}

function liEndTagInBody(p, token) {
    if (p.openElements.hasInListItemScope($.LI)) {
        p.openElements.generateImpliedEndTagsWithExclusion($.LI);
        p.openElements.popUntilTagNamePopped($.LI);
    }
}

function ddEndTagInBody(p, token) {
    var tn = token.tagName;

    if (p.openElements.hasInScope(tn)) {
        p.openElements.generateImpliedEndTagsWithExclusion(tn);
        p.openElements.popUntilTagNamePopped(tn);
    }
}

function numberedHeaderEndTagInBody(p, token) {
    if (p.openElements.hasNumberedHeaderInScope()) {
        p.openElements.generateImpliedEndTags();
        p.openElements.popUntilNumberedHeaderPopped();
    }
}

function appletEndTagInBody(p, token) {
    var tn = token.tagName;

    if (p.openElements.hasInScope(tn)) {
        p.openElements.generateImpliedEndTags();
        p.openElements.popUntilTagNamePopped(tn);
        p.activeFormattingElements.clearToLastMarker();
    }
}

function brEndTagInBody(p, token) {
    p._processFakeStartTag($.BR);
}

function genericEndTagInBody(p, token) {
    var tn = token.tagName;

    for (var i = p.openElements.stackTop; i > 0; i--) {
        var element = p.openElements.items[i];

        if (p.treeAdapter.getTagName(element) === tn) {
            p.openElements.generateImpliedEndTagsWithExclusion(tn);
            p.openElements.popUntilElementPopped(element);
            break;
        }

        if (p._isSpecialElement(element))
            break;
    }
}

//OPTIMIZATION: Integer comparisons are low-cost, so we can use very fast tag name length filters here.
//It's faster than using dictionary.
function endTagInBody(p, token) {
    var tn = token.tagName;

    switch (tn.length) {
        case 1:
            if (tn === $.A || tn === $.B || tn === $.I || tn === $.S || tn == $.U)
                callAdoptionAgency(p, token);

            else if (tn === $.P)
                pEndTagInBody(p, token);

            else
                genericEndTagInBody(p, token);

            break;

        case 2:
            if (tn == $.DL || tn === $.UL || tn === $.OL)
                addressEndTagInBody(p, token);

            else if (tn === $.LI)
                liEndTagInBody(p, token);

            else if (tn === $.DD || tn === $.DT)
                ddEndTagInBody(p, token);

            else if (tn === $.H1 || tn === $.H2 || tn === $.H3 || tn === $.H4 || tn === $.H5 || tn === $.H6)
                numberedHeaderEndTagInBody(p, token);

            else if (tn === $.BR)
                brEndTagInBody(p, token);

            else if (tn === $.EM || tn === $.TT)
                callAdoptionAgency(p, token);

            else
                genericEndTagInBody(p, token);

            break;

        case 3:
            if (tn === $.BIG)
                callAdoptionAgency(p, token);

            else if (tn === $.DIR || tn === $.DIV || tn === $.NAV)
                addressEndTagInBody(p, token);

            else
                genericEndTagInBody(p, token);

            break;

        case 4:
            if (tn === $.BODY)
                bodyEndTagInBody(p, token);

            else if (tn === $.HTML)
                htmlEndTagInBody(p, token);

            else if (tn === $.FORM)
                formEndTagInBody(p, token);

            else if (tn === $.CODE || tn === $.FONT || tn === $.NOBR)
                callAdoptionAgency(p, token);

            else if (tn === $.MAIN || tn === $.MENU)
                addressEndTagInBody(p, token);

            else
                genericEndTagInBody(p, token);

            break;

        case 5:
            if (tn === $.ASIDE)
                addressEndTagInBody(p, token);

            else if (tn === $.SMALL)
                callAdoptionAgency(p, token);

            else
                genericEndTagInBody(p, token);

            break;

        case 6:
            if (tn === $.CENTER || tn === $.FIGURE || tn === $.FOOTER || tn === $.HEADER || tn === $.HGROUP)
                addressEndTagInBody(p, token);

            else if (tn === $.APPLET || tn === $.OBJECT)
                appletEndTagInBody(p, token);

            else if (tn == $.STRIKE || tn === $.STRONG)
                callAdoptionAgency(p, token);

            else
                genericEndTagInBody(p, token);

            break;

        case 7:
            if (tn === $.ADDRESS || tn === $.ARTICLE || tn === $.DETAILS || tn === $.SECTION || tn === $.SUMMARY)
                addressEndTagInBody(p, token);

            else if (tn === $.MARQUEE)
                appletEndTagInBody(p, token);

            else
                genericEndTagInBody(p, token);

            break;

        case 8:
            if (tn === $.FIELDSET)
                addressEndTagInBody(p, token);

            else if (tn === $.TEMPLATE)
                endTagInHead(p, token);

            else
                genericEndTagInBody(p, token);

            break;

        case 10:
            if (tn === $.BLOCKQUOTE || tn === $.FIGCAPTION)
                addressEndTagInBody(p, token);

            else
                genericEndTagInBody(p, token);

            break;

        default :
            genericEndTagInBody(p, token);
    }
}

function eofInBody(p, token) {
    if (p.tmplInsertionModeStackTop > -1)
        eofInTemplate(p, token);

    else
        p.stopped = true;
}

//12.2.5.4.8 The "text" insertion mode
//------------------------------------------------------------------
function endTagInText(p, token) {
    if (!p.fragmentContext && p.scriptHandler && token.tagName === $.SCRIPT)
        p.scriptHandler(p.document, p.openElements.current);

    p.openElements.pop();
    p.insertionMode = p.originalInsertionMode;
}


function eofInText(p, token) {
    p.openElements.pop();
    p.insertionMode = p.originalInsertionMode;
    p._processToken(token);
}


//12.2.5.4.9 The "in table" insertion mode
//------------------------------------------------------------------
function characterInTable(p, token) {
    var curTn = p.openElements.currentTagName;

    if (curTn === $.TABLE || curTn === $.TBODY || curTn === $.TFOOT || curTn === $.THEAD || curTn === $.TR) {
        p.pendingCharacterTokens = [];
        p.hasNonWhitespacePendingCharacterToken = false;
        p.originalInsertionMode = p.insertionMode;
        p.insertionMode = IN_TABLE_TEXT_MODE;
        p._processToken(token);
    }

    else
        tokenInTable(p, token);
}

function captionStartTagInTable(p, token) {
    p.openElements.clearBackToTableContext();
    p.activeFormattingElements.insertMarker();
    p._insertElement(token, NS.HTML);
    p.insertionMode = IN_CAPTION_MODE;
}

function colgroupStartTagInTable(p, token) {
    p.openElements.clearBackToTableContext();
    p._insertElement(token, NS.HTML);
    p.insertionMode = IN_COLUMN_GROUP_MODE;
}

function colStartTagInTable(p, token) {
    p._processFakeStartTag($.COLGROUP);
    p._processToken(token);
}

function tbodyStartTagInTable(p, token) {
    p.openElements.clearBackToTableContext();
    p._insertElement(token, NS.HTML);
    p.insertionMode = IN_TABLE_BODY_MODE;
}

function tdStartTagInTable(p, token) {
    p._processFakeStartTag($.TBODY);
    p._processToken(token);
}

function tableStartTagInTable(p, token) {
    var fakeToken = p._processFakeEndTag($.TABLE);

    //NOTE: The fake end tag token here can only be ignored in the fragment case.
    if (!fakeToken.ignored)
        p._processToken(token);
}

function inputStartTagInTable(p, token) {
    var inputType = Tokenizer.getTokenAttr(token, ATTRS.TYPE);

    if (inputType && inputType.toLowerCase() === HIDDEN_INPUT_TYPE)
        p._appendElement(token, NS.HTML);

    else
        tokenInTable(p, token);
}

function formStartTagInTable(p, token) {
    if (!p.formElement && p.openElements.tmplCount === 0) {
        p._insertElement(token, NS.HTML);
        p.formElement = p.openElements.current;
        p.openElements.pop();
    }
}

function startTagInTable(p, token) {
    var tn = token.tagName;

    switch (tn.length) {
        case 2:
            if (tn === $.TD || tn === $.TH || tn === $.TR)
                tdStartTagInTable(p, token);

            else
                tokenInTable(p, token);

            break;

        case 3:
            if (tn === $.COL)
                colStartTagInTable(p, token);

            else
                tokenInTable(p, token);

            break;

        case 4:
            if (tn === $.FORM)
                formStartTagInTable(p, token);

            else
                tokenInTable(p, token);

            break;

        case 5:
            if (tn === $.TABLE)
                tableStartTagInTable(p, token);

            else if (tn === $.STYLE)
                startTagInHead(p, token);

            else if (tn === $.TBODY || tn === $.TFOOT || tn === $.THEAD)
                tbodyStartTagInTable(p, token);

            else if (tn === $.INPUT)
                inputStartTagInTable(p, token);

            else
                tokenInTable(p, token);

            break;

        case 6:
            if (tn === $.SCRIPT)
                startTagInHead(p, token);

            else
                tokenInTable(p, token);

            break;

        case 7:
            if (tn === $.CAPTION)
                captionStartTagInTable(p, token);

            else
                tokenInTable(p, token);

            break;

        case 8:
            if (tn === $.COLGROUP)
                colgroupStartTagInTable(p, token);

            else if (tn === $.TEMPLATE)
                startTagInHead(p, token);

            else
                tokenInTable(p, token);

            break;

        default:
            tokenInTable(p, token);
    }

}

function endTagInTable(p, token) {
    var tn = token.tagName;

    if (tn === $.TABLE) {
        if (p.openElements.hasInTableScope($.TABLE)) {
            p.openElements.popUntilTagNamePopped($.TABLE);
            p._resetInsertionMode();
        }

        else
            token.ignored = true;
    }

    else if (tn === $.TEMPLATE)
        endTagInHead(p, token);

    else if (tn !== $.BODY && tn !== $.CAPTION && tn !== $.COL && tn !== $.COLGROUP && tn !== $.HTML &&
             tn !== $.TBODY && tn !== $.TD && tn !== $.TFOOT && tn !== $.TH && tn !== $.THEAD && tn !== $.TR) {
        tokenInTable(p, token);
    }
}

function tokenInTable(p, token) {
    var savedFosterParentingState = p.fosterParentingEnabled;

    p.fosterParentingEnabled = true;
    p._processTokenInBodyMode(token);
    p.fosterParentingEnabled = savedFosterParentingState;
}


//12.2.5.4.10 The "in table text" insertion mode
//------------------------------------------------------------------
function whitespaceCharacterInTableText(p, token) {
    p.pendingCharacterTokens.push(token);
}

function characterInTableText(p, token) {
    p.pendingCharacterTokens.push(token);
    p.hasNonWhitespacePendingCharacterToken = true;
}

function tokenInTableText(p, token) {
    if (p.hasNonWhitespacePendingCharacterToken) {
        for (var i = 0; i < p.pendingCharacterTokens.length; i++)
            tokenInTable(p, p.pendingCharacterTokens[i]);
    }

    else {
        for (var i = 0; i < p.pendingCharacterTokens.length; i++)
            p._insertCharacters(p.pendingCharacterTokens[i]);
    }

    p.insertionMode = p.originalInsertionMode;
    p._processToken(token);
}


//12.2.5.4.11 The "in caption" insertion mode
//------------------------------------------------------------------
function startTagInCaption(p, token) {
    var tn = token.tagName;

    if (tn === $.CAPTION || tn === $.COL || tn === $.COLGROUP || tn === $.TBODY ||
        tn === $.TD || tn === $.TFOOT || tn === $.TH || tn === $.THEAD || tn === $.TR) {
        var fakeToken = p._processFakeEndTag($.CAPTION);

        //NOTE: The fake end tag token here can only be ignored in the fragment case.
        if (!fakeToken.ignored)
            p._processToken(token);
    }

    else
        startTagInBody(p, token);
}

function endTagInCaption(p, token) {
    var tn = token.tagName;

    if (tn === $.CAPTION) {
        if (p.openElements.hasInTableScope($.CAPTION)) {
            p.openElements.generateImpliedEndTags();
            p.openElements.popUntilTagNamePopped($.CAPTION);
            p.activeFormattingElements.clearToLastMarker();
            p.insertionMode = IN_TABLE_MODE;
        }

        else
            token.ignored = true;
    }

    else if (tn === $.TABLE) {
        var fakeToken = p._processFakeEndTag($.CAPTION);

        //NOTE: The fake end tag token here can only be ignored in the fragment case.
        if (!fakeToken.ignored)
            p._processToken(token);
    }

    else if (tn !== $.BODY && tn !== $.COL && tn !== $.COLGROUP && tn !== $.HTML && tn !== $.TBODY &&
             tn !== $.TD && tn !== $.TFOOT && tn !== $.TH && tn !== $.THEAD && tn !== $.TR) {
        endTagInBody(p, token);
    }
}


//12.2.5.4.12 The "in column group" insertion mode
//------------------------------------------------------------------
function startTagInColumnGroup(p, token) {
    var tn = token.tagName;

    if (tn === $.HTML)
        startTagInBody(p, token);

    else if (tn === $.COL)
        p._appendElement(token, NS.HTML);

    else if (tn === $.TEMPLATE)
        startTagInHead(p, token);

    else
        tokenInColumnGroup(p, token);
}

function endTagInColumnGroup(p, token) {
    var tn = token.tagName;

    if (tn === $.COLGROUP) {
        if (p.openElements.currentTagName !== $.COLGROUP)
            token.ignored = true;

        else {
            p.openElements.pop();
            p.insertionMode = IN_TABLE_MODE;
        }
    }

    else if (tn === $.TEMPLATE)
        endTagInHead(p, token);

    else if (tn !== $.COL)
        tokenInColumnGroup(p, token);
}

function tokenInColumnGroup(p, token) {
    var fakeToken = p._processFakeEndTag($.COLGROUP);

    //NOTE: The fake end tag token here can only be ignored in the fragment case.
    if (!fakeToken.ignored)
        p._processToken(token);
}

//12.2.5.4.13 The "in table body" insertion mode
//------------------------------------------------------------------
function startTagInTableBody(p, token) {
    var tn = token.tagName;

    if (tn === $.TR) {
        p.openElements.clearBackToTableBodyContext();
        p._insertElement(token, NS.HTML);
        p.insertionMode = IN_ROW_MODE;
    }

    else if (tn === $.TH || tn === $.TD) {
        p._processFakeStartTag($.TR);
        p._processToken(token);
    }

    else if (tn === $.CAPTION || tn === $.COL || tn === $.COLGROUP ||
             tn === $.TBODY || tn === $.TFOOT || tn === $.THEAD) {

        if (p.openElements.hasTableBodyContextInTableScope()) {
            p.openElements.clearBackToTableBodyContext();
            p._processFakeEndTag(p.openElements.currentTagName);
            p._processToken(token);
        }
    }

    else
        startTagInTable(p, token);
}

function endTagInTableBody(p, token) {
    var tn = token.tagName;

    if (tn === $.TBODY || tn === $.TFOOT || tn === $.THEAD) {
        if (p.openElements.hasInTableScope(tn)) {
            p.openElements.clearBackToTableBodyContext();
            p.openElements.pop();
            p.insertionMode = IN_TABLE_MODE;
        }
    }

    else if (tn === $.TABLE) {
        if (p.openElements.hasTableBodyContextInTableScope()) {
            p.openElements.clearBackToTableBodyContext();
            p._processFakeEndTag(p.openElements.currentTagName);
            p._processToken(token);
        }
    }

    else if (tn !== $.BODY && tn !== $.CAPTION && tn !== $.COL && tn !== $.COLGROUP ||
             tn !== $.HTML && tn !== $.TD && tn !== $.TH && tn !== $.TR) {
        endTagInTable(p, token);
    }
}

//12.2.5.4.14 The "in row" insertion mode
//------------------------------------------------------------------
function startTagInRow(p, token) {
    var tn = token.tagName;

    if (tn === $.TH || tn === $.TD) {
        p.openElements.clearBackToTableRowContext();
        p._insertElement(token, NS.HTML);
        p.insertionMode = IN_CELL_MODE;
        p.activeFormattingElements.insertMarker();
    }

    else if (tn === $.CAPTION || tn === $.COL || tn === $.COLGROUP || tn === $.TBODY ||
             tn === $.TFOOT || tn === $.THEAD || tn === $.TR) {
        var fakeToken = p._processFakeEndTag($.TR);

        //NOTE: The fake end tag token here can only be ignored in the fragment case.
        if (!fakeToken.ignored)
            p._processToken(token);
    }

    else
        startTagInTable(p, token);
}

function endTagInRow(p, token) {
    var tn = token.tagName;

    if (tn === $.TR) {
        if (p.openElements.hasInTableScope($.TR)) {
            p.openElements.clearBackToTableRowContext();
            p.openElements.pop();
            p.insertionMode = IN_TABLE_BODY_MODE;
        }

        else
            token.ignored = true;
    }

    else if (tn === $.TABLE) {
        var fakeToken = p._processFakeEndTag($.TR);

        //NOTE: The fake end tag token here can only be ignored in the fragment case.
        if (!fakeToken.ignored)
            p._processToken(token);
    }

    else if (tn === $.TBODY || tn === $.TFOOT || tn === $.THEAD) {
        if (p.openElements.hasInTableScope(tn)) {
            p._processFakeEndTag($.TR);
            p._processToken(token);
        }
    }

    else if (tn !== $.BODY && tn !== $.CAPTION && tn !== $.COL && tn !== $.COLGROUP ||
             tn !== $.HTML && tn !== $.TD && tn !== $.TH) {
        endTagInTable(p, token);
    }
}


//12.2.5.4.15 The "in cell" insertion mode
//------------------------------------------------------------------
function startTagInCell(p, token) {
    var tn = token.tagName;

    if (tn === $.CAPTION || tn === $.COL || tn === $.COLGROUP || tn === $.TBODY ||
        tn === $.TD || tn === $.TFOOT || tn === $.TH || tn === $.THEAD || tn === $.TR) {

        if (p.openElements.hasInTableScope($.TD) || p.openElements.hasInTableScope($.TH)) {
            p._closeTableCell();
            p._processToken(token);
        }
    }

    else
        startTagInBody(p, token);
}

function endTagInCell(p, token) {
    var tn = token.tagName;

    if (tn === $.TD || tn === $.TH) {
        if (p.openElements.hasInTableScope(tn)) {
            p.openElements.generateImpliedEndTags();
            p.openElements.popUntilTagNamePopped(tn);
            p.activeFormattingElements.clearToLastMarker();
            p.insertionMode = IN_ROW_MODE;
        }
    }

    else if (tn === $.TABLE || tn === $.TBODY || tn === $.TFOOT || tn === $.THEAD || tn === $.TR) {
        if (p.openElements.hasInTableScope(tn)) {
            p._closeTableCell();
            p._processToken(token);
        }
    }

    else if (tn !== $.BODY && tn !== $.CAPTION && tn !== $.COL && tn !== $.COLGROUP && tn !== $.HTML)
        endTagInBody(p, token);
}

//12.2.5.4.16 The "in select" insertion mode
//------------------------------------------------------------------
function startTagInSelect(p, token) {
    var tn = token.tagName;

    if (tn === $.HTML)
        startTagInBody(p, token);

    else if (tn === $.OPTION) {
        if (p.openElements.currentTagName === $.OPTION)
            p._processFakeEndTag($.OPTION);

        p._insertElement(token, NS.HTML);
    }

    else if (tn === $.OPTGROUP) {
        if (p.openElements.currentTagName === $.OPTION)
            p._processFakeEndTag($.OPTION);

        if (p.openElements.currentTagName === $.OPTGROUP)
            p._processFakeEndTag($.OPTGROUP);

        p._insertElement(token, NS.HTML);
    }

    else if (tn === $.SELECT)
        p._processFakeEndTag($.SELECT);

    else if (tn === $.INPUT || tn === $.KEYGEN || tn === $.TEXTAREA) {
        if (p.openElements.hasInSelectScope($.SELECT)) {
            p._processFakeEndTag($.SELECT);
            p._processToken(token);
        }
    }

    else if (tn === $.SCRIPT || tn === $.TEMPLATE)
        startTagInHead(p, token);
}

function endTagInSelect(p, token) {
    var tn = token.tagName;

    if (tn === $.OPTGROUP) {
        var prevOpenElement = p.openElements.items[p.openElements.stackTop - 1],
            prevOpenElementTn = prevOpenElement && p.treeAdapter.getTagName(prevOpenElement);

        if (p.openElements.currentTagName === $.OPTION && prevOpenElementTn === $.OPTGROUP)
            p._processFakeEndTag($.OPTION);

        if (p.openElements.currentTagName === $.OPTGROUP)
            p.openElements.pop();
    }

    else if (tn === $.OPTION) {
        if (p.openElements.currentTagName === $.OPTION)
            p.openElements.pop();
    }

    else if (tn === $.SELECT && p.openElements.hasInSelectScope($.SELECT)) {
        p.openElements.popUntilTagNamePopped($.SELECT);
        p._resetInsertionMode();
    }

    else if (tn === $.TEMPLATE)
        endTagInHead(p, token);
}

//12.2.5.4.17 The "in select in table" insertion mode
//------------------------------------------------------------------
function startTagInSelectInTable(p, token) {
    var tn = token.tagName;

    if (tn === $.CAPTION || tn === $.TABLE || tn === $.TBODY || tn === $.TFOOT ||
        tn === $.THEAD || tn === $.TR || tn === $.TD || tn === $.TH) {
        p._processFakeEndTag($.SELECT);
        p._processToken(token);
    }

    else
        startTagInSelect(p, token);
}

function endTagInSelectInTable(p, token) {
    var tn = token.tagName;

    if (tn === $.CAPTION || tn === $.TABLE || tn === $.TBODY || tn === $.TFOOT ||
        tn === $.THEAD || tn === $.TR || tn === $.TD || tn === $.TH) {
        if (p.openElements.hasInTableScope(tn)) {
            p._processFakeEndTag($.SELECT);
            p._processToken(token);
        }
    }

    else
        endTagInSelect(p, token);
}

//12.2.5.4.18 The "in template" insertion mode
//------------------------------------------------------------------
function startTagInTemplate(p, token) {
    var tn = token.tagName;

    if (tn === $.BASE || tn === $.BASEFONT || tn === $.BGSOUND || tn === $.LINK || tn === $.META ||
        tn === $.NOFRAMES || tn === $.SCRIPT || tn === $.STYLE || tn === $.TEMPLATE || tn === $.TITLE) {
        startTagInHead(p, token);
    }

    else {
        var newInsertionMode = TEMPLATE_INSERTION_MODE_SWITCH_MAP[tn] || IN_BODY_MODE;

        p._popTmplInsertionMode();
        p._pushTmplInsertionMode(newInsertionMode);
        p.insertionMode = newInsertionMode;
        p._processToken(token);
    }
}

function endTagInTemplate(p, token) {
    if (token.tagName === $.TEMPLATE)
        endTagInHead(p, token);
}

function eofInTemplate(p, token) {
    if (p.openElements.tmplCount > 0) {
        p.openElements.popUntilTemplatePopped();
        p.activeFormattingElements.clearToLastMarker();
        p._popTmplInsertionMode();
        p._resetInsertionMode();
        p._processToken(token);
    }

    else
        p.stopped = true;
}


//12.2.5.4.19 The "after body" insertion mode
//------------------------------------------------------------------
function startTagAfterBody(p, token) {
    if (token.tagName === $.HTML)
        startTagInBody(p, token);

    else
        tokenAfterBody(p, token);
}

function endTagAfterBody(p, token) {
    if (token.tagName === $.HTML) {
        if (!p.fragmentContext)
            p.insertionMode = AFTER_AFTER_BODY_MODE;
    }

    else
        tokenAfterBody(p, token);
}

function tokenAfterBody(p, token) {
    p.insertionMode = IN_BODY_MODE;
    p._processToken(token);
}

//12.2.5.4.20 The "in frameset" insertion mode
//------------------------------------------------------------------
function startTagInFrameset(p, token) {
    var tn = token.tagName;

    if (tn === $.HTML)
        startTagInBody(p, token);

    else if (tn === $.FRAMESET)
        p._insertElement(token, NS.HTML);

    else if (tn === $.FRAME)
        p._appendElement(token, NS.HTML);

    else if (tn === $.NOFRAMES)
        startTagInHead(p, token);
}

function endTagInFrameset(p, token) {
    if (token.tagName === $.FRAMESET && !p.openElements.isRootHtmlElementCurrent()) {
        p.openElements.pop();

        if (!p.fragmentContext && p.openElements.currentTagName !== $.FRAMESET)
            p.insertionMode = AFTER_FRAMESET_MODE;
    }
}

//12.2.5.4.21 The "after frameset" insertion mode
//------------------------------------------------------------------
function startTagAfterFrameset(p, token) {
    var tn = token.tagName;

    if (tn === $.HTML)
        startTagInBody(p, token);

    else if (tn === $.NOFRAMES)
        startTagInHead(p, token);
}

function endTagAfterFrameset(p, token) {
    if (token.tagName === $.HTML)
        p.insertionMode = AFTER_AFTER_FRAMESET_MODE;
}

//12.2.5.4.22 The "after after body" insertion mode
//------------------------------------------------------------------
function startTagAfterAfterBody(p, token) {
    if (token.tagName === $.HTML)
        startTagInBody(p, token);

    else
        tokenAfterAfterBody(p, token);
}

function tokenAfterAfterBody(p, token) {
    p.insertionMode = IN_BODY_MODE;
    p._processToken(token);
}

//12.2.5.4.23 The "after after frameset" insertion mode
//------------------------------------------------------------------
function startTagAfterAfterFrameset(p, token) {
    var tn = token.tagName;

    if (tn === $.HTML)
        startTagInBody(p, token);

    else if (tn === $.NOFRAMES)
        startTagInHead(p, token);
}


//12.2.5.5 The rules for parsing tokens in foreign content
//------------------------------------------------------------------
function nullCharacterInForeignContent(p, token) {
    token.chars = UNICODE.REPLACEMENT_CHARACTER;
    p._insertCharacters(token);
}

function characterInForeignContent(p, token) {
    p._insertCharacters(token);
    p.framesetOk = false;
}

function startTagInForeignContent(p, token) {
    if (ForeignContent.causesExit(token) && !p.fragmentContext) {
        while (p.treeAdapter.getNamespaceURI(p.openElements.current) !== NS.HTML &&
               (!p._isMathMLTextIntegrationPoint(p.openElements.current)) &&
               (!p._isHtmlIntegrationPoint(p.openElements.current))) {
            p.openElements.pop();
        }

        p._processToken(token);
    }

    else {
        var current = p._getAdjustedCurrentElement(),
            currentNs = p.treeAdapter.getNamespaceURI(current);

        if (currentNs === NS.MATHML)
            ForeignContent.adjustTokenMathMLAttrs(token);

        else if (currentNs === NS.SVG) {
            ForeignContent.adjustTokenSVGTagName(token);
            ForeignContent.adjustTokenSVGAttrs(token);
        }

        ForeignContent.adjustTokenXMLAttrs(token);

        if (token.selfClosing)
            p._appendElement(token, currentNs);
        else
            p._insertElement(token, currentNs);
    }
}

function endTagInForeignContent(p, token) {
    for (var i = p.openElements.stackTop; i > 0; i--) {
        var element = p.openElements.items[i];

        if (p.treeAdapter.getNamespaceURI(element) === NS.HTML) {
            p._processToken(token);
            break;
        }

        if (p.treeAdapter.getTagName(element).toLowerCase() === token.tagName) {
            p.openElements.popUntilElementPopped(element);
            break;
        }
    }
}

},{"../common/doctype":6,"../common/foreign_content":7,"../common/html":8,"../common/unicode":9,"../common/utils":10,"../tokenization/tokenizer":19,"../tree_adapters/default":20,"./formatting_element_list":22,"./location_info_mixin":23,"./open_element_stack":24}],26:[function(require,module,exports){
(function (__dirname){
'use strict';

var _ = require('lodash'),
    fs = require('fs'),
    parse5 = require('parse5'),
    path = require('path');

var tagsTypesThatDoNotNeedClosingTag = [
    'area',
    'base',
    'br',
    'col',
    'command',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source'
];
var REGISTERED_TEMPLATES = {};
/**
 *   Register a template available for use 
 * @param  {String} title
 * @param  {Function} templateFunction
 */
var registerTemplate = function(title, templateFunction) {
    if (_.isUndefined(REGISTERED_TEMPLATES[title])) {
        REGISTERED_TEMPLATES[title] = templateFunction;
    }
};
/**
 *   Get registered template
 * @param  {String} title
 * @param  {Object} params
 * @return {Object} || {String}
 */
var getTemplate = function(title, params) {
    if (!_.isUndefined(REGISTERED_TEMPLATES[title])) {
        return REGISTERED_TEMPLATES[title](params);
    }
    return '';
};
/**
 *   Check against list to see which tag format is necessary
 *   <{tag}/>
 *   Or 
 *   <{tag}><{/tag}
 * @param {String} tag
 * @return {Boolean}
 */
var useClosingTag = function(tag) {
    var needClosingTag = true;
    _.each(tagsTypesThatDoNotNeedClosingTag, function(listedTag) {
        if (listedTag === tag) {
            needClosingTag = false;
        }
    });
    return needClosingTag;
};
/**
 *   Check for attrs attribute as alias for properties attribute
 * @param {Object} jhtmlObj
 * @return {Object} 
 */
var getAttributesAlias = function(jhtmlObj) {
    if (!_.isUndefined(jhtmlObj.properties)) {
        return jhtmlObj;
    } else if (!_.isUndefined(jhtmlObj.attrs)) {
        jhtmlObj.properties = jhtmlObj.attrs;
    }
    return jhtmlObj;
};
/**
 *   Check to see if functions need to be run to generate tag, property, and body values
 * @param {Object} jhtmlObj
 * @return {String} 
 */
var preCompileObject = function(jhtmlObj) {
    jhtmlObj = getAttributesAlias(jhtmlObj);
    if (_.isString(jhtmlObj)) {
        return jhtmlObj;
    }
    if (!_.isUndefined(jhtmlObj.template) && !_.isUndefined(jhtmlObj.params)) {
        var jhtmlObjTemplate = getTemplate(jhtmlObj.template, jhtmlObj.params);
        return doCompile(jhtmlObjTemplate);
    }
    if (_.isUndefined(jhtmlObj.body)) {
        jhtmlObj.body = '';
    }
    var finalJhtmlObj = jhtmlObj;
    if (_.isFunction(jhtmlObj.tag)) {
        finalJhtmlObj.tag = jhtmlObj.tag();
    }
    if (_.isFunction(jhtmlObj.body)) {
        finalJhtmlObj.body = jhtmlObj.body();
    }
    if (!_.isUndefined(jhtmlObj.properties)) {
        if (_.isFunction(jhtmlObj.properties)) {
            finalJhtmlObj.properties = jhtmlObj.properties();
        }
        var keys = _.keys(jhtmlObj.properties);
        _.each(keys, function(key) {
            if (_.isFunction(jhtmlObj.properties[key])) {
                jhtmlObj.properties[key] = jhtmlObj.properties[key]();
            }
        });
    }
    if (_.isFunction(jhtmlObj.comment)) {
        finalJhtmlObj.comment = jhtmlObj.comment();
    }
    return doCompile(finalJhtmlObj);
};
/**
 *   Generate the html tag and the content within 
 * @param {Object} jhtmlObj
 * @return {String}
 */
var doCompile = function(jhtmlObj) {
    var tagProperties = '';
    if (!_.isUndefined(jhtmlObj.properties)) {
        var keys = _.keys(jhtmlObj.properties);
        _.each(keys, function(key) {
            tagProperties = tagProperties + ' ' + key + '="' + jhtmlObj.properties[key] + '"';
        });
    }
    var body = jhtmlObj.body;
    var finalBody = body;
    if (!_.isString(body)) {
        finalBody = '';
        _.each(body, function(nextJhtmlObj) {
            finalBody = finalBody + preCompileObject(nextJhtmlObj);
        });
    }
    if (_.isUndefined(jhtmlObj.tag) || jhtmlObj.tag === '') {
        if (!_.isUndefined(jhtmlObj.comment)) {
            return '<!--' + jhtmlObj.comment + '-->' + finalBody;
        }
        return finalBody;
    } else {
        /* Make User input for HTML tag case insensitive */
        jhtmlObj.tag = jhtmlObj.tag.toLowerCase();
    }
    var template = '<' + jhtmlObj.tag + tagProperties;
    /* Handle html tag special case */
    if (jhtmlObj.tag === 'html') {
        template = '<!DOCTYPE html>' + template;
    }
    if (!_.isUndefined(jhtmlObj.comment)) {
        template = '<!--' + jhtmlObj.comment + '-->' + template;
    }
    if (useClosingTag(jhtmlObj.tag) === true) {
        template = template + '>' + finalBody + '</' + jhtmlObj.tag + '>';
    } else {
        template = template + '/>';
    }
    return template;
};
/**
 *   Require and compile html template from file
 * @param {String} sourcePath
 * @return {String}
 **/
var load = function(sourcePath) {
    var jhtmlObj = require(path.join(__dirname, sourcePath));
    return preCompileObject(jhtmlObj);
};
/**
 *   Generate html file from provided template object or filepath
 * @param {String} destinationPath
 * @param {String} || {Object} pathOrObj
 * @param {Boolean} loadFromFile
 */
var generateHtmlFile = function(destinationPath, pathOrObj, loadFromFile) {
    var compiledHtmlString;
    if (!_.isUndefined(loadFromFile) && _.isString(pathOrObj) && loadFromFile === true) {
        compiledHtmlString = load(pathOrObj);
    } else {
        compiledHtmlString = preCompileObject(pathOrObj);
    }

    fs.writeFile(path.join(__dirname, destinationPath + '.html'), compiledHtmlString, {
        flags: 'wx'
    }, function(err) {
        if (err) {
            throw err;
        }
    });
};
/**
 *   Generate html files in given directory from givem .js or .json template files in another directory
 * @param {String} sourceDirPath
 * @param {String} destinationDirPath
 */
var generateHtmlTemplatesDir = function(sourceDirPath, destinationDirPath) {
    fs.readdir(path.join(__dirname, sourceDirPath), function(err, files) {
        if (err) {
            throw err;
        }
        _.each(files, function(name) {
            var trimmedName = name.substr(0, name.lastIndexOf('.'));
            var fileExtention = name.substr(name.lastIndexOf('.'), name.length);
            if (fileExtention === '.js' || fileExtention === '.json') {
                generateHtmlFile(destinationDirPath + '/' + trimmedName, sourceDirPath + '/' + trimmedName, true);
            }

        });
    });
};
var readModuleFile = function(path, callback) {
    try {
        var filename = require.resolve(path);
        fs.readFile(filename, 'utf8', callback);
    } catch (e) {
        console.log(e);
        callback(e);
    }
};
/**
 *   Parse single HTML Dom Tree child node
 * @param {Object}childNode
 */
var doParse = function(childNode) {
    if (childNode.nodeName === '#comment') {
        return {
            comment: childNode.data
        };
    } else if (childNode.nodeName === '#text') {
        return {
            body: childNode.value
        };
    } else {
        var jhtmlObj = {};
        jhtmlObj.tag = childNode.tagName;
        if (childNode.attrs.length > 0) {
            jhtmlObj.properties = parseAttrs(childNode);
        }
        jhtmlObj.body = parseBody(childNode.childNodes);
        return jhtmlObj;
    }
};
/**
 *   Parse the child nodes of a single tag in the HTML Dom Tree
 * @param {Array} childNodes
 */
var parseBody = function(childNodes) {
    if (childNodes.length === 0) {
        return '';
    } else if (childNodes.length === 1 && childNodes[0].nodeName === '#text') {
        return childNodes[0].value;
    } else {
        var body = [];
        _.each(childNodes, function(childNode) {
            body.push(doParse(childNode));
        });
        return body;
    }
};
/**
 *   Parse single HTML Dom Tree child node's attrs and 
 *   create properties object
 * @param {Object} childNode
 */
var parseAttrs = function(childNode) {
    var properties = {};
    _.each(childNode.attrs, function(attr) {
        properties[attr.name] = attr.value;
    });
    return properties;
};
/**
 *   Parse the HTML Dom treen from string or file
 *   and then parse to template object
 * @param {String} || {Object} pathOrHtmlString
 * @param {Boolean} loadFromFile
 */
var preParse = function(pathOrHtmlString, callback, loadFromFile) {
    var htmlString = pathOrHtmlString;
    var afterGetHTMLString = function(html) {
        var parser = new parse5.Parser(),
            domTree;
        if (html.indexOf('<html>') !== -1) {
            domTree = parser.parse(html);
            if (domTree.childNodes[0].nodeName === '#documentType') {
                domTree.childNodes = domTree.childNodes.slice(1, domTree.childNodes.length);
            }
        } else {
            domTree = parser.parseFragment(html);
        }
        if (domTree.childNodes.length > 1) {
            return {
                body: parseBody(domTree.childNodes)
            };
        }
        return doParse(domTree.childNodes[0]);
    };
    if (!_.isUndefined(loadFromFile) && loadFromFile === true) {
        readModuleFile(pathOrHtmlString + '.html', function(err, html) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, afterGetHTMLString(html));
            }
        });
    } else {
        callback(null, afterGetHTMLString(htmlString));
    }
};
/**
 *   Parse the HTML Dom treen from string or file
 *   and then parse result directly to file
 * @param {String} extention
 * @param {String} destinationPath
 * @param {String} || {Object} pathOrHtmlString
 * @param {Boolean} loadFromFile
 */
var parseTo = function(extention, destinationPath, pathOrHtmlString, loadFromFile, callback) {
    preParse(pathOrHtmlString, function(error, parsedHtml) {
        var output = JSON.stringify(parsedHtml);
        if (extention === '.js') {
            output = 'module.exports=' + output + ';';
        }
        fs.writeFile(path.join(__dirname, destinationPath + extention), output, {
            flags: 'wx'
        }, function(err) {
            if (err) {
                callback(err, false);
            }else{
                callback(null, true);
            }
        });
    }, loadFromFile);
};
/**
 *   Parse the HTML Dom treen from string or file
 *   and then parse result directly to .js file
 * @param {String} destinationPath
 * @param {String} || {Object} pathOrHtmlString
 * @param {Boolean} loadFromFile
 */
var parseToJS = function(destinationPath, pathOrHtmlString, callback, loadFromFile) {
    var useFile = loadFromFile || false;
    parseTo('.js', destinationPath, pathOrHtmlString, useFile, callback);
};
/**
 *   Parse the HTML Dom treen from string or file
 *   and then parse result directly to .json file
 * @param {String} destinationPath
 * @param {String} || {Object} pathOrHtmlString
 * @param {Boolean} loadFromFile
 */
var parseToJson = function(destinationPath, pathOrHtmlString, callback, loadFromFile) {
    var useFile = loadFromFile || false;
    parseTo('.json', destinationPath, pathOrHtmlString, useFile, callback);
};
module.exports = {
    compile: preCompileObject,
    load: load,
    registerTemplate: registerTemplate,
    generateHtmlFile: generateHtmlFile,
    generateHtmlTemplatesDir: generateHtmlTemplatesDir,
    parser: {
        parse: preParse,
        parseToJS: parseToJS,
        parseToJson: parseToJson
    }
};
}).call(this,"/src")
},{"fs":1,"lodash":4,"parse5":5,"path":2}]},{},[26])(26)
});