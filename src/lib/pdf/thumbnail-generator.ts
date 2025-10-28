import sharp from 'sharp'
import { pdfRenderer } from './renderer'
import { getThumbnailConfig } from './config'
import { PDFProcessingError, PDF_ERROR_CODES } from '@/lib/types/pdf'
import type { ThumbnailOptions } from '@/lib/types/pdf'

export interface ThumbnailResult {
  buffer: Buffer
  width: number
  height: number
  format: string
  size: number
}

export interface BatchThumbnailOptions extends ThumbnailOptions {
  startPage?: number
  endPage?: number
  onProgress?: (progress: { current: number; total: number; percentage: number }) => void
}

export class ThumbnailGenerator {
  private readonly DEFAULT_CONFIG = getThumbnailConfig()
  private readonly MAX_CONCURRENT = 3 // Process 3 thumbnails concurrently
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

  async generateThumbnail(
    pdfBuffer: Buffer,
    pageNumber: number,
    options?: Partial<ThumbnailOptions>
  ): Promise<ThumbnailResult> {
    try {
      // Merge with default configuration
      const config: ThumbnailOptions = {
        ...this.DEFAULT_CONFIG,
        ...options
      }

      // Validate options
      this.validateThumbnailOptions(config)

      // First render the page at low quality for thumbnail
      const renderResult = await pdfRenderer.renderPage(pdfBuffer, pageNumber, {
        quality: 'low',
        format: 'png', // Use PNG for initial render to preserve quality
        width: config.width * 2, // Render at 2x for better quality when scaled down
        height: config.height * 2
      })

      // Process with Sharp for thumbnail optimization
      let thumbnail = sharp(renderResult.imageBuffer)

      // Resize to exact thumbnail dimensions
      thumbnail = thumbnail.resize(config.width, config.height, {
        fit: 'inside',
        withoutEnlargement: false,
        background: { r: 255, g: 255, b: 255, alpha: 1 } // White background
      })

      // Apply thumbnail-specific optimizations
      let finalBuffer: Buffer
      let finalFormat = config.format

      switch (config.format) {
        case 'jpeg':
          finalBuffer = await thumbnail
            .jpeg({
              quality: config.quality,
              progressive: true,
              mozjpeg: true
            })
            .toBuffer()
          break

        case 'webp':
          finalBuffer = await thumbnail
            .webp({
              quality: config.quality,
              effort: 6,
              smartSubsample: true
            })
            .toBuffer()
          break

        case 'png':
        default:
          finalBuffer = await thumbnail
            .png({
              quality: config.quality,
              compressionLevel: 9,
              progressive: true
            })
            .toBuffer()
          finalFormat = 'png'
          break
      }

      // Get final metadata
      const metadata = await sharp(finalBuffer).metadata()

      return {
        buffer: finalBuffer,
        width: metadata.width || config.width,
        height: metadata.height || config.height,
        format: finalFormat,
        size: finalBuffer.length
      }

    } catch (error) {
      if (error instanceof PDFProcessingError) {
        throw error
      }

      throw new PDFProcessingError(
        `Failed to generate thumbnail for page ${pageNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        PDF_ERROR_CODES.RENDERING_FAILED,
        undefined,
        pageNumber
      )
    }
  }

  async generateThumbnails(
    pdfBuffer: Buffer,
    options: BatchThumbnailOptions = {
      width: this.DEFAULT_CONFIG.width,
      height: this.DEFAULT_CONFIG.height,
      quality: this.DEFAULT_CONFIG.quality,
      format: this.DEFAULT_CONFIG.format
    }
  ): Promise<Array<{ pageNumber: number; thumbnail: ThumbnailResult }>> {
    try {
      // Get PDF page count
      const pdfDoc = await (await import('pdf-lib')).PDFDocument.load(pdfBuffer)
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

      const pagesToProcess = endPage - startPage + 1
      const results: Array<{ pageNumber: number; thumbnail: ThumbnailResult }> = []

      // Process thumbnails in batches to manage memory
      for (let batchStart = startPage; batchStart <= endPage; batchStart += this.MAX_CONCURRENT) {
        const batchEnd = Math.min(batchStart + this.MAX_CONCURRENT - 1, endPage)
        const batchPromises: Promise<{ pageNumber: number; thumbnail: ThumbnailResult }>[] = []

        // Create batch of thumbnail generation promises
        for (let pageNum = batchStart; pageNum <= batchEnd; pageNum++) {
          const thumbnailPromise = this.generateSingleThumbnail(pdfBuffer, pageNum, options)
          batchPromises.push(thumbnailPromise)
        }

        // Wait for batch to complete
        const batchResults = await Promise.allSettled(batchPromises)

        // Process results
        for (let i = 0; i < batchResults.length; i++) {
          const pageNum = batchStart + i
          const result = batchResults[i]

          if (result.status === 'fulfilled') {
            results.push(result.value)
          } else {
            console.error(`Failed to generate thumbnail for page ${pageNum}:`, result.reason)
            
            // Create placeholder thumbnail for failed generations
            const placeholderThumbnail = await this.createPlaceholderThumbnail(pageNum, options)
            results.push({ pageNumber: pageNum, thumbnail: placeholderThumbnail })
          }

          // Report progress
          if (options.onProgress) {
            const current = results.length
            const percentage = Math.round((current / pagesToProcess) * 100)
            options.onProgress({ current, total: pagesToProcess, percentage })
          }
        }

        // Small delay between batches
        if (batchEnd < endPage) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }

      return results.sort((a, b) => a.pageNumber - b.pageNumber)

    } catch (error) {
      if (error instanceof PDFProcessingError) {
        throw error
      }

      throw new PDFProcessingError(
        `Batch thumbnail generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        PDF_ERROR_CODES.RENDERING_FAILED
      )
    }
  }

