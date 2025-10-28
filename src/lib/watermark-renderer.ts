import sharp from 'sharp'
import { createCanvas, CanvasRenderingContext2D } from 'canvas'

export interface WatermarkOptions {
  text: string
  opacity?: number
  fontSize?: number
  color?: string
  rotation?: number
  pattern?: 'diagonal' | 'grid' | 'corners' | 'center' | 'random'
  positions?: Array<{ x: number; y: number }>
}

export interface UserWatermarkData {
  userId?: string
  userEmail?: string
  userName?: string
  documentId?: string
  pageNumber?: number
  timestamp?: Date
  accessLevel?: string
}

export class WatermarkRenderer {
  private readonly DEFAULT_OPTIONS: Required<Omit<WatermarkOptions, 'positions'>> = {
    text: 'Protected Content',
    opacity: 0.1,
    fontSize: 14,
    color: '#000000',
    rotation: -45,
    pattern: 'diagonal'
  }

  async applyWatermark(
    imageBuffer: Buffer,
    userData: UserWatermarkData,
    options: Partial<WatermarkOptions> = {}
  ): Promise<Buffer> {
    try {
      // Merge options with defaults
      const config = { ...this.DEFAULT_OPTIONS, ...options }
      
      // Get image metadata
      const image = sharp(imageBuffer)
      const metadata = await image.metadata()
      const width = metadata.width || 800
      const height = metadata.height || 600

      // Generate watermark text
      const watermarkText = this.generateWatermarkText(userData, config.text)
      
      // Create watermark overlay
      const watermarkOverlay = await this.createWatermarkOverlay(
        width,
        height,
        watermarkText,
        config
      )

      // Composite watermark onto image
      const watermarkedImage = await image
        .composite([{
          input: watermarkOverlay,
          blend: 'multiply'
        }])
        .toBuffer()

      return watermarkedImage

    } catch (error) {
      console.error('Failed to apply watermark:', error)
      // Return original image if watermarking fails
      return imageBuffer
    }
  }

  private generateWatermarkText(userData: UserWatermarkData, baseText: string): string {
    const parts: string[] = []
    
    if (baseText) {
      parts.push(baseText)
    }
    
    if (userData.userEmail) {
      parts.push(userData.userEmail)
    } else if (userData.userName) {
      parts.push(userData.userName)
    }
    
    if (userData.timestamp) {
      parts.push(userData.timestamp.toLocaleString())
    }
    
    if (userData.documentId) {
      parts.push(`Doc: ${userData.documentId.substring(0, 8)}`)
    }
    
    if (userData.pageNumber) {
      parts.push(`Page: ${userData.pageNumber}`)
    }
    
    if (userData.accessLevel) {
      parts.push(`Access: ${userData.accessLevel}`)
    }
    
    return parts.join(' • ') || 'Protected Content'
  }

  private async createWatermarkOverlay(
    width: number,
    height: number,
    text: string,
    config: Required<Omit<WatermarkOptions, 'positions'>>
  ): Promise<Buffer> {
    // Create canvas for watermark
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    // Set canvas to transparent
    ctx.clearRect(0, 0, width, height)

    // Configure text style
    ctx.font = `${config.fontSize}px Arial, sans-serif`
    ctx.fillStyle = this.hexToRgba(config.color, config.opacity)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Generate positions based on pattern
    const positions = this.generatePositions(width, height, config.pattern)

    // Draw watermarks at each position
    positions.forEach(({ x, y }) => {
      ctx.save()
      
      // Move to position and rotate
      ctx.translate(x, y)
      ctx.rotate((config.rotation * Math.PI) / 180)
      
      // Draw text
      ctx.fillText(text, 0, 0)
      
      ctx.restore()
    })

    // Convert canvas to buffer
    return canvas.toBuffer('image/png')
  }

  private generatePositions(
    width: number,
    height: number,
    pattern: WatermarkOptions['pattern']
  ): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = []
    
