# 🚀 Railway Deployment Guide for Lucky Voucher System

This guide will help you deploy the Lucky Voucher System to Railway platform with MySQL database.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Railway CLI**: Install via `npm install -g @railway/cli`
3. **Git Repository**: Your code should be in a Git repository

## Step-by-Step Deployment

### 1. Setup Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login
```

### 2. Create New Railway Project

```bash
# Initialize new Railway project
railway init lucky-voucher-system

# This will create a new project in your Railway dashboard
```

### 3. Deploy MySQL Database

1. Go to your Railway dashboard
2. Click "New Service" → "Database" → "Add MySQL"
3. Wait for the database to provision
4. Note down the connection details from the "Connect" tab

### 4. Deploy Backend Service

```bash
# Create backend service
railway service create backend

# Link to backend service
railway service connect backend

# Set environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3001

# Deploy backend
railway up --dockerfile Dockerfile.backend
```

#### Backend Environment Variables to Set in Railway Dashboard:

```bash
# Database (get these from your MySQL service)
DB_HOST=mysql-host-from-railway
DB_PORT=3306
DB_NAME=railway
DB_USER=root
DB_PASSWORD=your-mysql-password

# Security (generate strong random strings)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-chars
COOKIE_SECRET=your-super-secret-cookie-key-minimum-32-chars
DEVICE_HMAC_SECRET=your-super-secret-device-hmac-key

# Email (optional - for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Lucky Voucher System <noreply@luckyvoucher.com>

# SMS (optional - for notifications)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Features
ENABLE_OTP_VERIFICATION=false
ENABLE_RECAPTCHA=false

# CORS
FRONTEND_URL=https://your-frontend-domain.railway.app
```

### 5. Deploy Frontend Service

```bash
# Create frontend service
railway service create frontend

# Link to frontend service
railway service connect frontend

# Set environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set REACT_APP_API_URL=https://your-backend-domain.railway.app/api

# Deploy frontend
railway up --dockerfile Dockerfile.frontend
```

### 6. Configure Custom Domains (Optional)

1. Go to Railway dashboard
2. Select your service
3. Go to "Settings" → "Domains"
4. Add your custom domain
5. Update DNS records as instructed

### 7. Database Migration and Seeding

The backend will automatically run migrations and seeding on first startup. You can also run them manually:

```bash
# Connect to backend service
railway service connect backend

# Run migrations
railway run npm run migrate

# Run seeding (creates default admin user)
railway run npm run seed
```

## Important Configuration

### Backend CORS Settings

Make sure your backend allows requests from your frontend domain. Update the CORS configuration in your backend if needed.

### Default Admin Credentials

After seeding, you can login to the admin panel with:

- **Email**: admin@luckyvoucher.com
- **Password**: admin123

**⚠️ Change these credentials immediately after first login!**

### Security Checklist

- [ ] Set strong, unique JWT secrets
- [ ] Configure proper CORS origins
- [ ] Change default admin password
- [ ] Set up email/SMS providers for notifications
- [ ] Enable HTTPS (Railway provides this automatically)
- [ ] Configure proper environment variables

## Service URLs

After deployment, you'll get URLs like:

- **Frontend**: `https://lucky-voucher-frontend-production.up.railway.app`
- **Backend**: `https://lucky-voucher-backend-production.up.railway.app`
- **Database**: Internal connection (not publicly accessible)

## Testing Your Deployment

1. **Backend Health Check**: Visit `https://your-backend-url/health`
2. **Frontend**: Visit your frontend URL
3. **Admin Panel**: Visit `https://your-frontend-url/admin/login`
4. **API Test**: Try creating a spin via the frontend

## Troubleshooting

### Common Issues:

1. **Database Connection Errors**:

   - Check DB environment variables
   - Ensure database service is running

2. **CORS Errors**:

   - Update FRONTEND_URL in backend environment
   - Check REACT_APP_API_URL in frontend

3. **Build Failures**:

   - Check build logs in Railway dashboard
   - Ensure all dependencies are listed in package.json

4. **404 Errors on Frontend Routes**:
   - This is normal for SPAs, the app handles routing internally

### Getting Help:

- Railway Documentation: https://docs.railway.app/
- Railway Discord: https://discord.gg/railway
- Project Issues: Check your Git repository issues

## Monitoring and Maintenance

1. **Logs**: View logs in Railway dashboard
2. **Metrics**: Monitor usage and performance
3. **Backups**: Railway handles database backups automatically
4. **Updates**: Deploy updates by pushing to your Git repository

## Cost Optimization

- Railway offers $5/month free tier
- Monitor usage in dashboard
- Scale services based on actual needs
- Consider turning off development services when not needed

---

🎉 **Congratulations!** Your Lucky Voucher System is now live on Railway!

Visit your frontend URL to start using the system, and access the admin panel to configure your first campaign and vouchers.
