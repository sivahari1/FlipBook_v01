'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { SecurePDFViewer } from './SecurePDFViewer'

interface PDFViewerProps {
  documentId: string
  title?: string
  onError?: (error: string) => void
}

export function PDFViewer({ documentId, title, onError }: PDFViewerProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return

    const loadPDF = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/documents/${documentId}/file`)
        
        if (!response.ok) {
          throw new Error('Failed to load document')
        }

        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        setPdfUrl(url)

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load document'
        setError(errorMessage)
        onError?.(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadPDF()

    // Cleanup URL on unmount
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [documentId, session, onError])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading document...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Document</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">No document available</div>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      {/* Use the SECURE PDF viewer instead of basic iframe */}
      <SecurePDFViewer 
        documentId={documentId}
        title={title || 'PDF Document'}
        onError={onError}
      />
    </div>
  )
}