const chalk = require("chalk");
const config = require('../bin/config.json');
const path = require("path");
const fse = require('fs-extra');
const fs = require('fs');

const configure = require('./configure');
const logger = require("./logger");
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

    /**
     * Get template variables value from user in cli
     * @param { Object } variables 
     * @returns { Object } Return result of prompts
     */
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

    /**
     * Create and resolve paths
     * @param  {...String} paths
     * @returns { String } Target resolved path
     */
    getTargetTemplateFolder(...paths) {
        const target = path.resolve(...paths);
        if (!fse.existsSync(target)) {
            fse.mkdirsSync(target);
        }

        return target;
    }

    /**
     * Add new variables to exists template variable store
     * @param { Array } fileVariables List of new variables
     */
    async addVariablesToTemplateStore(fileVariables, template) {
        try {
            const conflictVariables = Object.keys(template.variables).filter(item => fileVariables.hasOwnProperty(item));
            if (conflictVariables.length) {
                const { ignoreConflicts } = await inquirer.prompt({
                    type: 'confirm',
                    name: 'ignoreConflicts',
                    message: `This file variables (${conflictVariables.join(', ')}) has conflict with template variables.\nDo you want to continue?`
                })

                if (!ignoreConflicts) {
                    throw new Error('conflicts ignored!');
                }
            }

            configure.handler((data) => {
                const index = data.templates.findIndex(template => template.id === template.id);
                data.templates[index].variables = Object.assign(data.templates[index].variables, fileVariables);
            });
        } catch (ex) {
            logger.error(ex);
        }
    }
}

module.exports = new Template();
