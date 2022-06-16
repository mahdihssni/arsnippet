const configure = require("../modules/configure");
const logger = require("../modules/logger");
const Actions = require("./base");
const templateModule = require('../modules/template');
const fse = require('fs-extra');
const path = require('path');
const compiler = require("../modules/compiler");

class RenderAction extends Actions {
    run(templateName, targetFolderName) {
        try {
            this.setTemplateConfigures(templateName);
            this.renderTemplateWithFolder(targetFolderName)
        } catch (ex) {
            logger.error(ex);
        }
    }

    async renderTemplateWithFolder(folderName) {
        try {
            const files = fse.readdirSync(configure.getTemplateFolder(this.template.id)).filter(file => !!path.extname(file));
            if (!files.length) {
                throw new Error('there is no file to render in template folder.');
            }

            const tempVariablesWithValue = await templateModule.getVariablesValueFromCli(this.template.variables);
            const whereToRenderTemplate = templateModule.getTargetTemplateFolder(process.cwd(), folderName);

            for (const file of files) {
                const fileDir = configure.getTemplateFile(this.template.id, file);

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


}

module.exports = new RenderAction();
