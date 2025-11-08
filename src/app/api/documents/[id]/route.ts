import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const document = await prisma.document.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: { 
            id: true,
            email: true, 
            role: true 
          }
        }
      }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Check if user has access to this document
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 403 })
    }

    const isOwner = document.owner.id === user.id
    const canAccess = isOwner // Add more access logic here if needed

    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        description: document.description,
        pageCount: document.pageCount,
        createdAt: document.createdAt,
        owner: document.owner.email,
        hasPassphrase: document.hasPassphrase,
        drmOptions: JSON.parse(document.drmOptions || '{}'),
        canEdit: isOwner,
        accessLevel: isOwner ? 'owner' : 'viewer'
      }
    })

  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch document' 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const document = await prisma.document.findUnique({
      where: { id: params.id },
      include: { owner: true }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || document.owner.id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete the document
    await prisma.document.delete({
      where: { id: params.id }
    })

    // Try to delete the physical file
    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      const uploadsDir = path.join(process.cwd(), 'uploads')
      const filePath = path.join(uploadsDir, `${document.id}.pdf`)
      await fs.unlink(filePath)
    } catch (fileError) {
      console.log('Could not delete physical file:', fileError)
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json({ 
      error: 'Failed to delete document' 
    }, { status: 500 })
  }
}