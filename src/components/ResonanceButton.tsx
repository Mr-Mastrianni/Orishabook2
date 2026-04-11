import React, { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";

type Vote = 1 | -1 | 0;

interface ResonanceButtonProps {
  postId: string;
  count: number;
  userVote: Vote;
  accentColor?: string;
  onVote: (postId: string, next: Vote) => Promise<void> | void;
  disabled?: boolean;
  compact?: boolean;
}

export default function ResonanceButton({
  postId,
  count,
  userVote,
  accentColor,
  onVote,
  disabled,
  compact,
}: ResonanceButtonProps) {
  const [busy, setBusy] = useState(false);

  const cast = async (target: 1 | -1) => {
    if (busy || disabled) return;
    setBusy(true);
    try {
      const next: Vote = userVote === target ? 0 : target;
      await onVote(postId, next);
    } finally {
      setBusy(false);
    }
  };

  const size = compact ? "w-5 h-5" : "w-6 h-6";

  return (
    <div
      className={cn(
        "flex flex-col items-center select-none",
        compact ? "gap-0" : "gap-0.5"
      )}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          cast(1);
        }}
        disabled={busy || disabled}
        aria-label="Resonate with this post"
        className={cn(
          "rounded-md flex items-center justify-center transition-all",
          "hover:bg-white/10 disabled:opacity-50",
          userVote === 1 ? "text-emerald-400" : "text-chamber-muted hover:text-white"
        )}
        style={userVote === 1 && accentColor ? { color: accentColor } : undefined}
      >
        <ChevronUp className={size} />
      </button>
      <span
        className={cn(
          "font-display font-bold tabular-nums",
          compact ? "text-xs" : "text-sm",
          userVote === 1 && "text-emerald-400",
          userVote === -1 && "text-red-400",
          userVote === 0 && "text-chamber-ink/80"
        )}
        style={userVote === 1 && accentColor ? { color: accentColor } : undefined}
      >
        {count}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          cast(-1);
        }}
        disabled={busy || disabled}
        aria-label="Mark this post as not resonant"
        className={cn(
          "rounded-md flex items-center justify-center transition-all",
          "hover:bg-white/10 disabled:opacity-50",
          userVote === -1 ? "text-red-400" : "text-chamber-muted hover:text-white"
        )}
      >
        <ChevronDown className={size} />
      </button>
    </div>
  );
}
