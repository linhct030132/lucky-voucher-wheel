# Lucky Voucher System - Single Port Deployment Guide

This guide explains how to deploy the Lucky Voucher System on a single port for production environments, including Railway.

## 🏗️ Architecture

The application now uses a unified architecture where:
- **Frontend**: React app built as static files
- **Backend**: Express.js server that serves both API endpoints and static files
- **Single Port**: Everything runs on one port (8080 for Railway, configurable for other platforms)

## 🚀 Deployment Options

### 1. Railway Deployment (Recommended)

The app is configured to automatically deploy on Railway using the unified Dockerfile:

```bash
# Railway will automatically:
# 1. Build the frontend
# 2. Build the backend
# 3. Serve everything on the PORT provided by Railway
```

**Railway Configuration:**
- Uses `Dockerfile` for building
- Serves on `$PORT` (typically 8080)
- Backend serves both API (`/api/*`) and frontend (`/*`)

### 2. Local Production Deployment

Use the unified production deployment:

```bash
# Quick start with Docker
./deploy-production.sh

# Or manually
npm run start-unified
```

### 3. Docker Deployment

```bash
# Build the unified image
docker build -t lucky-voucher-system .

# Run with environment variables
docker run -p 8080:8080 \
  -e NODE_ENV=production \
  -e DATABASE_URL=your_database_url \
  -e JWT_SECRET=your_jwt_secret \
  lucky-voucher-system
```

## 🔧 Configuration

### Environment Variables

**Required for Production:**
```env
NODE_ENV=production
PORT=8080
DATABASE_URL=mysql://user:pass@host:port/database
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key
COOKIE_SECRET=your-cookie-secret
DEVICE_HMAC_SECRET=your-device-secret
```

**Optional:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
```

### Railway-Specific Variables

Railway automatically sets:
- `PORT` - The port your app should listen on
- `RAILWAY_STATIC_URL` - Your app's public URL
- `NODE_ENV=production`

You need to add:
- Database credentials (Railway MySQL addon or external)
- JWT secrets
- Email/SMS service credentials

## 📁 File Structure (Production)

```
/app
├── backend/
│   ├── src/
│   │   ├── server.js          # Main server file
│   │   ├── routes/            # API routes
│   │   └── ...
│   └── package.json
├── frontend/
│   └── build/                 # Built React app (served by backend)
└── Dockerfile                 # Unified build configuration
```

## 🔄 API Endpoints

All endpoints are served from the same domain/port:

- **Frontend**: `GET /` → React app
- **API**: `GET /api/health` → Health check
- **Auth**: `POST /api/auth/login` → Authentication
- **Spins**: `POST /api/spins` → Lucky draw spin
- **Admin**: `/api/admin/*` → Admin panel APIs

## 🛠️ Development vs Production

### Development (2 ports)
```bash
npm run dev  # Frontend: 3000, Backend: 3001
```

### Production (1 port)
```bash
npm run start  # Everything: 8080 (or $PORT)
```

## 🔍 Troubleshooting

### Common Issues

1. **CORS Errors**: Check that `FRONTEND_URL` and `RAILWAY_STATIC_URL` are set correctly
2. **API Not Found**: Ensure the backend is serving static files in production mode
3. **Database Connection**: Verify `DATABASE_URL` is correctly formatted
4. **Port Conflicts**: Ensure only one instance is running on the target port

### Debug Commands

```bash
# Check health
curl http://localhost:8080/health

# View logs
docker-compose logs -f app

# Test database connection
npm run test-db
```

## 📊 Monitoring

The application includes health check endpoints:
- `GET /health` - Basic health status
- `GET /api/health` - Detailed API health status

Health checks include:
- Database connectivity
- Server uptime
- Environment information

## 🔒 Security Considerations

1. **Environment Variables**: Never commit secrets to repository
2. **CORS**: Production CORS is restricted to same origin
3. **Rate Limiting**: API endpoints are rate-limited
4. **Input Validation**: All inputs are validated and sanitized
5. **JWT Security**: Use strong secrets and proper expiration times

## 📈 Performance

The unified deployment provides:
- **Reduced Latency**: No cross-origin requests
- **Simplified Infrastructure**: Single container/service
- **Better Caching**: Static files served directly
- **Lower Resource Usage**: One Node.js process instead of two
