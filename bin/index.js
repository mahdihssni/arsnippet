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
    .argument('<string>', 'template name')
    .requiredOption('-n, --name <string>', 'render folder name')
    .action(template.render);

program
    .command('list')
    .action(template.list);

program
    .command('import')
    .argument('<string>', 'file path for import template')
    .option('-n, --name <string>', 'template name')
    .action(template.import);

program.command('add');

program
    .command('config')
    .option('-p --isprod <boolean>', 'production mode')
    .action(configure.action);

program
    .command('remove')
    .argument('<string>', 'template name or id')
    .option('-i, --remove-by-id', 'remove template by id')
    .action(template.remove);

program.parse(process.argv);