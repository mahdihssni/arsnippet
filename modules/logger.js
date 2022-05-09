const chalk = require('chalk');
const boxen = require('boxen');
const autoBind = require('auto-bind');
const config = require('../bin/config.json');

class Logger {
    constructor() {
        autoBind(this);
    }

    error(exception) {
        if (typeof exception === 'string') {
            return console.log(chalk.redBright('Error: '), chalk.red(exception));
        }
        console.log(chalk.redBright('Error: '), chalk.red.bold(exception.message))
            
        if (config.isDev) {
            console.log(boxen(chalk.gray(exception.stack), { title: 'Stack Error', borderColor: 'red' }));
        }
    }

    warning(message) {
        console.log(boxen(chalk.yellow.bold(message), { borderColor: 'green' }))
    }

    success(message) {
        console.log(boxen(chalk.green.bold(message), { borderColor: 'green' }))
    }

    header(message) {
        console.log(chalk.bold(message))
    }
}

module.exports = new Logger();