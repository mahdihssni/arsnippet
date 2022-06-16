const logger = require("../modules/logger");
const Actions = require("./base");
const path = require('path');
const fse = require('fs-extra');
const configure = require("../modules/configure");
const compiler = require("../modules/compiler");
const inquirer = require('inquirer');

class ImportAction extends Actions {
    run(templatePath, options) {
        try {
			const stats = fse.statSync(templatePath);

            if (!fse.existsSync(templatePath)) {
                throw new Error('folder is not exists!');
            }

            this.templatePath = {
                path: templatePath,
                isDirectory: fse.statSync(templatePath).isDirectory()
            }

            if (options.add) {
                this.setTemplateConfigures(options.add);
                return this.importFileOrFolderToTemplate();
            }

            if (stats.isFile()) {
                throw new Error('please import template as folder. path is not valid!');
            }

            return this.importTemplateFolder(options.name);

        } catch (ex) {
            logger.error(ex);
        }
    }

    async importTemplateFolder(templateName) {
        try {
            const name = templateName || path.basename(this.templatePath.path);

            if (configure.isTemplateExists(name)) {
                throw new Error('template with this name has exists!');
            }

            const id = configure.uid();
            const tempDir = configure.getTemplateFolder(id);
            fse.mkdirsSync(tempDir);
            console.log('template storage directory created.')

            fse.copySync(this.templatePath.path, tempDir);
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

    async importFileOrFolderToTemplate() {
        try {
            if (this.templatePath.isDirectory) {
                throw new Error('just file can be selected for adding to template')
            }

            const fileVariables = Object.fromEntries(
                compiler.extractContextVariables(fse.readFileSync(this.templatePath.path, 'utf-8'))
                    .map((item) => [item, { required: false, type: 'String' }])
            );

            if (Object.keys(fileVariables).length && Object.keys(this.template.variables).length) {
                const conflictVariables = Object.keys(this.template.variables).filter(item => fileVariables.hasOwnProperty(item));
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

            fse.copyFileSync(this.templatePath.path, path.resolve(configure.getTemplateFolder(this.template.id), path.basename(this.templatePath.path)));

            configure.handler((data) => {
                const index = data.templates.findIndex(template => template.id === this.template.id);
                data.templates[index].variables = Object.assign(data.templates[index].variables, fileVariables);
            });

            logger.success(`file successfully added to ${this.template.name}`);
        } catch (ex) {
            logger.error(ex);
        }
    }
}

module.exports = new ImportAction();
