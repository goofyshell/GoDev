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
      'python': { compiler: 'python3', package: 'python3', extension: '.py', runtime: true },
      'web': { compiler: 'browser', package: '', extension: '.html', runtime: true },
      'react': { compiler: 'npm', package: 'nodejs', extension: '.jsx', runtime: true },
      'docker': { compiler: 'docker', package: 'docker.io', extension: '', runtime: false }
    };

    this.buildDir = './build';
  }

  async compileProject(projectPath = '.') {
    console.log(chalk.blue.bold('\n🔨 GoDev Smart Compiler\n'));

    try {
      const absoluteProjectPath = path.resolve(projectPath);
      
      // Show what we're working with
      await this.debugProjectStructure(absoluteProjectPath);
      
      // Detect project type
      const projectType = await this.detectProjectType(absoluteProjectPath);
      
      if (!projectType) {
        console.log(chalk.yellow('❓ Could not auto-detect project type'));
        console.log(chalk.yellow('💡 Try specifying the language manually with: godev-compile build --lang c'));
        return;
      }

      console.log(chalk.green(`📦 Detected: ${projectType} project`));
      console.log(chalk.gray(`📁 Project path: ${absoluteProjectPath}`));

      // Check and install dependencies (skip for web projects)
      if (projectType !== 'web' && projectType !== 'react' && projectType !== 'docker') {
        await this.ensureDependencies(projectType);
      }

      // Create build directory
      const projectBuildDir = path.join(absoluteProjectPath, this.buildDir);
      await fs.ensureDir(projectBuildDir);

      // Compile based on project type
      const result = await this.compile(projectType, absoluteProjectPath, projectBuildDir);

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

  async debugProjectStructure(projectPath) {
    console.log(chalk.yellow('🔍 Analyzing project structure...'));
    
    try {
      const files = await fs.readdir(projectPath);
      console.log(chalk.gray('📂 Root directory:'), files.join(', '));
      
      // Check for common source directories
      const commonDirs = ['src', 'lib', 'include', 'source', 'headers', 'css', 'js', 'components', 'Private', 'Public'];
      let foundDirs = [];
      
      for (const dir of commonDirs) {
        const dirPath = path.join(projectPath, dir);
        if (await fs.pathExists(dirPath)) {
          const dirFiles = await fs.readdir(dirPath).catch(() => []);
          const sourceFiles = dirFiles.filter(file => 
            ['.c', '.cpp', '.cc', '.cxx', '.h', '.hpp', '.html', '.css', '.js', '.jsx', '.ts', '.tsx', '.py', '.rs', '.go'].includes(path.extname(file).toLowerCase())
          );
          if (sourceFiles.length > 0) {
            foundDirs.push(`${dir}/ (${sourceFiles.length} files)`);
          }
        }
      }
      
      if (foundDirs.length > 0) {
        console.log(chalk.gray('📁 Source directories:'), foundDirs.join(', '));
      }
      
      // Count source files recursively
      const allSourceFiles = await this.findFilesRecursive(projectPath, ['.c', '.cpp', '.cc', '.cxx', '.go', '.rs', '.js', '.jsx', '.ts', '.tsx', '.py', '.html', '.css']);
      console.log(chalk.gray('📄 Total source files:'), allSourceFiles.length);
      
      if (allSourceFiles.length > 0) {
        allSourceFiles.slice(0, 5).forEach(file => {
          console.log(chalk.gray('   └─'), path.relative(projectPath, file));
        });
        if (allSourceFiles.length > 5) {
          console.log(chalk.gray('   └─ ... and', allSourceFiles.length - 5, 'more'));
        }
      }
      
    } catch (error) {
      console.log(chalk.red('Debug error:'), error.message);
    }
    console.log();
  }

  async detectProjectType(projectPath) {
    try {
      // First, check for obvious project configuration files
      const configFiles = {
        'Cargo.toml': 'rust',
        'go.mod': 'go', 
        'package.json': 'nodejs',
        'requirements.txt': 'python',
        'setup.py': 'python',
        'pyproject.toml': 'python',
        'vite.config.js': 'react',
        'vite.config.ts': 'react',
        'Dockerfile': 'docker',
        'docker-compose.yml': 'docker'
      };

      for (const [file, lang] of Object.entries(configFiles)) {
        if (await this.findFileRecursive(projectPath, file)) {
          return lang;
        }
      }

      // Check for HTML/CSS/JS projects
      const hasHtmlFiles = (await this.findFilesRecursive(projectPath, ['.html'])).length > 0;
      const hasCssFiles = (await this.findFilesRecursive(projectPath, ['.css'])).length > 0;
      const hasJsFiles = (await this.findFilesRecursive(projectPath, ['.js', '.jsx', '.ts', '.tsx'])).length > 0;
      
      // If we have HTML files and this looks like a web project
      if (hasHtmlFiles) {
        // Check if it's a React project (has JSX/TSX files)
        const hasJsxFiles = (await this.findFilesRecursive(projectPath, ['.jsx', '.tsx'])).length > 0;
        if (hasJsxFiles) {
          console.log(chalk.gray('⚛️  Detected: React project'));
          return 'react';
        }
        
        // Check if it's a web project (has HTML + CSS/JS but no Node.js files)
        const hasNodeModules = await fs.pathExists(path.join(projectPath, 'node_modules'));
        const hasPackageJson = await fs.pathExists(path.join(projectPath, 'package.json'));
        
        if (!hasNodeModules && !hasPackageJson) {
          console.log(chalk.gray('🌐 Detected: Web project (HTML/CSS/JS)'));
          return 'web';
        }
      }

      // Check for C/C++ build systems - IMPROVED DETECTION
      const makefile = await this.findFileRecursive(projectPath, 'Makefile') || 
                    await this.findFileRecursive(projectPath, 'makefile');
      
      if (makefile) {
        // Read Makefile content to determine language
        const makefileContent = await fs.readFile(makefile, 'utf8').catch(() => '');
        
        // Check what source files actually exist
        const hasCFiles = (await this.findFilesRecursive(projectPath, ['.c'])).length > 0;
        const hasCppFiles = (await this.findFilesRecursive(projectPath, ['.cpp', '.cc', '.cxx'])).length > 0;
        
        if (hasCppFiles && !hasCFiles) {
          console.log(chalk.gray(`📋 Found build system: Makefile (C++)`));
          return 'cpp';
        } else if (hasCFiles && !hasCppFiles) {
          console.log(chalk.gray(`📋 Found build system: Makefile (C)`));
          return 'c';
        } else if (hasCFiles && hasCppFiles) {
          // If both exist, prefer C++ if Makefile suggests it
          if (makefileContent.includes('g++') || makefileContent.includes('.cpp')) {
            console.log(chalk.gray(`📋 Found build system: Makefile (C++)`));
            return 'cpp';
          } else {
            console.log(chalk.gray(`📋 Found build system: Makefile (C)`));
            return 'c';
          }
        }
      }

      // Check other build systems
      const buildFiles = {
        'CMakeLists.txt': 'cpp',
        'configure': 'c',
        'autogen.sh': 'c'
      };

      for (const [file, lang] of Object.entries(buildFiles)) {
        if (await this.findFileRecursive(projectPath, file)) {
          console.log(chalk.gray(`📋 Found build system: ${file}`));
          return lang;
        }
      }

      // Count source files by type
      const fileTypes = {
        'c': await this.findFilesRecursive(projectPath, ['.c']),
        'cpp': await this.findFilesRecursive(projectPath, ['.cpp', '.cc', '.cxx']),
        'go': await this.findFilesRecursive(projectPath, ['.go']),
        'rust': await this.findFilesRecursive(projectPath, ['.rs']),
        'nodejs': await this.findFilesRecursive(projectPath, ['.js', '.mjs', '.cjs']),
        'python': await this.findFilesRecursive(projectPath, ['.py']),
        'react': await this.findFilesRecursive(projectPath, ['.jsx', '.tsx']),
        'web': await this.findFilesRecursive(projectPath, ['.html'])
      };

      // Find the language with the most source files
      let detectedLang = null;
      let maxFiles = 0;

      for (const [lang, files] of Object.entries(fileTypes)) {
        if (files.length > maxFiles) {
          maxFiles = files.length;
          detectedLang = lang;
        }
      }

      // Only return if we found a reasonable number of files
      if (detectedLang && maxFiles > 0) {
        console.log(chalk.gray(`📄 Detected by files: ${maxFiles} ${detectedLang} files`));
        return detectedLang;
      }

      // Check for common project structures
      const commonDirs = ['src', 'lib', 'include', 'source'];
      for (const dir of commonDirs) {
        const dirPath = path.join(projectPath, dir);
        if (await fs.pathExists(dirPath)) {
          // This looks like a C/C++ project with standard structure
          const hasCFiles = (await this.findFilesRecursive(dirPath, ['.c'])).length > 0;
          const hasCppFiles = (await this.findFilesRecursive(dirPath, ['.cpp', '.cc', '.cxx'])).length > 0;
          
          if (hasCppFiles) return 'cpp';
          if (hasCFiles) return 'c';
        }
      }

      return null;

    } catch (error) {
      console.log(chalk.red('Detection error:'), error.message);
      return null;
    }
  }

  async findFileRecursive(dir, fileName) {
    try {
      const files = await fs.readdir(dir);
      
      // Check current directory first
      if (files.includes(fileName)) {
        return path.join(dir, fileName);
      }
      
      // Recursively check subdirectories (but skip build dirs and node_modules)
      for (const file of files) {
        const fullPath = path.join(dir, file);
        try {
          const stat = await fs.stat(fullPath);
          
          if (stat.isDirectory() && 
              !file.startsWith('.') && 
              file !== 'node_modules' && 
              file !== 'build' && 
              file !== 'target' &&
              file !== 'dist') {
            const found = await this.findFileRecursive(fullPath, fileName);
            if (found) return found;
          }
        } catch (error) {
          // Skip files we can't access
        }
      }
    } catch (error) {
      // Directory might not be readable
    }
    
    return null;
  }

  async findFilesRecursive(dir, extensions) {
    const files = [];
    
    async function scanDirectory(currentDir) {
      try {
        const items = await fs.readdir(currentDir);
        
        for (const item of items) {
          const fullPath = path.join(currentDir, item);
          
          try {
            const stat = await fs.stat(fullPath);
            
            if (stat.isDirectory()) {
              // Skip hidden directories and common build/output directories
              if (!item.startsWith('.') && 
                  item !== 'node_modules' && 
                  item !== 'build' && 
                  item !== 'target' &&
                  item !== 'dist' &&
                  item !== 'obj') {
                await scanDirectory(fullPath);
              }
            } else if (stat.isFile()) {
              const ext = path.extname(item).toLowerCase();
              if (extensions.includes(ext)) {
                files.push(fullPath);
              }
            }
          } catch (error) {
            // Skip files we can't access
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    }
    
    await scanDirectory(dir);
    return files;
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

  async compile(language, projectPath, buildDir) {
    const langConfig = this.supportedLanguages[language];
    const outputName = this.getOutputName(language, projectPath);
    const outputPath = path.join(buildDir, outputName);

    try {
      switch (language) {
        case 'c':
          return await this.compileC(projectPath, outputPath);
        case 'cpp':
          return await this.compileCpp(projectPath, outputPath);
        case 'go':
          return await this.compileGo(projectPath, outputPath);
        case 'rust':
          return await this.compileRust(projectPath, outputPath);
        case 'nodejs':
          return await this.prepareNode(projectPath);
        case 'python':
          return await this.preparePython(projectPath);
        case 'web':
          return await this.prepareWeb(projectPath);
        case 'react':
          return await this.prepareReact(projectPath);
        case 'docker':
          return await this.prepareDocker(projectPath);
        default:
          throw new Error(`Unsupported language: ${language}`);
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async compileC(projectPath, outputPath) {
    // Check for Makefile first
    const makefile = await this.findFileRecursive(projectPath, 'Makefile') || 
                    await this.findFileRecursive(projectPath, 'makefile');
    
    if (makefile) {
      console.log(chalk.blue('🔨 Using Makefile for C project'));
      try {
        await execAsync('make', { cwd: path.dirname(makefile) });
        
        // Look for the built executable in common locations
        const possibleDirs = ['.', 'build', 'bin', 'out', 'dist'];
        let executable = null;
        
        for (const dir of possibleDirs) {
          const searchPath = path.join(path.dirname(makefile), dir);
          if (await fs.pathExists(searchPath)) {
            const files = await fs.readdir(searchPath).catch(() => []);
            const execFile = files.find(file => {
              const fullPath = path.join(searchPath, file);
              try {
                const stat = fs.statSync(fullPath);
                return stat.isFile() && (stat.mode & fs.constants.X_OK);
              } catch {
                return false;
              }
            });
            
            if (execFile) {
              executable = path.join(searchPath, execFile);
              break;
            }
          }
        }
        
        // Also check for any executable in project root
        if (!executable) {
          const rootFiles = await fs.readdir(path.dirname(makefile)).catch(() => []);
          const execFile = rootFiles.find(file => {
            const fullPath = path.join(path.dirname(makefile), file);
            try {
              const stat = fs.statSync(fullPath);
              return stat.isFile() && (stat.mode & fs.constants.X_OK) && !file.includes('.');
            } catch {
              return false;
            }
          });
          
          if (execFile) {
            executable = path.join(path.dirname(makefile), execFile);
          }
        }
        
        if (executable) {
          await fs.ensureDir(path.dirname(outputPath));
          await fs.copy(executable, outputPath);
          console.log(chalk.green(`📦 Built executable: ${path.basename(executable)}`));
          return { success: true, output: outputPath, executable: outputPath };
        } else {
          console.log(chalk.yellow('⚠️  Make succeeded but no executable found, falling back to direct compilation'));
        }
      } catch (makeError) {
        console.log(chalk.yellow('⚠️  Make failed, falling back to direct compilation'));
      }
    }

    // Fallback to direct compilation
    const files = await this.findFilesRecursive(projectPath, ['.c']);
    
    if (files.length === 0) {
      throw new Error('No .c files found in project directory');
    }

    console.log(chalk.blue(`🔍 Found ${files.length} C source files`));

    // Ensure build directory exists
    await fs.ensureDir(path.dirname(outputPath));

    const includeDirs = this.getIncludeDirectories(projectPath, files);
    const command = `gcc ${files.map(f => `"${f}"`).join(' ')} ${includeDirs} -o "${outputPath}" -Wall -Wextra`;
    
    console.log(chalk.blue(`🔨 Compiling: ${command}`));
    
    await execAsync(command);

    // Make executable
    await fs.chmod(outputPath, 0o755);

    return { success: true, output: outputPath, executable: outputPath };
  }

  async compileCpp(projectPath, outputPath) {
    // Check for Makefile first
    const makefile = await this.findFileRecursive(projectPath, 'Makefile') || 
                    await this.findFileRecursive(projectPath, 'makefile');
    
    if (makefile) {
      console.log(chalk.blue('🔨 Using Makefile for C++ project'));
      try {
        await execAsync('make', { cwd: path.dirname(makefile) });
        
        // Look for the built executable in common locations
        const possibleDirs = ['.', 'build', 'bin', 'out', 'dist'];
        let executable = null;
        
        for (const dir of possibleDirs) {
          const searchPath = path.join(path.dirname(makefile), dir);
          if (await fs.pathExists(searchPath)) {
            const files = await fs.readdir(searchPath).catch(() => []);
            const execFile = files.find(file => {
              const fullPath = path.join(searchPath, file);
              try {
                const stat = fs.statSync(fullPath);
                return stat.isFile() && (stat.mode & fs.constants.X_OK);
              } catch {
                return false;
              }
            });
            
            if (execFile) {
              executable = path.join(searchPath, execFile);
              break;
            }
          }
        }
        
        // Also check for any executable in project root
        if (!executable) {
          const rootFiles = await fs.readdir(path.dirname(makefile)).catch(() => []);
          const execFile = rootFiles.find(file => {
            const fullPath = path.join(path.dirname(makefile), file);
            try {
              const stat = fs.statSync(fullPath);
              return stat.isFile() && (stat.mode & fs.constants.X_OK) && !file.includes('.');
            } catch {
              return false;
            }
          });
          
          if (execFile) {
            executable = path.join(path.dirname(makefile), execFile);
          }
        }
        
        if (executable) {
          await fs.ensureDir(path.dirname(outputPath));
          await fs.copy(executable, outputPath);
          console.log(chalk.green(`📦 Built executable: ${path.basename(executable)}`));
          return { success: true, output: outputPath, executable: outputPath };
        } else {
          console.log(chalk.yellow('⚠️  Make succeeded but no executable found, falling back to direct compilation'));
        }
      } catch (makeError) {
        console.log(chalk.yellow('⚠️  Make failed, falling back to direct compilation'));
      }
    }

    // Fallback to direct compilation
    const files = await this.findFilesRecursive(projectPath, ['.cpp', '.cc', '.cxx']);
    
    if (files.length === 0) {
      throw new Error('No C++ files found in project directory');
    }

    console.log(chalk.blue(`🔍 Found ${files.length} C++ source files`));

    await fs.ensureDir(path.dirname(outputPath));

    const includeDirs = this.getIncludeDirectories(projectPath, files);
    const command = `g++ ${files.map(f => `"${f}"`).join(' ')} ${includeDirs} -o "${outputPath}" -Wall -Wextra -std=c++17`;
    
    console.log(chalk.blue(`🔨 Compiling: ${command}`));
    
    await execAsync(command);

    await fs.chmod(outputPath, 0o755);

    return { success: true, output: outputPath, executable: outputPath };
  }

  getIncludeDirectories(projectPath, files) {
    const uniqueDirs = new Set();
    
    // Add project root and common include directories
    uniqueDirs.add(projectPath);
    
    // Add directories containing source files
    files.forEach(file => {
      uniqueDirs.add(path.dirname(file));
    });

    // Add common include directories if they exist
    const commonIncludes = ['include', 'inc', 'headers', 'src'];
    commonIncludes.forEach(dir => {
      const includePath = path.join(projectPath, dir);
      if (fs.existsSync(includePath)) {
        uniqueDirs.add(includePath);
      }
    });

    // Convert to include flags
    return Array.from(uniqueDirs)
      .map(dir => `-I"${dir}"`)
      .join(' ');
  }

  async compileGo(projectPath, outputPath) {
    await fs.ensureDir(path.dirname(outputPath));

    await execAsync(`go build -o "${outputPath}"`, { cwd: projectPath });
    
    await fs.chmod(outputPath, 0o755);

    return { success: true, output: outputPath, executable: outputPath };
  }

  async compileRust(projectPath, outputPath) {
    await execAsync('cargo build --release', { cwd: projectPath });
    
    // Rust outputs to target/release/
    const cargoOutput = path.join(projectPath, 'target/release', path.basename(projectPath));
    
    await fs.ensureDir(path.dirname(outputPath));
    
    if (await fs.pathExists(cargoOutput)) {
      await fs.copy(cargoOutput, outputPath);
    } else {
      // Fallback: find any binary in target/release
      const rustBinaries = await this.findFilesRecursive(path.join(projectPath, 'target/release'), ['']);
      const executable = rustBinaries.find(f => {
        try {
          const stat = fs.statSync(f);
          return stat.isFile() && (stat.mode & fs.constants.X_OK);
        } catch {
          return false;
        }
      });
      
      if (executable) {
        await fs.copy(executable, outputPath);
      } else {
        throw new Error('Could not find Rust build output');
      }
    }

    await fs.chmod(outputPath, 0o755);

    return { success: true, output: outputPath, executable: outputPath };
  }

  async prepareNode(projectPath) {
    // Install npm dependencies if package.json exists
    const packageJson = await this.findFileRecursive(projectPath, 'package.json');
    if (packageJson) {
      console.log(chalk.blue('📦 Installing npm dependencies...'));
      await execAsync('npm install', { cwd: path.dirname(packageJson) });
    }

    // IMPROVED: Use the smart main file detection
    const mainFile = await this.findNodeMainFile(projectPath);
    return { 
      success: true, 
      output: mainFile, 
      executable: `node "${mainFile}"`,
      runtime: 'node'
    };
  }

  async findNodeMainFile(projectPath) {
    // First, check package.json for the main entry
    const packageJson = await this.findFileRecursive(projectPath, 'package.json');
    if (packageJson) {
      try {
        const pkg = await fs.readJson(packageJson);
        console.log(chalk.gray(`📦 Found package.json: ${pkg.name}`));
        
        if (pkg.main) {
          const mainFromPkg = path.join(path.dirname(packageJson), pkg.main);
          if (await fs.pathExists(mainFromPkg)) {
            console.log(chalk.green(`📦 Using main from package.json: ${pkg.main}`));
            return mainFromPkg;
          }
        }
        
        // Check for common script patterns
        if (pkg.scripts) {
          const startScript = pkg.scripts.start || pkg.scripts.dev;
          if (startScript) {
            console.log(chalk.gray(`📦 Start script: ${startScript}`));
            // Extract the main file from the start script
            const match = startScript.match(/node\s+([^\s]+)/);
            if (match && match[1]) {
              const mainFromScript = path.join(path.dirname(packageJson), match[1]);
              if (await fs.pathExists(mainFromScript)) {
                console.log(chalk.green(`📦 Using main from start script: ${match[1]}`));
                return mainFromScript;
              }
            }
          }
        }
      } catch (error) {
        console.log(chalk.yellow('⚠️  Could not read package.json, falling back to file search'));
      }
    }

    // Fallback: look for common server/main files in root directory FIRST
    const priorityFiles = [
      'app.js', 'server.js', 'index.js', 'main.js',
      'src/app.js', 'src/server.js', 'src/index.js', 'src/main.js',
      'lib/app.js', 'lib/server.js', 'lib/index.js', 'lib/main.js'
    ];

    for (const file of priorityFiles) {
      const fullPath = path.join(projectPath, file);
      if (await fs.pathExists(fullPath)) {
        console.log(chalk.green(`📦 Found main file: ${file}`));
        return fullPath;
      }
    }

    // Last resort: find any .js file that looks like a main file
    const allJsFiles = await this.findFilesRecursive(projectPath, ['.js', '.mjs', '.cjs']);
    
    if (allJsFiles.length === 0) {
      throw new Error('No JavaScript files found in project directory');
    }

    // Filter out client-side files in public/ or static/ directories
    const serverFiles = allJsFiles.filter(file => {
      const relativePath = path.relative(projectPath, file).toLowerCase();
      return !relativePath.includes('public/') && 
             !relativePath.includes('static/') &&
             !relativePath.includes('assets/') &&
             !relativePath.includes('css/') &&
             !relativePath.includes('js/') &&
             !file.includes('node_modules');
    });

    if (serverFiles.length > 0) {
      // Look for files that import express or other server frameworks
      for (const file of serverFiles) {
        try {
          const content = await fs.readFile(file, 'utf8');
          if (content.includes('require(') || content.includes('import')) {
            const serverIndicators = [
              'express', 'http.createServer', 'app.listen', 'server.listen',
              'koa', 'fastify', 'hapi', 'sails', 'meteor', 'listen(3000)',
              'listen(port)', 'createServer'
            ];
            if (serverIndicators.some(indicator => content.includes(indicator))) {
              console.log(chalk.green(`📦 Detected server file: ${path.relative(projectPath, file)}`));
              return file;
            }
          }
        } catch (error) {
          // Skip files we can't read
        }
      }

      // If no server indicators found, return the first server file
      const firstServerFile = serverFiles[0];
      console.log(chalk.green(`📦 Using first server file: ${path.relative(projectPath, firstServerFile)}`));
      return firstServerFile;
    }

    // Final fallback: any .js file in root directory
    const rootJsFiles = allJsFiles.filter(file => path.dirname(file) === projectPath);
    if (rootJsFiles.length > 0) {
      console.log(chalk.yellow('⚠️  Could not identify main server file, using first root .js file'));
      return rootJsFiles[0];
    }

    // Absolute last resort: first .js file
    console.log(chalk.yellow('⚠️  Using first .js file found'));
    return allJsFiles[0];
  }

  async preparePython(projectPath) {
    // Install pip dependencies if requirements.txt exists
    const requirementsFile = await this.findFileRecursive(projectPath, 'requirements.txt');
    if (requirementsFile) {
      console.log(chalk.blue('📦 Installing Python dependencies...'));
      await execAsync('pip3 install -r requirements.txt', { cwd: path.dirname(requirementsFile) });
    }

    const mainFile = await this.findMainFile(projectPath, '.py');
    return { 
      success: true, 
      output: mainFile, 
      executable: `python3 "${mainFile}"`,
      runtime: 'python3'
    };
  }

  async prepareWeb(projectPath) {
    // Find the main HTML file
    const htmlFiles = await this.findFilesRecursive(projectPath, ['.html']);
    const mainHtml = htmlFiles.find(file => 
      path.basename(file).toLowerCase().includes('index') ||
      path.basename(file).toLowerCase().includes('main')
    ) || htmlFiles[0];

    if (!mainHtml) {
      throw new Error('No HTML files found in web project');
    }

    console.log(chalk.blue('🌐 Web project detected'));
    console.log(chalk.gray(`   Main file: ${path.relative(projectPath, mainHtml)}`));
    
    return { 
      success: true, 
      output: mainHtml, 
      executable: `open "${mainHtml}"`,
      runtime: 'browser'
    };
  }

  async prepareReact(projectPath) {
    // Install npm dependencies if package.json exists
    const packageJson = await this.findFileRecursive(projectPath, 'package.json');
    if (packageJson) {
      console.log(chalk.blue('📦 Installing React dependencies...'));
      await execAsync('npm install', { cwd: path.dirname(packageJson) });
    }

    console.log(chalk.blue('⚛️  React project prepared'));
    console.log(chalk.gray('   Run with: npm run dev'));
    
    return { 
      success: true, 
      output: projectPath,
      executable: 'npm run dev',
      runtime: 'npm'
    };
  }

  async prepareDocker(projectPath) {
    const dockerfile = await this.findFileRecursive(projectPath, 'Dockerfile');
    if (!dockerfile) {
      throw new Error('No Dockerfile found');
    }

    console.log(chalk.blue('🐳 Docker project detected'));
    console.log(chalk.gray('   Build with: docker build -t myapp .'));
    console.log(chalk.gray('   Run with: docker run -p 3000:3000 myapp'));
    
    return { 
      success: true, 
      output: projectPath,
      executable: 'docker build -t myapp . && docker run -p 3000:3000 myapp',
      runtime: 'docker'
    };
  }

  async findMainFile(projectPath, extension) {
    const files = await this.findFilesRecursive(projectPath, [extension]);
    
    if (files.length === 0) {
      throw new Error(`No ${extension} files found`);
    }
    
    // Look for common main file names (prioritized)
    const priorityNames = ['main', 'index', 'app', 'server'];
    
    for (const name of priorityNames) {
      const mainFile = files.find(file => {
        const baseName = path.basename(file).toLowerCase();
        return baseName.includes(name);
      });
      if (mainFile) return mainFile;
    }

    // Return first file if no main file found
    return files[0];
  }

  getOutputName(language, projectPath) {
    const baseName = path.basename(projectPath) === '.' ? 'app' : path.basename(projectPath);
    
    const extensions = {
      'c': '',
      'cpp': '',
      'go': '',
      'rust': '-rust',
      'nodejs': '.js',
      'python': '.py',
      'web': '.html',
      'react': '-react',
      'docker': '-docker'
    };

    return `${baseName}${extensions[language]}`;
  }

  async offerToRun(result, language) {
    try {
      if (result.runtime === 'browser') {
        const { run } = await inquirer.prompt([{
          type: 'confirm',
          name: 'run',
          message: 'Open in web browser?',
          default: true
        }]);

        if (run) {
          console.log(chalk.blue('\n🌐 Opening in browser...\n'));
          
          const { exec } = await import('child_process');
          const platform = process.platform;
          
          let command;
          if (platform === 'win32') {
            command = `start "" "${result.output}"`;
          } else if (platform === 'darwin') {
            command = `open "${result.output}"`;
          } else {
            command = `xdg-open "${result.output}"`;
          }
          
          exec(command, (error) => {
            if (error) {
              console.log(chalk.yellow('Could not open browser automatically.'));
              console.log(chalk.blue(`Please open manually: ${result.output}`));
            }
          });
        }
      } else if (result.runtime === 'npm') {
        const { run } = await inquirer.prompt([{
          type: 'confirm',
          name: 'run',
          message: 'Start development server?',
          default: true
        }]);

        if (run) {
          console.log(chalk.blue('\n🚀 Starting development server...\n'));
          console.log(chalk.gray(`$ ${result.executable}`));
          
          const child = spawn(result.executable.split(' ')[0], result.executable.split(' ').slice(1), {
            stdio: 'inherit',
            shell: true,
            cwd: path.dirname(result.output)
          });

          child.on('close', (code) => {
            console.log(chalk.blue(`\nDevelopment server exited with code: ${code}`));
          });
        }
      } else if (result.runtime === 'docker') {
        const { run } = await inquirer.prompt([{
          type: 'confirm',
          name: 'run',
          message: 'Build and run with Docker?',
          default: false
        }]);

        if (run) {
          console.log(chalk.blue('\n🐳 Building and running with Docker...\n'));
          console.log(chalk.gray(`$ ${result.executable}`));
          
          // Split the compound command and run sequentially
          const commands = result.executable.split(' && ');
          for (const cmd of commands) {
            const [dockerCmd, ...args] = cmd.trim().split(' ');
            const child = spawn(dockerCmd, args, {
              stdio: 'inherit',
              shell: false,
              cwd: path.dirname(result.output)
            });

            await new Promise((resolve) => {
              child.on('close', (code) => {
                if (code !== 0) {
                  console.log(chalk.red(`Docker command failed with code: ${code}`));
                }
                resolve();
              });
            });
          }
        }
      } else if (result.runtime) {
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
        const { run } = await inquirer.prompt([{
          type: 'confirm',
          name: 'run',
          message: 'Run the compiled program?',
          default: true
        }]);

        if (run) {
          console.log(chalk.blue('\n🚀 Running program...\n'));
          
          if (!await fs.pathExists(result.executable)) {
            throw new Error(`Executable not found: ${result.executable}`);
          }

          const relativePath = path.relative(process.cwd(), result.executable);
          console.log(chalk.gray(`$ ./${relativePath}`));
          
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

  async clean(projectPath = '.') {
    const absolutePath = path.resolve(projectPath);
    const buildDir = path.join(absolutePath, this.buildDir);
    
    if (await fs.pathExists(buildDir)) {
      await fs.remove(buildDir);
      console.log(chalk.green(`🧹 Build directory cleaned: ${buildDir}`));
    } else {
      console.log(chalk.yellow(`📁 Build directory does not exist: ${buildDir}`));
    }

    // Also clean common build directories for other languages
    const commonBuildDirs = ['target', 'dist', 'node_modules', '__pycache__', '.pytest_cache'];
    for (const dir of commonBuildDirs) {
      const dirPath = path.join(absolutePath, dir);
      if (await fs.pathExists(dirPath)) {
        await fs.remove(dirPath);
        console.log(chalk.green(`🧹 Cleaned: ${dir}`));
      }
    }

    // Clean Makefile builds
    const makefile = await this.findFileRecursive(absolutePath, 'Makefile') || 
                    await this.findFileRecursive(absolutePath, 'makefile');
    if (makefile) {
      try {
        await execAsync('make clean', { cwd: path.dirname(makefile) });
        console.log(chalk.green('🧹 Make clean completed'));
      } catch {
        // Ignore if make clean fails
      }
    }
  }

  async showSystemInfo() {
    console.log(chalk.blue.bold('\n💻 System Compiler Information\n'));
    
    try {
      const [osInfo, gccVersion, goVersion, nodeVersion, pythonVersion, rustVersion, dockerVersion] = await Promise.all([
        execAsync('lsb_release -d').catch(() => ({ stdout: 'Unknown' })),
        execAsync('gcc --version | head -n1').catch(() => ({ stdout: 'Not installed' })),
        execAsync('go version 2>/dev/null').catch(() => ({ stdout: 'Not installed' })),
        execAsync('node --version 2>/dev/null').catch(() => ({ stdout: 'Not installed' })),
        execAsync('python3 --version 2>/dev/null').catch(() => ({ stdout: 'Not installed' })),
        execAsync('cargo --version 2>/dev/null').catch(() => ({ stdout: 'Not installed' })),
        execAsync('docker --version 2>/dev/null').catch(() => ({ stdout: 'Not installed' }))
      ]);

      console.log(`OS: ${osInfo.stdout.toString().trim().replace('Description:\t', '')}`);
      console.log(`GCC: ${gccVersion.stdout.toString().trim()}`);
      console.log(`Go: ${goVersion.stdout.toString().trim()}`);
      console.log(`Node.js: ${nodeVersion.stdout.toString().trim()}`);
      console.log(`Python: ${pythonVersion.stdout.toString().trim()}`);
      console.log(`Rust: ${rustVersion.stdout.toString().trim()}`);
      console.log(`Docker: ${dockerVersion.stdout.toString().trim()}`);
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
      await compiler.clean(projectPath);
      break;
    case 'info':
      await compiler.showSystemInfo();
      break;
    default:
      console.log('Usage: node compiler-debian.js [build|clean|info] [project-path]');
  }
}
