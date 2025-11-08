'use client'

import { useState } from 'react'
import { DRMProtection } from '@/components/security/DRMProtection'
import { WatermarkOverlay } from '@/components/security/WatermarkOverlay'
import DevToolsDetector from '@/components/security/DevToolsDetector'
import KeyboardShortcutBlocker from '@/components/security/KeyboardShortcutBlocker'

export default function SecurityTestPage() {
  const [violations, setViolations] = useState<any[]>([])

  const handleViolation = (violation: any) => {
    setViolations(prev => [...prev, violation])
    console.log('🚨 Security Violation:', violation)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <DRMProtection
        enabled={true}
        onViolation={handleViolation}
        showWarnings={true}
        strictMode={true}
      >
        <DevToolsDetector 
          enabled={true}
          onViolation={handleViolation}
          showWarning={true}
          strictMode={true}
        />
        
        <KeyboardShortcutBlocker
          enabled={true}
          onViolation={handleViolation}
          strictMode={true}
        />

        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 relative">
          <WatermarkOverlay
            enabled={true}
            documentId="test-security"
            config={{
              text: 'SECURITY TEST',
              includeUserInfo: true,
              includeTimestamp: true,
              opacity: 0.1,
              pattern: 'diagonal'
            }}
          />

          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                🔒 DRM Security Test Page
              </h1>
              <p className="text-gray-600">
                This page tests all DRM security features. Try the actions below to see security in action.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-blue-900 mb-4">
                  🧪 Security Tests
                </h2>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 bg-red-500 rounded-full"></span>
                    <span>Try right-clicking (should be blocked)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 bg-red-500 rounded-full"></span>
                    <span>Try selecting this text (should be disabled)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 bg-red-500 rounded-full"></span>
                    <span>Try Ctrl+S to save (should be blocked)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 bg-red-500 rounded-full"></span>
                    <span>Try Ctrl+P to print (should be blocked)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 bg-red-500 rounded-full"></span>
                    <span>Try F12 for DevTools (should show warning)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 bg-red-500 rounded-full"></span>
                    <span>Try Ctrl+C to copy (should be blocked)</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-green-900 mb-4">
                  ✅ Active Protections
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 bg-green-500 rounded-full"></span>
                    <span>Right-click context menu blocked</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 bg-green-500 rounded-full"></span>
                    <span>Text selection disabled</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 bg-green-500 rounded-full"></span>
                    <span>Keyboard shortcuts blocked</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 bg-green-500 rounded-full"></span>
                    <span>Developer tools detection active</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 bg-green-500 rounded-full"></span>
                    <span>Watermarks applied</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 bg-green-500 rounded-full"></span>
                    <span>Drag & drop prevention</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-yellow-900 mb-4">
                📊 Security Violations Log
              </h2>
              <div className="text-sm">
                {violations.length === 0 ? (
                  <p className="text-gray-600">No violations detected yet. Try the security tests above!</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {violations.map((violation, index) => (
                      <div key={index} className="bg-white p-3 rounded border-l-4 border-red-500">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium text-red-700">{violation.type}</span>
                            <p className="text-gray-600 text-xs mt-1">{violation.details}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded ${
                            violation.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            violation.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            violation.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {violation.severity}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(violation.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setViolations([])}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Clear Violations Log
              </button>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                🎯 Test Your Document Security
              </h3>
              <p className="text-gray-600 mb-4">
                Ready to test with a real document? Visit your uploaded document to see all security features in action.
              </p>
              <a
                href="/document/cmhkkk8sf00039uc4wutccz6m"
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                🔒 Test with Real Document
              </a>
            </div>
          </div>
        </div>
      </DRMProtection>
    </div>
  )
}