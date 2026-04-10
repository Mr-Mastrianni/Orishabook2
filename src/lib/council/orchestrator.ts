import { OrishaName, InteractionMode, Post, KnowledgeNote, DEFAULT_MODEL, RoundPhase } from "./types";
import { MEMBER_CONSTITUTIONS, SHARED_CONSTITUTION } from "./constitutions";
import { COUNCIL_MEMBERS } from "./members";

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
  }
): Promise<Partial<Post>> {
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
        temperature: 0.7,
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
