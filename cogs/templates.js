import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

export class TemplatesCog {
  constructor(config) {
    this.config = config;
  }

  async generateTemplate(projectData, templateType) {
    const template = this.config.templates[templateType];
    const projectPath = path.join(process.cwd(), projectData.projectName);

    // Create project directory
    await fs.ensureDir(projectPath);
    console.log(chalk.green(`📁 Created project directory: ${projectPath}`));

    // Generate files based on template
    for (const file of template.files) {
      await this.generateFile(file, projectData, template, projectPath);
    }

    // Generate package.json for Node.js projects
    if (templateType === 'nodejs' || templateType === 'react') {
      await this.generatePackageJson(projectData, template, projectPath);
    }

    console.log(chalk.green('✅ Template generated successfully!'));
  }

  async generateFile(fileName, projectData, template, projectPath) {
    const filePath = path.join(projectPath, fileName);
    const dirName = path.dirname(filePath);
    
    await fs.ensureDir(dirName);

    let content = '';
    
    switch (fileName) {
      case 'package.json':
        content = await this.generatePackageJsonContent(projectData, template);
        break;
      case 'README.md':
        content = this.generateReadmeContent(projectData, template);
        break;
      case 'src/index.js':
        content = this.generateNodeIndex(projectData);
        break;
      case 'main.go':
        content = this.generateGoMain(projectData);
        break;
      case 'src/main.py':
        content = this.generatePythonMain(projectData);
        break;
      default:
        content = `# ${fileName}\nCreated with GoDev\n`;
    }

    await fs.writeFile(filePath, content);
    console.log(chalk.blue(`📄 Created: ${fileName}`));
  }

  generatePackageJsonContent(projectData, template) {
    return JSON.stringify({
      name: projectData.projectName,
      version: "1.0.0",
      description: projectData.description,
      main: "src/index.js",
      scripts: template.scripts || {},
      dependencies: template.dependencies?.reduce((acc, dep) => {
        acc[dep] = "latest";
        return acc;
      }, {}) || {},
      devDependencies: template.devDependencies?.reduce((acc, dep) => {
        acc[dep] = "latest";
        return acc;
      }, {}) || {},
      author: projectData.author || "Developer",
      license: "MIT"
    }, null, 2);
  }

  generateReadmeContent(projectData, template) {
    return `# ${projectData.projectName}

${projectData.description}

## Created with GoDev

## Getting Started

\`\`\`bash
cd ${projectData.projectName}
npm install
npm run dev
\`\`\`

## Template: ${template.name}
`;
  }

  generateNodeIndex(projectData) {
    return `const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Hello from ${projectData.projectName}!' });
});

app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
`;
  }

  generateGoMain(projectData) {
    return `package main

import "fmt"

func main() {
    fmt.Println("Welcome to ${projectData.projectName}!")
}
`;
  }

  generatePythonMain(projectData) {
    return `#!/usr/bin/env python3

def main():
    print("Welcome to ${projectData.projectName}!")

if __name__ == "__main__":
    main()
`;
  }
}