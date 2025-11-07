import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export async function POST() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔧 Initializing Prisma and creating tables...')
    
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connected')
    
    // The easiest way is to just let Prisma handle it
    // We'll create a test user to trigger table creation
    try {
      // Try to query - this will fail if tables don't exist
      await prisma.user.findFirst()
      console.log('✅ Tables already exist')
      
      return NextResponse.json({
        success: true,
        message: 'Database tables already exist'
      })
    } catch (error: any) {
      // Tables don't exist, we need to create them
      console.log('📋 Tables do not exist, need to run migrations')
      
      return NextResponse.json({
        success: false,
        message: 'Database tables do not exist. You need to run: npx prisma db push',
        error: 'Tables missing',
        instructions: [
          '1. Open your terminal',
          '2. Navigate to the flipbook-drm directory',
          '3. Run: npx prisma db push',
          '4. This will create all necessary tables in your Supabase database'
        ]
      }, { status: 400 })
    }
    
  } catch (error: any) {
    console.error('❌ Database error:', error)
    return NextResponse.json({
      success: false,
      error: 'Database connection or initialization failed',
      details: error.message
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
