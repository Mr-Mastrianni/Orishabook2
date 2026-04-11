import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, MessageSquare, X, Sparkles, Scale, Crown } from "lucide-react";
import { cn } from "../lib/utils";
import { CHAMBERS, Chamber } from "../lib/council/chambers";
import { COUNCIL_MEMBERS } from "../lib/council/members";
import { CouncilMember, Post } from "../lib/council/types";

interface ChamberGridProps {
  posts: Post[];
  joinedChamberIds: Set<string>;
  memberCounts: Record<string, number>;
  onOpen: (chamberId: string) => void;
  onToggleJoin: (chamberId: string) => Promise<void> | void;
}

// Helper to get emoji display for a member
function getMemberEmojis(member: CouncilMember): string {
  if (!member.emojis) return "";
  const all = [
    ...(member.emojis.symbols || []),
    ...(member.emojis.tools || []),
    ...(member.emojis.elements || []),
  ];
  return all.slice(0, 4).join(" ");
}

// Helper to get colors display
function getMemberColors(member: CouncilMember): string {
  if (!member.colors) return "";
  return member.colors.map((c, i) => (
    `<span key={i} class="inline-block w-3 h-3 rounded-full border border-white/20" style={{backgroundColor: c}} />`
  )).join(" ");
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
  const [selectedOrisha, setSelectedOrisha] = useState<CouncilMember | null>(null);

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
              onShowDetails={() => setSelectedOrisha(COUNCIL_MEMBERS[chamber.orishaId])}
              delay={idx * 0.04}
            />
          ))}
        </div>
      </div>

      <OrishaDetailModal
        orisha={selectedOrisha}
        open={!!selectedOrisha}
        onClose={() => setSelectedOrisha(null)}
      />
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
  onShowDetails: () => void;
  delay: number;
}

