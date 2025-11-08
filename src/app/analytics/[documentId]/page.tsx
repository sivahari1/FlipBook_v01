'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Header } from '@/components/layout/Header'

interface DocumentAnalytics {
  document: {
    id: string
    title: string
    description?: string
    pageCount: number
    createdAt: string
    viewCount: number
  }
  totalViews: number
  recentViews: Array<{
    id: string
    viewedAt: string
    viewerIp?: string
    userAgent?: string
    sessionId?: string
  }>
  viewsByDay: Array<{
    date: string
    views: number
  }>
}

export default function DocumentAnalytics() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [analytics, setAnalytics] = useState<DocumentAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/sign-in')
        return
      }
      
      if (params.documentId) {
        fetchAnalytics(params.documentId as string)
      }
    }
  }, [params.documentId, isAuthenticated, authLoading, router])

  const fetchAnalytics = async (documentId: string) => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (user?.email) {
        headers['x-user-email'] = user.email
      }
      
      const response = await fetch(`/api/documents/${documentId}/analytics`, { headers })
      const data = await response.json()
      
      if (response.ok && data.success) {
        setAnalytics(data.analytics)
      } else {
        setError(data.error || 'Failed to load analytics')
      }
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError('Failed to load analytics')
    } finally {
      setLoading(false)
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

  const formatIpAddress = (ip?: string) => {
    if (!ip || ip === 'unknown') return 'Unknown'
    // Mask IP for privacy (show only first two octets)
    const parts = ip.split('.')
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.xxx.xxx`
    }
    return ip.substring(0, 8) + '...'
  }

  const getBrowserFromUserAgent = (userAgent?: string) => {
    if (!userAgent) return 'Unknown'
    
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Other'
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-screen pt-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-screen pt-16">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/my-documents')}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Documents
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-screen pt-16">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">No Analytics Data</h1>
            <p className="text-gray-600">Analytics data is not available for this document.</p>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Document Analytics</h1>
              <p className="text-gray-600 mt-2">
                {analytics.document.title}
              </p>
            </div>
            <button
              onClick={() => router.push('/my-documents')}
              className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Back to Documents
            </button>
          </div>
        </div>

        {/* Document Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {analytics.totalViews}
              </div>
              <div className="text-sm text-gray-600">Total Views</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {analytics.document.pageCount}
              </div>
              <div className="text-sm text-gray-600">Pages</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {analytics.recentViews.length}
              </div>
              <div className="text-sm text-gray-600">Recent Views</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {formatDate(analytics.document.createdAt).split(',')[0]}
              </div>
              <div className="text-sm text-gray-600">Created</div>
            </div>
          </div>
        </div>

        {/* Views Chart */}
        {analytics.viewsByDay && analytics.viewsByDay.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Views Over Time</h3>
            <div className="space-y-2">
              {analytics.viewsByDay.map((day, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-20 text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-4 relative">
                      <div
                        className="bg-blue-600 h-4 rounded-full"
                        style={{
                          width: `${Math.max((day.views / Math.max(...analytics.viewsByDay.map(d => d.views))) * 100, 5)}%`
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-sm font-semibold text-gray-900">
                    {day.views}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Views Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Views</h3>
          </div>
          
          {analytics.recentViews.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No views recorded yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Browser
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Session
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.recentViews.map((view) => (
                    <tr key={view.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(view.viewedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatIpAddress(view.viewerIp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getBrowserFromUserAgent(view.userAgent)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {view.sessionId ? view.sessionId.substring(0, 8) + '...' : 'Unknown'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}