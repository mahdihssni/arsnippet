const chalk = require("chalk");
const config = require('../bin/config.json');
const path = require("path");
const fse = require('fs-extra');

const configure = require('./configure');
const logger = require("./logger");
const Prompt = require('./prompt');
const compiler = require("./compiler");
const autoBind = require("auto-bind");
const inquirer = require('inquirer');
const openInEditor = require('open-in-editor');

const os = require('os');
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

    add() {

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
            console.log(`${Object.keys(variables).length} variables stored in configs.`);

            configure.handler((data) => {
                data.templates.push({
                    id,
                    name,
                    variables,
                })
            });
            console.log('apply config changes.')

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
        logger.header('set value for variables:');
        const prompt = new Prompt();
        const data = {};

        for (const [varName, varOptions] of Object.entries(variables)) {
            let requiredVar, answer;

            while (true) {
                requiredVar = varOptions.hasOwnProperty('required') && varOptions.required;
                answer = await prompt.ask(`${varName}${requiredVar ? chalk.red.bold('*') : ''}: `);

                if (!answer && requiredVar === true) {
                    console.log(chalk.yellow.italic('this variable is reqiurd! fill it please'));
                    continue;
                }
                break;
            }

            data[varName] = answer;
        }

        prompt.close();
        return data;
    }

    async render(templateName, renderFolderName) {
        try {
            const tempConfigs = configure.findTemplateConfigByName(templateName);
            if (!tempConfigs) {
                throw new Error('template not found. please check name template name or create one!');
            }

            console.log('read template storage directory files')
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

                console.log(`${file} compiled and created`);
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
            const { update: selectedFile } = await inquirer.prompt({
                type: 'list',
                name: 'update',
                message: 'Which file do you want to modify?',
                choices: listOfFileNames,
            });

            const fileEditor = openInEditor.configure({ editor: 'code', pattern: '{filename}' }, logger.error)
            await fileEditor.open(configure.getTemplateFile(templateDetail.id, selectedFile))

            console.log('waiting for the file changes in editor...');
            fse.watchFile(configure.getTemplateFile(templateDetail.id, selectedFile), () => {
                fse.unwatchFile(configure.getTemplateFile(templateDetail.id, selectedFile));
                logger.success('changes applied!');
            });
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