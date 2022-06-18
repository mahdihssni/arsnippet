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
        const variablesAnswer = await inquirer.prompt(promptQuestions);
        return variablesAnswer;
    }

    getTargetTemplateFolder(...paths) {
        try {
            const dir = path.resolve(...paths);

            if (!fse.existsSync(dir)) {
                fse.mkdirsSync(dir);
            }

            return dir;
        } catch (ex) {
            logger.error(ex)
        }
    }
}

module.exports = new Template();