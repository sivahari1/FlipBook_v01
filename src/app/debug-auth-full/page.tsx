'use client'
import { useState } from 'react'

export default function AuthDebugPage() {
  const [authStatus, setAuthStatus] = useState<any>(null)
  const [registrationTest, setRegistrationTest] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkAuthStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/auth-status')
      const data = await response.json()
      setAuthStatus(data)
    } catch (error: any) {
      setAuthStatus({ error: error.message })
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testUser)
      })
      
      const data = await response.json()
      setRegistrationTest({
        status: response.status,
        success: response.ok,
        data,
        testUser: { email: testUser.email, name: testUser.name }
      })
    } catch (error: any) {
      setRegistrationTest({ error: error.message })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Authentication Debug Center</h1>
        
        {/* Auth Status Check */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">System Status Check</h2>
          <button
            onClick={checkAuthStatus}
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 disabled:opacity-50 mr-4"
          >
            {loading ? 'Checking...' : 'Check Auth System Status'}
          </button>
          
          {authStatus && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">
                System Status: 
                <span className={authStatus.success ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
                  {authStatus.success ? 'HEALTHY ✅' : 'ISSUES FOUND ❌'}
                </span>
              </h3>
              
              {authStatus.recommendations && authStatus.recommendations.length > 0 && (
                <div className="bg-red-50 p-4 rounded mb-4">
                  <h4 className="font-semibold text-red-800 mb-2">Issues Found:</h4>
                  <ul className="list-disc list-inside text-red-700">
                    {authStatus.recommendations.map((rec: string, i: number) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="bg-gray-100 p-4 rounded overflow-auto">
                <pre className="text-sm">
                  {JSON.stringify(authStatus, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Registration Test */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Registration Test</h2>
          <button
            onClick={testRegistration}
            disabled={loading}
            className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test User Registration'}
          </button>
          
          {registrationTest && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">
                Registration Test: 
                <span className={registrationTest.success ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
                  {registrationTest.success ? 'SUCCESS ✅' : 'FAILED ❌'}
                </span>
              </h3>
              
              {registrationTest.testUser && (
                <div className="bg-blue-50 p-3 rounded mb-4">
                  <p><strong>Test Email:</strong> {registrationTest.testUser.email}</p>
                  <p><strong>Status Code:</strong> {registrationTest.status}</p>
                </div>
              )}
              
              <div className="bg-gray-100 p-4 rounded overflow-auto">
                <pre className="text-sm">
                  {JSON.stringify(registrationTest, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Quick Fixes */}
        <div className="bg-yellow-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Common Issues & Solutions:</h3>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Database Connection Failed:</strong>
              <p>• Check if DATABASE_URL is set correctly in Vercel environment variables</p>
              <p>• Verify Supabase database is accessible</p>
            </div>
            <div>
              <strong>User Table Missing:</strong>
              <p>• Run database migrations: Visit /api/setup/migrate</p>
              <p>• Check if Prisma schema is deployed</p>
            </div>
            <div>
              <strong>bcryptjs Issues:</strong>
              <p>• Check if bcryptjs is installed in dependencies</p>
              <p>• Verify Node.js version compatibility</p>
            </div>
            <div>
              <strong>Environment Variables:</strong>
              <p>• NEXTAUTH_SECRET must be set</p>
              <p>• NEXTAUTH_URL should match your domain</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}