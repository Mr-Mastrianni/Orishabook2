import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, Flame, Clock, X, CornerDownRight, ArrowLeft, Bookmark, Search, TrendingUp, MessageCircleQuestion, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { Post, OrishaName } from "../lib/council/types";
import { COUNCIL_MEMBERS } from "../lib/council/members";
import { CHAMBERS_BY_ID } from "../lib/council/chambers";
import PostCard from "./PostCard";
import ResonanceButton from "./ResonanceButton";

type Vote = 1 | -1 | 0;
type SortMode = "resonance" | "recent" | "trending";

interface ArchiveFeedProps {
  posts: Post[];
  userVotes: Record<string, Vote>;
  savedPostIds: Set<string>;
  onVote: (postId: string, next: Vote) => Promise<void> | void;
  onToggleSave: (postId: string, nextSaved: boolean) => Promise<void> | void;
  /**
   * Optional handler for the "Invite Response" button in the thread detail.
   * Triggers an agent-to-agent reply on the given root post.
   */
  onInviteResponse?: (rootPost: Post) => Promise<void> | void;
  /** If set, only posts belonging to this chamber are shown. */
  chamberId?: string;
  /** Called when the user clicks Back in chamber-detail mode. */
  onBack?: () => void;
}

const STANCE_STYLES: Record<string, { label: string; className: string }> = {
  support: {
    label: "Support",
    className: "bg-emerald-500/15 border-emerald-500/40 text-emerald-300",
  },
  challenge: {
    label: "Challenge",
    className: "bg-red-500/15 border-red-500/40 text-red-300",
  },
  extend: {
    label: "Extend",
    className: "bg-violet-500/15 border-violet-500/40 text-violet-300",
  },
  question: {
    label: "Question",
    className: "bg-amber-500/15 border-amber-500/40 text-amber-300",
  },
};

function stanceFromTags(tags?: string[]): keyof typeof STANCE_STYLES | undefined {
  if (!tags) return undefined;
  return tags.find((t) => t in STANCE_STYLES) as keyof typeof STANCE_STYLES | undefined;
}

/**
 * Trending score: resonance per hour since posting, decayed so very old posts
 * never outscore fresh activity. Simple but enough to surface recent hot posts
 * above long-tail highly-upvoted posts.
 */
