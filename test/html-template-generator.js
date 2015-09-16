var should = require('chai').should(),
    jhtml = require('../html-template-generator'),
    fs = require('fs'),
    compile = jhtml.compile,
    load = jhtml.load,
    registerTemplate = jhtml.registerTemplate,
    generateHtmlFile = jhtml.generateHtmlFile,
    generateHtmlTemplatesDir = jhtml.generateHtmlTemplatesDir,
    singleTag = {
        tag: 'div',
        properties: {
            class: 'testClass'
        },
        body: 'test div tag'
    },
    singleTagWithHandlebarsHelpers = {
        tag: 'div',
        properties: {
            class: 'testClass'
        },
        body: '{{#if test}} testing handlebars helpers {{#if}}'
    },
    singleTagWithComment = {
        tag: 'div',
        properties: {
            class: 'testClass'
        },
        comment: 'testing comment',
        body: 'test div tag'
    },
    singleHtmlTag = {
        tag: 'html'
    },
    complexTag = {
        tag: 'div',
        properties: {
            class: 'testClass'
        },
        body: [{
            tag: 'div',
            properties: {
                class: 'testClass'
            },
            body: 'test div tag1'
        }, {
            tag: 'br'
        }, {
            tag: 'div',
            properties: {
                class: 'testClass'
            },
            body: 'test div tag2'
        }]
    },
    functionTag = {
        tag: function() {
            return 'div';
        },
        properties: function() {
            return {
                class: 'testClass'
            };
        },
        body: function() {
            var body = [];
            for (var i = 1; i <= 3; i++) {
                body.push({
                    tag: 'div',
                    properties: {
                        class: 'testClass'
                    },
                    body: 'test div tag' + i
                });
            }
            return body;
        }
    },
    functionPropertiesTag = {
        tag: function() {
            return 'div';
        },
        properties: function() {
            return {
                id: function() {
                    return 'functionDiv';
                },
                class: function() {
                    return 'testClass';
                }
            };
        },
        body: function() {
            var body = [];
            for (var i = 1; i <= 3; i++) {
                body.push({
                    tag: 'div',
                    properties: {
                        class: 'testClass'
                    },
                    body: 'test div tag' + i
                });
            }
            return body;
        }
    },
    template = function(params) {
        return {
            tag: params.tag,
            body: [{
                tag: 'div',
                body: params.subTitle
            }, singleTag]
        };
    };
