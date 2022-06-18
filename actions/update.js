const Actions = require('./base');
const logger = require('../modules/logger');
const configure = require("../modules/configure");
const inquirer = require("inquirer");
const fse = require("fs-extra");

class UpdateAction extends Actions {
	run(templateName) {
		try {
			this.setTemplateConfigures(templateName);

			this.updateTemplateFile();
		} catch (ex) {
			logger.error(ex)
		}
	}

	async updateTemplateFile() {
		try {
			const listOfFileNames = configure.getTemplateFileNames(this.template.id);
			const {update: selectedFile} = await inquirer.prompt([{
				type: 'list',
				name: 'update',
				message: 'Which file do you want to modify?',
				choices: listOfFileNames,
			}]);

			const fileContext = fse.readFileSync(configure.getTemplateFile(this.template.id, selectedFile), 'utf-8');

			const {editor} = await inquirer.prompt({
				type: "editor",
				name: "editor",
				message: 'Edit file content:',
				default: fileContext,
			})

			fse.writeFileSync(configure.getTemplateFile(this.template.id, selectedFile), editor);
		} catch (ex) {
			logger.error(ex);
		}
	}
}

module.exports = new UpdateAction();
