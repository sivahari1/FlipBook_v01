import { NextResponse } from 'next/server'
import { inboxStore } from '@/lib/inbox-store'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const stats = inboxStore.getStats()
    
    return NextResponse.json({
      success: true,
      stats,
      message: 'Inbox debug information'
    })
  } catch (error) {
    console.error('❌ Debug inbox error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}