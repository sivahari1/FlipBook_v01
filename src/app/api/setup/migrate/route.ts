import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== DATABASE MIGRATION START ===')
    
    // Import Prisma client
    const { prisma } = await import('@/lib/db')
    
    // Test database connection
    await prisma.$connect()
    console.log('Database connected successfully')
    
    // Try to run a simple query to check if tables exist
    try {
      const userCount = await prisma.user.count()
      console.log(`Database tables exist. User count: ${userCount}`)
      
      return NextResponse.json({
        success: true,
        message: 'Database is already set up',
        userCount
      })
    } catch (error: any) {
      console.log('Tables do not exist, need to create them')
      
      // If tables don't exist, we need to run migrations
      // In production, this should be done via build process
      return NextResponse.json({
        success: false,
        error: 'Database tables not found',
        message: 'Please run: npx prisma migrate deploy',
        details: error.message
      }, { status: 500 })
    }
    
  } catch (error: any) {
    console.error('Database migration check failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: error.message
    }, { status: 500 })
  }
}