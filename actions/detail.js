const Actions = require('./base');
const configure = require("../modules/configure");
const inquirer = require("inquirer");
const boxen = require("boxen");
const fse = require("fs-extra");
const logger = require("../modules/logger");

class DetailAction extends Actions {
	run(templateName, options) {
		try {
			this.setTemplateConfigures(templateName);

			if (options.general) {
				return this.templateDetail();
			}

			return this.templateFileDetail();
		} catch (ex) {
			logger.error(ex);
		}
	}

	templateDetail() {
		console.log(boxen(`id: ${this.template.id}\nname: ${this.template.name}\nvariables: ${Object.keys(this.template.variables).join(', ')}`, {
			title: 'Template Information',
			padding: 1,
			borderColor: 'gray',
		}))
	}

	async templateFileDetail() {
		try {
			const listOfFileNames = configure.getTemplateFileNames(this.template.id);

			const { detail: selectedFile } = await inquirer.prompt({
				type: 'list',
				name: 'detail',
				message: 'Which file do you want to see context?',
				choices: listOfFileNames
			})

			console.log(boxen(fse.readFileSync(configure.getTemplateFile(this.template.id, selectedFile), 'utf-8'), {
				padding: 1,
				title: `Context of ${selectedFile} from ${this.template.name} template`,
				borderColor: "magenta"
			}));

		} catch (ex) {
			logger.error(ex);
		}
	}
}

module.exports = new DetailAction();
