# Railway Frontend Deployment

## Deploy this frontend separately by:

1. Create a new Railway project
2. Connect this repository
3. Set the Root Directory to: `frontend`
4. Set Build Command to: `npm install && npm run build`
5. Set Start Command to: `npx serve -s build -l $PORT`

## Required Environment Variables:

- NODE_ENV=production
- REACT_APP_API_URL=https://your-backend-url.railway.app/api

## Dependencies will be auto-detected from frontend/package.json
