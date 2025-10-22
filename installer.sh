#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
REPO_URL="https://github.com/goofyshell/godev.git"
INSTALL_DIR="$HOME/.godev"
BIN_DIR="$HOME/.local/bin"
VERSION="1.0.0"

# UI Functions
print_banner() {
    echo -e "${PURPLE}"
    echo "   ██████  ██████  ██████  ███████ ██    ██"
    echo "  ██      ██    ██ ██   ██ ██      ██    ██"
    echo "  ██      ██    ██ ██   ██ █████   ██    ██"
    echo "  ██      ██    ██ ██   ██ ██       ██  ██"
    echo "   ██████  ██████  ██████  ███████   ████"
    echo -e "${NC}"
    echo -e "${CYAN}           Universal Project Generator${NC}"
    echo -e "${YELLOW}    One command to rule all projects${NC}"
    echo
}

print_step() { echo -e "${BLUE}┌─${NC} $1"; }
print_substep() { echo -e "${BLUE}│  ${GREEN}✓${NC} $1"; }
print_warning() { echo -e "${BLUE}│  ${YELLOW}⚠${NC} $1"; }
print_error() { echo -e "${BLUE}│  ${RED}✗${NC} $1"; }
print_success() { echo -e "${BLUE}│  ${GREEN}✓${NC} $1"; }
print_end() { echo -e "${BLUE}└─${NC} $1"; }

print_divider() {
    echo -e "${BLUE}├─────────────────────────────────────────────${NC}"
}

command_exists() { command -v "$1" >/dev/null 2>&1; }

ensure_path() {
    print_step "Configuring PATH..."
    
    # Add to PATH for current session
    export PATH="$BIN_DIR:$PATH"
    
    # Detect current shell
    local current_shell=$(basename "$SHELL")
    local config_file=""
    
    case $current_shell in
        "zsh") config_file="$HOME/.zshrc" ;;
        "bash") config_file="$HOME/.bashrc" ;;
        *) config_file="$HOME/.bashrc" ;;
    esac
    
    # Add to config file if not already there
    if [ -n "$config_file" ] && ! grep -q "\.local/bin" "$config_file" 2>/dev/null; then
        echo "export PATH=\"\$HOME/.local/bin:\$PATH\"" >> "$config_file"
        print_substep "Added to $config_file"
    else
        print_substep "PATH already configured in $config_file"
    fi
    
    # Add to other common config files as backup
    for file in "$HOME/.bashrc" "$HOME/.zshrc" "$HOME/.profile"; do
        if [ -f "$file" ] && ! grep -q "\.local/bin" "$file" 2>/dev/null; then
            echo "export PATH=\"\$HOME/.local/bin:\$PATH\"" >> "$file"
        fi
    done
}

check_dependencies() {
    print_step "Checking dependencies..."
    
    local missing_deps=()
    
    if ! command_exists node; then missing_deps+=("nodejs"); fi
    if ! command_exists npm; then missing_deps+=("npm"); fi
    if ! command_exists git; then missing_deps+=("git"); fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_warning "Missing: ${missing_deps[*]}"
        read -p "└─ Install automatically? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_dependencies "${missing_deps[@]}"
        else
            print_error "Please install manually: ${missing_deps[*]}"
            exit 1
        fi
    else
        print_substep "All dependencies found"
    fi
}

install_dependencies() {
    local deps=("$@")
    print_step "Installing dependencies..."
    
    if command_exists apt; then
        print_substep "Using apt package manager"
        sudo apt update && sudo apt install -y "${deps[@]}"
    elif command_exists yum; then
        print_substep "Using yum package manager"
        sudo yum install -y "${deps[@]}"
    elif command_exists dnf; then
        print_substep "Using dnf package manager"
        sudo dnf install -y "${deps[@]}"
    elif command_exists pacman; then
        print_substep "Using pacman package manager"
        sudo pacman -Sy --noconfirm "${deps[@]}"
    else
        print_error "No package manager detected"
        exit 1
    fi
    
    print_substep "Dependencies installed"
}

clone_repository() {
    print_step "Setting up GoDev..."
    
    if [ -d "$INSTALL_DIR" ]; then
        print_substep "Updating existing installation"
        cd "$INSTALL_DIR"
        git pull origin main
    else
        print_substep "Cloning repository"
        git clone "$REPO_URL" "$INSTALL_DIR"
        cd "$INSTALL_DIR"
    fi
}

install_node_deps() {
    print_step "Installing Node.js dependencies..."
    npm install --silent
    print_substep "Dependencies installed"
}

create_symlinks() {
    print_step "Creating command symlinks..."
    
    mkdir -p "$BIN_DIR"
    chmod +x "$INSTALL_DIR/godev.js" "$INSTALL_DIR/compiler-cli.js" "$INSTALL_DIR/compiler-debian.js"
    
    ln -sf "$INSTALL_DIR/godev.js" "$BIN_DIR/godev"
    ln -sf "$INSTALL_DIR/compiler-cli.js" "$BIN_DIR/godev-compile"
    
    print_substep "Commands: godev, godev-compile"
}

verify_installation() {
    print_step "Verifying installation..."
    
    # Small delay for PATH to update
    sleep 1
    
    if command_exists godev && command_exists godev-compile; then
        print_substep "All commands available"
        return 0
    else
        print_warning "Commands not found in current session"
        return 1
    fi
}

show_success() {
    echo
    echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║             INSTALLATION COMPLETE!           ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
    echo
    echo -e "${CYAN}🚀 GoDev is now installed!${NC}"
    echo
    echo -e "${YELLOW}📋 Available Commands:${NC}"
    echo -e "  ${GREEN}godev create${NC}      - Create a new project"
    echo -e "  ${GREEN}godev templates${NC}   - List available templates"
    echo -e "  ${GREEN}godev-compile build${NC} - Compile any project"
    echo
    echo -e "${YELLOW}🔄 Next Steps:${NC}"
    echo -e "  ${CYAN}Restart your terminal${NC} or run:"
    echo -e "  ${GREEN}source ~/.zshrc${NC}"
    echo
    echo -e "${YELLOW}🎯 Quick Test:${NC}"
    echo -e "  ${GREEN}godev --help${NC}"
    echo
}

show_restart_required() {
    echo
    echo -e "${YELLOW}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║           RESTART SHELL REQUIRED!           ║${NC}"
    echo -e "${YELLOW}╚══════════════════════════════════════════════╝${NC}"
    echo
    echo -e "${CYAN}📦 GoDev files are installed successfully!${NC}"
    echo
    echo -e "${YELLOW}🚨 Important:${NC}"
    echo -e "  ${RED}Restart your terminal${NC} for changes to take effect."
    echo
    echo -e "${YELLOW}🔧 After restart, test with:${NC}"
    echo -e "  ${GREEN}godev --help${NC}"
    echo
    echo -e "${YELLOW}💡 Or reload your current shell:${NC}"
    echo -e "  ${GREEN}source ~/.zshrc${NC}"
    echo
}

install_godev() {
    print_banner
    
    print_step "Starting GoDev installation v$VERSION"
    print_divider
    
    check_dependencies
    print_divider
    
    clone_repository
    print_divider
    
    install_node_deps
    print_divider
    
    create_symlinks
    print_divider
    
    ensure_path
    print_divider
    
    if verify_installation; then
        show_success
    else
        show_restart_required
    fi
}

# Main execution
install_godev
