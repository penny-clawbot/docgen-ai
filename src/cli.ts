#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { scanDirectory } from './parser.js';
import { generateDocs, GenerationOptions } from './generator.js';

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
        template: options.template as any || 'library',
        includePrivate: options.includePrivate || false,
      });

      genSpinner.succeed('Documentation generated!');

      console.log('\n' + chalk.green('✓') + ' Documentation files created in: ' + chalk.cyan(options.output || './docs'));
      console.log(chalk.gray('  - README.md'));
      console.log(chalk.gray('  - API.md') + (structure.functions.length > 0 ? ' (' + structure.functions.length + ' functions)' : ''));
      console.log(chalk.gray('  - CLASSES.md') + (structure.classes.length > 0 ? ' (' + structure.classes.length + ' classes)' : ''));
      console.log(chalk.gray('  - INTERFACES.md') + (structure.interfaces.length > 0 ? ' (' + structure.interfaces.length + ' interfaces)' : ''));

    } catch (error: any) {
      spinner.fail('Error generating documentation');
      console.error(chalk.red(error.message));
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
      console.log('\n' + chalk.green('✓') + ' Workflow file created: ' + chalk.cyan('.github/workflows/docs.yml'));
      console.log(chalk.gray('Documentation will auto-generate on every push/PR to main branch'));

    } catch (error: any) {
      spinner.fail('Error creating GitHub Action');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command('version')
  .description('Display version information')
  .action(() => {
    console.log(chalk.cyan('docgen-ai') + ' v' + packageJson.version);
    console.log(chalk.gray('AI-powered documentation generator'));
    console.log(chalk.gray('GitHub: https://github.com/your-username/docgen-ai'));
  });

program
  .parse(process.argv);
