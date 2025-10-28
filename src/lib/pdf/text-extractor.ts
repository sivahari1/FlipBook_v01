import pdfParse from 'pdf-parse'
import { PDFDocument } from 'pdf-lib'
import { pdfDbService } from '@/lib/database/pdf-service'
import { PDFProcessingError, PDF_ERROR_CODES } from '@/lib/types/pdf'
import type {
  PageTextContent,
  TextWord,
  SearchOptions,
  SearchResult,
  TextMatch
} from '@/lib/types/pdf'

export interface TextExtractionOptions {
  includeWordPositions?: boolean
  includeMetadata?: boolean
  maxTextLength?: number
  timeout?: number
}

export interface TextExtractionResult {
  pages: PageTextContent[]
  metadata?: {
    totalCharacters: number
    totalWords: number
    language?: string
    extractionTime: number
  }
}

export class TextExtractor {
  private readonly MAX_TEXT_LENGTH = 1024 * 1024 // 1MB per document
  private readonly EXTRACTION_TIMEOUT = 5 * 60 * 1000 // 5 minutes
  private readonly MIN_WORD_LENGTH = 1
  private readonly MAX_WORD_LENGTH = 100

  async extractText(
    pdfBuffer: Buffer,
    options: TextExtractionOptions = {}
  ): Promise<TextExtractionResult> {
    const startTime = Date.now()

    try {
      // Set timeout for extraction
      const timeout = options.timeout || this.EXTRACTION_TIMEOUT
      const extractionPromise = this.performTextExtraction(pdfBuffer, options)
      
      const result = await Promise.race([
        extractionPromise,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Text extraction timeout')), timeout)
        )
      ])

      const extractionTime = Date.now() - startTime

      // Add metadata if requested
      if (options.includeMetadata) {
        const totalCharacters = result.pages.reduce((sum, page) => sum + page.text.length, 0)
        const totalWords = result.pages.reduce((sum, page) => sum + page.words.length, 0)

        result.metadata = {
          totalCharacters,
          totalWords,
          extractionTime
        }
      }

      return result

    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        throw new PDFProcessingError(
          'Text extraction timed out',
          PDF_ERROR_CODES.TEXT_EXTRACTION_FAILED
        )
      }

