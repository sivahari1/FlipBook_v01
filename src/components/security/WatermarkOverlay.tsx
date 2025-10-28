'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'

interface WatermarkConfig {
  text?: string
  opacity?: number
  fontSize?: number
  color?: string
  rotation?: number
  positions?: Array<{ x: number; y: number }>
  includeTimestamp?: boolean
  includeUserInfo?: boolean
  pattern?: 'diagonal' | 'grid' | 'corners' | 'center' | 'random'
}

interface WatermarkOverlayProps {
  enabled?: boolean
  config?: WatermarkConfig
  documentId?: string
  pageNumber?: number
  className?: string
}

export function WatermarkOverlay({
  enabled = true,
  config = {},
  documentId,
  pageNumber,
  className = ''
}: WatermarkOverlayProps) {
  const { data: session } = useSession()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // Default watermark configuration
  const defaultConfig: WatermarkConfig = {
    text: '',
    opacity: 0.1,
    fontSize: 14,
    color: '#000000',
    rotation: -45,
    includeTimestamp: true,
    includeUserInfo: true,
    pattern: 'diagonal'
  }

  const finalConfig = { ...defaultConfig, ...config }

  // Generate watermark text
  const generateWatermarkText = () => {
    let watermarkText = finalConfig.text || ''
    
    if (finalConfig.includeUserInfo && session?.user?.email) {
      watermarkText += (watermarkText ? ' • ' : '') + session.user.email
    }
    
    if (finalConfig.includeTimestamp) {
      const timestamp = new Date().toLocaleString()
      watermarkText += (watermarkText ? ' • ' : '') + timestamp
    }
    
    if (documentId) {
      watermarkText += (watermarkText ? ' • ' : '') + `Doc: ${documentId.substring(0, 8)}`
    }
    
    if (pageNumber) {
      watermarkText += (watermarkText ? ' • ' : '') + `Page: ${pageNumber}`
    }
    
    return watermarkText || 'Protected Content'
  }

  // Generate watermark positions based on pattern
  const generatePositions = (width: number, height: number): Array<{ x: number; y: number }> => {
    const positions: Array<{ x: number; y: number }> = []
    
    switch (finalConfig.pattern) {
      case 'diagonal':
        // Diagonal pattern across the entire area
        const spacing = 200
        for (let x = -width; x < width * 2; x += spacing) {
          for (let y = -height; y < height * 2; y += spacing) {
            positions.push({ x, y })
          }
        }
        break
        
      case 'grid':
        // Regular grid pattern
        const gridSpacing = 150
        for (let x = gridSpacing; x < width; x += gridSpacing) {
          for (let y = gridSpacing; y < height; y += gridSpacing) {
            positions.push({ x, y })
          }
        }
        break
        
      case 'corners':
        // Four corners
        positions.push(
          { x: 50, y: 50 },
          { x: width - 50, y: 50 },
          { x: 50, y: height - 50 },
          { x: width - 50, y: height - 50 }
        )
        break
        
      case 'center':
        // Center only
        positions.push({ x: width / 2, y: height / 2 })
        break
        
      case 'random':
        // Random positions
        const numPositions = Math.floor((width * height) / 40000) // Density based on area
        for (let i = 0; i < numPositions; i++) {
          positions.push({
            x: Math.random() * width,
            y: Math.random() * height
          })
        }
        break
        
      default:
        // Use custom positions if provided
        if (finalConfig.positions) {
          positions.push(...finalConfig.positions)
        } else {
          // Fallback to diagonal
          const defaultSpacing = 200
          for (let x = -width; x < width * 2; x += defaultSpacing) {
            for (let y = -height; y < height * 2; y += defaultSpacing) {
              positions.push({ x, y })
            }
          }
        }
    }
    
    return positions
  }

  // Draw watermark on canvas
  const drawWatermark = () => {
    const canvas = canvasRef.current
    const container = containerRef.current
    
    if (!canvas || !container || !enabled) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Get container dimensions
    const rect = container.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    // Set canvas size
    canvas.width = width
    canvas.height = height
    setDimensions({ width, height })

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Configure text style
    ctx.font = `${finalConfig.fontSize}px Arial, sans-serif`
    ctx.fillStyle = finalConfig.color || '#000000'
    ctx.globalAlpha = finalConfig.opacity || 0.1
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Get watermark text
    const watermarkText = generateWatermarkText()
    
    // Generate positions
    const positions = generatePositions(width, height)

    // Draw watermarks at each position
    positions.forEach(({ x, y }) => {
      ctx.save()
      
      // Move to position and rotate
      ctx.translate(x, y)
      ctx.rotate((finalConfig.rotation || -45) * Math.PI / 180)
      
      // Draw text
      ctx.fillText(watermarkText, 0, 0)
      
      ctx.restore()
    })
  }

  // Update dimensions when container resizes
  useEffect(() => {
    const updateDimensions = () => {
      drawWatermark()
    }

    const resizeObserver = new ResizeObserver(updateDimensions)
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    // Initial draw
    setTimeout(updateDimensions, 100)

    return () => {
      resizeObserver.disconnect()
    }
  }, [enabled, finalConfig, session, documentId, pageNumber])

  // Redraw when session changes
  useEffect(() => {
    drawWatermark()
  }, [session])

  if (!enabled) return null

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none z-10 ${className}`}
      style={{ 
        mixBlendMode: 'multiply',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
      />
      
      {/* Additional CSS-based watermarks for extra security */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
              <text x="100" y="100" text-anchor="middle" dominant-baseline="middle" 
                    font-family="Arial" font-size="12" fill="${finalConfig.color || '#000000'}" 
                    transform="rotate(-45 100 100)" opacity="0.3">
                ${generateWatermarkText()}
              </text>
            </svg>
          `)}")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
          pointerEvents: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
      />
      
      {/* Invisible text for screen readers (accessibility) */}
      <span className="sr-only">
        This content is protected with digital watermarks
      </span>
    </div>
  )
}

export default WatermarkOverlay

// Utility function to create watermark configuration
export const createWatermarkConfig = (
  overrides: Partial<WatermarkConfig> = {}
): WatermarkConfig => ({
  text: '',
  opacity: 0.1,
  fontSize: 14,
  color: '#000000',
  rotation: -45,
  includeTimestamp: true,
  includeUserInfo: true,
  pattern: 'diagonal',
  ...overrides
})

// Predefined watermark patterns
export const WATERMARK_PATTERNS = {
  LIGHT: createWatermarkConfig({
    opacity: 0.05,
    fontSize: 12,
    pattern: 'diagonal'
  }),
  
  MEDIUM: createWatermarkConfig({
    opacity: 0.1,
    fontSize: 14,
    pattern: 'grid'
  }),
  
  HEAVY: createWatermarkConfig({
    opacity: 0.15,
    fontSize: 16,
    pattern: 'random'
  }),
  
  CORNERS_ONLY: createWatermarkConfig({
    opacity: 0.2,
    fontSize: 10,
    pattern: 'corners'
  }),
  
  CENTER_STAMP: createWatermarkConfig({
    opacity: 0.3,
    fontSize: 20,
    pattern: 'center',
    rotation: 0
  })
} as const