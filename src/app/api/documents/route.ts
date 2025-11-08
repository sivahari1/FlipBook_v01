import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 403 })
    }

    const documents = await prisma.document.findMany({
      where: { ownerId: user.id },
      select: {
        id: true,
        title: true,
        description: true,
        pageCount: true,
        createdAt: true,
        updatedAt: true,
        viewCount: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      documents
    })

  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch documents' 
    }, { status: 500 })
  }
}