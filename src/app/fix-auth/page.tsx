'use client'
import { useState } from 'react'

export default function FixAuthPage() {
  const [step, setStep] = useState(1)
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const runDatabaseInit = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/setup/database-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      
      setResults(prev => ({
        ...prev,
        database: {
          success: response.ok,
          data,
          status: response.status
        }
      }))
      
      if (response.ok) {
        setStep(2)
      }
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        database: {
          success: false,
          error: error.message
        }
      }))
    }
    setLoading(false)
  }

  const testRegistration = async () => {
    setLoading(true)
    try {
      const testUser = {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        name: 'Test User'
      }
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
      })
      
      const data = await response.json()
      
      setResults(prev => ({
        ...prev,
        registration: {
          success: response.ok,
          data,
          testUser: { email: testUser.email },
          status: response.status
        }
      }))
      
      if (response.ok) {
        setStep(3)
      }
      
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        registration: {
          success: false,
          error: error.message
        }
      }))
    }
    setLoading(false)
  }

  const checkMigration = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/setup/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      
      setResults(prev => ({
        ...prev,
        migration: {
          success: response.ok,
          data,
          status: response.status
        }
      }))
      
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        migration: {
          success: false,
          error: error.message
        }
      }))
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🔧 Fix Authentication Issue</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Quick Diagnosis & Fix</h2>
          
          {/* Step 1: Check Migration Status */}
          <div className="p-4 border rounded mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold">Step 1: Check Database Migration</h3>
                <p className="text-sm text-gray-600">See if database tables exist</p>
              </div>
              <button
                onClick={checkMigration}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Checking...' : 'Check Migration'}
              </button>
            </div>
            
            {results.migration && (
              <div className="bg-gray-100 p-3 rounded text-sm">
                <div className={`mb-2 ${results.migration.success ? 'text-green-600' : 'text-red-600'}`}>
                  Status: {results.migration.success ? '✅ Success' : '❌ Failed'} (HTTP {results.migration.status})
                </div>
                <pre className="overflow-auto">{JSON.stringify(results.migration.data, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Step 2: Initialize Database */}
          <div className={`p-4 border rounded mb-4 ${step >= 1 ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold">Step 2: Initialize Database</h3>
                <p className="text-sm text-gray-600">Create test user and verify tables work</p>
              </div>
              <button
                onClick={runDatabaseInit}
                disabled={loading}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? 'Initializing...' : 'Initialize Database'}
              </button>
            </div>
            
            {results.database && (
              <div className="bg-gray-100 p-3 rounded text-sm">
                <div className={`mb-2 ${results.database.success ? 'text-green-600' : 'text-red-600'}`}>
                  Status: {results.database.success ? '✅ Success' : '❌ Failed'} (HTTP {results.database.status})
                </div>
                <pre className="overflow-auto">{JSON.stringify(results.database.data, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Step 3: Test Registration */}
          <div className={`p-4 border rounded mb-4 ${step >= 2 ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold">Step 3: Test User Registration</h3>
                <p className="text-sm text-gray-600">Verify registration endpoint works</p>
              </div>
              {step >= 2 && (
                <button
                  onClick={testRegistration}
                  disabled={loading}
                  className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
                >
                  {loading ? 'Testing...' : 'Test Registration'}
                </button>
              )}
            </div>
            
            {results.registration && (
              <div className="bg-gray-100 p-3 rounded text-sm">
                <div className={`mb-2 ${results.registration.success ? 'text-green-600' : 'text-red-600'}`}>
                  Status: {results.registration.success ? '✅ Success' : '❌ Failed'} (HTTP {results.registration.status})
                </div>
                {results.registration.testUser && (
                  <p className="mb-2"><strong>Test Email:</strong> {results.registration.testUser.email}</p>
                )}
                <pre className="overflow-auto">{JSON.stringify(results.registration.data, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Success Message */}
          {results.registration?.success && (
            <div className="bg-green-50 border border-green-200 p-4 rounded">
              <h3 className="font-semibold text-green-800 mb-2">🎉 Authentication Fixed!</h3>
              <p className="text-green-700 mb-3">Your registration system is now working properly.</p>
              <div className="space-y-2 text-sm">
                <p><strong>✅ Database:</strong> Connected and working</p>
                <p><strong>✅ User Registration:</strong> Working correctly</p>
                <p><strong>✅ Ready:</strong> Users can now create accounts</p>
              </div>
              <div className="mt-4">
                <a 
                  href="/auth/register" 
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-3"
                >
                  Try Registration Now
                </a>
                <a 
                  href="/auth/sign-in" 
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Go to Sign In
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Common Issues */}
        <div className="bg-yellow-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Common Issues & Solutions</h3>
          <div className="text-sm space-y-3">
            <div>
              <strong>❌ Database tables not found:</strong>
              <p>• The database exists but tables haven't been created</p>
              <p>• Solution: Run the "Initialize Database" step above</p>
            </div>
            <div>
              <strong>❌ Database connection failed:</strong>
              <p>• Check DATABASE_URL environment variable in Vercel</p>
              <p>• Verify Supabase database is accessible</p>
            </div>
            <div>
              <strong>❌ Registration still fails:</strong>
              <p>• Check browser console for detailed error messages</p>
              <p>• Verify all environment variables are set correctly</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}