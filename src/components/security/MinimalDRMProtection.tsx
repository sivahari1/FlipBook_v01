'use client'

import { useEffect, ReactNode } from 'react'

interface MinimalDRMProtectionProps {
  children: ReactNode
  enabled?: boolean
}

export function MinimalDRMProtection({ children, enabled = true }: MinimalDRMProtectionProps) {
  useEffect(() => {
    if (!enabled) return

    // Disable right-click context menu
    const handleContextMenu = (e: Event) => {
      e.preventDefault()
      console.warn('🚨 Right-click blocked')
      return false
    }

    // Disable text selection
    const handleSelectStart = (e: Event) => {
      e.preventDefault()
      return false
    }

    // Block keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const blockedKeys = ['F12', 'PrintScreen']
      const blockedCombos = [
        { ctrl: true, key: 'c' }, // Copy
        { ctrl: true, key: 'v' }, // Paste
        { ctrl: true, key: 'x' }, // Cut
        { ctrl: true, key: 'a' }, // Select all
        { ctrl: true, key: 's' }, // Save
        { ctrl: true, key: 'p' }, // Print
        { ctrl: true, shift: true, key: 'i' }, // Dev tools
        { ctrl: true, shift: true, key: 'j' }, // Console
        { ctrl: true, shift: true, key: 'c' }, // Inspect
        { ctrl: true, key: 'u' }, // View source
      ]

      if (blockedKeys.includes(e.key)) {
        e.preventDefault()
        console.warn('🚨 Blocked key:', e.key)
        return false
      }

      for (const combo of blockedCombos) {
        if (
          (combo.ctrl && e.ctrlKey) &&
          (combo.shift ? e.shiftKey : !e.shiftKey) &&
          e.key.toLowerCase() === combo.key.toLowerCase()
        ) {
          e.preventDefault()
          console.warn('🚨 Blocked shortcut:', `${combo.ctrl ? 'Ctrl+' : ''}${combo.shift ? 'Shift+' : ''}${combo.key}`)
          return false
        }
      }
    }

    // Prevent drag operations
    const handleDragStart = (e: Event) => {
      e.preventDefault()
      return false
    }

    // Block printing
    const handleBeforePrint = (e: Event) => {
      e.preventDefault()
      console.warn('🚨 Print blocked')
      return false
    }

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu, true)
    document.addEventListener('selectstart', handleSelectStart, true)
    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('dragstart', handleDragStart, true)
    window.addEventListener('beforeprint', handleBeforePrint, true)

    // Add CSS to prevent selection
    const style = document.createElement('style')
    style.id = 'minimal-drm-styles'
    style.textContent = `
      .drm-protected * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
        -webkit-tap-highlight-color: transparent !important;
        -webkit-user-drag: none !important;
        -khtml-user-drag: none !important;
        -moz-user-drag: none !important;
        -o-user-drag: none !important;
        user-drag: none !important;
      }
      
      @media print {
        .drm-protected * { 
          display: none !important; 
        }
        .drm-protected::before {
          content: "🔒 This document is protected and cannot be printed.";
          display: block !important;
          font-size: 24px;
          text-align: center;
          margin-top: 50px;
          color: #dc2626;
        }
      }
    `
    
    if (!document.querySelector('#minimal-drm-styles')) {
      document.head.appendChild(style)
    }

    console.log('🔒 Minimal DRM Protection activated')

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, true)
      document.removeEventListener('selectstart', handleSelectStart, true)
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('dragstart', handleDragStart, true)
      window.removeEventListener('beforeprint', handleBeforePrint, true)
      
      const existingStyle = document.querySelector('#minimal-drm-styles')
      if (existingStyle) {
        existingStyle.remove()
      }
      
      console.log('🔓 Minimal DRM Protection deactivated')
    }
  }, [enabled])

  return (
    <div className="drm-protected" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
      {children}
    </div>
  )
}

export default MinimalDRMProtection