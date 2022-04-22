const chalk = require('chalk');
const boxen = require('boxen');
const configure = require('./configure');

class Logger {
    error(exception) {
        if (typeof exception === 'string') {
            return console.log(chalk.redBright('Error: '), chalk.red.bold(err));
        }
    
        console.log('\n');
        console.log(chalk.redBright('Error: '), chalk.red.bold(exception.message))
    
        if (configure.isDevMode) {
            console.log(boxen(chalk.gray(exception.stack), { title: 'Stack Error', padding: 1, margin: 1, borderColor: 'red' }));
        }
    }

    warning(message) {
        console.log(boxen(chalk.yellow.bold(message), { padding: 1, margin: 1, borderColor: 'green' }))
    }

    success(message) {
        console.log(boxen(chalk.green.bold(message), { padding: 1, margin: 1, borderColor: 'green' }))
    }

    header(message) {
        console.log('\n' + chalk.bgGray.bold.italic(message))
    }
}

module.exports = new Logger();