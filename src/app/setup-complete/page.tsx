'use client'
import { useState } from 'react'

export default function CompleteSetupPage() {
  const [step, setStep] = useState(1)
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const runStep = async (stepNumber: number, endpoint: string, description: string) => {
    setLoading(true)
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      
      setResults(prev => ({
        ...prev,
        [stepNumber]: {
          success: response.ok,
          data,
          description
        }
      }))
      
      if (response.ok) {
        setStep(stepNumber + 1)
      }
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        [stepNumber]: {
          success: false,
          error: error.message,
          description
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
        test: {
          success: response.ok,
          data,
          testUser: { email: testUser.email },
          description: 'Test user registration'
        }
      }))
      
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        test: {
          success: false,
          error: error.message,
          description: 'Test user registration'
        }
      }))
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">FlipBook DRM - Complete Setup</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Setup Progress</h2>
          
          {/* Step 1: Database Setup */}
          <div className={`p-4 rounded mb-4 ${step >= 1 ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Step 1: Database Setup</h3>
                <p className="text-sm text-gray-600">Create database tables and verify connection</p>
              </div>
              {step === 1 && (
                <button
                  onClick={() => runStep(1, '/api/setup/database-complete', 'Database Setup')}
                  disabled={loading}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? 'Setting up...' : 'Setup Database'}
                </button>
              )}
              {results[1] && (
                <span className={`px-3 py-1 rounded text-sm ${results[1].success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {results[1].success ? '✅ Complete' : '❌ Failed'}
                </span>
              )}
            </div>
            
            {results[1] && (
              <div className="mt-4 bg-gray-100 p-3 rounded text-sm">
                <pre>{JSON.stringify(results[1].data, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Step 2: Test Registration */}
          <div className={`p-4 rounded mb-4 ${step >= 2 ? 'bg-green-50 border-l-4 border-green-500' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Step 2: Test Registration</h3>
                <p className="text-sm text-gray-600">Verify user registration works</p>
              </div>
              {step === 2 && (
                <button
                  onClick={testRegistration}
                  disabled={loading}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                >
                  {loading ? 'Testing...' : 'Test Registration'}
                </button>
              )}
              {results.test && (
                <span className={`px-3 py-1 rounded text-sm ${results.test.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {results.test.success ? '✅ Working' : '❌ Failed'}
                </span>
              )}
            </div>
            
            {results.test && (
              <div className="mt-4">
                {results.test.testUser && (
                  <p className="text-sm mb-2"><strong>Test Email:</strong> {results.test.testUser.email}</p>
                )}
                <div className="bg-gray-100 p-3 rounded text-sm">
                  <pre>{JSON.stringify(results.test.data, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>

          {/* Success Message */}
          {results.test?.success && (
            <div className="bg-green-50 border border-green-200 p-4 rounded">
              <h3 className="font-semibold text-green-800 mb-2">🎉 Setup Complete!</h3>
              <p className="text-green-700 mb-3">Your FlipBook DRM application is now ready to use.</p>
              <div className="space-y-2 text-sm">
                <p><strong>✅ Database:</strong> Connected and tables created</p>
                <p><strong>✅ Authentication:</strong> User registration working</p>
                <p><strong>✅ Ready for:</strong> User sign-ups and document uploads</p>
              </div>
              <div className="mt-4">
                <a 
                  href="/auth/register" 
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-3"
                >
                  Go to Registration
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

        {/* Environment Check */}
        <div className="bg-yellow-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Environment Requirements</h3>
          <div className="text-sm space-y-2">
            <p><strong>Required Environment Variables:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>DATABASE_URL (Supabase connection string)</li>
              <li>NEXTAUTH_SECRET (random secret key)</li>
              <li>NEXTAUTH_URL (your Vercel app URL)</li>
            </ul>
            <p className="mt-3"><strong>If setup fails:</strong> Check these variables in Vercel dashboard and redeploy.</p>
          </div>
        </div>
      </div>
    </div>
  )
}