    switch (pattern) {
      case 'diagonal':
        // Diagonal pattern across the entire area
        const spacing = Math.min(width, height) / 4
        for (let x = -width; x < width * 2; x += spacing) {
          for (let y = -height; y < height * 2; y += spacing) {
            positions.push({ x, y })
          }
        }
        break
        
      case 'grid':
        // Regular grid pattern
        const gridSpacing = Math.min(width, height) / 5
        for (let x = gridSpacing; x < width; x += gridSpacing) {
          for (let y = gridSpacing; y < height; y += gridSpacing) {
            positions.push({ x, y })
          }
        }
        break
        
      case 'corners':
        // Four corners
        const margin = Math.min(width, height) * 0.1
        positions.push(
          { x: margin, y: margin },
          { x: width - margin, y: margin },
          { x: margin, y: height - margin },
          { x: width - margin, y: height - margin }
        )
        break
        
      case 'center':
        // Center only
        positions.push({ x: width / 2, y: height / 2 })
        break
        
      case 'random':
        // Random positions
        const numPositions = Math.floor((width * height) / 50000) // Density based on area
        for (let i = 0; i < Math.max(5, numPositions); i++) {
          positions.push({
            x: Math.random() * width,
            y: Math.random() * height
          })
        }
        break
        
      default:
        // Fallback to diagonal
        const defaultSpacing = Math.min(width, height) / 4
        for (let x = -width; x < width * 2; x += defaultSpacing) {
          for (let y = -height; y < height * 2; y += defaultSpacing) {
            positions.push({ x, y })
          }
        }
    }
    
    return positions
  }

  private hexToRgba(hex: string, alpha: number): string {
    // Remove # if present
    hex = hex.replace('#', '')
    
    // Parse hex values
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  // Utility method to create multiple watermark layers for enhanced security
  async applyMultiLayerWatermark(
    imageBuffer: Buffer,
    userData: UserWatermarkData,
    layers: Array<Partial<WatermarkOptions>> = []
  ): Promise<Buffer> {
    let processedImage = imageBuffer

    // Default layers if none provided
    if (layers.length === 0) {
      layers = [
        { pattern: 'diagonal', opacity: 0.05, fontSize: 12 },
        { pattern: 'random', opacity: 0.03, fontSize: 10, rotation: 45 },
        { pattern: 'corners', opacity: 0.1, fontSize: 8 }
      ]
    }

    // Apply each layer
    for (const layerOptions of layers) {
      processedImage = await this.applyWatermark(
        processedImage,
        userData,
        layerOptions
      )
    }

    return processedImage
  }

  // Create invisible watermark using steganography-like techniques
  async applyInvisibleWatermark(
    imageBuffer: Buffer,
    userData: UserWatermarkData
  ): Promise<Buffer> {
    try {
      const image = sharp(imageBuffer)
      const metadata = await image.metadata()
      
      // Create a very subtle watermark by slightly modifying pixel values
      const watermarkData = JSON.stringify({
        userId: userData.userId,
        timestamp: userData.timestamp?.toISOString(),
        documentId: userData.documentId,
        pageNumber: userData.pageNumber
      })

      // For now, just apply a very light visible watermark
      // In a production system, you'd implement actual steganography
      return this.applyWatermark(imageBuffer, userData, {
        opacity: 0.01,
        fontSize: 8,
        pattern: 'random'
      })

    } catch (error) {
      console.error('Failed to apply invisible watermark:', error)
      return imageBuffer
    }
  }

  // Validate watermark integrity (for invisible watermarks)
  async validateWatermark(imageBuffer: Buffer): Promise<{
    isValid: boolean
    userData?: UserWatermarkData
    confidence: number
  }> {
    // This would implement watermark detection/validation
    // For now, return a placeholder
    return {
      isValid: true,
      confidence: 0.8
    }
  }
}

export const watermarkRenderer = new WatermarkRenderer()

// Predefined watermark configurations
export const WATERMARK_PRESETS = {
  LIGHT: {
    opacity: 0.05,
    fontSize: 12,
    pattern: 'diagonal' as const
  },
  
  MEDIUM: {
    opacity: 0.1,
    fontSize: 14,
    pattern: 'grid' as const
  },
  
  HEAVY: {
    opacity: 0.15,
    fontSize: 16,
    pattern: 'random' as const
  },
  
  SECURE: {
    opacity: 0.08,
    fontSize: 10,
    pattern: 'diagonal' as const
  },
  
  STAMP: {
    opacity: 0.2,
    fontSize: 20,
    pattern: 'center' as const,
    rotation: 0
  }
} as const