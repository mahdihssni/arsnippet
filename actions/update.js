const Actions = require('./base');
const inquirer = require("inquirer");
const fse = require("fs-extra");

const { error } = require('../modules/logger');
const { addVariablesToTemplateStore } = require('../modules/template');
const { getTemplateFileNames, getTemplateFile } = require("../modules/configure");
const { extractContextVariables } = require("../modules/compiler");

class UpdateAction extends Actions {
	run(templateName) {
		try {
			this.setTemplateConfigures(templateName);

			this.updateTemplateFile();
		} catch (ex) {
			error(ex)
		}
	}

	async updateTemplateFile() {
		try {
			const listOfFileNames = getTemplateFileNames(this.template.id);
			const { update: selectedFile } = await inquirer.prompt([{
				type: 'list',
				name: 'update',
				message: 'Which file do you want to modify?',
				choices: listOfFileNames,
			}]);

			const fileContext = fse.readFileSync(getTemplateFile(this.template.id, selectedFile), 'utf-8');

			const { editor } = await inquirer.prompt({
				type: "editor",
				name: "editor",
				message: 'Edit file content:',
				default: fileContext,
			});

			const contextVars = extractContextVariables(editor);
			addVariablesToTemplateStore(
				Object.assign({}, contextVars.reduce((i, v) => ({ [v]: { type: 'String', required: false } }), {})),
				this.template
			);

			fse.writeFileSync(getTemplateFile(this.template.id, selectedFile), editor);
		} catch (ex) {
			error(ex);
		}
	}
}

module.exports = new UpdateAction();
