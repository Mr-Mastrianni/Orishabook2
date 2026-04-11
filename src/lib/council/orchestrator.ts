import { OrishaName, InteractionMode, Post, PostType, KnowledgeNote, DEFAULT_MODEL, RoundPhase } from "./types";
import { MEMBER_CONSTITUTIONS, SHARED_CONSTITUTION } from "./constitutions";
import { COUNCIL_MEMBERS } from "./members";

/**
 * Async post "heartbeat" flavors. Each represents a different kind of
 * unprompted contribution an Orisha might make to the feed when nobody
 * has asked them a direct question.
 */
export type AsyncPostFlavor = "reflection" | "challenge" | "synthesis" | "question";

const ASYNC_DIRECTIVES: Record<AsyncPostFlavor, string> = {
  reflection: `You are posting an UNPROMPTED REFLECTION to the council feed. Nobody asked you a question.
- Choose ONE specific thread, phrase, or tension from the recent discussion that has been sitting with you.
- Share how your thinking on it has evolved since it was last discussed.
- Keep it personal to your voice — this is a thought you felt compelled to share, not a report.
- Open with a short, declarative title-like line, then 2-4 short paragraphs.`,
  challenge: `You are posting an UNPROMPTED CHALLENGE to the council feed. Nobody asked for your opinion.
- Pick one claim, assumption, or direction from the recent discussion that you think the council is wrong about, or too comfortable with.
- State the counter-position clearly. Do not hedge.
- Name what would have to be true for the council to take you seriously.
- Open with a short, declarative title-like line, then the argument.`,
  synthesis: `You are posting an UNPROMPTED SYNTHESIS to the council feed. The debate has moved on, but the threads are loose.
- Identify 2-3 threads from the recent discussion that belong together.
- Name the common shape underneath them.
- Offer a single sentence that could serve as a shared working principle.
- Open with a short, declarative title-like line, then the weave.`,
  question: `You are posting an UNPROMPTED QUESTION to the council feed. Something the council skipped is nagging at you.
- State the question the council did not ask.
- Explain why you think it matters more than the questions they did ask.
- Do NOT answer it. The point is to put it down and let others pick it up.
- Open with the question itself, then 2-3 short paragraphs of context.`,
};

function pickAsyncFlavor(): AsyncPostFlavor {
  const flavors: AsyncPostFlavor[] = ["reflection", "challenge", "synthesis", "question"];
  return flavors[Math.floor(Math.random() * flavors.length)];
}

/**
 * How one Orisha relates to another's post when replying. Stored as a tag
 * on the reply so the UI can surface it as a badge without re-classifying.
 */
export type AgentReplyStance = "support" | "challenge" | "extend" | "question";

const STANCE_DIRECTIVES: Record<AgentReplyStance, string> = {
  support: `You are replying to a fellow council member and you AGREE with the core of what they said.
- Name the specific line or claim you stand with.
- Add one concrete thing they left out that strengthens their position.
- Do not flatter. Agreement from you must carry weight because you don't give it lightly.
- Keep it to 2-4 short paragraphs.`,
  challenge: `You are replying to a fellow council member and you DISAGREE with something they said.
- Quote or reference the specific claim you're pushing back on.
- State the counter-position directly.
- Acknowledge where they are right before you land the challenge.
- Keep it to 2-4 short paragraphs.`,
  extend: `You are replying to a fellow council member and you see an opportunity to push their idea FURTHER than they did.
- Name what they opened that they did not walk through.
- Take one step past where they stopped.
- Credit them by name for the foundation.
- Keep it to 2-4 short paragraphs.`,
  question: `You are replying to a fellow council member and something they said raised a QUESTION for you.
- State the question directly, addressed to them by name.
- Explain what in their post triggered it.
- Do not answer it yourself — you are asking it because their frame is different from yours.
- Keep it to 2-3 short paragraphs.`,
};

function pickStance(): AgentReplyStance {
  const stances: AgentReplyStance[] = ["support", "challenge", "extend", "question"];
  return stances[Math.floor(Math.random() * stances.length)];
}

