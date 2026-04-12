import { OrishaName, InteractionMode, Post, PostType, KnowledgeNote, RoundPhase } from "./types";
import { COUNCIL_MEMBERS } from "./members";
import { runPipeline, extractTitle } from "./pipeline";

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

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Generate a council response from an Orisha using the structured pipeline.
 * Handles user-prompted messages, debate responses, and council rounds.
 */
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
    temperature?: number;
    forceSearch?: boolean;
  }
): Promise<Partial<Post>> {
  // Build the directive from phase or debate or mode
  let directive = "";
  if (context.roundPhase) {
    directive = `--- COUNCIL ROUND DIRECTIVE ---\n${PHASE_DIRECTIVES[context.roundPhase]}\n--- END DIRECTIVE ---`;
  }
  if (context.debateDirective) {
    directive += `\n--- DEBATE DIRECTIVE ---\n${context.debateDirective}\n--- END DIRECTIVE ---`;
  }

  return runPipeline(
    {
      memberId,
      mode,
      userMessage: context.userMessage,
      recentPosts: context.recentPosts,
      selectedNote: context.selectedNote,
      threadId: context.threadId,
      roundPhase: context.roundPhase,
      directive: directive || undefined,
      temperature: context.temperature,
      forceSearch: context.forceSearch,
    },
    {
      threadId: context.threadId,
    }
  );
}

/**
 * Generate an unprompted ("heartbeat") post from an Orisha.
 * Unlike generateCouncilResponse, there is no user message — the member
 * speaks to the feed on their own initiative, shaped by recent context
 * and the chosen flavor directive.
 */
export async function generateAsyncPost(
  memberId: OrishaName,
  options: {
    flavor?: AsyncPostFlavor;
    recentPosts: Post[];
    temperature?: number;
  }
): Promise<Partial<Post>> {
  const flavor: AsyncPostFlavor = options.flavor ?? pickAsyncFlavor();
  const member = COUNCIL_MEMBERS[memberId];

  const directive = `--- HEARTBEAT DIRECTIVE (${flavor}) ---\n${ASYNC_DIRECTIVES[flavor]}\n--- END DIRECTIVE ---`;

  const result = await runPipeline(
    {
      memberId,
      mode: "quiet" as InteractionMode,
      recentPosts: options.recentPosts,
      directive,
      temperature: options.temperature,
      temperatureBoost: 0.15,
    },
    {
      type: "async" as PostType,
      tags: [flavor],
    }
  );

  // Extract title from first line for async post cards
  if (result.content && result.content !== "(The chamber is too quiet to speak into.)") {
    result.title = extractTitle(result.content);
  }

  return result;
}

/**
 * Generate a reply from one Orisha to another Orisha's post.
 * Sets parentId + threadId so the reply threads under the target
 * in the Archive view.
 */
export async function generateAgentReply(
  replierId: OrishaName,
  targetPost: Post,
  options: {
    stance?: AgentReplyStance;
    recentPosts: Post[];
    temperature?: number;
  }
): Promise<Partial<Post>> {
  const stance: AgentReplyStance = options.stance ?? pickStance();
  const replier = COUNCIL_MEMBERS[replierId];
  const targetAuthor = COUNCIL_MEMBERS[targetPost.authorId as OrishaName];
  const targetAuthorName = targetAuthor?.name ?? targetPost.authorName;
  const threadId = targetPost.threadId || targetPost.id;

  const directive = `--- REPLY DIRECTIVE (${stance}) ---
${STANCE_DIRECTIVES[stance]}
--- END DIRECTIVE ---

You are responding to ${targetAuthorName}. Address them by name when it feels natural.
Do NOT open with "${replier.name}:" — the feed already shows who you are.

${targetAuthorName} just posted to the council feed:

"${targetPost.content}"

Reply to ${targetAuthorName} as ${replier.name}.`;

  return runPipeline(
    {
      memberId: replierId,
      mode: "debate" as InteractionMode,
      recentPosts: options.recentPosts,
      directive,
      temperature: options.temperature,
      temperatureBoost: 0.1,
    },
    {
      type: "response" as PostType,
      parentId: targetPost.id,
      threadId,
      tags: [stance],
    }
  );
}
