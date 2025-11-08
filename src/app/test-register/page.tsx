'use client'

import { useState } from 'react'

export default function TestRegisterPage() {
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('testpassword123')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testSimpleRegister = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/auth/simple-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      setResult({
        status: response.status,
        success: response.ok,
        data
      })
    } catch (error: any) {
      setResult({
        status: 'ERROR',
        success: false,
        data: { error: error.message }
      })
    }
    
    setLoading(false)
  }

  const testOriginalRegister = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      setResult({
        status: response.status,
        success: response.ok,
        data
      })
    } catch (error: any) {
      setResult({
        status: 'ERROR',
        success: false,
        data: { error: error.message }
      })
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Registration Test</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Registration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={testSimpleRegister}
                disabled={loading}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Simple Register'}
              </button>
              
              <button
                onClick={testOriginalRegister}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Original Register'}
              </button>
            </div>
          </div>
        </div>

        {result && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">
              Result: 
              <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                {result.success ? 'SUCCESS' : 'FAILED'}
              </span>
              <span className="text-gray-500 ml-2">({result.status})</span>
            </h3>
            
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="mt-6 text-sm text-gray-600">
          <p><strong>Instructions:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Try "Test Simple Register" first - this has detailed error logging</li>
            <li>If that works, try "Test Original Register" to compare</li>
            <li>Change the email if you get "User already exists" error</li>
            <li>Check the browser console for detailed logs</li>
          </ol>
        </div>
      </div>
    </div>
  )
}