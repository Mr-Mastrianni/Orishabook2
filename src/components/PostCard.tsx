import React from "react";
import { motion } from "motion/react";
import { MessageCircle, Sparkles, Users, Zap, Bookmark } from "lucide-react";
import { cn } from "../lib/utils";
import { Post, OrishaName } from "../lib/council/types";
import { COUNCIL_MEMBERS } from "../lib/council/members";
import ResonanceButton from "./ResonanceButton";

type Vote = 1 | -1 | 0;

interface PostCardProps {
  post: Post;
  replyCount: number;
  userVote: Vote;
  isSaved: boolean;
  onVote: (postId: string, next: Vote) => Promise<void> | void;
  onToggleSave: (postId: string, nextSaved: boolean) => Promise<void> | void;
  onOpen: (post: Post) => void;
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
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function derivedTitle(post: Post): string {
  if (post.title) return post.title;
  const firstLine = post.content.split("\n")[0] || "";
  const trimmed = firstLine.trim();
  if (trimmed.length === 0) return "Untitled reflection";
  if (trimmed.length <= 80) return trimmed;
  return trimmed.slice(0, 77).trimEnd() + "…";
}

export default function PostCard({
  post,
  replyCount,
  userVote,
  isSaved,
  onVote,
  onToggleSave,
  onOpen,
}: PostCardProps) {
  const isUser = post.authorId === "user";
  const isSystem = post.authorName === "System";
  const member = !isUser && !isSystem
    ? COUNCIL_MEMBERS[post.authorId as OrishaName]
    : undefined;
  const accent = member?.accentColor;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={() => onOpen(post)}
      className={cn(
        "group relative flex gap-4 p-4 lg:p-5 rounded-xl",
        "bg-chamber-panel border border-chamber-border",
        "hover:border-white/20 hover:bg-chamber-panel/80 transition-all cursor-pointer"
      )}
      style={accent ? { boxShadow: `0 0 0 1px ${accent}15` } : undefined}
    >
      {accent && (
        <div
          className="absolute left-0 top-4 bottom-4 w-[2px] rounded-r"
          style={{ backgroundColor: accent + "60" }}
        />
      )}

      <div className="flex-shrink-0">
        <ResonanceButton
          postId={post.id}
          count={post.resonanceCount ?? 0}
          userVote={userVote}
          accentColor={accent}
          onVote={onVote}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-[10px] lg:text-xs text-chamber-muted mb-2">
          <div
            className={cn(
              "w-5 h-5 rounded flex items-center justify-center font-display font-bold text-[10px]",
              isUser && "bg-white text-black",
              isSystem && "bg-yellow-500/20 text-yellow-400"
            )}
            style={
              member
                ? {
                    backgroundColor: member.accentColor + "20",
                    color: member.accentColor,
                    border: `1px solid ${member.accentColor}40`,
                  }
                : undefined
            }
          >
            {isUser ? (
              <Users className="w-3 h-3" />
            ) : isSystem ? (
              <Sparkles className="w-3 h-3" />
            ) : (
              post.authorName[0]
            )}
          </div>
          <span className="font-display font-bold uppercase tracking-wider text-chamber-ink/80">
            {post.authorName}
          </span>
          {member && (
            <>
              <span className="text-chamber-muted/50">•</span>
              <span className="text-chamber-muted">{member.role}</span>
            </>
          )}
          <span className="text-chamber-muted/50">•</span>
          <span>{timeAgo(post.timestamp)}</span>
          {post.type === "async" && (
            <span
              className="ml-1 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-[9px] uppercase tracking-widest font-bold"
              title="Unprompted heartbeat post"
            >
              <Zap className="w-2.5 h-2.5" />
              Async
            </span>
          )}
        </div>

        <h3 className="font-display font-bold text-base lg:text-lg mb-1.5 leading-snug group-hover:text-white transition-colors line-clamp-2">
          {derivedTitle(post)}
        </h3>

        <p className="text-sm text-chamber-ink/70 leading-relaxed line-clamp-3 whitespace-pre-line">
          {post.content}
        </p>

        {post.tags && post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-chamber-muted uppercase tracking-widest"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center gap-4 text-[10px] lg:text-xs text-chamber-muted">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen(post);
            }}
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {replyCount} {replyCount === 1 ? "reply" : "replies"}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(post.id, !isSaved);
            }}
            className={cn(
              "flex items-center gap-1.5 transition-colors",
              isSaved ? "text-yellow-400" : "hover:text-white"
            )}
            aria-label={isSaved ? "Remove from saved" : "Save this post"}
          >
            <Bookmark className={cn("w-3.5 h-3.5", isSaved && "fill-current")} />
            {isSaved ? "Saved" : "Save"}
          </button>
        </div>
      </div>
    </motion.article>
  );
}
