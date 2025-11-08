import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    console.log('🔧 Initializing database...')
    
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connected')
    
    // Try to create tables using raw SQL
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "passwordHash" TEXT,
        "emailVerified" BOOLEAN NOT NULL DEFAULT false,
        "role" TEXT NOT NULL DEFAULT 'SUBSCRIBER',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Document" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "filename" TEXT NOT NULL,
        "fileSize" INTEGER NOT NULL,
        "mimeType" TEXT NOT NULL,
        "uploadedById" TEXT NOT NULL,
        "shareKey" TEXT UNIQUE,
        "watermarkText" TEXT,
        "expiresAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE
      );
    `)
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DocumentView" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "documentId" TEXT NOT NULL,
        "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE
      );
    `)
    
    console.log('✅ Tables created successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      tables: ['User', 'Document', 'DocumentView']
    })
    
  } catch (error: any) {
    console.error('❌ Database initialization error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      hint: 'Tables may already exist or there might be a connection issue'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
