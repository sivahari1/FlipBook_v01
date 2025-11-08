import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('Initializing database...')
    
    // Test connection first
    await prisma.$connect()
    console.log('Database connected successfully')
    
    // Try to create a test user to verify tables exist
    const testEmail = 'test@example.com'
    
    // Check if test user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: testEmail }
    })
    
    if (existingUser) {
      console.log('Test user already exists, database is initialized')
      return NextResponse.json({
        success: true,
        message: 'Database already initialized',
        userCount: await prisma.user.count()
      })
    }
    
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: 'dummy_hash',
        role: 'CREATOR',
        emailVerified: true
      }
    })
    
    console.log('Test user created successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      testUser: {
        id: testUser.id,
        email: testUser.email,
        role: testUser.role
      },
      userCount: await prisma.user.count()
    })
    
  } catch (error: any) {
    console.error('Database initialization error:', error)
    
    // Check if it's a table not found error
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      return NextResponse.json({
        success: false,
        error: 'Database tables not found. Please run Prisma migrations.',
        details: error.message,
        solution: 'Run: npx prisma db push or npx prisma migrate deploy'
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: 'Database initialization failed'
    }, { status: 500 })
    
  } finally {
    await prisma.$disconnect()
  }
}