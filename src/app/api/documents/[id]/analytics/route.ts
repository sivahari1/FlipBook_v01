import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isDatabaseConfigured } from '@/lib/database-config'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if database is configured
    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Service temporarily unavailable'
      }, { status: 503 })
    }

    // Get user email from request headers
    const userEmail = request.headers.get('x-user-email')
    
    if (!userEmail) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    // Find the current user
    const currentUser = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 403 })
    }

    // Find document and verify ownership
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        documentViews: {
          orderBy: { viewedAt: 'desc' },
          take: 50 // Limit to last 50 views
        }
      }
    })

    if (!document) {
      return NextResponse.json({
        success: false,
        error: 'Document not found'
      }, { status: 404 })
    }

    // Check if user owns the document
    if (document.ownerId !== currentUser.id) {
      return NextResponse.json({
        success: false,
        error: 'Access denied'
      }, { status: 403 })
    }

    // Calculate views by day for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const viewsByDay = await prisma.$queryRaw<Array<{ date: string; views: bigint }>>`
      SELECT 
        DATE(viewed_at) as date,
        COUNT(*) as views
      FROM document_views 
      WHERE document_id = ${id} 
        AND viewed_at >= ${thirtyDaysAgo}
      GROUP BY DATE(viewed_at)
      ORDER BY date DESC
    `

    // Format the analytics data
    const analytics = {
      document: {
        id: document.id,
        title: document.title,
        description: document.description,
        pageCount: document.pageCount,
        createdAt: document.createdAt.toISOString(),
        viewCount: document.viewCount
      },
      totalViews: document.viewCount,
      recentViews: document.documentViews.map(view => ({
        id: view.id,
        viewedAt: view.viewedAt.toISOString(),
        viewerIp: view.viewerIp,
        userAgent: view.userAgent,
        sessionId: view.sessionId
      })),
      viewsByDay: viewsByDay.map(day => ({
        date: day.date,
        views: Number(day.views)
      }))
    }

    return NextResponse.json({
      success: true,
      analytics
    })

  } catch (error) {
    console.error('❌ Error fetching document analytics:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch analytics'
    }, { status: 500 })
  }
}