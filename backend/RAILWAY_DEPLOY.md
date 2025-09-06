# Railway Backend Deployment

## Deploy this backend separately by:

1. Create a new Railway project
2. Connect this repository
3. Set the Root Directory to: `backend`
4. Set Build Command to: `npm install`
5. Set Start Command to: `npm start`

## Required Environment Variables:

- NODE_ENV=production
- PORT=3001
- DATABASE_URL=mysql://user:pass@host:port/db
- JWT_SECRET=your-secret-key
- JWT_REFRESH_SECRET=your-refresh-secret
- COOKIE_SECRET=your-cookie-secret
- DEVICE_HMAC_SECRET=your-hmac-secret
- FRONTEND_URL=https://your-frontend-url.railway.app

## Dependencies will be auto-detected from backend/package.json
