'use client'

import { useState } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'

export default function TestAuthPage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('testuser@example.com')
  const [password, setPassword] = useState('password123')
  const { data: session, status } = useSession()

  const testRegistration = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name: 'Test User'
        }),
      })

      const data = await response.json()
      setResult(`Registration: ${response.status} - ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      setResult(`Registration Error: ${error}`)
    }
    setLoading(false)
  }

  const testLogin = async () => {
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      setResult(`Login Result: ${JSON.stringify(result, null, 2)}`)
    } catch (error) {
      setResult(`Login Error: ${error}`)
    }
    setLoading(false)
  }

  const testLogout = async () => {
    setLoading(true)
    try {
      await signOut({ redirect: false })
      setResult('Logged out successfully')
    } catch (error) {
      setResult(`Logout Error: ${error}`)
    }
    setLoading(false)
  }

  const testForgotPassword = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email
        }),
      })

      const data = await response.json()
      setResult(`Forgot Password: ${response.status} - ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      setResult(`Forgot Password Error: ${error}`)
    }
    setLoading(false)
  }

  const testResetPassword = async () => {
    setLoading(true)
    try {
      // First get a reset token (this would normally be from email)
      const tokenResponse = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (tokenResponse.ok) {
        // For testing, we'll use a mock token - in real app this comes from email
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: 'test-token', // This would be from the email link
            password: 'newpassword123'
          }),
        })

        const data = await response.json()
        setResult(`Reset Password: ${response.status} - ${JSON.stringify(data, null, 2)}`)
      }
    } catch (error) {
      setResult(`Reset Password Error: ${error}`)
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Authentication Test</h1>
      
      {/* Session Status */}
      <div className="mb-6 p-4 bg-blue-50 rounded">
        <h2 className="font-bold mb-2">Session Status:</h2>
        <p>Status: {status}</p>
        {session ? (
          <div>
            <p>User: {session.user?.email}</p>
            <p>Role: {session.user?.role}</p>
          </div>
        ) : (
          <p>Not logged in</p>
        )}
      </div>

      {/* Input Fields */}
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter email"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter password"
          />
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={testRegistration}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Register User
        </button>
        
        <button
          onClick={testLogin}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          Login
        </button>
        
        <button
          onClick={testLogout}
          disabled={loading}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
        >
          Logout
        </button>
        
        <button
          onClick={testForgotPassword}
          disabled={loading}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
        >
          Forgot Password
        </button>
        
        <button
          onClick={testResetPassword}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Test Reset Password
        </button>

        <button
          onClick={() => window.open('/auth/sign-in', '_blank')}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Open Sign In Page
        </button>
      </div>

      {loading && <p className="text-blue-600">Loading...</p>}
      
      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Result:</h2>
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}

      {/* Quick Links */}
      <div className="mt-8 p-4 bg-gray-50 rounded">
        <h3 className="font-bold mb-2">Quick Links:</h3>
        <div className="space-y-2">
          <a href="/auth/sign-in" className="block text-blue-600 hover:underline">Sign In Page</a>
          <a href="/auth/sign-up" className="block text-blue-600 hover:underline">Sign Up Page</a>
          <a href="/auth/forgot-password" className="block text-blue-600 hover:underline">Forgot Password Page</a>
          <a href="/dashboard" className="block text-blue-600 hover:underline">Dashboard (requires login)</a>
        </div>
      </div>
    </div>
  )
}