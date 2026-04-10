import { KnowledgeNote } from "../lib/council/types";

export const SEED_NOTES: KnowledgeNote[] = [
  {
    id: "note-1",
    title: "The Rise of Agentic Workflows",
    category: "AI Strategy",
    sourceType: "Research Paper",
    tags: ["Agents", "Workflows", "Automation"],
    content: `
Agentic workflows represent a shift from single-prompt LLM usage to iterative, multi-step processes where models use tools, reflect on their work, and collaborate.
Key components:
1. Reflection: The agent reviews its own output.
2. Tool Use: The agent interacts with external APIs.
3. Planning: The agent breaks down complex tasks.
4. Multi-agent Collaboration: Different agents specialize and work together.
    `,
    citation: "Andrew Ng, 2024",
  },
  {
    id: "note-2",
    title: "Sacred Tech Aesthetics",
    category: "Design",
    sourceType: "Internal Memo",
    tags: ["Aesthetics", "Philosophy", "UI"],
    content: `
Sacred Tech is a design philosophy that combines high-technology with ancient, ritualistic, or spiritual aesthetics.
It avoids the "coldness" of minimalism and the "chaos" of cyberpunk.
Key visual markers:
- Deep, atmospheric lighting.
- Natural materials (stone, wood) represented in digital textures.
- Symbolic geometry.
- Calm, intentional motion.
    `,
  },
  {
    id: "note-3",
    title: "Memory Layers in LLMs",
    category: "Technical",
    sourceType: "Technical Blog",
    tags: ["Memory", "RAG", "Context"],
    content: `
Effective AI memory is not just a long context window. It requires layering:
- Semantic Memory: Vector-based retrieval of relevant facts.
- Episodic Memory: Recalling specific past interactions.
- Procedural Memory: Learning how the user prefers things to be done.
- Working Memory: The immediate context of the current conversation.
    `,
  },
];
