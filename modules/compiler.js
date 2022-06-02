const fse = require('fs-extra');
const configure = require('./configure');
const path = require('path');
const autoBind = require('auto-bind');

class Compiler {
    constructor() {
        autoBind(this);
    }

    extractContextVariables(context) {
        let variables = context.match(/(?<=\{\{).*?(?=\}\})/g) || [];
        return variables.map(variable => variable.replace(/\s/g, ''));
    }

    getTemplateVariables(id) {
        const tempConfigFile = path.resolve(configure.getTemplateFolder(id), 'config.json');
        let variables = {};

        const tempDirFiles = fse.readdirSync(configure.getTemplateFolder(id)).filter((file) => file !== 'config.json');

        for (const file of tempDirFiles) {
            const fileVars = this.extractContextVariables(
                fse.readFileSync(path.resolve(configure.getTemplateFolder(id), file), 'utf-8')
            );

            Object.assign(variables, fileVars.reduce((i, v) => ({ [v]: { type: 'String', required: false } }), {}))
        }

        if (fse.existsSync(tempConfigFile)) {
            Object.assign(variables, require(tempConfigFile));
            fse.removeSync(tempConfigFile);
        }

        return Object.keys(variables).sort().reduce((obj, key) => {
            obj[key] = variables[key];
            return obj;
        }, {});
    }

    renderTemplateFile(path, locals = {}) {
        const fileContext = fse.readFileSync(path, 'utf8').toString();
        return fileContext.replace(/\{\{.*?\}\}/g, (variable) => {
            return locals[variable.replace(/\{\{|\}\}|\s/g, '')] || '';
        });
    }
}

module.exports = new Compiler();