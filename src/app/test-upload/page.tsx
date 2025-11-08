'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function TestUploadPage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const { data: session, status } = useSession()

  const testUpload = async () => {
    setLoading(true)
    try {
      // Create a simple test PDF file
      const testPdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Test PDF) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
297
%%EOF`

      const blob = new Blob([testPdfContent], { type: 'application/pdf' })
      const file = new File([blob], 'test.pdf', { type: 'application/pdf' })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', 'Test Document')
      formData.append('description', 'Test upload from test page')

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      setResult(`Upload: ${response.status} - ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      setResult(`Upload Error: ${error}`)
    }
    setLoading(false)
  }

  const testForgotPasswordWithToken = async () => {
    setLoading(true)
    try {
      // First, trigger forgot password to get a token
      const forgotResponse = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: session?.user?.email || 'test@example.com'
        }),
      })

      const forgotData = await forgotResponse.json()
      
      // Check server logs for the actual token (in development mode)
      setResult(`Forgot Password: ${forgotResponse.status} - ${JSON.stringify(forgotData, null, 2)}

Check the server console for the actual reset token. In development mode, the email is logged to the console instead of being sent.

To test password reset:
1. Look at the server console for the reset token
2. Visit: http://localhost:3001/auth/reset-password?token=YOUR_TOKEN_HERE
3. Enter a new password`)
    } catch (error) {
      setResult(`Forgot Password Error: ${error}`)
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Upload & Password Reset Test</h1>
      
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
          <p>Not logged in - <a href="/auth/sign-in" className="text-blue-600 underline">Sign In</a></p>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={testUpload}
          disabled={loading || !session}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test Document Upload
        </button>
        
        <button
          onClick={testForgotPasswordWithToken}
          disabled={loading}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
        >
          Test Forgot Password (Check Console)
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
          <a href="/upload" className="block text-blue-600 hover:underline">Upload Page</a>
          <a href="/dashboard" className="block text-blue-600 hover:underline">Dashboard</a>
          <a href="/auth/forgot-password" className="block text-blue-600 hover:underline">Forgot Password Page</a>
          <a href="/test-auth" className="block text-blue-600 hover:underline">Auth Test Page</a>
        </div>
      </div>
    </div>
  )
}