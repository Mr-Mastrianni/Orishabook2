import React from "react";
import { motion } from "motion/react";
import { Users, MessageSquare } from "lucide-react";
import { cn } from "../lib/utils";
import { CHAMBERS, Chamber } from "../lib/council/chambers";
import { COUNCIL_MEMBERS } from "../lib/council/members";
import { Post } from "../lib/council/types";

interface ChamberGridProps {
  posts: Post[];
  joinedChamberIds: Set<string>;
  memberCounts: Record<string, number>;
  onOpen: (chamberId: string) => void;
  onToggleJoin: (chamberId: string) => Promise<void> | void;
}

function postCount(posts: Post[], chamberId: string): number {
  return posts.filter((p) => p.chamberId === chamberId).length;
}

export default function ChamberGrid({
  posts,
  joinedChamberIds,
  memberCounts,
  onOpen,
  onToggleJoin,
}: ChamberGridProps) {
  return (
    <div className="flex-1 overflow-y-auto scroll-hide p-4 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="font-display text-2xl lg:text-3xl font-bold mb-2">
            The Seven Chambers
          </h2>
          <p className="text-sm text-chamber-muted max-w-xl">
            Each chamber is the native room of one Orisha. Join the ones whose
            questions feel like yours. Posts from each council member are filed
            into their native chamber automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CHAMBERS.map((chamber, idx) => (
            <ChamberCard
              key={chamber.id}
              chamber={chamber}
              postCount={postCount(posts, chamber.id)}
              memberCount={memberCounts[chamber.id] ?? 0}
              isJoined={joinedChamberIds.has(chamber.id)}
              onOpen={() => onOpen(chamber.id)}
              onToggleJoin={() => onToggleJoin(chamber.id)}
              delay={idx * 0.04}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ChamberCardProps {
  chamber: Chamber;
  postCount: number;
  memberCount: number;
  isJoined: boolean;
  onOpen: () => void;
  onToggleJoin: () => void;
  delay: number;
}

function ChamberCard({
  chamber,
  postCount,
  memberCount,
  isJoined,
  onOpen,
  onToggleJoin,
  delay,
}: ChamberCardProps) {
  const member = COUNCIL_MEMBERS[chamber.orishaId];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      onClick={onOpen}
      className={cn(
        "group relative rounded-2xl p-5 cursor-pointer transition-all overflow-hidden",
        "bg-chamber-panel border border-chamber-border hover:border-white/20"
      )}
      style={{
        boxShadow: `inset 0 0 0 1px ${chamber.accentColor}15`,
      }}
    >
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10 blur-2xl pointer-events-none"
        style={{ backgroundColor: chamber.accentColor }}
      />

      <div className="flex items-start gap-4 mb-4 relative">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-display font-bold flex-shrink-0"
          style={{
            backgroundColor: chamber.accentColor + "20",
            color: chamber.accentColor,
            border: `1px solid ${chamber.accentColor}40`,
          }}
        >
          {chamber.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-lg leading-tight">
            {chamber.name}
          </h3>
          <p className="text-[10px] text-chamber-muted uppercase tracking-widest mt-0.5">
            m/{chamber.id} · {member.name}
          </p>
        </div>
      </div>

      <p className="text-sm text-chamber-ink/70 leading-relaxed mb-4 line-clamp-3">
        {chamber.description}
      </p>

      <div className="flex items-center gap-4 text-[10px] text-chamber-muted mb-4">
        <span className="flex items-center gap-1.5">
          <Users className="w-3 h-3" />
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </span>
        <span className="flex items-center gap-1.5">
          <MessageSquare className="w-3 h-3" />
          {postCount} {postCount === 1 ? "post" : "posts"}
        </span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleJoin();
        }}
        className={cn(
          "w-full py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
          isJoined
            ? "bg-white/5 border border-white/20 text-chamber-ink hover:bg-white/10"
            : "text-black hover:opacity-90"
        )}
        style={
          !isJoined
            ? { backgroundColor: chamber.accentColor }
            : undefined
        }
      >
        {isJoined ? "Joined" : "Join Chamber"}
      </button>
    </motion.div>
  );
}
