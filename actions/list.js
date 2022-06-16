const Actions = require('./base');
const config = require("../bin/config.json");
const chalk = require("chalk");
const templateModule = require('../modules/template');

class ListAction extends Actions {
	run() {
		this.listOfTemplates();
	}

	listOfTemplates() {
		const data = templateModule.list;
		if (!data.length) {
			return console.log('you haven\'t any template right now');
		}

		console.log('list of available templates:');
		console.table(data);
	}
}

module.exports = new ListAction();