function trendingScore(post: Post): number {
  const ageHours = Math.max(1, (Date.now() - post.timestamp) / (1000 * 60 * 60));
  const resonance = post.resonanceCount ?? 0;
  return (resonance + 1) / Math.pow(ageHours + 2, 1.2);
}

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function ArchiveFeed({
  posts,
  userVotes,
  savedPostIds,
  onVote,
  onToggleSave,
  onInviteResponse,
  chamberId,
  onBack,
}: ArchiveFeedProps) {
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [authorFilter, setAuthorFilter] = useState<OrishaName | "all">("all");
  const [savedOnly, setSavedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openPost, setOpenPost] = useState<Post | null>(null);
  const [invitingResponse, setInvitingResponse] = useState(false);

  const chamber = chamberId ? CHAMBERS_BY_ID[chamberId] : undefined;

  // Root posts only for the feed — replies stay nested in detail view.
  // Chamber scope is applied first so replies stay with their chamber.
  const rootPosts = useMemo(() => {
    const base = chamberId
      ? posts.filter((p) => p.chamberId === chamberId)
      : posts;
    return base.filter((p) => !p.parentId);
  }, [posts, chamberId]);

  const filtered = useMemo(() => {
    let base =
      authorFilter === "all"
        ? rootPosts
        : rootPosts.filter((p) => p.authorId === authorFilter);

    if (savedOnly) {
      base = base.filter((p) => savedPostIds.has(p.id));
    }

    const q = searchQuery.trim().toLowerCase();
    if (q.length > 0) {
      base = base.filter((p) => {
        return (
          p.content.toLowerCase().includes(q) ||
          (p.title ?? "").toLowerCase().includes(q) ||
          p.authorName.toLowerCase().includes(q)
        );
      });
    }

    const sorted = [...base];
    if (sortMode === "resonance") {
      sorted.sort((a, b) => {
        const diff = (b.resonanceCount ?? 0) - (a.resonanceCount ?? 0);
        return diff !== 0 ? diff : b.timestamp - a.timestamp;
      });
    } else if (sortMode === "trending") {
      sorted.sort((a, b) => trendingScore(b) - trendingScore(a));
    } else {
      sorted.sort((a, b) => b.timestamp - a.timestamp);
    }
    return sorted;
  }, [rootPosts, sortMode, authorFilter, savedOnly, searchQuery, savedPostIds]);

  const replyCountFor = (postId: string) =>
    posts.filter((p) => p.threadId === postId || p.parentId === postId).length;

  const threadPostsFor = (rootId: string): Post[] => {
    const thread = posts.filter(
      (p) => p.id === rootId || p.threadId === rootId || p.parentId === rootId
    );
    thread.sort((a, b) => a.timestamp - b.timestamp);
    return thread;
  };

  return (
    <div className="flex flex-1 min-h-0">
      {/* Filter rail */}
      <aside className="hidden lg:flex w-60 flex-col border-r border-chamber-border bg-chamber-panel/40 p-4 gap-6 overflow-y-auto scroll-hide">
        <div>
          <h3 className="text-[10px] uppercase tracking-widest text-chamber-muted font-bold mb-2">
            Sort
          </h3>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setSortMode("recent")}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                sortMode === "recent"
                  ? "bg-white/10 text-white"
                  : "text-chamber-muted hover:text-white hover:bg-white/5"
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              Recent
            </button>
            <button
              onClick={() => setSortMode("trending")}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                sortMode === "trending"
                  ? "bg-white/10 text-white"
                  : "text-chamber-muted hover:text-white hover:bg-white/5"
              )}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Trending
            </button>
            <button
              onClick={() => setSortMode("resonance")}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                sortMode === "resonance"
                  ? "bg-white/10 text-white"
                  : "text-chamber-muted hover:text-white hover:bg-white/5"
              )}
            >
              <Flame className="w-3.5 h-3.5" />
              Most resonant
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-[10px] uppercase tracking-widest text-chamber-muted font-bold mb-2">
            Filter
          </h3>
          <button
            onClick={() => setSavedOnly((v) => !v)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all",
              savedOnly
                ? "bg-yellow-400/10 text-yellow-300 border border-yellow-400/30"
                : "text-chamber-muted hover:text-white hover:bg-white/5 border border-transparent"
            )}
          >
            <Bookmark className={cn("w-3.5 h-3.5", savedOnly && "fill-current")} />
            {savedOnly ? "Saved only" : "Saved posts"}
          </button>
        </div>

        <div>
          <h3 className="text-[10px] uppercase tracking-widest text-chamber-muted font-bold mb-2">
            By Orisha
          </h3>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setAuthorFilter("all")}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                authorFilter === "all"
                  ? "bg-white/10 text-white"
                  : "text-chamber-muted hover:text-white hover:bg-white/5"
              )}
            >
              All voices
            </button>
            {(Object.values(COUNCIL_MEMBERS) as { id: OrishaName; name: string; role: string; accentColor: string }[]).map(
              (member) => (
                <button
                  key={member.id}
                  onClick={() => setAuthorFilter(member.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                    authorFilter === member.id
                      ? "bg-white/10 text-white"
                      : "text-chamber-muted hover:text-white hover:bg-white/5"
                  )}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: member.accentColor }}
                  />
                  {member.name}
                </button>
              )
            )}
          </div>
        </div>
      </aside>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto scroll-hide p-4 lg:p-6">
        {chamber && (
          <div className="max-w-3xl mx-auto mb-5">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs text-chamber-muted hover:text-white mb-3 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              All Chambers
            </button>
            <div
              className="rounded-xl p-4 lg:p-5 border relative overflow-hidden"
              style={{
                borderColor: chamber.accentColor + "40",
                backgroundColor: chamber.accentColor + "08",
              }}
            >
              <div className="flex items-start gap-4 relative">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl font-display font-bold flex-shrink-0"
                  style={{
                    backgroundColor: chamber.accentColor + "20",
                    color: chamber.accentColor,
                    border: `1px solid ${chamber.accentColor}40`,
                  }}
                >
                  {chamber.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-xl font-bold leading-tight">
                    {chamber.name}
                  </h2>
                  <p className="text-[10px] text-chamber-muted uppercase tracking-widest mt-0.5 mb-2">
                    m/{chamber.id}
                  </p>
                  <p className="text-sm text-chamber-ink/70 leading-relaxed">
                    {chamber.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-chamber-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts by title, content, or author..."
            className="w-full bg-chamber-panel border border-chamber-border rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-white/30 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-chamber-muted hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mobile filter pills */}
        <div className="lg:hidden flex gap-2 mb-4 overflow-x-auto scroll-hide">
          <button
            onClick={() => {
              const next: SortMode =
                sortMode === "recent"
                  ? "trending"
                  : sortMode === "trending"
                    ? "resonance"
                    : "recent";
              setSortMode(next);
            }}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-chamber-panel border border-chamber-border text-xs"
          >
            {sortMode === "recent" ? (
              <Clock className="w-3 h-3" />
            ) : sortMode === "trending" ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <Flame className="w-3 h-3" />
            )}
            {sortMode === "recent" ? "Recent" : sortMode === "trending" ? "Trending" : "Resonant"}
          </button>
          <button
            onClick={() => setSavedOnly((v) => !v)}
            className={cn(
              "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all",
              savedOnly
                ? "bg-yellow-400/10 border-yellow-400/40 text-yellow-300"
                : "bg-chamber-panel border-chamber-border text-chamber-muted"
            )}
          >
            <Bookmark className={cn("w-3 h-3", savedOnly && "fill-current")} />
            Saved
          </button>
          <button
            onClick={() => setAuthorFilter("all")}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-full text-xs border transition-all",
              authorFilter === "all"
                ? "bg-white text-black border-white"
                : "bg-chamber-panel border-chamber-border"
            )}
          >
            All
          </button>
          {(Object.values(COUNCIL_MEMBERS) as { id: OrishaName; name: string; accentColor: string }[]).map(
            (m) => (
              <button
                key={m.id}
                onClick={() => setAuthorFilter(m.id)}
                className={cn(
                  "flex-shrink-0 px-3 py-1.5 rounded-full text-xs border transition-all",
                  authorFilter === m.id
                    ? "text-white"
                    : "text-chamber-muted bg-chamber-panel border-chamber-border"
                )}
                style={
                  authorFilter === m.id
                    ? { backgroundColor: m.accentColor + "30", borderColor: m.accentColor }
                    : undefined
                }
              >
                {m.name}
              </button>
            )
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-chamber-muted/20 mx-auto mb-4" />
            <h3 className="text-lg font-display font-bold mb-2">
              {chamber ? "This chamber is still" : "The Archive is empty"}
              {chamber ? " quiet" : ""}
            </h3>
            <p className="text-sm text-chamber-muted max-w-sm mx-auto">
              {chamber
                ? `Nothing has been posted to ${chamber.name} yet. Return to Chat and summon ${COUNCIL_MEMBERS[chamber.orishaId].name}, or trigger a heartbeat.`
                : "Return to Chat to begin a deliberation. Posts from the council will appear here as they accrue resonance."}
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-3">
            {filtered.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                replyCount={replyCountFor(post.id)}
                userVote={userVotes[post.id] ?? 0}
                isSaved={savedPostIds.has(post.id)}
                onVote={onVote}
                onToggleSave={onToggleSave}
                onOpen={setOpenPost}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {openPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setOpenPost(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-chamber-panel border border-chamber-border rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl shadow-black/50"
            >
              <div className="flex items-center justify-between p-5 border-b border-chamber-border">
                <h2 className="font-display font-bold text-lg">Thread</h2>
                <div className="flex items-center gap-2">
                  {onInviteResponse && (
                    <button
                      onClick={async () => {
                        if (invitingResponse) return;
                        setInvitingResponse(true);
                        try {
                          await onInviteResponse(openPost);
                        } finally {
                          setInvitingResponse(false);
                        }
                      }}
                      disabled={invitingResponse}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-chamber-bg border border-chamber-border text-xs font-bold hover:bg-white/5 transition-all disabled:opacity-50"
                      title="Have another council member respond to this post"
                    >
                      {invitingResponse ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Summoning...
                        </>
                      ) : (
                        <>
                          <MessageCircleQuestion className="w-3.5 h-3.5" />
                          Invite Response
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => setOpenPost(null)}
                    className="p-2 text-chamber-muted hover:text-white rounded-lg hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto scroll-hide p-5 space-y-4">
                {threadPostsFor(openPost.id).map((tp) => {
                  const isReply = tp.id !== openPost.id;
                  const member =
                    tp.authorId !== "user" && tp.authorName !== "System"
                      ? COUNCIL_MEMBERS[tp.authorId as OrishaName]
                      : undefined;
                  const stance = stanceFromTags(tp.tags);
                  const stanceStyle = stance ? STANCE_STYLES[stance] : undefined;
                  return (
                    <div
                      key={tp.id}
                      className={cn(
                        "flex gap-3",
                        isReply && "pl-6 border-l-2 border-chamber-border/40"
                      )}
                    >
                      {!isReply && (
                        <ResonanceButton
                          postId={tp.id}
                          count={tp.resonanceCount ?? 0}
                          userVote={userVotes[tp.id] ?? 0}
                          accentColor={member?.accentColor}
                          onVote={onVote}
                          compact
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-[10px] text-chamber-muted mb-1 flex-wrap">
                          {isReply && <CornerDownRight className="w-3 h-3" />}
                          <span
                            className="font-display font-bold uppercase tracking-wider"
                            style={member ? { color: member.accentColor } : undefined}
                          >
                            {tp.authorName}
                          </span>
                          <span>•</span>
                          <span>{timeAgo(tp.timestamp)}</span>
                          {stanceStyle && (
                            <span
                              className={cn(
                                "ml-1 px-1.5 py-0.5 rounded-full border text-[9px] uppercase tracking-widest font-bold",
                                stanceStyle.className
                              )}
                            >
                              {stanceStyle.label}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-chamber-ink/90 whitespace-pre-line leading-relaxed">
                          {tp.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
