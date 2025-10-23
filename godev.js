#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { Command } from 'commander';

const projectRoot = path.join(process.env.HOME || process.env.USERPROFILE, '.godev');
const autorepairPath = path.join(projectRoot, 'autorepair.js');

// --- Fallback for missing cogs ---
let InitCog, TemplatesCog, GitCog, DependenciesCog;

try {
  ({ InitCog } = await import('./cogs/init.js'));
  ({ TemplatesCog } = await import('./cogs/templates.js'));
  ({ GitCog } = await import('./cogs/git.js'));
  ({ DependenciesCog } = await import('./cogs/dependencies.js'));
} catch (err) {
  console.log(chalk.red('❌ GoDev core modules missing or corrupted.'));
  console.log(chalk.yellow('Attempting automatic repair...\n'));

  try {
    const { default: autorepair } = await import(`file://${autorepairPath}`);
    await autorepair();
    console.log(chalk.green('\n✅ GoDev repaired. Please re-run your command.'));
  } catch (repairErr) {
    console.error(chalk.red(`\nAuto-repair failed: ${repairErr.message}`));
    console.error(chalk.red('Please reinstall GoDev manually.'));
  }
  process.exit(0);
}

// --- Load configs safely ---
const config = fs.readJsonSync(new URL('./config/templates.json', import.meta.url));
const settings = fs.readJsonSync(new URL('./config/settings.json', import.meta.url));

// --- Commander Setup ---
const program = new Command();
program
  .name('godev')
  .description('🚀 GoDev - Project initialization tool')
  .version('1.0.0');

// --------------------
// Create project
// --------------------
program
  .command('create')
  .description('Create a new project from a template')
  .option('-t, --template <template>', 'Template name to use')
  .action(async (options) => {
    try {
      const initCog = new InitCog();
      const templatesCog = new TemplatesCog();

      const allTemplates = await templatesCog.listTemplates();
      const projectData = await initCog.createProject(allTemplates, options.template);
      await templatesCog.generateTemplate(projectData, projectData.template);

      const projectPath = `${process.cwd()}/${projectData.projectName}`;

      if (projectData.gitInit) {
        const gitCog = new GitCog();
        await gitCog.initializeRepo(projectPath);
      }

      if (projectData.installDeps) {
        const depsCog = new DependenciesCog();
        await depsCog.installDependencies(projectPath, projectData.template);
      }

      console.log(chalk.green.bold('\n🎉 Project created successfully!'));
      console.log(chalk.blue(`\nNext steps:`));
      console.log(`cd ${projectData.projectName}`);
      if (projectData.template.includes('node') && !projectData.installDeps) console.log('npm install');
      console.log('Start coding! 🚀\n');

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// --------------------
// Template management
// --------------------
const templateCommand = new Command('template').description('Manage custom templates');

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
      console.log(`  ${chalk.gray('└─ ' + template.description)}\n`);
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

program.addCommand(templateCommand);

// --------------------
// Templates alias
// --------------------
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
      console.log(`  ${chalk.gray('└─ ' + template.description)}\n`);
    });
    console.log(chalk.yellow('💡 Use "godev template --help" for template management commands'));
  });

// --------------------
// Template directory
// --------------------
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

// --------------------
// Repair command
// --------------------
program
  .command('repair')
  .description('Run GoDev Auto Repair to restore critical source files')
  .action(async () => {
    console.log(chalk.blue('\n🔧 Running GoDev Auto Repair...\n'));
    const { default: autorepair } = await import(`file://${autorepairPath}`);
    await autorepair();
  });

// --------------------
// Parse commands
// --------------------
program.parse();
