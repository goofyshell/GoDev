import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';

export class InitCog {
  constructor(config) {
    this.config = config;
  }

  async createProject() {
    console.log(chalk.blue.bold('\n🚀 GoDev - Project Initializer\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        validate: input => input ? true : 'Project name is required'
      },
      {
        type: 'list',
        name: 'template',
        message: 'Choose template:',
        choices: Object.keys(this.config.templates).map(key => ({
          name: `${this.config.templates[key].name} - ${this.config.templates[key].description}`,
          value: key
        }))
      },
      {
        type: 'input',
        name: 'description',
        message: 'Project description:',
        default: 'A new project created with GoDev'
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
        default: true
      }
    ]);

    return answers;
  }

  validateProjectName(name) {
    const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g;
    if (invalidChars.test(name)) {
      throw new Error('Project name contains invalid characters');
    }
    return true;
  }
}