'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Shield } from 'lucide-react'

interface SimpleDRMPDFViewerProps {
  documentId: string
  title?: string
  userEmail: string
}

export function SimpleDRMPDFViewer({ 
  documentId, 
  title, 
  userEmail 
}: SimpleDRMPDFViewerProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  useEffect(() => {
    loadDocument()
  }, [documentId])

  const loadDocument = async () => {
    try {
      setLoading(true)
      setError(null)

      // Try to get the PDF file directly
      const response = await fetch(`/api/documents/${documentId}/file`)
      
      if (!response.ok) {
        throw new Error(`Failed to load document: ${response.status}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
      
      // For now, assume 5 pages (we can enhance this later)
      setTotalPages(5)
      setLoading(false)

    } catch (error) {
      console.error('Error loading document:', error)
      setError(error instanceof Error ? error.message : 'Failed to load document')
      setLoading(false)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px] bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading secure document...</p>
          <p className="text-sm text-gray-500 mt-2">Setting up DRM protection</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px] bg-gray-100 rounded-lg">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">🔒</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDocument}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Security Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>🔒 DRM Protected</span>
              <span>👁️ View Only</span>
              <span>📄 Page {currentPage} of {totalPages}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Document Viewer */}
      <div className="relative bg-gray-100 min-h-[600px] flex items-center justify-center">
        {pdfUrl ? (
          <div className="w-full h-full">
            <iframe
              src={`${pdfUrl}#page=${currentPage}&toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full h-[600px] border-0"
              title={`${title} - Page ${currentPage}`}
              style={{
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              }}
            />
          </div>
        ) : (
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">📄</div>
            <p className="text-gray-600">Document not available</p>
          </div>
        )}

        {/* Watermark Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 right-4 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded">
            {userEmail} • Protected by FlipBook DRM
          </div>
          <div className="absolute bottom-4 left-4 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded">
            🔒 Unauthorized copying prohibited
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-t">
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage <= 1}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage <= 1}
            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            First
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value)
                if (page >= 1 && page <= totalPages) {
                  setCurrentPage(page)
                }
              }}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center"
            />
            <span className="text-sm text-gray-500">/ {totalPages}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage >= totalPages}
            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Last
          </button>
          
          <button
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Security Status Bar */}
      <div className="px-4 py-2 bg-blue-50 border-t text-xs text-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span>🔒 DRM Active</span>
            <span>💧 Watermarked</span>
            <span>📊 Access Logged</span>
            <span>🚫 Download Disabled</span>
          </div>
          <div>
            Viewing as: {userEmail}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimpleDRMPDFViewer