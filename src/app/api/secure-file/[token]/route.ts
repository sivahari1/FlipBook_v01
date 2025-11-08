import { NextRequest, NextResponse } from 'next/server'
import { getSecureStorageProvider } from '@/lib/secure-storage'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    // Check if token exists and is valid (for local storage)
    if (global.tempTokens) {
      const tokenData = global.tempTokens.get(token)
      
      if (!tokenData) {
        return new NextResponse('Invalid or expired token', { status: 404 })
      }
      
      if (tokenData.expiresAt < Date.now()) {
        global.tempTokens.delete(token)
        return new NextResponse('Token expired', { status: 410 })
      }
      
      // Get file from secure storage
      const storage = getSecureStorageProvider()
      const fileBuffer = await storage.getFileBuffer(tokenData.key)
      
      // Clean up token after use (optional - could allow multiple uses within expiry)
      // global.tempTokens.delete(token)
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    }
    
    return new NextResponse('Token not found', { status: 404 })
    
  } catch (error) {
    console.error('Error serving secure file:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}