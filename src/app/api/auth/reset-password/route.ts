import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Password reset request received')
    const { token, password } = await request.json()

    console.log('📋 Request data:', {
      hasToken: !!token,
      tokenLength: token?.length,
      hasPassword: !!password,
      passwordLength: password?.length
    })

    if (!token || !password) {
      console.log('❌ Missing token or password')
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      console.log('❌ Password too short')
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    console.log('🔍 Looking for user with reset token...')
    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date() // Token must not be expired
        }
      }
    })

    console.log('👤 User found:', user ? `${user.email} (ID: ${user.id})` : 'None')

    if (!user) {
      console.log('❌ Invalid or expired reset token')
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    console.log('🔐 Hashing new password...')
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    console.log('💾 Updating user password...')
    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    })

    console.log('✅ Password reset successful for user:', user.email)
    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully'
    })

  } catch (error) {
    console.error('❌ Reset password error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}