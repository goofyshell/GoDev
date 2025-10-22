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

print_status() { echo -e "${BLUE}[GoDev]${NC} $1"; }
print_success() { echo -e "${GREEN}✅${NC} $1"; }
print_error() { echo -e "${RED}❌${NC} $1"; }

debug_installation() {
    print_status "DEBUG INFO:"
    echo "Installation directory: $INSTALL_DIR"
    ls -la "$INSTALL_DIR/" | head -10
    echo
    
    echo "Looking for godev binaries:"
    find ~/.local/bin /usr/local/bin /usr/bin -name "godev*" 2>/dev/null || echo "None found"
    echo
    
    echo "Current PATH:"
    echo "$PATH"
    echo
    
    echo "Trying to find godev command:"
    which godev || echo "Not found"
    command -v godev || echo "Not found"
    echo
    
    echo "Checking if we can run godev directly:"
    if [ -f "$INSTALL_DIR/godev.js" ]; then
        node "$INSTALL_DIR/godev.js" --version || echo "Failed to run directly"
    else
        echo "godev.js not found!"
    fi
}

debug_installation
