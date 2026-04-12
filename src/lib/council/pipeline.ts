import { OrishaName, InteractionMode, Post, KnowledgeNote, DEFAULT_MODEL, RoundPhase } from "./types";
import { MEMBER_CONSTITUTIONS, SHARED_CONSTITUTION } from "./constitutions";
import { COUNCIL_MEMBERS } from "./members";
import { performSearch, formatSearchContext, shouldSearch as detectSearch } from "../search";
import { loadRelevantSkills } from "./skills";

// ─── Types ───────────────────────────────────────────────────────────────────

/** Everything needed to generate a single response from an Orisha. */
export interface PipelineInput {
  memberId: OrishaName;
  mode: InteractionMode;
  userMessage?: string;
  recentPosts: Post[];
  selectedNote?: KnowledgeNote;
  threadId?: string;
  roundPhase?: RoundPhase;
  /** Free-form directive appended to the system prompt (debate, async, reply) */
  directive?: string;
  /** Base temperature. Clamped to [0, 1.2]. */
  temperature?: number;
  /** Temperature bonus for async/reply variety */
  temperatureBoost?: number;
  /** Force web search even if not auto-detected */
  forceSearch?: boolean;
}

/** Fully assembled context ready for the LLM call. */
interface AssembledContext {
  systemInstruction: string;
  prompt: string;
  temperature: number;
}

/** Raw LLM response before post-processing. */
interface RawLLMResponse {
  content: string;
  success: boolean;
  error?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Posts beyond this count trigger compression of older messages. */
const COMPRESSION_THRESHOLD = 10;
/** How many of the oldest posts to compress into a summary. */
const COMPRESSION_BATCH = 5;

// ─── Stage 1: Assemble Context ──────────────────────────────────────────────

/**
 * Compress older posts into a summary when the list exceeds the threshold.
 * The newest posts are kept verbatim; the oldest are collapsed into a
 * one-paragraph summary that preserves the key themes.
 *
 * Returns a `{ summary, recentVerbatim }` tuple.
 */
function compressPosts(posts: Post[]): { summary: string; recentVerbatim: Post[] } {
  if (posts.length <= COMPRESSION_THRESHOLD) {
    return { summary: "", recentVerbatim: posts };
  }

  const olderPosts = posts.slice(0, COMPRESSION_BATCH);
  const recentVerbatim = posts.slice(COMPRESSION_BATCH);

  // Build a lightweight summary of the older posts
  const speakers = [...new Set(olderPosts.map((p) => p.authorName))];
  const topics = olderPosts
    .map((p) => {
      // Take the first meaningful sentence from each post
      const firstSentence = p.content
        .split(/[.!?\n]/)
        .map((s) => s.trim())
        .find((s) => s.length > 15);
      return firstSentence ? `• ${p.authorName}: "${firstSentence}"` : null;
    })
    .filter(Boolean)
    .join("\n");

  const summary = `--- Earlier Discussion Summary (${olderPosts.length} posts compressed) ---
Participants: ${speakers.join(", ")}
Key points discussed:
${topics}
--- End Summary ---`;

  return { summary, recentVerbatim };
}

/**
 * Build the complete context for the LLM call.
 * This is Stage 1 of the pipeline: assembleContext.
 */
export function assembleContext(input: PipelineInput): AssembledContext & { searchNeeded: boolean; searchQuery?: string } {
  const member = COUNCIL_MEMBERS[input.memberId];
  const constitution = MEMBER_CONSTITUTIONS[input.memberId];
  const temperature = Math.max(0, Math.min(1.2,
    (input.temperature ?? 0.7) + (input.temperatureBoost ?? 0)
  ));

  // Compress posts if over threshold
  const { summary: compressionSummary, recentVerbatim } = compressPosts(input.recentPosts);

  // Build the recent discussion block
  const recentBlock = recentVerbatim.length > 0
    ? recentVerbatim.map((p) => `${p.authorName}: ${p.content}`).join("\n")
    : "The council feed is quiet. You are the first voice in a while.";

  // Load domain-specific skills based on topic
  const topicText = [
    input.userMessage || "",
    ...input.recentPosts.slice(-3).map((p) => p.content),
  ].join(" ");
  const skillsBlock = loadRelevantSkills(input.memberId, topicText);

  // Phase/debate directive block
  const directiveBlock = input.directive
    ? `\n--- DIRECTIVE ---\n${input.directive}\n--- END DIRECTIVE ---\n`
    : "";

  // Knowledge note block
  const noteBlock = input.selectedNote
    ? `Reference this Knowledge Note: ${input.selectedNote.title}\nContent: ${input.selectedNote.content}`
    : "";

  // Detect if web search is needed
  const searchNeeded = !!(input.userMessage && (input.forceSearch || detectSearch(input.userMessage)));

  // Assemble the system instruction
  const systemInstruction = `
${SHARED_CONSTITUTION}
${constitution}
${skillsBlock}
Current Mode: ${input.mode}
${directiveBlock}
${noteBlock}

${compressionSummary}

Recent Council Discussion:
${recentBlock}

${input.mode === "debate" && !input.directive ? "You are encouraged to respectfully challenge or build upon the ideas of other council members." : ""}
${input.mode === "roundup" ? "Focus on synthesizing the main points and identifying next steps." : ""}
`.trim();

  const prompt = input.userMessage
    ? `The user says: "${input.userMessage}"\nRespond as ${member.name}.`
    : `Continue the council discussion as ${member.name}.`;

  return {
    systemInstruction,
    prompt,
    temperature,
    searchNeeded,
    searchQuery: searchNeeded ? input.userMessage : undefined,
  };
}

// ─── Stage 2: Call LLM ──────────────────────────────────────────────────────

/**
 * Resolve the API endpoint based on the current environment.
 */
function getApiUrl(): string {
  return typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:3000/api/council/generate"
    : "/api/generate";
}

/**
 * Fetch with automatic retry on transient errors (429, 5xx, network).
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 2
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || attempt === maxRetries) return response;

      const retryable = [429, 500, 502, 503, 504];
      if (!retryable.includes(response.status)) return response;

      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
      console.warn(
        `[Council] Retrying (${attempt + 1}/${maxRetries}) after ${response.status}`
      );
      await new Promise((r) => setTimeout(r, delay));
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
      console.warn(
        `[Council] Retrying (${attempt + 1}/${maxRetries}) after network error`
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("fetchWithRetry: exhausted retries");
}

/**
 * Call the LLM via the API endpoint.
 * This is Stage 2 of the pipeline: callLLM.
 */
export async function callLLM(
  ctx: AssembledContext,
  searchContext?: string
): Promise<RawLLMResponse> {
  // Inject search results into system instruction if available
  const finalSystem = searchContext
    ? `${ctx.systemInstruction}\n\n${searchContext}`
    : ctx.systemInstruction;

  const finalPrompt = searchContext
    ? `${ctx.prompt}\n\nUse the web search results provided above to inform your response if relevant.`
    : ctx.prompt;

  try {
    const apiUrl = getApiUrl();
    const response = await fetchWithRetry(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: finalSystem },
          { role: "user", content: finalPrompt },
        ],
        temperature: ctx.temperature,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        content: "",
        success: false,
        error: data.error?.message || `Server API error (status ${response.status})`,
      };
    }

    return {
      content: data.choices[0].message.content || "...",
      success: true,
    };
  } catch (error: any) {
    return {
      content: "",
      success: false,
      error: error?.message || "Network error",
    };
  }
}

