import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';

export class TemplatesCog {
  constructor() {
    this.customTemplatesDir = path.join(process.cwd(), '.godev-templates');
  }

  async generateTemplate(projectData, templateType) {
    // Remove the 'custom:' prefix if present
    const templateName = templateType.replace('custom:', '');
    const templatePath = path.join(this.customTemplatesDir, templateName);
    
    if (!await fs.pathExists(templatePath)) {
      throw new Error(`Template '${templateName}' not found in ${this.customTemplatesDir}`);
    }

    const projectPath = path.join(process.cwd(), projectData.projectName);
    await fs.ensureDir(projectPath);

    console.log(chalk.green(`📁 Using template: ${templateName}`));
    
    // Copy template files with variable substitution
    await this.copyTemplateWithVariables(templatePath, projectPath, projectData);
    
    console.log(chalk.green('✅ Project generated successfully!'));
  }

  async copyTemplateWithVariables(srcPath, destPath, projectData) {
    const files = await fs.readdir(srcPath);
    
    for (const file of files) {
      // Skip template configuration files
      if (file === 'template.json' || file === '.godev-template') {
        continue;
      }

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
    
    // Replace template variables
    content = this.replaceTemplateVariables(content, projectData);
    
    await fs.ensureDir(path.dirname(destFile));
    await fs.writeFile(destFile, content);
    console.log(chalk.blue(`📄 Created: ${path.relative(process.cwd(), destFile)}`));
  }

  replaceTemplateVariables(content, projectData) {
    const variables = {
      '{{PROJECT_NAME}}': projectData.projectName,
      '{{PROJECT_DESCRIPTION}}': projectData.description || '',
      '{{PROJECT_AUTHOR}}': projectData.author || 'Developer',
      '{{PROJECT_VERSION}}': '1.0.0',
      '{{YEAR}}': new Date().getFullYear().toString(),
      '{{DATE}}': new Date().toISOString().split('T')[0],
      '{{TIMESTAMP}}': new Date().toISOString(),
      '{{PROJECT_NAME_SNAKE}}': projectData.projectName.replace(/\s+/g, '_').toLowerCase(),
      '{{PROJECT_NAME_KEBAB}}': projectData.projectName.replace(/\s+/g, '-').toLowerCase(),
      '{{PROJECT_NAME_PASCAL}}': projectData.projectName.replace(/\s+/g, '')
                                                         .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
                                                           index === 0 ? word.toUpperCase() : word.toLowerCase())
                                                         .replace(/\s+/g, '')
    };

    let processedContent = content;
    for (const [variable, value] of Object.entries(variables)) {
      processedContent = processedContent.replace(new RegExp(variable, 'g'), value);
    }

    return processedContent;
  }

  // Template Management
  async createTemplate() {
    console.log(chalk.blue.bold('\n🎨 Create New Template\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'templateName',
        message: 'Template name:',
        validate: input => input ? true : 'Template name is required'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Template description:',
        default: 'A custom project template'
      },
      {
        type: 'list',
        name: 'language',
        message: 'Primary language/framework:',
        choices: [
          'nodejs', 'react', 'python', 'go', 'rust', 'c', 'cpp', 'html', 'other'
        ]
      }
    ]);

    const templatePath = path.join(this.customTemplatesDir, answers.templateName);
    
    if (await fs.pathExists(templatePath)) {
      const { overwrite } = await inquirer.prompt([{
        type: 'confirm',
        name: 'overwrite',
        message: `Template '${answers.templateName}' already exists. Overwrite?`,
        default: false
      }]);

      if (!overwrite) {
        console.log(chalk.yellow('Template creation cancelled.'));
        return;
      }
    }

    await fs.ensureDir(templatePath);

    // Create template configuration
    const templateConfig = {
      name: answers.templateName,
      description: answers.description,
      language: answers.language,
      version: '1.0.0',
      created: new Date().toISOString(),
      variables: [
        'PROJECT_NAME',
        'PROJECT_DESCRIPTION', 
        'PROJECT_AUTHOR',
        'YEAR',
        'DATE'
      ]
    };

