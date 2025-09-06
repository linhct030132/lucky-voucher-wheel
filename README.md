# Lucky Voucher System 🎯

A sophisticated web-based lucky draw voucher system built with React and Node.js. Features a beautiful customer interface for marketing purposes and a functional admin panel for staff management.

![Lucky Voucher System](https://img.shields.io/badge/Status-Production%20Ready-green)
![React](https://img.shields.io/badge/Frontend-React%2018-blue)
![Node.js](https://img.shields.io/badge/Backend-Node.js%2018-green)
![MySQL](https://img.shields.io/badge/Database-MySQL%208.0-orange)

## ✨ Features

### Customer Features (Marketing Focus)

- 🎨 **Beautiful UI** - Stunning, responsive design optimized for marketing
- 🎯 **Interactive Spin Wheel** - Smooth animations with Framer Motion
- 📱 **Mobile-First Design** - Perfect experience on all devices
- 🎁 **Real-time Results** - Instant win/lose notifications
- 📧 **Email Integration** - Automatic voucher delivery
- 🔒 **Fair Play System** - Device fingerprinting prevents abuse

### Admin Features (Functional Focus)

- 👨‍💼 **Staff Dashboard** - Clean, functional admin interface
- 📊 **Analytics & Reports** - Campaign performance insights
- 🎫 **Voucher Management** - CRUD operations for voucher campaigns
- 🔍 **Audit Logging** - Complete activity tracking
- 👥 **User Management** - Monitor customer participation
- 🛡️ **Security Controls** - Rate limiting and fraud prevention

### Technical Features

- ⚡ **High Performance** - Optimized for speed and reliability
- 🔐 **Enterprise Security** - JWT auth, CSRF protection, input validation
- 🎲 **Fair Probability Engine** - Weighted random selection algorithm
- 📈 **Scalable Architecture** - Docker containerization ready
- 🔄 **Real-time Notifications** - Instant feedback system
- 📱 **Progressive Web App** - App-like experience

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+
- Docker & Docker Compose (optional)

### Option 1: Docker Deployment (Recommended)

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Voucher
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Start with Docker**

   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Customer Interface: http://localhost
   - Admin Panel: http://localhost/admin/login
   - API Documentation: http://localhost:5000/api/health

### Option 2: Local Development

1. **Set up the database**

   ```bash
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE voucher_system;
   ```

2. **Configure backend**

   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials
   npm install
   npm run migrate
   npm run seed
   npm start
   ```

3. **Configure frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```

## 📁 Project Structure

```
Voucher/
├── backend/                 # Node.js API Server
│   ├── config/             # Database and app configuration
│   ├── database/           # Migrations and seeders
│   ├── middleware/         # Auth, validation, security
│   ├── models/            # Database models
│   ├── routes/            # API endpoints
│   ├── services/          # Business logic
│   ├── utils/             # Helper functions
│   └── server.js          # Main server file
│
├── frontend/               # React Application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React context providers
│   │   ├── pages/         # Route components
│   │   ├── utils/         # Helper functions
│   │   └── App.js         # Main app component
│   └── tailwind.config.js # Styling configuration
│
├── docker-compose.yml      # Container orchestration
├── .env.example           # Environment template
└── README.md              # This file
```

## 🎮 Usage Guide

### For Customers

1. Visit the landing page
2. Click "Try Your Luck"
3. Fill in your information
4. Spin the wheel
5. Receive your voucher (if won)

### For Staff/Admins

1. Access `/admin/login`
2. Login with admin credentials
3. Manage vouchers, view reports, monitor activity
4. Default admin: `admin@voucher.com` / `admin123`

## 🔧 Configuration

### Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=voucher_system
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Security
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
DEVICE_SECRET=your-device-fingerprint-secret

# Email (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Voucher Probability Configuration

Edit the seed file to configure win probabilities:

```javascript
// backend/database/seeders/vouchers.js
{
  type: 'Free Coffee',
  description: '1 Free Coffee',
  probability: 30.0,  // 30% chance
  total_quantity: 1000,
  // ...
}
```

## 🎨 Customization

### Branding

- Update colors in `frontend/tailwind.config.js`
- Replace logos in `frontend/public/`
- Modify text content in components

### Spin Wheel

- Edit segments in `frontend/src/components/SpinWheel.js`
- Adjust animations and colors
- Customize winning effects

### Email Templates

- Modify templates in `backend/services/emailService.js`
- Add custom branding and styling

## 🔒 Security Features

- **Device Fingerprinting** - Prevents multiple attempts from same device
- **Rate Limiting** - Protects against spam and abuse
- **Input Validation** - Sanitizes all user inputs
- **CSRF Protection** - Prevents cross-site request forgery
- **JWT Authentication** - Secure admin access
- **Audit Logging** - Tracks all system activities

## 📊 API Documentation

### Public Endpoints

- `POST /api/auth/spin` - Submit spin attempt
- `GET /api/public/campaigns/:id` - Get campaign details

### Admin Endpoints

- `POST /api/auth/login` - Admin login
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/vouchers` - Manage vouchers
- `GET /api/admin/reports` - View reports

## 🚀 Deployment

### Production Checklist

- [ ] Update all environment variables
- [ ] Configure email service
- [ ] Set up SSL certificates
- [ ] Configure database backups
- [ ] Set up monitoring and logging
- [ ] Test all functionality

### Scaling Considerations

- Use Redis for session storage
- Implement database read replicas
- Add CDN for static assets
- Use load balancers for high traffic

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Check the GitHub issues
- Review the documentation
- Contact the development team

## 🎯 Roadmap

- [ ] Mobile app development
- [ ] Social media integration
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] QR code generation
- [ ] Push notifications

---

Made with ❤️ for amazing marketing campaigns and customer engagement!
