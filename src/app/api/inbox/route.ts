import { NextRequest, NextResponse } from 'next/server'
import { inboxStore } from '@/lib/inbox-store'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const email = url.searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email parameter is required'
      }, { status: 400 })
    }
    
    console.log('📥 Fetching inbox for:', email)
    
    const inboxItems = inboxStore.getInboxItems(email)
    const unreadCount = inboxStore.getUnreadCount(email)
    
    return NextResponse.json({
      success: true,
      inbox: inboxItems,
      unreadCount,
      totalItems: inboxItems.length
    })
    
  } catch (error) {
    console.error('❌ Error fetching inbox:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch inbox'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, itemId, action } = body
    
    if (!email || !itemId || !action) {
      return NextResponse.json({
        success: false,
        error: 'Email, itemId, and action are required'
      }, { status: 400 })
    }
    
    console.log(`📥 Inbox action: ${action} for item ${itemId} by ${email}`)
    
    let success = false
    
    switch (action) {
      case 'markRead':
        success = inboxStore.markAsRead(email, itemId)
        break
      case 'remove':
        success = inboxStore.removeInboxItem(email, itemId)
        break
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use "markRead" or "remove"'
        }, { status: 400 })
    }
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: `Item ${action === 'markRead' ? 'marked as read' : 'removed'} successfully`
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Item not found or action failed'
      }, { status: 404 })
    }
    
  } catch (error) {
    console.error('❌ Error updating inbox:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update inbox'
    }, { status: 500 })
  }
}