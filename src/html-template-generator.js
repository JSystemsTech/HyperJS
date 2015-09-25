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