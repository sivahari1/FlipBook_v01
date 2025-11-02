import { NextRequest, NextResponse } from 'next/server'
import { demoStore } from '@/lib/demo-document-store'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Setting up test analytics data...')

    // Add some sample documents to the demo store
    const sampleDocs = [
      {
        id: 'test-doc-1',
        title: 'Marketing Presentation Q4',
        description: 'Quarterly marketing presentation with performance metrics',
        pageCount: 15,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        fileName: 'marketing-q4.pdf',
        fileSize: 2048000,
        storageKey: 'test/marketing-q4.pdf',
        drmOptions: { watermark: true, copyProtection: true }
      },
      {
        id: 'test-doc-2',
        title: 'Product Specifications v2.1',
        description: 'Updated product specifications and technical details',
        pageCount: 8,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        fileName: 'product-specs-v2.1.pdf',
        fileSize: 1536000,
        storageKey: 'test/product-specs.pdf',
        drmOptions: { watermark: true, copyProtection: true }
      },
      {
        id: 'test-doc-3',
        title: 'Financial Report 2024',
        description: 'Annual financial report with detailed analysis',
        pageCount: 25,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        fileName: 'financial-report-2024.pdf',
        fileSize: 3072000,
        storageKey: 'test/financial-report.pdf',
        drmOptions: { watermark: true, copyProtection: true }
      }
    ]

    // Add documents to persistent demo store
    const { persistentDemoStore } = await import('@/lib/persistent-demo-store')
    
    for (const doc of sampleDocs) {
      await persistentDemoStore.addDocument(doc)
    }

    // Add some share links
    const shareLinks = [
      {
        id: 'share-1',
        code: 'share-marketing-q4',
        documentId: 'test-doc-1',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxOpens: undefined,
        openCount: 12,
        requirePass: false
      },
      {
        id: 'share-2',
        code: 'share-product-specs',
        documentId: 'test-doc-2',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        maxOpens: undefined,
        openCount: 8,
        requirePass: false
      }
    ]

    for (const link of shareLinks) {
      await persistentDemoStore.addShareLink(link)
    }

    // Add some direct document views
    await persistentDemoStore.incrementDocumentViews('test-doc-1') // 1 view
    await persistentDemoStore.incrementDocumentViews('test-doc-1') // 2 views
    await persistentDemoStore.incrementDocumentViews('test-doc-1') // 3 views
    await persistentDemoStore.incrementDocumentViews('test-doc-2') // 1 view
    await persistentDemoStore.incrementDocumentViews('test-doc-2') // 2 views
    await persistentDemoStore.incrementDocumentViews('test-doc-3') // 1 view

    const stats = await persistentDemoStore.getStats()
    console.log('📊 Demo store stats after setup:', stats)

    return NextResponse.json({
      success: true,
      message: 'Test analytics data created successfully',
      stats
    })

  } catch (error) {
    console.error('❌ Error setting up test analytics:', error)
    
    return NextResponse.json({
      error: 'Failed to setup test analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { persistentDemoStore } = await import('@/lib/persistent-demo-store')
    const stats = await persistentDemoStore.getStats()
    
    return NextResponse.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('❌ Error getting analytics stats:', error)
    
    return NextResponse.json({
      error: 'Failed to get stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}