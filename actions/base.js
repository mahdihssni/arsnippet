const autoBind = require("auto-bind");
const configure = require("../modules/configure");

class Actions {
    constructor() {
        autoBind(this);
    }
    setTemplateConfigures(template) {
        if (!this.template) {
            throw new Error('template not found to remove');
        }
        
        this.template = configure.findTemplateConfigByName(template);
    }
}

module.exports = Actions;