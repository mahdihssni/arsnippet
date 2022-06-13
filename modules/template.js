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

    listAction() {
        const data = config.templates;
        if (!data.length) {
            return console.log(chalk.white.bgBlue('you haven\'t any template right now'))
        }

        console.log(chalk.bold.whiteBright('\n\nlist of available templates:\n'))
        console.table(data);
        console.log('\n\n');
    }

    async add(filePath, template) {
        try {
            const templateConfig = configure.findTemplateConfigByName(template);

            if (!configure.isTemplateExists(template)) {
                throw new Error('template is not exists!');
            }

            if (!fse.existsSync(filePath)) {
                throw new Error('file is not exists!')
            }

            const stats = fse.statSync(filePath);
            if (stats.isDirectory()) {
                throw new Error('target should be a file.');
            }

            const fileVariables = Object.fromEntries(
                compiler.extractContextVariables(fse.readFileSync(filePath, 'utf-8'))
                    .map((item) => [item, { required: false, type: 'String' }])
            );

            if (Object.keys(fileVariables).length && Object.keys(templateConfig.variables).length) {
                const conflictVariables = Object.keys(templateConfig.variables).filter(item => fileVariables.hasOwnProperty(item));
                if (conflictVariables.length) {
                    const { ignoreConflicts } = await inquirer.prompt({
                        type: 'confirm',
                        name: 'ignoreConflicts',
                        message: `This file variables (${conflictVariables.join(', ')}) has conflict with template variables.\nDo you want to continue?`
                    })

                    if (!ignoreConflicts) {
                        console.log('Add file to template canceled!');
                        return;
                    }
                }
            }

            fse.copyFileSync(filePath, path.resolve(configure.getTemplateFolder(templateConfig.id), path.basename(file)));

            configure.handler((data) => {
                const index = data.templates.findIndex(template => template.id === templateConfig.id);
                data.templates[index].variables = Object.assign(data.templates[index].variables, fileVariables);
            });

            logger.success(`file successfully added to ${template}`);
        } catch (ex) {
            logger.error(ex);
        }
    }

    import(_path, options) {
        try {
            if (!fse.existsSync(_path)) {
                throw new Error('folder is not exists!');
            }

            const stats = fse.statSync(_path);
            if (stats.isFile()) {
                throw new Error('please import template as folder. path is not valid!');
            }

            const name = (function () {
                if (options.hasOwnProperty('name')) {
                    return options.name;
                }
                const basename = path.basename(_path);
                return basename;
            })()

            if (configure.isTemplateExists(name)) {
                throw new Error('template with this name has exists!');
            }

            const id = configure.uid();
            const tempDir = configure.getTemplateFolder(id);
            fse.mkdirsSync(tempDir);
            console.log('template storage directory created.')

            fse.copySync(_path, tempDir);
            console.log('template files were saved.')

            const variables = compiler.getTemplateVariables(id);
            const variablesLength = Object.keys(variables).length;
            console.log(variablesLength ? `${variablesLength} variables stored in configs.` : "template hasn't any variable.");

            configure.handler((data) => {
                data.templates.push({
                    id,
                    name,
                    variables,
                })
            });
            console.log('template configs applied.')

            logger.success(`template successfully imported!\nuse 'arsnippet render ${name} [YOUR_FOLDER_NAME]' to render template`);
        } catch (ex) {
            logger.error(ex);
        }
    }

    remove(name) {
        try {
            if (!configure.isTemplateExists(name)) {
                throw new Error('template not found to remove');
            }

            const tempConfigs = configure.findTemplateConfigByName(name);
            fse.removeSync(configure.getTemplateFolder(tempConfigs.id));

            configure.handler((data) => {
                data.templates.splice(
                    data.templates.findIndex(temp => temp.id === tempConfigs.id),
                    1
                );
            })

            console.log(`'${name}' successfully removed from templates.`);
        } catch (ex) {
            logger.error(ex);
        }
    }

    removeAll() {
        if (!this.list.length) {
            return logger.error('no template to remove.');
        }

        this.list.forEach(template => {
            this.remove(template.name);
        })
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

    async render(templateName, renderFolderName) {
        try {
            const tempConfigs = configure.findTemplateConfigByName(templateName);
            if (!tempConfigs) {
                throw new Error('template not found. please check name template name or create one!');
            }
            const files = fse.readdirSync(configure.getTemplateFolder(tempConfigs.id)).filter(file => !!path.extname(file));
            if (!files.length) {
                throw new Error('there is no file to render in template folder.');
            }

            const tempVariablesWithValue = await this.getVariablesValueFromCli(tempConfigs.variables);

            const whereToRenderTemplate = path.resolve(process.cwd(), renderFolderName);
            if (!fse.existsSync(whereToRenderTemplate)) {
                fse.mkdirsSync(whereToRenderTemplate);
            }

            for (const file of files) {
                const fileDir = configure.getTemplateFile(tempConfigs.id, file);

                fse.writeFileSync(
                    path.resolve(whereToRenderTemplate, path.basename(file)),
                    compiler.renderTemplateFile(fileDir, tempVariablesWithValue)
                )
            }
            logger.success(`template successfully created\nenjoy!`);

        } catch (ex) {
            logger.error(ex);
        }
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

var obj = new Object();
obj.hasOwnProperty

module.exports = new Template();
