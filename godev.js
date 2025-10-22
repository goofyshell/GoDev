#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { InitCog } from './cogs/init.js';
import { TemplatesCog } from './cogs/templates.js';
import { GitCog } from './cogs/git.js';
import { DependenciesCog } from './cogs/dependencies.js';

import config from './config/templates.json' assert { type: 'json' };
import settings from './config/settings.json' assert { type: 'json' };

const program = new Command();

program
  .name('godev')
  .description('🚀 GoDev - Project initialization tool')
  .version('1.0.0');

program
  .command('create')
  .description('Create a new project')
  .action(async () => {
    try {
      const initCog = new InitCog(config);
      const templatesCog = new TemplatesCog(config);
      const gitCog = new GitCog();
      const depsCog = new DependenciesCog();

      // Get project details
      const projectData = await initCog.createProject();
      
      // Generate template
      await templatesCog.generateTemplate(projectData, projectData.template);
      
      const projectPath = `${process.cwd()}/${projectData.projectName}`;

      // Initialize Git
      if (projectData.gitInit) {
        await gitCog.initializeRepo(projectPath);
      }

      // Install dependencies
      if (projectData.installDeps) {
        await depsCog.installDependencies(projectPath, projectData.template);
      }

      console.log(chalk.green.bold('\n🎉 Project created successfully!'));
      console.log(chalk.blue(`\nNext steps:`));
      console.log(`cd ${projectData.projectName}`);
      if (!projectData.installDeps) {
        console.log('npm install');
      }
      console.log('npm run dev\n');

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('templates')
  .description('List available templates')
  .action(() => {
    console.log(chalk.blue.bold('\n📋 Available Templates:\n'));
    Object.entries(config.templates).forEach(([key, template]) => {
      console.log(chalk.green(`• ${key}:`));
      console.log(`  ${template.description}`);
      console.log(`  Files: ${template.files.join(', ')}\n`);
    });
  });

// Add these commands to godev.js
program
  .command('templates')
  .description('Manage project templates')
  .action(async () => {
    const templatesCog = new TemplatesCog(config);
    const templates = await templatesCog.getAllTemplates();
    
    console.log(chalk.blue.bold('\n📋 Available Templates:\n'));
    
    console.log(chalk.green('Built-in Templates:'));
    templates.filter(t => t.type === 'built-in').forEach(template => {
      console.log(`  ${template.value.padEnd(15)} - ${template.name}`);
    });
    
    console.log(chalk.cyan('\nCustom Templates:'));
    templates.filter(t => t.type === 'custom').forEach(template => {
      console.log(`  ${template.value.padEnd(15)} - ${template.name}`);
    });
    
    console.log(chalk.yellow('\n💡 Use: godev template --help for template management'));
  });

// In godev.js - simplified template commands
program
  .command('templates')
  .description('List all available templates')
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

program
  .command('template')
  .description('Manage custom templates')
  .addCommand(new Command('create')
    .description('Create a new template')
    .action(async () => {
      const templatesCog = new TemplatesCog();
      await templatesCog.createTemplate();
    }))
  .addCommand(new Command('list')
    .description('List all templates')
    .action(async () => {
      const templatesCog = new TemplatesCog();
      const templates = await templatesCog.listTemplates();
      
      if (templates.length === 0) {
        console.log(chalk.yellow('No templates found.'));
        return;
      }
      
      console.log(chalk.blue.bold('\n📋 Templates:\n'));
      templates.forEach(template => {
        console.log(`  ${chalk.green(template.name)}`);
        console.log(`    Language: ${chalk.cyan(template.language)}`);
        console.log(`    Description: ${template.description}`);
        console.log(`    Created: ${template.created}`);
        console.log();
      });
    }))
  .addCommand(new Command('delete')
    .description('Delete a template')
    .action(async () => {
      const templatesCog = new TemplatesCog();
      await templatesCog.deleteTemplate();
    }))
  .addCommand(new Command('edit')
    .description('Edit a template')
    .action(async () => {
      const templatesCog = new TemplatesCog();
      await templatesCog.editTemplate();
    }));

program.parse();
