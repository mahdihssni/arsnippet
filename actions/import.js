const Actions = require("./base");
const path = require('path');
const fse = require('fs-extra');

const { error, success } = require("../modules/logger");
const { isTemplateExists, uid, handler: configureHandler, getTemplateFolder } = require("../modules/configure");
const { getTemplateVariables, extractContextVariables } = require("../modules/compiler");
const { addVariablesToTemplateStore } = require('../modules/template');

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
            error(ex);
        }
    }

    async importTemplateFolder(templateName) {
        try {
            const name = templateName || path.basename(this.templatePath.path);

            if (isTemplateExists(name)) {
                throw new Error('template with this name has exists!');
            }

            const id = uid();
            const tempDir = getTemplateFolder(id);
            fse.mkdirsSync(tempDir);
            console.log('template storage directory created.')

            fse.copySync(this.templatePath.path, tempDir);
            console.log('template files were saved.')

            const variables = getTemplateVariables(id);
            const variablesLength = Object.keys(variables).length;
            console.log(variablesLength ? `${variablesLength} variables stored in configs.` : "template hasn't any variable.");

            configureHandler((data) => {
                data.templates.push({
                    id,
                    name,
                    variables,
                })
            });
            console.log('template configs applied.')

            success(`template successfully imported!\nuse 'arsnippet render ${name} [YOUR_FOLDER_NAME]' to render template`);
        } catch (ex) {
            error(ex);
        }
    }

    async importFileOrFolderToTemplate() {
        try {
            if (this.templatePath.isDirectory) {
                throw new Error('just file can be selected for adding to template')
            }

            const fileVariables = Object.fromEntries(
                extractContextVariables(fse.readFileSync(this.templatePath.path, 'utf-8'))
                    .map((item) => [item, { required: false, type: 'String' }])
            );

            addVariablesToTemplateStore(fileVariables, this.template);
            fse.copyFileSync(this.templatePath.path, path.resolve(getTemplateFolder(this.template.id), path.basename(this.templatePath.path)));

            success(`file successfully added to ${this.template.name}`);
        } catch (ex) {
            error(ex);
        }
    }
}

module.exports = new ImportAction();
