# Unified Dockerfile for Lucky Voucher System
# Builds both frontend and backend to run on a single port
FROM node:18-alpine AS frontend-builder

# Build frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
COPY frontend/tailwind.config.js ./
COPY frontend/postcss.config.js ./
RUN npm ci

COPY frontend/src ./src
COPY frontend/public ./public
RUN npm run build

# Backend stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy backend package files and install dependencies
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source code
COPY backend/src ./src

# Copy built frontend files to backend's static directory
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Create necessary directories
RUN mkdir -p logs uploads

# Expose single port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start the application (backend serves both API and static files)
CMD ["npm", "start"]
