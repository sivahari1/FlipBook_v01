'use client'

import { useState } from 'react'

export default function DebugAuthPage() {
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [initResult, setInitResult] = useState<any>(null)
  const [migrateResult, setMigrateResult] = useState<any>(null)
  const [registerResult, setRegisterResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testDatabase = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/database')
      const data = await response.json()
      setDbStatus(data)
    } catch (error) {
      setDbStatus({ error: error.message })
    }
    setLoading(false)
  }

  const initDatabase = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/setup/database-init', {
        method: 'POST'
      })
      const data = await response.json()
      setInitResult(data)
    } catch (error) {
      setInitResult({ error: error.message })
    }
    setLoading(false)
  }

  const checkMigrations = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/setup/migrate', {
        method: 'POST'
      })
      const data = await response.json()
      setMigrateResult(data)
    } catch (error) {
      setMigrateResult({ error: error.message })
    }
    setLoading(false)
  }

  const testRegister = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'testpassword123'
        })
      })
      const data = await response.json()
      setRegisterResult(data)
    } catch (error) {
      setRegisterResult({ error: error.message })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Authentication Debug</h1>
        
        <div className="space-y-6">
          {/* Database Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Database Status</h2>
            <button
              onClick={testDatabase}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Database Connection'}
            </button>
            {dbStatus && (
              <pre className="mt-4 p-4 bg-gray-100 rounded text-sm overflow-auto">
                {JSON.stringify(dbStatus, null, 2)}
              </pre>
            )}
          </div>

          {/* Migration Check */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Database Migration Check</h2>
            <button
              onClick={checkMigrations}
              disabled={loading}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check Database Tables'}
            </button>
            {migrateResult && (
              <pre className="mt-4 p-4 bg-gray-100 rounded text-sm overflow-auto">
                {JSON.stringify(migrateResult, null, 2)}
              </pre>
            )}
          </div>

          {/* Database Init */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Database Initialization</h2>
            <button
              onClick={initDatabase}
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Initializing...' : 'Initialize Database'}
            </button>
            {initResult && (
              <pre className="mt-4 p-4 bg-gray-100 rounded text-sm overflow-auto">
                {JSON.stringify(initResult, null, 2)}
              </pre>
            )}
          </div>

          {/* Registration Test */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Registration Test</h2>
            <button
              onClick={testRegister}
              disabled={loading}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Registration'}
            </button>
            {registerResult && (
              <pre className="mt-4 p-4 bg-gray-100 rounded text-sm overflow-auto">
                {JSON.stringify(registerResult, null, 2)}
              </pre>
            )}
          </div>

          {/* Environment Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Environment Info</h2>
            <div className="text-sm text-gray-600">
              <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</p>
              <p><strong>User Agent:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}