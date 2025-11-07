# Fix Authentication Issue - Step by Step Guide

## The Problem
Your FlipBook DRM application is deployed successfully, but users cannot register or login because the Supabase database has **0 tables**.

## The Root Cause
When you deployed to Vercel, the Prisma schema was not applied to your Supabase database. The database exists, but it's empty - no tables have been created.

## The Solution (Choose One)

### ✅ Option 1: Quick Fix (Recommended)

**Run this single command in your terminal:**

```bash
cd flipbook-drm
npx prisma db push
```

That's it! This will create all necessary tables in your Supabase database.

### ✅ Option 2: Use the Batch Script (Windows)

Double-click the `setup-database.bat` file in the `flipbook-drm` folder.

### ✅ Option 3: Manual SQL (If above options don't work)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Paste and run this SQL:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'SUBSCRIBER',
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  "emailVerificationToken" TEXT UNIQUE,
  "emailVerificationExpires" TIMESTAMP(3),
  "passwordResetToken" TEXT UNIQUE,
  "passwordResetExpires" TIMESTAMP(3),
  "stripeCustomerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create documents table
CREATE TABLE IF NOT EXISTS "documents" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "ownerId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "pageCount" INTEGER NOT NULL DEFAULT 0,
  "hasPassphrase" BOOLEAN NOT NULL DEFAULT false,
  "passphraseHash" TEXT,
  "storageKey" TEXT NOT NULL,
  "shareKey" TEXT UNIQUE,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "tilePrefix" TEXT,
  "drmOptions" TEXT NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "totalPages" INTEGER,
  "processingStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "textExtracted" BOOLEAN NOT NULL DEFAULT false,
  "fileSize" BIGINT,
  "mimeType" TEXT,
  "originalFilename" TEXT,
  FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL UNIQUE,
  "status" TEXT NOT NULL,
  "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
  "plan" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create orders table
CREATE TABLE IF NOT EXISTS "orders" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "razorpayOrderId" TEXT UNIQUE,
  "razorpayPaymentId" TEXT UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
```

## Verify the Fix

After running any of the above options:

1. **Check Supabase Dashboard**
   - Go to Table Editor
   - You should now see tables: `users`, `documents`, `subscriptions`, `orders`, etc.

2. **Test Registration**
   - Visit: https://flip-book-drm.vercel.app/auth/sign-up
   - Try creating a new account
   - It should work now!

3. **Test Login**
   - Visit: https://flip-book-drm.vercel.app/auth/sign-in
   - Login with your newly created account

## What Changed

I've updated the registration endpoint to provide better error messages:

- If tables don't exist, you'll get a clear message with instructions
- Detailed logging helps identify issues faster
- Better error handling for common database issues

## Still Having Issues?

If you're still experiencing problems:

1. **Check your DATABASE_URL**
   - Make sure it's correctly set in Vercel environment variables
   - Format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`

2. **Check Vercel Logs**
   - Go to Vercel Dashboard → Your Project → Logs
   - Look for detailed error messages from the registration endpoint

3. **Verify Supabase Connection**
   - Make sure your Supabase project is active
   - Check that the database password is correct

## Need Help?

The registration endpoint now logs detailed information. Check:
- Browser console (F12 → Console tab)
- Vercel function logs
- Supabase logs

All errors will include specific details about what went wrong.
