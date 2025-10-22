#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/goofyshell/godev.git"
INSTALL_DIR="$HOME/.godev"
BIN_DIR="$HOME/.local/bin"
VERSION="1.0.0"

# Print colored output
print_status() {
    echo -e "${BLUE}[GoDev]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
check_dependencies() {
    local missing_deps=()
    
    if ! command_exists node; then
        missing_deps+=("nodejs")
    fi
    
    if ! command_exists npm; then
        missing_deps+=("npm")
    fi
    
    if ! command_exists git; then
        missing_deps+=("git")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_warning "Missing dependencies: ${missing_deps[*]}"
        
        read -p "Do you want to install missing dependencies? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_dependencies "${missing_deps[@]}"
        else
            print_error "Please install missing dependencies manually and run the installer again."
            exit 1
        fi
    fi
}

# Install dependencies
install_dependencies() {
    local deps=("$@")
    
    if command_exists apt; then
        print_status "Installing dependencies using apt..."
        sudo apt update
        sudo apt install -y "${deps[@]}"
    elif command_exists yum; then
        print_status "Installing dependencies using yum..."
        sudo yum install -y "${deps[@]}"
    elif command_exists dnf; then
        print_status "Installing dependencies using dnf..."
        sudo dnf install -y "${deps[@]}"
    elif command_exists pacman; then
        print_status "Installing dependencies using pacman..."
        sudo pacman -Sy --noconfirm "${deps[@]}"
    else
        print_error "Cannot detect package manager. Please install dependencies manually:"
        printf '%s\n' "${deps[@]}"
        exit 1
    fi
}

# Create bin directory if it doesn't exist
setup_bin_dir() {
    if [ ! -d "$BIN_DIR" ]; then
        print_status "Creating bin directory: $BIN_DIR"
        mkdir -p "$BIN_DIR"
        
        # Add to PATH if not already there
        if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
            print_status "Adding $BIN_DIR to PATH in ~/.bashrc and ~/.zshrc"
            echo "export PATH=\"\$PATH:$BIN_DIR\"" >> ~/.bashrc
            echo "export PATH=\"\$PATH:$BIN_DIR\"" >> ~/.zshrc
            print_warning "Please restart your terminal or run: source ~/.bashrc (or ~/.zshrc)"
        fi
    fi
}

# Clone or update repository
clone_repository() {
    if [ -d "$INSTALL_DIR" ]; then
        print_status "Updating existing installation..."
        cd "$INSTALL_DIR"
        git pull origin main
    else
        print_status "Cloning GoDev repository..."
        git clone "$REPO_URL" "$INSTALL_DIR"
        cd "$INSTALL_DIR"
    fi
}

# Install Node.js dependencies
install_node_deps() {
    print_status "Installing Node.js dependencies..."
    npm install
}

# Create symlinks
create_symlinks() {
    print_status "Creating symlinks..."
    
    # Make scripts executable
    chmod +x "$INSTALL_DIR/godev.js"
    chmod +x "$INSTALL_DIR/compiler-cli.js"
    chmod +x "$INSTALL_DIR/compiler-debian.js"
    
    # Create symlinks
    ln -sf "$INSTALL_DIR/godev.js" "$BIN_DIR/godev"
    ln -sf "$INSTALL_DIR/compiler-cli.js" "$BIN_DIR/godev-compile"
    
    print_success "Symlinks created"
}

# Verify installation
verify_installation() {
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
        print_error "Installation verification failed"
        exit 1
    fi
}

# Install function
install_godev() {
    print_status "Starting GoDev installation v$VERSION..."
    
    # Check dependencies
    check_dependencies
    
    # Setup bin directory
    setup_bin_dir
    
    # Clone repository
    clone_repository
    
    # Install Node.js dependencies
    install_node_deps
    
    # Create symlinks
    create_symlinks
    
    # Verify installation
    verify_installation
}

# Uninstall function
uninstall_godev() {
    print_status "Uninstalling GoDev..."
    
    # Remove symlinks
    if [ -f "$BIN_DIR/godev" ]; then
        rm "$BIN_DIR/godev"
        print_success "Removed godev symlink"
    fi
    
    if [ -f "$BIN_DIR/godev-compile" ]; then
        rm "$BIN_DIR/godev-compile"
        print_success "Removed godev-compile symlink"
    fi
    
    # Remove installation directory
    if [ -d "$INSTALL_DIR" ]; then
        rm -rf "$INSTALL_DIR"
        print_success "Removed GoDev files"
    fi
    
    print_success "GoDev uninstalled successfully!"
}

# Update function
update_godev() {
    if [ ! -d "$INSTALL_DIR" ]; then
        print_error "GoDev is not installed. Please install first."
        exit 1
    fi
    
    print_status "Updating GoDev..."
    
    cd "$INSTALL_DIR"
    git pull origin main
    npm install
    
    print_success "GoDev updated successfully!"
}

# Show help
show_help() {
    echo "GoDev Installer v$VERSION"
    echo
    echo "Usage: $0 [command]"
    echo
    echo "Commands:"
    echo "  install    - Install GoDev (default)"
    echo "  uninstall  - Remove GoDev"
    echo "  update     - Update GoDev to latest version"
    echo "  help       - Show this help message"
    echo
    echo "Examples:"
    echo "  $0 install"
    echo "  $0 uninstall"
    echo "  curl -fsSL https://raw.githubusercontent.com/goofyshell/godev/main/installer.sh | bash"
}

# Main script
main() {
    local command=${1:-install}
    
    case $command in
        install)
            install_godev
            ;;
        uninstall)
            uninstall_godev
            ;;
        update)
            update_godev
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
