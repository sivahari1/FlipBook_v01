import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('=== AUTHENTICATION DEBUG STATUS ===')
    
    // Check environment variables
    const envStatus = {
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'Not set',
      NODE_ENV: process.env.NODE_ENV
    }
    
    console.log('Environment variables:', envStatus)
    
    // Test database connection
    let dbStatus = {
      connected: false,
      error: null,
      tablesExist: false,
      userCount: 0
    }
    
    try {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      
      // Test connection
      await prisma.$connect()
      dbStatus.connected = true
      console.log('✅ Database connected')
      
      // Test if User table exists
      try {
        const userCount = await prisma.user.count()
        dbStatus.tablesExist = true
        dbStatus.userCount = userCount
        console.log(`✅ User table exists with ${userCount} users`)
      } catch (error: any) {
        console.log('❌ User table does not exist:', error.message)
        dbStatus.error = error.message
      }
      
      await prisma.$disconnect()
      
    } catch (error: any) {
      console.error('❌ Database connection failed:', error)
      dbStatus.error = error.message
    }
    
    // Test bcrypt availability
    let bcryptStatus = {
      available: false,
      error: null
    }
    
    try {
      const bcrypt = await import('bcryptjs')
      const testHash = await bcrypt.hash('test', 12)
      bcryptStatus.available = true
      console.log('✅ bcryptjs working')
    } catch (error: any) {
      console.error('❌ bcryptjs error:', error)
      bcryptStatus.error = error.message
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envStatus,
      database: dbStatus,
      bcrypt: bcryptStatus,
      recommendations: [
        !dbStatus.connected ? 'Database connection failed - check DATABASE_URL' : null,
        !dbStatus.tablesExist ? 'User table missing - run database migrations' : null,
        !bcryptStatus.available ? 'bcryptjs not working - check dependencies' : null,
        !envStatus.NEXTAUTH_SECRET ? 'NEXTAUTH_SECRET not set' : null
      ].filter(Boolean)
    })
    
  } catch (error: any) {
    console.error('❌ Auth debug failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}