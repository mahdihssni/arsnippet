const autoBind = require("auto-bind");

class Actions {
    constructor() {
        autoBind(this);
    }
    run(a, b) {
        console.log('run runing');
    }
}

module.exports = Actions;