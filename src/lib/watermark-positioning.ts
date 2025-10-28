export interface Position {
  x: number
  y: number
  rotation?: number
  scale?: number
  opacity?: number
}

export interface WatermarkLayout {
  positions: Position[]
  pattern: string
  density: number
  coverage: number
}

export class WatermarkPositioning {
  private readonly MIN_SPACING = 100
  private readonly MAX_DENSITY = 0.3 // 30% coverage
  private readonly ROTATION_VARIANCE = 15 // ±15 degrees

  /**
   * Generate random but evenly distributed watermark positions
   */
  generateRandomPositions(
    width: number,
    height: number,
    density: number = 0.15,
    baseRotation: number = -45
  ): Position[] {
    const positions: Position[] = []
    const area = width * height
    const targetCount = Math.floor((area * density) / 10000) // Adjust density calculation
    
    // Use Poisson disk sampling for even distribution
    const positions2D = this.poissonDiskSampling(width, height, this.MIN_SPACING, targetCount)
    
    return positions2D.map(({ x, y }) => ({
      x,
      y,
      rotation: baseRotation + (Math.random() - 0.5) * this.ROTATION_VARIANCE,
      scale: 0.8 + Math.random() * 0.4, // Scale between 0.8 and 1.2
      opacity: 0.8 + Math.random() * 0.2 // Opacity between 0.8 and 1.0
    }))
  }

  /**
   * Generate diagonal pattern with slight randomization
   */
  generateDiagonalPattern(
    width: number,
    height: number,
    spacing: number = 200,
    baseRotation: number = -45
  ): Position[] {
    const positions: Position[] = []
    const jitter = spacing * 0.2 // 20% position jitter
    
    // Create diagonal grid with jitter
    for (let x = -width; x < width * 2; x += spacing) {
      for (let y = -height; y < height * 2; y += spacing) {
        const jitterX = (Math.random() - 0.5) * jitter
        const jitterY = (Math.random() - 0.5) * jitter
        const rotationJitter = (Math.random() - 0.5) * this.ROTATION_VARIANCE
        
        positions.push({
          x: x + jitterX,
          y: y + jitterY,
          rotation: baseRotation + rotationJitter,
          scale: 0.9 + Math.random() * 0.2,
          opacity: 0.9 + Math.random() * 0.1
        })
      }
    }
    
    return positions
  }

  /**
   * Generate grid pattern with rotation variance
   */
  generateGridPattern(
    width: number,
    height: number,
    spacing: number = 150,
    baseRotation: number = 0
  ): Position[] {
    const positions: Position[] = []
    const rotations = [0, 45, -45, 90] // Multiple rotation angles
    
    for (let x = spacing; x < width; x += spacing) {
      for (let y = spacing; y < height; y += spacing) {
        const randomRotation = rotations[Math.floor(Math.random() * rotations.length)]
        
        positions.push({
          x,
          y,
          rotation: baseRotation + randomRotation,
          scale: 0.8 + Math.random() * 0.4,
          opacity: 0.7 + Math.random() * 0.3
        })
      }
    }
    
    return positions
  }

  /**
   * Generate corner positions with multiple layers
   */
  generateCornerPositions(
    width: number,
    height: number,
    margin: number = 50
  ): Position[] {
    const positions: Position[] = []
    const corners = [
      { x: margin, y: margin, rotation: 0 },
      { x: width - margin, y: margin, rotation: 90 },
      { x: margin, y: height - margin, rotation: -90 },
      { x: width - margin, y: height - margin, rotation: 180 }
    ]
    
    // Add multiple layers at each corner
    corners.forEach(corner => {
      for (let layer = 0; layer < 3; layer++) {
        const offset = layer * 20
        positions.push({
          x: corner.x + (Math.random() - 0.5) * offset,
          y: corner.y + (Math.random() - 0.5) * offset,
          rotation: corner.rotation + (Math.random() - 0.5) * 30,
          scale: 1 - layer * 0.2,
          opacity: 1 - layer * 0.3
        })
      }
    })
    
    return positions
  }

