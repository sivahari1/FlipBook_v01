'use client'

import { useState } from 'react'

export default function FixDatabase() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState<string | null>(null)

  const runTest = async (testName: string, endpoint: string, method: string = 'GET') => {
    setLoading(testName)
    try {
      const response = await fetch(endpoint, { method })
      const data = await response.json()
      setResults(prev => ({ ...prev, [testName]: data }))
    } catch (error) {
      setResults(prev => ({ ...prev, [testName]: { error: 'Request failed', details: error } }))
    }
    setLoading(null)
  }

  const testRegistration = async () => {
    setLoading('registration')
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `test-${Date.now()}@example.com`,
          password: 'testpassword123'
        })
      })
      const data = await response.json()
      setResults(prev => ({ ...prev, registration: data }))
    } catch (error) {
      setResults(prev => ({ ...prev, registration: { error: 'Registration failed', details: error } }))
    }
    setLoading(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Database Diagnostics & Fix</h1>
        
        <div className="grid gap-6">
          {/* Test Buttons */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Run Tests</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => runTest('connection', '/api/debug/database-connection')}
                disabled={loading === 'connection'}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading === 'connection' ? 'Testing...' : 'Test Connection'}
              </button>
              
              <button
                onClick={() => runTest('createTables', '/api/setup/create-tables', 'POST')}
                disabled={loading === 'createTables'}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading === 'createTables' ? 'Creating...' : 'Create Tables'}
              </button>
              
              <button
                onClick={testRegistration}
                disabled={loading === 'registration'}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {loading === 'registration' ? 'Testing...' : 'Test Registration'}
              </button>
              
              <button
                onClick={() => setResults({})}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Clear Results
              </button>
            </div>
          </div>
          
          {/* Results */}
          {Object.keys(results).length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Test Results</h2>
              {Object.entries(results).map(([testName, result]) => (
                <div key={testName} className="mb-6">
                  <h3 className="text-lg font-medium mb-2 capitalize">{testName}</h3>
                  <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
          
          {/* Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-800 mb-4">Instructions</h2>
            <ol className="list-decimal list-inside space-y-2 text-yellow-700">
              <li>First, click "Test Connection" to verify database connectivity</li>
              <li>If connection works but tables are missing, click "Create Tables"</li>
              <li>After tables are created, click "Test Registration" to verify user creation works</li>
              <li>Check the browser console for detailed logs during registration</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}