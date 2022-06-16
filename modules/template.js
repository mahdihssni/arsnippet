const chalk = require("chalk");
const config = require('../bin/config.json');
const path = require("path");
const fse = require('fs-extra');
const fs = require('fs');

const configure = require('./configure');
const logger = require("./logger");
const Prompt = require('./prompt');
const compiler = require("./compiler");
const autoBind = require("auto-bind");
const inquirer = require('inquirer');
const boxen = require("boxen");

class Template {
    constructor() {
        autoBind(this);
    }

    get list() {
        return config.templates;
    }

    async getVariablesValueFromCli(variables) {
        const promptQuestions = Object.entries(variables).map(([name, options]) => ({
            type: 'input',
            name,
            message: `Value of '${name}' variable?${options.required ? chalk.gray(' (required)') : ''}`,
            validate(input) {
                const done = this.async();
                if (options.required && !input) {
                    done('This variable is required! please fill the value')
                }

                done(null, true);
            }
        }));
        return await inquirer.prompt(promptQuestions);
    }

	getTargetTemplateFolder(...paths) {
		const target = path.resolve(...paths);
		if (!fse.existsSync(target)) {
			fse.mkdirsSync(target);
		}

		return target;
	}

    async updateTemplateFile(template) {
        try {
            const templateDetail = configure.findTemplateConfigByName(template);
            if (!configure.isTemplateExists(template)) {
                throw new Error('template is not exists!')
            }

            const listOfFileNames = configure.getTemplateFileNames(templateDetail.id);
            const { update: selectedFile } = await inquirer.prompt([{
                type: 'list',
                name: 'update',
                message: 'Which file do you want to modify?',
                choices: listOfFileNames,
            }]);

            const fileContext = fse.readFileSync(configure.getTemplateFile(templateDetail.id, selectedFile), 'utf-8');

            const { editor } = await inquirer.prompt({
                type: "editor",
                name: "editor",
                message: 'Edit file content:',
                default: fileContext,
            })

            fse.writeFileSync(configure.getTemplateFile(templateDetail.id, selectedFile), editor);
        } catch (ex) {
            logger.error(ex);
        }
    }

    async detail(templateName) {
        try {
            if (!configure.isTemplateExists(templateName)) {
                throw new Error('template is not exists');
            }

            const templateConfig = configure.findTemplateConfigByName(templateName);
            const listOfFileNames = configure.getTemplateFileNames(templateConfig.id);

            const { detail: selectedFile } = await inquirer.prompt({
                type: 'list',
                name: 'detail',
                message: 'Which file do you want to see context?',
                choices: listOfFileNames
            })

            console.log(boxen(`id: ${templateConfig.id}\nname: ${templateConfig.name}\nvariables: ${Object.keys(templateConfig.variables).join(', ')}`, {
                title: 'Template Information',
                padding: 1,
                borderColor: 'gray',
            }))
            console.log(boxen(fse.readFileSync(configure.getTemplateFile(templateConfig.id, selectedFile), 'utf-8'), {
                padding: 1,
                title: `Context of ${selectedFile} from ${templateName} template`,
                borderColor: "magenta"
            }));

        } catch (ex) {
            logger.error(ex);
        }
    }
}

module.exports = new Template();
