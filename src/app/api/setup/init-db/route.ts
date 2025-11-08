import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== DATABASE INITIALIZATION START ===')
    
    // Import Prisma client
    const { prisma } = await import('@/lib/db')
    
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Check if User table already exists
    try {
      const userCount = await prisma.user.count()
      console.log(`✅ Database already initialized. User count: ${userCount}`)
      
      return NextResponse.json({
        success: true,
        message: 'Database already initialized',
        userCount,
        status: 'ready'
      })
    } catch (error: any) {
      console.log('❌ User table does not exist, creating database schema...')
      
      // Create the database schema using Prisma's push command equivalent
      try {
        // Use raw SQL to create the essential User table
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "users" (
            "id" TEXT NOT NULL,
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
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "users_pkey" PRIMARY KEY ("id")
          );
        `
        
        // Create unique indexes
        await prisma.$executeRaw`
          CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
        `
        
        await prisma.$executeRaw`
          CREATE UNIQUE INDEX IF NOT EXISTS "users_emailVerificationToken_key" ON "users"("emailVerificationToken");
        `
        
        await prisma.$executeRaw`
          CREATE UNIQUE INDEX IF NOT EXISTS "users_passwordResetToken_key" ON "users"("passwordResetToken");
        `
        
        console.log('✅ User table created successfully')
        
        // Test that the table works
        const userCount = await prisma.user.count()
        console.log(`✅ User table verified. Count: ${userCount}`)
        
        return NextResponse.json({
          success: true,
          message: 'Database initialized successfully',
          userCount,
          status: 'created'
        })
        
      } catch (createError: any) {
        console.error('❌ Failed to create database schema:', createError)
        return NextResponse.json({
          success: false,
          error: 'Failed to create database schema',
          details: createError.message
        }, { status: 500 })
      }
    }
    
  } catch (error: any) {
    console.error('❌ Database initialization failed:', error)
    
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