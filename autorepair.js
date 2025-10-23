#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fetch from 'node-fetch'; // <-- Required for fetch() in Node.js

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

  // Ensure cogs directory exists
  await fs.ensureDir(path.join(projectRoot, 'cogs'));

  // Check critical files
  let missingFiles = [];
  for (const file of CRITICAL_FILES) {
    if (!await fs.pathExists(path.join(projectRoot, file))) {
      missingFiles.push(file);
    }
  }

  if (missingFiles.length > 0) {
    console.log(chalk.yellow('⚠️  Missing critical files:'), missingFiles.join(', '));

    const { download } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'download',
        message: `Download missing critical files from GitHub (${GITHUB_USER}/${REPO})?`,
        default: true
      }
    ]);

    if (download) {
      for (const file of missingFiles) {
        try {
          const url = `https://raw.githubusercontent.com/${GITHUB_USER}/${REPO}/main/${file}`;
          console.log(chalk.blue(`📥 Downloading ${file}...`));

          const res = await fetch(url);
          if (!res.ok) throw new Error(`Failed to fetch ${file}: ${res.statusText}`);

          const content = await res.text();
          await fs.outputFile(path.join(projectRoot, file), content);
          console.log(chalk.green(`✅ ${file} restored`));
        } catch (err) {
          console.log(chalk.red(`❌ Could not restore ${file}: ${err.message}`));
        }
      }
    }
  }

  // Recheck critical files
  missingFiles = [];
  for (const file of CRITICAL_FILES) {
    if (!await fs.pathExists(path.join(projectRoot, file))) {
      missingFiles.push(file);
    }
  }

  if (missingFiles.length > 0) {
    console.log(chalk.red.bold('\n❌ GoDev Auto Repair Cloud cannot fix GoDev Compiler on this system.'));
    console.log(chalk.red('Please restore these files manually or re-clone the repository.'));
    process.exit(1);
  }

  console.log(chalk.green('\n✅ Critical files are present. GoDev source restored.'));
}

// Optional: run directly when executed as script
if (import.meta.url === `file://${process.argv[1]}`) {
  autorepair();
}
