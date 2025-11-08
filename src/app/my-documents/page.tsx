'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Header } from '@/components/layout/Header'

interface Document {
  id: string
  title: string
  description?: string
  pageCount: number
  createdAt: string
  shareKey?: string
  viewCount: number
  _count: {
    viewAudits: number
    shareLinks: number
  }
}

export default function MyDocuments() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/sign-in')
        return
      }
      fetchDocuments()
    }
  }, [isAuthenticated, authLoading, router])

  const fetchDocuments = async () => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (user?.email) {
        headers['x-user-email'] = user.email
      }
      
      const response = await fetch('/api/documents', { headers })
      const data = await response.json()
      
      if (response.ok && data.success) {
        setDocuments(data.documents)
      } else {
        setError(data.error || 'Failed to load documents')
      }
    } catch (err) {
      console.error('Error fetching documents:', err)
      setError('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  const copyShareLink = async (shareKey: string, title: string) => {
    const baseUrl = window.location.origin
    const shareUrl = `${baseUrl}/view/${shareKey}`
    
    try {
      await navigator.clipboard.writeText(shareUrl)
      alert(`Share link for "${title}" copied to clipboard!\n\n${shareUrl}`)
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert(`Share link for "${title}" copied to clipboard!\n\n${shareUrl}`)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-screen pt-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your documents...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
              <p className="text-gray-600 mt-2">
                Manage and share your secure documents
              </p>
            </div>
            <button
              onClick={() => router.push('/upload')}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span className="mr-2">📄</span>
              Upload Document
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-400 text-xl mr-3">❌</div>
              <div>
                <h4 className="text-red-800 font-semibold">Error</h4>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Documents Grid */}
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-600 mb-6">Upload your first document to get started</p>
            <button
              onClick={() => router.push('/upload')}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span className="mr-2">📄</span>
              Upload Document
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div key={doc.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="p-6">
                  {/* Document Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {doc.title}
                      </h3>
                      {doc.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {doc.description}
                        </p>
                      )}
                      <div className="flex items-center text-sm text-gray-500">
                        <span>{doc.pageCount} pages</span>
                        <span className="mx-2">•</span>
                        <span>{formatDate(doc.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-2xl">📄</div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">
                        {doc.viewCount || doc._count.viewAudits}
                      </div>
                      <div className="text-xs text-gray-600">Views</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">
                        {doc._count.shareLinks}
                      </div>
                      <div className="text-xs text-gray-600">Shares</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-purple-600">
                        🔒
                      </div>
                      <div className="text-xs text-gray-600">Secure</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/document/${doc.id}`)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        👁️ View
                      </button>
                      <button
                        onClick={() => router.push(`/analytics/${doc.id}`)}
                        className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                      >
                        📊 Analytics
                      </button>
                    </div>
                    
                    {doc.shareKey && (
                      <button
                        onClick={() => copyShareLink(doc.shareKey!, doc.title)}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        🔗 Copy Share Link
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}