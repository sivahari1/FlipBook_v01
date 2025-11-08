'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import SimpleDRMPDFViewer from '@/components/pdf/SimpleDRMPDFViewer'
import MinimalDRMProtection from '@/components/security/MinimalDRMProtection'
import WatermarkOverlay from '@/components/security/WatermarkOverlay'
import SimpleDevToolsDetector from '@/components/security/SimpleDevToolsDetector'

interface Document {
  id: string
  title: string
  description?: string
  pageCount: number
  createdAt: string
  owner: string
  canEdit: boolean
  accessLevel: string
}

export default function DocumentViewer() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/sign-in')
      return
    }
    
    if (params.id) {
      fetchDocument(params.id as string)
    }
  }, [params.id, session, status, router])

  const fetchDocument = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/documents/${id}`)
      const data = await response.json()
      
      if (response.ok && data.success) {
        setDocument(data.document)
      } else {
        setError(data.error || 'Failed to load document')
      }
    } catch (err) {
      setError('Failed to load document')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Document</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/documents')}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Documents
          </button>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Document not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">{document.title}</h1>
              <span className="ml-4 text-sm text-gray-500">
                {document.pageCount} pages • Protected
              </span>
              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                {document.accessLevel === 'owner' ? 'Owner' : 'Viewer'}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/documents')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Documents
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Document Viewer */}
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg">
          <MinimalDRMProtection>
            <SimpleDevToolsDetector />
            <div className="relative">
              <WatermarkOverlay 
                enabled={true}
                documentId={document.id}
                config={{
                  text: session?.user?.email || 'Protected Document',
                  includeUserInfo: true,
                  includeTimestamp: true,
                  opacity: 0.1,
                  pattern: 'diagonal'
                }}
              />
              <SimpleDRMPDFViewer
                documentId={document.id}
                title={document.title}
                userEmail={session?.user?.email || 'anonymous@example.com'}
              />
            </div>
          </MinimalDRMProtection>
        </div>
      </div>
    </div>
  )
}