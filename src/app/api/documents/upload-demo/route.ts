import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'

export const runtime = 'nodejs'

// Demo upload endpoint that works without database
export async function POST(request: NextRequest) {
  console.log('📤 Demo document upload API called')
  
  try {
    // Parse form data
    const formData = await request.formData()
    console.log('📋 Form data parsed successfully')
    
    // Extract and validate form data
    const title = formData.get('title') as string
    const description = formData.get('description') as string || null
    const file = formData.get('file') as File
    
    console.log('📝 Extracted data:', {
      title,
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size
    })
    
    // Validate required fields
    if (!title || !title.trim()) {
      console.log('❌ Missing title')
      return NextResponse.json({ error: 'Document title is required' }, { status: 400 })
    }
    
    if (!file || file.size === 0) {
      console.log('❌ Missing or empty file')
      return NextResponse.json({ error: 'Document file is required' }, { status: 400 })
    }
    
    // Validate file type
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      console.log('❌ Invalid file type:', file.type)
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }
    
    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      console.log('❌ File too large:', file.size)
      return NextResponse.json({ error: 'File size must be less than 50MB' }, { status: 400 })
    }

    // Generate a unique document ID
    const documentId = `demo-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    console.log('🆔 Generated document ID:', documentId)
    
    // In demo mode, we'll simulate file storage without actually saving to disk
    // This works around AWS Amplify's read-only file system
    const fileName = `${documentId}.pdf`
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    
    console.log('💾 File processed successfully (demo mode):', fileName)
    console.log('📊 File size:', fileBuffer.length, 'bytes')
    
    // Get page count (simplified)
    let pageCount = Math.floor(Math.random() * 20) + 5 // Random page count for demo
    
    console.log('✅ Demo document processed successfully')

    // Prepare response
    const response = {
      success: true,
      document: {
        id: documentId,
        title: title.trim(),
        description: description?.trim() || null,
        pageCount: pageCount,
        createdAt: new Date().toISOString(),
        fileName: fileName,
        fileSize: file.size,
        demoMode: true
      },
      message: 'Document uploaded successfully! (Demo mode - no database required)',
      note: 'This is a demo upload. To enable full functionality, please configure the database.'
    }
    
    console.log('📤 Sending success response')
    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('❌ Demo document upload error:', error)
    
    return NextResponse.json({ 
      error: 'Failed to upload document',
      details: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}