const autoBind = require('auto-bind');
const config = require('../modules/configure');
const logger = require('../modules/logger');
const Actions = require('./base');
const templates = require('../bin/config.json').templates;
const fse = require('fs-extra');

class RemoveAction extends Actions {
    run(templateName, options) {
        try {
            this.template = config.findTemplateConfigByName(templateName);
            if (options.all) {
                return this.removeAllTemplates();
            }

            if (!this.template) {
                throw new Error('template not found to remove');
            }

                if (options.singleFile) {
                    return this.removeFileFromTemplate();
                }

            return this.removeTemplate();
        } catch (ex) {
            logger.error(ex);
        }
    }

    removeTemplate() {
        try {
            fse.removeSync(config.getTemplateFolder(this.template.id));
            config.handler((data) => {
                data.templates.splice(
                    data.templates.findIndex(temp => temp.id === this.template.id),
                    1
                );
            });
            console.log(`'${this.template.name}' successfully removed from templates.`);
        } catch (ex) {
            logger.error(ex);
        }
    }

    removeFileFromTemplate() {
    }

    removeAllTemplates() {
        try {
            if (!templates.length) {
                throw new Error('no template to remove');
            }
            
            templates.forEach(template => {
                this.template = template;
                this.removeTemplate();
            });
        } catch (ex) {
            logger.error(ex);
        }
        if (!templates.length) {
            return logger.error('no template to remove.');
        }

        
    }
}

module.exports = new RemoveAction();