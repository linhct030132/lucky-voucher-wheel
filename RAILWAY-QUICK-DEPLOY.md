# 🎰 Lucky Voucher System - Railway Deployment Summary

## 🚀 Quick Railway Deployment Steps

### 1. Prerequisites

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login
```

### 2. Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Choose "Deploy from GitHub repo" (recommended) or "Empty Project"

### 3. Deploy Services

#### Option A: GitHub Integration (Recommended)

1. Connect your GitHub repository
2. Railway will auto-detect and deploy both services
3. Configure environment variables (see below)

#### Option B: Manual Deployment

```bash
# Clone/navigate to your project
cd /path/to/lucky-voucher-system

# Initialize Railway
railway init

# Add MySQL database
railway add mysql

# Deploy backend
railway up --service backend --dockerfile Dockerfile.backend

# Deploy frontend
railway up --service frontend --dockerfile Dockerfile.frontend
```

### 4. Essential Environment Variables

#### Backend Service:

```bash
# Database (auto-filled from MySQL service)
DATABASE_URL=mysql://user:pass@host:port/db

# Or individual variables:
DB_HOST=railway-mysql-host
DB_PORT=3306
DB_NAME=railway
DB_USER=root
DB_PASSWORD=your-mysql-password

# Security (generate unique values)
JWT_SECRET=your-32-char-secret
JWT_REFRESH_SECRET=your-32-char-refresh-secret
COOKIE_SECRET=your-32-char-cookie-secret
DEVICE_HMAC_SECRET=your-32-char-hmac-secret

# CORS
FRONTEND_URL=${{frontend.RAILWAY_PUBLIC_DOMAIN}}
```

#### Frontend Service:

```bash
REACT_APP_API_URL=${{backend.RAILWAY_PUBLIC_DOMAIN}}/api
```

### 5. Database Setup

The backend automatically runs migrations and seeding on startup. Default admin:

- **Email**: admin@luckyvoucher.com
- **Password**: admin123

## 🔧 Railway-Specific Configuration

### Service Configuration

Each service needs these settings in Railway dashboard:

**Backend Service:**

- **Build Command**: `cd backend && npm install`
- **Start Command**: `cd backend && npm start`
- **Port**: 3001
- **Health Check**: `/health`

**Frontend Service:**

- **Build Command**: `cd frontend && npm install && npm run build`
- **Start Command**: `cd frontend && npx serve -s build -l $PORT`
- **Port**: 3000
- **Health Check**: `/`

### Domain Setup

1. Railway auto-generates domains like `service-name-production.up.railway.app`
2. Add custom domains in Service Settings → Domains
3. Update CORS and API URLs accordingly

## 🎯 Production Checklist

- [ ] MySQL database deployed and connected
- [ ] Backend service deployed with health check passing
- [ ] Frontend service deployed and accessible
- [ ] Environment variables configured
- [ ] Default admin password changed
- [ ] Email/SMS providers configured (optional)
- [ ] Custom domains set up (optional)
- [ ] HTTPS enforced (automatic with Railway)
- [ ] Database backups enabled (automatic with Railway)

## 🔐 Security Configuration

Generate strong secrets using:

```bash
# For JWT secrets (32+ characters)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 📊 Monitoring & Maintenance

### Railway Dashboard Features:

- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, network usage
- **Deployments**: Deployment history and rollbacks
- **Environment**: Variable management
- **Settings**: Service configuration

### Health Checks:

- **Backend**: `https://your-backend.railway.app/health`
- **Frontend**: `https://your-frontend.railway.app/`

## 💰 Cost Optimization

**Railway Pricing:**

- **Hobby Plan**: $5/month (500 hours execution time)
- **Pro Plan**: $20/month (unlimited usage)

**Tips:**

- Use Hobby plan for development/testing
- Upgrade to Pro for production
- Monitor usage in dashboard
- Pause unused services

## 🐛 Troubleshooting

### Common Issues:

**Build Failures:**

- Check build logs in Railway dashboard
- Ensure all dependencies in package.json
- Verify Dockerfile syntax

**Database Connection:**

- Check DATABASE_URL or individual DB variables
- Ensure MySQL service is running
- Verify network connectivity

**CORS Errors:**

- Update FRONTEND_URL in backend
- Update REACT_APP_API_URL in frontend
- Check Railway service domains

**404 on Routes:**

- Normal for React SPAs
- Ensure serve command includes `-s` flag

## 📞 Support

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **Railway Status**: [status.railway.app](https://status.railway.app)

## 🎉 Success!

Your Lucky Voucher System is now live on Railway!

**Next Steps:**

1. Test the spin functionality
2. Configure your first campaign in admin panel
3. Add vouchers and set probabilities
4. Share the spin URL with users
5. Monitor performance and user engagement

**Admin Panel**: `https://your-frontend-domain/admin/login`
**Public Spin**: `https://your-frontend-domain/spin/campaign-id`

Happy spinning! 🎰✨
