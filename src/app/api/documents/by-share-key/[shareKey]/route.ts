import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSecureStorageProvider } from '@/lib/secure-storage'
import { isDatabaseConfigured } from '@/lib/database-config'

export async function GET(
  request: NextRequest,
  { params }: { params: { shareKey: string } }
) {
  try {
    const { shareKey } = params
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    console.log(`🔗 Share key access: ${shareKey} from IP: ${clientIp}`)

    // Check if database is configured
    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Service temporarily unavailable'
      }, { status: 503 })
    }

    // Find document by share key
    const document = await prisma.document.findUnique({
      where: { shareKey },
      include: {
        owner: {
          select: { email: true }
        }
      }
    })

    if (!document) {
      console.log(`❌ Document not found for share key: ${shareKey}`)
      return NextResponse.json({
        success: false,
        error: 'Document not found'
      }, { status: 404 })
    }

    console.log(`✅ Document found: ${document.title}`)

    // Generate signed URL for secure access
    const storage = getSecureStorageProvider()
    const signedUrl = await storage.getSignedUrl(document.storageKey, 300) // 5 minutes

    // Increment view count atomically
    const updatedDocument = await prisma.document.update({
      where: { id: document.id },
      data: {
        viewCount: {
          increment: 1
        }
      }
    })

    // Record view in audit trail
    await prisma.documentView.create({
      data: {
        documentId: document.id,
        viewerIp: clientIp,
        sessionId: request.headers.get('x-session-id') || undefined,
        userAgent
      }
    })

    console.log(`📊 View recorded. Total views: ${updatedDocument.viewCount}`)

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        description: document.description,
        pageCount: document.pageCount,
        signedUrl,
        viewCount: updatedDocument.viewCount,
        owner: document.owner.email
      }
    })

  } catch (error) {
    console.error('❌ Error accessing document by share key:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to access document'
    }, { status: 500 })
  }
}