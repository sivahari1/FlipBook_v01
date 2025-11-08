'use client'

import { useEffect, useState } from 'react'
import { SecurityViolation } from '@/lib/drm-protection'

interface SimpleDevToolsDetectorProps {
  enabled?: boolean
  onViolation?: (violation: SecurityViolation) => void
  showWarning?: boolean
}

export function SimpleDevToolsDetector({
  enabled = true,
  onViolation,
  showWarning = true
}: SimpleDevToolsDetectorProps) {
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false)

  useEffect(() => {
    if (!enabled) return

    let detectionInterval: NodeJS.Timeout

    const detectDevTools = () => {
      const threshold = 200
      const widthDiff = window.outerWidth - window.innerWidth
      const heightDiff = window.outerHeight - window.innerHeight
      
      const isOpen = widthDiff > threshold || heightDiff > threshold

      if (isOpen !== isDevToolsOpen) {
        setIsDevToolsOpen(isOpen)
        
        if (isOpen) {
          const violation: SecurityViolation = {
            type: 'devtools_opened',
            details: 'Developer tools detected via window size monitoring',
            severity: 'high',
            timestamp: new Date(),
            userAgent: navigator.userAgent,
            url: window.location.href
          }

          onViolation?.(violation)
          
          if (showWarning) {
            showDevToolsWarning()
          }
        }
      }
    }

    // Run detection every 2 seconds
    detectionInterval = setInterval(detectDevTools, 2000)
    
    // Initial check
    detectDevTools()

    return () => {
      if (detectionInterval) {
        clearInterval(detectionInterval)
      }
    }
  }, [enabled, isDevToolsOpen, onViolation, showWarning])

  const showDevToolsWarning = () => {
    const warning = document.createElement('div')
    warning.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #dc2626, #b91c1c);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(220, 38, 38, 0.3);
      z-index: 10001;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 320px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
    `

    warning.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 18px; margin-right: 8px;">🛡️</span>
        <span style="font-weight: 600;">Developer Tools Detected</span>
      </div>
      <div style="margin-bottom: 8px; line-height: 1.4;">
        Please close developer tools to continue viewing this protected content.
      </div>
      <div style="font-size: 12px; opacity: 0.9; font-style: italic;">
        This action has been logged for security purposes.
      </div>
    `

    document.body.appendChild(warning)

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (warning.parentNode) {
        warning.parentNode.removeChild(warning)
      }
    }, 5000)

    // Allow manual dismissal
    warning.addEventListener('click', () => {
      if (warning.parentNode) {
        warning.parentNode.removeChild(warning)
      }
    })
  }

  // Apply content protection when dev tools are detected
  useEffect(() => {
    if (!enabled) return

    const protectedElements = document.querySelectorAll('.drm-protected-container, .pdf-viewer, .document-content')
    
    protectedElements.forEach(element => {
      const htmlElement = element as HTMLElement
      
      if (isDevToolsOpen) {
        // Blur content when dev tools are open
        htmlElement.style.filter = 'blur(10px)'
        htmlElement.style.pointerEvents = 'none'
        
        // Add overlay message if not already present
        if (!htmlElement.querySelector('.devtools-overlay')) {
          const overlay = document.createElement('div')
          overlay.className = 'devtools-overlay'
          overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            text-align: center;
            padding: 20px;
          `
          
          overlay.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 20px;">🔒</div>
            <h2 style="margin: 0 0 16px 0; color: #ef4444;">Content Protected</h2>
            <p style="margin: 0 0 16px 0; font-size: 16px; opacity: 0.9;">
              Developer tools detected. Please close them to continue viewing this content.
            </p>
          `
          
          htmlElement.style.position = 'relative'
          htmlElement.appendChild(overlay)
        }
      } else {
        // Restore content
        htmlElement.style.filter = ''
        htmlElement.style.pointerEvents = ''
        
        // Remove overlay
        const overlay = htmlElement.querySelector('.devtools-overlay')
        if (overlay) {
          overlay.remove()
        }
      }
    })
  }, [enabled, isDevToolsOpen])

  // Development mode indicator
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs px-3 py-2 rounded z-50">
        🔍 DevTools: {isDevToolsOpen ? 'DETECTED' : 'Not Detected'}
      </div>
    )
  }

  return null
}

export default SimpleDevToolsDetector