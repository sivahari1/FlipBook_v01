import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    console.log('🔧 Checking database connection...')
    
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connected')
    
    // Try a simple query to check if tables exist
    try {
      const userCount = await prisma.user.count()
      console.log(`✅ Database already initialized. User count: ${userCount}`)
      
      return NextResponse.json({
        success: true,
        message: 'Database is already initialized and working',
        userCount,
        status: 'ready'
      })
    } catch (tableError: any) {
      console.log('⚠️ Tables do not exist yet:', tableError.message)
      
      // Tables don't exist - provide instructions
      return NextResponse.json({
        success: false,
        message: 'Database tables need to be created',
        error: 'Tables do not exist',
        instructions: {
          step1: 'You need to run Prisma migrations from your local machine or CI/CD',
          step2: 'Run: npx prisma db push',
          step3: 'Or run: npx prisma migrate deploy',
          alternative: 'You can also use Supabase SQL Editor to run the schema manually'
        },
        technicalDetails: tableError.message
      }, { status: 503 })
    }
    
  } catch (error: any) {
    console.error('❌ Database connection error:', error)
    return NextResponse.json({
      success: false,
      error: 'Cannot connect to database',
      message: error.message,
      hint: 'Check if DATABASE_URL environment variable is set correctly in Vercel'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
