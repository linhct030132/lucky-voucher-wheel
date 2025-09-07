# Railway Deployment Guide

This guide explains how to deploy the Lucky Voucher System to Railway with both backend and frontend services running concurrently.

## Step-by-Step Railway Setup

### 1. Create MySQL Database Service

First, you need to add a MySQL database to your Railway project:

1. Go to your Railway project dashboard
2. Click **"+ New"** → **"Database"** → **"MySQL"**
3. Railway will automatically create a MySQL instance and provide connection details
4. Note: The `DATABASE_URL` will be automatically generated and added to your environment variables

### 2. Required Environment Variables for Railway

Set these in your Railway project dashboard under **Variables**:

#### Database Configuration (Automatic)

Railway automatically provides:

```
DATABASE_URL=mysql://user:password@host:port/database
```

**⚠️ Important**: This is automatically set when you add a MySQL database service. Do NOT modify this manually.

#### Security (REQUIRED - Generate secure random strings)

You MUST set these manually:

```
JWT_SECRET=your-secure-jwt-secret-min-32-characters
JWT_REFRESH_SECRET=your-secure-refresh-secret-min-32-characters
COOKIE_SECRET=your-secure-cookie-secret-min-32-characters
DEVICE_HMAC_SECRET=your-secure-device-hmac-secret-min-32-characters
```

**🔐 How to generate secure secrets:**

```bash
# Generate 32-character random strings
openssl rand -base64 32
# or
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Optional: Email Configuration (if using email features)

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM="Lucky Voucher System <noreply@yourdomain.com>"
```

#### Optional: SMS Configuration (if using SMS features)

```
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### 2. Automatic Environment Variables

These are set automatically by the deployment process:

- `PORT` - Set by Railway
- `NODE_ENV=production`
- `REACT_APP_API_URL` - Dynamically set based on Railway URL
- `FRONTEND_URL` - Dynamically set for CORS

## Deployment Process

1. **Connect Repository**: Connect your GitHub repository to Railway
2. **Set Environment Variables**: Add the required variables in Railway dashboard
3. **Deploy**: Railway will automatically:
   - Install all dependencies (frontend + backend)
   - Build the frontend
   - Start both services with concurrency

## Service Architecture

The deployment runs both services concurrently:

- **Backend**: Express.js API server on port 5000 (internal)
- **Frontend**: Static React app served on Railway's assigned port

## Local Development

For local development with the same setup:

1. Copy environment file:

   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your local values

3. Install and run:
   ```bash
   npm run dev
   ```

## Troubleshooting

### Database Connection Issues

**Error: "Database connection failed"**

1. **Check MySQL Service Status**:

   - Go to Railway dashboard → Your project → MySQL service
   - Ensure the MySQL service is running (green status)
   - Check the "Logs" tab for any MySQL errors

2. **Verify DATABASE_URL**:

   - Go to Variables tab in your Railway project
   - Ensure `DATABASE_URL` exists and follows format: `mysql://user:password@host:port/database`
   - If missing, you need to add a MySQL database service first

3. **Database Connection Format**:

   ```
   Correct: mysql://root:password@mysql.railway.internal:3306/railway
   Wrong: mysql://root:password@localhost:3306/database
   ```

4. **Railway-Specific Notes**:

   - Railway uses internal hostnames like `mysql.railway.internal`
   - SSL connections are required (automatically handled by our config)
   - Connection timeouts are set to 60 seconds for Railway's network

5. **Debug Steps**:

   ```bash
   # Check Railway logs
   railway logs

   # Or view logs in Railway dashboard under "Deployments"
   ```

### Build Issues

- Ensure all required environment variables are set in Railway
- Check that `CI=false` to avoid treating warnings as errors

### Runtime Issues

- Verify DATABASE_URL is correctly formatted
- Check Railway logs for specific error messages
- Ensure JWT secrets are at least 32 characters long
- Make sure MySQL service is running before the application service

### API Connection Issues

- Verify REACT_APP_API_URL is correctly set
- Check CORS configuration in backend
- Ensure both services are running (check Railway metrics)

## Port Configuration

- Railway assigns a dynamic port via `PORT` environment variable
- Frontend serves on this port
- Backend runs on port 5000 internally
- API calls are proxied through the frontend domain

## Security Notes

- Never commit real secrets to version control
- Use Railway's environment variables for all sensitive data
- Regularly rotate secrets in production
- Enable proper CORS settings for your domain