    await fs.writeJson(path.join(templatePath, 'template.json'), templateConfig, { spaces: 2 });

    // Create basic template structure based on language
    await this.createLanguageTemplate(answers.language, templatePath);

    console.log(chalk.green(`\n✅ Template '${answers.templateName}' created!`));
    console.log(chalk.blue(`📁 Location: ${templatePath}`));
    console.log(chalk.yellow('\n💡 Template Variables:'));
    console.log('  {{PROJECT_NAME}}        - Project name');
    console.log('  {{PROJECT_DESCRIPTION}} - Project description');
    console.log('  {{PROJECT_AUTHOR}}      - Author name');
    console.log('  {{YEAR}}                - Current year');
    console.log('  {{DATE}}                - Current date');
    console.log('  {{PROJECT_NAME_SNAKE}}  - snake_case version');
    console.log('  {{PROJECT_NAME_KEBAB}}  - kebab-case version');
    console.log('  {{PROJECT_NAME_PASCAL}} - PascalCase version');
    console.log(chalk.cyan('\n🚀 Usage: godev create --template ' + answers.templateName));
  }

  async createLanguageTemplate(language, templatePath) {
    const templateCreators = {
      'nodejs': this.createNodeJSTemplate,
      'react': this.createReactTemplate,
      'python': this.createPythonTemplate,
      'go': this.createGoTemplate,
      'rust': this.createRustTemplate,
      'c': this.createCTemplate,
      'cpp': this.createCppTemplate,
      'html': this.createHtmlTemplate,
      'other': this.createBasicTemplate
    };

    if (templateCreators[language]) {
      await templateCreators[language].call(this, templatePath);
    } else {
      await this.createBasicTemplate(templatePath);
    }
  }

  async createNodeJSTemplate(templatePath) {
    const files = {
      'package.json': `{
  "name": "{{PROJECT_NAME_KEBAB}}",
  "version": "1.0.0",
  "description": "{{PROJECT_DESCRIPTION}}",
  "main": "src/index.js",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "node --test"
  },
  "keywords": [],
  "author": "{{PROJECT_AUTHOR}}",
  "license": "MIT"
}`,
      'src/index.js': `// {{PROJECT_NAME}}
// {{PROJECT_DESCRIPTION}}

import { createServer } from 'http';

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    message: 'Hello from {{PROJECT_NAME}}!',
    timestamp: new Date().toISOString()
  }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('🚀 {{PROJECT_NAME}} running on port', PORT);
});`,
      'README.md': `# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Getting Started

\\\`\\\`\\\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
\\\`\\\`\\\`

## Project Structure

\\\`\\\`\\\`
{{PROJECT_NAME}}/
├── src/
│   └── index.js
├── package.json
└── README.md
\\\`\\\`\\\`

Created by {{PROJECT_AUTHOR}} in {{YEAR}}
`
    };

    await this.createTemplateFiles(templatePath, files);
  }

  async createReactTemplate(templatePath) {
    const files = {
      'package.json': `{
  "name": "{{PROJECT_NAME_KEBAB}}",
  "version": "1.0.0", 
  "description": "{{PROJECT_DESCRIPTION}}",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
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
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <h1>{{PROJECT_NAME}}</h1>
      <p>{{PROJECT_DESCRIPTION}}</p>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          Count is {count}
        </button>
      </div>
    </div>
  )
}

export default App`
    };

    await this.createTemplateFiles(templatePath, files);
  }

  async createPythonTemplate(templatePath) {
    const files = {
      'requirements.txt': `# {{PROJECT_NAME}}
# Dependencies for {{PROJECT_DESCRIPTION}}

fastapi==0.104.1
uvicorn==0.24.0`,
      'src/main.py': `\"\"\"
{{PROJECT_NAME}}
{{PROJECT_DESCRIPTION}}

Author: {{PROJECT_AUTHOR}}
Created: {{YEAR}}
\"\"\"

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="{{PROJECT_NAME}}",
    description="{{PROJECT_DESCRIPTION}}",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Welcome to {{PROJECT_NAME}}!",
        "service": "{{PROJECT_NAME}}",
        "timestamp": "{{TIMESTAMP}}"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)`,
      'README.md': `# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Development

\\\`\\\`\\\`bash
# Install dependencies
pip install -r requirements.txt

# Run the application
python src/main.py
\\\`\\\`\\\`

The API will be available at http://localhost:8000

Created by {{PROJECT_AUTHOR}} • {{YEAR}}
`
    };

    await this.createTemplateFiles(templatePath, files);
  }

  async createBasicTemplate(templatePath) {
    const files = {
      'README.md': `# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Project Structure

This is a basic template. Add your own files and structure as needed.

## Template Variables

This template uses the following variables:
- {{PROJECT_NAME}} - {{PROJECT_NAME}}
- {{PROJECT_DESCRIPTION}} - {{PROJECT_DESCRIPTION}} 
- {{PROJECT_AUTHOR}} - {{PROJECT_AUTHOR}}
- {{YEAR}} - {{YEAR}}

Created with GoDev Templates
`,
      'src/main.txt': `Welcome to {{PROJECT_NAME}}!

This is a custom template. Edit the files in the template directory to customize this template for your needs.

Project: {{PROJECT_NAME}}
Description: {{PROJECT_DESCRIPTION}}
Author: {{PROJECT_AUTHOR}}
Year: {{YEAR}}
`
    };

    await this.createTemplateFiles(templatePath, files);
  }

  async createTemplateFiles(templatePath, files) {
    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = path.join(templatePath, filePath);
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, content);
    }
  }

  async listTemplates() {
    if (!await fs.pathExists(this.customTemplatesDir)) {
      return [];
    }

    const templates = await fs.readdir(this.customTemplatesDir);
    const templateList = [];

    for (const template of templates) {
      const templatePath = path.join(this.customTemplatesDir, template);
      const configPath = path.join(templatePath, 'template.json');
      
      let config = { name: template, description: 'No description' };
      if (await fs.pathExists(configPath)) {
        try {
          config = await fs.readJson(configPath);
        } catch (error) {
          config.description = 'Invalid config';
        }
      }

      templateList.push({
        name: template,
        description: config.description,
        language: config.language || 'unknown',
        created: config.created || 'unknown'
      });
    }

    return templateList;
  }

  async deleteTemplate() {
    const templates = await this.listTemplates();
    
    if (templates.length === 0) {
      console.log(chalk.yellow('No templates found.'));
      return;
    }

    const choices = templates.map(template => ({
      name: `${template.name} (${template.language}) - ${template.description}`,
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
      message: `Permanently delete '${templateToDelete}'?`,
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

  async editTemplate() {
    const templates = await this.listTemplates();
    
    if (templates.length === 0) {
      console.log(chalk.yellow('No templates to edit.'));
      return;
    }

    const choices = templates.map(template => ({
      name: `${template.name} (${template.language}) - ${template.description}`,
      value: template.name
    }));

    const { templateToEdit } = await inquirer.prompt([{
      type: 'list',
      name: 'templateToEdit',
      message: 'Select template to edit:',
      choices
    }]);

    const templatePath = path.join(this.customTemplatesDir, templateToEdit);
    console.log(chalk.green(`\n📁 Template location: ${templatePath}`));
    console.log(chalk.yellow('\n💡 Edit files directly in this directory.'));
    console.log(chalk.blue('   Use template variables in your files:'));
    console.log('   {{PROJECT_NAME}}, {{PROJECT_DESCRIPTION}}, {{PROJECT_AUTHOR}}, etc.');
  }

  getTemplatesDir() {
    return this.customTemplatesDir;
  }
}
