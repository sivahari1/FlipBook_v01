#!/usr/bin/env node

// Build script for deployment that handles database connection issues
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting deployment build...');

// Create a temporary .env file for build
const buildEnv = `
# Temporary build environment
NODE_ENV=production
SKIP_DATABASE_DURING_BUILD=true
DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
NEXTAUTH_SECRET=build-time-secret-placeholder
NEXTAUTH_URL=https://placeholder.vercel.app
`;

const envPath = path.join(__dirname, '.env.build');
fs.writeFileSync(envPath, buildEnv);

try {
  console.log('📦 Building Next.js application...');
  
  // Set environment variables and run build
  const env = {
    ...process.env,
    NODE_ENV: 'production',
    SKIP_DATABASE_DURING_BUILD: 'true',
    DATABASE_URL: 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
    NEXTAUTH_SECRET: 'build-time-secret-placeholder',
    NEXTAUTH_URL: 'https://placeholder.vercel.app'
  };

  execSync('npx next build', { 
    stdio: 'inherit',
    env: env
  });
  
  console.log('✅ Build completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} finally {
  // Clean up temporary env file
  if (fs.existsSync(envPath)) {
    fs.unlinkSync(envPath);
  }
}

console.log('🎉 Deployment build ready!');