  private async generateSingleThumbnail(
    pdfBuffer: Buffer,
    pageNumber: number,
    options: Partial<ThumbnailOptions>
  ): Promise<{ pageNumber: number; thumbnail: ThumbnailResult }> {
    const thumbnail = await this.generateThumbnail(pdfBuffer, pageNumber, options)
    return { pageNumber, thumbnail }
  }

  private async createPlaceholderThumbnail(
    pageNumber: number,
    options: Partial<ThumbnailOptions>
  ): Promise<ThumbnailResult> {
    const config = { ...this.DEFAULT_CONFIG, ...options }
    
    // Create a simple placeholder image
    const placeholderBuffer = await sharp({
      create: {
        width: config.width,
        height: config.height,
        channels: 3,
        background: { r: 240, g: 240, b: 240 }
      }
    })
    .png()
    .composite([
      {
        input: Buffer.from(`
          <svg width="${config.width}" height="${config.height}">
            <rect width="100%" height="100%" fill="#f0f0f0" stroke="#ccc" stroke-width="2"/>
            <text x="50%" y="50%" text-anchor="middle" dy="0.3em" 
                  font-family="Arial, sans-serif" font-size="16" fill="#666">
              Page ${pageNumber}
            </text>
            <text x="50%" y="65%" text-anchor="middle" dy="0.3em" 
                  font-family="Arial, sans-serif" font-size="12" fill="#999">
              Thumbnail Error
            </text>
          </svg>
        `),
        top: 0,
        left: 0
      }
    ])
    .toBuffer()

    return {
      buffer: placeholderBuffer,
      width: config.width,
      height: config.height,
      format: 'png',
      size: placeholderBuffer.length
    }
  }

