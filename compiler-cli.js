#!/usr/bin/env node

import { Command } from 'commander';
import { DebianCompiler } from './compiler-debian.js';

const program = new Command();
const compiler = new DebianCompiler();

program
  .name('godev-compile')
  .description('🔨 GoDev Debian Compiler - Multi-language build system')
  .version('1.0.0');

program
  .command('build')
  .description('Compile the current project')
  .option('-p, --path <path>', 'Project path', '.')
  .action(async (options) => {
    await compiler.compileProject(options.path);
  });

program
  .command('clean')
  .description('Clean build directory')
  .action(async () => {
    await compiler.clean();
  });

program
  .command('info')
  .description('Show system compiler information')
  .action(async () => {
    await compiler.showSystemInfo();
  });

program
  .command('check-deps')
  .description('Check compiler dependencies')
  .action(async () => {
    console.log('Checking dependencies...');
    const languages = ['c', 'cpp', 'go', 'rust', 'nodejs', 'python'];
    for (const lang of languages) {
      const compiler = new DebianCompiler();
      const langConfig = compiler.supportedLanguages[lang];
      const installed = await compiler.isPackageInstalled(langConfig.package);
      console.log(`${lang}: ${installed ? '✅' : '❌'} ${langConfig.package}`);
    }
  });

program.parse();