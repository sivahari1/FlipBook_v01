import sharp from 'sharp'
import { PDFDocument } from 'pdf-lib'
import { fromBuffer } from 'pdf2pic'
import { getQualityConfig } from './config'
import { PDFProcessingError, PDF_ERROR_CODES } from '@/lib/types/pdf'
import type { 
  PageRenderOptions, 
  ProcessedPage, 
  QualityLevel 
} from '@/lib/types/pdf'

export interface RenderResult {
  imageBuffer: Buffer
  width: number
  height: number
  format: string
  size: number
}

export interface BatchRenderOptions extends PageRenderOptions {
  startPage?: number
  endPage?: number
  onProgress?: (progress: { current: number; total: number; percentage: number }) => void
}

export class PDFRenderer {
  private readonly DEFAULT_DPI = 150
  private readonly MAX_DIMENSION = 4096 // Max width/height in pixels
  private readonly TIMEOUT = 30000 // 30 seconds per page

  async renderPage(
    pdfBuffer: Buffer,
    pageNumber: number,
    options: PageRenderOptions
  ): Promise<RenderResult> {
    try {
      // Validate inputs
      this.validateRenderOptions(options)
      
      // Get quality configuration
      const qualityConfig = getQualityConfig(options.quality)
      
      // Set up pdf2pic converter
      const convert = fromBuffer(pdfBuffer, {
        density: qualityConfig.dpi,
        saveFilename: "page",
        savePath: "./temp", // This won't be used as we get buffer
        format: qualityConfig.format,
        width: options.width,
        height: options.height,
        quality: qualityConfig.quality
      })

      // Convert specific page
      const result = await convert(pageNumber, { 
        responseType: "buffer" 
      })

      if (!result.buffer) {
        throw new PDFProcessingError(
          `Failed to render page ${pageNumber}: No image data returned`,
          PDF_ERROR_CODES.RENDERING_FAILED,
          undefined,
          pageNumber
        )
      }

      // Process with Sharp for optimization and format conversion
      let sharpImage = sharp(result.buffer)
      
      // Get image metadata
      const metadata = await sharpImage.metadata()
      const originalWidth = metadata.width || 0
      const originalHeight = metadata.height || 0

      // Apply resizing if specified
      if (options.width || options.height) {
        sharpImage = sharpImage.resize(options.width, options.height, {
          fit: 'inside',
          withoutEnlargement: true
        })
      }

      // Validate dimensions don't exceed limits
      const finalWidth = options.width || originalWidth
      const finalHeight = options.height || originalHeight
      
      if (finalWidth > this.MAX_DIMENSION || finalHeight > this.MAX_DIMENSION) {
        throw new PDFProcessingError(
          `Rendered image dimensions too large: ${finalWidth}x${finalHeight} (max: ${this.MAX_DIMENSION}x${this.MAX_DIMENSION})`,
          PDF_ERROR_CODES.RENDERING_FAILED,
          undefined,
          pageNumber
        )
      }

      // Convert to requested format with optimization
      let finalBuffer: Buffer
      let finalFormat = options.format

      switch (options.format) {
        case 'png':
          finalBuffer = await sharpImage
            .png({ 
              quality: qualityConfig.quality,
              compressionLevel: 6,
              progressive: true
            })
            .toBuffer()
          break

        case 'jpeg':
          finalBuffer = await sharpImage
            .jpeg({ 
              quality: qualityConfig.quality,
              progressive: true,
              mozjpeg: true
            })
            .toBuffer()
          break

        case 'webp':
          finalBuffer = await sharpImage
            .webp({ 
              quality: qualityConfig.quality,
              effort: 4
            })
            .toBuffer()
          break

        default:
          // Fallback to PNG
          finalBuffer = await sharpImage
            .png({ quality: qualityConfig.quality })
            .toBuffer()
          finalFormat = 'png'
      }

      // Get final metadata
      const finalMetadata = await sharp(finalBuffer).metadata()

      return {
        imageBuffer: finalBuffer,
        width: finalMetadata.width || finalWidth,
        height: finalMetadata.height || finalHeight,
        format: finalFormat,
        size: finalBuffer.length
      }

    } catch (error) {
      if (error instanceof PDFProcessingError) {
        throw error
      }

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new PDFProcessingError(
            `Page rendering timed out for page ${pageNumber}`,
            PDF_ERROR_CODES.PROCESSING_TIMEOUT,
            undefined,
            pageNumber
          )
        }

        if (error.message.includes('memory') || error.message.includes('allocation')) {
          throw new PDFProcessingError(
            `Insufficient memory to render page ${pageNumber}`,
            PDF_ERROR_CODES.TOO_LARGE,
            undefined,
            pageNumber
          )
        }

        if (error.message.includes('invalid') || error.message.includes('corrupted')) {
          throw new PDFProcessingError(
            `Invalid or corrupted PDF data for page ${pageNumber}`,
            PDF_ERROR_CODES.CORRUPTED_FILE,
            undefined,
            pageNumber
          )
        }
      }

