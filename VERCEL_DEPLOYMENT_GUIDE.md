# Vercel Deployment Guide - Fresh Setup

## Current Issue
Your Vercel project `flip-book-drm` is connected to a different GitHub repository than where you're pushing code (`FlipBook_v01`).

## Solution: Create New Vercel Project

### Step 1: Go to Vercel Dashboard
Visit: https://vercel.com/new

### Step 2: Import Your GitHub Repository
1. Click "Add New..." → "Project"
2. Select "Import Git Repository"
3. Find and select: **sivahari1/FlipBook_v01**
4. Click "Import"

### Step 3: Configure Project Settings

#### Root Directory
- Set to: `flipbook-drm` (since your Next.js app is in this folder)

#### Framework Preset
- Should auto-detect: **Next.js**

#### Build Command
```bash
prisma generate && prisma migrate deploy && next build
```

#### Install Command (leave default)
```bash
npm install
```

#### Output Directory (leave default)
```
.next
```

### Step 4: Add Environment Variables

Click "Environment Variables" and add these:

#### Required Variables:

**DATABASE_URL**
```
postgresql://postgres:[YOUR_PASSWORD]@[YOUR_SUPABASE_HOST]:5432/postgres
```
Get this from: Supabase → Project Settings → Database → Connection String (URI)

**NEXTAUTH_SECRET**
```bash
# Generate a random secret:
openssl rand -base64 32
```

**NEXTAUTH_URL**
```
https://your-project-name.vercel.app
```
(You'll update this after deployment with the actual URL)

**NODE_ENV**
```
production
```

#### Optional (for email features):
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `EMAIL_FROM`

#### Optional (for payments):
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

### Step 5: Deploy
1. Click "Deploy"
2. Wait for build to complete (2-3 minutes)
3. Once deployed, copy your production URL

### Step 6: Update NEXTAUTH_URL
1. Go to Project Settings → Environment Variables
2. Edit `NEXTAUTH_URL` to your actual Vercel URL
3. Redeploy

### Step 7: Run Database Migrations

After first deployment, visit:
```
https://your-project-name.vercel.app/debug-prisma
```

This will show you if:
- ✅ DATABASE_URL is set
- ✅ Prisma Client is generated
- ✅ Database connection works
- ✅ Tables exist

If tables don't exist, you'll need to run migrations manually:

#### Option A: Run migrations from local machine
```bash
cd flipbook-drm
DATABASE_URL="your_supabase_url" npx prisma migrate deploy
```

#### Option B: Use Supabase SQL Editor
Go to Supabase → SQL Editor and run the migration SQL files from `prisma/migrations/`

### Step 8: Test Registration
Visit:
```
https://your-project-name.vercel.app/auth/sign-up
```

Try creating an account!

## Troubleshooting

### Build Fails with "Invalid prisma.schema"
- Make sure `prisma/schema.prisma` exists in the `flipbook-drm` folder
- Check that `postinstall` script runs: `"postinstall": "prisma generate"`

### Database Connection Fails
- Verify DATABASE_URL is correct
- Check Supabase allows connections from Vercel IPs
- Ensure database is not paused (free tier pauses after inactivity)

### Tables Don't Exist
- Run migrations manually using Option A or B above
- Or visit: `https://your-app.vercel.app/api/setup/migrate`

## Delete Old Project (Optional)

Once the new deployment works:
1. Go to old `flip-book-drm` project in Vercel
2. Settings → Advanced → Delete Project

## Summary

✅ New Vercel project connected to correct GitHub repo
✅ Proper build configuration with Prisma
✅ Environment variables set
✅ Database migrations run
✅ Authentication working

Your app should now deploy automatically whenever you push to the `main` branch of `FlipBook_v01`!
