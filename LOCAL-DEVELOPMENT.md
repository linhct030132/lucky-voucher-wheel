# Local Development Setup Guide

## Prerequisites

- Node.js 18+ installed
- Docker and Docker Compose installed
- Git

## Quick Start

### 1. Clone and Setup Environment

```bash
# Clone the repository (if not already done)
git clone https://github.com/linhct030132/lucky-voucher-wheel.git
cd lucky-voucher-wheel

# Copy environment file
cp .env.example .env

# Install all dependencies
npm run install-all
```

### 2. Start Database (Docker)

```bash
# Start MySQL database with Docker
docker-compose up database -d

# Wait for database to be ready (check with)
docker-compose logs database
```

### 3. Setup Database Schema

```bash
# Run database migrations (create tables)
cd backend && npm run migrate

# Seed initial data (optional)
cd backend && npm run seed
```

### 4. Start Development Servers

```bash
# Start both frontend and backend in development mode
npm run dev

# Or start them separately:
npm run dev-backend   # Backend only (http://localhost:5000)
npm run dev-frontend  # Frontend only (http://localhost:3000)
```

## Available Scripts

### Root Level Scripts

```bash
npm run install-all      # Install dependencies for both frontend and backend
npm run dev             # Start both frontend and backend in development mode
npm run build           # Build the entire application for production
npm run start           # Start production build
npm run test-db         # Test database connection
npm run debug-env       # Debug environment variables
```

### Backend Scripts (run from /backend)

```bash
cd backend
npm run dev             # Start backend with nodemon (auto-reload)
npm run start           # Start backend in production mode
npm run migrate         # Run database migrations
npm run seed            # Seed database with initial data
npm run test            # Run tests
```

### Frontend Scripts (run from /frontend)

```bash
cd frontend
npm start               # Start development server
npm run build           # Build for production
npm test                # Run tests
npm run eject           # Eject from Create React App (not recommended)
```

## Database Setup Options

### Option 1: Docker (Recommended)

```bash
# Start MySQL with Docker Compose
docker-compose up database -d

# Check if running
docker-compose ps
```

### Option 2: Local MySQL Installation

If you have MySQL installed locally:

```bash
# Create database and user
mysql -u root -p
CREATE DATABASE voucher_system;
CREATE USER 'voucher_user'@'localhost' IDENTIFIED BY 'password123';
GRANT ALL PRIVILEGES ON voucher_system.* TO 'voucher_user'@'localhost';
FLUSH PRIVILEGES;
```

### Option 3: MySQL with Homebrew (macOS)

```bash
# Install MySQL
brew install mysql

# Start MySQL service
brew services start mysql

# Connect and setup
mysql -u root -p
# Then run the SQL commands from Option 2
```

## Environment Variables

The `.env` file contains all configuration for local development:

### Database Settings

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=voucher_system
DB_USER=voucher_user
DB_PASSWORD=password123
```

### API Settings

```env
REACT_APP_API_URL=http://localhost:5000/api
FRONTEND_URL=http://localhost:3000
BACKEND_PORT=5000
```

### Security (for local development)

```env
JWT_SECRET=local-development-jwt-secret-key-min-32-characters-long
COOKIE_SECRET=local-development-cookie-secret-for-testing
DEVICE_HMAC_SECRET=local-development-device-hmac-secret-for-testing
```

## Accessing the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## Troubleshooting

### Database Connection Issues

```bash
# Test database connection
npm run test-db

# Check if Docker MySQL is running
docker-compose ps

# View database logs
docker-compose logs database

# Restart database
docker-compose restart database
```

### Port Already in Use

```bash
# Kill process using port 3000 or 5000
lsof -ti:3000 | xargs kill -9
lsof -ti:5000 | xargs kill -9
```

### Frontend Build Issues

```bash
# Clear node modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Backend Issues

```bash
# Clear node modules and reinstall
cd backend
rm -rf node_modules package-lock.json
npm install
```

## Development Workflow

1. **Make changes** to frontend or backend code
2. **Auto-reload** will handle restarting the servers
3. **Test locally** at http://localhost:3000
4. **Commit changes** when ready
5. **Deploy to Railway** when ready for production

## Database Migrations

After making database schema changes:

```bash
cd backend
npm run migrate
```

To reset database:

```bash
docker-compose down -v  # Removes volumes (data)
docker-compose up database -d
cd backend && npm run migrate && npm run seed
```
