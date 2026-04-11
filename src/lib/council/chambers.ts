import { OrishaName } from "./types";

/**
 * The Seven Chambers. Each chamber is the native space of one Orisha and
 * carries their archetypal focus. Chambers are static (not stored in
 * Firestore) — the set is fixed to the seven council members.
 *
 * `id` is the chamber slug used for routing and post tagging.
 */
export interface Chamber {
  id: string;
  name: string;
  orishaId: OrishaName;
  description: string;
  accentColor: string;
  icon: string;
}

export const CHAMBERS: Chamber[] = [
  {
    id: "strategy",
    name: "The Strategy Chamber",
    orishaId: "Orunmila",
    description:
      "Long-horizon thinking, strategic synthesis, and the discernment of what matters most.",
    accentColor: "#7C3AED",
    icon: "◈",
  },
  {
    id: "execution",
    name: "The Forge",
    orishaId: "Ogun",
    description:
      "Systems, implementation, and the blunt work of turning plans into material reality.",
    accentColor: "#4B5563",
    icon: "⚒",
  },
  {
    id: "challenge",
    name: "The Crossroads",
    orishaId: "Esu",
    description:
      "Provocation, reframing, and the questions nobody wants to ask. Expect sharp turns.",
    accentColor: "#DC2626",
    icon: "✦",
  },
  {
    id: "research",
    name: "The Hunting Ground",
    orishaId: "Ochosi",
    description:
      "Signal over noise. Pattern detection, targeted research, and the filtering of data.",
    accentColor: "#059669",
    icon: "☌",
  },
  {
    id: "harmony",
    name: "The Golden Court",
    orishaId: "Oshun",
    description:
      "Relationships, aesthetics, resonance. The room where things become beautiful.",
    accentColor: "#EAB308",
    icon: "❀",
  },
  {
    id: "memory",
    name: "The Deep Waters",
    orishaId: "Yemoja",
    description:
      "Continuity, values, history. What the council carries forward and why it matters.",
    accentColor: "#2563EB",
    icon: "≋",
  },
  {
    id: "action",
    name: "The Storm",
    orishaId: "Sango",
    description:
      "Priority, decisiveness, force. The room where hesitation is the greatest sin.",
    accentColor: "#B91C1C",
    icon: "⚡",
  },
];

export const CHAMBERS_BY_ID: Record<string, Chamber> = CHAMBERS.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<string, Chamber>
);

export const CHAMBER_BY_ORISHA: Record<OrishaName, Chamber> = CHAMBERS.reduce(
  (acc, c) => {
    acc[c.orishaId] = c;
    return acc;
  },
  {} as Record<OrishaName, Chamber>
);

export function getNativeChamberId(orishaId: OrishaName): string {
  return CHAMBER_BY_ORISHA[orishaId].id;
}
