'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { WatermarkOverlay } from '@/components/security/WatermarkOverlay'

interface DocumentData {
  id: string
  title: string
  description?: string
  pageCount: number
  signedUrl: string
  viewCount: number
  owner: string
}

export default function PublicDocumentViewer() {
  const params = useParams()
  const [document, setDocument] = useState<DocumentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (params.shareKey) {
      fetchDocument(params.shareKey as string)
    }
  }, [params.shareKey])

  const fetchDocument = async (shareKey: string) => {
    try {
      const response = await fetch(`/api/documents/by-share-key/${shareKey}`, {
        headers: {
          'x-session-id': generateSessionId()
        }
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setDocument(data.document)
      } else {
        setError(data.error || 'Failed to load document')
      }
    } catch (err) {
      console.error('Error fetching document:', err)
      setError('Failed to load document')
    } finally {
      setLoading(false)
    }
  }

  const generateSessionId = () => {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  }

  const refreshSignedUrl = async () => {
    if (!params.shareKey) return
    
    try {
      const response = await fetch(`/api/documents/by-share-key/${params.shareKey}`)
      const data = await response.json()
      
      if (response.ok && data.success) {
        setDocument(prev => prev ? { ...prev, signedUrl: data.document.signedUrl } : null)
      }
    } catch (err) {
      console.error('Error refreshing signed URL:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading secure document...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="text-6xl mb-4">📄</div>
          <h1 className="text-2xl font-bold text-white mb-2">Document Not Found</h1>
          <p className="text-gray-300">The document you are looking for does not exist or has been removed.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="text-blue-500 text-2xl font-bold mr-4">📄</div>
              <div>
                <h1 className="text-xl font-bold text-white">{document.title}</h1>
                <p className="text-sm text-gray-400">
                  {document.pageCount} pages • Viewed {document.viewCount} times
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400">
                Shared by {document.owner}
              </div>
              <div className="px-3 py-1 bg-green-600 text-white text-xs rounded-full">
                🔒 Secure
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Viewer */}
      <div className="relative">
        <div className="max-w-6xl mx-auto p-8">
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden relative">
            {/* Watermark Overlay */}
            <WatermarkOverlay
              text={`Confidential • Tracked by FlipBook • ${new Date().toLocaleString()}`}
              opacity={0.1}
            />
            
            {/* PDF Viewer */}
            <div className="relative">
              <iframe
                src={document.signedUrl}
                className="w-full h-screen border-0"
                title={document.title}
                onError={() => {
                  console.log('PDF load error, refreshing signed URL...')
                  refreshSignedUrl()
                }}
                style={{
                  minHeight: '800px'
                }}
              />
              
              {/* Security overlay to prevent right-click */}
              <div 
                className="absolute inset-0 pointer-events-none"
                onContextMenu={(e) => e.preventDefault()}
                style={{ zIndex: 1 }}
              />
            </div>
          </div>
          
          {/* Document Info */}
          {document.description && (
            <div className="mt-6 bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
              <p className="text-gray-300">{document.description}</p>
            </div>
          )}
          
          {/* Security Notice */}
          <div className="mt-6 bg-yellow-900 border border-yellow-700 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-yellow-400 text-xl mr-3">⚠️</div>
              <div>
                <h4 className="text-yellow-200 font-semibold">Security Notice</h4>
                <p className="text-yellow-300 text-sm mt-1">
                  This document is protected and tracked. Unauthorized copying, downloading, or distribution is prohibited.
                  Your access is being monitored and logged.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Add security measures
if (typeof window !== 'undefined') {
  // Disable right-click context menu
  document.addEventListener('contextmenu', (e) => e.preventDefault())
  
  // Disable common keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Disable F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S, Ctrl+P
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && e.key === 'I') ||
      (e.ctrlKey && e.key === 'u') ||
      (e.ctrlKey && e.key === 's') ||
      (e.ctrlKey && e.key === 'p')
    ) {
      e.preventDefault()
      return false
    }
  })
  
  // Disable text selection
  document.addEventListener('selectstart', (e) => e.preventDefault())
  document.addEventListener('dragstart', (e) => e.preventDefault())
}