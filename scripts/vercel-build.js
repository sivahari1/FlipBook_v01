#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🚀 Starting Vercel build process...');

try {
  // Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Deploy database migrations (creates tables from migration files)
  console.log('🗄️ Deploying database migrations...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  
  // Build Next.js application
  console.log('🏗️ Building Next.js application...');
  execSync('npx next build', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  
  // If migrate deploy fails, try db push as fallback
  if (error.message.includes('migrate deploy')) {
    console.log('⚠️ Migration deploy failed, trying db push as fallback...');
    try {
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
      execSync('npx next build', { stdio: 'inherit' });
      console.log('✅ Build completed with fallback!');
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError.message);
      process.exit(1);
    }
  } else {
    process.exit(1);
  }
}