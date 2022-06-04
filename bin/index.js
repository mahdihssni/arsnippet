#!/usr/bin/env node

const template = require('../modules/template');
const configure = require('../modules/configure');

const removeAction = require('../actions/remove');

const { Command } = require('commander');
const program = new Command();

program
    .name('ars')
    .description('Create snippet for arvan projects')
    .usage('<command>')
    .version(configure.getVersion());

program
    .command('render')
    .arguments('<templateName> <folderName>')
    .action(template.render);

program
    .command('list')
    .action(template.listAction);

program
    .command('import')
    .argument('<template-name>', 'folder path for import template')
    .option('-n, --name <custom-template-name>', 'custom template name')
    .action(template.import);

program
    .command('add')
    .arguments('<file> <template-name>')
    .action(template.add);

program
    .command('config')
    .option('-p --isprod <boolean>', 'production mode')
    .action(configure.action);

program
    .command('remove')
    .argument('[template-name]', 'template name')
    .option('-s, --single-file', 'remove single file from template')
    .option('-a, --all', 'remove all exists templates')
    .action(removeAction.run);

program
    .command('update')
    .argument('<template-name>', 'template name')
    .action(template.updateTemplateFile);

program
    .command('detail')
    .description('see context of template')
    .argument('<template-name>', 'template name')
    .action(template.detail)




program.parse(process.argv);