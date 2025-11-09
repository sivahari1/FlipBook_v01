import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Registration attempt started')
    const { email, password, name } = await request.json()
    console.log('📧 Email:', email)

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    console.log('🔌 Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connected successfully')

    // Check if user already exists
    console.log('👤 Checking if user exists...')
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    console.log('👤 Existing user check result:', existingUser ? 'EXISTS' : 'NOT_FOUND')

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    console.log('🔐 Hashing password...')
    const hashedPassword = await bcrypt.hash(password, 12)
    console.log('✅ Password hashed successfully')

    // Create user
    console.log('👤 Creating user in database...')
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        emailVerified: true, // For simplicity, auto-verify
        role: 'CREATOR'
      }
    })
    console.log('✅ User created successfully:', user.id)

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    })

  } catch (error: any) {
    console.error('❌ Registration error:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    
    // Check if it's a database table issue
    if (error.code === 'P2021' || (error.message && error.message.includes('relation') && error.message.includes('does not exist'))) {
      console.log('⚠️ Database tables do not exist!')
      
      return NextResponse.json(
        { 
          error: 'Database not initialized',
          message: 'The database tables have not been created yet. Please run: npx prisma db push',
          instructions: [
            '1. Open terminal in the flipbook-drm directory',
            '2. Run: npx prisma db push',
            '3. This will create all necessary tables',
            '4. Then try registration again'
          ],
          technicalDetails: error.message
        },
        { status: 503 }
      )
    }
    
    // Check for unique constraint violation (user already exists)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { 
          error: 'User already exists',
          message: 'An account with this email already exists'
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create user',
        message: 'An unexpected error occurred during registration',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    )
  }
}