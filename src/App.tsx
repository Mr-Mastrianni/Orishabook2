import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare,
  Users,
  Settings,
  BookOpen,
  Send,
  Sparkles,
  Hash,
  ChevronRight,
  Shield,
  Zap,
  Eye,
  Heart,
  Waves,
  Compass,
  Flame,
  Menu,
  X,
  Plus,
  Minus,
  Pencil,
  Trash2,
  Reply,
  CornerDownRight,
  Save,
  HelpCircle,
  Trash
} from "lucide-react";
import { cn } from "./lib/utils";
import {
  OrishaName,
  InteractionMode,
  Post,
  KnowledgeNote,
  CouncilState,
  RoundStep,
  RoundPhase
} from "./lib/council/types";
import { COUNCIL_MEMBERS } from "./lib/council/members";
import { SEED_NOTES } from "./data/notes";
import { generateCouncilResponse } from "./lib/council/orchestrator";
import UserManual from "./UserManual";

// Local storage (in-memory)
const LOCAL_STORAGE_KEY = "council_data";

const getLocalData = () => {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  return {
    posts: [],
    notes: SEED_NOTES.map((n, i) => ({ ...n, id: `note-${i}` })),
    config: { mode: "quiet", activeMembers: ["Orunmila", "Esu", "Ogun"] as OrishaName[] }
  };
};

const saveLocalData = (data: { posts: Post[], notes: KnowledgeNote[], config: { mode: InteractionMode, activeMembers: OrishaName[] } }) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
};

// Mock user for display purposes only (no auth required)
const MOCK_USER = {
  displayName: "Seeker",
  uid: "anonymous"
};