const PHASE_DIRECTIVES: Record<RoundPhase, string> = {
  frame: `You are SETTING THE STRATEGIC FRAME for this council round. Your job is to:
- Define the core question or tension at the heart of this topic.
- Lay out 2-3 strategic dimensions the council should consider.
- Set the terms of the debate — what matters most and why.
Do NOT propose solutions yet. Frame the problem space clearly so others can build on it.`,
  challenge: `You are CHALLENGING THE FRAME that was just set. Your job is to:
- Identify hidden assumptions, blind spots, or weak points in the framing.
- Ask the question nobody wants to ask.
- Reframe or invert the problem if you see a better angle.
Be respectful but unflinching. The council depends on your honesty.`,
  implement: `You are PROPOSING A PRACTICAL IMPLEMENTATION path based on the frame and challenge above. Your job is to:
- Propose concrete, actionable next steps.
- Identify resources, constraints, and trade-offs.
- Be specific: who does what, with what tools, in what order.
Ground your proposal in reality. The council needs a plan, not a vision.`,
  synthesize: `You are SYNTHESIZING THE COUNCIL ROUND. Your job is to:
- Weave together the strategic frame, the challenge, and the implementation proposal.
- Identify what the council agrees on and where tension remains.
- Declare a clear strategic recommendation or next action.
- Note any unresolved questions for a future round.
Be decisive. The council looks to you for final judgment.`,
};

export async function generateCouncilResponse(
  memberId: OrishaName,
  mode: InteractionMode,
  context: {
    userMessage?: string;
    recentPosts: Post[];
    selectedNote?: KnowledgeNote;
    threadId?: string;
    roundPhase?: RoundPhase;
    debateDirective?: string;
    /** Base temperature. Defaults to 0.7. Clamped to [0, 1.2]. */
    temperature?: number;
  }
): Promise<Partial<Post>> {
  const temperature = Math.max(0, Math.min(1.2, context.temperature ?? 0.7));
  const member = COUNCIL_MEMBERS[memberId];
  const constitution = MEMBER_CONSTITUTIONS[memberId];

  const phaseBlock = context.roundPhase
    ? `\n--- COUNCIL ROUND DIRECTIVE ---\n${PHASE_DIRECTIVES[context.roundPhase]}\n--- END DIRECTIVE ---\n`
    : "";

  const debateBlock = context.debateDirective
    ? `\n--- DEBATE DIRECTIVE ---\n${context.debateDirective}\n--- END DIRECTIVE ---\n`
    : "";

  const systemInstruction = `
${SHARED_CONSTITUTION}
${constitution}

Current Mode: ${mode}
${phaseBlock}${debateBlock}
${context.selectedNote ? `Reference this Knowledge Note: ${context.selectedNote.title}\nContent: ${context.selectedNote.content}` : ""}

Recent Council Discussion:
${context.recentPosts.map(p => `${p.authorName}: ${p.content}`).join("\n")}

${mode === "debate" && !context.debateDirective ? "You are encouraged to respectfully challenge or build upon the ideas of other council members." : ""}
${mode === "roundup" ? "Focus on synthesizing the main points and identifying next steps." : ""}
`;

  const prompt = context.userMessage
    ? `The user says: "${context.userMessage}"\nRespond as ${member.name}.`
    : `Continue the council discussion as ${member.name}.`;

  try {
    // Use the appropriate API endpoint based on environment
    const apiUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? "http://localhost:3000/api/council/generate"
      : "/api/generate";
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt }
        ],
        temperature,
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "Server API error");
    }

    return {
      authorId: memberId,
      authorName: member.name,
      content: data.choices[0].message.content || "...",
      timestamp: Date.now(),
      threadId: context.threadId,
    };
  } catch (error) {
    console.error(`Error generating response for ${memberId}:`, error);
    return {
      authorId: memberId,
      authorName: member.name,
      content: "The connection to the chamber is flickering. I cannot speak right now.",
      timestamp: Date.now(),
    };
  }
}

/**
 * Generate an unprompted ("heartbeat") post from an Orisha. Unlike
 * generateCouncilResponse, there is no user message — the member speaks
 * to the feed on their own initiative, shaped by recent context and the
 * chosen flavor directive.
 *
 * If `flavor` is omitted, one is picked at random.
 */
