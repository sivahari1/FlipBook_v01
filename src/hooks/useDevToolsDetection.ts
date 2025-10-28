'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface DevToolsDetectionOptions {
  enabled?: boolean
  strictMode?: boolean
  onDetectionChange?: (isOpen: boolean, method: string, confidence: number) => void
  detectionInterval?: number
}

interface DevToolsDetectionResult {
  isOpen: boolean
  detectionMethod: string
  confidence: number
  firstDetected: Date | null
  lastDetected: Date | null
  detectionCount: number
}

export function useDevToolsDetection(options: DevToolsDetectionOptions = {}) {
  const {
    enabled = true,
    strictMode = true,
    onDetectionChange,
    detectionInterval = 500
  } = options

  const [detection, setDetection] = useState<DevToolsDetectionResult>({
    isOpen: false,
    detectionMethod: '',
    confidence: 0,
    firstDetected: null,
    lastDetected: null,
    detectionCount: 0
  })

  const intervalRef = useRef<NodeJS.Timeout>()
  const lastSizeRef = useRef({ width: 0, height: 0 })
  const debuggerCountRef = useRef(0)

  const updateDetection = useCallback((
    isOpen: boolean, 
    method: string, 
    confidence: number
  ) => {
    setDetection(prev => {
      const now = new Date()
      const newDetection = {
        isOpen,
        detectionMethod: method,
        confidence,
        firstDetected: prev.firstDetected || (isOpen ? now : null),
        lastDetected: isOpen ? now : prev.lastDetected,
        detectionCount: isOpen && !prev.isOpen ? prev.detectionCount + 1 : prev.detectionCount
      }

      // Trigger callback if state changed
      if (prev.isOpen !== isOpen) {
        onDetectionChange?.(isOpen, method, confidence)
      }

      return newDetection
    })
  }, [onDetectionChange])

  // Detection Method 1: Window size analysis
  const detectByWindowSize = useCallback(() => {
    const threshold = 200
    const widthDiff = window.outerWidth - window.innerWidth
    const heightDiff = window.outerHeight - window.innerHeight
    
    if (widthDiff > threshold || heightDiff > threshold) {
      const confidence = Math.min(1, Math.max(widthDiff, heightDiff) / 400)
      updateDetection(true, 'window-size', confidence)
      return true
    }
    
    return false
  }, [updateDetection])

  // Detection Method 2: Debugger timing
  const detectByDebugger = useCallback(() => {
    const start = performance.now()
    
    try {
      debugger
      const end = performance.now()
      
      if (end - start > 100) {
        debuggerCountRef.current++
        updateDetection(true, 'debugger-timing', 0.9)
        return true
      }
    } catch (e) {
      // Ignore errors
    }
    
    return false
  }, [updateDetection])

  // Detection Method 3: Console detection
  const detectByConsole = useCallback(() => {
    let detected = false
    const originalConsole = { ...console }
    
    // Temporarily override console methods
    const testConsole = () => {
      console.log('%c', 'color: transparent')
      detected = true
    }
    
    // Override and test
    console.log = testConsole
    console.clear()
    
    // Restore console
    Object.assign(console, originalConsole)
    
    if (detected) {
      updateDetection(true, 'console-override', 0.7)
      return true
    }
    
    return false
  }, [updateDetection])

  // Detection Method 4: Performance timing
  const detectByPerformance = useCallback(() => {
    const start = performance.now()
    
    // Execute a simple operation
    for (let i = 0; i < 1000; i++) {
      Math.random()
    }
    
    const end = performance.now()
    
    if (end - start > 50) {
      updateDetection(true, 'performance-timing', 0.6)
      return true
    }
    
    return false
  }, [updateDetection])

  // Detection Method 5: DevTools API detection
  const detectByDevToolsAPI = useCallback(() => {
    const indicators = [
      '__REACT_DEVTOOLS_GLOBAL_HOOK__',
      '__VUE_DEVTOOLS_GLOBAL_HOOK__',
      '__REDUX_DEVTOOLS_EXTENSION__',
      'webkitStorageInfo'
    ]
    
    let count = 0
    indicators.forEach(indicator => {
      if ((window as any)[indicator]) count++
    })
    
    if (count > 0) {
      const confidence = Math.min(1, count / 2)
      updateDetection(true, 'devtools-api', confidence)
      return true
    }
    
    return false
  }, [updateDetection])

  // Detection Method 6: Element inspection
  const detectByElementInspection = useCallback(() => {
    const element = document.createElement('div')
    element.id = 'devtools-test-' + Date.now()
    
    let detected = false
    
    // Add to DOM
    document.body.appendChild(element)
    
    // Check if element properties are being accessed
    const originalGetAttribute = element.getAttribute
    element.getAttribute = function(name) {
      if (name === 'id') {
        detected = true
      }
      return originalGetAttribute.call(this, name)
    }
    
    // Trigger potential inspection
    setTimeout(() => {
      if (detected) {
        updateDetection(true, 'element-inspection', 0.8)
      }
      
      // Cleanup
      if (element.parentNode) {
        element.parentNode.removeChild(element)
      }
    }, 100)
    
    return detected
  }, [updateDetection])

  // Main detection function
  const runDetection = useCallback(() => {
    if (!enabled) return

    let detected = false
    
    // Always run window size detection (most reliable)
    detected = detectByWindowSize() || detected
    
    if (strictMode) {
      // Run additional detection methods
      detected = detectByDebugger() || detected
      detected = detectByPerformance() || detected
      detected = detectByDevToolsAPI() || detected
      
      // Run these less frequently
      if (Math.random() < 0.1) {
        detectByConsole()
        detectByElementInspection()
      }
    }
    
    // If no detection methods triggered, assume closed
    if (!detected && detection.isOpen) {
      updateDetection(false, 'none', 0)
    }
  }, [
    enabled,
    strictMode,
    detection.isOpen,
    detectByWindowSize,
    detectByDebugger,
    detectByPerformance,
    detectByDevToolsAPI,
    detectByConsole,
    detectByElementInspection,
    updateDetection
  ])

  // Set up detection interval
  useEffect(() => {
    if (!enabled) return

    intervalRef.current = setInterval(runDetection, detectionInterval)
    
    // Run initial detection
    runDetection()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, detectionInterval, runDetection])

  // Utility functions
  const getDetectionHistory = useCallback(() => {
    return {
      totalDetections: detection.detectionCount,
      firstDetected: detection.firstDetected,
      lastDetected: detection.lastDetected,
      currentMethod: detection.detectionMethod,
      currentConfidence: detection.confidence
    }
  }, [detection])

  const isHighConfidenceDetection = useCallback(() => {
    return detection.confidence > 0.8
  }, [detection.confidence])

  const getDetectionAge = useCallback(() => {
    if (!detection.lastDetected) return 0
    return Date.now() - detection.lastDetected.getTime()
  }, [detection.lastDetected])

  return {
    // Current state
    isOpen: detection.isOpen,
    detectionMethod: detection.detectionMethod,
    confidence: detection.confidence,
    
    // History
    firstDetected: detection.firstDetected,
    lastDetected: detection.lastDetected,
    detectionCount: detection.detectionCount,
    
    // Utility functions
    getDetectionHistory,
    isHighConfidenceDetection,
    getDetectionAge,
    
    // Manual control
    forceDetection: () => runDetection(),
    
    // Status checks
    isRecentDetection: getDetectionAge() < 5000, // Within last 5 seconds
    isReliableDetection: detection.confidence > 0.7,
    
    // Raw detection object
    detection
  }
}

export type { DevToolsDetectionResult, DevToolsDetectionOptions }