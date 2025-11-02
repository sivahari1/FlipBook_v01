import { NextRequest, NextResponse } from 'next/server'
// import { getServerSession } from 'next-auth'
// import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { pdfRenderer } from '@/lib/pdf'
import { pdfDbService } from '@/lib/database/pdf-service'
import { watermarkRenderer, WATERMARK_PRESETS } from '@/lib/watermark-renderer'
import { PDFProcessingError } from '@/lib/types/pdf'
import { readFile } from 'fs/promises'
import { join } from 'path'

interface RouteParams {
  documentId: string
  pageNumber: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { documentId, pageNumber } = params
    const pageNum = parseInt(pageNumber)

    // Validate page number
    if (isNaN(pageNum) || pageNum < 1) {
      return NextResponse.json(
        { error: 'Invalid page number' },
        { status: 400 }
      )
    }

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
        { status: 202 } // Accepted but not ready
      )
    }

    // Validate page number against document
    if (pageNum > (document.totalPages || 0)) {
      return NextResponse.json(
        { error: `Page ${pageNum} not found. Document has ${document.totalPages} pages.` },
        { status: 404 }
      )
    }

    // Get render options from query parameters
    const searchParams = request.nextUrl.searchParams
    const quality = (searchParams.get('quality') as 'low' | 'medium' | 'high') || 'medium'
    const format = (searchParams.get('format') as 'png' | 'jpeg' | 'webp') || 'webp'
    const width = searchParams.get('width') ? parseInt(searchParams.get('width')!) : undefined
    const height = searchParams.get('height') ? parseInt(searchParams.get('height')!) : undefined

    // Check if we have a cached rendered page
    const cachedPage = await pdfDbService.getCachedPage(documentId, pageNum, { quality, format, width, height })
    if (cachedPage) {
      // Log access
      await pdfDbService.logDocumentAccess({
        userId: session.user.id,
        documentId,
        pageNumber: pageNum,
        action: 'view',
        sessionId: session.user.id + '-' + Date.now()
      })

      return new NextResponse(cachedPage.imageData, {
        headers: {
          'Content-Type': `image/${format}`,
          'Content-Length': cachedPage.imageData.length.toString(),
          'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
          'ETag': `"${documentId}-${pageNum}-${quality}-${format}"`,
          'X-Page-Width': cachedPage.width.toString(),
          'X-Page-Height': cachedPage.height.toString()
        }
      })
    }

    // Load PDF file for rendering
    let pdfBuffer: Buffer
    try {
      // In a production system, you'd load from S3 or similar storage
      // For now, we'll assume the file is stored locally or in database
      const filePath = join(process.cwd(), 'uploads', document.storageKey || `${documentId}.pdf`)
      pdfBuffer = await readFile(filePath)
    } catch (error) {
      console.error('Failed to load PDF file:', error)
      return NextResponse.json(
        { error: 'PDF file not found' },
        { status: 404 }
      )
    }

    // Render the page
    const renderResult = await pdfRenderer.renderPage(pdfBuffer, pageNum, {
      quality,
      format,
      width,
      height
    })

    // Apply watermark to the rendered page
    const watermarkLevel = searchParams.get('watermark') || 'medium'
    const watermarkConfig = WATERMARK_PRESETS[watermarkLevel.toUpperCase() as keyof typeof WATERMARK_PRESETS] || WATERMARK_PRESETS.MEDIUM

    const watermarkedImage = await watermarkRenderer.applyWatermark(
      renderResult.imageBuffer,
      {
        userId: session.user.id,
        userEmail: session.user.email || undefined,
        documentId,
        pageNumber: pageNum,
        timestamp: new Date(),
        accessLevel: 'view'
      },
      watermarkConfig
    )

    // Cache the rendered page (cache the watermarked version)
    await pdfDbService.setCachedPage(documentId, pageNum, {
      imageData: watermarkedImage,
      width: renderResult.width,
      height: renderResult.height,
      format: renderResult.format,
      quality,
      size: watermarkedImage.length
    })

    // Log access
    await pdfDbService.logDocumentAccess({
      userId: session.user.id,
      documentId,
      pageNumber: pageNum,
      action: 'view',
      sessionId: session.user.id + '-' + Date.now()
    })

    // Return the watermarked page
    return new NextResponse(watermarkedImage, {
      headers: {
        'Content-Type': `image/${renderResult.format}`,
        'Content-Length': watermarkedImage.length.toString(),
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'ETag': `"${documentId}-${pageNum}-${quality}-${format}-${watermarkLevel}"`,
        'X-Page-Width': renderResult.width.toString(),
        'X-Page-Height': renderResult.height.toString(),
        'X-Processing-Time': Date.now().toString(),
        'X-Watermark-Applied': 'true',
        'X-Watermark-Level': watermarkLevel
      }
    })

  } catch (error) {
    console.error('PDF page rendering error:', error)

    if (error instanceof PDFProcessingError) {
      const statusCode = error.code === 'INVALID_PDF' ? 400 : 
                        error.code === 'TOO_LARGE' ? 413 :
                        error.code === 'PROCESSING_TIMEOUT' ? 408 : 500

      return NextResponse.json(
        { 
          error: error.message,
          code: error.code,
          pageNumber: error.pageNumber
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}