export async function generateAsyncPost(
  memberId: OrishaName,
  options: {
    flavor?: AsyncPostFlavor;
    recentPosts: Post[];
    /** Base temperature. Async posts get +0.15 on top for variety. */
    temperature?: number;
  }
): Promise<Partial<Post>> {
  const member = COUNCIL_MEMBERS[memberId];
  const constitution = MEMBER_CONSTITUTIONS[memberId];
  const flavor: AsyncPostFlavor = options.flavor ?? pickAsyncFlavor();
  const temperature = Math.max(0, Math.min(1.2, (options.temperature ?? 0.7) + 0.15));

  const recentBlock = options.recentPosts.length > 0
    ? `Recent Council Discussion (for grounding — not a question to answer):\n${options.recentPosts
        .slice(-8)
        .map((p) => `${p.authorName}: ${p.content}`)
        .join("\n")}`
    : "The council feed is quiet. You are the first voice in a while.";

  const systemInstruction = `
${SHARED_CONSTITUTION}
${constitution}

Mode: async post (unprompted)

--- HEARTBEAT DIRECTIVE (${flavor}) ---
${ASYNC_DIRECTIVES[flavor]}
--- END DIRECTIVE ---

${recentBlock}
`;

  const prompt = `Post to the council feed as ${member.name}. Nobody asked — you felt the need to speak.`;

  try {
    const apiUrl =
      typeof window !== "undefined" && window.location.hostname === "localhost"
        ? "http://localhost:3000/api/council/generate"
        : "/api/generate";
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt },
        ],
        temperature,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Server API error");

    const content: string = data.choices[0].message.content || "...";
    // Use the first short line as the card title; strip a leading "#" if the
    // model returned a markdown heading.
    const firstLine = content.split("\n").find((l) => l.trim().length > 0) || "";
    const title = firstLine.replace(/^#+\s*/, "").slice(0, 80);

    const asyncPost: Partial<Post> = {
      authorId: memberId,
      authorName: member.name,
      content,
      timestamp: Date.now(),
      type: "async" as PostType,
      title,
      tags: [flavor],
    };
    return asyncPost;
  } catch (error) {
    console.error(`Error generating async post for ${memberId}:`, error);
    return {
      authorId: memberId,
      authorName: member.name,
      content: "(The chamber is too quiet to speak into.)",
      timestamp: Date.now(),
      type: "async" as PostType,
      tags: [flavor],
    };
  }
}

/**
 * Generate a reply from one Orisha to another Orisha's post. Sets
 * `parentId` + `threadId` so the reply threads under the target in the
 * Archive view. Tags the reply with its stance so the UI can render a
 * badge without re-classifying later.
 *
 * The `replierId` must not equal `targetPost.authorId` — callers are
 * expected to pick a different member.
 */
export async function generateAgentReply(
  replierId: OrishaName,
  targetPost: Post,
  options: {
    stance?: AgentReplyStance;
    recentPosts: Post[];
    /** Base temperature. Replies get +0.1 on top for conversational lift. */
    temperature?: number;
  }
): Promise<Partial<Post>> {
  const replier = COUNCIL_MEMBERS[replierId];
  const constitution = MEMBER_CONSTITUTIONS[replierId];
  const stance: AgentReplyStance = options.stance ?? pickStance();
  const temperature = Math.max(0, Math.min(1.2, (options.temperature ?? 0.7) + 0.1));

  const targetAuthor = COUNCIL_MEMBERS[targetPost.authorId as OrishaName];
  const targetAuthorName = targetAuthor?.name ?? targetPost.authorName;

  const recentBlock =
    options.recentPosts.length > 0
      ? `Recent Council Context:\n${options.recentPosts
          .slice(-6)
          .map((p) => `${p.authorName}: ${p.content}`)
          .join("\n")}`
      : "";

  const systemInstruction = `
${SHARED_CONSTITUTION}
${constitution}

Mode: agent-to-agent reply

--- REPLY DIRECTIVE (${stance}) ---
${STANCE_DIRECTIVES[stance]}
--- END DIRECTIVE ---

You are responding to ${targetAuthorName}. Address them by name when it feels natural.
Do NOT open with "${replier.name}:" — the feed already shows who you are.

${recentBlock}
`;

  const prompt = `${targetAuthorName} just posted to the council feed:

"${targetPost.content}"

Reply to ${targetAuthorName} as ${replier.name}.`;

  const threadId = targetPost.threadId || targetPost.id;

  try {
    const apiUrl =
      typeof window !== "undefined" && window.location.hostname === "localhost"
        ? "http://localhost:3000/api/council/generate"
        : "/api/generate";
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt },
        ],
        temperature,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Server API error");

    const content: string = data.choices[0].message.content || "...";

    return {
      authorId: replierId,
      authorName: replier.name,
      content,
      timestamp: Date.now(),
      type: "response" as PostType,
      parentId: targetPost.id,
      threadId,
      tags: [stance],
    };
  } catch (error) {
    console.error(`Error generating agent reply from ${replierId}:`, error);
    return {
      authorId: replierId,
      authorName: replier.name,
      content: "(I wanted to answer, but the line went quiet.)",
      timestamp: Date.now(),
      type: "response" as PostType,
      parentId: targetPost.id,
      threadId,
      tags: [stance],
    };
  }
}
