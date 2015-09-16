module.exports = {
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