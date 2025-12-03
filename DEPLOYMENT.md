# Deployment Guide: Grand Horizon Hotel

This guide explains how to deploy the application to **Vercel** (frontend) and **Render** (backend).

## Prerequisites

1. GitHub account with your code pushed to a repository
2. Vercel account (free tier available)
3. Render account (free tier available)
4. MongoDB Atlas account (for database)
5. Cloudinary account (for image uploads)

---

## Step 1: Set Up MongoDB Atlas

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Create a database user with password
4. Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/grand-horizon`
5. Whitelist all IPs (0.0.0.0/0) for Render access

---

## Step 2: Set Up Cloudinary

1. Go to [cloudinary.com](https://cloudinary.com) and create a free account
2. From your dashboard, note down:
   - Cloud Name
   - API Key
   - API Secret

---

## Step 3: Deploy Backend to Render

1. Go to [render.com](https://render.com) and sign in
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `grand-horizon-api`
   - **Root Directory**: Leave empty (uses root)
   - **Runtime**: Node
   - **Build Command**: `npm ci --include=dev && npm run build`
   - **Start Command**: `npm start`

5. Add Environment Variables:
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://...your-connection-string...
   SESSION_SECRET=your-random-secret-key-here
   FRONTEND_URL=https://your-app.vercel.app  (add after Vercel deploy)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   SMTP_HOST=smtp.gmail.com (optional)
   SMTP_PORT=587 (optional)
   SMTP_USER=your-email@gmail.com (optional)
   SMTP_PASS=your-app-password (optional)
   ```

6. Click **Create Web Service**
7. Wait for deployment (takes 5-10 minutes)
8. Note your Render URL: `https://grand-horizon-api.onrender.com`

---

## Step 4: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variable:
   ```
   VITE_API_URL=https://grand-horizon-api.onrender.com
   ```
   (Use your actual Render backend URL)

6. Click **Deploy**
7. Note your Vercel URL: `https://your-app.vercel.app`

---

## Step 5: Update Render with Frontend URL

1. Go back to Render dashboard
2. Open your web service settings
3. Add/Update environment variable:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
4. Render will auto-redeploy

---

## Environment Variables Summary

### Render (Backend)
| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Set to `production` | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `SESSION_SECRET` | Random secret for sessions | Yes |
| `FRONTEND_URL` | Your Vercel frontend URL | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |
| `SMTP_HOST` | Email server host | No |
| `SMTP_PORT` | Email server port | No |
| `SMTP_USER` | Email username | No |
| `SMTP_PASS` | Email password | No |

### Vercel (Frontend)
| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Your Render backend URL | Yes |

---

## Test Accounts

After deployment, you can create accounts through the registration form, or seed the database with test accounts:

- **Admin**: admin@grandhorizon.com / Test@123
- **Manager**: manager@grandhorizon.com / Test@123
- **Guest**: guest@grandhorizon.com / Test@123

---

## Troubleshooting

### CORS Errors
- Make sure `FRONTEND_URL` on Render exactly matches your Vercel URL
- Include `https://` in the URL

### MongoDB Connection Failed
- Check your connection string format
- Ensure IP whitelist includes `0.0.0.0/0`
- Verify username/password are correct

### Images Not Uploading
- Verify all three Cloudinary environment variables are set
- Check Cloudinary dashboard for any quota limits

### Render Free Tier Sleeping
- Free tier services sleep after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds
- Consider upgrading to paid tier for always-on service

---

## Local Development

To run locally after cloning:

```bash
# Install dependencies
npm install

# Create .env file with required variables
cp .env.example .env

# Start development server
npm run dev
```

The app will be available at `http://localhost:5000`
