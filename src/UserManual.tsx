import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, BookOpen, ChevronRight, Sparkles, Shield, Users, MessageSquare, Zap, Lightbulb, Wrench, Rocket, Brain } from "lucide-react";
import { cn } from "./lib/utils";

type Tab = "guide" | "roadmap" | "future" | "ai" | "creative";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "guide", label: "User Guide", icon: <BookOpen className="w-4 h-4" /> },
  { id: "roadmap", label: "Roadmap", icon: <Wrench className="w-4 h-4" /> },
  { id: "future", label: "Future Ideas", icon: <Rocket className="w-4 h-4" /> },
  { id: "ai", label: "AI Enhancements", icon: <Brain className="w-4 h-4" /> },
  { id: "creative", label: "Creative Vision", icon: <Lightbulb className="w-4 h-4" /> },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-sm font-display font-bold uppercase tracking-widest text-white mb-4 flex items-center gap-2">
        <ChevronRight className="w-3.5 h-3.5 text-chamber-muted" />
        {title}
      </h3>
      <div className="space-y-3 text-sm text-chamber-ink/80 leading-relaxed">{children}</div>
    </div>
  );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className={cn("text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-widest inline-block", color)}>
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: "built" | "partial" | "planned" | "idea" }) {
  const colors = {
    built: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    partial: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    planned: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    idea: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  };
  return <Badge color={colors[status]}>{status}</Badge>;
}

function RoadmapRow({ feature, status, description }: { feature: string; status: "built" | "partial" | "planned" | "idea"; description: string }) {
  return (
    <div className="flex gap-4 items-start py-3 border-b border-chamber-border/30 last:border-0">
      <div className="w-20 flex-shrink-0 pt-0.5"><StatusBadge status={status} /></div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white text-sm">{feature}</p>
        <p className="text-xs text-chamber-muted mt-1">{description}</p>
      </div>
    </div>
  );
}

