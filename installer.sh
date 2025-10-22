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
REPO_URL="https://github.com/shcoobertt/godev.git"
INSTALL_DIR="$HOME/.godev"
BIN_DIR="$HOME/.local/bin"
VERSION="1.0.0"

# UI Functions
print_banner() {
    echo -e "${PURPLE}"
    echo "   ██████   ██████  ██████  ███████ ██    ██"
    echo "  ██       ██    ██ ██   ██ ██      ██    ██"
    echo "  ██   ███ ██    ██ ██   ██ █████   ██    ██"
    echo "  ██    ██ ██    ██ ██   ██ ██       ██  ██"
    echo "   ██████   ██████  ██████  ███████   ████"
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

# Check if we're running in a pipe (curl | bash)
is_piped() {
    [ ! -t 0 ]
}

# Interactive menu - only show if we have a terminal
show_interactive_menu() {
    if is_piped; then
        echo -e "${YELLOW}Running in piped mode - defaulting to install...${NC}"
        echo
        install_godev
        return
    fi
    
    print_banner
    echo -e "${CYAN}GoDev Installer v$VERSION${NC}"
    echo
    echo -e "${YELLOW}What would you like to do?${NC}"
    echo
    echo -e "  ${GREEN}1${NC}  Install GoDev"
    echo -e "  ${GREEN}2${NC}  Update GoDev" 
    echo -e "  ${GREEN}3${NC}  Remove GoDev"
    echo
    echo -e "  ${YELLOW}0${NC}  Exit"
    echo
    
    while true; do
        read -p "Enter your choice [0-3]: " choice
        case $choice in
            1)
                install_godev
                break
                ;;
            2)
                update_godev
                break
                ;;
            3)
                uninstall_godev
                break
                ;;
            0)
                echo -e "${YELLOW}Exiting...${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}Invalid choice. Please enter 1, 2, 3, or 0.${NC}"
                ;;
        esac
    done
}

ensure_path() {
    print_step "Configuring PATH..."
    
    export PATH="$BIN_DIR:$PATH"
    
    local current_shell=$(basename "$SHELL")
    local config_file=""
    
    case $current_shell in
        "zsh") config_file="$HOME/.zshrc" ;;
        "bash") config_file="$HOME/.bashrc" ;;
        *) config_file="$HOME/.bashrc" ;;
    esac
    
    if [ -n "$config_file" ] && ! grep -q "\.local/bin" "$config_file" 2>/dev/null; then
        echo "export PATH=\"\$HOME/.local/bin:\$PATH\"" >> "$config_file"
        print_substep "Added to $config_file"
    else
        print_substep "PATH already configured in $config_file"
    fi
    
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
        
        # If piped, auto-install dependencies
        if is_piped; then
            echo "└─ Auto-installing dependencies..."
            install_dependencies "${missing_deps[@]}"
        else
            read -p "└─ Install automatically? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                install_dependencies "${missing_deps[@]}"
            else
                print_error "Please install manually: ${missing_deps[*]}"
                exit 1
            fi
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

# Install function
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

# Update function
update_godev() {
    print_banner
    print_step "Updating GoDev to latest version"
    print_divider
    
    if [ ! -d "$INSTALL_DIR" ]; then
        print_error "GoDev is not installed. Please install first."
        echo
        echo "Run: curl -fsSL https://raw.githubusercontent.com/goofyshell/godev/main/installer.sh | bash"
        exit 1
    fi
    
    print_step "Updating repository..."
    cd "$INSTALL_DIR"
    git pull origin main
    print_substep "Repository updated"
    print_divider
    
    print_step "Updating dependencies..."
    npm install --silent
    print_substep "Dependencies updated"
    print_divider
    
    print_success "GoDev updated successfully!"
    echo
    echo -e "${YELLOW}🔄 If commands don't work immediately:${NC}"
    echo -e "  ${GREEN}source ~/.zshrc${NC} or restart your terminal"
    echo
}

# Uninstall function
uninstall_godev() {
    print_banner
    print_step "Uninstalling GoDev"
    print_divider
    
    print_step "Removing commands..."
    rm -f "$BIN_DIR/godev" "$BIN_DIR/godev-compile"
    print_substep "Commands removed"
    print_divider
    
    print_step "Removing installation files..."
    if [ -d "$INSTALL_DIR" ]; then
        rm -rf "$INSTALL_DIR"
        print_substep "GoDev files removed"
    else
        print_substep "No installation files found"
    fi
    print_divider
    
    print_success "GoDev uninstalled successfully!"
    echo
    echo -e "${YELLOW}🗑️  All GoDev files have been removed${NC}"
    echo
}

# Main function
main() {
    local command=${1:-}
    
    case $command in
        install)
            install_godev
            ;;
        update)
            update_godev
            ;;
        uninstall)
            uninstall_godev
            ;;
        help|--help|-h)
            show_help
            ;;
        "")
            show_interactive_menu
            ;;
        *)
            print_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Show help
show_help() {
    print_banner
    echo -e "${CYAN}GoDev Installer v$VERSION${NC}"
    echo
    echo -e "${YELLOW}Usage:${NC}"
    echo "  curl -fsSL https://raw.githubusercontent.com/goofyshell/godev/main/installer.sh | bash"
    echo "  curl -fsSL ... | bash -s install    (default in pipe)"
    echo "  curl -fsSL ... | bash -s update"
    echo "  curl -fsSL ... | bash -s uninstall"
    echo
    echo -e "${YELLOW}Examples:${NC}"
    echo "  Install:   curl -fsSL ... | bash"
    echo "  Update:    curl -fsSL ... | bash -s update"
    echo "  Uninstall: curl -fsSL ... | bash -s uninstall"
    echo
}

# Run main function
main "$@"
