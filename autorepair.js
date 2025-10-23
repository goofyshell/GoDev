#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';

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

export default async function autorepair() {
  console.log(chalk.blue('🔧 GoDev Auto Repair\n'));

  const projectRoot = path.join(process.env.HOME || process.env.USERPROFILE, '.godev');

  // Check critical files
  let missingFiles = [];
  for (const file of CRITICAL_FILES) {
    if (!await fs.pathExists(path.join(projectRoot, file))) {
      missingFiles.push(file);
    }
  }

  if (missingFiles.length === 0) {
    console.log(chalk.green('✅ Critical files are present. GoDev source restored.'));
    return;
  }

  console.log(chalk.yellow('⚠️  Missing critical files:'), missingFiles.join(', '));

  const { download } = await inquirer.prompt([{
    type: 'confirm',
    name: 'download',
    message: `Download missing critical files from GitHub (${GITHUB_USER}/${REPO})?`,
    default: true
  }]);

  if (!download) return;

  for (const file of missingFiles) {
    try {
      const fileUrl = `https://raw.githubusercontent.com/${GITHUB_USER}/${REPO}/main/${file}`;
      console.log(chalk.blue(`📥 Downloading ${file}...`));

      // Use native fetch
      const res = await fetch(fileUrl);
      if (!res.ok) throw new Error(`Failed to fetch ${file}: ${res.statusText}`);

      const content = await res.text();
      await fs.outputFile(path.join(projectRoot, file), content);
      console.log(chalk.green(`✅ ${file} restored`));
    } catch (err) {
      console.log(chalk.red(`❌ Could not restore ${file}: ${err.message}`));
    }
  }

  console.log(chalk.green('\n✅ GoDev repair finished.'));
}
