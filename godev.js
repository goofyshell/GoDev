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

program.parse();