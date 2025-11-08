// Demo Document Store for development and testing
export interface DemoDocument {
  id: string
  title: string
  description?: string
  pageCount: number
  createdAt: string
  owner: string
  canEdit: boolean
  accessLevel: string
  shareKey?: string
}

class DemoDocumentStore {
  private documents: Map<string, DemoDocument> = new Map()

  constructor() {
    // Initialize with sample documents
    this.initializeSampleDocuments()
  }

  private initializeSampleDocuments() {
    const sampleDoc: DemoDocument = {
      id: 'cmhkkk8sf00039uc4wutccz6m',
      title: 'Sample Protected Document',
      description: 'A sample PDF document with DRM protection',
      pageCount: 5,
      createdAt: new Date().toISOString(),
      owner: 'demo@example.com',
      canEdit: true,
      accessLevel: 'owner',
      shareKey: 'demo-share-key-123'
    }

    this.documents.set(sampleDoc.id, sampleDoc)
  }

  getDocument(id: string): DemoDocument | null {
    return this.documents.get(id) || null
  }

  getDocumentByShareKey(shareKey: string): DemoDocument | null {
    for (const doc of this.documents.values()) {
      if (doc.shareKey === shareKey) {
        return doc
      }
    }
    return null
  }

  getAllDocuments(): DemoDocument[] {
    return Array.from(this.documents.values())
  }

  addDocument(doc: DemoDocument): void {
    this.documents.set(doc.id, doc)
  }

  updateDocument(id: string, updates: Partial<DemoDocument>): boolean {
    const doc = this.documents.get(id)
    if (doc) {
      this.documents.set(id, { ...doc, ...updates })
      return true
    }
    return false
  }

  deleteDocument(id: string): boolean {
    return this.documents.delete(id)
  }

  // Analytics methods
  getDocumentViews(id: string): number {
    // Return mock view count
    return Math.floor(Math.random() * 100) + 1
  }

  getDocumentAnalytics(id: string) {
    return {
      views: this.getDocumentViews(id),
      downloads: 0, // Downloads are blocked in DRM
      shares: Math.floor(Math.random() * 10),
      lastViewed: new Date().toISOString()
    }
  }

  // Share methods
  generateShareKey(documentId: string): string {
    const shareKey = `share-${documentId}-${Date.now()}`
    const doc = this.documents.get(documentId)
    if (doc) {
      doc.shareKey = shareKey
      this.documents.set(documentId, doc)
    }
    return shareKey
  }
}

// Export singleton instance
export const demoStore = new DemoDocumentStore()

// Export types
export type { DemoDocument }