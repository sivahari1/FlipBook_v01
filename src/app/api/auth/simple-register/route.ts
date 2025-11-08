import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== SIMPLE REGISTER START ===')
    
    // Step 1: Parse request body
    let body
    try {
      body = await request.json()
      console.log('Request body parsed:', { email: body.email, hasPassword: !!body.password })
    } catch (error) {
      console.error('Failed to parse request body:', error)
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { email, password } = body

    if (!email || !password) {
      console.log('Missing email or password')
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Step 2: Test environment variables
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET
    }
    console.log('Environment check:', envCheck)

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ 
        error: 'Database not configured',
        envCheck 
      }, { status: 500 })
    }

    // Step 3: Test database connection
    let prisma
    try {
      const { prisma: prismaClient } = await import('@/lib/db')
      prisma = prismaClient
      console.log('Prisma client imported successfully')
    } catch (error) {
      console.error('Failed to import Prisma:', error)
      return NextResponse.json({ 
        error: 'Database client error',
        details: error.message 
      }, { status: 500 })
    }

    // Step 4: Test database connection
    try {
      await prisma.$connect()
      console.log('Database connected successfully')
    } catch (error) {
      console.error('Database connection failed:', error)
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: error.message 
      }, { status: 500 })
    }

    // Step 5: Check if user exists
    let existingUser
    try {
      existingUser = await prisma.user.findUnique({
        where: { email }
      })
      console.log('User lookup completed:', { exists: !!existingUser })
    } catch (error) {
      console.error('User lookup failed:', error)
      return NextResponse.json({ 
        error: 'Database query failed',
        details: error.message 
      }, { status: 500 })
    }

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    // Step 6: Hash password
    let hashedPassword
    try {
      const bcrypt = await import('bcryptjs')
      hashedPassword = await bcrypt.default.hash(password, 12)
      console.log('Password hashed successfully')
    } catch (error) {
      console.error('Password hashing failed:', error)
      return NextResponse.json({ 
        error: 'Password processing failed',
        details: error.message 
      }, { status: 500 })
    }

    // Step 7: Create user
    let newUser
    try {
      newUser = await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          emailVerified: true,
          role: 'CREATOR'
        }
      })
      console.log('User created successfully:', { id: newUser.id, email: newUser.email })
    } catch (error) {
      console.error('User creation failed:', error)
      return NextResponse.json({ 
        error: 'User creation failed',
        details: error.message 
      }, { status: 500 })
    }

    // Step 8: Cleanup
    try {
      await prisma.$disconnect()
      console.log('Database disconnected')
    } catch (error) {
      console.error('Database disconnect failed:', error)
    }

    console.log('=== SIMPLE REGISTER SUCCESS ===')
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role
      }
    })

  } catch (error: any) {
    console.error('=== SIMPLE REGISTER ERROR ===', error)
    return NextResponse.json({
      error: 'Registration failed',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}