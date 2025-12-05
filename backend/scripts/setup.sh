#!/bin/bash

# HealthHub Backend Setup Script
# This script sets up the HealthHub backend API

set -e  # Exit on any error

echo "🚀 HealthHub Backend Setup Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Node.js is installed
check_nodejs() {
    print_info "Checking Node.js installation..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_status "Node.js is installed: $NODE_VERSION"
        
        # Check if version is >= 16
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_MAJOR" -ge 16 ]; then
            print_status "Node.js version is compatible (>= 16)"
        else
            print_error "Node.js version must be >= 16. Current: $NODE_VERSION"
            exit 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 16 or higher."
        print_info "Download from: https://nodejs.org/"
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    print_info "Checking npm installation..."
    
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_status "npm is installed: $NPM_VERSION"
    else
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    
    if [ -f "package.json" ]; then
        npm install
        print_status "Dependencies installed successfully"
    else
        print_error "package.json not found. Are you in the correct directory?"
        exit 1
    fi
}

# Initialize database
init_database() {
    print_info "Initializing database..."
    
    if [ -f "scripts/init-database.js" ]; then
        npm run init-db
        print_status "Database initialized successfully"
    else
        print_error "Database initialization script not found"
        exit 1
    fi
}

# Create .env file if it doesn't exist
setup_env() {
    print_info "Setting up environment configuration..."
    
    if [ ! -f ".env" ]; then
        cat > .env << EOF
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_PATH=./database/healthhub.db

# Security
JWT_SECRET=$(openssl rand -base64 32)
BCRYPT_ROUNDS=12

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:8080,file://

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# API Configuration
API_VERSION=v1
EOF
        print_status "Created .env file with default configuration"
        print_warning "Please review and update the .env file as needed"
    else
        print_status ".env file already exists"
    fi
}

# Test the API
test_api() {
    print_info "Testing API endpoints..."
    
    if [ -f "scripts/test-api.js" ]; then
        node scripts/test-api.js
    else
        print_warning "Test script not found, skipping API tests"
    fi
}

# Main setup function
main() {
    echo ""
    print_info "Starting HealthHub Backend Setup..."
    echo ""
    
    # Check prerequisites
    check_nodejs
    check_npm
    
    echo ""
    print_info "Installing dependencies and setting up database..."
    
    # Install dependencies
    install_dependencies
    
    # Setup environment
    setup_env
    
    # Initialize database
    init_database
    
    echo ""
    print_status "Setup completed successfully!"
    echo ""
    
    print_info "Next steps:"
    echo "  1. Start the server: npm start"
    echo "  2. Or start in development mode: npm run dev"
    echo "  3. Test the API: http://localhost:3001/health"
    echo "  4. View API documentation: http://localhost:3001/api"
    echo ""
    
    print_info "Useful commands:"
    echo "  • npm start          - Start production server"
    echo "  • npm run dev        - Start development server with auto-reload"
    echo "  • npm run init-db    - Reinitialize database"
    echo "  • npm test           - Run tests"
    echo ""
    
    # Ask if user wants to start the server
    read -p "Would you like to start the server now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Starting server..."
        npm start
    else
        print_info "You can start the server later with: npm start"
    fi
}

# Run main function
main "$@"