describe('#compile', function() {
    it('Compiles single div tag', function() {
        compile(singleTag).should.equal('<div class="testClass">test div tag</div>');
    });
    it('Compiles single div tag with comment', function() {
        compile(singleTagWithComment).should.equal('<!--testing comment--><div class="testClass">test div tag</div>');
    });
    it('Compiles html type tag', function() {
        compile(singleHtmlTag).should.equal('<!DOCTYPE html><html></html>');
    });
    it('Compiles single div tag with handlebars helper', function() {
        compile(singleTagWithHandlebarsHelpers).should.equal('<div class="testClass">{{#if test}} testing handlebars helpers {{#if}}</div>');
    });
    it('Compiles complex html', function() {
        compile(complexTag).should.equal('<div class="testClass"><div class="testClass">test div tag1</div><br/><div class="testClass">test div tag2</div></div>');
    });
    it('Compiles html where tag, properties, and body are user defined functions', function() {
        compile(functionTag).should.equal('<div class="testClass"><div class="testClass">test div tag1</div><div class="testClass">test div tag2</div><div class="testClass">test div tag3</div></div>');
    });
    it('Compiles html where tag, properties, and body are user defined functions,\n'+
    '      and properties attributes are user defined functions', function() {
        compile(functionPropertiesTag).should.equal('<div id="functionDiv" class="testClass"><div class="testClass">test div tag1</div><div class="testClass">test div tag2</div><div class="testClass">test div tag3</div></div>');
    });
});
describe('#load', function() {
    it('Loads and Compiles html from .js file', function() {
        load('../jhtml/test/jsTemplate').should.equal('<div class="testClass"><div class="testClass">test div tag1</div><br/><div class="testClass">test div tag2</div></div>');
    });
    it('Loads and Compiles html from .json file', function() {
        load('../jhtml/test/jsonTemplate').should.equal('<div class="testClass"><div class="testClass">test div tag1</div><br/><div class="testClass">test div tag2</div></div>');
    });
});
describe('#registerTemplate', function() {
    registerTemplate('testTemplate', template);
    it('Compiles with registered template div tag', function() {
        compile({
            template: 'testTemplate',
            params: {
                tag: 'div',
                subTitle: 'testing title'
            }
        }).should.equal('<div><div>testing title</div><div class="testClass">test div tag</div></div>');
    });
    it('Compiles with registered template span tag', function() {
        compile({
            template: 'testTemplate',
            params: {
                tag: 'span',
                subTitle: 'testing title2'
            }
        }).should.equal('<span><div>testing title2</div><div class="testClass">test div tag</div></span>');
    });
    it('Compiles with registered template p tag', function() {
        compile({
            template: 'testTemplate',
            params: {
                tag: 'p',
                subTitle: 'testing title3'
            }
        }).should.equal('<p><div>testing title3</div><div class="testClass">test div tag</div></p>');
    });
});
describe('#generateHtmlFile', function() {
    it('Generates html file from user defined Object', function() {
        var path = '../jhtml/test/htmlTemplatesTest/testGeneratedHtmlFile1';
        generateHtmlFile(path, complexTag);
        fs.readFile(path, function(err, data) {
            if (err) {
                throw err;
            }
            data.toString().should.equal('<div class="testClass"><div class="testClass">test div tag1</div><br/><div class="testClass">test div tag2</div></div>');
        });
    });
    it('Generates html file from user defined Object with handlebars helper', function() {
        var path = '../jhtml/test/htmlTemplatesTest/testGeneratedHtmlFile2';
        generateHtmlFile(path, singleTagWithHandlebarsHelpers);
        fs.readFile(path, function(err, data) {
            if (err) {
                throw err;
            }
            data.toString().should.equal('<div class="testClass">{{#if test}} testing handlebars helpers {{#if}}</div>');
        });
    });
    it('Generates html file from template .js file', function() {
        var path = '../jhtml/test/htmlTemplatesTest/testGeneratedHtmlFile3';
        generateHtmlFile(path, '../jhtml/test/jsTemplate', true);
        fs.readFile(path, function(err, data) {
            if (err) {
                throw err;
            }
            data.toString().should.equal('<div class="testClass"><div class="testClass">test div tag1</div><br/><div class="testClass">test div tag2</div></div>');
        });
    });
    it('Generates html file from template .json file', function() {
        var path = '../jhtml/test/htmlTemplatesTest/testGeneratedHtmlFile2';
        generateHtmlFile(path, '../jhtml/test/jsonTemplate', true);
        fs.readFile(path, function(err, data) {
            if (err) {
                throw err;
            }
            data.toString().should.equal('<div class="testClass"><div class="testClass">test div tag1</div><br/><div class="testClass">test div tag2</div></div>');
        });
    });
});
describe('#generateHtmlTemplatesDir', function() {
    var sourcePath = '../jhtml/test/jsTemplates',
        destinationPath = '../jhtml/test/htmlTemplatesTest/generatedTemplates';
    generateHtmlTemplatesDir(sourcePath, destinationPath);

    it('Generates 4 templates', function() {
        fs.readdir(destinationPath, function(err, files) {
            if (err) {
                throw err;
            }
            files.length.should.equal(4);
        });
    });
    it('Generates temlate1.html file', function() {
        var path = '../jhtml/test/htmlTemplatesTest/generatedTemplates/template1';
        fs.readFile(path, function(err, data) {
            if (err) {
                throw err;
            }
            console.log(data.toString());
            data.toString().should.equal('<div class="testClass">test div tag</div>');
        });
    });
    it('Generates temlate2.html file', function() {
        var path = '../jhtml/test/htmlTemplatesTest/generatedTemplates/template2';
        fs.readFile(path, function(err, data) {
            if (err) {
                throw err;
            }
            data.toString().should.equal('<div class="testClass"><div class="testClass">test div tag1</div><br/><div class="testClass">test div tag2</div></div>');
        });
    });
    it('Generates temlate3.html file', function() {
        var path = '../jhtml/test/htmlTemplatesTest/generatedTemplates/template3';
        fs.readFile(path, function(err, data) {
            if (err) {
                throw err;
            }
            data.toString().should.equal('<div class="testClass">test div tag</div>');
        });
    });
    it('Generates temlate4.html file', function() {
        var path = '../jhtml/test/htmlTemplatesTest/generatedTemplates/template4';
        fs.readFile(path, function(err, data) {
            if (err) throw err;
            data.toString().should.equal('<div class="testClass"><div class="testClass">test div tag1</div><br/><div class="testClass">test div tag2</div></div>');
        });
    });
});