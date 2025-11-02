import { NextRequest, NextResponse } from 'next/server'
// import { getServerSession } from 'next-auth'
// import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { thumbnailGenerator } from '@/lib/pdf'
import { pdfDbService } from '@/lib/database/pdf-service'
import { PDFProcessingError } from '@/lib/types/pdf'
import { readFile } from 'fs/promises'
import { join } from 'path'

interface RouteParams {
  documentId: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { documentId } = params

    // Get session for authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get document and verify access
    const document = await pdfDbService.getDocumentWithAccess(documentId, session.user.id)
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      )
    }

    // Check if document is processed
    if (document.processingStatus !== 'completed') {
      return NextResponse.json(
        { 
          error: 'Document not ready',
          status: document.processingStatus 
        },
        { status: 202 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const startPage = parseInt(searchParams.get('startPage') || '1')
    const endPage = parseInt(searchParams.get('endPage') || document.totalPages?.toString() || '1')
    const width = parseInt(searchParams.get('width') || '200')
    const height = parseInt(searchParams.get('height') || '280')
    const quality = parseInt(searchParams.get('quality') || '80')
    const format = (searchParams.get('format') as 'png' | 'jpeg' | 'webp') || 'jpeg'
    const useCase = (searchParams.get('useCase') as 'list' | 'grid' | 'preview' | 'navigation') || 'list'

    // Validate parameters
    if (startPage < 1 || endPage > (document.totalPages || 0) || startPage > endPage) {
      return NextResponse.json(
        { error: 'Invalid page range' },
        { status: 400 }
      )
    }

    // Check for cached thumbnails
    const cacheKey = `thumbnails-${documentId}-${startPage}-${endPage}-${width}x${height}-${quality}-${format}`
    const cachedThumbnails = await pdfDbService.getCachedThumbnails(cacheKey)
    
    if (cachedThumbnails) {
      return NextResponse.json({
        thumbnails: cachedThumbnails,
        cached: true,
        totalPages: document.totalPages
      })
    }

    // Load PDF file
    let pdfBuffer: Buffer
    try {
      const filePath = join(process.cwd(), 'uploads', document.storageKey || `${documentId}.pdf`)
      pdfBuffer = await readFile(filePath)
    } catch (error) {
      console.error('Failed to load PDF file:', error)
      return NextResponse.json(
        { error: 'PDF file not found' },
        { status: 404 }
      )
    }

    // Get optimal thumbnail options for the use case
    const thumbnailOptions = thumbnailGenerator.getOptimalThumbnailOptions(useCase, {
      width,
      height,
      quality,
      format
    })

    // Generate thumbnails
    const thumbnailResults = await thumbnailGenerator.generateThumbnails(pdfBuffer, {
      ...thumbnailOptions,
      startPage,
      endPage,
      onProgress: (progress) => {
        // In a real implementation, you might send progress via WebSocket
        console.log(`Thumbnail generation progress: ${progress.percentage}%`)
      }
    })

    // Convert results to API format
    const thumbnails = thumbnailResults.map(result => ({
      pageNumber: result.pageNumber,
      dataUrl: `data:image/${result.thumbnail.format};base64,${result.thumbnail.buffer.toString('base64')}`,
      width: result.thumbnail.width,
      height: result.thumbnail.height,
      size: result.thumbnail.size,
      format: result.thumbnail.format
    }))

    // Cache the results
    await pdfDbService.setCachedThumbnails(cacheKey, thumbnails, 24 * 60 * 60) // Cache for 24 hours

    // Log access
    await pdfDbService.logDocumentAccess({
      userId: session.user.id,
      documentId,
      action: 'view',
      sessionId: session.user.id + '-thumbnails-' + Date.now()
    })

    return NextResponse.json({
      thumbnails,
      cached: false,
      totalPages: document.totalPages,
      generatedAt: new Date().toISOString(),
      options: thumbnailOptions
    })

  } catch (error) {
    console.error('Thumbnail generation error:', error)

    if (error instanceof PDFProcessingError) {
      const statusCode = error.code === 'INVALID_PDF' ? 400 : 
                        error.code === 'TOO_LARGE' ? 413 :
                        error.code === 'PROCESSING_TIMEOUT' ? 408 : 500

      return NextResponse.json(
        { 
          error: error.message,
          code: error.code
        },
        { status: statusCode }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Generate thumbnail grid
export async function POST(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { documentId } = params
    const body = await request.json()

    // Get session for authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get document and verify access
    const document = await pdfDbService.getDocumentWithAccess(documentId, session.user.id)
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      )
    }

    // Validate request body
    const {
      columns = 4,
      rows = 3,
      thumbnailSize = 150,
      spacing = 10,
      startPage = 1,
      format = 'png',
      quality = 85
    } = body

    // Load PDF file
    let pdfBuffer: Buffer
    try {
      const filePath = join(process.cwd(), 'uploads', document.storageKey || `${documentId}.pdf`)
      pdfBuffer = await readFile(filePath)
    } catch (error) {
      console.error('Failed to load PDF file:', error)
      return NextResponse.json(
        { error: 'PDF file not found' },
        { status: 404 }
      )
    }

    // Generate thumbnail grid
    const gridResult = await thumbnailGenerator.generateThumbnailGrid(pdfBuffer, {
      columns,
      rows,
      thumbnailSize,
      spacing,
      startPage,
      format,
      quality
    })

    // Log access
    await pdfDbService.logDocumentAccess({
      userId: session.user.id,
      documentId,
      action: 'view',
      sessionId: session.user.id + '-grid-' + Date.now()
    })

    // Return the grid as base64 data URL
    const dataUrl = `data:image/${gridResult.format};base64,${gridResult.buffer.toString('base64')}`

    return NextResponse.json({
      grid: {
        dataUrl,
        width: gridResult.width,
        height: gridResult.height,
        size: gridResult.size,
        format: gridResult.format
      },
      options: {
        columns,
        rows,
        thumbnailSize,
        spacing,
        startPage,
        totalThumbnails: columns * rows
      },
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Thumbnail grid generation error:', error)

    if (error instanceof PDFProcessingError) {
      const statusCode = error.code === 'INVALID_PDF' ? 400 : 
                        error.code === 'TOO_LARGE' ? 413 :
                        error.code === 'PROCESSING_TIMEOUT' ? 408 : 500

      return NextResponse.json(
        { 
          error: error.message,
          code: error.code
        },
        { status: statusCode }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}