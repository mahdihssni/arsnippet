#!/usr/bin/env node

const template = require('../modules/template');
const configure = require('../modules/configure');
const { Command } = require('commander');
const program = new Command();

program
    .name('ars')
    .description('Create snippet for arvan projects')
    .usage('<command>')

program
    .command('render')
    .arguments('<templateName> <folderName>')
    .action(template.render);

program
    .command('list')
    .action(template.listAction);

program
    .command('import')
    .argument('<template-name>', 'file path for import template')
    .option('-n, --name <string>', 'template name')
    .action(template.import);

program.command('add');

program
    .command('config')
    .option('-p --isprod <boolean>', 'production mode')
    .action(configure.action);

program
    .command('remove')
    .argument('<template-name>', 'template name or id')
    .action(template.remove);

program
    .command('removeall')
    .action(template.removeAll);

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