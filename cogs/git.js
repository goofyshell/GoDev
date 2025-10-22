import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

const execAsync = promisify(exec);

export class GitCog {
  async initializeRepo(projectPath) {
    try {
      console.log(chalk.blue('🔧 Initializing Git repository...'));
      
      await execAsync('git init', { cwd: projectPath });
      await this.createGitignore(projectPath);
      await execAsync('git add .', { cwd: projectPath });
      await execAsync('git commit -m "Initial commit with GoDev"', { cwd: projectPath });
      
      console.log(chalk.green('✅ Git repository initialized!'));
    } catch (error) {
      console.log(chalk.yellow('⚠️  Git initialization skipped or failed'));
    }
  }

  async createGitignore(projectPath) {
    const gitignoreContent = `node_modules/
dist/
build/
.env
.DS_Store
*.log
`;
    await fs.writeFile(path.join(projectPath, '.gitignore'), gitignoreContent);
  }
}