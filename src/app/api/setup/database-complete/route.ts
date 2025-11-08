import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== COMPLETE DATABASE SETUP START ===')
    
    // Import Prisma client
    const { prisma } = await import('@/lib/db')
    
    // Test database connection first
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Check if tables already exist
    try {
      const userCount = await prisma.user.count()
      console.log(`✅ Database tables already exist. User count: ${userCount}`)
      
      return NextResponse.json({
        success: true,
        message: 'Database is already set up and working',
        userCount,
        tablesExist: true
      })
    } catch (error: any) {
      console.log('❌ Tables do not exist, creating them...')
      
      // Create tables using raw SQL
      try {
        // Create User table
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "User" (
            "id" TEXT NOT NULL,
            "email" TEXT NOT NULL,
            "passwordHash" TEXT,
            "name" TEXT,
            "emailVerified" BOOLEAN NOT NULL DEFAULT false,
            "role" TEXT NOT NULL DEFAULT 'CREATOR',
            "subscriptionTier" TEXT NOT NULL DEFAULT 'FREE',
            "subscriptionStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
            "subscriptionExpiresAt" TIMESTAMP(3),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "User_pkey" PRIMARY KEY ("id")
          );
        `
        
        // Create unique index on email
        await prisma.$executeRaw`
          CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
        `
        
        // Create Document table
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "Document" (
            "id" TEXT NOT NULL,
            "title" TEXT NOT NULL,
            "filename" TEXT NOT NULL,
            "fileSize" INTEGER NOT NULL,
            "mimeType" TEXT NOT NULL,
            "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "ownerId" TEXT NOT NULL,
            "isPublic" BOOLEAN NOT NULL DEFAULT false,
            "shareKey" TEXT,
            "downloadCount" INTEGER NOT NULL DEFAULT 0,
            "viewCount" INTEGER NOT NULL DEFAULT 0,
            "watermarkText" TEXT,
            "watermarkEnabled" BOOLEAN NOT NULL DEFAULT false,
            "expiresAt" TIMESTAMP(3),
            "maxViews" INTEGER,
            "requiresAuth" BOOLEAN NOT NULL DEFAULT false,

            CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
          );
        `
        
        // Create indexes for Document table
        await prisma.$executeRaw`
          CREATE INDEX IF NOT EXISTS "Document_ownerId_idx" ON "Document"("ownerId");
        `
        
        await prisma.$executeRaw`
          CREATE UNIQUE INDEX IF NOT EXISTS "Document_shareKey_key" ON "Document"("shareKey");
        `
        
        // Create DocumentView table
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "DocumentView" (
            "id" TEXT NOT NULL,
            "documentId" TEXT NOT NULL,
            "viewerId" TEXT,
            "ipAddress" TEXT,
            "userAgent" TEXT,
            "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "duration" INTEGER,
            "pagesViewed" INTEGER,

            CONSTRAINT "DocumentView_pkey" PRIMARY KEY ("id")
          );
        `
        
        // Create index for DocumentView
        await prisma.$executeRaw`
          CREATE INDEX IF NOT EXISTS "DocumentView_documentId_idx" ON "DocumentView"("documentId");
        `
        
        console.log('✅ Database tables created successfully')
        
        // Test that tables work
        const userCount = await prisma.user.count()
        const docCount = await prisma.document.count()
        
        console.log(`✅ Tables verified - Users: ${userCount}, Documents: ${docCount}`)
        
        return NextResponse.json({
          success: true,
          message: 'Database tables created successfully',
          userCount,
          documentCount: docCount,
          tablesCreated: true
        })
        
      } catch (createError: any) {
        console.error('❌ Failed to create tables:', createError)
        return NextResponse.json({
          success: false,
          error: 'Failed to create database tables',
          details: createError.message
        }, { status: 500 })
      }
    }
    
  } catch (error: any) {
    console.error('❌ Database setup failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: error.message,
      suggestion: 'Check DATABASE_URL environment variable'
    }, { status: 500 })
  } finally {
    try {
      await prisma.$disconnect()
    } catch (e) {
      console.log('Disconnect error (non-critical):', e)
    }
  }
}