// ─── Stage 3: Post-Process ──────────────────────────────────────────────────

/**
 * Build the final Post object from raw LLM output.
 * This is Stage 3 of the pipeline: postProcess.
 */
export function postProcess(
  memberId: OrishaName,
  raw: RawLLMResponse,
  overrides: Partial<Post> = {}
): Partial<Post> {
  const member = COUNCIL_MEMBERS[memberId];

  if (!raw.success) {
    console.error(`[Council] Pipeline failed for ${memberId}:`, raw.error);
  }

  const base: Partial<Post> = {
    authorId: memberId,
    authorName: member.name,
    content: raw.success
      ? raw.content
      : overrides.type === "async"
        ? "(The chamber is too quiet to speak into.)"
        : overrides.parentId
          ? "(I wanted to answer, but the line went quiet.)"
          : "The connection to the chamber is flickering. I cannot speak right now.",
    timestamp: Date.now(),
  };

  return { ...base, ...overrides };
}

/**
 * Extract a title from the first meaningful line (for async posts).
 */
export function extractTitle(content: string): string {
  const firstLine = content.split("\n").find((l) => l.trim().length > 0) || "";
  return firstLine.replace(/^#+\s*/, "").slice(0, 80);
}

// ─── Full Pipeline Runner ───────────────────────────────────────────────────

/**
 * Run the full pipeline: assembleContext → (optionally search) → callLLM → postProcess.
 *
 * This is the single entry point that replaces the direct fetch + try/catch
 * pattern that was duplicated across the three generator functions.
 */
export async function runPipeline(
  input: PipelineInput,
  postOverrides: Partial<Post> = {}
): Promise<Partial<Post>> {
  // Stage 1: Assemble context
  const ctx = assembleContext(input);

  // Search (if needed)
  let searchContext = "";
  if (ctx.searchNeeded && ctx.searchQuery) {
    const searchResults = await performSearch(ctx.searchQuery);
    searchContext = formatSearchContext(searchResults);
  }

  // Stage 2: Call LLM
  const raw = await callLLM(ctx, searchContext || undefined);

  // Stage 3: Post-process
  return postProcess(input.memberId, raw, postOverrides);
}
