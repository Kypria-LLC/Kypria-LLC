#!/bin/bash
# 🏛️ WEALTH CONDUIT DEPLOYMENT SCRIPT
# Production deployment orchestrator for the Sacred Revenue Pipeline

set -euo pipefail

# Colors for ceremonial output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
REPO_NAME="wealth-conduit"
DEPLOY_ENV="${DEPLOY_ENV:-production}"
LOG_FILE="/var/log/kypria/${REPO_NAME}-deploy.log"

# Functions
log_info() {
    echo -e "${CYAN}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_seal() {
    echo -e "${PURPLE}[SEAL]${NC} $1" | tee -a "$LOG_FILE"
}

# Pre-flight checks
preflight_checks() {
    log_seal "🔱 Initiating Pre-Flight Consecration..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        log_error "Node.js not found. Install Node.js 18+ before deploying."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js version must be 18 or higher. Current: $(node -v)"
        exit 1
    fi
    log_success "Node.js version validated: $(node -v)"
    
    # Check environment file
    if [ ! -f .env ]; then
        log_error ".env file not found. Copy .env.example and configure secrets."
        exit 1
    fi
    log_success "Environment configuration found"
    
    # Verify required secrets
    source .env
    REQUIRED_VARS=(
        "PAYPAL_WEBHOOK_ID"
        "GITHUB_WEBHOOK_SECRET"
        "DISCORD_WEBHOOK_URL"
        "GITHUB_TOKEN"
    )
    
    for VAR in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!VAR:-}" ]; then
            log_error "Missing required environment variable: $VAR"
            exit 1
        fi
    done
    log_success "All required secrets validated"
    
    log_seal "✅ Pre-Flight Complete - Ready for Deployment"
}

# Build application
build_app() {
    log_seal "🔨 Commencing Build Ritual..."
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm ci --production=false
    
    # Run TypeScript compilation
    log_info "Compiling TypeScript..."
    npm run build
    
    if [ ! -d "dist" ]; then
        log_error "Build failed - dist directory not created"
        exit 1
    fi
    
    log_success "Build complete - artifacts generated"
}

# Run tests
run_tests() {
    log_seal "🧪 Executing Validation Ceremonies..."
    
    log_info "Running unit tests..."
    npm run test
    
    log_info "Validating tier configuration..."
    node -e "
        const fs = require('fs');
        const config = JSON.parse(fs.readFileSync('config/tier-mapping.json', 'utf8'));
        
        for (const [source, data] of Object.entries(config)) {
            if (!data.tiers || data.tiers.length === 0) {
                console.error(\`No tiers defined for source: \${source}\`);
                process.exit(1);
            }
        }
        console.log('✅ Tier configuration validated');
    "
    
    log_success "All validation ceremonies passed"
}

# Deploy to production
deploy_production() {
    log_seal "🚀 Initiating Production Deployment..."
    
    # Stop existing service
    if systemctl is-active --quiet wealth-conduit; then
        log_info "Stopping existing service..."
        sudo systemctl stop wealth-conduit
    fi
    
    # Backup existing deployment
    if [ -d "/opt/kypria/${REPO_NAME}" ]; then
        BACKUP_DIR="/opt/kypria/backups/${REPO_NAME}-$(date +%Y%m%d-%H%M%S)"
        log_info "Creating backup: $BACKUP_DIR"
        sudo mkdir -p "$BACKUP_DIR"
        sudo cp -r "/opt/kypria/${REPO_NAME}" "$BACKUP_DIR"
    fi
    
    # Deploy new version
    log_info "Deploying to /opt/kypria/${REPO_NAME}..."
    sudo mkdir -p "/opt/kypria/${REPO_NAME}"
    sudo cp -r dist package.json config .env "/opt/kypria/${REPO_NAME}/"
    
    # Install production dependencies
    cd "/opt/kypria/${REPO_NAME}"
    sudo npm ci --production
    
    # Set permissions
    sudo chown -R kypria:kypria "/opt/kypria/${REPO_NAME}"
    sudo chmod 600 "/opt/kypria/${REPO_NAME}/.env"
    
    # Start service
    log_info "Starting wealth-conduit service..."
    sudo systemctl start wealth-conduit
    sudo systemctl enable wealth-conduit
    
    # Wait for service to stabilize
    sleep 5
    
    # Health check
    if systemctl is-active --quiet wealth-conduit; then
        log_success "Service started successfully"
    else
        log_error "Service failed to start. Check logs: journalctl -u wealth-conduit -n 50"
        exit 1
    fi
}

# Post-deployment verification
verify_deployment() {
    log_seal "🔍 Performing Post-Deployment Verification..."
    
    # Check service status
    if ! systemctl is-active --quiet wealth-conduit; then
        log_error "Service is not running"
        return 1
    fi
    log_success "Service is running"
    
    # Test health endpoint (if available)
    if command -v curl &> /dev/null; then
        HEALTH_URL="http://localhost:3000/health"
        if curl -sf "$HEALTH_URL" > /dev/null; then
            log_success "Health endpoint responding"
        else
            log_warning "Health endpoint not responding (may be intentional)"
        fi
    fi
    
    # Check recent logs for errors
    if journalctl -u wealth-conduit --since "1 minute ago" | grep -i error > /dev/null; then
        log_warning "Errors detected in recent logs - review recommended"
    else
        log_success "No errors in recent logs"
    fi
    
    log_seal "✅ Deployment Verification Complete"
}

# Main deployment flow
main() {
    echo -e "${PURPLE}"
    cat << "EOF"
╔════════════════════════════════════════════════╗
║  🏛️  WEALTH CONDUIT DEPLOYMENT RITUAL  🏛️   ║
║   Sacred Revenue Integration Pipeline        ║
╚════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    log_seal "Deployment Environment: $DEPLOY_ENV"
    log_seal "Timestamp: $(date)"
    
    # Ensure log directory exists
    sudo mkdir -p /var/log/kypria
    
    # Execute deployment phases
    preflight_checks
    build_app
    run_tests
    
    if [ "$DEPLOY_ENV" = "production" ]; then
        deploy_production
        verify_deployment
    else
        log_info "Development mode - skipping production deployment"
    fi
    
    echo ""
    log_seal "🎉 DEPLOYMENT RITUAL COMPLETE 🎉"
    log_info "Monitor logs: journalctl -u wealth-conduit -f"
    log_info "Check status: systemctl status wealth-conduit"
}

# Execute main deployment
main "$@"