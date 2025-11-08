'use client'

import { useState, useEffect } from 'react'

export default function DebugPrisma() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/debug/prisma-status')
      .then(res => res.json())
      .then(result => {
        setData(result)
        setLoading(false)
      })
      .catch(error => {
        setData({ error: error.message })
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Running Prisma diagnostics...</div>
      </div>
    )
  }

  const allPassed = data?.diagnostics?.checks?.every((check: any) => check.status === 'PASS')

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Prisma Diagnostic Report</h1>
        <p className="text-gray-600 mb-8">
          Timestamp: {data?.diagnostics?.timestamp}
        </p>

        {data?.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-700">{data.error}</p>
          </div>
        )}

        <div className={`rounded-lg p-6 mb-6 ${
          allPassed 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <h2 className="text-xl font-semibold mb-2">
            {allPassed ? '✅ All Checks Passed' : '⚠️ Some Checks Failed'}
          </h2>
          <p className="text-gray-700">
            {allPassed 
              ? 'Prisma is configured correctly and database is accessible' 
              : 'There are issues that need to be resolved'}
          </p>
        </div>

        <div className="space-y-4">
          {data?.diagnostics?.checks?.map((check: any, index: number) => (
            <div
              key={index}
              className={`p-6 rounded-lg border ${
                check.status === 'PASS'
                  ? 'bg-green-50 border-green-200'
                  : check.status === 'FAIL'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{check.name}</h3>
                <span
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    check.status === 'PASS'
                      ? 'bg-green-100 text-green-800'
                      : check.status === 'FAIL'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {check.status}
                </span>
              </div>
              
              <p className={`mb-2 ${
                check.status === 'PASS' ? 'text-green-700' : 'text-red-700'
              }`}>
                {check.message}
              </p>

              {check.hint && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-blue-800 text-sm">
                    <strong>💡 Hint:</strong> {check.hint}
                  </p>
                </div>
              )}

              {check.code && (
                <p className="text-sm text-gray-600 mt-2">
                  Error Code: <code className="bg-gray-100 px-2 py-1 rounded">{check.code}</code>
                </p>
              )}

              {check.path && (
                <p className="text-sm text-gray-600 mt-2">
                  Path: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{check.path}</code>
                </p>
              )}

              {check.value && (
                <p className="text-sm text-gray-600 mt-2">
                  Value: {check.value}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Common Solutions</h2>
          <div className="space-y-3 text-blue-700">
            <div>
              <strong>If DATABASE_URL is missing:</strong>
              <p className="ml-4">Add it in Vercel → Project Settings → Environment Variables</p>
            </div>
            <div>
              <strong>If Prisma Client not generated:</strong>
              <p className="ml-4">Ensure postinstall script runs: <code className="bg-blue-100 px-2 py-1 rounded">prisma generate</code></p>
            </div>
            <div>
              <strong>If tables don't exist:</strong>
              <p className="ml-4">Run migrations: <code className="bg-blue-100 px-2 py-1 rounded">prisma migrate deploy</code></p>
            </div>
            <div>
              <strong>If connection fails:</strong>
              <p className="ml-4">Check DATABASE_URL format and database accessibility</p>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-gray-100 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Raw Data</h2>
          <pre className="text-xs overflow-auto bg-white p-4 rounded border">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
