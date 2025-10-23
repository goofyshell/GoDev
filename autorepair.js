#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { execSync } from 'child_process';

const GITHUB_USER = 'schoobertt';
const REPO = 'GoDev';
const CRITICAL_FILES = [
  'compiler-debian.js',
  'godev.js',
  'cogs/init.js',
  'cogs/templates.js',
  'cogs/git.js',
  'cogs/dependencies.js'
];

const CONFIG_FILES = [
  'config/templates.json',
  'config/user.json'
];

const NODE_DEPENDENCIES = [
  'chalk', 'fs-extra', 'inquirer', 'commander', 'rxjs', 'ora'
];

export default async function autorepair({ nuclear = false } = {}) {
  console.log(chalk.blue('🔧 GoDev Auto Repair\n'));

  const root = path.join(process.env.HOME || process.env.USERPROFILE, '.godev');

  // Ensure config folder exists
  await fs.ensureDir(path.join(root, 'config'));

  // Check and restore critical files
  const missingFiles = [];
  for (const file of CRITICAL_FILES) {
    if (!await fs.pathExists(path.join(root, file))) missingFiles.push(file);
  }

  // Check and restore config files
  const missingConfig = [];
  for (const file of CONFIG_FILES) {
    if (!await fs.pathExists(path.join(root, file))) missingConfig.push(file);
  }

  if (missingFiles.length === 0 && missingConfig.length === 0) {
    console.log(chalk.green('✅ All critical files and config are present.'));
  } else {
    console.log(chalk.yellow('⚠️  Missing files:'), missingFiles.concat(missingConfig).join(', '));

    const { download } = await inquirer.prompt([{
      type: 'confirm',
      name: 'download',
      message: `Download missing files from GitHub?`,
      default: true
    }]);

    if (download) {
      for (const file of missingFiles) {
        try {
          const url = `https://raw.githubusercontent.com/${GITHUB_USER}/${REPO}/main/${file}`;
          console.log(chalk.blue(`📥 Downloading ${file}...`));
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
          const content = await res.text();
          await fs.outputFile(path.join(root, file), content);
          console.log(chalk.green(`✅ ${file} restored`));
        } catch (err) {
          console.log(chalk.red(`❌ Could not restore ${file}: ${err.message}`));
        }
      }

      for (const file of missingConfig) {
        await fs.outputJson(path.join(root, file), []);
        console.log(chalk.green(`✅ ${file} restored (default)`));
      }
    }
  }

  // Auto-install Node dependencies
  for (const dep of NODE_DEPENDENCIES) {
    try {
      require.resolve(dep);
    } catch {
      console.log(chalk.yellow(`⚠️  Installing missing dependency: ${dep}`));
      execSync(`npm install ${dep}`, { cwd: root, stdio: 'inherit' });
    }
  }

  console.log(chalk.green('\n✅ GoDev repair finished.'));
}
