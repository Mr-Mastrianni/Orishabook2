import React, { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Bookmark, ChevronUp, Shield, Award } from "lucide-react";
import { Post, OrishaName } from "../lib/council/types";
import { COUNCIL_MEMBERS } from "../lib/council/members";
import { CHAMBERS_BY_ID } from "../lib/council/chambers";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  displayName: string;
  posts: Post[];
  userVotes: Record<string, 1 | -1 | 0>;
  savedPostIds: Set<string>;
  joinedChamberIds: Set<string>;
}

interface FavoriteOrisha {
  id: OrishaName;
  count: number;
}

export default function ProfileModal({
  open,
  onClose,
  displayName,
  posts,
  userVotes,
  savedPostIds,
  joinedChamberIds,
}: ProfileModalProps) {
  // Derived stats — cheap to recompute while the modal is open.
  const stats = useMemo(() => {
    let upvotes = 0;
    let downvotes = 0;
    const perOrisha = new Map<OrishaName, number>();

    for (const [postId, vote] of Object.entries(userVotes)) {
      if (vote === 1) upvotes++;
      if (vote === -1) downvotes++;
      if (vote === 1) {
        const post = posts.find((p) => p.id === postId);
        if (post && post.authorId !== "user") {
          const key = post.authorId as OrishaName;
          perOrisha.set(key, (perOrisha.get(key) ?? 0) + 1);
        }
      }
    }

    const favorites: FavoriteOrisha[] = Array.from(perOrisha.entries())
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      upvotes,
      downvotes,
      favorites,
      savedCount: savedPostIds.size,
      joinedCount: joinedChamberIds.size,
    };
  }, [posts, userVotes, savedPostIds, joinedChamberIds]);

  const joinedChambers = Array.from(joinedChamberIds)
    .map((id) => CHAMBERS_BY_ID[id])
    .filter(Boolean);

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
            className="bg-chamber-panel border border-chamber-border rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl shadow-black/50"
          >
            <div className="flex items-start justify-between p-6 border-b border-chamber-border">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/30 to-blue-500/30 border border-white/10 flex items-center justify-center font-display font-bold text-xl">
                  {displayName[0]?.toUpperCase() ?? "?"}
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold leading-tight">
                    {displayName}
                  </h2>
                  <p className="text-[10px] text-chamber-muted uppercase tracking-[0.2em] mt-1">
                    Council Seeker
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-chamber-muted hover:text-white hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <StatTile
                  label="Resonances"
                  value={stats.upvotes}
                  icon={<ChevronUp className="w-4 h-4" />}
                  accent="#10B981"
                />
                <StatTile
                  label="Saved"
                  value={stats.savedCount}
                  icon={<Bookmark className="w-4 h-4" />}
                  accent="#EAB308"
                />
                <StatTile
                  label="Chambers"
                  value={stats.joinedCount}
                  icon={<Shield className="w-4 h-4" />}
                  accent="#7C3AED"
                />
              </div>

              <section>
                <h3 className="text-[10px] uppercase tracking-widest text-chamber-muted font-bold mb-3">
                  Favorite Voices
                </h3>
                {stats.favorites.length === 0 ? (
                  <p className="text-xs text-chamber-muted italic">
                    Resonate with posts to surface the voices you return to.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {stats.favorites.map((fav, idx) => {
                      const member = COUNCIL_MEMBERS[fav.id];
                      return (
                        <div
                          key={fav.id}
                          className="flex items-center gap-3 p-3 rounded-xl border border-chamber-border"
                        >
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center font-display font-bold"
                            style={{
                              backgroundColor: member.accentColor + "20",
                              color: member.accentColor,
                              border: `1px solid ${member.accentColor}40`,
                            }}
                          >
                            {member.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-display font-bold text-sm">
                              {member.name}
                            </div>
                            <div className="text-[10px] text-chamber-muted uppercase tracking-wider">
                              {member.role}
                            </div>
                          </div>
                          {idx === 0 && (
                            <Award className="w-4 h-4 text-yellow-400" />
                          )}
                          <div className="text-sm font-bold text-chamber-ink">
                            {fav.count}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section>
                <h3 className="text-[10px] uppercase tracking-widest text-chamber-muted font-bold mb-3">
                  Joined Chambers
                </h3>
                {joinedChambers.length === 0 ? (
                  <p className="text-xs text-chamber-muted italic">
                    Visit the Chambers tab to join rooms that interest you.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {joinedChambers.map((chamber) => (
                      <div
                        key={chamber.id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs"
                        style={{
                          borderColor: chamber.accentColor + "60",
                          backgroundColor: chamber.accentColor + "15",
                          color: chamber.accentColor,
                        }}
                      >
                        <span className="text-sm">{chamber.icon}</span>
                        <span className="font-bold">{chamber.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface StatTileProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}

function StatTile({ label, value, icon, accent }: StatTileProps) {
  return (
    <div
      className="rounded-xl p-3 border"
      style={{
        borderColor: accent + "30",
        backgroundColor: accent + "08",
      }}
    >
      <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold mb-1" style={{ color: accent }}>
        {icon}
        {label}
      </div>
      <div className="font-display text-2xl font-bold">{value}</div>
    </div>
  );
}
