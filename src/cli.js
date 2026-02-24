#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const { scanDirectory } = require('./parser.js');
const { generateDocs } = require('./generator.js');

const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
);

const program = new Command();

program
  .name('docgen')
  .description('AI-powered documentation generator from codebase')
  .version(packageJson.version);

program
  .command('scan <directory>')
  .description('Scan codebase and generate documentation')
  .option('-o, --output <dir>', 'Output directory for docs', './docs')
  .option('-t, --template <type>', 'Template type: api, library, or app', 'library')
  .option('-p, --include-private', 'Include private (non-exported) functions')
  .action(async (directory, options) => {
    const spinner = ora('Scanning codebase...').start();

    try {
      const dirPath = path.resolve(directory);

      if (!fs.existsSync(dirPath)) {
        spinner.fail(`Directory not found: ${directory}`);
        process.exit(1);
      }

      const structure = scanDirectory(dirPath);

      spinner.succeed(`Found ${structure.functions.length} functions, ${structure.classes.length} classes, ${structure.interfaces.length} interfaces`);

      const genSpinner = ora('Generating documentation...').start();

      await new Promise(resolve => setTimeout(resolve, 500));

      generateDocs(structure, {
        outputDir: options.output || './docs',
        template: options.template || 'library',
        includePrivate: options.includePrivate || false,
      });

      genSpinner.succeed('Documentation generated!');

      console.log('\n' + '\x1b[32m✓\x1b[0m' + ' Documentation files created in: ' + '\x1b[36m' + (options.output || './docs') + '\x1b[0m');
      console.log('\x1b[90m  - README.md\x1b[0m');
      console.log('\x1b[90m  - API.md\x1b[0m' + (structure.functions.length > 0 ? ' (' + structure.functions.length + ' functions)' : ''));
      console.log('\x1b[90m  - CLASSES.md\x1b[0m' + (structure.classes.length > 0 ? ' (' + structure.classes.length + ' classes)' : ''));
      console.log('\x1b[90m  - INTERFACES.md\x1b[0m' + (structure.interfaces.length > 0 ? ' (' + structure.interfaces.length + ' interfaces)' : ''));

    } catch (error) {
      spinner.fail('Error generating documentation');
      console.error('\x1b[31m' + error.message + '\x1b[0m');
      process.exit(1);
    }
  });

program
  .command('init [repo-url]')
  .description('Initialize GitHub Action for automatic documentation')
  .action(async (repoUrl) => {
    const spinner = ora('Creating GitHub Action...').start();

    try {
      const workflowsDir = path.join(process.cwd(), '.github', 'workflows');
      fs.mkdirSync(workflowsDir, { recursive: true });

      const workflowContent = `name: Generate Documentation

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Generate documentation
        run: |
          npm install -g docgen-ai
          docgen scan . --output ./docs

      - name: Upload docs
        uses: actions/upload-artifact@v3
        with:
          name: documentation
          path: ./docs
`;

      const workflowPath = path.join(workflowsDir, 'docs.yml');
      fs.writeFileSync(workflowPath, workflowContent);

      spinner.succeed('GitHub Action created!');
      console.log('\n' + '\x1b[32m✓\x1b[0m' + ' Workflow file created: ' + '\x1b[36m.github/workflows/docs.yml\x1b[0m');
      console.log('\x1b[90mDocumentation will auto-generate on every push/PR to main branch\x1b[0m');

    } catch (error) {
      spinner.fail('Error creating GitHub Action');
      console.error('\x1b[31m' + error.message + '\x1b[0m');
      process.exit(1);
    }
  });

program
  .command('version')
  .description('Display version information')
  .action(() => {
    console.log('\x1b[36mdocgen-ai\x1b[0m v' + packageJson.version);
    console.log('\x1b[90mAI-powered documentation generator');
    console.log('\x1b[90mGitHub: https://github.com/your-username/docgen-ai');
  });

program.parse(process.argv);
