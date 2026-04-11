/**
 * Web search utility for the Council Chamber.
 * Provides real-time information retrieval to augment agent responses.
 */

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  answer?: string;
  searchedAt: number;
}

const SEARCH_CACHE = new Map<string, SearchResponse>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Perform a web search via the backend API.
 * Results are cached briefly to avoid redundant searches.
 */
export async function performSearch(query: string): Promise<SearchResponse | null> {
  const cacheKey = query.toLowerCase().trim();
  const cached = SEARCH_CACHE.get(cacheKey);
  
  if (cached && Date.now() - cached.searchedAt < CACHE_TTL) {
    console.log(`[Search] Using cached results for: ${query}`);
    return cached;
  }

  try {
    const apiUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? "http://localhost:3000/api/council/search"
      : "/api/council/search";
      
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      if (response.status === 501) {
        console.warn("[Search] Search API not configured");
        return null;
      }
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();
    
    const result: SearchResponse = {
      query,
      results: data.results || [],
      answer: data.answer,
      searchedAt: Date.now(),
    };

    // Cache the result
    SEARCH_CACHE.set(cacheKey, result);
    
    // Limit cache size
    if (SEARCH_CACHE.size > 50) {
      const oldestKey = SEARCH_CACHE.keys().next().value;
      SEARCH_CACHE.delete(oldestKey);
    }

    return result;
  } catch (error) {
    console.error("[Search] Error performing search:", error);
    return null;
  }
}

/**
 * Format search results into a context string for the LLM.
 */
export function formatSearchContext(search: SearchResponse | null): string {
  if (!search || search.results.length === 0) {
    return "";
  }

  let context = `\n--- WEB SEARCH RESULTS FOR "${search.query}" ---\n`;
  
  if (search.answer) {
    context += `Quick Answer: ${search.answer}\n\n`;
  }
  
  context += search.results
    .slice(0, 3)
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.content}\nSource: ${r.url}`)
    .join("\n\n");
  
  context += "\n--- END SEARCH RESULTS ---\n";
  
  return context;
}

/**
 * Determine if a query would benefit from web search.
 * Looks for time-sensitive or factual queries.
 */
export function shouldSearch(query: string): boolean {
  const searchIndicators = [
    // Time-sensitive
    "latest", "recent", "news", "today", "this week", "this month", "2024", "2025", "2026",
    // Factual lookups
    "who is", "what is", "when did", "where is", "how many", "how much",
    "statistics", "data", "study", "research", "paper", "report",
    // Current events
    "election", "war", "crisis", "market", "price", "stock", "crypto",
    // Specific lookups
    "weather", "definition", "meaning of", "translate",
  ];
  
  const lowerQuery = query.toLowerCase();
  return searchIndicators.some(indicator => lowerQuery.includes(indicator));
}

/**
 * Extract potential search queries from a conversation context.
 */
export function extractSearchQueries(context: string): string[] {
  const queries: string[] = [];
  
  // Look for questions in the text
  const questionMatches = context.match(/(?:what|who|when|where|why|how)[^?.!]*\??/gi);
  if (questionMatches) {
    queries.push(...questionMatches.slice(-2)); // Last 2 questions
  }
  
  // Look for statements about needing information
  const infoMatches = context.match(/(?:looking for|searching for|need to know|find out|research)[^.,!]*/gi);
  if (infoMatches) {
    queries.push(...infoMatches);
  }
  
  return queries.filter(q => q.length > 10).slice(0, 2);
}
