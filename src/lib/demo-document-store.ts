// In-memory storage for demo documents and their share links
// This will persist uploaded documents and their shares during the session

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
  restrictedEmail?: string // Email address that has exclusive access
}

class DemoDocumentStore {
  private documents: Map<string, DemoDocument> = new Map()
  private shareLinks: Map<string, DemoShareLink> = new Map()
  private documentViews: Map<string, number> = new Map() // Track document views

  // Document methods
  addDocument(document: DemoDocument) {
    this.documents.set(document.id, document)
    this.documentViews.set(document.id, 0) // Initialize view count
    console.log(`📄 Added demo document: ${document.id} - ${document.title}`)
  }

  getDocument(id: string): DemoDocument | undefined {
    return this.documents.get(id)
  }

  getAllDocuments(): DemoDocument[] {
    return Array.from(this.documents.values())
  }

  // Share link methods
  addShareLink(shareLink: DemoShareLink) {
    this.shareLinks.set(shareLink.code, shareLink)
    console.log(`🔗 Added demo share link: ${shareLink.code} for document: ${shareLink.documentId}`)
  }

  getShareLink(code: string): DemoShareLink | undefined {
    return this.shareLinks.get(code)
  }

  getShareLinksForDocument(documentId: string): DemoShareLink[] {
    return Array.from(this.shareLinks.values()).filter(
      link => link.documentId === documentId
    )
  }

  incrementShareLinkViews(code: string): boolean {
    const shareLink = this.shareLinks.get(code)
    if (shareLink) {
      shareLink.openCount++
      console.log(`👁️ Incremented views for share link: ${code} (now ${shareLink.openCount})`)
      return true
    }
    return false
  }

  // Get document by share code
  getDocumentByShareCode(code: string): { document: DemoDocument; shareLink: DemoShareLink } | null {
    const shareLink = this.getShareLink(code)
    if (!shareLink) return null

    const document = this.getDocument(shareLink.documentId)
    if (!document) return null

    return { document, shareLink }
  }

  // View tracking methods
  incrementDocumentViews(documentId: string): number {
    const currentViews = this.documentViews.get(documentId) || 0
    const newViews = currentViews + 1
    this.documentViews.set(documentId, newViews)
    console.log(`👁️ Incremented views for document: ${documentId} (now ${newViews})`)
    return newViews
  }

  getDocumentViews(documentId: string): number {
    return this.documentViews.get(documentId) || 0
  }

  getTotalViews(): number {
    return Array.from(this.documentViews.values()).reduce((sum, views) => sum + views, 0)
  }

  // Debug methods
  getStats() {
    return {
      documents: this.documents.size,
      shareLinks: this.shareLinks.size,
      documentIds: Array.from(this.documents.keys()),
      shareCodes: Array.from(this.shareLinks.keys()),
      totalViews: this.getTotalViews(),
      documentViews: Object.fromEntries(this.documentViews)
    }
  }

  clear() {
    this.documents.clear()
    this.shareLinks.clear()
    this.documentViews.clear()
    console.log('🧹 Cleared demo document store')
  }
}

// Global instance
const demoStore = new DemoDocumentStore()

export { demoStore, type DemoDocument, type DemoShareLink }