#!/bin/bash

# Lucky Voucher System - Railway Deployment Script
# This script helps deploy the system to Railway platform

set -e

echo "🚀 Lucky Voucher System - Railway Deployment"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI is not installed.${NC}"
    echo "Please install it from: https://docs.railway.app/develop/cli"
    echo "Run: npm install -g @railway/cli"
    exit 1
fi

echo -e "${GREEN}✅ Railway CLI found${NC}"

# Check if user is logged in
if ! railway auth &> /dev/null; then
    echo -e "${YELLOW}⚠️  Please login to Railway first${NC}"
    echo "Run: railway login"
    exit 1
fi

echo -e "${GREEN}✅ Railway authentication verified${NC}"

# Function to create and deploy a service
deploy_service() {
    local service_name=$1
    local service_type=$2
    local dockerfile=$3
    
    echo -e "${BLUE}📦 Deploying $service_name...${NC}"
    
    # Create new service
    railway service create $service_name
    
    # Link to the service
    railway service connect $service_name
    
    # Deploy using Dockerfile
    if [ "$dockerfile" != "" ]; then
        railway up --dockerfile $dockerfile
    else
        railway up
    fi
    
    echo -e "${GREEN}✅ $service_name deployed successfully${NC}"
}

# Main deployment process
echo -e "${BLUE}🎯 Starting deployment process...${NC}"

# Create a new Railway project if it doesn't exist
echo -e "${YELLOW}📋 Creating Railway project...${NC}"
railway init lucky-voucher-system

# Deploy MySQL Database
echo -e "${BLUE}🗄️  Setting up MySQL database...${NC}"
railway service create mysql-db
railway service connect mysql-db
railway plugin add mysql

# Get database connection details
echo -e "${YELLOW}⚠️  Please note down the MySQL connection details:${NC}"
railway variables

# Deploy Backend
echo -e "${BLUE}🔧 Deploying backend service...${NC}"
railway service create lucky-voucher-backend
railway service connect lucky-voucher-backend

# Set backend environment variables
echo -e "${YELLOW}🔧 Setting backend environment variables...${NC}"
railway variables set NODE_ENV=production
railway variables set PORT=3001

echo -e "${YELLOW}Please set the following variables manually in Railway dashboard:${NC}"
echo "- DB_HOST (from MySQL plugin)"
echo "- DB_PORT (from MySQL plugin)"  
echo "- DB_NAME (from MySQL plugin)"
echo "- DB_USER (from MySQL plugin)"
echo "- DB_PASSWORD (from MySQL plugin)"
echo "- JWT_SECRET (generate a secure random string)"
echo "- JWT_REFRESH_SECRET (generate a secure random string)"
echo "- COOKIE_SECRET (generate a secure random string)"
echo "- DEVICE_HMAC_SECRET (generate a secure random string)"
echo "- EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS (if using email)"
echo "- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER (if using SMS)"

# Deploy backend
cp package-backend.json package.json
railway up --dockerfile Dockerfile.backend
rm package.json

# Deploy Frontend
echo -e "${BLUE}🎨 Deploying frontend service...${NC}"
railway service create lucky-voucher-frontend
railway service connect lucky-voucher-frontend

# Set frontend environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3000

# Set backend API URL for frontend
echo -e "${YELLOW}Please set REACT_APP_API_URL in Railway dashboard to your backend service URL${NC}"

# Deploy frontend
cp package-frontend.json package.json
railway up --dockerfile Dockerfile.frontend
rm package.json

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Go to Railway dashboard: https://railway.app/dashboard"
echo "2. Configure environment variables for backend service"
echo "3. Set REACT_APP_API_URL for frontend service"
echo "4. Run database migrations manually or wait for auto-migration on first start"
echo ""
echo -e "${BLUE}🔗 Service URLs:${NC}"
echo "- Frontend: Check Railway dashboard for the generated URL"
echo "- Backend: Check Railway dashboard for the generated URL"
echo "- Database: Available internally to other services"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "- Make sure to update CORS settings in backend with your frontend URL"
echo "- Set strong, unique secrets for JWT and other security tokens"
echo "- Configure email/SMS providers if you want notifications"
echo ""
echo -e "${GREEN}✅ Happy spinning! 🎰${NC}"
