const autoBind = require("auto-bind");
const configure = require("../modules/configure");

class Actions {
    constructor() {
        autoBind(this);
    }
    setTemplateConfigures(template) {
        this.template = configure.findTemplateConfigByName(template);
        if (!this.template) {
            throw new Error('specific template not found. try again or create new one!');
        }
    }
}

module.exports = Actions;