function GuideContent() {
  return (
    <>
      <Section title="Welcome to the Council Chamber">
        <p>
          The Council Chamber is a sacred-tech strategy room where AI council members — each embodying a distinct
          Orisha archetype — debate, synthesize, and evolve ideas together. Think of it as a multi-agent research
          partner with personality, memory, and structure.
        </p>
        <p>
          Each council member has unique strengths, blind spots, and communication styles. Together, they form a
          balanced system of perspectives that helps you think more deeply about any topic.
        </p>
      </Section>

      <Section title="Getting Started">
        <p><strong>Authentication:</strong> Click "Enter the Chamber" to authenticate via Google. In local development mode, authentication is bypassed with a mock user.</p>
        <p><strong>The Interface:</strong> The chamber has three panels:</p>
        <ul className="list-disc ml-5 space-y-1 text-chamber-muted">
          <li><strong>Left Sidebar</strong> — Knowledge Vault: your research notes and context</li>
          <li><strong>Center</strong> — The Feed: the council's conversation history</li>
          <li><strong>Right Sidebar</strong> — The Council: activate/deactivate members</li>
        </ul>
        <p>On mobile, the sidebars collapse into slide-out drawers accessed via the menu icons.</p>
      </Section>

      <Section title="Council Members">
        <p>Seven Orisha archetypes serve as your council. Each has a distinct role:</p>
        <div className="space-y-2 mt-2">
          {[
            { name: "Orunmila", title: "The Master Witness", role: "Wisdom & Strategy — sets the big picture, synthesizes discussions", color: "text-violet-400" },
            { name: "Esu", title: "The Divine Catalyst", role: "Provocation & Reframing — challenges assumptions, plays devil's advocate", color: "text-red-400" },
            { name: "Ogun", title: "The Iron Architect", role: "Systems & Execution — proposes practical implementations", color: "text-slate-400" },
            { name: "Ochosi", title: "The Signal Hunter", role: "Research & Precision — data-driven, demands evidence", color: "text-emerald-400" },
            { name: "Oshun", title: "The Golden Resonance", role: "Relational & Aesthetic — human-centered, finds harmony", color: "text-yellow-400" },
            { name: "Yemoja", title: "The Deep Memory", role: "Continuity & Stability — protects core values, long-term focus", color: "text-blue-400" },
            { name: "Sango", title: "The Lightning Priority", role: "Decisiveness & Conviction — cuts through indecision, forces choices", color: "text-red-500" },
          ].map(m => (
            <div key={m.name} className="p-3 rounded-lg bg-chamber-bg/50 border border-chamber-border/30">
              <span className={cn("font-bold text-xs uppercase tracking-widest", m.color)}>{m.name}</span>
              <span className="text-chamber-muted text-xs ml-2">— {m.title}</span>
              <p className="text-xs text-chamber-muted/70 mt-1">{m.role}</p>
            </div>
          ))}
        </div>
        <p className="mt-3">Toggle members on/off in the right sidebar. Click a member card to activate or deactivate them.</p>
      </Section>

      <Section title="Interaction Modes">
        <p>Three modes control how the council responds. Switch modes using the toggle in the header.</p>

        <div className="p-4 rounded-lg bg-chamber-bg/50 border border-chamber-border/30 space-y-3 mt-2">
          <div>
            <p className="font-bold text-white text-xs uppercase tracking-widest">Quiet Mode</p>
            <p className="text-xs text-chamber-muted mt-1">
              The council stays silent unless directly summoned. Use <code className="bg-white/10 px-1.5 py-0.5 rounded text-[11px]">@MemberName</code> to
              call a specific member. Best for focused, one-on-one conversations.
            </p>
          </div>
          <div className="border-t border-chamber-border/20 pt-3">
            <p className="font-bold text-white text-xs uppercase tracking-widest">Debate Mode</p>
            <p className="text-xs text-chamber-muted mt-1">
              The council comes alive. When you send a message, all active members respond autonomously in a chain:
              the first states an opening position, each subsequent member directly engages with the previous speaker,
              and the last delivers a closing word. Fully autonomous — no clicks needed after your initial message.
            </p>
          </div>
          <div className="border-t border-chamber-border/20 pt-3">
            <p className="font-bold text-white text-xs uppercase tracking-widest">Roundup Mode</p>
            <p className="text-xs text-chamber-muted mt-1">
              A single active member responds to your message with a synthesis-focused answer. Use the "Roundup" button
              for Orunmila to synthesize the last 10 messages into key insights and next steps.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Council Round">
        <p>
          The <strong>Council Round</strong> button triggers a structured 4-phase deliberation on your topic:
        </p>
        <div className="space-y-2 mt-2">
          {[
            { phase: "FRAME", color: "bg-violet-500/20 text-violet-300 border-violet-500/30", desc: "Orunmila (or the best available strategist) defines the core tension and strategic dimensions." },
            { phase: "CHALLENGE", color: "bg-red-500/20 text-red-300 border-red-500/30", desc: "Esu (or the best available challenger) probes blind spots and hidden assumptions." },
            { phase: "IMPLEMENT", color: "bg-slate-500/20 text-slate-300 border-slate-500/30", desc: "Ogun (or the best available builder) proposes concrete, actionable steps." },
            { phase: "SYNTHESIZE", color: "bg-amber-500/20 text-amber-300 border-amber-500/30", desc: "The framer returns to weave everything into a final strategic recommendation." },
          ].map(p => (
            <div key={p.phase} className="flex items-start gap-3">
              <Badge color={p.color}>{p.phase}</Badge>
              <p className="text-xs text-chamber-muted flex-1">{p.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-3">The system intelligently assigns roles based on who's active, with fallbacks for each phase. Requires at least 2 active members.</p>
      </Section>

      <Section title="Knowledge Vault">
        <p>The left sidebar houses your Knowledge Vault — notes that provide context to the council.</p>
        <ul className="list-disc ml-5 space-y-1 text-chamber-muted">
          <li><strong>Select a note</strong> by clicking it — it becomes context for all council responses</li>
          <li><strong>Create notes</strong> with the + button in the vault header</li>
          <li><strong>Edit/Delete</strong> notes by hovering over a card to reveal the pencil and trash icons</li>
          <li>Notes support Title, Category, Source Type, Tags, Content, and Citation fields</li>
        </ul>
        <p>Selected notes are included in the AI prompt so council members can reference your research.</p>
      </Section>

      <Section title="Threaded Replies">
        <p>
          Hover over any post to reveal a <strong>Reply</strong> button. Clicking it sets that post as the reply target —
          you'll see a context banner above the input showing who you're replying to. Your message (and any AI responses)
          will appear indented beneath the original post, creating a visual thread.
        </p>
        <p>Click the X on the reply banner to cancel and return to top-level posting.</p>
      </Section>

      <Section title="@Mention Summons">
        <p>
          In any mode, type <code className="bg-white/10 px-1.5 py-0.5 rounded text-[11px]">@Ogun</code> (or any member name)
          in your message to directly summon that member. Only active members can be summoned. The mentioned member will
          respond regardless of the current mode.
        </p>
      </Section>

      <Section title="Model Selection">
        <p>
          Switch between AI models using the selector in the header. Available models route through OpenRouter:
        </p>
        <ul className="list-disc ml-5 space-y-1 text-chamber-muted">
          <li><strong>Gemini 2.0 Flash</strong> — Fast, capable, good all-rounder</li>
          <li><strong>DeepSeek R1</strong> — Strong reasoning capabilities</li>
          <li><strong>Llama 3.3 70B</strong> — Open-source, large context</li>
        </ul>
        <p>Additional models can be configured in the AIModel type definition.</p>
      </Section>

      <Section title="Settings & Data">
        <p>Access Chamber Settings from the button at the bottom of the right sidebar:</p>
        <ul className="list-disc ml-5 space-y-1 text-chamber-muted">
          <li><strong>Clear History</strong> — Permanently deletes all conversation history</li>
          <li><strong>Data Persistence</strong> — In production, data is stored in Firestore. In local dev, it uses localStorage</li>
        </ul>
      </Section>

      <Section title="Keyboard Shortcuts">
        <div className="space-y-1">
          {[
            { key: "Enter", desc: "Send message" },
            { key: "Shift + Enter", desc: "New line in message" },
          ].map(s => (
            <div key={s.key} className="flex items-center gap-3">
              <code className="bg-white/10 px-2 py-0.5 rounded text-[11px] font-mono w-32 text-center">{s.key}</code>
              <span className="text-xs text-chamber-muted">{s.desc}</span>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

function RoadmapContent() {
  return (
    <>
      <Section title="What's Been Built">
        <div className="border border-chamber-border/30 rounded-lg overflow-hidden">
          <RoadmapRow feature="Firebase/Firestore Persistence" status="built" description="Realtime listeners for posts, notes, and config. Dual-mode: localStorage for local dev, Firestore for production." />
          <RoadmapRow feature="Google Authentication" status="built" description="Sign in with Google via Firebase Auth. Local dev bypass with mock user." />
          <RoadmapRow feature="Knowledge Vault CRUD" status="built" description="Create, edit, delete knowledge notes. Select notes as context for AI responses." />
          <RoadmapRow feature="Member Activation" status="built" description="Toggle all 7 council members on/off from the right sidebar." />
          <RoadmapRow feature="Interaction Modes" status="built" description="Quiet, Debate, and Roundup modes with distinct behaviors." />
          <RoadmapRow feature="Structured Council Round" status="built" description="4-phase deliberation: Frame, Challenge, Implement, Synthesize with smart role assignment." />
          <RoadmapRow feature="Autonomous Debate" status="built" description="Members auto-chain responses in debate mode. Opening, response, and closing phases." />
          <RoadmapRow feature="Threaded Replies" status="built" description="Reply to specific posts with visual nesting and thread context." />
          <RoadmapRow feature="@Mention Summons" status="built" description="Summon specific active members by name in any mode." />
          <RoadmapRow feature="Model Selection" status="built" description="Switch between multiple AI models via OpenRouter." />
          <RoadmapRow feature="Identity Treatments" status="built" description="Unique accent colors, CSS patterns, and glow effects per member." />
          <RoadmapRow feature="Mobile Sidebars" status="built" description="Slide-in/out sidebars with overlay on mobile viewports." />
        </div>
      </Section>

      <Section title="What's Left to Build">
        <div className="border border-chamber-border/30 rounded-lg overflow-hidden">
          <RoadmapRow feature="Semantic Memory (RAG)" status="planned" description="Vector search using embeddings so the council automatically retrieves relevant notes based on conversation context instead of manual selection." />
          <RoadmapRow feature="Episodic Memory" status="planned" description="Summarize past conversations and store as 'Council History' so agents recall what was decided in previous sessions." />
          <RoadmapRow feature="Mobile-First Refactor" status="planned" description="Full responsive redesign — stacked layout, bottom navigation, touch-optimized interactions." />
          <RoadmapRow feature="Tool Integration" status="planned" description="Function calling via Gemini/OpenRouter to let the council search the web, save files, and interact with external APIs." />
          <RoadmapRow feature="High Contrast Mode" status="planned" description="Wire up the existing toggle in settings with an accessible high-contrast color scheme." />
          <RoadmapRow feature="Ambient Identity" status="planned" description="Subtle sounds, motion patterns, and visual effects unique to each member when they are 'thinking' or speaking." />
          <RoadmapRow feature="Bundle Optimization" status="planned" description="Code-split Firebase and other heavy dependencies. Lazy-load sidebars and modals. Target under 500KB." />
        </div>
      </Section>

      <Section title="Completion Estimate">
        <div className="p-4 rounded-lg bg-chamber-bg/50 border border-chamber-border/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-chamber-muted uppercase tracking-widest font-bold">Overall Progress</span>
            <span className="text-sm font-bold text-white">63%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-chamber-border overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500" style={{ width: "63%" }} />
          </div>
          <div className="flex justify-between mt-3 text-[10px] text-chamber-muted uppercase tracking-widest">
            <span>12 features built</span>
            <span>7 features remaining</span>
          </div>
        </div>
      </Section>
    </>
  );
}

function FutureContent() {
  return (
    <>
      <Section title="Product Enhancements">
        <div className="space-y-4">
          {[
            {
              title: "Council Presets & Templates",
              desc: "Save configurations of active members, modes, and knowledge notes as reusable presets. E.g., 'Strategy Review' activates Orunmila + Esu + Ogun; 'Creative Session' activates Oshun + Esu + Sango.",
            },
            {
              title: "Export & Share",
              desc: "Export council conversations as formatted Markdown, PDF, or shareable links. Include the council round structure, threaded context, and strategic recommendations.",
            },
            {
              title: "Council Analytics Dashboard",
              desc: "Track which members are used most, which modes generate the best outcomes, topic frequency heatmaps, and conversation depth metrics.",
            },
            {
              title: "Multi-Chamber Support",
              desc: "Create separate chambers for different projects or topics. Each chamber has its own conversation history, knowledge vault, and member configuration.",
            },
            {
              title: "Collaborative Multi-User Sessions",
              desc: "Multiple human users in the same chamber, each able to summon council members and participate in debates. Real-time presence indicators.",
            },
            {
              title: "Pinned Insights",
              desc: "Pin important council responses or synthesis outputs to a persistent 'Insights Board' that surfaces key decisions and recommendations across sessions.",
            },
            {
              title: "Conversation Branching",
              desc: "Fork a conversation at any point to explore alternative lines of thinking without losing the original thread. Visual tree view of branched discussions.",
            },
            {
              title: "Scheduled Council Rounds",
              desc: "Set up recurring council rounds that run on a schedule — daily strategic reviews, weekly synthesis sessions — with results delivered via email or notification.",
            },
          ].map(item => (
            <div key={item.title} className="p-4 rounded-lg bg-chamber-bg/50 border border-chamber-border/30">
              <p className="font-medium text-white text-sm">{item.title}</p>
              <p className="text-xs text-chamber-muted mt-2 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="UX & Design">
        <div className="space-y-4">
          {[
            {
              title: "Drag-and-Drop Knowledge",
              desc: "Drag files (PDFs, images, URLs) directly into the Knowledge Vault. Auto-parse and create structured notes with AI-generated summaries and tags.",
            },
            {
              title: "Visual Timeline View",
              desc: "Toggle between the feed view and a horizontal timeline showing the progression of council discussions, with branches and decision points highlighted.",
            },
            {
              title: "Focus Mode",
              desc: "A distraction-free view that hides sidebars and shows only the active conversation with a single selected member. For deep 1-on-1 dialogue.",
            },
            {
              title: "Theme System",
              desc: "Multiple visual themes beyond the current dark sacred-tech aesthetic. Light mode, nature mode, minimalist mode — each maintaining the spiritual gravitas.",
            },
          ].map(item => (
            <div key={item.title} className="p-4 rounded-lg bg-chamber-bg/50 border border-chamber-border/30">
              <p className="font-medium text-white text-sm">{item.title}</p>
              <p className="text-xs text-chamber-muted mt-2 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

function AIContent() {
  return (
    <>
      <Section title="Memory Architecture">
        <div className="space-y-4">
          {[
            {
              title: "Semantic Memory (RAG Pipeline)",
              desc: "Embed all knowledge notes using a model like text-embedding-3-small. Store vectors in a database (Pinecone, Supabase pgvector, or ChromaDB). When the user or council speaks, auto-retrieve the top 3-5 most relevant notes and inject them as context. The council would 'remember' everything in your vault without manual selection.",
              priority: "High",
            },
            {
              title: "Episodic Memory",
              desc: "After each council round or debate, generate a structured summary: key arguments, decisions, unresolved tensions, action items. Store these as 'episodes' with timestamps. In future sessions, the council can reference past decisions: 'In our March discussion, we agreed that...'",
              priority: "High",
            },
            {
              title: "Procedural Memory",
              desc: "Track how the user prefers to interact — which members they summon most, which modes they use, what topics recur. Adapt the council's behavior: if the user always wants Ogun's take after Esu's challenge, anticipate that. Learn the user's decision-making patterns.",
              priority: "Medium",
            },
            {
              title: "Cross-Session Context",
              desc: "Maintain a rolling 'state of the world' document that the council updates after significant discussions. This gives every session a warm start instead of a cold one. New conversations begin with awareness of ongoing projects and open questions.",
              priority: "Medium",
            },
          ].map(item => (
            <div key={item.title} className="p-4 rounded-lg bg-chamber-bg/50 border border-chamber-border/30">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-white text-sm">{item.title}</p>
                <Badge color={item.priority === "High" ? "bg-red-500/20 text-red-300 border-red-500/30" : "bg-blue-500/20 text-blue-300 border-blue-500/30"}>
                  {item.priority}
                </Badge>
              </div>
              <p className="text-xs text-chamber-muted leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Agent Intelligence">
        <div className="space-y-4">
          {[
            {
              title: "Adaptive Personalities",
              desc: "Each member's temperature, response length, and assertiveness should adapt based on the conversation state. Esu gets sharper when consensus forms too quickly. Orunmila gets more decisive when the debate has gone on too long. Ogun shortens responses when the path is clear.",
            },
            {
              title: "Inter-Agent Awareness",
              desc: "Members should track their relationships with each other across sessions. Esu and Ogun might develop a recurring tension. Oshun might consistently bridge gaps between Sango and Yemoja. These dynamics should emerge naturally from accumulated history.",
            },
            {
              title: "Confidence Scoring",
              desc: "Each council response includes a hidden confidence score. Low confidence triggers automatic follow-up questions or brings in another member for a second opinion. High confidence across all members signals strong consensus.",
            },
            {
              title: "Topic Routing",
              desc: "When the user sends a message, AI pre-analyzes the topic and auto-suggests which members are most relevant. Technical infrastructure question? Highlight Ogun and Ochosi. Ethical dilemma? Suggest Oshun and Yemoja. The user still decides, but the system makes smart recommendations.",
            },
            {
              title: "Contradiction Detection",
              desc: "Track assertions made across the conversation. If a member contradicts something they or another member said earlier, flag it. Surface these tensions as discussion points rather than letting inconsistencies slide by.",
            },
            {
              title: "Multi-Model Council",
              desc: "Assign different AI models to different members. Orunmila uses a reasoning model (DeepSeek R1) for strategic depth. Esu uses a creative model for unexpected angles. Ogun uses a fast model for practical efficiency. Each member's model matches their archetype.",
            },
          ].map(item => (
            <div key={item.title} className="p-4 rounded-lg bg-chamber-bg/50 border border-chamber-border/30">
              <p className="font-medium text-white text-sm">{item.title}</p>
              <p className="text-xs text-chamber-muted mt-2 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Tool Use & Actions">
        <div className="space-y-4">
          {[
            {
              title: "Web Search Integration",
              desc: "Council members can search the web for real-time data during discussions. Ochosi pulls in recent research. Ogun checks current pricing. The results get cited inline in their responses.",
            },
            {
              title: "Document Generation",
              desc: "After a council round, auto-generate structured outputs: project briefs, decision memos, strategy docs, action item lists. Save them as knowledge notes or export as files.",
            },
            {
              title: "Code Generation & Review",
              desc: "Ogun can generate code snippets for proposed implementations. Ochosi can review code for bugs. The council chamber becomes a full development partner for technical projects.",
            },
            {
              title: "Calendar & Task Integration",
              desc: "Connect to Google Calendar, Notion, or Linear. Council recommendations can be automatically converted into tasks with deadlines, assigned to the right context.",
            },
            {
              title: "Image & Diagram Generation",
              desc: "Council members can generate diagrams, flowcharts, or visual mockups to illustrate their points. Oshun creates aesthetic concepts. Ogun draws system architecture diagrams.",
            },
          ].map(item => (
            <div key={item.title} className="p-4 rounded-lg bg-chamber-bg/50 border border-chamber-border/30">
              <p className="font-medium text-white text-sm">{item.title}</p>
              <p className="text-xs text-chamber-muted mt-2 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

function CreativeContent() {
  return (
    <>
      <Section title="Ritual & Ceremony">
        <div className="space-y-4">
          {[
            {
              title: "Opening Invocations",
              desc: "Each council round begins with a brief invocation that sets the sacred tone. The framer doesn't just analyze — they call the council into focus with intentional language. This transforms a chat interface into a ritual space.",
            },
            {
              title: "Closing Blessings",
              desc: "After a synthesis, the council offers a closing blessing or charge — a poetic, motivational send-off that honors the work done and sets intention for action. Not corporate 'next steps' — something that resonates.",
            },
            {
              title: "Seasonal Modes",
              desc: "The chamber's visual aesthetic and the council's tone shift with the seasons or lunar cycle. During a new moon, the council is more introspective. During a full moon, more decisive. Solstice periods trigger deeper strategic reviews.",
            },
            {
              title: "Divination Mode",
              desc: "A special mode where Orunmila draws from a structured wisdom corpus (proverbs, Ifa verses, philosophical fragments) and weaves them into strategic advice. Not random fortune — contextually relevant wisdom applied to your specific question.",
            },
          ].map(item => (
            <div key={item.title} className="p-4 rounded-lg bg-chamber-bg/50 border border-chamber-border/30">
              <p className="font-medium text-white text-sm">{item.title}</p>
              <p className="text-xs text-chamber-muted mt-2 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Sensory & Atmosphere">
        <div className="space-y-4">
          {[
            {
              title: "Ambient Soundscapes",
              desc: "Each member has a subtle audio signature. Ogun's presence brings faint metalwork sounds. Yemoja brings ocean waves. Oshun brings flowing water and birdsong. The sonic environment shifts as different members become active, creating an immersive atmosphere.",
            },
            {
              title: "Dynamic Backgrounds",
              desc: "The chamber's background shifts based on the conversation state. Calm strategic discussion shows slow-moving celestial patterns. Heated debate shows dynamic energy flows. Synthesis shows converging light patterns.",
            },
            {
              title: "Member Animations",
              desc: "Each member has signature motion patterns. Esu's avatar subtly shifts and morphs. Ogun's is solid and grounded with slow rotations. Sango's pulses with energy. These create a sense of living presence.",
            },
            {
              title: "Typing Rituals",
              desc: "When a member is generating a response, show a unique 'thinking' animation instead of generic dots. Orunmila's shows rotating geometric patterns. Esu's shows flickering symbols. Ogun's shows blueprint lines being drawn.",
            },
          ].map(item => (
            <div key={item.title} className="p-4 rounded-lg bg-chamber-bg/50 border border-chamber-border/30">
              <p className="font-medium text-white text-sm">{item.title}</p>
              <p className="text-xs text-chamber-muted mt-2 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Narrative & World-Building">
        <div className="space-y-4">
          {[
            {
              title: "Council Lore System",
              desc: "Build an in-app lore compendium that explains each Orisha's mythology, their relationships, and how those translate to AI behavior. Users learn the culture as they use the tool. Knowledge becomes a bridge, not an appropriation.",
            },
            {
              title: "Achievement & Mastery System",
              desc: "Track milestones: first council round, first debate, first synthesis saved, 10 rounds completed. Not gamification — mastery markers. 'You have completed your first full council cycle. The chamber recognizes your discernment.'",
            },
            {
              title: "Council Journal",
              desc: "An auto-generated narrative log of your journey with the council. Not raw transcripts — a curated story of your strategic evolution, key decisions, and how the council has shaped your thinking over time.",
            },
            {
              title: "Guest Archetypes",
              desc: "Introduce temporary 'guest' council members based on specific domains — a Scientist archetype for research topics, an Artist for creative projects, a Healer for wellbeing discussions. They bring new perspectives without replacing the core council.",
            },
          ].map(item => (
            <div key={item.title} className="p-4 rounded-lg bg-chamber-bg/50 border border-chamber-border/30">
              <p className="font-medium text-white text-sm">{item.title}</p>
              <p className="text-xs text-chamber-muted mt-2 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

const TAB_CONTENT: Record<Tab, () => React.JSX.Element> = {
  guide: GuideContent,
  roadmap: RoadmapContent,
  future: FutureContent,
  ai: AIContent,
  creative: CreativeContent,
};

export default function UserManual({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("guide");
  const Content = TAB_CONTENT[activeTab];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-3xl bg-chamber-panel border border-chamber-border rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ maxHeight: "85vh" }}
      >
        {/* Header */}
        <div className="p-6 border-b border-chamber-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-emerald-500/20 border border-white/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white/70" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight">Council Chamber Manual</h2>
              <p className="text-[10px] text-chamber-muted uppercase tracking-[0.2em]">v1.2.0-alpha</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-chamber-muted hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-chamber-border overflow-x-auto scroll-hide flex-shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 lg:px-5 py-3 text-[10px] lg:text-[11px] uppercase tracking-widest font-bold whitespace-nowrap transition-all border-b-2",
                activeTab === tab.id
                  ? "text-white border-white bg-white/5"
                  : "text-chamber-muted border-transparent hover:text-white hover:bg-white/[0.02]"
              )}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 scroll-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Content />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-chamber-border flex items-center justify-between bg-chamber-bg/50 flex-shrink-0">
          <p className="text-[9px] text-chamber-muted uppercase tracking-widest">
            Council Chamber — Sanctum of Discernment
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-white text-black font-bold text-xs hover:bg-white/90 transition-all"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