  async generateThumbnailGrid(
    pdfBuffer: Buffer,
    options: {
      columns: number
      rows: number
      thumbnailSize: number
      spacing: number
      startPage?: number
      format?: 'png' | 'jpeg' | 'webp'
      quality?: number
    }
  ): Promise<ThumbnailResult> {
    try {
      const { columns, rows, thumbnailSize, spacing, startPage = 1 } = options
      const totalThumbnails = columns * rows
      const endPage = startPage + totalThumbnails - 1

      // Generate individual thumbnails
      const thumbnails = await this.generateThumbnails(pdfBuffer, {
        width: thumbnailSize,
        height: Math.round(thumbnailSize * 1.4), // Approximate page ratio
        format: 'png', // Use PNG for compositing
        quality: 80,
        startPage,
        endPage
      })

      // Calculate grid dimensions
      const gridWidth = (thumbnailSize * columns) + (spacing * (columns - 1))
      const gridHeight = (Math.round(thumbnailSize * 1.4) * rows) + (spacing * (rows - 1))

      // Create base image
      let gridImage = sharp({
        create: {
          width: gridWidth,
          height: gridHeight,
          channels: 3,
          background: { r: 255, g: 255, b: 255 }
        }
      })

      // Composite thumbnails onto grid
      const compositeOperations = []
      
      for (let i = 0; i < Math.min(thumbnails.length, totalThumbnails); i++) {
        const row = Math.floor(i / columns)
        const col = i % columns
        
        const left = col * (thumbnailSize + spacing)
        const top = row * (Math.round(thumbnailSize * 1.4) + spacing)

        compositeOperations.push({
          input: thumbnails[i].thumbnail.buffer,
          left,
          top
        })
      }

      gridImage = gridImage.composite(compositeOperations)

      // Convert to requested format
      const format = options.format || 'png'
      const quality = options.quality || 85

      let finalBuffer: Buffer
      switch (format) {
        case 'jpeg':
          finalBuffer = await gridImage.jpeg({ quality }).toBuffer()
          break
        case 'webp':
          finalBuffer = await gridImage.webp({ quality }).toBuffer()
          break
        case 'png':
        default:
          finalBuffer = await gridImage.png({ quality }).toBuffer()
          break
      }

      return {
        buffer: finalBuffer,
        width: gridWidth,
        height: gridHeight,
        format,
        size: finalBuffer.length
      }

    } catch (error) {
      throw new PDFProcessingError(
        `Failed to generate thumbnail grid: ${error instanceof Error ? error.message : 'Unknown error'}`,
        PDF_ERROR_CODES.RENDERING_FAILED
      )
    }
  }

  private validateThumbnailOptions(options: ThumbnailOptions): void {
    if (options.width < 50 || options.width > 1000) {
      throw new PDFProcessingError(
        `Invalid thumbnail width: ${options.width} (must be between 50 and 1000)`,
        PDF_ERROR_CODES.INVALID_PDF
      )
    }

    if (options.height < 50 || options.height > 1400) {
      throw new PDFProcessingError(
        `Invalid thumbnail height: ${options.height} (must be between 50 and 1400)`,
        PDF_ERROR_CODES.INVALID_PDF
      )
    }

    if (options.quality < 10 || options.quality > 100) {
      throw new PDFProcessingError(
        `Invalid thumbnail quality: ${options.quality} (must be between 10 and 100)`,
        PDF_ERROR_CODES.INVALID_PDF
      )
    }

    if (!['png', 'jpeg', 'webp'].includes(options.format)) {
      throw new PDFProcessingError(
        `Invalid thumbnail format: ${options.format}`,
        PDF_ERROR_CODES.INVALID_PDF
      )
    }
  }

  // Utility method to get optimal thumbnail settings for different use cases
  getOptimalThumbnailOptions(
    useCase: 'list' | 'grid' | 'preview' | 'navigation',
    customOptions?: Partial<ThumbnailOptions>
  ): ThumbnailOptions {
    let baseOptions: ThumbnailOptions

    switch (useCase) {
      case 'list':
        baseOptions = {
          width: 120,
          height: 168,
          quality: 70,
          format: 'jpeg'
        }
        break

      case 'grid':
        baseOptions = {
          width: 150,
          height: 210,
          quality: 75,
          format: 'webp'
        }
        break

      case 'preview':
        baseOptions = {
          width: 200,
          height: 280,
          quality: 85,
          format: 'webp'
        }
        break

      case 'navigation':
      default:
        baseOptions = {
          width: 100,
          height: 140,
          quality: 65,
          format: 'jpeg'
        }
        break
    }

    return { ...baseOptions, ...customOptions }
  }

  // Method to estimate thumbnail generation time
  estimateProcessingTime(pageCount: number, quality: 'low' | 'medium' | 'high' = 'medium'): {
    estimatedSeconds: number
    estimatedMinutes: number
  } {
    // Base time per thumbnail in seconds (rough estimates)
    const baseTimePerThumbnail = {
      low: 0.5,
      medium: 1.0,
      high: 2.0
    }[quality]

    const totalSeconds = Math.ceil(pageCount * baseTimePerThumbnail)
    const totalMinutes = Math.ceil(totalSeconds / 60)

    return {
      estimatedSeconds: totalSeconds,
      estimatedMinutes: totalMinutes
    }
  }
}

export const thumbnailGenerator = new ThumbnailGenerator()