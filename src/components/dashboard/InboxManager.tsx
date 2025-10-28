'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, MailOpen, FileText, Trash2, ExternalLink, Clock, User } from 'lucide-react'
import { MobileButton } from '@/components/ui/mobile-button'

interface InboxItem {
  id: string
  recipientEmail: string
  documentTitle: string
  documentDescription?: string
  shareCode: string
  shareUrl: string
  senderMessage?: string
  createdAt: string
  isRead: boolean
  documentId: string
}

interface InboxManagerProps {
  userEmail: string
}

export default function InboxManager({ userEmail }: InboxManagerProps) {
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null)

  useEffect(() => {
    if (userEmail) {
      fetchInbox()
    }
  }, [userEmail])

  const fetchInbox = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/inbox?email=${encodeURIComponent(userEmail)}`)
      const data = await response.json()
      
      if (data.success) {
        setInboxItems(data.inbox)
        setUnreadCount(data.unreadCount)
      } else {
        console.error('Failed to fetch inbox:', data.error)
      }
    } catch (error) {
      console.error('Error fetching inbox:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (itemId: string) => {
    try {
      const response = await fetch('/api/inbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          itemId,
          action: 'markRead'
        }),
      })
      
      if (response.ok) {
        // Update local state
        setInboxItems(items => 
          items.map(item => 
            item.id === itemId ? { ...item, isRead: true } : item
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const removeItem = async (itemId: string) => {
    try {
      const response = await fetch('/api/inbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          itemId,
          action: 'remove'
        }),
      })
      
      if (response.ok) {
        // Update local state
        setInboxItems(items => items.filter(item => item.id !== itemId))
        if (selectedItem?.id === itemId) {
          setSelectedItem(null)
        }
        // Refresh unread count
        fetchInbox()
      }
    } catch (error) {
      console.error('Error removing item:', error)
    }
  }

  const handleItemClick = (item: InboxItem) => {
    setSelectedItem(item)
    if (!item.isRead) {
      markAsRead(item.id)
    }
  }

  const handleViewDocument = (item: InboxItem) => {
    // Open the shared document
    window.open(item.shareUrl, '_blank')
    if (!item.isRead) {
      markAsRead(item.id)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-lg">
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inbox...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-8 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Mail className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900">
            Shared Documents Inbox
          </h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={fetchInbox}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {inboxItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg mb-2">No shared documents yet</p>
          <p className="text-sm">Documents shared with you will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inbox List */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700 mb-3">
              Inbox ({inboxItems.length})
            </h4>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {inboxItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedItem?.id === item.id
                      ? 'border-blue-500 bg-blue-50'
                      : item.isRead
                      ? 'border-gray-200 bg-white hover:bg-gray-50'
                      : 'border-blue-200 bg-blue-50 hover:bg-blue-100'
                  }`}
                  onClick={() => handleItemClick(item)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-1">
                        {item.isRead ? (
                          <MailOpen className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Mail className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className={`font-medium truncate ${
                          item.isRead ? 'text-gray-700' : 'text-gray-900'
                        }`}>
                          {item.documentTitle}
                        </h5>
                        <p className="text-sm text-gray-500 truncate">
                          {item.documentDescription || 'Shared document'}
                        </p>
                        <div className="flex items-center space-x-2 mt-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeItem(item.id)
                      }}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Selected Item Details */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Document Details</h4>
            {selectedItem ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border border-gray-200 rounded-lg p-6"
              >
                <div className="flex items-start space-x-3 mb-4">
                  <FileText className="w-6 h-6 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <h5 className="text-lg font-semibold text-gray-900 mb-1">
                      {selectedItem.documentTitle}
                    </h5>
                    {selectedItem.documentDescription && (
                      <p className="text-gray-600 mb-3">
                        {selectedItem.documentDescription}
                      </p>
                    )}
                  </div>
                </div>

                {selectedItem.senderMessage && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                    <p className="text-sm text-blue-800 italic">
                      "{selectedItem.senderMessage}"
                    </p>
                  </div>
                )}

                <div className="space-y-2 mb-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Shared on {new Date(selectedItem.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Shared with {selectedItem.recipientEmail}</span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <MobileButton
                    onClick={() => handleViewDocument(selectedItem)}
                    variant="primary"
                    className="flex-1"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Document
                  </MobileButton>
                  <MobileButton
                    onClick={() => removeItem(selectedItem.id)}
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </MobileButton>
                </div>
              </motion.div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-6 text-center text-gray-500">
                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>Select an inbox item to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}