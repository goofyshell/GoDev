#!/usr/bin/env node

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';

const execAsync = promisify(exec);

export class DebianCompiler {
  constructor() {
    this.supportedLanguages = {
      'c': { compiler: 'gcc', package: 'gcc', extension: '.c' },
      'cpp': { compiler: 'g++', package: 'g++', extension: '.cpp' },
      'go': { compiler: 'go build', package: 'golang', extension: '.go' },
      'rust': { compiler: 'cargo build', package: 'cargo', extension: '.rs' },
      'nodejs': { compiler: 'node', package: 'nodejs', extension: '.js', runtime: true },
      'python': { compiler: 'python3', package: 'python3', extension: '.py', runtime: true }
    };

    this.buildDir = './build';
  }

  async compileProject(projectPath = '.') {
    console.log(chalk.blue.bold('\n🔨 GoDev Debian Compiler\n'));

    try {
      // Detect project type
      const projectType = await this.detectProjectType(projectPath);
      
      if (!projectType) {
        console.log(chalk.yellow('❓ Could not detect project type'));
        return;
      }

      console.log(chalk.green(`📦 Detected: ${projectType} project`));

      // Check and install dependencies
      await this.ensureDependencies(projectType);

      // Create build directory
      await fs.ensureDir(this.buildDir);

      // Compile based on project type
      const result = await this.compile(projectType, projectPath);

      if (result.success) {
        console.log(chalk.green.bold('\n✅ Compilation successful!'));
        console.log(chalk.blue(`📦 Output: ${result.output}`));
        
        // Offer to run the program
        await this.offerToRun(result, projectType);
      } else {
        console.log(chalk.red.bold('\n❌ Compilation failed!'));
        console.log(chalk.red(result.error));
      }

    } catch (error) {
      console.log(chalk.red.bold('💥 Compilation error:'), error.message);
    }
  }

  async detectProjectType(projectPath) {
    const files = await fs.readdir(projectPath);

    // Check for specific project files
    if (files.includes('Cargo.toml')) return 'rust';
    if (files.includes('go.mod')) return 'go';
    if (files.includes('package.json')) return 'nodejs';
    if (files.includes('requirements.txt')) return 'python';
    
    // Check source files
    const sourceFile = files.find(file => {
      const ext = path.extname(file);
      return Object.values(this.supportedLanguages).some(lang => 
        lang.extension === ext
      );
    });

    if (sourceFile) {
      const ext = path.extname(sourceFile);
      return Object.keys(this.supportedLanguages).find(lang => 
        this.supportedLanguages[lang].extension === ext
      );
    }

    return null;
  }

  async ensureDependencies(language) {
    const langConfig = this.supportedLanguages[language];
    
    if (!await this.isPackageInstalled(langConfig.package)) {
      console.log(chalk.yellow(`📥 Installing ${langConfig.package}...`));
      
      const { install } = await inquirer.prompt([{
        type: 'confirm',
        name: 'install',
        message: `Install ${langConfig.package}? (requires sudo)`,
        default: true
      }]);

      if (install) {
        await this.installPackage(langConfig.package);
      } else {
        throw new Error(`Required package ${langConfig.package} is not installed`);
      }
    } else {
      console.log(chalk.green(`✅ ${langConfig.package} is installed`));
    }
  }

  async isPackageInstalled(packageName) {
    try {
      await execAsync(`dpkg -l | grep -q ${packageName}`);
      return true;
    } catch {
      return false;
    }
  }

