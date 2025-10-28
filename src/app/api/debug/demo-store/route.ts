import { NextResponse } from 'next/server'
import { demoStore } from '@/lib/demo-document-store'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const stats = demoStore.getStats()
    const documents = demoStore.getAllDocuments()
    
    return NextResponse.json({
      success: true,
      stats,
      documents: documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        pageCount: doc.pageCount,
        createdAt: doc.createdAt,
        fileSize: doc.fileSize
      })),
      shareLinks: Array.from(demoStore.getStats().shareCodes).map(code => {
        const shareLink = demoStore.getShareLink(code)
        return shareLink ? {
          code: shareLink.code,
          documentId: shareLink.documentId,
          openCount: shareLink.openCount,
          createdAt: shareLink.createdAt
        } : null
      }).filter(Boolean)
    })
  } catch (error) {
    console.error('❌ Debug demo store error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}