function ChamberCard({
  chamber,
  postCount,
  memberCount,
  isJoined,
  onOpen,
  onToggleJoin,
  onShowDetails,
  delay,
}: ChamberCardProps) {
  const member = COUNCIL_MEMBERS[chamber.orishaId];
  const emojis = getMemberEmojis(member);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={cn(
        "group relative rounded-2xl p-5 transition-all overflow-hidden",
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

      <div 
        className="flex items-start gap-4 mb-4 relative cursor-pointer"
        onClick={onOpen}
      >
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

      <div 
        className="cursor-pointer"
        onClick={onOpen}
      >
        <p className="text-sm text-chamber-ink/70 leading-relaxed mb-3 line-clamp-3">
          {chamber.description}
        </p>

        {emojis && (
          <p className="text-lg mb-3 opacity-80">{emojis}</p>
        )}

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
      </div>

      <div className="flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleJoin();
          }}
          className={cn(
            "flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
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
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShowDetails();
          }}
          className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all bg-white/5 border border-white/20 text-chamber-muted hover:text-white hover:bg-white/10"
          title="View Orisha details"
        >
          <Sparkles className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// Orisha Detail Modal
interface OrishaDetailModalProps {
  orisha: CouncilMember | null;
  open: boolean;
  onClose: () => void;
}

function OrishaDetailModal({ orisha, open, onClose }: OrishaDetailModalProps) {
  if (!orisha) return null;

  const allEmojis = [
    ...(orisha.emojis?.symbols || []),
    ...(orisha.emojis?.tools || []),
    ...(orisha.emojis?.offerings || []),
    ...(orisha.emojis?.nature || []),
    ...(orisha.emojis?.elements || []),
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-chamber-panel border border-chamber-border rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl shadow-black/50"
          >
            {/* Header */}
            <div 
              className="relative p-6 border-b border-chamber-border"
              style={{
                background: `linear-gradient(135deg, ${orisha.colors?.[0] || orisha.accentColor}15 0%, ${orisha.colors?.[1] || orisha.accentColor}08 100%)`
              }}
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-chamber-muted hover:text-white hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-display font-bold flex-shrink-0"
                  style={{
                    backgroundColor: (orisha.colors?.[0] || orisha.accentColor) + "30",
                    color: orisha.colors?.[0] || orisha.accentColor,
                    border: `2px solid ${(orisha.colors?.[0] || orisha.accentColor)}50`,
                  }}
                >
                  {orisha.name[0]}
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold leading-tight">
                    {orisha.name}
                  </h2>
                  <p className="text-sm text-chamber-muted mt-1">
                    {orisha.title}
                  </p>
                  <p className="text-[10px] text-chamber-muted/70 uppercase tracking-widest mt-0.5">
                    {orisha.role}
                  </p>
                </div>
              </div>

              {/* Sacred Colors */}
              {orisha.colors && (
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-[10px] uppercase tracking-widest text-chamber-muted">Sacred Colors:</span>
                  <div className="flex gap-1.5">
                    {orisha.colors.map((color, i) => (
                      <div
                        key={i}
                        className="w-5 h-5 rounded-full border border-white/20"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Divine Attributes */}
              {orisha.divineAttributes && (
                <section>
                  <h3 className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-chamber-muted font-bold mb-3">
                    <Crown className="w-3.5 h-3.5" />
                    Divine Attributes
                  </h3>
                  <ul className="space-y-1.5">
                    {orisha.divineAttributes.map((attr, i) => (
                      <li key={i} className="text-sm text-chamber-ink/80 flex items-start gap-2">
                        <span className="text-chamber-muted mt-1">•</span>
                        {attr}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Sacred Emojis */}
              {allEmojis.length > 0 && (
                <section>
                  <h3 className="text-[10px] uppercase tracking-widest text-chamber-muted font-bold mb-3">
                    Sacred Symbols
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {orisha.emojis?.symbols?.map((e, i) => (
                      <span key={`sym-${i}`} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-lg" title="Symbol">
                        {e}
                      </span>
                    ))}
                    {orisha.emojis?.tools?.map((e, i) => (
                      <span key={`tool-${i}`} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-lg" title="Tool">
                        {e}
                      </span>
                    ))}
                    {orisha.emojis?.elements?.map((e, i) => (
                      <span key={`elem-${i}`} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-lg" title="Element">
                        {e}
                      </span>
                    ))}
                    {orisha.emojis?.offerings?.map((e, i) => (
                      <span key={`off-${i}`} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-lg" title="Offering">
                        {e}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Domain */}
              {orisha.domain && (
                <section>
                  <h3 className="text-[10px] uppercase tracking-widest text-chamber-muted font-bold mb-3">
                    Domain
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {orisha.domain.map((d, i) => (
                      <span 
                        key={i} 
                        className="px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: (orisha.colors?.[0] || orisha.accentColor) + "20",
                          color: orisha.colors?.[0] || orisha.accentColor,
                        }}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Speaking Style */}
              {orisha.speakingStyle && (
                <section>
                  <h3 className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-chamber-muted font-bold mb-3">
                    <Scale className="w-3.5 h-3.5" />
                    Voice & Phrases
                  </h3>
                  <div className="space-y-3">
                    {orisha.speakingStyle.commonPhrases && (
                      <div className="grid gap-2">
                        {orisha.speakingStyle.commonPhrases.slice(0, 4).map((phrase, i) => (
                          <p key={i} className="text-sm text-chamber-ink/80 italic pl-3 border-l-2" style={{ borderColor: (orisha.colors?.[0] || orisha.accentColor) + "50" }}>
                            "{phrase}"
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Patakis */}
              {orisha.patakis && (
                <section>
                  <h3 className="text-[10px] uppercase tracking-widest text-chamber-muted font-bold mb-3">
                    Sacred Stories (Patakis)
                  </h3>
                  <ul className="space-y-2">
                    {orisha.patakis.slice(0, 3).map((story, i) => (
                      <li key={i} className="text-sm text-chamber-ink/70 flex items-start gap-2">
                        <span className="text-chamber-muted mt-0.5">◦</span>
                        {story}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Sacred Numbers */}
              {orisha.sacredNumbers && (
                <section>
                  <h3 className="text-[10px] uppercase tracking-widest text-chamber-muted font-bold mb-2">
                    Sacred Numbers
                  </h3>
                  <p className="text-lg font-display font-bold" style={{ color: orisha.colors?.[0] || orisha.accentColor }}>
                    {orisha.sacredNumbers.join(", ")}
                  </p>
                </section>
              )}

              {/* Relationships */}
              {orisha.relationships && (
                <section>
                  <h3 className="text-[10px] uppercase tracking-widest text-chamber-muted font-bold mb-3">
                    Divine Relationships
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(orisha.relationships).slice(0, 4).map(([name, relation], i) => (
                      <div key={i} className="flex gap-3 text-sm">
                        <span className="font-bold text-chamber-ink min-w-[80px]">{name}:</span>
                        <span className="text-chamber-ink/70">{relation}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