  /**
   * Generate spiral pattern
   */
  generateSpiralPattern(
    width: number,
    height: number,
    density: number = 0.1
  ): Position[] {
    const positions: Position[] = []
    const centerX = width / 2
    const centerY = height / 2
    const maxRadius = Math.min(width, height) / 2
    const turns = 3
    const pointsPerTurn = Math.floor(50 * density)
    
    for (let turn = 0; turn < turns; turn++) {
      for (let point = 0; point < pointsPerTurn; point++) {
        const angle = (turn + point / pointsPerTurn) * 2 * Math.PI
        const radius = (turn + point / pointsPerTurn) * maxRadius / turns
        
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        
        if (x >= 0 && x <= width && y >= 0 && y <= height) {
          positions.push({
            x,
            y,
            rotation: (angle * 180 / Math.PI) + 90,
            scale: 0.8 + Math.random() * 0.4,
            opacity: 0.8 + Math.random() * 0.2
          })
        }
      }
    }
    
    return positions
  }

  /**
   * Generate adaptive pattern based on content analysis
   */
  generateAdaptivePattern(
    width: number,
    height: number,
    contentAreas: Array<{ x: number; y: number; width: number; height: number }> = []
  ): Position[] {
    const positions: Position[] = []
    const gridSize = 100
    
    // Create a grid and check each cell
    for (let x = 0; x < width; x += gridSize) {
      for (let y = 0; y < height; y += gridSize) {
        const cellCenter = { x: x + gridSize / 2, y: y + gridSize / 2 }
        
        // Check if this cell overlaps with important content
        const overlapsContent = contentAreas.some(area => 
          cellCenter.x >= area.x && 
          cellCenter.x <= area.x + area.width &&
          cellCenter.y >= area.y && 
          cellCenter.y <= area.y + area.height
        )
        
        if (!overlapsContent) {
          // Place watermark in empty areas
          positions.push({
            x: cellCenter.x + (Math.random() - 0.5) * gridSize * 0.5,
            y: cellCenter.y + (Math.random() - 0.5) * gridSize * 0.5,
            rotation: -45 + (Math.random() - 0.5) * 30,
            scale: 0.7 + Math.random() * 0.3,
            opacity: 0.6 + Math.random() * 0.2
          })
        } else {
          // Place lighter watermarks over content
          if (Math.random() < 0.3) { // 30% chance
            positions.push({
              x: cellCenter.x,
              y: cellCenter.y,
              rotation: -45 + (Math.random() - 0.5) * 20,
              scale: 0.5 + Math.random() * 0.2,
              opacity: 0.3 + Math.random() * 0.2
            })
          }
        }
      }
    }
    
    return positions
  }

  /**
   * Poisson disk sampling for even distribution
   */
  private poissonDiskSampling(
    width: number,
    height: number,
    minDistance: number,
    maxPoints: number
  ): Array<{ x: number; y: number }> {
    const points: Array<{ x: number; y: number }> = []
    const grid: Array<Array<{ x: number; y: number } | null>> = []
    const cellSize = minDistance / Math.sqrt(2)
    const gridWidth = Math.ceil(width / cellSize)
    const gridHeight = Math.ceil(height / cellSize)
    
    // Initialize grid
    for (let i = 0; i < gridWidth; i++) {
      grid[i] = []
      for (let j = 0; j < gridHeight; j++) {
        grid[i][j] = null
      }
    }
    
    // Start with a random point
    const firstPoint = {
      x: Math.random() * width,
      y: Math.random() * height
    }
    
    points.push(firstPoint)
    const activeList = [firstPoint]
    
    const gridX = Math.floor(firstPoint.x / cellSize)
    const gridY = Math.floor(firstPoint.y / cellSize)
    grid[gridX][gridY] = firstPoint
    
    while (activeList.length > 0 && points.length < maxPoints) {
      const randomIndex = Math.floor(Math.random() * activeList.length)
      const point = activeList[randomIndex]
      let found = false
      
      // Try to generate a new point around the selected point
      for (let i = 0; i < 30; i++) {
        const angle = Math.random() * 2 * Math.PI
        const distance = minDistance + Math.random() * minDistance
        
        const newPoint = {
          x: point.x + Math.cos(angle) * distance,
          y: point.y + Math.sin(angle) * distance
        }
        
        // Check if the new point is valid
        if (newPoint.x >= 0 && newPoint.x < width && 
            newPoint.y >= 0 && newPoint.y < height &&
            this.isValidPoint(newPoint, points, minDistance, grid, cellSize)) {
          
          points.push(newPoint)
          activeList.push(newPoint)
          
          const newGridX = Math.floor(newPoint.x / cellSize)
          const newGridY = Math.floor(newPoint.y / cellSize)
          grid[newGridX][newGridY] = newPoint
          
          found = true
          break
        }
      }
      
      if (!found) {
        activeList.splice(randomIndex, 1)
      }
    }
    
    return points
  }

