# Lucky Voucher System - Docker Local Development

## 🐳 Quick Start with Docker

### Prerequisites

- Docker Desktop installed and running
- Node.js (v16+) for local frontend development

### Step 1: Start MySQL with Docker

**Option A: Using existing docker-compose.yml (Full Stack)**

```bash
# Navigate to project root
cd /Users/linhdh-company/Documents/Workspace/Voucher

# Start just the database
docker-compose up database -d

# Check if MySQL is running
docker-compose ps
```

**Option B: Simple MySQL Container (Recommended for local dev)**

```bash
# Start MySQL container
docker run -d \
  --name lucky_voucher_mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=lucky_voucher \
  -e MYSQL_USER=voucher_user \
  -e MYSQL_PASSWORD=voucher_password \
  -p 3306:3306 \
  mysql:8.0

# Check if container is running
docker ps

# View logs if needed
docker logs lucky_voucher_mysql
```

### Step 2: Update Backend Environment

Update your backend `.env` file:

```bash
cd /Users/linhdh-company/Documents/Workspace/Voucher/backend
```

Edit `.env` file with these Docker MySQL settings:

```bash
# Environment Configuration
NODE_ENV=development
PORT=3001

# Database Configuration (Docker MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=lucky_voucher
DB_USER=voucher_user
DB_PASSWORD=voucher_password

# JWT Configuration (generate secure keys for production)
JWT_SECRET=your-super-secure-jwt-secret-key-at-least-32-characters-long
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-at-least-32-characters
JWT_REFRESH_EXPIRES_IN=7d

# Cookie Configuration
COOKIE_SECRET=your-super-secure-cookie-secret-key-at-least-32-characters

# Device Fingerprint HMAC Key
DEVICE_HMAC_SECRET=your-super-secure-device-hmac-key-at-least-32-characters

# Email Configuration (Optional - for testing notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Lucky Voucher System <noreply@luckyvoucher.com>

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
SPIN_RATE_LIMIT_MAX=5

# Feature Flags
ENABLE_OTP_VERIFICATION=false
ENABLE_RECAPTCHA=false
```

### Step 3: Initialize Database

```bash
# Wait for MySQL to be ready (about 30 seconds)
docker exec lucky_voucher_mysql mysqladmin ping

# Run database migrations
cd /Users/linhdh-company/Documents/Workspace/Voucher/backend
npm run migrate

# Seed initial data
npm run seed
```

### Step 4: Start Development Servers

**Terminal 1: Backend**

```bash
cd /Users/linhdh-company/Documents/Workspace/Voucher/backend
npm run dev
```

**Terminal 2: Frontend**

```bash
cd /Users/linhdh-company/Documents/Workspace/Voucher/frontend
npm start
```

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Admin Panel**: http://localhost:3000/admin/login
- **Spin Page**: http://localhost:3000/spin/1

## 🗄️ Database Management

### Using Docker MySQL Command Line

```bash
# Connect to MySQL
docker exec -it lucky_voucher_mysql mysql -u voucher_user -p lucky_voucher

# View tables
SHOW TABLES;

# Check campaigns
SELECT * FROM campaigns;

# Check vouchers
SELECT * FROM vouchers;
```

### Optional: phpMyAdmin Web Interface

```bash
# Start phpMyAdmin (web-based database management)
docker run -d \
  --name lucky_voucher_phpmyadmin \
  -e PMA_HOST=host.docker.internal \
  -e PMA_PORT=3306 \
  -e PMA_USER=voucher_user \
  -e PMA_PASSWORD=voucher_password \
  -p 8080:80 \
  phpmyadmin/phpmyadmin

# Access at: http://localhost:8080
```

## 🛠️ Useful Docker Commands

### MySQL Container Management

```bash
# Start existing container
docker start lucky_voucher_mysql

# Stop container
docker stop lucky_voucher_mysql

# Remove container (data will be lost)
docker rm lucky_voucher_mysql

# View container logs
docker logs lucky_voucher_mysql

# Execute commands in container
docker exec -it lucky_voucher_mysql bash
```

### Database Backup & Restore

```bash
# Backup database
docker exec lucky_voucher_mysql mysqldump -u voucher_user -p voucher_password lucky_voucher > backup.sql

# Restore database
docker exec -i lucky_voucher_mysql mysql -u voucher_user -p voucher_password lucky_voucher < backup.sql
```

## 🚨 Troubleshooting

### Common Issues:

1. **Port 3306 already in use**

   ```bash
   # Find what's using the port
   lsof -i :3306

   # Use different port for Docker MySQL
   docker run -d --name lucky_voucher_mysql -p 3307:3306 ...
   # Then update DB_PORT=3307 in .env
   ```

2. **Container won't start**

   ```bash
   # Check Docker Desktop is running
   docker info

   # View detailed error logs
   docker logs lucky_voucher_mysql
   ```

3. **Connection refused errors**

   ```bash
   # Wait for MySQL to be fully ready
   docker exec lucky_voucher_mysql mysqladmin ping

   # Check container status
   docker ps -a
   ```

4. **Database migration fails**

   ```bash
   # Ensure MySQL is ready
   docker exec lucky_voucher_mysql mysql -u voucher_user -p voucher_password -e "SELECT 1"

   # Check database exists
   docker exec lucky_voucher_mysql mysql -u voucher_user -p voucher_password -e "SHOW DATABASES;"
   ```

## 📊 Default Data After Seeding

After running `npm run seed`, you'll have:

### Admin Account

- Email: admin@luckyvoucher.com
- Password: admin123

### Sample Campaign

- Campaign ID: 1
- Name: "Chương trình quay số may mắn mùa hè"
- Status: Active

### Sample Vouchers

- Various discount vouchers (10%, 20%, 50% off)
- Gift vouchers (100k, 200k VND)
- Free shipping vouchers

## 🎯 Next Steps

1. **Test the customer flow**: http://localhost:3000/spin/1
2. **Access admin panel**: http://localhost:3000/admin/login
3. **Create new campaigns** in the admin dashboard
4. **Monitor logs** in both terminal windows
5. **Test Vietnamese localization** throughout the interface

## 🔧 Development Tips

- Keep Docker Desktop running while developing
- Use `docker-compose down` to stop all services
- Check `docker ps` to see running containers
- Use `npm run dev` for backend hot-reload
- Frontend will auto-reload on file changes

Your Lucky Voucher System is now ready for local development! 🎉
