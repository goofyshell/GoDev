import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

export class DependenciesCog {
  async installDependencies(projectPath, templateType) {
    try {
      console.log(chalk.blue('📦 Installing dependencies...'));

      if (templateType === 'nodejs' || templateType === 'react') {
        await execAsync('npm install', { cwd: projectPath });
        console.log(chalk.green('✅ Dependencies installed!'));
      } else if (templateType === 'python') {
        await execAsync('pip install -r requirements.txt', { cwd: projectPath });
        console.log(chalk.green('✅ Python dependencies installed!'));
      } else if (templateType === 'go') {
        await execAsync('go mod tidy', { cwd: projectPath });
        console.log(chalk.green('✅ Go modules tidied!'));
      }
    } catch (error) {
      console.log(chalk.yellow('⚠️  Dependency installation failed'));
    }
  }
}