#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { InitCog } from './cogs/init.js';
import { TemplatesCog } from './cogs/templates.js';
import { GitCog } from './cogs/git.js';
import { DependenciesCog } from './cogs/dependencies.js';
import autorepair from './autorepair.js';

import config from './config/templates.json' assert { type: 'json' };
import settings from './config/settings.json' assert { type: 'json' };

const program = new Command();

program
  .name('godev')
  .description('🚀 GoDev - Project initialization tool')
  .version('1.0.0');

// Create project command
program
  .command('create')
  .description('Create a new project from a template')
  .option('-t, --template <template>', 'Template name to use')
  .action(async (options) => {
    try {
      const initCog = new InitCog();
      const templatesCog = new TemplatesCog();
      
      // Get all available templates
      const allTemplates = await templatesCog.listTemplates();
      
      // Get project details
      const projectData = await initCog.createProject(allTemplates, options.template);
      
      // Generate template
      await templatesCog.generateTemplate(projectData, projectData.template);
      
      const projectPath = `${process.cwd()}/${projectData.projectName}`;

      // Initialize Git if requested
      if (projectData.gitInit) {
        const gitCog = new GitCog();
        await gitCog.initializeRepo(projectPath);
      }

      // Install dependencies if requested
      if (projectData.installDeps) {
        const depsCog = new DependenciesCog();
        await depsCog.installDependencies(projectPath, projectData.template);
      }

      console.log(chalk.green.bold('\n🎉 Project created successfully!'));
      console.log(chalk.blue(`\nNext steps:`));
      console.log(`cd ${projectData.projectName}`);
      
      if (projectData.template.includes('node') && !projectData.installDeps) {
        console.log('npm install');
      }
      
      console.log('Start coding! 🚀\n');

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Template management commands
const templateCommand = new Command('template')
  .description('Manage custom templates');

templateCommand
  .command('create')
  .description('Create a new template')
  .action(async () => {
    const templatesCog = new TemplatesCog();
    await templatesCog.createTemplate();
  });

templateCommand
  .command('list')
  .description('List all templates')
  .action(async () => {
    const templatesCog = new TemplatesCog();
    const templates = await templatesCog.listTemplates();
    
    if (templates.length === 0) {
      console.log(chalk.yellow('No templates found.'));
      console.log(chalk.blue('\n💡 Create your first template: godev template create'));
      return;
    }
    
    console.log(chalk.blue.bold('\n📋 Available Templates:\n'));
    templates.forEach(template => {
      console.log(`  ${chalk.green(template.name.padEnd(20))} ${chalk.cyan('(' + template.language + ')')}`);
      console.log(`  ${chalk.gray('└─ ' + template.description)}`);
      console.log();
    });
  });

templateCommand
  .command('delete')
  .description('Delete a template')
  .action(async () => {
    const templatesCog = new TemplatesCog();
    await templatesCog.deleteTemplate();
  });

templateCommand
  .command('edit')
  .description('Edit a template')
  .action(async () => {
    const templatesCog = new TemplatesCog();
    await templatesCog.editTemplate();
  });

// Add the template command to main program
program.addCommand(templateCommand);

// Show templates command (alias for template list)
program
  .command('templates')
  .description('List all available templates (alias for template list)')
  .action(async () => {
    const templatesCog = new TemplatesCog();
    const templates = await templatesCog.listTemplates();
    
    if (templates.length === 0) {
      console.log(chalk.yellow('No templates found.'));
      console.log(chalk.blue('\n💡 Create your first template: godev template create'));
      return;
    }
    
    console.log(chalk.blue.bold('\n📋 Available Templates:\n'));
    templates.forEach(template => {
      console.log(`  ${chalk.green(template.name.padEnd(20))} ${chalk.cyan('(' + template.language + ')')}`);
      console.log(`  ${chalk.gray('└─ ' + template.description)}`);
      console.log();
    });
    
    console.log(chalk.yellow('💡 Use "godev template --help" for template management commands'));
  });

// Show template directory location
program
  .command('template-dir')
  .description('Show the templates directory location')
  .action(async () => {
    const templatesCog = new TemplatesCog();
    const templatesDir = templatesCog.getTemplatesDir();
    console.log(chalk.blue('📁 Templates directory:'), templatesDir);
    
    if (await fs.pathExists(templatesDir)) {
      const templates = await templatesCog.listTemplates();
      console.log(chalk.green(`📋 Found ${templates.length} templates`));
    } else {
      console.log(chalk.yellow('📁 Directory does not exist yet'));
    }
  });

program
  .command('repair')
  .description('Run GoDev Auto Repair to restore critical source files')
  .action(async () => {
    console.log(chalk.blue('\n🔧 Running GoDev Auto Repair...\n'));
    await autorepair();
  });

program.parse();
