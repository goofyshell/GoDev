#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { execSync } from 'child_process';

const GITHUB_USER = 'schoobertt';
const REPO = 'GoDev';

const PROJECT_ROOT = path.join(process.env.HOME || process.env.USERPROFILE, '.godev');

// Define critical structure
const CRITICAL = {
  cogs: ['dependencies.js', 'git.js', 'init.js', 'templates.js'],
  config: ['settings.json', 'templates.json'],
  root: [
    'GoDev.png',
    'LICENSE',
    'README.md',
    'autorepair.js',
    'compiler-cli.js',
    'compiler-debian.js',
    'debug-installer.sh',
    'godev.js',
    'installer.sh',
    'package-lock.json',
    'package.json'
  ]
};

// Dependencies to install
const DEPENDENCIES = ['chalk', 'fs-extra', 'inquirer', 'commander', 'rxjs', 'ora', 'semver'];

async function repairFile(folder, file) {
  try {
    const filePath = path.join(PROJECT_ROOT, folder, file);
    console.log(chalk.blue(`📥 Downloading ${folder}/${file}...`));
    const fileUrl = `https://raw.githubusercontent.com/${GITHUB_USER}/${REPO}/main/${folder}/${file}`;
    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error(`Failed to fetch ${file}: ${res.statusText}`);
    const content = await res.text();
    await fs.outputFile(filePath, content);
    console.log(chalk.green(`✅ ${folder}/${file} restored`));
  } catch (err) {
    console.log(chalk.red(`❌ Could not restore ${folder}/${file}: ${err.message}`));
  }
}

async function repairRootFile(file) {
  try {
    const filePath = path.join(PROJECT_ROOT, file);
    console.log(chalk.blue(`📥 Downloading ${file}...`));
    const fileUrl = `https://raw.githubusercontent.com/${GITHUB_USER}/${REPO}/main/${file}`;
    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error(`Failed to fetch ${file}: ${res.statusText}`);
    const content = await res.text();
    await fs.outputFile(filePath, content);
    console.log(chalk.green(`✅ ${file} restored`));
  } catch (err) {
    console.log(chalk.red(`❌ Could not restore ${file}: ${err.message}`));
  }
}

async function autorepair() {
  console.log(chalk.blue('🔧 GoDev Full Auto Repair\n'));

  // Ensure root folder exists
  await fs.ensureDir(PROJECT_ROOT);

  // --- Repair cogs ---
  for (const file of CRITICAL.cogs) {
    const filePath = path.join(PROJECT_ROOT, 'cogs', file);
    const broken = !(await fs.pathExists(filePath)) || (await fs.readFile(filePath, 'utf8')).includes('BROKEN_FILE_CONTENT');
    if (broken) await repairFile('cogs', file);
  }

  // --- Repair config ---
  await fs.ensureDir(path.join(PROJECT_ROOT, 'config'));
  for (const file of CRITICAL.config) {
    const filePath = path.join(PROJECT_ROOT, 'config', file);
    if (!(await fs.pathExists(filePath))) {
      await repairFile('config', file);
    }
  }

  // --- Repair root files ---
  for (const file of CRITICAL.root) {
    const filePath = path.join(PROJECT_ROOT, file);
    if (!(await fs.pathExists(filePath))) {
      await repairRootFile(file);
    }
  }

  // --- Reinstall dependencies ---
  console.log(chalk.blue('\n⚙️ Installing/updating dependencies...'));
  try {
    execSync(`npm install ${DEPENDENCIES.join(' ')}`, { cwd: PROJECT_ROOT, stdio: 'inherit' });
    console.log(chalk.green('✅ Dependencies installed'));
  } catch (err) {
    console.log(chalk.red(`❌ Failed to install dependencies: ${err.message}`));
  }

  console.log(chalk.green('\n✅ GoDev full repair finished!'));
  console.log(chalk.yellow('💡 Tip: Re-run your GoDev command after repair.'));
}

// Run autorepair immediately if executed
if (process.argv[1] && process.argv[1].endsWith('autorepair.js')) {
  autorepair();
}

export default autorepair;
