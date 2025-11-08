import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    console.log('Testing database connection...')
    
    // Check if we can connect to the database
    await prisma.$connect()
    console.log('Database connection successful')
    
    // Try to count users (this will fail if tables don't exist)
    const userCount = await prisma.user.count()
    console.log(`User count: ${userCount}`)
    
    // Check if DATABASE_URL is set
    const databaseUrl = process.env.DATABASE_URL
    const hasDbUrl = !!databaseUrl
    const dbUrlMasked = databaseUrl ? databaseUrl.substring(0, 20) + '...' : 'Not set'
    
    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        userCount,
        databaseUrl: dbUrlMasked,
        hasDatabaseUrl: hasDbUrl,
        nodeEnv: process.env.NODE_ENV
      }
    })
    
  } catch (error: any) {
    console.error('Database connection error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      database: {
        connected: false,
        databaseUrl: process.env.DATABASE_URL ? 'Set (masked)' : 'Not set',
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV
      }
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}