export default function App() {
  const [state, setState] = useState<CouncilState>({
    mode: "quiet",
    activeMembers: ["Orunmila", "Esu", "Ogun"],
    posts: [],
    notes: [],
  });
  
  const [inputValue, setInputValue] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingMember, setGeneratingMember] = useState<OrishaName | null>(null);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<KnowledgeNote | null>(null);
  const [noteForm, setNoteForm] = useState({ title: "", category: "", sourceType: "", tags: "", content: "", citation: "" });
  const [replyTarget, setReplyTarget] = useState<Post | null>(null);
  const [currentRoundPhase, setCurrentRoundPhase] = useState<string | null>(null);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const feedEndRef = useRef<HTMLDivElement>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const localData = getLocalData();
    setState({
      mode: localData.config.mode,
      activeMembers: localData.config.activeMembers,
      posts: localData.posts,
      notes: localData.notes,
    });
  }, []);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.posts]);

  const addPost = (post: Partial<Post>) => {
    const newPost: Post = {
      id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      authorId: post.authorId || "user",
      authorName: post.authorName || "Seeker",
      content: post.content || "",
      timestamp: Date.now(),
      ...post,
    } as Post;

    const localData = getLocalData();
    localData.posts.push(newPost);
    // Keep only last 100 posts
    if (localData.posts.length > 100) {
      localData.posts = localData.posts.slice(-100);
    }
    saveLocalData(localData);
    setState(prev => ({ ...prev, posts: localData.posts }));
  };

  const toggleMember = (memberId: OrishaName) => {
    const newActiveMembers = state.activeMembers.includes(memberId)
      ? state.activeMembers.filter(id => id !== memberId)
      : [...state.activeMembers, memberId];
    
    const localData = getLocalData();
    localData.config.activeMembers = newActiveMembers;
    saveLocalData(localData);
    setState(prev => ({ ...prev, activeMembers: newActiveMembers }));
  };

  const setMode = (mode: InteractionMode) => {
    const localData = getLocalData();
    localData.config.mode = mode;
    saveLocalData(localData);
    setState(prev => ({ ...prev, mode }));
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    const userPost: Partial<Post> = {
      authorId: "user",
      authorName: MOCK_USER.displayName,
      content: inputValue,
      ...(replyTarget ? { parentId: replyTarget.id, threadId: replyTarget.threadId || replyTarget.id } : {}),
    };

    addPost(userPost);
    setInputValue("");
    setReplyTarget(null);
    
    // Check for summons
    const summonMatch = inputValue.match(/@(\w+)/);
    if (summonMatch) {
      const name = summonMatch[1];
      const member = Object.values(COUNCIL_MEMBERS).find(
        m => m.name.toLowerCase() === name.toLowerCase() && state.activeMembers.includes(m.id)
      );
      if (member) {
        setIsGenerating(true);
        setGeneratingMember(member.id);
        const threadId = replyTarget ? (replyTarget.threadId || replyTarget.id) : undefined;
        const response = await generateCouncilResponse(member.id, state.mode, {
          userMessage: inputValue,
          recentPosts: state.posts.slice(-5),
          selectedNote: state.notes.find(n => n.id === selectedNoteId),
          threadId,
        });
        if (replyTarget) {
          response.parentId = replyTarget.id;
          response.threadId = threadId;
        }
        addPost(response);
        setIsGenerating(false);
        setGeneratingMember(null);
        return;
      }
    }

    // Default response logic based on mode
    if (state.mode === "debate") {
      await runAutonomousDebate(inputValue);
    } else if (state.mode !== "quiet") {
      setIsGenerating(true);
      const localPosts = [...state.posts];

      setGeneratingMember(state.activeMembers[0]);
      const response = await generateCouncilResponse(state.activeMembers[0], state.mode, {
        userMessage: inputValue,
        recentPosts: localPosts.slice(-5),
        selectedNote: state.notes.find(n => n.id === selectedNoteId),
      });
      addPost(response);
      setIsGenerating(false);
      setGeneratingMember(null);
    }
  };

  const buildRoundSteps = (activeMembers: OrishaName[]): RoundStep[] => {
    // Preferred members for each role, in priority order
    const framers: OrishaName[] = ["Orunmila", "Yemoja", "Oshun"];
    const challengers: OrishaName[] = ["Esu", "Sango", "Ochosi"];
    const builders: OrishaName[] = ["Ogun", "Ochosi", "Sango"];

    const pick = (preferred: OrishaName[], exclude: OrishaName[]): OrishaName => {
      const available = preferred.filter(m => activeMembers.includes(m) && !exclude.includes(m));
      if (available.length > 0) return available[0];
      const fallback = activeMembers.filter(m => !exclude.includes(m));
      return fallback.length > 0 ? fallback[0] : activeMembers[0];
    };

    const framer = pick(framers, []);
    const challenger = pick(challengers, [framer]);
    const builder = pick(builders, [framer, challenger]);
    // Synthesizer is always the framer (Orunmila ideally) to close the loop
    const synthesizer = framer;

    return [
      { phase: "frame", memberId: framer, label: "Setting the Frame", directive: `Set the strategic frame for this council round.` },
      { phase: "challenge", memberId: challenger, label: "Challenging the Frame", directive: `Challenge and probe the frame that was just set.` },
      { phase: "implement", memberId: builder, label: "Proposing Implementation", directive: `Propose a concrete implementation path.` },
      { phase: "synthesize", memberId: synthesizer, label: "Synthesizing", directive: `Synthesize the round into a final recommendation.` },
    ];
  };

  const runCouncilRound = async () => {
    if (state.activeMembers.length < 2) {
      alert("Activate at least 2 council members for a structured round.");
      return;
    }
    setIsGenerating(true);
    const topic = inputValue || "The current state of our research";
    const steps = buildRoundSteps(state.activeMembers);

    // Opening system post
    const phaseLabels = steps.map(s => `${s.memberId} (${s.label})`).join(" → ");
    const systemPost: Partial<Post> = {
      authorId: "user",
      authorName: "System",
      content: `Council Round: "${topic}"\n${phaseLabels}`,
    };
    addPost(systemPost);
    const localPosts = [...state.posts, { id: `temp-sys-${Date.now()}`, timestamp: Date.now(), ...systemPost } as Post];

    for (const step of steps) {
      setGeneratingMember(step.memberId);
      setCurrentRoundPhase(step.label);

      const response = await generateCouncilResponse(step.memberId, state.mode, {
        userMessage: topic,
        recentPosts: localPosts.slice(-8),
        selectedNote: state.notes.find(n => n.id === selectedNoteId),
        roundPhase: step.phase,
      });

      // Tag the post with its phase
      response.tags = [step.phase];

      const fullPost = { id: `temp-${Date.now()}-${step.phase}`, timestamp: Date.now(), ...response } as Post;
      localPosts.push(fullPost);
      addPost(response);
    }

    setIsGenerating(false);
    setGeneratingMember(null);
    setCurrentRoundPhase(null);
    setInputValue("");
  };

  const runRoundup = async () => {
    setIsGenerating(true);
    setGeneratingMember("Orunmila");
    const response = await generateCouncilResponse("Orunmila", "roundup", {
      recentPosts: state.posts.slice(-10),
      selectedNote: state.notes.find(n => n.id === selectedNoteId),
    });
    addPost(response);
    setIsGenerating(false);
    setGeneratingMember(null);
  };

  const runAutonomousDebate = async (userMessage: string) => {
    if (state.activeMembers.length < 2) {
      // Fall back to single response if only one member
      setIsGenerating(true);
      setGeneratingMember(state.activeMembers[0]);
      const response = await generateCouncilResponse(state.activeMembers[0], "debate", {
        userMessage,
        recentPosts: state.posts.slice(-5),
        selectedNote: state.notes.find(n => n.id === selectedNoteId),
      });
      addPost(response);
      setIsGenerating(false);
      setGeneratingMember(null);
      return;
    }

    setIsGenerating(true);
    const localPosts = [...state.posts];
    const members = [...state.activeMembers];

    // Phase 1: First member responds to the user's question
    const firstMember = members[0];
    setGeneratingMember(firstMember);
    setCurrentRoundPhase("Opening position");

    const firstResponse = await generateCouncilResponse(firstMember, "debate", {
      userMessage,
      recentPosts: localPosts.slice(-5),
      selectedNote: state.notes.find(n => n.id === selectedNoteId),
      debateDirective: `You are OPENING the debate. State your position clearly on the user's topic. Be direct and take a stance — the other council members will respond to you.`,
    });
    firstResponse.tags = ["opening"];
    const firstPost = { id: `temp-debate-${Date.now()}`, timestamp: Date.now(), ...firstResponse } as Post;
    localPosts.push(firstPost);
    addPost(firstResponse);

    // Phase 2: Remaining members auto-react in sequence
    let lastSpeaker = firstMember;
    for (let i = 1; i < members.length; i++) {
      const currentMember = members[i];
      const isLast = i === members.length - 1;

      setGeneratingMember(currentMember);
      setCurrentRoundPhase(isLast ? "Final word" : "Responding");

      const directive = isLast
        ? `You are delivering the FINAL WORD in this debate. ${lastSpeaker} just spoke. Read the full exchange above carefully.\nYour job is to:\n- Acknowledge the strongest point made so far.\n- State where you agree and where you diverge.\n- Leave the council with a clear, decisive closing thought.\nDo not simply summarize — take a position.`
        : `You are RESPONDING in a live debate. ${lastSpeaker} just spoke. Read their message above carefully.\nYour job is to:\n- Directly engage with what ${lastSpeaker} said — quote or reference specific points.\n- Challenge what you disagree with, or build on what you find compelling.\n- Add your own unique perspective based on your role and strengths.\nDo NOT repeat what was already said. Push the conversation forward.`;

      const response = await generateCouncilResponse(currentMember, "debate", {
        userMessage,
        recentPosts: localPosts.slice(-8),
        selectedNote: state.notes.find(n => n.id === selectedNoteId),
        debateDirective: directive,
      });

      response.tags = [isLast ? "closing" : "response"];
      const fullPost = { id: `temp-debate-${Date.now()}-${i}`, timestamp: Date.now(), ...response } as Post;
      localPosts.push(fullPost);
      addPost(response);
      lastSpeaker = currentMember;
    }

    setIsGenerating(false);
    setGeneratingMember(null);
    setCurrentRoundPhase(null);
  };

  const clearHistory = () => {
    if (!window.confirm("Are you sure you want to clear the chamber history? This cannot be undone.")) return;
    
    const localData = getLocalData();
    localData.posts = [];
    saveLocalData(localData);
    setState(prev => ({ ...prev, posts: [] }));
    setIsSettingsOpen(false);
  };

  // --- Knowledge Note CRUD ---
  const openNoteEditor = (note?: KnowledgeNote) => {
    if (note) {
      setEditingNote(note);
      setNoteForm({
        title: note.title,
        category: note.category || "",
        sourceType: note.sourceType || "",
        tags: note.tags?.join(", ") || "",
        content: note.content,
        citation: note.citation || "",
      });
    } else {
      setEditingNote(null);
      setNoteForm({ title: "", category: "", sourceType: "", tags: "", content: "", citation: "" });
    }
    setIsNoteEditorOpen(true);
  };

  const saveNote = () => {
    if (!noteForm.title.trim() || !noteForm.content.trim()) return;

    const noteData: Omit<KnowledgeNote, "id"> = {
      title: noteForm.title.trim(),
      category: noteForm.category.trim() || "General",
      sourceType: noteForm.sourceType.trim() || "Note",
      tags: noteForm.tags.split(",").map(t => t.trim()).filter(Boolean),
      content: noteForm.content.trim(),
      ...(noteForm.citation.trim() ? { citation: noteForm.citation.trim() } : {}),
    };

    const localData = getLocalData();
    if (editingNote) {
      const idx = localData.notes.findIndex((n: KnowledgeNote) => n.id === editingNote.id);
      if (idx >= 0) localData.notes[idx] = { ...noteData, id: editingNote.id };
    } else {
      localData.notes.push({ ...noteData, id: `note-${Date.now()}` });
    }
    saveLocalData(localData);
    setState(prev => ({ ...prev, notes: localData.notes }));

    setIsNoteEditorOpen(false);
    setEditingNote(null);
  };

  const deleteNote = (noteId: string) => {
    if (!window.confirm("Delete this knowledge note?")) return;

    const localData = getLocalData();
    localData.notes = localData.notes.filter((n: KnowledgeNote) => n.id !== noteId);
    saveLocalData(localData);
    setState(prev => ({ ...prev, notes: localData.notes }));

    if (selectedNoteId === noteId) setSelectedNoteId(null);
  };

  // --- Threaded helpers ---
  const rootPosts = state.posts.filter(p => !p.parentId);
  const getReplies = (postId: string) => state.posts.filter(p => p.parentId === postId);

  const getMemberPattern = (id: OrishaName) => {
    switch (id) {
      case "Ogun": return "pattern-grid";
      case "Esu": return "pattern-dots";
      case "Ochosi": return "pattern-grid opacity-20";
      case "Oshun": return "pattern-dots opacity-30";
      case "Yemoja": return "pattern-waves";
      case "Orunmila": return "pattern-grid opacity-10";
      case "Sango": return "pattern-dots opacity-50";
      default: return "";
    }
  };

  const renderPostBubble = (post: Post, isReply: boolean) => {
    const member = COUNCIL_MEMBERS[post.authorId as OrishaName];
    const isUser = post.authorId === "user";
    const isSystem = post.authorName === "System";

    return (
      <motion.div
        key={post.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={cn(
          "flex gap-3 lg:gap-5 max-w-4xl mx-auto group/post",
          isUser ? "flex-row-reverse" : "flex-row",
          isReply && "max-w-3xl"
        )}
      >
        <div className="flex-shrink-0">
          <div
            className={cn(
              "rounded-xl flex items-center justify-center border transition-all duration-500 relative overflow-hidden",
              isReply ? "w-8 h-8 lg:w-9 lg:h-9" : "w-10 h-10 lg:w-12 lg:h-12",
              isUser ? "bg-white text-black border-white" : "bg-chamber-panel border-chamber-border"
            )}
            style={!isUser && !isSystem ? { borderColor: member?.accentColor + "40", boxShadow: `0 0 20px ${member?.accentColor}10` } : {}}
          >
            {!isUser && !isSystem && (
              <>
                <div className={cn("absolute inset-0 opacity-10", getMemberPattern(member.id))} style={{ color: member.accentColor }} />
                <div className={cn("font-display font-bold relative z-10", isReply ? "text-sm" : "text-lg")} style={{ color: member?.accentColor }}>
                  {post.authorName[0]}
                </div>
              </>
            )}
            {isUser && <Users className={cn(isReply ? "w-4 h-4" : "w-5 h-5")} />}
            {isSystem && <Sparkles className={cn(isReply ? "w-4 h-4" : "w-5 h-5", "text-yellow-500")} />}
          </div>
        </div>

        <div className={cn("flex flex-col space-y-2 max-w-[85%]", isUser ? "items-end" : "items-start")}>
          <div className="flex items-center gap-3">
            {isReply && <CornerDownRight className="w-3 h-3 text-chamber-muted/50" />}
            <span className="text-[10px] lg:text-xs font-display font-bold tracking-wide uppercase">
              {post.authorName}
            </span>
            <span className="text-[9px] lg:text-[10px] text-chamber-muted">
              {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className={cn(
            "rounded-2xl text-sm leading-relaxed relative overflow-hidden",
            isReply ? "p-3 lg:p-4" : "p-4 lg:p-5",
            isUser
              ? "bg-white text-black rounded-tr-none"
              : "bg-chamber-panel border border-chamber-border rounded-tl-none"
          )}>
            {!isUser && !isSystem && (
              <div className={cn("absolute inset-0 opacity-[0.03] pointer-events-none", getMemberPattern(member.id))} style={{ color: member.accentColor }} />
            )}
            <div className="relative z-10">
              {post.content.split('\n').map((line, i) => (
                <p key={i} className={i > 0 ? "mt-2" : ""}>{line}</p>
              ))}
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className="mt-4 flex gap-2 relative z-10">
                {post.tags.map(tag => {
                  const phaseColors: Record<string, string> = {
                    frame: "bg-violet-500/20 text-violet-300 border-violet-500/30",
                    challenge: "bg-red-500/20 text-red-300 border-red-500/30",
                    implement: "bg-slate-500/20 text-slate-300 border-slate-500/30",
                    synthesize: "bg-amber-500/20 text-amber-300 border-amber-500/30",
                    opening: "bg-blue-500/20 text-blue-300 border-blue-500/30",
                    response: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                    closing: "bg-orange-500/20 text-orange-300 border-orange-500/30",
                  };
                  const isPhaseTag = tag in phaseColors;
                  return (
                    <span
                      key={tag}
                      className={cn(
                        "text-[9px] px-2 py-0.5 rounded-full border",
                        isPhaseTag
                          ? phaseColors[tag]
                          : "bg-white/10 border-transparent text-chamber-muted"
                      )}
                    >
                      {isPhaseTag ? tag.toUpperCase() : tag}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {!isSystem && !isReply && (
            <button
              onClick={() => setReplyTarget(post)}
              className="flex items-center gap-1.5 text-[9px] text-chamber-muted hover:text-white opacity-0 group-hover/post:opacity-100 transition-all uppercase tracking-widest"
            >
              <Reply className="w-3 h-3" />
              Reply
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-chamber-bg text-chamber-ink overflow-hidden font-sans relative">
      {/* Mobile Sidebar Overlays */}
      <AnimatePresence>
        {(isLeftSidebarOpen || isRightSidebarOpen) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setIsLeftSidebarOpen(false); setIsRightSidebarOpen(false); }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Left Sidebar: Knowledge Notes */}
      <aside className={cn(
        "fixed lg:relative inset-y-0 left-0 w-80 border-r border-chamber-border bg-chamber-panel flex flex-col z-50 transition-transform duration-300 lg:translate-x-0",
        isLeftSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-chamber-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-chamber-muted" />
            <h2 className="font-display font-medium tracking-tight">Knowledge Vault</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => openNoteEditor()}
              className="p-2 text-chamber-muted hover:text-white hover:bg-white/10 rounded-lg transition-all"
              title="Add Note"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button onClick={() => setIsLeftSidebarOpen(false)} className="lg:hidden p-2 text-chamber-muted">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-hide">
          {state.notes.map(note => (
            <div
              key={note.id}
              onClick={() => {
                setSelectedNoteId(selectedNoteId === note.id ? null : note.id);
                if (window.innerWidth < 1024) setIsLeftSidebarOpen(false);
              }}
              className={cn(
                "p-4 rounded-lg border transition-all cursor-pointer group relative",
                selectedNoteId === note.id
                  ? "bg-white/5 border-white/20"
                  : "border-chamber-border hover:border-chamber-muted/50"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-widest text-chamber-muted font-semibold">
                  {note.category}
                </span>
                <div className="flex items-center gap-1">
                  {selectedNoteId === note.id && <Sparkles className="w-3 h-3 text-yellow-500" />}
                  <button
                    onClick={(e) => { e.stopPropagation(); openNoteEditor(note); }}
                    className="p-1 text-chamber-muted hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                    title="Edit"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                    className="p-1 text-chamber-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <h3 className="text-sm font-medium mb-2 group-hover:text-white transition-colors">
                {note.title}
              </h3>
              <p className="text-xs text-chamber-muted line-clamp-2 leading-relaxed">
                {note.content}
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {note.tags?.map(tag => (
                  <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-chamber-border rounded text-chamber-muted">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {state.notes.length === 0 && (
            <div className="text-center py-8">
              <BookOpen className="w-8 h-8 text-chamber-muted/30 mx-auto mb-3" />
              <p className="text-xs text-chamber-muted">No notes yet</p>
              <button onClick={() => openNoteEditor()} className="mt-2 text-[10px] text-white/60 hover:text-white underline">
                Add your first note
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content: Chamber Feed */}
      <main className="flex-1 flex flex-col relative min-w-0">
        <header className="h-20 border-b border-chamber-border flex items-center justify-between px-4 lg:px-8 bg-chamber-bg/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3 lg:gap-4">
            <button onClick={() => setIsLeftSidebarOpen(true)} className="lg:hidden p-2 text-chamber-muted">
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-chamber-border to-chamber-panel flex items-center justify-center border border-white/10">
              <Shield className="w-4 h-4 lg:w-5 lg:h-5 text-white/50" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-display text-lg lg:text-xl font-bold tracking-tight">Council Chamber</h1>
              <p className="text-[10px] text-chamber-muted uppercase tracking-[0.2em]">Sanctum of Discernment</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-chamber-panel p-1 rounded-full border border-chamber-border">
            {(["quiet", "debate", "roundup"] as InteractionMode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "px-2 lg:px-4 py-1 lg:py-1.5 rounded-full text-[9px] lg:text-[10px] uppercase tracking-widest font-bold transition-all",
                  state.mode === m 
                    ? "bg-white text-black shadow-lg" 
                    : "text-chamber-muted hover:text-chamber-ink"
                )}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setIsManualOpen(true)} className="p-2 text-chamber-muted hover:text-white transition-colors" title="Manual & Guide">
              <HelpCircle className="w-5 h-5" />
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-chamber-muted hover:text-white transition-colors" title="Settings">
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={() => setIsRightSidebarOpen(true)} className="lg:hidden p-2 text-chamber-muted">
              <Users className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8 scroll-hide">
          <AnimatePresence initial={false}>
            {rootPosts.map((post) => {
              const replies = getReplies(post.id);
              return (
                <React.Fragment key={post.id}>
                  {renderPostBubble(post, false)}
                  {replies.length > 0 && (
                    <div className="ml-10 lg:ml-16 border-l-2 border-chamber-border/40 pl-4 lg:pl-6 space-y-6">
                      {replies.map(reply => renderPostBubble(reply, true))}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </AnimatePresence>
          <div ref={feedEndRef} />
          
          {state.posts.length === 0 && (
            <div className="text-center py-20">
              <Shield className="w-16 h-16 text-chamber-muted/20 mx-auto mb-6" />
              <h3 className="text-xl font-display font-bold mb-2">The Chamber Awaits</h3>
              <p className="text-chamber-muted max-w-md mx-auto leading-relaxed">
                The council is assembled. Pose a question to begin the deliberation, or summon a specific member with @Name.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {state.activeMembers.map(memberId => {
                  const member = COUNCIL_MEMBERS[memberId];
                  return (
                    <button
                      key={memberId}
                      onClick={() => setInputValue(`@${member.name} `)}
                      className="px-3 py-1.5 rounded-full text-xs border border-chamber-border hover:border-chamber-muted/50 hover:bg-white/5 transition-all"
                      style={{ borderColor: member.accentColor + "40" }}
                    >
                      @{member.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 lg:p-6 bg-chamber-bg border-t border-chamber-border">
          {replyTarget && (
            <div className="max-w-4xl mx-auto mb-3 flex items-center gap-2 text-xs text-chamber-muted">
              <CornerDownRight className="w-3 h-3" />
              <span>Replying to {replyTarget.authorName}</span>
              <button onClick={() => setReplyTarget(null)} className="text-white/60 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          
          {selectedNoteId && (
            <div className="max-w-4xl mx-auto mb-3 flex items-center gap-2 text-xs">
              <BookOpen className="w-3 h-3 text-yellow-500" />
              <span className="text-chamber-muted">Referencing: {state.notes.find(n => n.id === selectedNoteId)?.title}</span>
              <button onClick={() => setSelectedNoteId(null)} className="text-white/60 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          
          <div className="max-w-4xl mx-auto flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={state.mode === "debate" ? "Pose a question for debate..." : "Address the council..."}
              className="flex-1 bg-chamber-panel border border-chamber-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition-colors"
              disabled={isGenerating}
            />
            <button
              onClick={handleSend}
              disabled={isGenerating || !inputValue.trim()}
              className="px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
                  />
                  <span className="hidden sm:inline">
                    {generatingMember ? `${generatingMember}...` : "Thinking..."}
                  </span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </button>
          </div>
          
          {state.mode === "debate" && (
            <div className="max-w-4xl mx-auto mt-3 flex gap-2">
              <button
                onClick={runCouncilRound}
                disabled={isGenerating}
                className="px-4 py-2 bg-chamber-panel border border-chamber-border rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all disabled:opacity-50"
              >
                Run Council Round
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Right Sidebar: Council Members */}
      <aside className={cn(
        "fixed lg:relative inset-y-0 right-0 w-72 border-l border-chamber-border bg-chamber-panel flex flex-col z-50 transition-transform duration-300 lg:translate-x-0",
        isRightSidebarOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="p-6 border-b border-chamber-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-chamber-muted" />
            <h2 className="font-display font-medium tracking-tight">Council</h2>
          </div>
          <button onClick={() => setIsRightSidebarOpen(false)} className="lg:hidden p-2 text-chamber-muted">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {(Object.values(COUNCIL_MEMBERS) as typeof COUNCIL_MEMBERS[OrishaName][]).map((member) => (
            <div
              key={member.id}
              onClick={() => toggleMember(member.id)}
              className={cn(
                "p-4 rounded-lg border transition-all cursor-pointer group",
                state.activeMembers.includes(member.id)
                  ? "bg-white/5 border-white/20"
                  : "border-chamber-border opacity-50 hover:opacity-75"
              )}
            >
              <div className="flex items-start gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold text-lg flex-shrink-0"
                  style={{ 
                    backgroundColor: member.accentColor + "20",
                    color: member.accentColor,
                    border: `1px solid ${member.accentColor}40`
                  }}
                >
                  {member.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-sm">{member.name}</h3>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      state.activeMembers.includes(member.id) ? "bg-emerald-500" : "bg-chamber-border"
                    )} />
                  </div>
                  <p className="text-[10px] text-chamber-muted uppercase tracking-wider">{member.role}</p>
                  <p className="text-xs text-chamber-muted mt-1 line-clamp-2">{member.temperament}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-chamber-border space-y-2">
          <button
            onClick={runRoundup}
            disabled={isGenerating || state.posts.length === 0}
            className="w-full py-3 bg-chamber-border hover:bg-white/10 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Summon Roundup
          </button>
          <p className="text-[10px] text-chamber-muted text-center">
            Active: {state.activeMembers.length} / {Object.keys(COUNCIL_MEMBERS).length}
          </p>
        </div>
      </aside>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsSettingsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-chamber-panel border border-chamber-border rounded-2xl p-6 max-w-sm w-full"
            >
              <h2 className="font-display text-xl font-bold mb-6">Chamber Settings</h2>
              
              <div className="space-y-4">
                <button
                  onClick={clearHistory}
                  className="w-full py-3 px-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-bold hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Trash className="w-4 h-4" />
                  Clear History
                </button>
              </div>
              
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="w-full mt-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-white/90 transition-all"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Note Editor Modal */}
      <AnimatePresence>
        {isNoteEditorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsNoteEditorOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-chamber-panel border border-chamber-border rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              <h2 className="font-display text-xl font-bold mb-6">
                {editingNote ? "Edit Note" : "New Note"}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-chamber-muted font-bold">Title</label>
                  <input
                    type="text"
                    value={noteForm.title}
                    onChange={e => setNoteForm({ ...noteForm, title: e.target.value })}
                    className="w-full mt-1 bg-chamber-bg border border-chamber-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                    placeholder="Note title..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-chamber-muted font-bold">Category</label>
                    <input
                      type="text"
                      value={noteForm.category}
                      onChange={e => setNoteForm({ ...noteForm, category: e.target.value })}
                      className="w-full mt-1 bg-chamber-bg border border-chamber-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                      placeholder="General"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-chamber-muted font-bold">Source Type</label>
                    <input
                      type="text"
                      value={noteForm.sourceType}
                      onChange={e => setNoteForm({ ...noteForm, sourceType: e.target.value })}
                      className="w-full mt-1 bg-chamber-bg border border-chamber-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                      placeholder="Note"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs uppercase tracking-wider text-chamber-muted font-bold">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={noteForm.tags}
                    onChange={e => setNoteForm({ ...noteForm, tags: e.target.value })}
                    className="w-full mt-1 bg-chamber-bg border border-chamber-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
                
                <div>
                  <label className="text-xs uppercase tracking-wider text-chamber-muted font-bold">Content</label>
                  <textarea
                    value={noteForm.content}
                    onChange={e => setNoteForm({ ...noteForm, content: e.target.value })}
                    rows={6}
                    className="w-full mt-1 bg-chamber-bg border border-chamber-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30 resize-none"
                    placeholder="Note content..."
                  />
                </div>
                
                <div>
                  <label className="text-xs uppercase tracking-wider text-chamber-muted font-bold">Citation (optional)</label>
                  <input
                    type="text"
                    value={noteForm.citation}
                    onChange={e => setNoteForm({ ...noteForm, citation: e.target.value })}
                    className="w-full mt-1 bg-chamber-bg border border-chamber-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                    placeholder="Source citation..."
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsNoteEditorOpen(false)}
                  className="flex-1 py-3 bg-chamber-border rounded-xl font-bold text-sm hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={saveNote}
                  disabled={!noteForm.title.trim() || !noteForm.content.trim()}
                  className="flex-1 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Manual Modal */}
      <UserManual isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />
    </div>
  );
}
