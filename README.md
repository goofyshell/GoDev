

<h1>🚀 GoDev - Your Universal Project Generator</h1>
<p><strong>One command to rule all projects</strong> — create, compile, and manage projects in any language with a single tool.</p>

<p>
<a href="https://github.com/goofyshell/godev/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
<a href="https://github.com/goofyshell/godev/pulls"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome"></a>
<a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-18+-green.svg" alt="Node.js"></a>
</p>

<img src="https://github.com/goofyshell/GoDev/blob/d7dbe89b8e4a7b8da5458931597f6f09af071270/GoDev.png?raw=true" alt="GoDev Logo" style="width:300px;border-radius:10px;box-shadow:0 4px 8px rgba(0,0,0,0.1);">

<hr>

<h2>✨ What is GoDev?</h2>
<p>GoDev is a <strong>developer's Swiss Army knife</strong> that eliminates friction when starting new projects. One unified CLI handles project creation, compilation, and dependency management across all major languages.</p>

<hr>

<h2>🎯 Why Choose GoDev?</h2>
<h3>Before GoDev 😫</h3>
<pre><code>mkdir project &amp;&amp; cd project
npm init -y
git init
touch README.md .gitignore
npm install express cors helmet
# …and 10+ more steps
</code></pre>

<h3>With GoDev 🎉</h3>
<pre><code>godev create
# ✅ Project created
# ✅ Git initialized
# ✅ Dependencies installed
# ✅ Ready to code!
</code></pre>

<hr>

<h2>🚀 Quick Install</h2>
<p><strong>One-command installation (Linux/macOS):</strong></p>
<pre><code>curl -fsSL https://raw.githubusercontent.com/schoobertt/godev/main/installer.sh | bash</code></pre>

<p><strong>Manual installation:</strong></p>
<pre><code>git clone https://github.com/schoobertt/godev.git
cd godev
./installer.sh install</code></pre>

<hr>

<h2>⚡ See It In Action</h2>
<pre><code>godev create
? Project name: my-awesome-api
? Template: Node.js - Express API
? Description: REST API for my project
? Initialize Git? Yes
? Install dependencies? Yes

🎉 Project created successfully!
📁 Created: /home/user/my-awesome-api
📦 Installed 15 dependencies
🔧 Git repository initialized

cd my-awesome-api
godev-compile build
🔍 Detected: Node.js project
📦 Checking dependencies... ✅
🚀 Starting development server...
Server running on http://localhost:3000
</code></pre>

<hr>

<h2>🛠 Supported Languages</h2>
<table>
<tr><th>Language</th><th>Templates</th><th>Compilation</th><th>Dependencies</th></tr>
<tr><td>Node.js</td><td>Express, React, CLI</td><td>Auto ✅</td><td>npm/yarn</td></tr>
<tr><td>Python</td><td>Flask, Script, Data Science</td><td>Auto ✅</td><td>pip</td></tr>
<tr><td>Go</td><td>CLI, API, Library</td><td>Auto ✅</td><td>go mod</td></tr>
<tr><td>Rust</td><td>Binary, Library</td><td>Auto ✅</td><td>cargo</td></tr>
<tr><td>C/C++</td><td>Application, Library</td><td>Auto ✅</td><td>system libs</td></tr>
<tr><td>Java</td><td>Spring Boot</td><td>Soon 🔄</td><td>maven/gradle</td></tr>
</table>

<hr>

<h2>💡 Who Needs GoDev?</h2>
<ul>
<li><strong>Students &amp; Learners</strong> — Learn multiple languages without memorizing setups.</li>
<li><strong>Hackathon Warriors</strong> — Zero to running code in seconds.</li>
<li><strong>Multi-Language Teams</strong> — Consistent workflow across all projects.</li>
<li><strong>Open Source Contributors</strong> — Jump between projects seamlessly.</li>
</ul>

<hr>

<h2>📖 How to Use</h2>
<ol>
<li>Create Projects:<pre><code>godev create</code></pre></li>
<li>Compile Projects:<pre><code>godev-compile build</code></pre></li>
<li>Advanced Commands:<pre><code>godev templates           # List all templates
godev-compile clean       # Clean build files
godev-compile info        # Compiler info
godev-compile build -p ./path  # Build specific directory</code></pre></li>
</ol>

<hr>

<h2>🎨 Example Workflows</h2>
<h3>Python Data Science Project</h3>
<pre><code>godev create
? Project name: data-analysis
? Template: Python - Data Science
? Description: COVID-19 data analysis

✅ Created project structure
📦 Installed pandas, numpy, matplotlib
🎉 Ready! cd data-analysis &amp;&amp; python main.py
</code></pre>

<h3>C Network Application</h3>
<pre><code>godev create
? Project name: network-tool
? Template: C - Network Application

cd network-tool
godev-compile build
🔨 Detected: C project
📦 Checking gcc... ✅
🔨 Compiling: gcc src/*.c -o build/network-tool
✅ Built: build/network-tool
🚀 Run it? Yes
Starting server on port 8080...</code></pre>

<hr>

<h2>🏗 Architecture</h2>
<pre><code>GoDev Core/
├── godev.js              # Main CLI
├── compiler-debian.js    # Multi-language compiler
├── config/               # Templates & settings
├── cogs/                 # Modular components
└── templates/            # Project templates</code></pre>

<hr>

<h2>🤝 Contributing</h2>
<p>We love contributors! Help by:</p>
<ul>
<li>Adding new language templates</li>
<li>Improving compilation logic</li>
<li>Creating IDE integrations</li>
<li>Enhancing documentation</li>
</ul>
<p>See the Contributing Guide for details.</p>

<hr>

<h2>🐛 Troubleshooting</h2>
<ul>
<li>Command not found after install?<pre><code>export PATH="$HOME/.local/bin:$PATH"</code></pre></li>
<li>Permission issues?<pre><code>chmod +x godev*.js</code></pre></li>
<li>Missing Node.js?<pre><code>curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs</code></pre></li>
</ul>

<hr>

<h2>❓ FAQ</h2>
<ul>
<li>How is this different from create-react-app / cargo init?  <br>GoDev is language-agnostic. One tool for Node.js, Python, Go, Rust, C/C++.</li>
<li>Can I use my existing projects?  <br>Yes! godev-compile build detects and builds existing projects.</li>
<li>Does it work on Windows?  <br>Currently optimized for Linux/macOS. Windows support planned for v2.0.</li>
<li>Can I create custom templates?  <br>Yes! Edit config/templates.json to add your own templates.</li>
</ul>

<hr>

<h2>📄 License</h2>
<p>MIT License — see LICENSE for details.</p>
<p>Stop configuring, start coding. ⭐ Star this repo if GoDev saves you time!</p>

</body>
</html>
