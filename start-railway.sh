#!/bin/bash

echo "🚀 Starting Lucky Voucher System on Railway..."

# Print environment info for debugging
echo "📋 Environment Information:"
echo "NODE_ENV: ${NODE_ENV:-not set}"
echo "PORT: ${PORT:-not set}"
echo "DATABASE_URL: $(if [ -n "$DATABASE_URL" ]; then echo "SET"; else echo "NOT SET"; fi)"

# Set ports for Railway deployment
# Since we're only running the backend (which serves static files), 
# it should use the main Railway PORT
export FRONTEND_PORT=${PORT:-8080}

echo "📋 Port Configuration:"
echo "Backend serving on Railway Port: $FRONTEND_PORT"

# Create a temporary .env file for the backend with Railway variables
echo "📝 Creating backend environment file..."
cat > backend/.env.railway << EOF
NODE_ENV=${NODE_ENV:-production}
DATABASE_URL=${DATABASE_URL}
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
COOKIE_SECRET=${COOKIE_SECRET}
DEVICE_HMAC_SECRET=${DEVICE_HMAC_SECRET}
FRONTEND_URL=${RAILWAY_STATIC_URL:-http://localhost:${FRONTEND_PORT}}
CORS_ORIGIN=${RAILWAY_STATIC_URL:-http://localhost:${FRONTEND_PORT}}
EMAIL_HOST=${EMAIL_HOST}
EMAIL_PORT=${EMAIL_PORT}
EMAIL_USER=${EMAIL_USER}
EMAIL_PASS=${EMAIL_PASS}
EMAIL_FROM=${EMAIL_FROM}
TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
TWILIO_PHONE_NUMBER=${TWILIO_PHONE_NUMBER}
EOF

echo "✅ Backend environment file created"
echo "📋 Port Configuration:"
echo "Backend serving on Railway Port: $FRONTEND_PORT"

echo "✅ Backend environment file created"
echo "📋 Port Configuration:"
echo "Frontend Port: $FRONTEND_PORT"
echo "Backend Port: $BACKEND_PORT"
echo "🔄 Starting services..."

# For Railway deployment, only run the backend server
# The backend will serve both API and static files
echo "🔄 Starting backend server (will serve both API and static files)..."

cd backend && PORT=$FRONTEND_PORT node -r dotenv/config src/server.js dotenv_config_path=.env.railway
