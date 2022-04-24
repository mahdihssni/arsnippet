const chalk = require("chalk");
const config = require('../bin/config.json');
const cliProgress = require('cli-progress');
const path = require("path");
const fse = require('fs-extra');

const colors = require('ansi-colors')
const configure = require('./configure');
const logger = require("./logger");
const Prompt = require('./prompt');
const compiler = require("./compiler");
const autoBind = require("auto-bind");

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
            fse.copySync(_path, tempDir);

            configure.handler((data) => {
                data.templates.push({
                    id,
                    name,
                    variables: compiler.getTemplateVariables(id)
                })
            });

            logger.success('template successfully imported!');
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
                answer = await prompt.ask(`${varName}${requiredVar ? chalk.blue.bold('*') : ''}: `);

                if (!answer && requiredVar === true) {
                    console.log('\n' + chalk.yellow.italic('this variable is reqiurd! fill it please'));
                    continue;
                }
                break;
            }

            data[varName] = answer;
        }

        prompt.close();
        return data;
    }

    async render(templateName, { name: renderFolderName }) {
        try {
            const tempConfigs = configure.findTemplateConfigByName(templateName);
            if (!tempConfigs) {
                throw new Error('template not found. please check name template name or create one!');
            }

            const files = fse.readdirSync(configure.getTemplateFolder(tempConfigs.id)).filter(file => path.extname(file) === '.txt');
            if (!files.length) {
                throw new Error('there is no file to render in template folder.');
            }

            const tempVariablesWithValue = await this.getVariablesValueFromCli(tempConfigs.variables);

            const progress = new cliProgress.SingleBar({
                format: `compiling template files | ${colors.blueBright('{bar}')} - {percentage}%`,
                barCompleteChar: '\u2588',
                barIncompleteChar: '\u2591',
            }, cliProgress.Presets.shades_grey)

            progress.start(files.length, 0);

            const whereToRenderTemplate = path.resolve(process.cwd(), renderFolderName);
            if (!fse.existsSync(whereToRenderTemplate)) {
                fse.mkdirsSync(whereToRenderTemplate);
            }

            for (const file of files) {
                const fileDir = configure.getTemplateFile(tempConfigs.id, file);

                fse.writeFileSync(
                    path.resolve(whereToRenderTemplate, path.basename(file, '.txt')),
                    compiler.renderTemplateFile(fileDir, tempVariablesWithValue)
                )

                progress.increment();
            }

            progress.stop();
            logger.success('template successfully created.');

        } catch (ex) {
            logger.error(ex);
        }
    }
}

module.exports = new Template();