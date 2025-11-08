import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { PDFDocument } from 'pdf-lib'

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Upload request received')
    
    const session = await getServerSession(authOptions)
    console.log('🔐 Session:', session ? 'Found' : 'Not found')
    
    if (!session?.user?.email) {
      console.log('❌ No session or email found')
      return NextResponse.json({ error: 'Unauthorized - Please sign in first' }, { status: 401 })
    }

    console.log('👤 Looking for user:', session.user.email)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      console.log('❌ User not found in database')
      return NextResponse.json({ error: 'User not found in database' }, { status: 403 })
    }

    console.log('✅ User found:', user.email)

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string || ''

    console.log('📋 Form data:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      title,
      description: description ? 'provided' : 'empty'
    })

    if (!file || !title) {
      console.log('❌ Missing file or title')
      return NextResponse.json({ 
        error: 'File and title are required',
        details: {
          hasFile: !!file,
          hasTitle: !!title
        }
      }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      console.log('❌ Invalid file type:', file.type)
      return NextResponse.json({ 
        error: 'Only PDF files are allowed',
        details: { receivedType: file.type }
      }, { status: 400 })
    }

    console.log('📄 Processing PDF...')
    // Read and validate PDF
    const bytes = await file.arrayBuffer()
    console.log('📊 File size:', bytes.byteLength, 'bytes')
    
    let pdfDoc
    let pageCount = 1 // Default page count
    
    try {
      // Try to load PDF normally first
      pdfDoc = await PDFDocument.load(bytes)
      pageCount = pdfDoc.getPageCount()
      console.log('📑 PDF pages:', pageCount)
    } catch (error) {
      console.log('⚠️ PDF might be encrypted, trying with ignoreEncryption...')
      try {
        // Try loading with encryption ignored
        pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true })
        pageCount = pdfDoc.getPageCount()
        console.log('📑 Encrypted PDF pages:', pageCount)
      } catch (encryptionError) {
        console.log('⚠️ Could not process PDF, using default page count')
        // If both fail, we'll still proceed with default page count
        // The PDF file will be stored but page count might be inaccurate
        pageCount = 1
      }
    }

    // Create document record
    console.log('💾 Creating document record...')
    const document = await prisma.document.create({
      data: {
        title,
        description,
        pageCount,
        ownerId: user.id,
        storageKey: '', // Will be updated after file save
        originalFilename: file.name,
        fileSize: BigInt(file.size),
        mimeType: file.type
      }
    })
    console.log('✅ Document created with ID:', document.id)

    // Save file to uploads directory
    console.log('💾 Saving file to disk...')
    const uploadsDir = join(process.cwd(), 'uploads')
    await mkdir(uploadsDir, { recursive: true })
    
    const fileName = `${document.id}.pdf`
    const filePath = join(uploadsDir, fileName)
    
    await writeFile(filePath, Buffer.from(bytes))
    console.log('✅ File saved to:', filePath)

    // Update document with storage key
    await prisma.document.update({
      where: { id: document.id },
      data: { storageKey: fileName }
    })
    console.log('✅ Document updated with storage key')

    console.log('🎉 Upload completed successfully!')
    return NextResponse.json({
      success: true,
      message: 'Document uploaded successfully',
      document: {
        id: document.id,
        title: document.title,
        description: document.description,
        pageCount: document.pageCount,
        fileSize: file.size,
        createdAt: document.createdAt
      }
    })

  } catch (error) {
    console.error('❌ Upload error:', error)
    return NextResponse.json({ 
      error: 'Failed to upload document',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}