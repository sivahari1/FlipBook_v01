# 🔧 Vercel Environment Variables Setup

## Database Connection URLs

You need to set **TWO** database environment variables in Vercel:

### 1. DATABASE_URL (Pooled Connection via PgBouncer)
This is used for regular application queries. It uses connection pooling for better performance.

**Variable Name:** `DATABASE_URL`

**Value:**
```
postgresql://postgres:FlipBook123%21@db.dkxzlgfordrunpkpvzpr.supabase.co:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1
```

### 2. DIRECT_URL (Direct Connection)
This is used for Prisma migrations and schema operations that don't work with connection pooling.

**Variable Name:** `DIRECT_URL`

**Value:**
```
postgresql://postgres:FlipBook123%21@db.dkxzlgfordrunpkpvzpr.supabase.co:5432/postgres?sslmode=require
```

---

## 📝 How to Set These in Vercel

### Step 1: Go to Vercel Dashboard
1. Visit: https://vercel.com/jsrkrishnas-projects/flip-book-v01
2. Click on **Settings** tab
3. Click on **Environment Variables** in the left sidebar

### Step 2: Add DATABASE_URL
1. Click **Add New** button
2. **Name:** `DATABASE_URL`
3. **Value:** Paste the DATABASE_URL from above
4. **Environments:** Check all three:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Click **Save**

### Step 3: Add DIRECT_URL
1. Click **Add New** button again
2. **Name:** `DIRECT_URL`
3. **Value:** Paste the DIRECT_URL from above
4. **Environments:** Check all three:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Click **Save**

### Step 4: Redeploy
1. Go to **Deployments** tab
2. Click the **three dots (•••)** on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

---

## 🔍 Understanding the Difference

### DATABASE_URL (Port 6543 - PgBouncer)
- **Purpose:** Regular application queries
- **Connection:** Pooled via PgBouncer
- **Benefits:** Better performance, handles many concurrent connections
- **Limitation:** Doesn't support some Prisma operations

### DIRECT_URL (Port 5432 - Direct)
- **Purpose:** Migrations, schema operations
- **Connection:** Direct to PostgreSQL
- **Benefits:** Full PostgreSQL feature support
- **Use Case:** Database setup, migrations, schema changes

---

## ✅ After Setting Variables

Once both variables are set and you've redeployed:

### 1. Initialize Database Tables
Go to Supabase SQL Editor and run the SQL from `database-setup.sql`

### 2. Test Registration
Visit: https://flip-book-v01.vercel.app/auth/register

Try registering with:
- Email: test@example.com
- Password: Test123456!

Should work perfectly! ✅

---

## 🔐 Security Note

The password `FlipBook123!` is URL-encoded as `FlipBook123%21` because:
- `!` = `%21` in URL encoding
- This ensures special characters work correctly in connection strings

---

## 📊 Verification

After setup, you can verify the connection by visiting:
- https://flip-book-v01.vercel.app/api/init-database

This will check if the database is accessible and tables exist.

---

## 🆘 Troubleshooting

### If you get "Can't reach database server":
1. Double-check both URLs are copied exactly
2. Make sure `%21` is used instead of `!`
3. Verify both variables are enabled for Production
4. Try redeploying after saving variables

### If registration still fails:
1. Make sure you ran the SQL script in Supabase
2. Check Vercel function logs for specific errors
3. Visit `/api/init-database` to see database status

---

**Once these two variables are set, your database connection will be properly configured!** 🚀
