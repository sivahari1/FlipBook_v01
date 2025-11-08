import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { join } from 'path'
import { writeFile, readFile, mkdir, access } from 'fs/promises'
import { nanoid } from 'nanoid'

export interface SecureStorageProvider {
  saveFile(key: string, buffer: Buffer, metadata?: Record<string, string>): Promise<string>
  getSignedUrl(key: string, expiresIn?: number): Promise<string>
  deleteFile(key: string): Promise<void>
  getFileBuffer(key: string): Promise<Buffer>
}

class S3StorageProvider implements SecureStorageProvider {
  private s3Client: S3Client
  private bucketName: string

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
    this.bucketName = process.env.AWS_S3_BUCKET!
  }

  async saveFile(key: string, buffer: Buffer, metadata?: Record<string, string>): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: 'application/pdf',
      Metadata: metadata,
      // Make sure files are private by default
      ACL: 'private',
    })

    await this.s3Client.send(command)
    return key
  }

  async getSignedUrl(key: string, expiresIn: number = 300): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    })

    return await getSignedUrl(this.s3Client, command, { expiresIn })
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    })

    await this.s3Client.send(command)
  }

  async getFileBuffer(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    })

    const response = await this.s3Client.send(command)
    const chunks: Uint8Array[] = []
    
    if (response.Body) {
      const stream = response.Body as any
      for await (const chunk of stream) {
        chunks.push(chunk)
      }
    }
    
    return Buffer.concat(chunks)
  }
}

class LocalSecureStorageProvider implements SecureStorageProvider {
  private uploadsDir: string
  private baseUrl: string

  constructor() {
    this.uploadsDir = join(process.cwd(), 'secure-uploads')
    this.baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  }

  async ensureUploadsDir() {
    try {
      await access(this.uploadsDir)
    } catch {
      await mkdir(this.uploadsDir, { recursive: true })
    }
  }

  async saveFile(key: string, buffer: Buffer, metadata?: Record<string, string>): Promise<string> {
    await this.ensureUploadsDir()
    const filePath = join(this.uploadsDir, key)
    
    // Create directory if it doesn't exist
    const dir = join(this.uploadsDir, key.split('/').slice(0, -1).join('/'))
    if (dir !== this.uploadsDir) {
      await mkdir(dir, { recursive: true })
    }
    
    await writeFile(filePath, buffer)
    return key
  }

  async getSignedUrl(key: string, expiresIn: number = 300): Promise<string> {
    // Generate a temporary access token
    const token = nanoid(32)
    const expiresAt = Date.now() + (expiresIn * 1000)
    
    // Store the token temporarily (in production, use Redis or database)
    if (!global.tempTokens) {
      global.tempTokens = new Map()
    }
    global.tempTokens.set(token, { key, expiresAt })
    
    // Clean up expired tokens
    for (const [t, data] of global.tempTokens.entries()) {
      if (data.expiresAt < Date.now()) {
        global.tempTokens.delete(t)
      }
    }
    
    return `${this.baseUrl}/api/secure-file/${token}`
  }

  async deleteFile(key: string): Promise<void> {
    const filePath = join(this.uploadsDir, key)
    const fs = await import('fs/promises')
    await fs.unlink(filePath)
  }

  async getFileBuffer(key: string): Promise<Buffer> {
    const filePath = join(this.uploadsDir, key)
    return await readFile(filePath)
  }
}

// Factory function to get the appropriate secure storage provider
export function getSecureStorageProvider(): SecureStorageProvider {
  const isProduction = process.env.NODE_ENV === 'production'
  const hasS3Config = process.env.AWS_ACCESS_KEY_ID && 
                     process.env.AWS_SECRET_ACCESS_KEY && 
                     process.env.AWS_S3_BUCKET

  if (isProduction && hasS3Config) {
    console.log('🔒 Using S3 secure storage provider')
    return new S3StorageProvider()
  }

  console.log('🔒 Using local secure storage provider')
  return new LocalSecureStorageProvider()
}

// Helper function to generate unique storage keys
export function generateStorageKey(documentId: string, filename: string): string {
  const timestamp = Date.now()
  const random = nanoid(8)
  const extension = filename.split('.').pop() || 'pdf'
  return `documents/${documentId}/${timestamp}-${random}.${extension}`
}

// Helper function to generate share keys
export function generateShareKey(): string {
  return nanoid(16) // 16 character random string
}