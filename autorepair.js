#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { execSync } from 'child_process';
import semver from 'semver';

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

const PLACEHOLDER_SIGNATURES = ["BROKEN_FILE_CONTENT", "TODO"];

export default async function autorepair() {
  console.log(chalk.blue('🔧 GoDev Auto Repair\n'));

  const projectRoot = path.join(process.env.HOME || process.env.USERPROFILE, '.godev');
  const nodeVersion = process.versions.node;

  // Step 1: Check critical files for missing or corrupted content
  let missingFiles = [];
  let corruptedFiles = [];

  for (const file of CRITICAL_FILES) {
    const fullPath = path.join(projectRoot, file);
    if (!await fs.pathExists(fullPath)) {
      missingFiles.push(file);
      continue;
    }

    const content = await fs.readFile(fullPath, 'utf8').catch(() => '');
    if (!content || PLACEHOLDER_SIGNATURES.some(sig => content.includes(sig))) {
      corruptedFiles.push(file);
    }
  }

  if (missingFiles.length === 0 && corruptedFiles.length === 0) {
    console.log(chalk.green('✅ All critical files present and valid.'));
  } else {
    if (missingFiles.length) console.log(chalk.yellow('⚠️  Missing files:'), missingFiles.join(', '));
    if (corruptedFiles.length) console.log(chalk.yellow('⚠️  Corrupted files:'), corruptedFiles.join(', '));

    const { download } = await inquirer.prompt([{
      type: 'confirm',
      name: 'download',
      message: `Download missing/corrupted files from GitHub (${GITHUB_USER}/${REPO})?`,
      default: true
    }]);

    if (download) {
      for (const file of [...missingFiles, ...corruptedFiles]) {
        try {
          const fileUrl = `https://raw.githubusercontent.com/${GITHUB_USER}/${REPO}/main/${file}`;
          console.log(chalk.blue(`📥 Downloading ${file}...`));
          const res = await fetch(fileUrl);
          if (!res.ok) throw new Error(res.statusText);
          const content = await res.text();
          await fs.outputFile(path.join(projectRoot, file), content);
          console.log(chalk.green(`✅ ${file} restored`));
        } catch (err) {
          console.log(chalk.red(`❌ Could not restore ${file}: ${err.message}`));
        }
      }
    }
  }

  // Step 2: Check Node version and warn for incompatible packages
  const dependencies = ['chalk', 'fs-extra', 'inquirer', 'commander', 'rxjs', 'ora'];
  let reinstallDeps = [];

  for (const dep of dependencies) {
    try {
      const pkgPath = path.join(projectRoot, 'node_modules', dep, 'package.json');
      const pkg = await fs.readJson(pkgPath);
      if (pkg.engines?.node && !semver.satisfies(nodeVersion, pkg.engines.node)) {
        console.log(chalk.yellow(`⚠️  ${dep} expects Node ${pkg.engines.node}, current is ${nodeVersion}`));
        reinstallDeps.push(dep);
      }
    } catch {
      reinstallDeps.push(dep);
    }
  }

  // Step 3: Reinstall missing or incompatible dependencies
  for (const dep of reinstallDeps) {
    try {
      console.log(chalk.blue(`⚠️  Installing/updating dependency: ${dep}`));
      execSync(`npm install ${dep}`, { stdio: 'inherit', cwd: projectRoot });
    } catch (err) {
      console.log(chalk.red(`❌ Failed to install ${dep}: ${err.message}`));
    }
  }

  console.log(chalk.green('\n✅ GoDev repair finished.'));
  console.log(chalk.cyan('💡 Tip: Re-run your GoDev command after repair.'));
}
