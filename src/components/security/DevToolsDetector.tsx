'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { SecurityViolation } from '@/lib/drm-protection'

interface DevToolsDetectorProps {
  enabled?: boolean
  onDevToolsOpen?: (isOpen: boolean) => void
  onViolation?: (violation: SecurityViolation) => void
  hideContent?: boolean
  blurContent?: boolean
  showWarning?: boolean
  strictMode?: boolean
}

interface DevToolsState {
  isOpen: boolean
  detectionMethod: string
  confidence: number
  firstDetected: Date | null
  lastDetected: Date | null
}

export function DevToolsDetector({
  enabled = true,
  onDevToolsOpen,
  onViolation,
  hideContent = true,
  blurContent = true,
  showWarning = true,
  strictMode = true
}: DevToolsDetectorProps) {
  const [devToolsState, setDevToolsState] = useState<DevToolsState>({
    isOpen: false,
    detectionMethod: '',
    confidence: 0,
    firstDetected: null,
    lastDetected: null
  })

  const detectionIntervalRef = useRef<NodeJS.Timeout>()
  const consoleDetectionRef = useRef<NodeJS.Timeout>()
  const performanceDetectionRef = useRef<NodeJS.Timeout>()
  const lastWindowSizeRef = useRef({ width: 0, height: 0 })
  const debuggerTriggeredRef = useRef(false)

  const recordViolation = useCallback((details: string, method: string, confidence: number) => {
    const violation: SecurityViolation = {
      type: 'devtools_opened',
      details,
      severity: confidence > 0.8 ? 'critical' : confidence > 0.5 ? 'high' : 'medium',
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    onViolation?.(violation)
    console.warn('🚨 Developer Tools Detected:', { method, confidence, details })
  }, [onViolation])

  const updateDevToolsState = useCallback((isOpen: boolean, method: string, confidence: number) => {
    setDevToolsState(prev => {
      const now = new Date()
      const newState = {
        isOpen,
        detectionMethod: method,
        confidence,
        firstDetected: prev.firstDetected || (isOpen ? now : null),
        lastDetected: isOpen ? now : prev.lastDetected
      }

      // Only trigger callbacks if state actually changed
      if (prev.isOpen !== isOpen) {
        onDevToolsOpen?.(isOpen)
        
        if (isOpen) {
          recordViolation(
            `Developer tools detected using ${method} (confidence: ${Math.round(confidence * 100)}%)`,
            method,
            confidence
          )
        }
      }

      return newState
    })
  }, [onDevToolsOpen, recordViolation])

  // Method 1: Window size detection (most reliable)
  const detectByWindowSize = useCallback(() => {
    const threshold = 200
    const widthDiff = window.outerWidth - window.innerWidth
    const heightDiff = window.outerHeight - window.innerHeight
    
    // Check if dev tools are docked
    const isDocked = widthDiff > threshold || heightDiff > threshold
    
    if (isDocked) {
      const confidence = Math.min(1, Math.max(widthDiff, heightDiff) / 400)
      updateDevToolsState(true, 'window-size', confidence)
      return true
    }
    
    return false
  }, [updateDevToolsState])

  // Method 2: Console detection
  const detectByConsole = useCallback(() => {
    let detected = false
    
    // Create a custom console method that detects when dev tools are open
    const originalLog = console.log
    const originalWarn = console.warn
    const originalError = console.error
    
    // Override console methods to detect usage
    console.log = function(...args) {
      detected = true
      return originalLog.apply(console, args)
    }
    
    console.warn = function(...args) {
      detected = true
      return originalWarn.apply(console, args)
    }
    
    console.error = function(...args) {
      detected = true
      return originalError.apply(console, args)
    }
    
    // Trigger a console call and check if it was intercepted
    setTimeout(() => {
      console.clear()
      if (detected) {
        updateDevToolsState(true, 'console-override', 0.7)
      }
      
      // Restore original methods
      console.log = originalLog
      console.warn = originalWarn
      console.error = originalError
    }, 100)
    
    return detected
  }, [updateDevToolsState])

  // Method 3: Debugger statement detection
  const detectByDebugger = useCallback(() => {
    const start = performance.now()
    
    try {
      // This will pause execution if dev tools are open
      debugger
      const end = performance.now()
      
      // If execution was paused, it took longer than normal
      if (end - start > 100) {
        debuggerTriggeredRef.current = true
        updateDevToolsState(true, 'debugger-pause', 0.9)
        return true
      }
    } catch (e) {
      // Debugger might throw in some environments
    }
    
    return false
  }, [updateDevToolsState])

  // Method 4: Performance timing detection
  const detectByPerformance = useCallback(() => {
    const start = performance.now()
    
    // Create a function that should execute quickly
    const testFunction = () => {
      for (let i = 0; i < 1000; i++) {
        Math.random()
      }
    }
    
    testFunction()
    const end = performance.now()
    
    // If it took too long, dev tools might be interfering
    if (end - start > 50) {
      updateDevToolsState(true, 'performance-timing', 0.6)
      return true
    }
    
    return false
  }, [updateDevToolsState])

  // Method 5: Element inspection detection
  const detectByElementInspection = useCallback(() => {
    const element = document.createElement('div')
    element.id = 'devtools-detector-' + Date.now()
    
    // Add element to DOM
    document.body.appendChild(element)
    
    // Check if element is being inspected
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.target === element) {
          updateDevToolsState(true, 'element-inspection', 0.8)
        }
      })
    })
    
    observer.observe(element, { attributes: true, attributeOldValue: true })
    
    // Clean up after a short time
    setTimeout(() => {
      observer.disconnect()
      if (element.parentNode) {
        element.parentNode.removeChild(element)
      }
    }, 1000)
  }, [updateDevToolsState])

  // Method 6: DevTools-specific API detection
  const detectByDevToolsAPI = useCallback(() => {
    // Check for common dev tools objects
    const devToolsIndicators = [
      'webkitStorageInfo',
      'webkitIndexedDB',
      '__REACT_DEVTOOLS_GLOBAL_HOOK__',
      '__VUE_DEVTOOLS_GLOBAL_HOOK__',
      '__REDUX_DEVTOOLS_EXTENSION__'
    ]
    
    let indicatorCount = 0
    devToolsIndicators.forEach(indicator => {
      if ((window as any)[indicator]) {
        indicatorCount++
      }
    })
    
    if (indicatorCount > 0) {
      const confidence = Math.min(1, indicatorCount / 3)
      updateDevToolsState(true, 'devtools-api', confidence)
      return true
    }
    
    return false
  }, [updateDevToolsState])

  // Method 7: Network timing detection
  const detectByNetworkTiming = useCallback(() => {
    const img = new Image()
    const start = performance.now()
    
    img.onload = img.onerror = () => {
      const end = performance.now()
      
      // If network request took unusually long, dev tools might be open
      if (end - start > 1000) {
        updateDevToolsState(true, 'network-timing', 0.5)
      }
    }
    
    // Use a small data URL to avoid actual network request
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  }, [updateDevToolsState])

  // Comprehensive detection function
  const runDetection = useCallback(() => {
    if (!enabled) return

    let detected = false
    
    // Run all detection methods
    detected = detectByWindowSize() || detected
    
    if (strictMode) {
      detected = detectByDebugger() || detected
      detected = detectByPerformance() || detected
      detected = detectByDevToolsAPI() || detected
      
      // Run these less frequently to avoid performance impact
      if (Math.random() < 0.1) {
        detectByElementInspection()
        detectByNetworkTiming()
      }
    }
    
    // If no detection methods triggered, assume dev tools are closed
    if (!detected && devToolsState.isOpen) {
      updateDevToolsState(false, 'none', 0)
    }
  }, [
    enabled,
    strictMode,
    devToolsState.isOpen,
    detectByWindowSize,
    detectByDebugger,
    detectByPerformance,
    detectByDevToolsAPI,
    detectByElementInspection,
    detectByNetworkTiming,
    updateDevToolsState
  ])

  // Apply content protection when dev tools are detected
  useEffect(() => {
    if (!enabled) return

    const protectedElements = document.querySelectorAll('.drm-protected-container, .pdf-viewer, .document-content')
    
    protectedElements.forEach(element => {
      const htmlElement = element as HTMLElement
      
      if (devToolsState.isOpen) {
        if (hideContent) {
          htmlElement.style.visibility = 'hidden'
        } else if (blurContent) {
          htmlElement.style.filter = 'blur(20px)'
          htmlElement.style.pointerEvents = 'none'
        }
        
        // Add overlay message
        if (!htmlElement.querySelector('.devtools-warning')) {
          const overlay = document.createElement('div')
          overlay.className = 'devtools-warning'
          overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            text-align: center;
            padding: 20px;
          `
          
          overlay.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 20px;">🔒</div>
            <h2 style="margin: 0 0 16px 0; color: #ef4444;">Content Protected</h2>
            <p style="margin: 0 0 16px 0; font-size: 16px; opacity: 0.9;">
              Developer tools have been detected. Please close them to continue viewing this content.
            </p>
            <p style="margin: 0; font-size: 14px; opacity: 0.7;">
              Detection method: ${devToolsState.detectionMethod} (${Math.round(devToolsState.confidence * 100)}% confidence)
            </p>
          `
          
          htmlElement.style.position = 'relative'
          htmlElement.appendChild(overlay)
        }
      } else {
        // Restore content
        htmlElement.style.visibility = ''
        htmlElement.style.filter = ''
        htmlElement.style.pointerEvents = ''
        
        // Remove overlay
        const overlay = htmlElement.querySelector('.devtools-warning')
        if (overlay) {
          overlay.remove()
        }
      }
    })
  }, [enabled, devToolsState.isOpen, devToolsState.detectionMethod, devToolsState.confidence, hideContent, blurContent])

  // Show warning notification
  useEffect(() => {
    if (!enabled || !showWarning || !devToolsState.isOpen) return

    const showWarningNotification = () => {
      const notification = document.createElement('div')
      notification.className = 'devtools-warning-notification'
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #dc2626, #b91c1c);
        color: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(220, 38, 38, 0.3);
        z-index: 10001;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        max-width: 350px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
        animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      `

      notification.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <span style="font-size: 20px; margin-right: 10px;">🛡️</span>
          <span style="font-weight: 600;">Developer Tools Detected</span>
        </div>
        <div style="margin-bottom: 12px; line-height: 1.4;">
          Content has been hidden for security. Please close developer tools to continue.
        </div>
        <div style="font-size: 12px; opacity: 0.9; font-style: italic;">
          Method: ${devToolsState.detectionMethod} • Confidence: ${Math.round(devToolsState.confidence * 100)}%
        </div>
      `

      document.body.appendChild(notification)

      // Auto-remove after 10 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.style.animation = 'slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          setTimeout(() => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification)
            }
          }, 300)
        }
      }, 10000)
    }

    showWarningNotification()
  }, [enabled, showWarning, devToolsState.isOpen, devToolsState.detectionMethod, devToolsState.confidence])

  // Set up detection intervals
  useEffect(() => {
    if (!enabled) return

    // Main detection loop - runs frequently
    detectionIntervalRef.current = setInterval(runDetection, 500)

    // Console detection - runs less frequently
    if (strictMode) {
      consoleDetectionRef.current = setInterval(detectByConsole, 2000)
    }

    // Performance detection - runs even less frequently
    if (strictMode) {
      performanceDetectionRef.current = setInterval(detectByPerformance, 5000)
    }

    // Initial detection
    runDetection()

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
      if (consoleDetectionRef.current) {
        clearInterval(consoleDetectionRef.current)
      }
      if (performanceDetectionRef.current) {
        clearInterval(performanceDetectionRef.current)
      }
    }
  }, [enabled, strictMode, runDetection, detectByConsole, detectByPerformance])

  // Add CSS animations if not present
  useEffect(() => {
    if (!document.querySelector('#devtools-detector-styles')) {
      const style = document.createElement('style')
      style.id = 'devtools-detector-styles'
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  // Development mode indicator
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs px-3 py-2 rounded z-50">
        🔍 DevTools: {devToolsState.isOpen ? 'DETECTED' : 'Not Detected'} 
        {devToolsState.isOpen && ` (${devToolsState.detectionMethod}, ${Math.round(devToolsState.confidence * 100)}%)`}
      </div>
    )
  }

  return null
}

export default DevToolsDetector
export type { DevToolsState }