import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    console.log('🔧 Starting database table creation...')
    
    // First, let's check what tables exist
    const existingTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    console.log('📋 Existing tables:', existingTables)
    
    // Create the users table with all necessary fields
    console.log('👤 Creating users table...')
    
    // First, create the cuid generation function if it doesn't exist
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION generate_cuid() RETURNS TEXT AS $$
      DECLARE
        timestamp_part TEXT;
        counter_part TEXT;
        random_part TEXT;
      BEGIN
        timestamp_part := to_char(floor(extract(epoch from now()) * 1000)::bigint, 'FM0000000000000');
        counter_part := lpad(floor(random() * 1000)::text, 3, '0');
        random_part := substr(md5(random()::text), 1, 8);
        RETURN 'c' || substring(timestamp_part from 2) || counter_part || random_part;
      END;
      $$ LANGUAGE plpgsql;
    `
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT NOT NULL DEFAULT generate_cuid(),
        "email" TEXT NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'SUBSCRIBER',
        "emailVerified" BOOLEAN NOT NULL DEFAULT false,
        "emailVerificationToken" TEXT,
        "emailVerificationExpires" TIMESTAMP(3),
        "passwordResetToken" TEXT,
        "passwordResetExpires" TIMESTAMP(3),
        "stripeCustomerId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "users_pkey" PRIMARY KEY ("id")
      );
    `
    
    // Create unique indexes
    console.log('🔗 Creating indexes...')
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
    `
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "users_emailVerificationToken_key" ON "users"("emailVerificationToken");
    `
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "users_passwordResetToken_key" ON "users"("passwordResetToken");
    `
    
    // Create documents table
    console.log('📄 Creating documents table...')
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "documents" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "title" TEXT NOT NULL,
        "filename" TEXT NOT NULL,
        "fileSize" INTEGER NOT NULL,
        "mimeType" TEXT NOT NULL,
        "uploadedById" TEXT NOT NULL,
        "shareKey" TEXT,
        "isPublic" BOOLEAN NOT NULL DEFAULT false,
        "downloadEnabled" BOOLEAN NOT NULL DEFAULT true,
        "watermarkText" TEXT,
        "expiresAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
      );
    `
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "documents_shareKey_key" ON "documents"("shareKey");
    `
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "documents_uploadedById_idx" ON "documents"("uploadedById");
    `
    
    // Add foreign key constraint
    await prisma.$executeRaw`
      ALTER TABLE "documents" 
      ADD CONSTRAINT "documents_uploadedById_fkey" 
      FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `
    
    // Check final table status
    const finalTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    console.log('✅ Final tables:', finalTables)
    
    return NextResponse.json({
      success: true,
      message: 'Database tables created successfully',
      tables: finalTables
    })
    
  } catch (error: any) {
    console.error('❌ Database setup error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create database tables',
      details: error.message
    }, { status: 500 })
  }
}