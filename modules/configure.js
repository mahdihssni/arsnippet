const autoBind = require('auto-bind');
const chalk = require('chalk');
const fse = require('fs-extra');
const path = require('path');
const configFile = require('./../bin/config.json');
const AJV = require('ajv');
const logger = require('./logger');

class Config {
    constructor() {
        autoBind(this);
    }

    action(options) {
        const methods = {
            isprod: (value) => {
                value = value.toLowerCase() === 'true' || parseInt(value) > 0;
                
                this.handler((data) => {
                    data.isDev = value; 
                    return data;
                })

                logger.warning('isdev mode changed ' + value);
            }
        }
    
        Object.entries(options).forEach(([index, value]) => {
            if (methods.hasOwnProperty(index)) {
                methods[index](value);
            }
        })
    }

    handler(callback) {
        try {
            let configsObject = JSON.parse(fse.readFileSync(path.resolve(__dirname, '../bin/config.json'), 'utf8'));
            callback(configsObject)
            fse.writeFileSync(path.resolve(__dirname, '../bin/config.json'), JSON.stringify(configsObject, null, 4));
        } catch (ex) {
            console.log(chalk.red.bold(ex.message))
        }
    }
    
    uid() {
        return Date.now().toString().slice(0, 3) + parseInt(Math.random() * 0x10000).toString(32);
    }

    resolvePath(..._path) {
        return path.resolve(__dirname, '../', ..._path);
    }

    getTemplateFile(id, fileName) {
        return this.resolvePath('template', id, fileName);
    }

    getTemplateFolder(id) {
        return this.resolvePath('template', id);
    }

    findTemplateConfigById(id) {
        return configFile.templates.find(template => template.id === id);
    }

    findTemplateConfigByName(name) {
        return configFile.templates.find(template => template.name === name);
    }

    isTemplateExists(name) {
        return configFile.templates.findIndex(template => template.name === name) > -1;
    }

    get isDevMode() {
        return configFile.isDev;
    }

    getVaribalesFromConfigFile(configDir) {
        const ajv = new AJV();
        
        const schema = {
            type: "object"
        }

        const validate = ajv.compile(schema);
        const valid = validate(require(configDir));
        console.log(valid)
    }
}

module.exports = new Config();