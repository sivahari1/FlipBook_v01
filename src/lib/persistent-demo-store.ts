// Persistent Demo Store - extends demo-document-store with persistence
import { demoStore, DemoDocument } from './demo-document-store'

class PersistentDemoStore {
  private storageKey = 'flipbook-demo-store'

  constructor() {
    this.loadFromStorage()
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.storageKey)
        if (stored) {
          const data = JSON.parse(stored)
          // Load stored documents into demo store
          Object.entries(data).forEach(([id, doc]) => {
            demoStore.addDocument(doc as DemoDocument)
          })
        }
      } catch (error) {
        console.warn('Failed to load from localStorage:', error)
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      try {
        const documents = demoStore.getAllDocuments()
        const data = documents.reduce((acc, doc) => {
          acc[doc.id] = doc
          return acc
        }, {} as Record<string, DemoDocument>)
        localStorage.setItem(this.storageKey, JSON.stringify(data))
      } catch (error) {
        console.warn('Failed to save to localStorage:', error)
      }
    }
  }

  // Proxy methods to demo store with persistence
  getDocument(id: string): DemoDocument | null {
    return demoStore.getDocument(id)
  }

  getDocumentByShareKey(shareKey: string): DemoDocument | null {
    return demoStore.getDocumentByShareKey(shareKey)
  }

  getAllDocuments(): DemoDocument[] {
    return demoStore.getAllDocuments()
  }

  addDocument(doc: DemoDocument): void {
    demoStore.addDocument(doc)
    this.saveToStorage()
  }

  updateDocument(id: string, updates: Partial<DemoDocument>): boolean {
    const result = demoStore.updateDocument(id, updates)
    if (result) {
      this.saveToStorage()
    }
    return result
  }

  deleteDocument(id: string): boolean {
    const result = demoStore.deleteDocument(id)
    if (result) {
      this.saveToStorage()
    }
    return result
  }

  getDocumentViews(id: string): number {
    return demoStore.getDocumentViews(id)
  }

  getDocumentAnalytics(id: string) {
    return demoStore.getDocumentAnalytics(id)
  }

  generateShareKey(documentId: string): string {
    const shareKey = demoStore.generateShareKey(documentId)
    this.saveToStorage()
    return shareKey
  }

  // Additional persistence methods
  clearStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey)
    }
  }

  exportData(): string {
    const documents = this.getAllDocuments()
    return JSON.stringify(documents, null, 2)
  }

  importData(jsonData: string): boolean {
    try {
      const documents = JSON.parse(jsonData) as DemoDocument[]
      documents.forEach(doc => this.addDocument(doc))
      return true
    } catch (error) {
      console.error('Failed to import data:', error)
      return false
    }
  }
}

// Export singleton instance
export const persistentDemoStore = new PersistentDemoStore()

// Export types
export type { DemoDocument }