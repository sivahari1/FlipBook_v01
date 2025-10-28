'use client'

import { useState } from 'react'
import { DRMProtection } from '@/components/security/DRMProtection'
import DevToolsDetector from '@/components/security/DevToolsDetector'
import { useDevToolsDetection } from '@/hooks/useDevToolsDetection'
import { SecurityViolation } from '@/lib/drm-protection'

export default function DevToolsDetectionDemo() {
  const [violations, setViolations] = useState<SecurityViolation[]>([])
  const [showAdvancedDetector, setShowAdvancedDetector] = useState(true)
  const [strictMode, setStrictMode] = useState(true)

  // Use the detection hook for additional monitoring
  const detection = useDevToolsDetection({
    enabled: true,
    strictMode,
    onDetectionChange: (isOpen, method, confidence) => {
      console.log('Hook Detection:', { isOpen, method, confidence })
    }
  })

  const handleViolation = (violation: SecurityViolation) => {
    setViolations(prev => [violation, ...prev].slice(0, 10)) // Keep last 10 violations
  }

  const clearViolations = () => {
    setViolations([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* DRM Protection with DevTools Detection */}
      <DRMProtection
        enabled={true}
        onViolation={handleViolation}
        showWarnings={true}
        strictMode={strictMode}
      >
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              🛡️ Developer Tools Detection Demo
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              This page demonstrates advanced developer tools detection and content protection.
              Try opening your browser's developer tools to see the security measures in action.
            </p>
          </div>

          {/* Controls */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Detection Controls</h2>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center text-white">
                <input
                  type="checkbox"
                  checked={showAdvancedDetector}
                  onChange={(e) => setShowAdvancedDetector(e.target.checked)}
                  className="mr-2"
                />
                Advanced Detector
              </label>
              <label className="flex items-center text-white">
                <input
                  type="checkbox"
                  checked={strictMode}
                  onChange={(e) => setStrictMode(e.target.checked)}
                  className="mr-2"
                />
                Strict Mode
              </label>
              <button
                onClick={clearViolations}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Clear Violations
              </button>
            </div>
          </div>

          {/* Detection Status */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Hook Detection Status */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Hook Detection Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Status:</span>
                  <span className={`font-semibold ${detection.isOpen ? 'text-red-400' : 'text-green-400'}`}>
                    {detection.isOpen ? '🚨 DETECTED' : '✅ Not Detected'}
                  </span>
                </div>
                {detection.isOpen && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Method:</span>
                      <span className="text-yellow-400">{detection.detectionMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Confidence:</span>
                      <span className="text-blue-400">{Math.round(detection.confidence * 100)}%</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-300">Total Detections:</span>
                  <span className="text-purple-400">{detection.detectionCount}</span>
                </div>
                {detection.firstDetected && (
                  <div className="flex justify-between">
                    <span className="text-gray-300">First Detected:</span>
                    <span className="text-orange-400">{detection.firstDetected.toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Detection Methods */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Detection Methods</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  Window Size Analysis
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                  Debugger Timing Detection
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                  Console Override Detection
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                  Performance Timing Analysis
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                  DevTools API Detection
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                  Element Inspection Detection
                </div>
              </div>
            </div>
          </div>

          {/* Protected Content Area */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 mb-8 drm-protected-container">
            <h2 className="text-2xl font-bold text-white mb-4">🔒 Protected Content</h2>
            <p className="text-gray-300 mb-4">
              This content is protected by advanced DRM measures. When developer tools are detected:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mb-6">
              <li>Content will be hidden or blurred</li>
              <li>Security warnings will be displayed</li>
              <li>Violations will be logged</li>
              <li>Access attempts will be monitored</li>
            </ul>
            
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-2">Sensitive Document Content</h3>
              <p className="text-gray-100">
                This represents sensitive document content that should be protected from unauthorized access,
                copying, or inspection. The DRM system will detect and prevent various security threats.
              </p>
            </div>
          </div>

          {/* Violation Log */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Security Violations Log ({violations.length})
            </h3>
            {violations.length === 0 ? (
              <p className="text-gray-400 italic">No violations detected yet.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {violations.map((violation, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded border-l-4 ${
                      violation.severity === 'critical' ? 'bg-red-900/30 border-red-500' :
                      violation.severity === 'high' ? 'bg-orange-900/30 border-orange-500' :
                      violation.severity === 'medium' ? 'bg-yellow-900/30 border-yellow-500' :
                      'bg-blue-900/30 border-blue-500'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`font-semibold text-sm ${
                        violation.severity === 'critical' ? 'text-red-400' :
                        violation.severity === 'high' ? 'text-orange-400' :
                        violation.severity === 'medium' ? 'text-yellow-400' :
                        'text-blue-400'
                      }`}>
                        {violation.type.toUpperCase()} - {violation.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400">
                        {violation.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">{violation.details}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-900/30 border border-blue-500/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-300 mb-3">🧪 Testing Instructions</h3>
            <div className="text-gray-300 space-y-2 text-sm">
              <p><strong>To test developer tools detection:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Press <kbd className="bg-gray-700 px-2 py-1 rounded">F12</kbd> to open developer tools</li>
                <li>Try <kbd className="bg-gray-700 px-2 py-1 rounded">Ctrl+Shift+I</kbd> (Windows/Linux) or <kbd className="bg-gray-700 px-2 py-1 rounded">Cmd+Shift+I</kbd> (Mac)</li>
                <li>Right-click and select "Inspect Element"</li>
                <li>Try keyboard shortcuts like <kbd className="bg-gray-700 px-2 py-1 rounded">Ctrl+U</kbd> (View Source)</li>
                <li>Attempt to copy text or save the page</li>
              </ul>
              <p className="mt-3"><strong>Expected behavior:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Content will be hidden or blurred when dev tools are detected</li>
                <li>Security warnings will appear</li>
                <li>Violations will be logged in the table above</li>
                <li>Keyboard shortcuts will be blocked</li>
              </ul>
            </div>
          </div>
        </div>
      </DRMProtection>

      {/* Advanced Detector (if enabled) */}
      {showAdvancedDetector && (
        <DevToolsDetector
          enabled={true}
          onViolation={handleViolation}
          hideContent={strictMode}
          blurContent={!strictMode}
          showWarning={true}
          strictMode={strictMode}
        />
      )}
    </div>
  )
}