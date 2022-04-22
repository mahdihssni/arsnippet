class Prompt {
    constructor() {
        this.readLine = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    ask(question) {
        return new Promise((resolve, reject) => {
            this.readLine.question(question, answer => resolve(answer), error => reject(error));
        });
    }

    close() {
        this.readLine.close();
    }
}

module.exports = Prompt;