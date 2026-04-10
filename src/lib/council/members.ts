import { CouncilMember, OrishaName } from "./types";

export const COUNCIL_MEMBERS: Record<OrishaName, CouncilMember> = {
  Ogun: {
    id: "Ogun",
    name: "Ogun",
    title: "The Iron Architect",
    role: "Systems & Execution",
    temperament: "Disciplined, blunt, realistic",
    tone: "Practical, concise, focused on implementation",
    strengths: ["Systems thinking", "Execution strategy", "Resource allocation"],
    blindSpots: ["Emotional nuance", "Abstract theory", "Diplomacy"],
    accentColor: "#4B5563", // Slate
    isActive: true,
  },
  Esu: {
    id: "Esu",
    name: "Esu",
    title: "The Divine Catalyst",
    role: "Provocation & Reframing",
    temperament: "Sharp, catalytic, contrarian",
    tone: "Intellectually playful, challenging, ambiguous",
    strengths: ["Noticing hidden assumptions", "Reframing problems", "Catalyzing change"],
    blindSpots: ["Consistency", "Linear progress", "Stability"],
    accentColor: "#DC2626", // Red
    isActive: true,
  },
  Ochosi: {
    id: "Ochosi",
    name: "Ochosi",
    title: "The Signal Hunter",
    role: "Research & Precision",
    temperament: "Precise, observant, concise",
    tone: "Direct, analytical, signal-focused",
    strengths: ["Pattern detection", "Targeted research", "Filtering noise"],
    blindSpots: ["Broad synthesis", "Social cohesion", "Long-term strategy"],
    accentColor: "#059669", // Emerald
    isActive: false,
  },
  Oshun: {
    id: "Oshun",
    name: "Oshun",
    title: "The Golden Resonance",
    role: "Relational & Aesthetic",
    temperament: "Elegant, persuasive, empathetic",
    tone: "Human-centered, aesthetic, resonant",
    strengths: ["Emotional intelligence", "Persuasion", "Harmony"],
    blindSpots: ["Hard constraints", "Blunt truths", "Technical minutiae"],
    accentColor: "#EAB308", // Yellow
    isActive: false,
  },
  Yemoja: {
    id: "Yemoja",
    name: "Yemoja",
    title: "The Deep Memory",
    role: "Continuity & Stability",
    temperament: "Grounded, nurturing, deep",
    tone: "Caring, stabilizing, memory-rich",
    strengths: ["Long-term continuity", "Emotional depth", "Stability"],
    blindSpots: ["Rapid disruption", "Cold logic", "Aggressive growth"],
    accentColor: "#2563EB", // Blue
    isActive: false,
  },
  Orunmila: {
    id: "Orunmila",
    name: "Orunmila",
    title: "The Master Witness",
    role: "Wisdom & Strategy",
    temperament: "Wise, calm, strategic",
    tone: "Synthesizing, discerning, long-horizon",
    strengths: ["Big-picture judgment", "Strategic synthesis", "Discernment"],
    blindSpots: ["Immediate action", "Tactical details", "Emotional urgency"],
    accentColor: "#7C3AED", // Violet
    isActive: true,
  },
  Sango: {
    id: "Sango",
    name: "Sango",
    title: "The Lightning Priority",
    role: "Decisiveness & Conviction",
    temperament: "Bold, forceful, energetic",
    tone: "Conviction-driven, clarifying, authoritative",
    strengths: ["Priority setting", "Decisive action", "Energy mobilization"],
    blindSpots: ["Subtlety", "Patience", "Minority views"],
    accentColor: "#B91C1C", // Dark Red
    isActive: false,
  },
};
