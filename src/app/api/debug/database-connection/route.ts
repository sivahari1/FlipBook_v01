import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    console.log('Testing database connection...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Test if we can query the database
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Database query successful:', result)
    
    // Check if users table exists
    try {
      const tableCheck = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
      `
      console.log('Users table check:', tableCheck)
      
      if (Array.isArray(tableCheck) && tableCheck.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'Database connected but users table does not exist',
          connection: 'OK',
          usersTable: 'MISSING'
        })
      }
      
      // Try to count users
      const userCount = await prisma.user.count()
      console.log('✅ Users table accessible, count:', userCount)
      
      return NextResponse.json({
        success: true,
        message: 'Database connection and users table working',
        connection: 'OK',
        usersTable: 'EXISTS',
        userCount
      })
      
    } catch (tableError: any) {
      console.error('Users table error:', tableError)
      return NextResponse.json({
        success: false,
        message: 'Database connected but users table has issues',
        connection: 'OK',
        usersTable: 'ERROR',
        error: tableError.message
      })
    }
    
  } catch (error: any) {
    console.error('Database connection error:', error)
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      connection: 'FAILED',
      error: error.message
    }, { status: 500 })
  }
}