var _ = require('underscore');
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
        REGISTERED_TEMPLATES[title] = constructTemplate;
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
 *   Check to see if functions need to be run to generate tag, property, and body values
 * @param {Object} jhtmlObj
 * @return {String} 
 */
var preCompileObject = function(jhtmlObj) {
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
    if (!_.isUndefined(jhtmlObj.properties) && _.isFunction(jhtmlObj.properties)) {
        finalJhtmlObj.properties = jhtmlObj.properties();
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
    var template = '<' + jhtmlObj.tag + tagProperties;
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
    var jhtmlObj = require(sourcePath);
    return preCompileObject(jhtmlObj);
};
module.exports = {
    compile: preCompileObject,
    load: load,
    registerTemplate: registerTemplate
};