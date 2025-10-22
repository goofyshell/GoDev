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
VERSION="1.0.0"

# Try multiple bin directories in order of preference
BIN_DIRS=(
    "/usr/local/bin"    # Standard system-wide
    "$HOME/.local/bin"  # User local
    "$HOME/bin"         # User bin
    "/usr/bin"          # System bin (fallback)
)

print_status() { echo -e "${BLUE}[GoDev]${NC} $1"; }
print_success() { echo -e "${GREEN}✅${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠️${NC} $1"; }
print_error() { echo -e "${RED}❌${NC} $1"; }

command_exists() { command -v "$1" >/dev/null 2>&1; }

# Find the best bin directory
find_bin_dir() {
    for dir in "${BIN_DIRS[@]}"; do
        if [[ ":$PATH:" == *":$dir:"* ]]; then
            echo "$dir"
            return 0
        fi
    done
    
    # If none are in PATH, try to use /usr/local/bin or create ~/.local/bin
    if [ -w "/usr/local/bin" ]; then
        echo "/usr/local/bin"
    elif mkdir -p "$HOME/.local/bin" 2>/dev/null; then
        echo "$HOME/.local/bin"
        print_warning "Created ~/.local/bin - you may need to add it to your PATH"
    else
        print_error "No suitable bin directory found in PATH"
        exit 1
    fi
}

check_dependencies() {
    local missing_deps=()
    
    if ! command_exists node; then missing_deps+=("nodejs"); fi
    if ! command_exists npm; then missing_deps+=("npm"); fi
    if ! command_exists git; then missing_deps+=("git"); fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_warning "Missing dependencies: ${missing_deps[*]}"
        read -p "Install missing dependencies? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_dependencies "${missing_deps[@]}"
        else
            print_error "Please install dependencies manually: ${missing_deps[*]}"
            exit 1
        fi
    fi
}

install_dependencies() {
    local deps=("$@")
    if command_exists apt; then
        print_status "Installing dependencies using apt..."
        sudo apt update && sudo apt install -y "${deps[@]}"
    elif command_exists yum; then
        sudo yum install -y "${deps[@]}"
    elif command_exists dnf; then
        sudo dnf install -y "${deps[@]}"
    elif command_exists pacman; then
        sudo pacman -Sy --noconfirm "${deps[@]}"
    else
        print_error "Cannot detect package manager. Install manually: ${deps[*]}"
        exit 1
    fi
}

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

install_node_deps() {
    print_status "Installing Node.js dependencies..."
    npm install
}

create_symlinks() {
    local bin_dir="$1"
    print_status "Creating symlinks in: $bin_dir"
    
    # Make scripts executable
    chmod +x "$INSTALL_DIR/godev.js"
    chmod +x "$INSTALL_DIR/compiler-cli.js"
    chmod +x "$INSTALL_DIR/compiler-debian.js"
    
    # Remove existing symlinks first
    rm -f "$bin_dir/godev" "$bin_dir/godev-compile"
    
    # Create new symlinks
    if ln -sf "$INSTALL_DIR/godev.js" "$bin_dir/godev" && \
       ln -sf "$INSTALL_DIR/compiler-cli.js" "$bin_dir/godev-compile"; then
        print_success "Symlinks created in $bin_dir"
    else
        print_error "Failed to create symlinks. Try running with sudo?"
        exit 1
    fi
}

verify_installation() {
    print_status "Verifying installation..."
    
    # Small delay to ensure PATH is refreshed
    sleep 1
    
    if command_exists godev && command_exists godev-compile; then
        print_success "GoDev installed successfully!"
        echo
        echo "Usage:"
        echo "  godev create      - Create a new project"
        echo "  godev templates   - List available templates"
        echo "  godev-compile build - Compile a project"
        echo
        echo "Installation directory: $INSTALL_DIR"
        echo "Binary location: $(which godev)"
        echo
        print_success "Try: godev --help"
    else
        print_warning "Commands not found immediately. They should be available after:"
        echo "  source ~/.bashrc  # or restart your terminal"
        echo
        print_success "Installation completed. Files are in: $INSTALL_DIR"
    fi
}

install_godev() {
    print_status "Starting GoDev installation v$VERSION..."
    
    # Find the best bin directory
    BIN_DIR=$(find_bin_dir)
    print_status "Using bin directory: $BIN_DIR"
    
    check_dependencies
    clone_repository
    install_node_deps
    create_symlinks "$BIN_DIR"
    verify_installation
}

uninstall_godev() {
    print_status "Uninstalling GoDev..."
    
    # Remove from all possible bin directories
    for dir in "${BIN_DIRS[@]}"; do
        if [ -f "$dir/godev" ]; then
            rm -f "$dir/godev"
            print_success "Removed godev from $dir"
        fi
        if [ -f "$dir/godev-compile" ]; then
            rm -f "$dir/godev-compile"
            print_success "Removed godev-compile from $dir"
        fi
    done
    
    # Remove installation directory
    if [ -d "$INSTALL_DIR" ]; then
        rm -rf "$INSTALL_DIR"
        print_success "Removed GoDev files from $INSTALL_DIR"
    fi
    
    print_success "GoDev uninstalled successfully!"
}

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
    echo "One-line install:"
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
