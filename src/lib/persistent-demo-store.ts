// Persistent demo store that works in serverless environments
// Uses file system to persist data between function calls

import { writeFile, readFile, mkdir, access } from 'fs/promises'
import { join } from 'path'

interface DemoDocument {
  id: string
  title: string
  description?: string
  pageCount: number
  createdAt: string
  fileName: string
  fileSize: number
  storageKey: string
  drmOptions: any
}

interface DemoShareLink {
  id: string
  code: string
  documentId: string
  createdAt: string
  expiresAt: string
  maxOpens?: number
  openCount: number
  requirePass: boolean
  restrictedEmail?: string
}

interface DemoStoreData {
  documents: Record<string, DemoDocument>
  shareLinks: Record<string, DemoShareLink>
  documentViews: Record<string, number>
}

class PersistentDemoStore {
  private dataFile: string
  private data: DemoStoreData | null = null

  constructor() {
    // Use /tmp directory for serverless environments
    this.dataFile = join('/tmp', 'demo-store.json')
  }

  private async ensureDataLoaded(): Promise<void> {
    if (this.data) return

    try {
      const fileContent = await readFile(this.dataFile, 'utf-8')
      this.data = JSON.parse(fileContent)
      console.log('📂 Loaded demo store data from file')
    } catch (error) {
      // File doesn't exist or is corrupted, start fresh
      this.data = {
        documents: {},
        shareLinks: {},
        documentViews: {}
      }
      console.log('📂 Initialized new demo store data')
    }
  }

  private async saveData(): Promise<void> {
    if (!this.data) return

    try {
      await writeFile(this.dataFile, JSON.stringify(this.data, null, 2))
      console.log('💾 Saved demo store data to file')
    } catch (error) {
      console.error('❌ Failed to save demo store data:', error)
    }
  }

  // Document methods
  async addDocument(document: DemoDocument): Promise<void> {
    await this.ensureDataLoaded()
    if (!this.data) return

    this.data.documents[document.id] = document
    this.data.documentViews[document.id] = 0
    await this.saveData()
    console.log(`📄 Added demo document: ${document.id} - ${document.title}`)
  }

  async getDocument(id: string): Promise<DemoDocument | undefined> {
    await this.ensureDataLoaded()
    if (!this.data) return undefined

    return this.data.documents[id]
  }

  async getAllDocuments(): Promise<DemoDocument[]> {
    await this.ensureDataLoaded()
    if (!this.data) return []

    return Object.values(this.data.documents)
  }

  // Share link methods
  async addShareLink(shareLink: DemoShareLink): Promise<void> {
    await this.ensureDataLoaded()
    if (!this.data) return

    this.data.shareLinks[shareLink.code] = shareLink
    await this.saveData()
    console.log(`🔗 Added demo share link: ${shareLink.code} for document: ${shareLink.documentId}`)
  }

  async getShareLink(code: string): Promise<DemoShareLink | undefined> {
    await this.ensureDataLoaded()
    if (!this.data) return undefined

    return this.data.shareLinks[code]
  }

  async getShareLinksForDocument(documentId: string): Promise<DemoShareLink[]> {
    await this.ensureDataLoaded()
    if (!this.data) return []

    return Object.values(this.data.shareLinks).filter(
      link => link.documentId === documentId
    )
  }

  async incrementShareLinkViews(code: string): Promise<boolean> {
    await this.ensureDataLoaded()
    if (!this.data) return false

    const shareLink = this.data.shareLinks[code]
    if (shareLink) {
      shareLink.openCount++
      await this.saveData()
      console.log(`👁️ Incremented views for share link: ${code} (now ${shareLink.openCount})`)
      return true
    }
    return false
  }

  // View tracking methods
  async incrementDocumentViews(documentId: string): Promise<number> {
    await this.ensureDataLoaded()
    if (!this.data) return 0

    const currentViews = this.data.documentViews[documentId] || 0
    const newViews = currentViews + 1
    this.data.documentViews[documentId] = newViews
    await this.saveData()
    console.log(`👁️ Incremented views for document: ${documentId} (now ${newViews})`)
    return newViews
  }

  async getDocumentViews(documentId: string): Promise<number> {
    await this.ensureDataLoaded()
    if (!this.data) return 0

    return this.data.documentViews[documentId] || 0
  }

  async getTotalViews(): Promise<number> {
    await this.ensureDataLoaded()
    if (!this.data) return 0

    return Object.values(this.data.documentViews).reduce((sum, views) => sum + views, 0)
  }

  // Get document by share code
  async getDocumentByShareCode(code: string): Promise<{ document: DemoDocument; shareLink: DemoShareLink } | null> {
    const shareLink = await this.getShareLink(code)
    if (!shareLink) return null

    const document = await this.getDocument(shareLink.documentId)
    if (!document) return null

    return { document, shareLink }
  }

  // Debug methods
  async getStats() {
    await this.ensureDataLoaded()
    if (!this.data) return { documents: 0, shareLinks: 0, totalViews: 0 }

    return {
      documents: Object.keys(this.data.documents).length,
      shareLinks: Object.keys(this.data.shareLinks).length,
      documentIds: Object.keys(this.data.documents),
      shareCodes: Object.keys(this.data.shareLinks),
      totalViews: await this.getTotalViews(),
      documentViews: this.data.documentViews
    }
  }

  async clear(): Promise<void> {
    this.data = {
      documents: {},
      shareLinks: {},
      documentViews: {}
    }
    await this.saveData()
    console.log('🧹 Cleared demo document store')
  }
}

// Global instance
const persistentDemoStore = new PersistentDemoStore()

export { persistentDemoStore, type DemoDocument, type DemoShareLink }