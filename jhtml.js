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
  * @param  {Object} templateObj
 */
var registerTemplate = function (title, templateObj) {
    if (_.isUndefined(REGISTERED_TEMPLATES[title])) {
        REGISTERED_TEMPLATES[title] = constructTemplate;
    }
};
/**
 *   get registered template
 **/
var getTemplate = function (title, params) {
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
 **/
var useClosingTag = function (tag) {
    var needClosingTag = true;
    _.each(tagsTypesThatDoNotNeedClosingTag, function(listedTag){
        if(listedTag === tag){
            needClosingTag = false;
        }
    });
    return needClosingTag;
};
/**
 *   Check to see if functions need to be run to generate tag, property, and body values 
 **/
var preCompileObject = function (jhtmlObj) {
    if(_.isString(jhtmlObj)){
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
 *   generate the html tag and the content within 
 **/
var doCompile = function (jhtmlObj){
    var tagProperties = ''; 
    if (!_.isUndefined(jhtmlObj.properties)) {
        var keys = _.keys(jhtmlObj.properties);
        _.each(keys, function (key) {
            tagProperties = tagProperties + ' ' + key + '="' + jhtmlObj.properties[key] + '"';
        });
    }
    var body = jhtmlObj.body;
    var finalBody = body;
    if (!_.isString(body)) {
        finalBody = '';
        _.each(body, function (nextJhtmlObj) {
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
 *   require and compile html template from file 
 **/
var load = function (sourcePath) {
    var jhtmlObj = require(sourcePath);
    return preCompileObject(jhtmlObj);
};
module.exports = {
   compile: preCompileObject,
   load: load,
   registerTemplate: registerTemplate
};