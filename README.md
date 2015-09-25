
<p align="center">
  <img src="https://raw.github.com/JSystemsTech/HyperJS/master/logo.png" alt="HyperJS"/>
</p>

A library to compile and parse html to and from javascript code
**Installation**
------------------------
  npm install hyperjs --save
  bower install hyperjs
**Usage**
----------

###	**Tag Object Attributes Valid Types**
* **tag**  
***String***: HTML tag type  
***Function***: Returns HTML tag type string  
Tag types can be any HTML tag. The HTML tags are generated with a closing tag like this:`<div></div>` and some tags are generated without a closing tag like this `<br/>`. In the case of the `<html>` the `<!DOCTYPE html>` tag will be automatically appended before the tag.
* **properties**  
***Object***: HTML tag attributes with HTML tag attribute as the key and string or function which returns a string as the value.   
***Function***: Returns Object in the format as described above
* **attrs**  
An Alias for properties. If both properties and attrs is declared properties will be the default attribute used.  
***Object***: HTML tag attributes with HTML tag attribute as the key and string or function which returns a string as the value.  
***Function***: Returns Object in the format as described above
* **comment**  
***String***: Comment text to be applied before the HTML tag  
***Function***: Returns comment string  
* **body**  
***String***: Text Content of the HTML tag. 
***Array***: An Array of tag objects. Will generate the tags that are within the tag.  
***Function***: Returns String text or an array of tag objects as described above.  

###	**Examples**
	var htmlTemplateGenerator = require('html-template-generator'),
		compile = htmlTemplateGenerator.compile,
		load = htmlTemplateGenerator.load,
		registerTemplate = htmlTemplateGenerator.registerTemplate,
		generateHtmlFile = jhtml.generateHtmlFile,
		generateHtmlTemplatesDir = jhtml.generateHtmlTemplatesDir,
		parser = jhtml.parser;

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
####	**1.	Compile Template**  
Compile using tree structure 

    var htmlTemplate1 = compile(complexTag)  
***outputs***:  
    
    <div class="testClass"><div class="testClass">test div tag1</div><br/><div class="testClass">test div tag2</div></div>

Compile using tree structure with user defined functions 

    var htmlTemplate1 = compile(functionTag)  
***outputs***:  
`<div class="testClass"><div class="testClass">test div tag1</div><div class="testClass">test div tag2</div><div class="testClass">test div tag3</div></div>`

####	**2. Register Template**  
Register user defined template to be used in other files.

    registerTemplate('exampleTemplate', template);     
    compile({  
        template: 'exampleTemplate',  
        params: {  
            tag: 'div',  
            subTitle: 'testing title'  
        }  
    });  
***outputs***:  
`<div><div>testing title</div><div class="testClass">test div tag</div></div>`

####	**3. Load Template**   
Requires and compiles to html from file that returns an object like the examples above.  
The File can be a .js or .json file
	
    var htmlTemplateFromFile = load(<file path>);

####	**4. Generate HTML File**

	var destinationPath = 'tempates/html/testTemplate1'; 
Do not include '.html' extention in the path since it is handled by the function already.

	generateHtmlFile(destinationPath, complexTag);
Or load from file

	generateHtmlFile(destinationPath, <file path>, true);
	
####	**5. Generate HTML Template Directory**  
Takes only the .js and .json files of a given directory and generates HTML files in another directory. 

	var sourceDirPath = 'tempates/html/templates; 
	var destinationDirPath = 'tempates/html/generatedHtml';
	generateHtmlTemplatesDir(sourceDirPath, destinationDirPath);
Note that the names of the HTML files will ne the same as the names of the .js and .json files.

####	**6. HTML Parser**
Works on pure html code. Does not work with embedded Handlebars helpers and the like.

#####	**a. parse**
Takes in an HTML string or path to HTML file of a given directory and generates a JS object template in the format used. Do not include '.html' extention in the path since it is handled by the function already.

	var callback = function(error, data) {
		//handle error or data
    };
    var htmlString = '<div class="testClass">test div tag</div>';
    var sourcePath = 'tempates/html/generatedHtml';
    parser.parse(htmlString, callback, false);
    parser.parse(sourcePath, callback, true);
#####	**b. parseToJS**
Takes in an HTML string or path to HTML file of a given directory and generates a .js file at the chosen desinationPath. Do not include '.js' extention in the path since it is handled by the function already.

    var callback = function(error, successfullyWroteToFile) {
		//handle error or successfullyWroteToFile boolean
    };
    var htmlString = '<div class="testClass">test div tag</div>';
    var sourcePath = 'tempates/html/generatedHtml';
    var destinationPath = './test/htmlTemplatesTest/parseFiles/testParseToJS';
    parser.parseToJS(destinationPath, htmlString, callback, false);
    parser.parseToJS(destinationPath, sourcePath, callback, true);
#####	**b. parseToJson**
Takes in an HTML string or path to HTML file of a given directory and generates a .json file at the chosen desinationPath. Do not include '.json' extention in the path since it is handled by the function already.

    var callback = function(error, successfullyWroteToFile) {
		//handle error or successfullyWroteToFile boolean
    };
    var htmlString = '<div class="testClass">test div tag</div>';
    var sourcePath = 'tempates/html/generatedHtml';
    var destinationPath = './test/htmlTemplatesTest/parseFiles/testParseToJson';
    parser.parseToJson(destinationPath, htmlString, callback, false);
    parser.parseToJson(destinationPath, sourcePath, callback, true);

**Tests**
----
  npm test
**Contributing**
-----
In lieu of a formal styleguide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality. Lint and test your code.
**Release History**
----
* **1.0.1** Fix README format
* **1.0.0** First major release
####	Released under html-template-generator
* **0.3.1** Fix README format
* **0.3.0** Expand Tag Functionality
* **0.2.0** Add HTML File Generation functionality
* **0.1.0** Initial release