  async installPackage(packageName) {
    return new Promise((resolve, reject) => {
      console.log(chalk.yellow(`🔄 Installing ${packageName} with apt...`));
      
      const child = spawn('sudo', ['apt', 'install', '-y', packageName], {
        stdio: 'inherit'
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green(`✅ ${packageName} installed successfully`));
          resolve();
        } else {
          reject(new Error(`Failed to install ${packageName}`));
        }
      });
    });
  }

  async compile(language, projectPath) {
    const langConfig = this.supportedLanguages[language];
    const absoluteProjectPath = path.resolve(projectPath);
    const outputName = this.getOutputName(language, absoluteProjectPath);
    const outputPath = path.join(this.buildDir, outputName);

    try {
      switch (language) {
        case 'c':
          return await this.compileC(absoluteProjectPath, outputPath);
        case 'cpp':
          return await this.compileCpp(absoluteProjectPath, outputPath);
        case 'go':
          return await this.compileGo(absoluteProjectPath, outputPath);
        case 'rust':
          return await this.compileRust(absoluteProjectPath, outputPath);
        case 'nodejs':
          return await this.prepareNode(absoluteProjectPath);
        case 'python':
          return await this.preparePython(absoluteProjectPath);
        default:
          throw new Error(`Unsupported language: ${language}`);
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async compileC(projectPath, outputPath) {
    // Find all .c files
    const files = await this.findFiles(projectPath, '.c');
    
    if (files.length === 0) {
      throw new Error('No .c files found');
    }

    // Ensure build directory exists
    await fs.ensureDir(path.dirname(outputPath));

    const command = `gcc ${files.map(f => `"${f}"`).join(' ')} -o "${outputPath}" -Wall -Wextra`;
    console.log(chalk.blue(`🔨 Compiling: ${command}`));
    
    await execAsync(command);

    // Make executable
    await fs.chmod(outputPath, 0o755);

    return { success: true, output: outputPath, executable: outputPath };
  }

  async compileCpp(projectPath, outputPath) {
    const files = await this.findFiles(projectPath, '.cpp');
    
    if (files.length === 0) {
      throw new Error('No .cpp files found');
    }

    // Ensure build directory exists
    await fs.ensureDir(path.dirname(outputPath));

    const command = `g++ ${files.map(f => `"${f}"`).join(' ')} -o "${outputPath}" -Wall -Wextra -std=c++17`;
    console.log(chalk.blue(`🔨 Compiling: ${command}`));
    
    await execAsync(command);

    // Make executable
    await fs.chmod(outputPath, 0o755);

    return { success: true, output: outputPath, executable: outputPath };
  }

  async compileGo(projectPath, outputPath) {
    // Ensure build directory exists
    await fs.ensureDir(path.dirname(outputPath));

    await execAsync(`go build -o "${outputPath}"`, { cwd: projectPath });
    
    // Make executable
    await fs.chmod(outputPath, 0o755);

    return { success: true, output: outputPath, executable: outputPath };
  }

  async compileRust(projectPath, outputPath) {
    await execAsync('cargo build --release', { cwd: projectPath });
    
    // Rust outputs to target/release/
    const cargoOutput = path.join(projectPath, 'target/release', path.basename(projectPath));
    
    // Ensure build directory exists
    await fs.ensureDir(path.dirname(outputPath));
    
    if (await fs.pathExists(cargoOutput)) {
      await fs.copy(cargoOutput, outputPath);
    } else {
      // Fallback: try to find the binary
      const rustBinaries = await this.findFiles(path.join(projectPath, 'target/release'), '');
      const executable = rustBinaries.find(f => {
        const stat = fs.statSync(f);
        return stat.isFile() && (stat.mode & fs.constants.X_OK);
      });
      
      if (executable) {
        await fs.copy(executable, outputPath);
      } else {
        throw new Error('Could not find Rust build output');
      }
    }

    // Make executable
    await fs.chmod(outputPath, 0o755);

    return { success: true, output: outputPath, executable: outputPath };
  }

  async prepareNode(projectPath) {
    // Install npm dependencies if package.json exists
    if (await fs.pathExists(path.join(projectPath, 'package.json'))) {
      console.log(chalk.blue('📦 Installing npm dependencies...'));
      await execAsync('npm install', { cwd: projectPath });
    }

    const mainFile = await this.findMainFile(projectPath, '.js');
    return { 
      success: true, 
      output: mainFile, 
      executable: `node "${mainFile}"`,
      runtime: 'node'
    };
  }

  async preparePython(projectPath) {
    // Install pip dependencies if requirements.txt exists
    if (await fs.pathExists(path.join(projectPath, 'requirements.txt'))) {
      console.log(chalk.blue('📦 Installing Python dependencies...'));
      await execAsync('pip3 install -r requirements.txt', { cwd: projectPath });
    }

    const mainFile = await this.findMainFile(projectPath, '.py');
    return { 
      success: true, 
      output: mainFile, 
      executable: `python3 "${mainFile}"`,
      runtime: 'python3'
    };
  }

  async findFiles(projectPath, extension) {
    try {
      const files = await fs.readdir(projectPath);
      return files
        .filter(file => file.endsWith(extension))
        .map(file => path.join(projectPath, file));
    } catch (error) {
      return [];
    }
  }

  async findMainFile(projectPath, extension) {
    const files = await this.findFiles(projectPath, extension);
    
    if (files.length === 0) {
      throw new Error(`No ${extension} files found`);
    }
    
    // Look for common main file names
    const mainFiles = files.filter(file => {
      const baseName = path.basename(file).toLowerCase();
      return baseName.includes('main') || baseName.includes('index') || baseName.includes('app');
    });

    return mainFiles[0] || files[0];
  }

  getOutputName(language, projectPath) {
    const baseName = path.basename(projectPath) === '.' ? 'app' : path.basename(projectPath);
    
    const extensions = {
      'c': '',
      'cpp': '',
      'go': '',
      'rust': '-rust',
      'nodejs': '.js',
      'python': '.py'
    };

    return `${baseName}${extensions[language]}`;
  }

  async offerToRun(result, language) {
    try {
      if (result.runtime) {
        // For interpreted languages
        const { run } = await inquirer.prompt([{
          type: 'confirm',
          name: 'run',
          message: `Run the program with ${result.runtime}?`,
          default: true
        }]);

        if (run) {
          console.log(chalk.blue('\n🚀 Running program...\n'));
          
          const [runtime, ...args] = result.executable.split(' ');
          console.log(chalk.gray(`$ ${runtime} ${args.join(' ')}`));
          
          const child = spawn(runtime, args, {
            stdio: 'inherit',
            shell: true
          });

          child.on('close', (code) => {
            console.log(chalk.blue(`\nProgram exited with code: ${code}`));
          });
        }
      } else {
        // For compiled languages
        const { run } = await inquirer.prompt([{
          type: 'confirm',
          name: 'run',
          message: 'Run the compiled program?',
          default: true
        }]);

        if (run) {
          console.log(chalk.blue('\n🚀 Running program...\n'));
          
          // Verify the executable exists
          if (!await fs.pathExists(result.executable)) {
            throw new Error(`Executable not found: ${result.executable}`);
          }

          // Get relative path for display
          const relativePath = path.relative(process.cwd(), result.executable);
          console.log(chalk.gray(`$ ./${relativePath}`));
          
          // Use spawn with the absolute path
          const child = spawn(result.executable, [], {
            stdio: 'inherit',
            shell: false
          });

          child.on('close', (code) => {
            console.log(chalk.blue(`\nProgram exited with code: ${code}`));
          });

          child.on('error', (error) => {
            console.log(chalk.red(`Failed to run: ${error.message}`));
            console.log(chalk.yellow('Try running manually:'));
            console.log(chalk.blue(`  ./${relativePath}`));
          });
        }
      }
    } catch (error) {
      console.log(chalk.red(`Error running program: ${error.message}`));
    }
  }

  // Utility method to clean build directory
  async clean() {
    if (await fs.pathExists(this.buildDir)) {
      await fs.remove(this.buildDir);
      console.log(chalk.green('🧹 Build directory cleaned'));
    } else {
      console.log(chalk.yellow('📁 Build directory does not exist'));
    }
  }

  // Method to show system info
  async showSystemInfo() {
    console.log(chalk.blue.bold('\n💻 Debian System Information\n'));
    
    try {
      const [osInfo, gccVersion, goVersion, nodeVersion, pythonVersion, rustVersion] = await Promise.all([
        execAsync('lsb_release -d').catch(() => ({ stdout: 'Unknown' })),
        execAsync('gcc --version | head -n1').catch(() => ({ stdout: 'Not installed' })),
        execAsync('go version 2>/dev/null').catch(() => ({ stdout: 'Not installed' })),
        execAsync('node --version 2>/dev/null').catch(() => ({ stdout: 'Not installed' })),
        execAsync('python3 --version 2>/dev/null').catch(() => ({ stdout: 'Not installed' })),
        execAsync('cargo --version 2>/dev/null').catch(() => ({ stdout: 'Not installed' }))
      ]);

      console.log(`OS: ${osInfo.stdout.toString().trim().replace('Description:\t', '')}`);
      console.log(`GCC: ${gccVersion.stdout.toString().trim()}`);
      console.log(`Go: ${goVersion.stdout.toString().trim()}`);
      console.log(`Node.js: ${nodeVersion.stdout.toString().trim()}`);
      console.log(`Python: ${pythonVersion.stdout.toString().trim()}`);
      console.log(`Rust: ${rustVersion.stdout.toString().trim()}`);
    } catch (error) {
      console.log(chalk.red('Error getting system info:'), error.message);
    }
  }
}

// If running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const compiler = new DebianCompiler();
  const command = process.argv[2] || 'build';
  const projectPath = process.argv[3] || '.';

  switch (command) {
    case 'build':
      await compiler.compileProject(projectPath);
      break;
    case 'clean':
      await compiler.clean();
      break;
    case 'info':
      await compiler.showSystemInfo();
      break;
    default:
      console.log('Usage: node compiler-debian.js [build|clean|info] [project-path]');
  }
}