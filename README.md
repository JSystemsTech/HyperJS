html-template-generator
=========

A simple library to generate html template strings from javascript

## Installation

  npm install html-template-generator --save

## Usage
	var htmlTemplateGenerator = require('html-template-generator'),
		compile = htmlTemplateGenerator.compile,
		load = htmlTemplateGenerator.load,
		registerTemplate = htmlTemplateGenerator.registerTemplate,
		generateHtmlFile = jhtml.generateHtmlFile,
		generateHtmlTemplatesDir = jhtml.generateHtmlTemplatesDir;

	var complexTag = {
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
	};
	var functionTag = {
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
				})
			}
			return body;
		}
	};
	var template = function(params) {
		return {
			tag: params.tag,
			body: [{
				tag: 'div',
				body: params.subTitle
			}, singleTag]
		}
	};
	/* 1.	Compile Template */

	/* Compile using tree structure */
	var htmlTemplate1 = compile(complexTag) 

	/* outputs '<div class="testClass"><div class="testClass">test div tag1</div><br/><div class="testClass">test div tag2</div></div>' */

	/* Compile using tree structure with user defined functions */
	var htmlTemplate1 = compile(functionTag) 
	
	/* outputs '<div class="testClass"><div class="testClass">test div tag1</div><div class="testClass">test div tag2</div><div class="testClass">test div tag3</div></div>' */

	/* 2.	Register Template */

	registerTemplate('exampleTemplate', template);
	compile({
			template: 'exampleTemplate',
			params: {
				tag: 'div',
				subTitle: 'testing title'
			}
		});
	/* outputs '<div><div>testing title</div><div class="testClass">test div tag</div></div>' */

	/* 3.	Load Template */

	/* Requires and compiles to html from file that returns an object like the examples above */
	/* The File can be a .js or .json file */
	
	var htmlTemplateFromFile = load(<file path>);

	/* 4.	Generate HTML File */

	var destinationPath = 'tempates/html/testTemplate1'; /* Do not include '.html' extention 
	 													in the path since it is handled by the
	 													function already. */
	generateHtmlFile(destinationPath, complexTag);
	/* OR load from file */ 
	generateHtmlFile(destinationPath, <file path>, true);
	
	/* 5.	Generate HTML Template Directpry */

	/* Takes only the .js and .json files of a given directory and generates HTML files in another directory. */ 

	var sourceDirPath = 'tempates/html/templates; 
	var destinationDirPath = 'tempates/html/generatedHtml';

	generateHtmlTemplatesDir(sourceDirPath, destinationDirPath);
	/* note that the names of the HTML files will ne the same as the names of the .js and .json files */

	
## Tests

  npm test

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality. Lint and test your code.

## Release History

* 0.2.0 Initial release
