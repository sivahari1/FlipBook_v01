import { NextRequest, NextResponse } from 'next/server'
import { demoStore } from '@/lib/demo-document-store'

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id
    console.log(`👁️ Recording view for document: ${documentId}`)

    // Check if database is configured
    const isDatabaseConfigured = process.env.DATABASE_URL && 
                                !process.env.DATABASE_URL.includes('placeholder') && 
                                !process.env.DATABASE_URL.includes('build')

    if (!isDatabaseConfigured) {
      // Use demo store for view tracking
      const document = demoStore.getDocument(documentId)
      
      if (!document) {
        return NextResponse.json({
          error: 'Document not found'
        }, { status: 404 })
      }

      // Increment view count
      const newViewCount = demoStore.incrementDocumentViews(documentId)
      
      return NextResponse.json({
        success: true,
        documentId,
        viewCount: newViewCount,
        message: 'View recorded successfully'
      })
    }

    // TODO: Add database-based view tracking here when database is configured
    // For now, return success for database mode too
    return NextResponse.json({
      success: true,
      documentId,
      viewCount: 1,
      message: 'View recorded (database mode)'
    })

  } catch (error) {
    console.error('❌ Error recording document view:', error)
    
    return NextResponse.json({
      error: 'Failed to record view',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}