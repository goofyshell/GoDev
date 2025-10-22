#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REPO_URL="https://github.com/goofyshell/godev.git"
INSTALL_DIR="$HOME/.godev"
BIN_DIR="$HOME/.local/bin"
VERSION="1.0.0"

print_status() { echo -e "${BLUE}[GoDev]${NC} $1"; }
print_success() { echo -e "${GREEN}✅${NC} $1"; }
print_error() { echo -e "${RED}❌${NC} $1"; }

command_exists() { command -v "$1" >/dev/null 2>&1; }

ensure_path() {
    # Add to PATH for current session
    export PATH="$BIN_DIR:$PATH"
    
    # Add to shell config files if not already there
    if ! grep -q "\.local/bin" ~/.bashrc; then
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
    fi
    if ! grep -q "\.local/bin" ~/.zshrc; then
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
    fi
}

install_godev() {
    print_status "Starting GoDev installation v$VERSION..."
    
    # Ensure bin directory exists
    mkdir -p "$BIN_DIR"
    
    # Clone/update repository
    if [ -d "$INSTALL_DIR" ]; then
        print_status "Updating existing installation..."
        cd "$INSTALL_DIR"
        git pull origin main
    else
        print_status "Cloning GoDev repository..."
        git clone "$REPO_URL" "$INSTALL_DIR"
        cd "$INSTALL_DIR"
    fi
    
    # Install dependencies
    print_status "Installing Node.js dependencies..."
    npm install
    
    # Create symlinks
    print_status "Creating symlinks..."
    chmod +x "$INSTALL_DIR/godev.js" "$INSTALL_DIR/compiler-cli.js" "$INSTALL_DIR/compiler-debian.js"
    ln -sf "$INSTALL_DIR/godev.js" "$BIN_DIR/godev"
    ln -sf "$INSTALL_DIR/compiler-cli.js" "$BIN_DIR/godev-compile"
    print_success "Symlinks created"
    
    # Ensure PATH is set
    ensure_path
    
    # Verify installation
    print_status "Verifying installation..."
    if command_exists godev && command_exists godev-compile; then
        print_success "GoDev installed successfully!"
        echo
        echo "Usage:"
        echo "  godev create      - Create a new project"
        echo "  godev templates   - List available templates"
        echo "  godev-compile build - Compile a project"
        echo
        print_success "Try: godev --help"
    else
        print_warning "Commands not found in current session."
        print_success "Installation completed! Please restart your terminal or run:"
        echo "  source ~/.bashrc"
        echo "Then try: godev --help"
    fi
}

install_godev
