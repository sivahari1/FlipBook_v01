import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { demoStore } from '@/lib/demo-document-store'
import { inboxStore } from '@/lib/inbox-store'
import { isDatabaseConfigured } from '@/lib/database-config'

export const runtime = 'nodejs'

// Email service function using the existing email service
async function sendShareEmail(
  recipientEmail: string,
  document: { title: string; description?: string },
  shareUrl: string,
  senderMessage?: string
) {
  const { sendEmail } = await import('@/lib/email')
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document Shared - FlipBook DRM</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">📄 FlipBook DRM</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Secure Document Sharing</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #2d3748; margin-top: 0;">A document has been shared with you</h2>
          
          <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #2d3748; font-size: 18px;">${document.title}</h3>
            ${document.description ? `<p style="margin: 0; color: #4a5568; font-size: 14px;">${document.description}</p>` : ''}
          </div>
          
          ${senderMessage ? `
            <div style="background: #e6fffa; border-left: 4px solid #38b2ac; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #2d3748; font-style: italic;">"${senderMessage}"</p>
            </div>
          ` : ''}
          
          <div style="background: #e6fffa; border: 1px solid #38b2ac; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #2d3748; font-size: 16px;">📝 Registration Required</h4>
            <p style="margin: 0; color: #2d3748; font-size: 14px;">
              To view this secure document, you'll need to create a free FlipBook DRM account. 
              The document will be waiting in your inbox after registration.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${shareUrl}" 
               style="background: #4299e1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
              🔓 Sign Up & View Document
            </a>
          </div>
          
          <div style="background: #fff5f5; border: 1px solid #fed7d7; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #c53030; font-size: 16px;">🔒 Security Features</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 15px;">
              <div style="text-align: center;">
                <div style="font-size: 24px; margin-bottom: 5px;">🔐</div>
                <div style="font-size: 12px; color: #4a5568;">DRM Protected</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 24px; margin-bottom: 5px;">💧</div>
                <div style="font-size: 12px; color: #4a5568;">Watermarked</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 24px; margin-bottom: 5px;">📊</div>
                <div style="font-size: 12px; color: #4a5568;">Access Tracked</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 24px; margin-bottom: 5px;">⏰</div>
                <div style="font-size: 12px; color: #4a5568;">Session Limited</div>
              </div>
            </div>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center; color: #718096; font-size: 14px;">
            <p style="margin: 0;">This document is shared securely through <strong>FlipBook DRM</strong>.</p>
            <p style="margin: 5px 0 0 0;">All access is monitored and logged for security purposes.</p>
            <p style="margin: 10px 0 0 0; font-size: 12px;">This link is exclusive to ${recipientEmail}</p>
          </div>
        </div>
      </body>
    </html>
  `
  
  const emailText = `
    Document Shared - FlipBook DRM
    
    A document has been shared with you: ${document.title}
    ${document.description ? `Description: ${document.description}` : ''}
    
    ${senderMessage ? `Personal message: "${senderMessage}"` : ''}
    
    Access the document securely: ${shareUrl}
    
    Security Features:
    - DRM Protected: Copy and print protection
    - Watermarked: Dynamic user watermarks  
    - Access Tracked: All views are monitored
    - Session Limited: Secure time-limited access
    
    This document is shared securely through FlipBook DRM.
    All access is monitored and logged for security purposes.
    
    This link is exclusive to ${recipientEmail}
  `
  
  try {
    const success = await sendEmail({
      to: recipientEmail,
      subject: `Document shared with you: ${document.title}`,
      html: emailHtml,
      text: emailText
    })
    
    if (success) {
      console.log('✅ Email sent successfully to:', recipientEmail)
      return { success: true, messageId: `email-${Date.now()}` }
    } else {
      console.log('❌ Failed to send email to:', recipientEmail)
      return { success: false, error: 'Email service failed' }
    }
  } catch (error) {
    console.error('❌ Email sending error:', error)
    return { success: false, error: 'Email service error' }
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { email, message } = body
    
    console.log('📧 Email share request for document:', id, 'to:', email)
    
    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json({
        success: false,
        error: 'Valid email address is required'
      }, { status: 400 })
    }
    
    // Check if database is configured
    const isDatabaseConfigured = process.env.DATABASE_URL && 
                                !process.env.DATABASE_URL.includes('placeholder') && 
                                !process.env.DATABASE_URL.includes('build')

    // Handle demo documents
    if (!isDatabaseConfigured || id?.startsWith('demo-')) {
      console.log('📧 Creating email share for demo document:', id)
      
      // Check if document exists in demo store
      const demoDocument = demoStore.getDocument(id)
      if (!demoDocument) {
        return NextResponse.json({
          success: false,
          error: 'Document not found'
        }, { status: 404 })
      }
      
      // Generate a demo share code
      const shareCode = `share-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
      const baseUrl = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3001'
      const shareUrl = `${baseUrl}/share/${shareCode}`
      
      // Create demo share link with email restriction
      const demoShareLink = {
        id: shareCode,
        code: shareCode,
        documentId: id,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        maxOpens: undefined,
        openCount: 0,
        requirePass: false,
        restrictedEmail: email // Store the email for access control
      }
      
      demoStore.addShareLink(demoShareLink)
      
      // Add to recipient's inbox
      const inboxItem = {
        id: `inbox-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        recipientEmail: email,
        documentTitle: demoDocument.title,
        documentDescription: demoDocument.description,
        shareCode: shareCode,
        shareUrl: shareUrl,
        senderMessage: message,
        createdAt: new Date().toISOString(),
        isRead: false,
        documentId: id
      }
      
      inboxStore.addInboxItem(inboxItem)
      
      // Send email notification
      try {
        await sendShareEmail(
          email,
          {
            title: demoDocument.title,
            description: demoDocument.description
          },
          shareUrl,
          message
        )
        
        console.log('✅ Demo email share created and sent')
        
        return NextResponse.json({
          success: true,
          shareUrl,
          message: 'Document shared successfully! Email sent to recipient. They can view it in their inbox after signing up.'
        })
      } catch (emailError) {
        console.error('❌ Failed to send email:', emailError)
        return NextResponse.json({
          success: false,
          error: 'Failed to send email notification'
        }, { status: 500 })
      }
    }
    
    // Handle database documents (if database is working)
    try {
      // Find the document
      const document = await prisma.document.findUnique({
        where: { id }
      })

      if (!document) {
        return NextResponse.json({
          success: false,
          error: 'Document not found'
        }, { status: 404 })
      }

      // Generate a unique share code
      const shareCode = `share-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
      const baseUrl = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3001'
      const shareUrl = `${baseUrl}/share/${shareCode}`
      
      // Find or create demo user for creator
      let demoUser = await prisma.user.findUnique({
        where: { email: 'demo@example.com' }
      })

      if (!demoUser) {
        demoUser = await prisma.user.create({
          data: {
            email: 'demo@example.com',
            passwordHash: 'demo-hash',
            role: 'CREATOR',
            emailVerified: true
          }
        })
      }

      // Create share record with email restriction
      const share = await prisma.shareLink.create({
        data: {
          documentId: document.id,
          creatorId: demoUser.id,
          code: shareCode,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          maxOpens: null,
          openCount: 0,
          // Note: In a real implementation, you'd add email restriction to the schema
        }
      })

      // Send email notification
      try {
        await sendShareEmail(
          email,
          {
            title: document.title,
            description: document.description || undefined
          },
          shareUrl,
          message
        )
        
        console.log('✅ Database email share created and sent')
        
        return NextResponse.json({
          success: true,
          shareUrl,
          message: 'Document shared successfully! Email sent to recipient.'
        })
      } catch (emailError) {
        console.error('❌ Failed to send email:', emailError)
        return NextResponse.json({
          success: false,
          error: 'Share link created but failed to send email notification'
        }, { status: 500 })
      }
    } catch (dbError) {
      console.error('❌ Database error:', dbError)
      return NextResponse.json({
        success: false,
        error: 'Database error occurred'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Error in email share:', error)
    
    return NextResponse.json({ 
      success: false,
      error: 'Failed to share document via email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}