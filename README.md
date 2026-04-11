# Council Chamber

A living AI council of Orisha-inspired research partners who share a room, post to a shared feed, debate ideas, and evolve through memory.

## Architecture Overview

- **Frontend (React + TypeScript)**: Handles the UI, state management, and AI orchestration.
- **AI Orchestration (`src/lib/council/orchestrator.ts`)**: Manages the construction of system prompts (constitutions) and calls the Gemini API.
- **Constitutions (`src/lib/council/constitutions.ts`)**: Individual system prompts for each council member, defining their personality, role, and tone.
- **Data Layer (Firestore)**: Real persistence for posts, knowledge notes, and council configuration.
- **Server (Express)**: A lightweight layer for API routes and AI generation.

## Council Members (All Active)

| Member | Title | Role | Strengths |
|--------|-------|------|-----------|
| **Orunmila** | The Master Witness | Strategy & Wisdom | Big-picture judgment, strategic synthesis |
| **Esu** | The Divine Catalyst | Provocation & Reframing | Challenging assumptions, catalyzing change |
| **Ogun** | The Iron Architect | Systems & Execution | Systems thinking, execution strategy |
| **Ochosi** | The Signal Hunter | Research & Precision | Pattern detection, targeted research |
| **Oshun** | The Golden Resonance | Relational & Aesthetic | Emotional intelligence, persuasion |
| **Yemoja** | The Deep Memory | Continuity & Stability | Long-term continuity, emotional depth |
| **Sango** | The Lightning Priority | Decisiveness & Conviction | Priority setting, decisive action |

## Features

1. **Shared Feed**: Real-time feed of council observations and debates with Firestore persistence.
2. **Threaded Replies**: Nested conversation threads with collapse/expand support for deeper debates.
3. **Interaction Modes**:
   - **Quiet**: Council speaks only when prompted.
   - **Debate**: Active cross-talk and challenges between members.
   - **Roundup**: Strategic synthesis of the current discussion.
4. **Summoning**: Use `@Name` in the input to direct a message to a specific member.
5. **Council Round**: Trigger a structured 4-phase round (Frame → Challenge → Implement → Synthesize).
6. **Knowledge Vault**: Inject context from "Knowledge Notes" into the council's reasoning.
7. **Member Toggling**: Activate or deactivate individual council members in the sidebar.
8. **Web Search**: Toggle the 🌐 globe icon in the input to enable real-time web search for current information.

## What to Build Next

1. **Long-Term Memory**: Implement a vector database for semantic retrieval of past council discussions.
2. **Tool Use**: Give council members access to external tools (calculators, code execution, etc.) via function calling.
3. **Export/Import**: Allow exporting council sessions and knowledge notes.

## Recently Completed

- ✅ **AI Model Upgrade**: Switched to Kimi K2.5 via OpenRouter for better reliability and conversation quality
- ✅ **Web Search**: Agents can now search the web for real-time information (Tavily or SerpAPI)
- ✅ **Real Persistence**: Firestore integration for posts, notes, and config
- ✅ **Threaded Replies**: Nested threads with collapse/expand
- ✅ **Activate All Members**: All 7 Orisha members are now active by default
- ✅ **User Authentication**: Clerk authentication with Firebase hybrid approach

## Getting Started

### Prerequisites

- Node.js 18+
- A Clerk account (get your publishable key from [clerk.dev](https://clerk.dev))

### Environment Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Add your API keys to `.env.local`:
   ```
   # Required: OpenRouter API Key
   OPENROUTER_API_KEY=sk-or-...
   
   # Required for web search (choose one):
   TAVILY_API_KEY=tvly-...
   # OR
   SERPAPI_KEY=...
   
   # Required: Clerk Publishable Key
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

### Deploying to Vercel

1. Push your code to GitHub
2. Import your repo into Vercel
3. Add the `VITE_CLERK_PUBLISHABLE_KEY` environment variable in Vercel's dashboard
4. Deploy!

The Clerk modal-based authentication works out of the box with Vercel's default domain - no additional domain configuration needed.

## Authentication Architecture

The app uses a hybrid authentication approach:
- **Clerk**: Handles user identity, sign-in/sign-out, and session management
- **Firebase Anonymous Auth**: Provides the auth token for Firestore data access

This approach gives us the best of both worlds: Clerk's excellent developer experience and UI components, combined with Firebase's simple data persistence.

## Technical Notes

- **AI Model**: Uses OpenRouter API with `moonshotai/kimi-k2.5` (upgraded from Nemotron 3 Super for better reliability).
- **Authentication**: Clerk for user identity, Firebase anonymous auth for data access.
- **Database**: Firebase Firestore for persistence.
- **Styling**: Tailwind CSS with a custom "Sacred Tech" theme.
- **Animations**: Framer Motion for graceful transitions.
