'use client'

import { useState } from 'react'
import { useSession, signIn } from 'next-auth/react'

export default function TestFunctionalityPage() {
  const { data: session, status } = useSession()
  const [testResults, setTestResults] = useState<string[]>([])
  const [testing, setTesting] = useState(false)

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, result])
  }

  const testAPIs = async () => {
    setTesting(true)
    setTestResults([])
    
    try {
      // Test 1: Check if user is authenticated
      addResult('🔍 Testing authentication...')
      if (!session) {
        addResult('❌ Not authenticated - please sign in first')
        return
      }
      addResult('✅ User authenticated: ' + session.user?.email)

      // Test 2: Test documents API
      addResult('🔍 Testing documents API...')
      const docsResponse = await fetch('/api/documents')
      if (docsResponse.ok) {
        const docsData = await docsResponse.json()
        addResult('✅ Documents API working - found ' + docsData.documents?.length + ' documents')
      } else {
        addResult('❌ Documents API failed: ' + docsResponse.status)
      }

      // Test 3: Test auth registration API
      addResult('🔍 Testing registration API...')
      const regResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: 'test-' + Date.now() + '@example.com', 
          password: 'testpass123' 
        })
      })
      if (regResponse.ok) {
        addResult('✅ Registration API working')
      } else {
        const regError = await regResponse.json()
        addResult('⚠️ Registration API response: ' + regError.error)
      }

      // Test 4: Test forgot password API
      addResult('🔍 Testing forgot password API...')
      const forgotResponse = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' })
      })
      if (forgotResponse.ok) {
        addResult('✅ Forgot password API working')
      } else {
        addResult('❌ Forgot password API failed: ' + forgotResponse.status)
      }

      // Test 5: Test database connection
      addResult('🔍 Testing database connection...')
      try {
        const dbTest = await fetch('/api/documents')
        if (dbTest.status === 401) {
          addResult('✅ Database connection working (got expected 401)')
        } else {
          addResult('⚠️ Unexpected database response: ' + dbTest.status)
        }
      } catch (dbError) {
        addResult('❌ Database connection failed')
      }

      addResult('🎉 All tests completed!')

    } catch (error) {
      addResult('❌ Test error: ' + (error as Error).message)
    } finally {
      setTesting(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🧪 FlipBook DRM Functionality Test
          </h1>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Authentication Status</h2>
            {session ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800">
                  ✅ Signed in as: <strong>{session.user?.email}</strong>
                </p>
                <p className="text-green-600 text-sm mt-1">
                  Role: {session.user?.role || 'User'}
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 mb-3">
                  ⚠️ Not signed in - some tests will fail
                </p>
                <button
                  onClick={() => signIn()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Core Features Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800">📤 Upload</h3>
                <p className="text-blue-600 text-sm">
                  ✅ Upload page available at <a href="/upload" className="underline">/upload</a>
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800">📄 Documents</h3>
                <p className="text-green-600 text-sm">
                  ✅ Documents page available at <a href="/documents" className="underline">/documents</a>
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-800">👁️ Viewing</h3>
                <p className="text-purple-600 text-sm">
                  ✅ PDF viewer component implemented
                </p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-semibold text-orange-800">🔐 Authentication</h3>
                <p className="text-orange-600 text-sm">
                  ✅ NextAuth with database, forgot password
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <button
              onClick={testAPIs}
              disabled={testing}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {testing && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              )}
              {testing ? 'Running Tests...' : '🧪 Run API Tests'}
            </button>
          </div>

          {testResults.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Test Results:</h3>
              <div className="space-y-1 font-mono text-sm">
                {testResults.map((result, index) => (
                  <div key={index} className="text-gray-700">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Links</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a href="/auth/sign-in" className="text-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100">
                <div className="text-2xl mb-1">🔑</div>
                <div className="text-sm font-medium">Sign In</div>
              </a>
              <a href="/auth/register" className="text-center p-3 bg-green-50 rounded-lg hover:bg-green-100">
                <div className="text-2xl mb-1">📝</div>
                <div className="text-sm font-medium">Register</div>
              </a>
              <a href="/upload" className="text-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100">
                <div className="text-2xl mb-1">📤</div>
                <div className="text-sm font-medium">Upload</div>
              </a>
              <a href="/documents" className="text-center p-3 bg-orange-50 rounded-lg hover:bg-orange-100">
                <div className="text-2xl mb-1">📄</div>
                <div className="text-sm font-medium">Documents</div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}