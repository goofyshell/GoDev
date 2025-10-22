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

    // Generate language-specific configuration files
    await this.generateLanguageConfig(projectData, templateType, projectPath);

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
      case 'src/App.jsx':
        content = this.generateReactApp(projectData);
        break;
      case 'main.go':
        content = this.generateGoMain(projectData);
        break;
      case 'src/main.py':
        content = this.generatePythonMain(projectData);
        break;
      case 'src/main.rs':
        content = this.generateRustMain(projectData);
        break;
      case 'src/main.c':
        content = this.generateCMain(projectData);
        break;
      case 'src/main.cpp':
        content = this.generateCppMain(projectData);
        break;
      case 'Dockerfile':
        content = this.generateDockerfile(projectData, template);
        break;
      case '.gitignore':
        content = this.generateGitignore(template);
        break;
      case '.env.example':
        content = this.generateEnvExample();
        break;
      case 'docker-compose.yml':
        content = this.generateDockerCompose(projectData);
        break;
      default:
        content = await this.generateDefaultFile(fileName, projectData, template);
    }

    await fs.writeFile(filePath, content);
    console.log(chalk.blue(`📄 Created: ${fileName}`));
  }

  async generateLanguageConfig(projectData, templateType, projectPath) {
    switch (templateType) {
      case 'nodejs':
      case 'react':
        await this.generatePackageJson(projectData, this.config.templates[templateType], projectPath);
        break;
      case 'python':
        await this.generatePythonConfig(projectData, projectPath);
        break;
      case 'go':
        await this.generateGoConfig(projectData, projectPath);
        break;
      case 'rust':
        await this.generateRustConfig(projectData, projectPath);
        break;
      case 'c':
        await this.generateCConfig(projectData, projectPath);
        break;
      case 'cpp':
        await this.generateCppConfig(projectData, projectPath);
        break;
    }
  }

  // Node.js/React Package.json
  async generatePackageJson(projectData, template, projectPath) {
    const content = this.generatePackageJsonContent(projectData, template);
    await fs.writeFile(path.join(projectPath, 'package.json'), content);
  }

  generatePackageJsonContent(projectData, template) {
    return JSON.stringify({
      name: projectData.projectName,
      version: "1.0.0",
      description: projectData.description,
      main: template.type === 'react' ? "src/main.jsx" : "src/index.js",
      type: "module",
      scripts: template.scripts || {},
      dependencies: template.dependencies?.reduce((acc, dep) => {
        acc[dep] = "latest";
        return acc;
      }, {}) || {},
      devDependencies: template.devDependencies?.reduce((acc, dep) => {
        acc[dep] = "latest";
        return acc;
      }, {}) || {},
      keywords: template.keywords || [],
      author: projectData.author || "Developer",
      license: "MIT"
    }, null, 2);
  }

  // Python Configuration
  async generatePythonConfig(projectData, projectPath) {
    const requirementsContent = this.generateRequirements(projectData);
    await fs.writeFile(path.join(projectPath, 'requirements.txt'), requirementsContent);
    
    const pyprojectContent = this.generatePyproject(projectData);
    await fs.writeFile(path.join(projectPath, 'pyproject.toml'), pyprojectContent);
  }

  generateRequirements(projectData) {
    return `# ${projectData.projectName} Dependencies
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0
python-multipart==0.0.6
`;
  }

  generatePyproject(projectData) {
    return `[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"

[project]
name = "${projectData.projectName.replace(/\s+/g, '-').toLowerCase()}"
version = "1.0.0"
description = "${projectData.description}"
authors = [
    { name = "${projectData.author || "Developer"}" },
]
dependencies = [
    "fastapi>=0.104.1",
    "uvicorn>=0.24.0",
]
`;
  }

  // Go Configuration
  async generateGoConfig(projectData, projectPath) {
    const goModContent = this.generateGoMod(projectData);
    await fs.writeFile(path.join(projectPath, 'go.mod'), goModContent);
  }

  generateGoMod(projectData) {
    const moduleName = projectData.projectName.replace(/\s+/g, '-').toLowerCase();
    return `module ${moduleName}

go 1.21

require (
    github.com/gorilla/mux v1.8.0
    github.com/rs/cors v1.10.0
)
`;
  }

  // Rust Configuration
  async generateRustConfig(projectData, projectPath) {
    const cargoContent = this.generateCargoToml(projectData);
    await fs.writeFile(path.join(projectPath, 'Cargo.toml'), cargoContent);
  }

  generateCargoToml(projectData) {
    const packageName = projectData.projectName.replace(/\s+/g, '-').toLowerCase();
    return `[package]
name = "${packageName}"
version = "1.0.0"
edition = "2021"
description = "${projectData.description}"
authors = ["${projectData.author || "Developer"}"]

[dependencies]
actix-web = "4.0"
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1.0", features = ["full"] }
`;
  }

  // C Configuration
  async generateCConfig(projectData, projectPath) {
    const makefileContent = this.generateCMakefile(projectData);
    await fs.writeFile(path.join(projectPath, 'Makefile'), makefileContent);
    
    const headerContent = this.generateCHeader(projectData);
    await fs.writeFile(path.join(projectPath, 'include', 'app.h'), headerContent);
  }

  generateCMakefile(projectData) {
    return `# ${projectData.projectName} Makefile
CC = gcc
CFLAGS = -Wall -Wextra -std=c99 -I./include
SRC = $(wildcard src/*.c)
OBJ = $(SRC:.c=.o)
TARGET = build/${projectData.projectName}

$(TARGET): $(OBJ)
\t@mkdir -p build
\t$(CC) -o $@ $^ -lm

%.o: %.c
\t$(CC) $(CFLAGS) -c $< -o $@

clean:
\trm -f $(OBJ) $(TARGET)

.PHONY: clean
`;
  }

  // C++ Configuration
  async generateCppConfig(projectData, projectPath) {
    const makefileContent = this.generateCppMakefile(projectData);
    await fs.writeFile(path.join(projectPath, 'Makefile'), makefileContent);
    
    const headerContent = this.generateCppHeader(projectData);
    await fs.writeFile(path.join(projectPath, 'include', 'App.hpp'), headerContent);
  }

  generateCppMakefile(projectData) {
    return `# ${projectData.projectName} Makefile
CXX = g++
CXXFLAGS = -Wall -Wextra -std=c++17 -I./include
SRC = $(wildcard src/*.cpp)
OBJ = $(SRC:.cpp=.o)
TARGET = build/${projectData.projectName}

$(TARGET): $(OBJ)
\t@mkdir -p build
\t$(CXX) -o $@ $^

%.o: %.cpp
\t$(CXX) $(CXXFLAGS) -c $< -o $@

clean:
\trm -f $(OBJ) $(TARGET)

.PHONY: clean
`;
  }

  // File Content Generators
  generateReadmeContent(projectData, template) {
    return `# ${projectData.projectName}

${projectData.description}

## Created with GoDev

## Getting Started

\`\`\`bash
cd ${projectData.projectName}
${this.getSetupCommands(template.type)}
\`\`\`

## Project Structure

\`\`\`
${projectData.projectName}/
├── src/           # Source files
├── include/       # Header files (C/C++)
├── build/         # Build output
└── README.md      # This file
\`\`\`

## Template: ${template.name}
`;
  }

  getSetupCommands(templateType) {
    const commands = {
      'nodejs': 'npm install && npm run dev',
      'react': 'npm install && npm run dev',
      'python': 'pip install -r requirements.txt && python src/main.py',
      'go': 'go run main.go',
      'rust': 'cargo run',
      'c': 'make && ./build/app',
      'cpp': 'make && ./build/app'
    };
    return commands[templateType] || 'npm install && npm run dev';
  }

  generateNodeIndex(projectData) {
    return `import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: 'Hello from ${projectData.projectName}!',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: '${projectData.projectName}' });
});

app.listen(PORT, () => {
  console.log('🚀 Server running on port', PORT);
});
`;
  }

  generateReactApp(projectData) {
    return `import React, { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to ${projectData.projectName}</h1>
        <p>Count: {count}</p>
        <button onClick={() => setCount(count + 1)}>
          Increment
        </button>
      </header>
    </div>
  );
}

export default App;
`;
  }

  generatePythonMain(projectData) {
    return `#!/usr/bin/env python3
"""
${projectData.projectName}
${projectData.description}
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="${projectData.projectName}")

# CORS middleware
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
        "message": "Hello from ${projectData.projectName}!",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
`;
  }

  generateGoMain(projectData) {
    return `package main

import (
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "time"
    
    "github.com/gorilla/mux"
    "github.com/rs/cors"
)

type HealthResponse struct {
    Status    string \`json:"status"\`
    Service   string \`json:"service"\`
    Timestamp string \`json:"timestamp"\`
}

func main() {
    r := mux.NewRouter()
    
    // CORS middleware
    handler := cors.New(cors.Options{
        AllowedOrigins: []string{"*"},
        AllowedMethods: []string{"GET", "POST", "PUT", "DELETE"},
    }).Handler(r)
    
    r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        json.NewEncoder(w).Encode(map[string]string{
            "message": "Hello from ${projectData.projectName}!",
        })
    })
    
    r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        json.NewEncoder(w).Encode(HealthResponse{
            Status:    "healthy",
            Service:   "${projectData.projectName}",
            Timestamp: time.Now().Format(time.RFC3339),
        })
    })
    
    fmt.Println("🚀 Server starting on :8080")
    log.Fatal(http.ListenAndServe(":8080", handler))
}
`;
  }

  generateRustMain(projectData) {
    return `use actix_web::{web, App, HttpServer, Responder};
use serde::Serialize;
use std::time::SystemTime;

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    service: String,
    timestamp: String,
}

async fn hello() -> impl Responder {
    web::Json(serde_json::json!({
        "message": "Hello from ${projectData.projectName}!"
    }))
}

async fn health() -> impl Responder {
    web::Json(HealthResponse {
        status: "healthy".to_string(),
        service: "${projectData.projectName}".to_string(),
        timestamp: SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap()
            .as_secs()
            .to_string(),
    })
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("🚀 Starting ${projectData.projectName} on :8080");
    
    HttpServer::new(|| {
        App::new()
            .route("/", web::get().to(hello))
            .route("/health", web::get().to(health))
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}
`;
  }

  generateCMain(projectData) {
    return `#include <stdio.h>
#include <stdlib.h>
#include "app.h"

int main(int argc, char** argv) {
    printf("🚀 Welcome to ${projectData.projectName}!\\n");
    
    // Example functionality
    int result = calculate_something(42);
    printf("Calculation result: %d\\n", result);
    
    return 0;
}

int calculate_something(int input) {
    return input * 2;
}
`;
  }

  generateCppMain(projectData) {
    return `#include <iostream>
#include <string>
#include "App.hpp"

int main(int argc, char** argv) {
    std::cout << "🚀 Welcome to ${projectData.projectName}!" << std::endl;
    
    App app;
    app.run();
    
    return 0;
}

void App::run() {
    std::cout << "App is running..." << std::endl;
    // Add your application logic here
}
`;
  }

  generateCHeader(projectData) {
    return `#ifndef ${projectData.projectName.replace(/\s+/g, '_').toUpperCase()}_H
#define ${projectData.projectName.replace(/\s+/g, '_').toUpperCase()}_H

int calculate_something(int input);

#endif
`;
  }

  generateCppHeader(projectData) {
    return `#ifndef ${projectData.projectName.replace(/\s+/g, '_').toUpperCase()}_HPP
#define ${projectData.projectName.replace(/\s+/g, '_').toUpperCase()}_HPP

class App {
public:
    void run();
};

#endif
`;
  }

  generateDockerfile(projectData, template) {
    const baseImages = {
      'nodejs': 'node:18-alpine',
      'react': 'node:18-alpine', 
      'python': 'python:3.11-alpine',
      'go': 'golang:1.21-alpine',
      'rust': 'rust:1.70-alpine',
      'c': 'gcc:latest',
      'cpp': 'gcc:latest'
    };

    return `FROM ${baseImages[template.type]}

WORKDIR /app

COPY . .

${this.getDockerCommands(template.type)}

EXPOSE 3000

CMD ${this.getDockerCmd(template.type)}
`;
  }

  getDockerCommands(templateType) {
    const commands = {
      'nodejs': 'RUN npm install && npm run build',
      'react': 'RUN npm install && npm run build',
      'python': 'RUN pip install -r requirements.txt',
      'go': 'RUN go build -o app .',
      'rust': 'RUN cargo build --release',
      'c': 'RUN make',
      'cpp': 'RUN make'
    };
    return commands[templateType] || 'RUN echo "No build steps"';
  }

  getDockerCmd(templateType) {
    const cmds = {
      'nodejs': '["npm", "start"]',
      'react': '["npm", "start"]',
      'python': '["python", "src/main.py"]',
      'go': '["/app/app"]',
      'rust': '["/app/target/release/app"]',
      'c': '["/app/build/app"]',
      'cpp': '["/app/build/app"]'
    };
    return cmds[templateType] || '["echo", "No command specified"]';
  }

  generateGitignore(template) {
    return `# Dependencies
node_modules/
vendor/
target/
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
env/
pip-log.txt
pip-delete-this-directory.txt

# Build outputs
build/
dist/
*.egg-info/
*.so
*.dll

# Environment variables
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
`;
  }

  generateEnvExample() {
    return `# Environment Variables Example
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-here
PORT=3000
NODE_ENV=development
`;
  }

  generateDockerCompose(projectData) {
    return `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app
      - /app/node_modules

  # Uncomment to add database
  # postgres:
  #   image: postgres:15
  #   environment:
  #     POSTGRES_DB: ${projectData.projectName}
  #     POSTGRES_USER: user
  #     POSTGRES_PASSWORD: password
  #   ports:
  #     - "5432:5432"

  # redis:
  #   image: redis:7-alpine
  #   ports:
  #     - "6379:6379"
`;
  }

  async generateDefaultFile(fileName, projectData, template) {
    // For unknown file types, create a basic template
    const ext = path.extname(fileName).toLowerCase();
    
    const templates = {
      '.js': `// ${projectData.projectName}\n// ${fileName}\n\nconsole.log('Hello from ${fileName}');`,
      '.py': `# ${projectData.projectName}\n# ${fileName}\n\nprint("Hello from ${fileName}")`,
      '.go': `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello from ${fileName}")\n}`,
      '.rs': `fn main() {\n    println!("Hello from {}!", "${fileName}");\n}`,
      '.c': `#include <stdio.h>\n\nint main() {\n    printf("Hello from ${fileName}\\n");\n    return 0;\n}`,
      '.cpp': `#include <iostream>\n\nint main() {\n    std::cout << "Hello from ${fileName}" << std::endl;\n    return 0;\n}`,
      '.html': `<!DOCTYPE html>\n<html>\n<head>\n    <title>${projectData.projectName}</title>\n</head>\n<body>\n    <h1>Welcome to ${projectData.projectName}</h1>\n</body>\n</html>`,
      '.css': `/* ${projectData.projectName} - ${fileName} */\nbody {\n    margin: 0;\n    font-family: Arial, sans-serif;\n}`,
      '.json': `{\n  "name": "${fileName}",\n  "description": "Generated by GoDev"\n}`
    };

    return templates[ext] || `# ${fileName}\n# Generated by GoDev for ${projectData.projectName}\n\n${projectData.description || 'Add your content here'}`;
  }
}
