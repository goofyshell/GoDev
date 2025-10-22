import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';

export class InitCog {
  constructor() {}

  async createProject(availableTemplates, specifiedTemplate = null) {
    console.log(chalk.blue.bold('\n🚀 GoDev - Project Creator\n'));

    // If no templates exist, guide user to create one
    if (availableTemplates.length === 0) {
      console.log(chalk.yellow('No templates found.'));
      console.log(chalk.blue('\n💡 First, create a template:'));
      console.log('  godev template create');
      console.log('\nThen run "godev create" again.');
      process.exit(1);
    }

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        validate: input => {
          if (!input) return 'Project name is required';
          if (fs.existsSync(path.join(process.cwd(), input))) {
            return 'Project directory already exists';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'description',
        message: 'Project description:',
        default: 'A new project created with GoDev'
      },
      {
        type: 'list',
        name: 'template',
        message: 'Choose template:',
        choices: availableTemplates.map(template => ({
          name: `${template.name} (${template.language}) - ${template.description}`,
          value: template.name
        })),
        when: () => !specifiedTemplate
      },
      {
        type: 'confirm',
        name: 'gitInit',
        message: 'Initialize Git repository?',
        default: true
      },
      {
        type: 'confirm',
        name: 'installDeps',
        message: 'Install dependencies?',
        default: true,
        when: (answers) => {
          const template = availableTemplates.find(t => t.name === (specifiedTemplate || answers.template));
          return template && ['nodejs', 'react', 'python'].includes(template.language);
        }
      }
    ]);

    // Use specified template if provided
    if (specifiedTemplate) {
      const templateExists = availableTemplates.some(t => t.name === specifiedTemplate);
      if (!templateExists) {
        throw new Error(`Template '${specifiedTemplate}' not found`);
      }
      answers.template = specifiedTemplate;
    }

    return answers;
  }
}
