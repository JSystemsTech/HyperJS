'use strict';

var should = require('chai').should(),
    jhtml = require('./html-template-generator'),
    fs = require('fs'),
    compile = jhtml.compile,
    load = jhtml.load,
    registerTemplate = jhtml.registerTemplate,
    generateHtmlFile = jhtml.generateHtmlFile,
    generateHtmlTemplatesDir = jhtml.generateHtmlTemplatesDir,
    parser = jhtml.parser,
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
describe('#Testing Base Functionality', function() {
    describe('#compile', function() {
        it('Compiles single div tag', function() {
            expect(compile(singleTag)).to.equal('<div class="testClass">test div tag</div>');
        });
        it('Compiles single div tag with comment', function() {
            expect(compile(singleTagWithComment)).to.equal('<!--testing comment--><div class="testClass">test div tag</div>');
        });
        it('Compiles html type tag', function() {
            expect(compile(singleHtmlTag)).to.equal('<!DOCTYPE html><html></html>');
        });
        it('Compiles single div tag with handlebars helper', function() {
            expect(compile(singleTagWithHandlebarsHelpers)).to.equal('<div class="testClass">{{#if test}} testing handlebars helpers {{#if}}</div>');
        });
        it('Compiles complex html', function() {
            expect(compile(complexTag)).to.equal('<div class="testClass"><div class="testClass">test div tag1</div><br/><div class="testClass">test div tag2</div></div>');
        });
        it('Compiles html where tag, properties, and body are user defined functions', function() {
            expect(compile(functionTag)).to.equal('<div class="testClass"><div class="testClass">test div tag1</div><div class="testClass">test div tag2</div><div class="testClass">test div tag3</div></div>');
        });
        it('Compiles html where tag, properties, and body are user defined functions,\n' +
            '      and properties attributes are user defined functions',
            function() {
                expect(compile(functionPropertiesTag)).to.equal('<div id="functionDiv" class="testClass"><div class="testClass">test div tag1</div><div class="testClass">test div tag2</div><div class="testClass">test div tag3</div></div>');
            });
    });
    describe('#load', function() {
        it('Loads and Compiles html from .js file', function() {
            expect(load('../test/jsTemplate')).to.equal('<div class="testClass"><div class="testClass">test div tag1</div><br/><div class="testClass">test div tag2</div></div>');
        });
        it('Loads and Compiles html from .json file', function() {
            expect(load('../test/jsonTemplate')).to.equal('<div class="testClass"><div class="testClass">test div tag1</div><br/><div class="testClass">test div tag2</div></div>');
        });
    });
    describe('#registerTemplate', function() {
        registerTemplate('testTemplate', template);
        it('Compiles with registered template div tag', function() {
            expect(compile({
                template: 'testTemplate',
                params: {
                    tag: 'div',
                    subTitle: 'testing title'
                }
            })).to.equal('<div><div>testing title</div><div class="testClass">test div tag</div></div>');
        });
        it('Compiles with registered template span tag', function() {
            expect(compile({
                template: 'testTemplate',
                params: {
                    tag: 'span',
                    subTitle: 'testing title2'
                }
            })).to.equal('<span><div>testing title2</div><div class="testClass">test div tag</div></span>');
        });
        it('Compiles with registered template p tag', function() {
            expect(compile({
                template: 'testTemplate',
                params: {
                    tag: 'p',
                    subTitle: 'testing title3'
                }
            })).to.equal('<p><div>testing title3</div><div class="testClass">test div tag</div></p>');
        });
    });
});
describe('#Testing Generating .html files', function() {
    describe('#generateHtmlFile', function() {
        it('Generates html file from user defined Object', function() {
            var path = '../test/htmlTemplatesTest/testGeneratedHtmlFile1';
            generateHtmlFile(path, complexTag);
            fs.readFile(path, function(err, data) {
                expect(data.toString()).to.equal('<div class="testClass"><div class="testClass">test div tag1</div><br/><div class="testClass">test div tag2</div></div>');
            });
        });
        it('Generates html file from user defined Object with handlebars helper', function() {
            var path = '../test/htmlTemplatesTest/testGeneratedHtmlFile2';
            generateHtmlFile(path, singleTagWithHandlebarsHelpers);
            fs.readFile(path, function(err, data) {
                expect(data.toString()).to.equal('<div class="testClass">{{#if test}} testing handlebars helpers {{#if}}</div>');
            });
        });
        it('Generates html file from template .js file', function() {
            var path = '../test/htmlTemplatesTest/testGeneratedHtmlFile3';
            generateHtmlFile(path, '../test/jsTemplate', true);
            fs.readFile(path, function(err, data) {
                expect(data.toString()).to.equal('<div class="testClass"><div class="testClass">test div tag1</div><br/><div class="testClass">test div tag2</div></div>');
            });
        });
        it('Generates html file from template .json file', function() {
            var path = '../test/htmlTemplatesTest/testGeneratedHtmlFile2';
            generateHtmlFile(path, '../test/jsonTemplate', true);
            fs.readFile(path, function(err, data) {
                expect(data.toString()).to.equal('<div class="testClass"><div class="testClass">test div tag1</div><br/><div class="testClass">test div tag2</div></div>');
            });
        });
    });
    describe('#generateHtmlTemplatesDir', function() {
        var sourcePath = '../test/jsTemplates',
            destinationPath = '../test/htmlTemplatesTest/generatedTemplates';
        generateHtmlTemplatesDir(sourcePath, destinationPath);

        it('Generates 4 templates', function() {
            fs.readdir(destinationPath, function(err, files) {
                expect(files.length).to.equal(4);
            });
        });
        it('Generates temlate1.html file', function() {
            var path = '../test/htmlTemplatesTest/generatedTemplates/template1';
            fs.readFile(path, function(err, data) {
                expect(data.toString()).to.equal('<div class="testClass">test div tag</div>');
            });
        });
        it('Generates temlate2.html file', function() {
            var path = '../test/htmlTemplatesTest/generatedTemplates/template2';
            fs.readFile(path, function(err, data) {
                expect(data.toString()).to.equal('<div class="testClass"><div class="testClass">test div tag1</div><br/><div class="testClass">test div tag2</div></div>');
            });
        });
        it('Generates temlate3.html file', function() {
            var path = '../test/htmlTemplatesTest/generatedTemplates/template3';
            fs.readFile(path, function(err, data) {
                expect(data.toString()).to.equal('<div class="testClass">test div tag</div>');
            });
        });
        it('Generates temlate4.html file', function() {
            var path = '../test/htmlTemplatesTest/generatedTemplates/template4';
            fs.readFile(path, function(err, data) {
                expect(data.toString()).to.equal('<div class="testClass"><div class="testClass">test div tag1</div><br/><div class="testClass">test div tag2</div></div>');
            });
        });
    });
});
describe('#Testing Parser', function() {
    describe('#parser-parse', function() {
        var callback1, callback2;
        before(function() {
            callback1 = function(error, data) {
                expect(JSON.stringify(data)).to.equal(JSON.stringify(singleTag));
            };
            callback2 = function(error, data) {
                expect(JSON.stringify(data)).to.equal(JSON.stringify(complexTag));
            };
        });
        it('Parses simple html string', function() {
            var actual = '<div class="testClass">test div tag</div>';
            parser.parse(actual, callback1, false);
        });
        it('Parses complex html string', function() {
            var actual = '<div class="testClass"><div class="testClass">test div tag1</div><br/><div class="testClass">test div tag2</div></div>';
            parser.parse(actual, callback2, false);
        });
        it('Parses html file1', function() {
            var path = '../test/htmlTemplatesTest/generatedTemplates/template1';
            parser.parse(path, callback1, true);

        });
        it('Parses html file2', function() {
            var path = '../test/htmlTemplatesTest/generatedTemplates/template2';
            parser.parse(path, callback2, true);

        });
    });
    describe('#parser-parseToJS', function() {
        it('Parses html string to JS', function() {
            var html = '<div class="testClass"><div class="testClass">test div tag1</div><br/><div class="testClass">test div tag2</div></div>';
            var destinationPath = '../test/htmlTemplatesTest/parseFiles/testParseToJS1';
            parser.parseToJS(destinationPath, html, function(error, done) {
                var testParseToJS1 = require(require.resolve(destinationPath));
                expect(JSON.stringify(testParseToJS1)).to.equal(JSON.stringify(complexTag));
            });

        });
        it('Parses html file to JS', function() {
            var path = '../test/htmlTemplatesTest/generatedTemplates/template2';
            var destinationPath = '../test/htmlTemplatesTest/parseFiles/testParseToJS2';
            parser.parseToJS(destinationPath, path, function(error, done) {
                var testParseToJS2 = require(require.resolve(destinationPath));
                expect(JSON.stringify(testParseToJS2)).to.equal(JSON.stringify(complexTag));
            }, true);
        });
    });
    describe('#parser-parseToJson', function() {
        it('Parses html string to Json', function() {
            var html = '<div class="testClass"><div class="testClass">test div tag1</div><br/><div class="testClass">test div tag2</div></div>';
            var destinationPath = '../test/htmlTemplatesTest/parseFiles/testParseToJson1';
            parser.parseToJS(destinationPath, html, function(error, done) {
                var testParseToJson1 = require(require.resolve(destinationPath));
                expect(JSON.stringify(testParseToJson1)).to.equal(JSON.stringify(complexTag));
            });

        });
        it('Parses html file to Json', function() {
            var path = '../test/htmlTemplatesTest/generatedTemplates/template2';
            var destinationPath = '../test/htmlTemplatesTest/parseFiles/testParseToJson2';
            parser.parseToJS(destinationPath, path, function(error, done) {
                var testParseToJson2 = require(require.resolve(destinationPath));
                expect(JSON.stringify(testParseToJson2)).to.equal(JSON.stringify(complexTag));
            }, true);
        });
    });
});