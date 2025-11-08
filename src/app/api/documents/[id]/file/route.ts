import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { readFile } from 'fs/promises'
import { join } from 'path'

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
      include: { owner: true }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 403 })
    }

    // Check access permissions
    const hasAccess = document.owner.id === user.id
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Read and serve the PDF file
    const uploadsDir = join(process.cwd(), 'uploads')
    const filePath = join(uploadsDir, document.storageKey)
    
    const fileBuffer = await readFile(filePath)

    // Update view count
    await prisma.document.update({
      where: { id: params.id },
      data: { viewCount: { increment: 1 } }
    })

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${document.originalFilename || document.title}.pdf"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      }
    })

  } catch (error) {
    console.error('Error serving PDF:', error)
    return NextResponse.json({ 
      error: 'Failed to serve document' 
    }, { status: 500 })
  }
}