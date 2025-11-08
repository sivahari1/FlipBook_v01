'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function TestResetPasswordContent() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('newpassword123')
  const searchParams = useSearchParams()

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token')
    if (tokenFromUrl) {
      setToken(tokenFromUrl)
    }
  }, [searchParams])

  const testResetPassword = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: newPassword
        }),
      })

      const data = await response.json()
      setResult(`Reset Password: ${response.status} - ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      setResult(`Reset Password Error: ${error}`)
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Test Password Reset</h1>
      
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h2 className="font-bold mb-2">Instructions:</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Go to <a href="/auth/forgot-password" className="text-blue-600 underline">Forgot Password</a></li>
          <li>Enter your email and submit</li>
          <li>Check the server console for the reset token</li>
          <li>Copy the token and paste it below</li>
          <li>Click "Test Reset Password"</li>
        </ol>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Reset Token:</label>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Paste the reset token from server console"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">New Password:</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter new password"
          />
        </div>
      </div>
      
      <button
        onClick={testResetPassword}
        disabled={loading || !token || !newPassword}
        className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
      >
        Test Reset Password
      </button>

      {loading && <p className="text-blue-600 mt-4">Loading...</p>}
      
      {result && (
        <div className="bg-gray-100 p-4 rounded mt-6">
          <h2 className="font-bold mb-2">Result:</h2>
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h3 className="font-bold mb-2">Sample Reset Token (from server console):</h3>
        <p className="text-sm text-gray-600 font-mono">dbb1b453cbef914dff95af6e6ded5861333a037de5a6f1d997dd79a50d1f7850e</p>
        <p className="text-xs text-gray-500 mt-1">This is the token that was logged to console earlier</p>
      </div>
    </div>
  )
}

export default function TestResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TestResetPasswordContent />
    </Suspense>
  )
}