      throw new PDFProcessingError(
        `Text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        PDF_ERROR_CODES.TEXT_EXTRACTION_FAILED
      )
    }
  }

  private async performTextExtraction(
    pdfBuffer: Buffer,
    options: TextExtractionOptions
  ): Promise<TextExtractionResult> {
    try {
      // First, get basic text content using pdf-parse
      const parsedPdf = await pdfParse(pdfBuffer)
      const fullText = parsedPdf.text

      // Check text length limit
      if (fullText.length > (options.maxTextLength || this.MAX_TEXT_LENGTH)) {
        throw new PDFProcessingError(
          `Extracted text too large: ${fullText.length} characters (max: ${options.maxTextLength || this.MAX_TEXT_LENGTH})`,
          PDF_ERROR_CODES.TEXT_EXTRACTION_FAILED
        )
      }

      // Get PDF document for page information
      const pdfDoc = await PDFDocument.load(pdfBuffer)
      const pageCount = pdfDoc.getPageCount()

      // Split text by pages (this is an approximation - in production you'd use more sophisticated methods)
      const pages = await this.splitTextByPages(fullText, pageCount, options)

      return { pages }

    } catch (error) {
      if (error instanceof PDFProcessingError) {
        throw error
      }

      throw new PDFProcessingError(
        `Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`,
        PDF_ERROR_CODES.TEXT_EXTRACTION_FAILED
      )
    }
  }

  private async splitTextByPages(
    fullText: string,
    pageCount: number,
    options: TextExtractionOptions
  ): Promise<PageTextContent[]> {
    const pages: PageTextContent[] = []
    
    // Simple text splitting by estimated page length
    // In production, you'd use a more sophisticated PDF parsing library
    const textPerPage = Math.ceil(fullText.length / pageCount)
    
    for (let i = 0; i < pageCount; i++) {
      const startIndex = i * textPerPage
      const endIndex = Math.min((i + 1) * textPerPage, fullText.length)
      const pageText = fullText.substring(startIndex, endIndex)

      // Extract words with positions (simplified positioning)
      const words = options.includeWordPositions 
        ? this.extractWordsWithPositions(pageText, i + 1)
        : this.extractSimpleWords(pageText)

      // Create searchable text (normalized for search)
      const searchableText = this.createSearchableText(pageText)

      pages.push({
        pageNumber: i + 1,
        text: pageText,
        words,
        searchableText
      })
    }

    return pages
  }

  private extractWordsWithPositions(pageText: string, pageNumber: number): TextWord[] {
    const words: TextWord[] = []
    const wordRegex = /\b\w+\b/g
    let match

    // Simple positioning algorithm (in production, you'd use actual PDF coordinates)
    let lineNumber = 0
    let charPosition = 0

    const lines = pageText.split('\n')
    
    for (const line of lines) {
      let wordMatch
      const lineWordRegex = /\b\w+\b/g
      let lineCharPosition = 0

      while ((wordMatch = lineWordRegex.exec(line)) !== null) {
        const word = wordMatch[0]
        
        if (word.length >= this.MIN_WORD_LENGTH && word.length <= this.MAX_WORD_LENGTH) {
          words.push({
            text: word,
            x: lineCharPosition * 8, // Approximate character width
            y: lineNumber * 20, // Approximate line height
            width: word.length * 8,
            height: 16,
            confidence: 0.9 // Default confidence
          })
        }

        lineCharPosition = wordMatch.index + word.length
      }

      lineNumber++
    }

    return words
  }

  private extractSimpleWords(pageText: string): TextWord[] {
    const words = pageText.match(/\b\w+\b/g) || []
    
    return words
      .filter(word => word.length >= this.MIN_WORD_LENGTH && word.length <= this.MAX_WORD_LENGTH)
      .map((word, index) => ({
        text: word,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        confidence: 0.8
      }))
  }

  private createSearchableText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }

  async searchText(
    documentId: string,
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    try {
      // Validate search query
      if (!query || query.trim().length === 0) {
        return []
      }

      const normalizedQuery = options.caseSensitive ? query : query.toLowerCase()
      const searchTerms = options.wholeWords 
        ? [normalizedQuery]
        : normalizedQuery.split(/\s+/).filter(term => term.length > 0)

      // Get text content from database
      const textSearchData = await pdfDbService.searchDocumentText(
        documentId,
        normalizedQuery,
        {
          pageLimit: options.maxResults || 50,
          pageOffset: options.pageOffset || 0,
          caseSensitive: options.caseSensitive
        }
      )

      const results: SearchResult[] = []

      for (const searchData of textSearchData) {
        const matches = this.findMatches(
          searchData.matches[0]?.context || '',
          searchTerms,
          options
        )

        if (matches.length > 0) {
          results.push({
            pageNumber: searchData.pageNumber,
            matches,
            totalMatches: matches.length,
            rank: this.calculateRelevanceScore(matches, searchTerms)
          })
        }
      }

      // Sort by relevance
      results.sort((a, b) => (b.rank || 0) - (a.rank || 0))

      return results.slice(0, options.maxResults || 50)

    } catch (error) {
      console.error('Text search failed:', error)
      throw new PDFProcessingError(
        `Text search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        PDF_ERROR_CODES.TEXT_EXTRACTION_FAILED
      )
    }
  }

  private findMatches(
    text: string,
    searchTerms: string[],
    options: SearchOptions
  ): TextMatch[] {
    const matches: TextMatch[] = []
    const searchText = options.caseSensitive ? text : text.toLowerCase()

    for (const term of searchTerms) {
      const regex = options.wholeWords 
        ? new RegExp(`\\b${this.escapeRegex(term)}\\b`, options.caseSensitive ? 'g' : 'gi')
        : new RegExp(this.escapeRegex(term), options.caseSensitive ? 'g' : 'gi')

      let match
      while ((match = regex.exec(searchText)) !== null) {
        const matchStart = match.index
        const matchEnd = matchStart + match[0].length

        // Get context around the match
        const contextStart = Math.max(0, matchStart - 50)
        const contextEnd = Math.min(text.length, matchEnd + 50)
        const context = text.substring(contextStart, contextEnd)

        matches.push({
          text: match[0],
          context,
          position: {
            x: 0, // Would be calculated from actual PDF coordinates
            y: 0,
            width: match[0].length * 8,
            height: 16
          },
          confidence: 0.9
        })
      }
    }

    return matches
  }

  private calculateRelevanceScore(matches: TextMatch[], searchTerms: string[]): number {
    let score = 0

    // Base score from number of matches
    score += matches.length * 10

    // Bonus for exact term matches
    for (const match of matches) {
      if (searchTerms.includes(match.text.toLowerCase())) {
        score += 20
      }
    }

    // Bonus for multiple different terms found
    const uniqueTerms = new Set(matches.map(m => m.text.toLowerCase()))
    score += uniqueTerms.size * 15

    return score
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  async extractPageText(
    pdfBuffer: Buffer,
    pageNumber: number
  ): Promise<PageTextContent> {
    try {
      const result = await this.extractText(pdfBuffer, {
        includeWordPositions: true
      })

      const pageText = result.pages.find(p => p.pageNumber === pageNumber)
      
      if (!pageText) {
        throw new PDFProcessingError(
          `Page ${pageNumber} not found in extracted text`,
          PDF_ERROR_CODES.INVALID_PDF,
          undefined,
          pageNumber
        )
      }

      return pageText

    } catch (error) {
      if (error instanceof PDFProcessingError) {
        throw error
      }

      throw new PDFProcessingError(
        `Failed to extract text from page ${pageNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        PDF_ERROR_CODES.TEXT_EXTRACTION_FAILED,
        undefined,
        pageNumber
      )
    }
  }

  async getTextStatistics(documentId: string): Promise<{
    totalPages: number
    totalCharacters: number
    totalWords: number
    averageWordsPerPage: number
    topWords: Array<{ word: string; count: number }>
  }> {
    try {
      const textData = await pdfDbService.getDocumentTextContent(documentId)
      
      let totalCharacters = 0
      let totalWords = 0
      const wordCounts = new Map<string, number>()

      for (const pageData of textData) {
        totalCharacters += pageData.searchableText.length
        
        const words = pageData.searchableText.split(/\s+/).filter((w: string) => w.length > 2)
        totalWords += words.length

        // Count word frequencies
        for (const word of words) {
          wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
        }
      }

      // Get top 10 most frequent words
      const topWords = Array.from(wordCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word, count]) => ({ word, count }))

      return {
        totalPages: textData.length,
        totalCharacters,
        totalWords,
        averageWordsPerPage: textData.length > 0 ? Math.round(totalWords / textData.length) : 0,
        topWords
      }

    } catch (error) {
      throw new PDFProcessingError(
        `Failed to get text statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        PDF_ERROR_CODES.TEXT_EXTRACTION_FAILED
      )
    }
  }

  // Utility method to validate if text extraction is possible
  async canExtractText(pdfBuffer: Buffer): Promise<{
    canExtract: boolean
    reason?: string
    confidence: number
  }> {
    try {
      // Try a quick extraction test
      const testResult = await pdfParse(pdfBuffer, { max: 1 })
      
      if (!testResult.text || testResult.text.trim().length === 0) {
        return {
          canExtract: false,
          reason: 'No extractable text found - document may be image-based',
          confidence: 0.1
        }
      }

      // Check if text seems meaningful (not just random characters)
      const meaningfulTextRatio = this.calculateMeaningfulTextRatio(testResult.text)
      
      if (meaningfulTextRatio < 0.3) {
        return {
          canExtract: true,
          reason: 'Text extraction possible but quality may be low',
          confidence: meaningfulTextRatio
        }
      }

      return {
        canExtract: true,
        confidence: meaningfulTextRatio
      }

    } catch (error) {
      return {
        canExtract: false,
        reason: `Text extraction test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0
      }
    }
  }

  private calculateMeaningfulTextRatio(text: string): number {
    const totalChars = text.length
    if (totalChars === 0) return 0

    // Count letters, numbers, and common punctuation
    const meaningfulChars = (text.match(/[a-zA-Z0-9\s.,!?;:'"()-]/g) || []).length
    
    return meaningfulChars / totalChars
  }
}

export const textExtractor = new TextExtractor()