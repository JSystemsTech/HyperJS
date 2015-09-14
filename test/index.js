var should = require('chai').should(),
	jhtml = require('../index'),
	compile = jhtml.compile,
	load = jhtml.load,
	registerTemplate = jhtml.registerTemplate,
	singleTag = {
		tag: 'div',
		properties: {
			class: 'testClass'
		},
		body: 'test div tag'
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
				})
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
		}
	};
describe('#compile', function() {
	it('Compiles single div tag', function() {
		compile(singleTag).should.equal('<div class="testClass">test div tag</div>');
	});

	it('Compiles complex html', function() {
		compile(complexTag).should.equal('<div class="testClass"><div class="testClass">test div tag1</div><br/><div class="testClass">test div tag2</div></div>');
	});

	it('Compiles html where tag, properties, and body are user defined functions', function() {
		compile(functionTag).should.equal('<div class="testClass"><div class="testClass">test div tag1</div><div class="testClass">test div tag2</div><div class="testClass">test div tag3</div></div>');
	});
});
describe('#load', function() {
	it('Loads and Compiles html', function() {
		load('../jhtml/test/templates').should.equal('<div class="testClass"><div class="testClass">test div tag1</div><br/><div class="testClass">test div tag2</div></div>');
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