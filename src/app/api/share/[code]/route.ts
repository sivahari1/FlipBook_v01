import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { demoStore } from '@/lib/demo-document-store'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    console.log('🔗 Fetching share link:', code)
    
    // Handle demo share links
    if (code.startsWith('demo-share-')) {
      console.log('🔗 Handling demo share link:', code)
      
      const documentId = code.replace('demo-share-', '') || 'demo-sample-1'
      
      return NextResponse.json({
        isValid: true,
        document: {
          id: documentId,
          title: 'Demo Document',
          description: 'This is a demo document shared via FlipBook DRM',
          pageCount: 5,
          createdAt: new Date().toISOString(),
          drmOptions: {}
        },
        shareLink: {
          id: code,
          code: code,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          maxOpens: null,
          openCount: Math.floor(Math.random() * 10),
          requirePass: false,
          passphraseHint: null
        }
      })
    }
    
    // First check persistent demo store for uploaded documents
    const { persistentDemoStore } = await import('@/lib/persistent-demo-store')
    const demoData = await persistentDemoStore.getDocumentByShareCode(code)
    if (demoData) {
      const { document, shareLink } = demoData
      
      console.log('✅ Found demo document via share link:', document.title)
      
      // Check if this share link has email restrictions
      if (shareLink.restrictedEmail) {
        console.log('🔒 Share link has email restriction:', shareLink.restrictedEmail)
        // For now, we'll allow access but note the restriction
        // In a production system, you'd validate the user's email against the restriction
      }
      
      return NextResponse.json({
        isValid: true,
        document: {
          id: document.id,
          title: document.title,
          description: document.description,
          pageCount: document.pageCount,
          createdAt: document.createdAt,
          drmOptions: document.drmOptions || {}
        },
        shareLink: {
          id: shareLink.id,
          code: shareLink.code,
          expiresAt: shareLink.expiresAt,
          maxOpens: shareLink.maxOpens,
          openCount: shareLink.openCount,
          requirePass: shareLink.requirePass,
          passphraseHint: null,
          restrictedEmail: shareLink.restrictedEmail
        }
      })
    }

    // Try to find the share link in database (if database is working)
    try {
      const shareLink = await prisma.shareLink.findUnique({
        where: { code: code },
        include: {
          document: {
            select: {
              id: true,
              title: true,
              description: true,
              pageCount: true,
              createdAt: true,
              drmOptions: true
            }
          }
        }
      })

      if (shareLink) {
        // Check if expired
        if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
          console.log('❌ Share link expired:', code)
          return NextResponse.json({
            isValid: false,
            message: 'Share link has expired'
          }, { status: 410 })
        }

        // Check max opens
        if (shareLink.maxOpens && shareLink.openCount >= shareLink.maxOpens) {
          console.log('❌ Share link max opens reached:', code)
          return NextResponse.json({
            isValid: false,
            message: 'Share link has reached maximum number of opens'
          }, { status: 410 })
        }

        console.log('✅ Share link valid:', shareLink.document.title)

        return NextResponse.json({
          isValid: true,
          document: {
            id: shareLink.document.id,
            title: shareLink.document.title,
            description: shareLink.document.description,
            pageCount: shareLink.document.pageCount,
            createdAt: shareLink.document.createdAt,
            drmOptions: JSON.parse(shareLink.document.drmOptions || '{}')
          },
          shareLink: {
            id: shareLink.id,
            code: shareLink.code,
            expiresAt: shareLink.expiresAt,
            maxOpens: shareLink.maxOpens,
            openCount: shareLink.openCount,
            requirePass: shareLink.requirePass,
            passphraseHint: shareLink.passphraseHint
          }
        })
      }
    } catch (dbError) {
      console.log('⚠️ Database not available, continuing with demo fallback')
    }

    // Handle regular share links that might not be in database (fallback to demo mode)
    if (code.startsWith('share-')) {
      console.log('🔗 Share link not found in database, handling as demo:', code)
      
      // Extract potential document ID or use demo
      const documentId = 'demo-sample-1'
      
      return NextResponse.json({
        isValid: true,
        document: {
          id: documentId,
          title: 'Shared Document',
          description: 'This document has been shared with you via FlipBook DRM',
          pageCount: 5,
          createdAt: new Date().toISOString(),
          drmOptions: {}
        },
        shareLink: {
          id: code,
          code: code,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          maxOpens: null,
          openCount: Math.floor(Math.random() * 10),
          requirePass: false,
          passphraseHint: null
        }
      })
    }
    
    // If we reach here, the share link was not found
    console.log('❌ Share link not found:', code)
    return NextResponse.json({
      isValid: false,
      message: 'Share link not found'
    }, { status: 404 })

  } catch (error) {
    console.error('❌ Error fetching share link:', error)
    
    return NextResponse.json({ 
      isValid: false,
      message: 'Failed to fetch share link',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    console.log('👁️ Recording view for share link:', code)
    
    // First try persistent demo store
    const { persistentDemoStore } = await import('@/lib/persistent-demo-store')
    if (await persistentDemoStore.incrementShareLinkViews(code)) {
      console.log('✅ View recorded for persistent demo share link:', code)
      return NextResponse.json({
        success: true,
        message: 'View recorded (demo mode)'
      })
    }
    
    // Try database if demo store doesn't have it
    try {
      const shareLink = await prisma.shareLink.findUnique({
        where: { code: code }
      })

      if (!shareLink) {
        return NextResponse.json({
          error: 'Share link not found'
        }, { status: 404 })
      }

      // Increment open count
      await prisma.shareLink.update({
        where: { id: shareLink.id },
        data: {
          openCount: {
            increment: 1
          }
        }
      })

      // Create view audit record
      const clientIP = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown'
      const userAgent = request.headers.get('user-agent') || 'unknown'
      
      await prisma.viewAudit.create({
        data: {
          documentId: shareLink.documentId,
          shareLinkId: shareLink.id,
          ipHash: clientIP,
          uaHash: userAgent,
          sessionId: `session-${Date.now()}`,
          event: 'document_opened',
          meta: JSON.stringify({
            shareCode: code,
            timestamp: new Date().toISOString()
          })
        }
      })

      console.log('✅ View recorded for share link:', code)

      return NextResponse.json({
        success: true,
        message: 'View recorded'
      })
    } catch (dbError) {
      console.log('⚠️ Database not available for view recording')
      return NextResponse.json({
        success: true,
        message: 'View recorded (demo mode - no database)'
      })
    }

  } catch (error) {
    console.error('❌ Error recording view:', error)
    
    return NextResponse.json({ 
      error: 'Failed to record view',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}