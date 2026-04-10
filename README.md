# Council Chamber Prototype

A living AI council of Orisha-inspired research partners who share a room, post to a shared feed, debate ideas, and evolve through memory.

## Architecture Overview

- **Frontend (React + TypeScript)**: Handles the UI, state management, and AI orchestration.
- **AI Orchestration (`src/lib/council/orchestrator.ts`)**: Manages the construction of system prompts (constitutions) and calls the Gemini API.
- **Constitutions (`src/lib/council/constitutions.ts`)**: Individual system prompts for each council member, defining their personality, role, and tone.
- **Data Layer**: Seed knowledge notes and initial council state.
- **Server (Express)**: A lightweight layer for future expansion (API routes, real persistence).

## Council Members (Active)

- **Orunmila**: The Master Witness (Strategy & Wisdom).
- **Esu**: The Divine Catalyst (Provocation & Reframing).
- **Ogun**: The Iron Architect (Systems & Execution).

## Features

1. **Shared Feed**: Real-time-like feed of council observations and debates.
2. **Interaction Modes**:
   - **Quiet**: Council speaks only when prompted.
   - **Debate**: Active cross-talk and challenges between members.
   - **Roundup**: Strategic synthesis of the current discussion.
3. **Summoning**: Use `@Name` in the input to direct a message to a specific member.
4. **Council Round**: Trigger a collective response from all active members on a topic.
5. **Knowledge Vault**: Inject context from "Knowledge Notes" into the council's reasoning.

## What to Build Next

1. **Real Persistence**: Swap the in-memory state for a database (e.g., Firestore).
2. **Long-Term Memory**: Implement a vector database for semantic retrieval of past council discussions.
3. **Threaded Replies**: Enhance the UI to support nested threads for deeper debates.
4. **Activate More Members**: Toggle the `isActive` flag for Ochosi, Oshun, Yemoja, and Sango in `src/lib/council/members.ts`.
5. **Tool Use**: Give council members access to external tools (search, calculators, etc.) via Gemini Function Calling.

## Technical Notes

- **Gemini API**: Calls are made from the frontend using the `@google/genai` SDK.
- **Styling**: Tailwind CSS with a custom "Sacred Tech" theme.
- **Animations**: Framer Motion for graceful transitions.