      throw new PDFProcessingError(
        `Failed to render page ${pageNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        PDF_ERROR_CODES.RENDERING_FAILED,
        undefined,
        pageNumber
      )
    }
  }

  async renderPages(
    pdfBuffer: Buffer,
    options: BatchRenderOptions
  ): Promise<ProcessedPage[]> {
    try {
      // Get PDF page count
      const pdfDoc = await PDFDocument.load(pdfBuffer)
      const totalPages = pdfDoc.getPageCount()

      // Determine page range
      const startPage = options.startPage || 1
      const endPage = options.endPage || totalPages
      
      // Validate page range
      if (startPage < 1 || endPage > totalPages || startPage > endPage) {
        throw new PDFProcessingError(
          `Invalid page range: ${startPage}-${endPage} (total pages: ${totalPages})`,
          PDF_ERROR_CODES.INVALID_PDF
        )
      }

      const pagesToRender = endPage - startPage + 1
      const processedPages: ProcessedPage[] = []

      // Process pages in batches to manage memory
      const BATCH_SIZE = 5
      for (let batchStart = startPage; batchStart <= endPage; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, endPage)
        const batchPromises: Promise<ProcessedPage>[] = []

        // Create batch of render promises
        for (let pageNum = batchStart; pageNum <= batchEnd; pageNum++) {
          const renderPromise = this.renderSinglePage(pdfBuffer, pageNum, options)
          batchPromises.push(renderPromise)
        }

        // Wait for batch to complete
        const batchResults = await Promise.allSettled(batchPromises)
        
        // Process results
        for (let i = 0; i < batchResults.length; i++) {
          const pageNum = batchStart + i
          const result = batchResults[i]

          if (result.status === 'fulfilled') {
            processedPages.push(result.value)
          } else {
            console.error(`Failed to render page ${pageNum}:`, result.reason)
            
            // Create placeholder page for failed renders
            processedPages.push({
              pageNumber: pageNum,
              imageUrl: `/api/pdf/render/error/${pageNum}`,
              width: 612,
              height: 792,
              textBounds: []
            })
          }

          // Report progress
          if (options.onProgress) {
            const current = processedPages.length
            const percentage = Math.round((current / pagesToRender) * 100)
            options.onProgress({ current, total: pagesToRender, percentage })
          }
        }

        // Small delay between batches to prevent overwhelming the system
        if (batchEnd < endPage) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      return processedPages.sort((a, b) => a.pageNumber - b.pageNumber)

    } catch (error) {
      if (error instanceof PDFProcessingError) {
        throw error
      }

      throw new PDFProcessingError(
        `Batch rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        PDF_ERROR_CODES.RENDERING_FAILED
      )
    }
  }

  private async renderSinglePage(
    pdfBuffer: Buffer,
    pageNumber: number,
    options: PageRenderOptions
  ): Promise<ProcessedPage> {
    const renderResult = await this.renderPage(pdfBuffer, pageNumber, options)
    
    // For now, we'll store the image data temporarily and return a URL
    // In a production system, you'd upload to S3 or similar storage
    const imageUrl = `/api/pdf/render/temp/${Date.now()}-${pageNumber}.${renderResult.format}`
    
    return {
      pageNumber,
      imageUrl,
      width: renderResult.width,
      height: renderResult.height,
      textBounds: [] // Will be populated by text extraction
    }
  }

  async getPageDimensions(
    pdfBuffer: Buffer,
    pageNumber: number
  ): Promise<{ width: number; height: number }> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer)
      const pages = pdfDoc.getPages()
      
      if (pageNumber < 1 || pageNumber > pages.length) {
        throw new PDFProcessingError(
          `Invalid page number: ${pageNumber} (total pages: ${pages.length})`,
          PDF_ERROR_CODES.INVALID_PDF,
          undefined,
          pageNumber
        )
      }

      const page = pages[pageNumber - 1]
      const { width, height } = page.getSize()

      return { width, height }

    } catch (error) {
      if (error instanceof PDFProcessingError) {
        throw error
      }

      throw new PDFProcessingError(
        `Failed to get page dimensions for page ${pageNumber}`,
        PDF_ERROR_CODES.RENDERING_FAILED,
        undefined,
        pageNumber
      )
    }
  }

  async validatePDFForRendering(pdfBuffer: Buffer): Promise<{
    isValid: boolean
    pageCount: number
    error?: string
  }> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer)
      const pageCount = pdfDoc.getPageCount()

      // Test render first page to ensure PDF is renderable
      await this.renderPage(pdfBuffer, 1, {
        quality: 'low',
        format: 'jpeg'
      })

      return {
        isValid: true,
        pageCount
      }

    } catch (error) {
      return {
        isValid: false,
        pageCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private validateRenderOptions(options: PageRenderOptions): void {
    // Validate quality
    if (!['low', 'medium', 'high'].includes(options.quality)) {
      throw new PDFProcessingError(
        `Invalid quality setting: ${options.quality}`,
        PDF_ERROR_CODES.INVALID_PDF
      )
    }

    // Validate format
    if (!['png', 'jpeg', 'webp'].includes(options.format)) {
      throw new PDFProcessingError(
        `Invalid format: ${options.format}`,
        PDF_ERROR_CODES.INVALID_PDF
      )
    }

    // Validate dimensions
    if (options.width && (options.width < 50 || options.width > this.MAX_DIMENSION)) {
      throw new PDFProcessingError(
        `Invalid width: ${options.width} (must be between 50 and ${this.MAX_DIMENSION})`,
        PDF_ERROR_CODES.INVALID_PDF
      )
    }

    if (options.height && (options.height < 50 || options.height > this.MAX_DIMENSION)) {
      throw new PDFProcessingError(
        `Invalid height: ${options.height} (must be between 50 and ${this.MAX_DIMENSION})`,
        PDF_ERROR_CODES.INVALID_PDF
      )
    }
  }

  // Utility method to get optimal render settings based on use case
  getOptimalRenderOptions(
    useCase: 'thumbnail' | 'preview' | 'print' | 'web',
    customOptions?: Partial<PageRenderOptions>
  ): PageRenderOptions {
    let baseOptions: PageRenderOptions

    switch (useCase) {
      case 'thumbnail':
        baseOptions = {
          quality: 'low',
          format: 'jpeg',
          width: 200,
          height: 280
        }
        break

      case 'preview':
        baseOptions = {
          quality: 'medium',
          format: 'webp',
          width: 800,
          height: 1120
        }
        break

      case 'print':
        baseOptions = {
          quality: 'high',
          format: 'png'
        }
        break

      case 'web':
      default:
        baseOptions = {
          quality: 'medium',
          format: 'webp',
          width: 1024,
          height: 1440
        }
        break
    }

    return { ...baseOptions, ...customOptions }
  }
}

export const pdfRenderer = new PDFRenderer()