# Lucky Voucher System - Local Development Setup

## Prerequisites

Before running the system locally, make sure you have the following installed:

1. **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
2. **MySQL** (v8.0 or higher) - [Download here](https://dev.mysql.com/downloads/mysql/)
3. **Git** - [Download here](https://git-scm.com/)

## 🚀 Quick Start Guide

### Step 1: Setup MySQL Database

1. **Start MySQL Server**

   ```bash
   # On macOS with Homebrew
   brew services start mysql

   # Or start MySQL from System Preferences if installed via installer
   ```

2. **Create Database**

   ```bash
   mysql -u root -p
   ```

   ```sql
   CREATE DATABASE lucky_voucher;
   CREATE USER 'voucher_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON lucky_voucher.* TO 'voucher_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

### Step 2: Setup Backend

1. **Navigate to backend directory**

   ```bash
   cd /Users/linhdh-company/Documents/Workspace/Voucher/backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create environment file**

   ```bash
   cp .env.example .env
   ```

4. **Configure .env file**
   Edit the `.env` file with your settings:

   ```bash
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=lucky_voucher
   DB_USER=voucher_user
   DB_PASSWORD=your_password

   # JWT Configuration (generate secure keys)
   JWT_SECRET=your-super-secure-jwt-secret-key-at-least-32-characters
   JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-at-least-32-characters

   # Other secrets
   COOKIE_SECRET=your-super-secure-cookie-secret-key-at-least-32-characters
   DEVICE_HMAC_SECRET=your-super-secure-device-hmac-key-at-least-32-characters

   # Email Configuration (Optional - for notifications)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=Lucky Voucher System <noreply@luckyvoucher.com>
   ```

5. **Run database migrations**

   ```bash
   npm run migrate
   ```

6. **Seed initial data**

   ```bash
   npm run seed
   ```

7. **Start backend server**

   ```bash
   npm run dev
   ```

   The backend will run at: `http://localhost:3001`

### Step 3: Setup Frontend

1. **Open new terminal and navigate to frontend directory**

   ```bash
   cd /Users/linhdh-company/Documents/Workspace/Voucher/frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create environment file**

   ```bash
   echo "REACT_APP_API_BASE_URL=http://localhost:3001/api" > .env
   ```

4. **Start frontend development server**

   ```bash
   npm start
   ```

   The frontend will run at: `http://localhost:3000`

## 🎯 Access Points

After both servers are running:

### Customer Interface

- **Main App**: http://localhost:3000
- **Spin Page**: http://localhost:3000/spin/:campaignId

### Admin Interface

- **Admin Login**: http://localhost:3000/admin/login
- **Admin Dashboard**: http://localhost:3000/admin/dashboard

### API Endpoints

- **Base URL**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health

## 👤 Default Admin Account

After running the seed script, you can login with:

- **Email**: admin@luckyvoucher.com
- **Password**: admin123

## 🔧 Development Commands

### Backend Commands

```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Run database migrations
npm run migrate

# Seed sample data
npm run seed

# Run tests
npm test
```

### Frontend Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## 📁 Project Structure

```
Voucher/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── services/       # Business logic
│   │   ├── config/         # Configuration files
│   │   └── database/       # Database migrations & seeds
│   ├── .env.example        # Environment variables template
│   └── package.json
├── frontend/               # React.js application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context
│   │   └── services/       # API services
│   ├── public/             # Static files
│   └── package.json
└── README_LOCAL.md         # This file
```

## 🐛 Troubleshooting

### Common Issues:

1. **MySQL Connection Failed**

   - Check if MySQL is running: `brew services list | grep mysql`
   - Verify database credentials in `.env`
   - Test connection: `mysql -u voucher_user -p lucky_voucher`

2. **Port Already in Use**

   - Backend (3001): `lsof -ti:3001 | xargs kill -9`
   - Frontend (3000): `lsof -ti:3000 | xargs kill -9`

3. **Migration Errors**

   - Check database exists: `mysql -u root -p -e "SHOW DATABASES;"`
   - Verify user permissions
   - Check .env database configuration

4. **Frontend Can't Connect to API**
   - Verify backend is running on port 3001
   - Check REACT_APP_API_BASE_URL in frontend/.env
   - Check browser console for CORS errors

### Logs and Debugging:

- **Backend logs**: Check terminal where you ran `npm run dev`
- **Frontend logs**: Check browser developer console
- **Database logs**: Check MySQL error logs

## 🌟 Features Available in Local Development

✅ **Customer Spin Interface** - Beautiful Vietnamese interface  
✅ **Admin Dashboard** - Complete campaign and voucher management  
✅ **Device Fingerprinting** - Anti-fraud protection  
✅ **Real-time Notifications** - Email/SMS (if configured)  
✅ **Audit Logging** - Complete activity tracking  
✅ **Vietnamese Localization** - All text in Vietnamese  
✅ **Security Features** - Rate limiting, input validation

## 📧 Email Configuration (Optional)

To enable email notifications:

1. **Gmail Setup**:

   - Enable 2-factor authentication
   - Generate app password: https://myaccount.google.com/apppasswords
   - Use app password in EMAIL_PASS

2. **Update .env**:
   ```bash
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASS=your-16-character-app-password
   ```

## 🚀 Next Steps

Once running locally:

1. Test customer spin flow at http://localhost:3000/spin/1
2. Login to admin at http://localhost:3000/admin/login
3. Create new campaigns and vouchers
4. Monitor audit logs in admin dashboard
5. Test the complete Vietnamese user experience

Enjoy your Lucky Voucher System! 🎉
