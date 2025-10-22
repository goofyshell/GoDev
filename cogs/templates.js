import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';

export class TemplatesCog {
  constructor() {
    this.customTemplatesDir = path.join(process.cwd(), '.godev-templates');
    this.preConfiguredTemplates = this.getPreConfiguredTemplates();
  }

  getPreConfiguredTemplates() {
    return {
      // Node.js Templates
      'node-express-api': {
        name: 'Node.js Express API',
        description: 'REST API with Express.js and middleware',
        language: 'nodejs',
        files: {
          'package.json': `{
  "name": "{{PROJECT_NAME_KEBAB}}",
  "version": "1.0.0",
  "description": "{{PROJECT_DESCRIPTION}}",
  "main": "src/server.js",
  "type": "module",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  },
  "author": "{{PROJECT_AUTHOR}}",
  "license": "MIT"
}`,
          'src/server.js': `import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to {{PROJECT_NAME}} API!',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log('🚀 Server running on port', PORT);
});`,
          'README.md': `# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Getting Started

\\\`\\\`\\\`bash
npm install
npm run dev
\\\`\\\`\\\`

Server will start on http://localhost:3000`
        }
      },

      'node-cli-tool': {
        name: 'Node.js CLI Tool',
        description: 'Command-line interface application',
        language: 'nodejs',
        files: {
          'package.json': `{
  "name": "{{PROJECT_NAME_KEBAB}}",
  "version": "1.0.0",
  "description": "{{PROJECT_DESCRIPTION}}",
  "main": "src/cli.js",
  "type": "module",
  "bin": {
    "{{PROJECT_NAME_KEBAB}}": "./src/cli.js"
  },
  "scripts": {
    "start": "node src/cli.js"
  },
  "author": "{{PROJECT_AUTHOR}}",
  "license": "MIT"
}`,
          'src/cli.js': `#!/usr/bin/env node

import { program } from 'commander';

program
  .name('{{PROJECT_NAME_KEBAB}}')
  .description('{{PROJECT_DESCRIPTION}}')
  .version('1.0.0');

program
  .command('hello')
  .description('Say hello')
  .action(() => {
    console.log('Hello from {{PROJECT_NAME}}!');
  });

program.parse();`,
          'README.md': `# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Installation

\\\`\\\`\\\`bash
npm link
\\\`\\\`\\\`

## Usage

\\\`\\\`\\\`bash
{{PROJECT_NAME_KEBAB}} hello
\\\`\\\`\\\``
        }
      },

      // React Templates
      'react-vite-app': {
        name: 'React Vite App',
        description: 'Modern React application with Vite',
        language: 'react',
        files: {
          'package.json': `{
  "name": "{{PROJECT_NAME_KEBAB}}",
  "version": "1.0.0",
  "type": "module",
  "description": "{{PROJECT_DESCRIPTION}}",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "vite": "^4.4.0",
    "@vitejs/plugin-react": "^4.0.0"
  },
  "author": "{{PROJECT_AUTHOR}}",
  "license": "MIT"
}`,
          'vite.config.js': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})`,
          'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{PROJECT_NAME}}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
          'src/main.jsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
          'src/App.jsx': `import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <h1>{{PROJECT_NAME}}</h1>
      <p>{{PROJECT_DESCRIPTION}}</p>
      <button onClick={() => setCount((count) => count + 1)}>
        Count: {count}
      </button>
    </div>
  )
}

export default App`,
          'src/index.css': `body {
  margin: 0;
  font-family: Arial, sans-serif;
  padding: 20px;
}`
        }
      },

      // Python Templates
      'python-fastapi': {
        name: 'Python FastAPI',
        description: 'Modern Python API with FastAPI',
        language: 'python',
        files: {
          'requirements.txt': `fastapi==0.104.1
uvicorn==0.24.0`,
          'main.py': `from fastapi import FastAPI
from datetime import datetime

app = FastAPI(title="{{PROJECT_NAME}}")

@app.get("/")
async def root():
    return {
        "message": "Welcome to {{PROJECT_NAME}}!",
        "timestamp": datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)`,
          'README.md': `# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Getting Started

\\\`\\\`\\\`bash
pip install -r requirements.txt
python main.py
\\\`\\\`\\\`

API will be available at http://localhost:8000`
        }
      },

      'python-cli': {
        name: 'Python CLI',
        description: 'Command-line tool with Click',
        language: 'python',
        files: {
          'requirements.txt': `click==8.1.0`,
          'cli.py': `#!/usr/bin/env python3
import click

@click.group()
def cli():
    """{{PROJECT_DESCRIPTION}}"""
    pass

@cli.command()
def hello():
    """Say hello"""
    click.echo('Hello from {{PROJECT_NAME}}!')

if __name__ == '__main__':
    cli()`,
          'README.md': `# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Installation

\\\`\\\`\\\`bash
pip install -r requirements.txt
\\\`\\\`\\\`

## Usage

\\\`\\\`\\\`bash
python cli.py hello
\\\`\\\`\\\``
        }
      },

      // Go Templates
      'go-cli': {
        name: 'Go CLI',
        description: 'Command-line application in Go',
        language: 'go',
        files: {
          'go.mod': `module {{PROJECT_NAME_KEBAB}}

go 1.21`,
          'main.go': `package main

import (
	"fmt"
	"os"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: {{PROJECT_NAME_KEBAB}} <command>")
		fmt.Println("Commands: hello")
		os.Exit(1)
	}

	switch os.Args[1] {
	case "hello":
		fmt.Println("Hello from {{PROJECT_NAME}}!")
	default:
		fmt.Printf("Unknown command: %s\\n", os.Args[1])
		os.Exit(1)
	}
}`,
          'README.md': `# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Build

\\\`\\\`\\\`bash
go build -o {{PROJECT_NAME_KEBAB}}
\\\`\\\`\\\`

## Usage

\\\`\\\`\\\`bash
./{{PROJECT_NAME_KEBAB}} hello
\\\`\\\`\\\``
        }
      },

      // Rust Templates
      'rust-cli': {
        name: 'Rust CLI',
        description: 'Command-line tool in Rust',
        language: 'rust',
        files: {
          'Cargo.toml': `[package]
name = "{{PROJECT_NAME_KEBAB}}"
version = "1.0.0"
edition = "2021"

[dependencies]
clap = { version = "4.0", features = ["derive"] }`,
          'src/main.rs': `use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "{{PROJECT_NAME_KEBAB}}")]
#[command(about = "{{PROJECT_DESCRIPTION}}")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Say hello
    Hello,
}

fn main() {
    let cli = Cli::parse();

    match cli.command {
        Commands::Hello => {
            println!("Hello from {}!", "{{PROJECT_NAME}}");
        }
    }
}`,
          'README.md': `# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Build

\\\`\\\`\\\`bash
cargo build --release
\\\`\\\`\\\`

## Usage

\\\`\\\`\\\`bash
./target/release/{{PROJECT_NAME_KEBAB}} hello
\\\`\\\`\\\``
        }
      },

      // C Templates
      'c-app': {
        name: 'C Application',
        description: 'Basic C application with Makefile',
        language: 'c',
        files: {
          'Makefile': `CC = gcc
CFLAGS = -Wall -Wextra
TARGET = {{PROJECT_NAME_KEBAB}}
SRC = src/main.c

$(TARGET): $(SRC)
\t@mkdir -p build
\t$(CC) $(CFLAGS) -o build/$(TARGET) $(SRC)

clean:
\trm -rf build

.PHONY: clean`,
          'src/main.c': `#include <stdio.h>

int main() {
    printf("Hello from {{PROJECT_NAME}}!\\n");
    return 0;
}`,
          'README.md': `# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Build

\\\`\\\`\\\`bash
make
\\\`\\\`\\\`

## Run

\\\`\\\`\\\`bash
./build/{{PROJECT_NAME_KEBAB}}
\\\`\\\`\\\``
        }
      },

      // C++ Templates
      'cpp-app': {
        name: 'C++ Application',
        description: 'Basic C++ application',
        language: 'cpp',
        files: {
          'Makefile': `CXX = g++
CXXFLAGS = -Wall -Wextra -std=c++17
TARGET = {{PROJECT_NAME_KEBAB}}
SRC = src/main.cpp

$(TARGET): $(SRC)
\t@mkdir -p build
\t$(CXX) $(CXXFLAGS) -o build/$(TARGET) $(SRC)

clean:
\trm -rf build

.PHONY: clean`,
          'src/main.cpp': `#include <iostream>

int main() {
    std::cout << "Hello from {{PROJECT_NAME}}!" << std::endl;
    return 0;
}`,
          'README.md': `# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Build

\\\`\\\`\\\`bash
make
\\\`\\\`\\\`

## Run

\\\`\\\`\\\`bash
./build/{{PROJECT_NAME_KEBAB}}
\\\`\\\`\\\``
        }
      },

      // Web Templates
      'html-website': {
        name: 'HTML Website',
        description: 'Static website with HTML, CSS, and JavaScript',
        language: 'html',
        files: {
          'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{PROJECT_NAME}}</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <h1>{{PROJECT_NAME}}</h1>
        <p>{{PROJECT_DESCRIPTION}}</p>
        <button id="clickBtn">Click Me!</button>
    </div>
    <script src="js/app.js"></script>
</body>
</html>`,
          'css/style.css': `body {
    margin: 0;
    font-family: Arial, sans-serif;
    background: #f5f5f5;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 20px;
    text-align: center;
}

h1 {
    color: #333;
}

button {
    background: #007bff;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
}`,
          'js/app.js': `document.getElementById('clickBtn').addEventListener('click', function() {
    alert('Hello from {{PROJECT_NAME}}!');
});`,
          'README.md': `# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Usage

Open \`index.html\` in your web browser.`
        }
      },

      // Docker Templates
      'docker-app': {
        name: 'Docker Application',
        description: 'Application with Docker configuration',
        language: 'docker',
        files: {
          'Dockerfile': `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]`,
          'docker-compose.yml': `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production`,
          'README.md': `# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Docker Commands

\\\`\\\`\\\`bash
docker-compose up --build
\\\`\\\`\\\``
        }
      }
    };
  }

  async generateTemplate(projectData, templateType) {
    // Check if it's a pre-configured template
    if (this.preConfiguredTemplates[templateType]) {
      return await this.generatePreConfiguredTemplate(projectData, templateType);
    }

    // Custom template logic
    const templateName = templateType.replace('custom:', '');
    const templatePath = path.join(this.customTemplatesDir, templateName);
    
    if (!await fs.pathExists(templatePath)) {
      throw new Error(`Template '${templateType}' not found`);
    }

    const projectPath = path.join(process.cwd(), projectData.projectName);
    await fs.ensureDir(projectPath);

    console.log(chalk.green(`📁 Using template: ${templateName}`));
    await this.copyTemplateWithVariables(templatePath, projectPath, projectData);
    console.log(chalk.green('✅ Project generated successfully!'));
  }

  async generatePreConfiguredTemplate(projectData, templateKey) {
    const template = this.preConfiguredTemplates[templateKey];
    const projectPath = path.join(process.cwd(), projectData.projectName);
    
    await fs.ensureDir(projectPath);
    
    console.log(chalk.green(`📁 Using template: ${template.name}`));
    console.log(chalk.blue(`📝 ${template.description}`));

    // Generate all files for the template
    for (const [filePath, content] of Object.entries(template.files)) {
      const fullPath = path.join(projectPath, filePath);
      await fs.ensureDir(path.dirname(fullPath));
      
      const processedContent = this.replaceTemplateVariables(content, projectData);
      await fs.writeFile(fullPath, processedContent);
      
      console.log(chalk.blue(`   📄 Created: ${filePath}`));
    }

    console.log(chalk.green('✅ Project generated successfully!'));
  }

  async copyTemplateWithVariables(srcPath, destPath, projectData) {
    const files = await fs.readdir(srcPath);
    
    for (const file of files) {
      if (file === 'template.json') continue;

      const srcFile = path.join(srcPath, file);
      const destFile = path.join(destPath, file);
      const stat = await fs.stat(srcFile);

      if (stat.isDirectory()) {
        await fs.ensureDir(destFile);
        await this.copyTemplateWithVariables(srcFile, destFile, projectData);
      } else {
        await this.processTemplateFile(srcFile, destFile, projectData);
      }
    }
  }

  async processTemplateFile(srcFile, destFile, projectData) {
    let content = await fs.readFile(srcFile, 'utf8');
    content = this.replaceTemplateVariables(content, projectData);
    
    await fs.ensureDir(path.dirname(destFile));
    await fs.writeFile(destFile, content);
    console.log(chalk.blue(`   📄 Created: ${path.relative(process.cwd(), destFile)}`));
  }

  replaceTemplateVariables(content, projectData) {
    const variables = {
      '{{PROJECT_NAME}}': projectData.projectName,
      '{{PROJECT_DESCRIPTION}}': projectData.description || '',
      '{{PROJECT_AUTHOR}}': projectData.author || 'Developer',
      '{{PROJECT_NAME_SNAKE}}': projectData.projectName.replace(/\s+/g, '_').toLowerCase(),
      '{{PROJECT_NAME_KEBAB}}': projectData.projectName.replace(/\s+/g, '-').toLowerCase(),
      '{{PROJECT_NAME_PASCAL}}': projectData.projectName.replace(/\s+/g, '')
                                                         .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
                                                           index === 0 ? word.toUpperCase() : word.toLowerCase())
                                                         .replace(/\s+/g, ''),
      '{{YEAR}}': new Date().getFullYear().toString()
    };

    let processedContent = content;
    for (const [variable, value] of Object.entries(variables)) {
      processedContent = processedContent.replace(new RegExp(variable, 'g'), value);
    }

    return processedContent;
  }

  async listTemplates() {
    const customTemplates = await this.getCustomTemplates();
    const preConfiguredTemplates = Object.entries(this.preConfiguredTemplates).map(([key, template]) => ({
      name: key,
      description: template.description,
      language: template.language,
      type: 'pre-configured'
    }));

    return [...preConfiguredTemplates, ...customTemplates];
  }

  async getCustomTemplates() {
    if (!await fs.pathExists(this.customTemplatesDir)) {
      return [];
    }

    const templates = await fs.readdir(this.customTemplatesDir);
    return templates.map(template => ({
      name: template,
      description: 'Custom template',
      language: 'custom',
      type: 'custom'
    }));
  }

  async createTemplate() {
    console.log(chalk.blue.bold('\n🎨 Create New Template\n'));

    const { templateName } = await inquirer.prompt([{
      type: 'input',
      name: 'templateName',
      message: 'Template name:',
      validate: input => input ? true : 'Template name is required'
    }]);

    const templatePath = path.join(this.customTemplatesDir, templateName);
    
    if (await fs.pathExists(templatePath)) {
      const { overwrite } = await inquirer.prompt([{
        type: 'confirm',
        name: 'overwrite',
        message: `Template '${templateName}' already exists. Overwrite?`,
        default: false
      }]);

      if (!overwrite) {
        console.log(chalk.yellow('Template creation cancelled.'));
        return;
      }
    }

    await fs.ensureDir(templatePath);

    // Create basic template structure
    const files = {
      'README.md': `# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Template

This is a custom GoDev template.`,
      'template.json': `{
  "name": "${templateName}",
  "description": "Custom template",
  "language": "custom",
  "created": "${new Date().toISOString()}"
}`
    };

    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = path.join(templatePath, filePath);
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, content);
      console.log(chalk.blue(`   📄 Created: ${filePath}`));
    }

    console.log(chalk.green(`\n✅ Template '${templateName}' created!`));
    console.log(chalk.blue(`📁 Location: ${templatePath}`));
    console.log(chalk.yellow('\n💡 Edit the files in the template directory to customize it.'));
  }

  async editTemplate() {
    const templates = await this.listTemplates();
    
    // Filter only custom templates (pre-configured can't be edited)
    const customTemplates = templates.filter(t => t.type === 'custom');
    
    if (customTemplates.length === 0) {
      console.log(chalk.yellow('No custom templates found.'));
      console.log(chalk.blue('\n💡 Create your first template: godev template create'));
      return;
    }

    const choices = customTemplates.map(template => ({
      name: `${template.name} - ${template.description}`,
      value: template.name
    }));

    const { templateToEdit } = await inquirer.prompt([{
      type: 'list',
      name: 'templateToEdit',
      message: 'Select template to edit:',
      choices
    }]);

    const templatePath = path.join(this.customTemplatesDir, templateToEdit);
    
    if (!await fs.pathExists(templatePath)) {
      console.log(chalk.red(`Template '${templateToEdit}' not found.`));
      return;
    }

    console.log(chalk.green(`\n📁 Editing template: ${templateToEdit}`));
    console.log(chalk.blue(`📁 Location: ${templatePath}`));
    
    // Show template structure
    const files = await this.getTemplateFiles(templatePath);
    console.log(chalk.yellow('\n📋 Template Structure:'));
    files.forEach(file => {
      console.log(chalk.gray(`  📄 ${file}`));
    });

    console.log(chalk.yellow('\n💡 Edit the files directly in the template directory.'));
    console.log(chalk.blue('   Use template variables like: {{PROJECT_NAME}}, {{PROJECT_DESCRIPTION}}, etc.'));
    
    // Offer to open in default editor
    const { openEditor } = await inquirer.prompt([{
      type: 'confirm',
      name: 'openEditor',
      message: 'Open template directory in default file manager?',
      default: true
    }]);

    if (openEditor) {
      try {
        const { exec } = await import('child_process');
        const platform = process.platform;
        
        let command;
        if (platform === 'win32') {
          command = `explorer "${templatePath}"`;
        } else if (platform === 'darwin') {
          command = `open "${templatePath}"`;
        } else {
          command = `xdg-open "${templatePath}"`;
        }
        
        exec(command, (error) => {
          if (error) {
            console.log(chalk.yellow('Could not open file manager automatically.'));
            console.log(chalk.blue('Please navigate to the directory manually.'));
          }
        });
      } catch (error) {
        console.log(chalk.yellow('Could not open file manager.'));
        console.log(chalk.blue('Please navigate to the directory manually.'));
      }
    }
  }

  async getTemplateFiles(templatePath) {
    const files = [];
    
    async function scanDirectory(currentPath, basePath = '') {
      const items = await fs.readdir(currentPath);
      
      for (const item of items) {
        if (item === 'template.json') continue;
        
        const fullPath = path.join(currentPath, item);
        const relativePath = path.join(basePath, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          files.push(`${relativePath}/`);
          await scanDirectory(fullPath, relativePath);
        } else {
          files.push(relativePath);
        }
      }
    }
    
    await scanDirectory(templatePath);
    return files.sort();
  }

  async deleteTemplate() {
    const templates = await this.listTemplates();
    
    // Filter only custom templates (pre-configured can't be deleted)
    const customTemplates = templates.filter(t => t.type === 'custom');
    
    if (customTemplates.length === 0) {
      console.log(chalk.yellow('No custom templates to delete.'));
      return;
    }

    const choices = customTemplates.map(template => ({
      name: `${template.name} - ${template.description}`,
      value: template.name
    }));

    const { templateToDelete } = await inquirer.prompt([{
      type: 'list',
      name: 'templateToDelete',
      message: 'Select template to delete:',
      choices
    }]);

    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: `Permanently delete template '${templateToDelete}'?`,
      default: false
    }]);

    if (confirm) {
      const templatePath = path.join(this.customTemplatesDir, templateToDelete);
      await fs.remove(templatePath);
      console.log(chalk.green(`✅ Template '${templateToDelete}' deleted.`));
    } else {
      console.log(chalk.yellow('Deletion cancelled.'));
    }
  }

  getTemplatesDir() {
    return this.customTemplatesDir;
  }
}