  private isValidPoint(
    point: { x: number; y: number },
    existingPoints: Array<{ x: number; y: number }>,
    minDistance: number,
    grid: Array<Array<{ x: number; y: number } | null>>,
    cellSize: number
  ): boolean {
    const gridX = Math.floor(point.x / cellSize)
    const gridY = Math.floor(point.y / cellSize)
    
    // Check surrounding grid cells
    for (let i = Math.max(0, gridX - 2); i <= Math.min(grid.length - 1, gridX + 2); i++) {
      for (let j = Math.max(0, gridY - 2); j <= Math.min(grid[0].length - 1, gridY + 2); j++) {
        const neighbor = grid[i][j]
        if (neighbor) {
          const distance = Math.sqrt(
            Math.pow(point.x - neighbor.x, 2) + Math.pow(point.y - neighbor.y, 2)
          )
          if (distance < minDistance) {
            return false
          }
        }
      }
    }
    
    return true
  }

  /**
   * Create a complete watermark layout
   */
  createWatermarkLayout(
    width: number,
    height: number,
    pattern: 'random' | 'diagonal' | 'grid' | 'corners' | 'spiral' | 'adaptive' = 'diagonal',
    options: {
      density?: number
      spacing?: number
      baseRotation?: number
      contentAreas?: Array<{ x: number; y: number; width: number; height: number }>
    } = {}
  ): WatermarkLayout {
    const { density = 0.15, spacing = 200, baseRotation = -45, contentAreas = [] } = options
    
    let positions: Position[] = []
    
    switch (pattern) {
      case 'random':
        positions = this.generateRandomPositions(width, height, density, baseRotation)
        break
      case 'diagonal':
        positions = this.generateDiagonalPattern(width, height, spacing, baseRotation)
        break
      case 'grid':
        positions = this.generateGridPattern(width, height, spacing, baseRotation)
        break
      case 'corners':
        positions = this.generateCornerPositions(width, height, spacing / 4)
        break
      case 'spiral':
        positions = this.generateSpiralPattern(width, height, density)
        break
      case 'adaptive':
        positions = this.generateAdaptivePattern(width, height, contentAreas)
        break
      default:
        positions = this.generateDiagonalPattern(width, height, spacing, baseRotation)
    }
    
    // Calculate coverage
    const totalArea = width * height
    const watermarkArea = positions.length * 100 * 20 // Approximate area per watermark
    const coverage = Math.min(watermarkArea / totalArea, 1)
    
    return {
      positions,
      pattern,
      density: positions.length / (totalArea / 10000),
      coverage
    }
  }
}

export const watermarkPositioning = new WatermarkPositioning()

// Predefined layout configurations
export const WATERMARK_LAYOUTS = {
  LIGHT_DIAGONAL: {
    pattern: 'diagonal' as const,
    density: 0.1,
    spacing: 300,
    baseRotation: -45
  },
  
  MEDIUM_GRID: {
    pattern: 'grid' as const,
    density: 0.15,
    spacing: 200,
    baseRotation: 0
  },
  
  HEAVY_RANDOM: {
    pattern: 'random' as const,
    density: 0.25,
    baseRotation: -45
  },
  
  CORNER_STAMPS: {
    pattern: 'corners' as const,
    spacing: 80
  },
  
  SPIRAL_ARTISTIC: {
    pattern: 'spiral' as const,
    density: 0.12
  },
  
  ADAPTIVE_SMART: {
    pattern: 'adaptive' as const,
    density: 0.18
  }
} as const