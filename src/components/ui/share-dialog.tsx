'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Share2, Copy, Check } from 'lucide-react'
import { MobileButton } from './mobile-button'

interface ShareDialogProps {
  isOpen: boolean
  onClose: () => void
  document: {
    id: string
    title: string
    description?: string
  }
  onShare: (email: string, message?: string) => Promise<{ success: boolean; shareUrl?: string; error?: string }>
}

export function ShareDialog({ isOpen, onClose, document, onShare }: ShareDialogProps) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  const [shareResult, setShareResult] = useState<{ success: boolean; shareUrl?: string; error?: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    if (!email.trim()) return

    setIsSharing(true)
    try {
      const result = await onShare(email.trim(), message.trim() || undefined)
      setShareResult(result)
      
      if (result.success) {
        // Clear form on success
        setEmail('')
        setMessage('')
      }
    } catch (error) {
      setShareResult({
        success: false,
        error: 'Failed to share document. Please try again.'
      })
    } finally {
      setIsSharing(false)
    }
  }

  const handleCopyLink = async () => {
    if (shareResult?.shareUrl) {
      try {
        await navigator.clipboard.writeText(shareResult.shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('Failed to copy link:', error)
      }
    }
  }

  const handleClose = () => {
    setEmail('')
    setMessage('')
    setShareResult(null)
    setCopied(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Share2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Share Document</h3>
                <p className="text-sm text-gray-600">{document.title}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {!shareResult ? (
              <div className="space-y-4">
                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSharing}
                  />
                </div>

                {/* Optional Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Personal Message (Optional)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Add a personal message..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    disabled={isSharing}
                  />
                </div>

                {/* Document Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-1">{document.title}</h4>
                  {document.description && (
                    <p className="text-sm text-gray-600">{document.description}</p>
                  )}
                  <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                    <span>🔒 DRM Protected</span>
                    <span>💧 Watermarked</span>
                    <span>📊 Access Tracked</span>
                  </div>
                </div>

                {/* Share Button */}
                <MobileButton
                  onClick={handleShare}
                  disabled={!email.trim() || isSharing}
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  {isSharing ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Sending Email...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Secure Link
                    </>
                  )}
                </MobileButton>
              </div>
            ) : (
              <div className="text-center">
                {shareResult.success ? (
                  <div className="space-y-4">
                    {/* Success State */}
                    <div className="text-6xl mb-4">✅</div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">
                      Document Shared Successfully!
                    </h4>
                    <p className="text-gray-600 mb-6">
                      An email with the secure access link has been sent to the recipient.
                    </p>

                    {/* Share URL */}
                    {shareResult.shareUrl && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Share Link
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={shareResult.shareUrl}
                            readOnly
                            className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg"
                          />
                          <button
                            onClick={handleCopyLink}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                        {copied && (
                          <p className="text-sm text-green-600 mt-1">Link copied to clipboard!</p>
                        )}
                      </div>
                    )}

                    <MobileButton
                      onClick={handleClose}
                      variant="outline"
                      size="lg"
                      className="w-full"
                    >
                      Done
                    </MobileButton>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Error State */}
                    <div className="text-6xl mb-4">❌</div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">
                      Sharing Failed
                    </h4>
                    <p className="text-gray-600 mb-6">
                      {shareResult.error || 'Unable to share document. Please try again.'}
                    </p>

                    <div className="flex space-x-3">
                      <MobileButton
                        onClick={() => setShareResult(null)}
                        variant="primary"
                        size="lg"
                        className="flex-1"
                      >
                        Try Again
                      </MobileButton>
                      <MobileButton
                        onClick={handleClose}
                        variant="outline"
                        size="lg"
                        className="flex-1"
                      >
                        Cancel
                      </MobileButton>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}