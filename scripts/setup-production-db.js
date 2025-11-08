#!/usr/bin/env node

/**
 * Production Database Setup Script
 * 
 * This script pushes your Prisma schema to the production database.
 * Run this ONCE after deploying to Vercel to create all database tables.
 * 
 * Usage:
 *   node scripts/setup-production-db.js
 * 
 * Or with npm:
 *   npm run setup:prod-db
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Setting up production database...\n');

try {
  // Check if .env.production exists
  const fs = require('fs');
  const envPath = path.join(__dirname, '..', '.env.production');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ Error: .env.production file not found!');
    console.log('\n📝 Please create .env.production with your DATABASE_URL');
    console.log('Example:');
    console.log('DATABASE_URL="postgresql://user:password@host:5432/database"');
    process.exit(1);
  }

  console.log('✅ Found .env.production file');
  console.log('📊 Pushing Prisma schema to production database...\n');

  // Run prisma db push with production environment
  execSync('npx prisma db push --skip-generate', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: require('dotenv').config({ path: envPath }).parsed.DATABASE_URL
    }
  });

  console.log('\n✅ Production database setup complete!');
  console.log('\n🎉 Your database is now ready. You can:');
  console.log('   1. Register users at: https://your-app.vercel.app/auth/register');
  console.log('   2. Sign in at: https://your-app.vercel.app/auth/sign-in');
  console.log('   3. Start using your application!');

} catch (error) {
  console.error('\n❌ Error setting up production database:', error.message);
  console.log('\n💡 Troubleshooting:');
  console.log('   1. Make sure your DATABASE_URL in .env.production is correct');
  console.log('   2. Check that your database is accessible');
  console.log('   3. Verify your database credentials');
  process.exit(1);
}
