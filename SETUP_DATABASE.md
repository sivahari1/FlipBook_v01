# Database Setup Instructions

## Problem
Your Supabase database exists but has no tables, causing registration and login to fail.

## Solution
You need to apply the Prisma schema to your Supabase database.

## Steps

### Option 1: Using Prisma DB Push (Recommended for Quick Fix)

1. Open your terminal in the `flipbook-drm` directory

2. Run the following command:
```bash
npx prisma db push
```

This will:
- Read your `prisma/schema.prisma` file
- Create all necessary tables in your Supabase database
- Set up all relationships and indexes

### Option 2: Using Prisma Migrate (For Production)

1. Open your terminal in the `flipbook-drm` directory

2. Run:
```bash
npx prisma migrate deploy
```

This will apply all existing migrations to your database.

## Verify Setup

After running either command, you can verify the setup by:

1. Going to your Supabase dashboard
2. Navigate to the Table Editor
3. You should now see tables like: `users`, `documents`, `subscriptions`, etc.

## Test Registration

Once tables are created:

1. Visit your deployed app: https://flip-book-drm.vercel.app
2. Try to register a new account
3. Registration should now work!

## Troubleshooting

If you get an error about DATABASE_URL:
- Make sure your `.env.local` file has the correct DATABASE_URL
- The format should be: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`

If tables are created but registration still fails:
- Check the Vercel logs for detailed error messages
- The registration endpoint now has detailed logging

## Alternative: Manual SQL Execution

If the above doesn't work, you can manually create the users table:

1. Go to Supabase Dashboard → SQL Editor
2. Run this SQL:

```sql
CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT NOT NULL PRIMARY KEY,
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
```

3. Then try registration again
