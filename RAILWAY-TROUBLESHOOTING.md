# Railway Database Connection Troubleshooting

## Quick Fix Checklist

### 1. ✅ **Verify MySQL Service is Added**

- Go to Railway Dashboard → Your Project
- Look for a MySQL service (should show as a separate service box)
- If missing: Click **"+ New"** → **"Database"** → **"MySQL"**

### 2. ✅ **Check Environment Variables**

In Railway Dashboard → Your Project → Variables tab:

**Required Variables (YOU MUST SET):**

```
JWT_SECRET=your-secure-32-char-random-string
JWT_REFRESH_SECRET=your-secure-32-char-random-string
COOKIE_SECRET=your-secure-32-char-random-string
DEVICE_HMAC_SECRET=your-secure-32-char-random-string
```

**Auto-Generated Variables (Railway sets these):**

```
DATABASE_URL=mysql://user:password@host:port/database  # Set by MySQL service
PORT=3000  # Set by Railway
NODE_ENV=production  # Set by railway.toml
```

### 3. ✅ **Generate Secure Secrets**

Run this command to generate secure random strings:

```bash
openssl rand -base64 32
```

Copy the output and use it for each JWT/COOKIE/DEVICE secret.

### 4. ✅ **Check Railway MySQL Service Status**

- Go to Railway Dashboard → MySQL Service
- Check **"Metrics"** tab - should show active connections
- Check **"Logs"** tab - should not show connection errors

## Common Issues & Solutions

### Issue 1: "Access denied for user 'voucher_user'@'xxx' (using password: YES)"

**This means DATABASE_URL is not being used - it's falling back to local settings**

**Solution:**

1. Verify MySQL service exists in Railway
2. Check that `DATABASE_URL` appears in your project's Variables tab
3. If `DATABASE_URL` is missing, delete and re-add the MySQL service

### Issue 2: "Database connection failed: getaddrinfo ENOTFOUND localhost"

**This means it's trying to connect to localhost instead of Railway's database**

**Solution:**

1. Make sure you're using the Railway-specific start command
2. Check that environment variables are being passed correctly
3. Verify the MySQL service is running

### Issue 3: "Connection timeout" or "ETIMEDOUT"

**This means network connectivity issues**

**Solution:**

1. Check Railway service status page
2. Verify your Railway MySQL service is in the same region
3. Try redeploying the application

## Debug Commands

### Test Database Connection Locally

```bash
npm run test-db
```

### Debug Environment Variables

```bash
npm run debug-env
```

### Check Railway Logs

```bash
railway logs
```

## Railway-Specific Notes

1. **DATABASE_URL Format**: Railway uses `mysql://user:password@host.railway.internal:port/database`
2. **SSL Required**: Railway databases require SSL connections (handled automatically)
3. **Internal Networking**: Services communicate via internal hostnames like `mysql.railway.internal`
4. **Auto-Generated**: DATABASE_URL is automatically generated when you add MySQL service

## Manual Environment Variable Setup

If automated setup fails, manually add these in Railway Variables:

```bash
# Copy these from your MySQL service in Railway dashboard
DATABASE_URL=mysql://root:MYSQL_PASSWORD@mysql.railway.internal:3306/railway

# Generate these with: openssl rand -base64 32
JWT_SECRET=your-generated-secret-here
JWT_REFRESH_SECRET=your-generated-secret-here
COOKIE_SECRET=your-generated-secret-here
DEVICE_HMAC_SECRET=your-generated-secret-here
```

## Still Having Issues?

1. **Check Railway Status**: https://railway.app/status
2. **View Deployment Logs**: Railway Dashboard → Deployments → Click latest deployment
3. **Check Service Dependencies**: Ensure MySQL service starts before your app
4. **Contact Railway Support**: If MySQL service itself is not working
