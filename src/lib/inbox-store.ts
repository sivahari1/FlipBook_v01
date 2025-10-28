// In-memory inbox system for demo mode
// In production, this would be stored in the database

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

class InboxStore {
  private inboxItems: Map<string, InboxItem[]> = new Map()

  // Add a shared document to recipient's inbox
  addInboxItem(item: InboxItem) {
    const userInbox = this.inboxItems.get(item.recipientEmail) || []
    userInbox.unshift(item) // Add to beginning (newest first)
    this.inboxItems.set(item.recipientEmail, userInbox)
    console.log(`📥 Added inbox item for ${item.recipientEmail}: ${item.documentTitle}`)
  }

  // Get all inbox items for a user
  getInboxItems(email: string): InboxItem[] {
    return this.inboxItems.get(email) || []
  }

  // Mark an inbox item as read
  markAsRead(email: string, itemId: string): boolean {
    const userInbox = this.inboxItems.get(email)
    if (!userInbox) return false

    const item = userInbox.find(item => item.id === itemId)
    if (item) {
      item.isRead = true
      console.log(`📖 Marked inbox item as read: ${itemId}`)
      return true
    }
    return false
  }

  // Get unread count for a user
  getUnreadCount(email: string): number {
    const userInbox = this.inboxItems.get(email) || []
    return userInbox.filter(item => !item.isRead).length
  }

  // Remove an inbox item
  removeInboxItem(email: string, itemId: string): boolean {
    const userInbox = this.inboxItems.get(email)
    if (!userInbox) return false

    const index = userInbox.findIndex(item => item.id === itemId)
    if (index !== -1) {
      userInbox.splice(index, 1)
      console.log(`🗑️ Removed inbox item: ${itemId}`)
      return true
    }
    return false
  }

  // Get stats
  getStats() {
    const totalUsers = this.inboxItems.size
    const totalItems = Array.from(this.inboxItems.values()).reduce((sum, inbox) => sum + inbox.length, 0)
    const totalUnread = Array.from(this.inboxItems.entries()).reduce((sum, [email, inbox]) => {
      return sum + inbox.filter(item => !item.isRead).length
    }, 0)

    return {
      totalUsers,
      totalItems,
      totalUnread,
      userEmails: Array.from(this.inboxItems.keys())
    }
  }

  // Clear all inbox items (for testing)
  clear() {
    this.inboxItems.clear()
    console.log('🧹 Cleared all inbox items')
  }
}

// Global instance
const inboxStore = new InboxStore()

export { inboxStore, type InboxItem }