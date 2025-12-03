import { exa_web_search_exa } from '../tools/exa-mcp';

interface SearchResult {
  title: string;
  url: string;
  content: string;
  publishedDate?: string;
}

interface WebSearchConfig {
  maxResults: number;
  searchType: 'auto' | 'fast' | 'deep';
  livecrawl: 'fallback' | 'preferred';
  cacheEnabled: boolean;
  cacheTTL: number; // minutes
}

interface CacheEntry {
  results: SearchResult[];
  timestamp: number;
}

export class WebSearchService {
  private config: WebSearchConfig;
  private cache: Map<string, CacheEntry> = new Map();

  constructor(config: Partial<WebSearchConfig> = {}) {
    this.config = {
      maxResults: 5,
      searchType: 'auto',
      livecrawl: 'fallback',
      cacheEnabled: true,
      cacheTTL: 30, // 30 minutes
      ...config
    };
  }

  async search(query: string): Promise<SearchResult[]> {
    // Check cache first
    if (this.config.cacheEnabled) {
      const cached = this.getCachedResults(query);
      if (cached) {
        console.log('Using cached search results for:', query);
        return cached;
      }
    }

    try {
      console.log('Performing web search for:', query);

      // Use Exa MCP web search tool
      const searchResponse = await exa_web_search_exa({
        query,
        numResults: this.config.maxResults,
        type: this.config.searchType,
        livecrawl: this.config.livecrawl,
        contextMaxCharacters: 2000 // Limit content length
      });

      // Format results
      const results: SearchResult[] = searchResponse.results?.map(result => ({
        title: result.title || 'Untitled',
        url: result.url || '',
        content: result.content || result.text || '',
        publishedDate: result.publishedDate
      })) || [];

      // Cache results
      if (this.config.cacheEnabled) {
        this.setCachedResults(query, results);
      }

      console.log(`Found ${results.length} search results`);
      return results;

    } catch (error) {
      console.error('Web search failed:', error);
      // Return empty results on failure to allow conversation to continue
      return [];
    }
  }

  formatResultsForAI(results: SearchResult[]): string {
    if (results.length === 0) {
      return 'No relevant web search results found.';
    }

    const formatted = results.map((result, index) =>
      `${index + 1}. **${result.title}**\n   URL: ${result.url}\n   ${result.content.slice(0, 500)}${result.content.length > 500 ? '...' : ''}`
    ).join('\n\n');

    return `Web Search Results:\n\n${formatted}\n\n`;
  }

  private getCacheKey(query: string): string {
    // Normalize query for consistent caching
    return query.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  private getCachedResults(query: string): SearchResult[] | null {
    const key = this.getCacheKey(query);
    const entry = this.cache.get(key);

    if (!entry) return null;

    const now = Date.now();
    const ttlMs = this.config.cacheTTL * 60 * 1000;

    if (now - entry.timestamp > ttlMs) {
      this.cache.delete(key);
      return null;
    }

    return entry.results;
  }

  private setCachedResults(query: string, results: SearchResult[]): void {
    const key = this.getCacheKey(query);
    this.cache.set(key, {
      results,
      timestamp: Date.now()
    });

    // Clean up old entries if cache gets too large
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}