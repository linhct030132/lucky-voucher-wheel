#!/bin/bash

echo "🚀 Starting Lucky Voucher System on Railway..."

# Print environment info for debugging
echo "📋 Environment Information:"
echo "NODE_ENV: ${NODE_ENV:-not set}"
echo "PORT: ${PORT:-not set}"
echo "DATABASE_URL: $(if [ -n "$DATABASE_URL" ]; then echo "SET"; else echo "NOT SET"; fi)"

# Set ports explicitly for Railway
export BACKEND_PORT=${BACKEND_PORT:-5000}
export FRONTEND_PORT=${PORT:-8080}

echo "📋 Port Configuration:"
echo "Frontend Port (Railway main): $FRONTEND_PORT"
echo "Backend Port (internal): $BACKEND_PORT"

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
echo "Frontend Port: $FRONTEND_PORT"
echo "Backend Port: $BACKEND_PORT"
echo "🔄 Starting services..."

# Start both services
npx concurrently \
  --names "BACKEND,FRONTEND" \
  --prefix-colors "blue,green" \
  --kill-others-on-fail \
  "cd backend && BACKEND_PORT=$BACKEND_PORT node -r dotenv/config src/server.js dotenv_config_path=.env.railway" \
  "serve -s frontend/build -p $FRONTEND_PORT"
