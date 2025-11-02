import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { demoStore } from '@/lib/demo-document-store'

// Initialize Prisma client safely
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
})

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Analytics API called')

    // Check if database is configured and accessible
    const isDatabaseConfigured = process.env.DATABASE_URL && 
                                !process.env.DATABASE_URL.includes('placeholder') && 
                                !process.env.DATABASE_URL.includes('build')

    // Try to get real document data first
    const { persistentDemoStore } = await import('@/lib/persistent-demo-store')
    const realDocuments = await persistentDemoStore.getAllDocuments()
    const hasRealDocuments = realDocuments.length > 0

    if (hasRealDocuments) {
      console.log('📊 Using real document data for analytics')
      
      // Calculate analytics from real documents
      const recentViews = await Promise.all(realDocuments.map(async (doc, index) => {
        // Get actual view count for this document
        const documentViews = await persistentDemoStore.getDocumentViews(doc.id)
        // Also add share link views
        const shareLinks = await persistentDemoStore.getShareLinksForDocument(doc.id)
        const shareLinkViews = shareLinks.reduce((sum, link) => sum + link.openCount, 0)
        const totalViews = documentViews + shareLinkViews
        
        return {
          document: doc.title,
          views: totalViews,
          date: new Date(doc.createdAt).toISOString().split('T')[0]
        }
      }))

      const totalViews = await persistentDemoStore.getTotalViews() + 
                        (await Promise.all(realDocuments.map(async (doc) => {
                          const shareLinks = await persistentDemoStore.getShareLinksForDocument(doc.id)
                          return shareLinks.reduce((linkSum, link) => linkSum + link.openCount, 0)
                        }))).reduce((sum, views) => sum + views, 0)
      
      return NextResponse.json({
        success: true,
        analytics: {
          totalViews,
          totalDocuments: realDocuments.length,
          totalUsers: 1, // Current user
          recentViews: recentViews.slice(0, 5) // Show only the 5 most recent
        },
        demoMode: false
      })
    }

    // Fallback to demo data if no real documents
    console.log('📊 No real documents found, returning demo analytics data')
    
    // Generate realistic demo data
    const today = new Date()
    const demoViews = [
      { 
        document: 'Product Brochure 2024', 
        views: Math.floor(Math.random() * 50) + 20, 
        date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      { 
        document: 'Financial Report Q3', 
        views: Math.floor(Math.random() * 30) + 15, 
        date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      { 
        document: 'User Manual v2.1', 
        views: Math.floor(Math.random() * 40) + 10, 
        date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      { 
        document: 'Marketing Presentation', 
        views: Math.floor(Math.random() * 25) + 8, 
        date: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      { 
        document: 'Technical Specifications', 
        views: Math.floor(Math.random() * 35) + 12, 
        date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ]

    const totalViews = demoViews.reduce((sum, view) => sum + view.views, 0)
    
    return NextResponse.json({
      success: true,
      analytics: {
        totalViews,
        totalDocuments: demoViews.length,
        totalUsers: Math.floor(Math.random() * 5) + 3,
        recentViews: demoViews
      },
      demoMode: true
    })

    // Database code (commented out for now)
    /*
    if (!isDatabaseConfigured) {
      // Return demo analytics data when database is not configured
      return NextResponse.json({
        success: true,
        analytics: {
          totalViews: Math.floor(Math.random() * 100) + 50,
          totalDocuments: Math.floor(Math.random() * 20) + 5,
          totalUsers: Math.floor(Math.random() * 10) + 1,
          recentViews: demoViews
        },
        demoMode: true
      })
    }
    */

    // Database-dependent code (commented out for now)
    /*
    // Get user email from headers for authentication
    const userEmail = request.headers.get('x-user-email')
    
    if (!userEmail) {
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 })
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // Get analytics data from database
    const [totalDocuments, totalViews] = await Promise.all([
      prisma.document.count({
        where: { ownerId: user.id }
      }),
      prisma.viewAudit.count({
        where: {
          document: {
            ownerId: user.id
          }
        }
      })
    ])

    // Get recent views
    const recentViews = await prisma.viewAudit.findMany({
      where: {
        document: {
          ownerId: user.id
        }
      },
      include: {
        document: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        viewedAt: 'desc'
      },
      take: 10
    })

    const analytics = {
      totalViews,
      totalDocuments,
      totalUsers: 1, // For now, just the current user
      recentViews: recentViews.map(view => ({
        document: view.document.title,
        views: 1, // Each audit is one view
        date: view.viewedAt.toISOString().split('T')[0]
      }))
    }

    return NextResponse.json({
      success: true,
      analytics
    })
    */

  } catch (error) {
    console.error('❌ Analytics API error:', error)
    
    return NextResponse.json({
      error: 'Failed to fetch analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}