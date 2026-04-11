import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
  runTransaction,
  DocumentData,
  QueryDocumentSnapshot,
  SnapshotOptions,
  FirestoreDataConverter,
  writeBatch,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import {
  Post,
  KnowledgeNote,
  CouncilConfig,
  Resonance,
  ChamberMembership,
  Save,
  DEFAULT_PREFERENCES,
  DefaultView,
} from "./council/types";
import { SEED_NOTES } from "../data/notes";

// ============================================================================
// Firestore Data Converters
// ============================================================================

const postConverter: FirestoreDataConverter<Post> = {
  toFirestore(post: Post): DocumentData {
    return {
      authorId: post.authorId,
      authorName: post.authorName,
      content: post.content,
      timestamp: post.timestamp,
      tags: post.tags || [],
      threadId: post.threadId || null,
      parentId: post.parentId || null,
      referencedNoteId: post.referencedNoteId || null,
      title: post.title || null,
      type: post.type || "user_prompted",
      chamberId: post.chamberId || null,
      resonanceCount: post.resonanceCount ?? 0,
      replyCount: post.replyCount ?? 0,
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Post {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      authorId: data.authorId,
      authorName: data.authorName,
      content: data.content,
      timestamp: data.timestamp,
      tags: data.tags || [],
      threadId: data.threadId,
      parentId: data.parentId,
      referencedNoteId: data.referencedNoteId,
      title: data.title || undefined,
      type: data.type || "user_prompted",
      chamberId: data.chamberId || undefined,
      resonanceCount: data.resonanceCount ?? 0,
      replyCount: data.replyCount ?? 0,
    };
  },
};

const resonanceConverter: FirestoreDataConverter<Resonance> = {
  toFirestore(resonance: Resonance): DocumentData {
    return {
      userId: resonance.userId,
      postId: resonance.postId,
      value: resonance.value,
      timestamp: resonance.timestamp,
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Resonance {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      userId: data.userId,
      postId: data.postId,
      value: data.value,
      timestamp: data.timestamp,
    };
  },
};

const saveConverter: FirestoreDataConverter<Save> = {
  toFirestore(save: Save): DocumentData {
    return {
      userId: save.userId,
      postId: save.postId,
      savedAt: save.savedAt,
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Save {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      userId: data.userId,
      postId: data.postId,
      savedAt: data.savedAt,
    };
  },
};

const membershipConverter: FirestoreDataConverter<ChamberMembership> = {
  toFirestore(m: ChamberMembership): DocumentData {
    return {
      userId: m.userId,
      chamberId: m.chamberId,
      joinedAt: m.joinedAt,
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): ChamberMembership {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      userId: data.userId,
      chamberId: data.chamberId,
      joinedAt: data.joinedAt,
    };
  },
};

const noteConverter: FirestoreDataConverter<KnowledgeNote> = {
  toFirestore(note: KnowledgeNote): DocumentData {
    return {
      title: note.title,
      category: note.category,
      sourceType: note.sourceType,
      tags: note.tags || [],
      content: note.content,
      citation: note.citation || null,
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): KnowledgeNote {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      title: data.title,
      category: data.category,
      sourceType: data.sourceType,
      tags: data.tags || [],
      content: data.content,
      citation: data.citation,
    };
  },
};

// ============================================================================
// Collection References
// ============================================================================

const postsCollection = collection(db, "posts").withConverter(postConverter);
const notesCollection = collection(db, "notes").withConverter(noteConverter);
const resonancesCollection = collection(db, "resonances").withConverter(resonanceConverter);
const membershipsCollection = collection(db, "chamber_memberships").withConverter(membershipConverter);
const savesCollection = collection(db, "saves").withConverter(saveConverter);
const configDoc = doc(db, "config", "council");

function resonanceDocId(userId: string, postId: string): string {
  return `${userId}_${postId}`;
}

function membershipDocId(userId: string, chamberId: string): string {
  return `${userId}_${chamberId}`;
}

function saveDocId(userId: string, postId: string): string {
  return `${userId}_${postId}`;
}

// ============================================================================
// Posts API
// ============================================================================

export async function getPosts(postsLimit: number = 100): Promise<Post[]> {
  try {
    const q = query(
      postsCollection,
      orderBy("timestamp", "asc"),
      limit(postsLimit)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "posts");
    return [];
  }
}

export async function addPost(post: Omit<Post, "id">): Promise<Post> {
  try {
    const docRef = await addDoc(postsCollection, post);
    return { ...post, id: docRef.id };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, "posts");
    throw error;
  }
}

export async function updatePost(
  postId: string,
  updates: Partial<Omit<Post, "id">>
): Promise<void> {
  try {
    const postRef = doc(db, "posts", postId).withConverter(postConverter);
    await updateDoc(postRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
    throw error;
  }
}

export async function deletePost(postId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "posts", postId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `posts/${postId}`);
    throw error;
  }
}

export async function clearAllPosts(): Promise<void> {
  try {
    const snapshot = await getDocs(postsCollection);
    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, "posts");
    throw error;
  }
}

// ============================================================================
// Knowledge Notes API
// ============================================================================

export async function getNotes(): Promise<KnowledgeNote[]> {
  try {
    const q = query(notesCollection, orderBy("title", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "notes");
    return [];
  }
}

export async function addNote(
  note: Omit<KnowledgeNote, "id">
): Promise<KnowledgeNote> {
  try {
    const docRef = await addDoc(notesCollection, note);
    return { ...note, id: docRef.id };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, "notes");
    throw error;
  }
}

export async function updateNote(
  noteId: string,
  updates: Partial<Omit<KnowledgeNote, "id">>
): Promise<void> {
  try {
    const noteRef = doc(db, "notes", noteId).withConverter(noteConverter);
    await updateDoc(noteRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `notes/${noteId}`);
    throw error;
  }
}

export async function deleteNote(noteId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "notes", noteId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `notes/${noteId}`);
    throw error;
  }
}

// ============================================================================
// Council Config API
// ============================================================================

const DEFAULT_CONFIG: CouncilConfig = {
  mode: "quiet",
  model: "nvidia/nemotron-3-super-120b-a12b:free",
  activeMembers: ["Orunmila", "Esu", "Ogun", "Ochosi", "Oshun", "Yemoja", "Sango"],
  ...DEFAULT_PREFERENCES,
};

export async function getConfig(): Promise<CouncilConfig> {
  try {
    const snapshot = await getDoc(configDoc);
    if (snapshot.exists()) {
      const data = snapshot.data();
      // Fallback per-field so old config docs without Phase 6 preferences
      // still hydrate cleanly without a migration step.
      return {
        mode: data.mode || DEFAULT_CONFIG.mode,
        model: data.model || DEFAULT_CONFIG.model,
        activeMembers: data.activeMembers || DEFAULT_CONFIG.activeMembers,
        heartbeatIntervalMinutes:
          typeof data.heartbeatIntervalMinutes === "number"
            ? data.heartbeatIntervalMinutes
            : DEFAULT_CONFIG.heartbeatIntervalMinutes,
        autoReplyProbability:
          typeof data.autoReplyProbability === "number"
            ? data.autoReplyProbability
            : DEFAULT_CONFIG.autoReplyProbability,
        defaultView: (["chat", "archive", "chambers"] as DefaultView[]).includes(data.defaultView)
          ? (data.defaultView as DefaultView)
          : DEFAULT_CONFIG.defaultView,
        creativity:
          typeof data.creativity === "number"
            ? data.creativity
            : DEFAULT_CONFIG.creativity,
      };
    }
    // Create default config if it doesn't exist
    await setDoc(configDoc, DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, "config/council");
    return DEFAULT_CONFIG;
  }
}

export async function updateConfig(
  updates: Partial<CouncilConfig>
): Promise<void> {
  try {
    await updateDoc(configDoc, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, "config/council");
    throw error;
  }
}

// ============================================================================
// Resonance API
// ============================================================================

/**
 * Fetch all resonances a user has cast. Used to rehydrate vote state on load.
 */
export async function getUserResonances(userId: string): Promise<Resonance[]> {
  try {
    const q = query(resonancesCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "resonances");
    return [];
  }
}

/**
 * Cast, change, or remove a resonance on a post.
 *
 * - `value: 1` — upvote (resonate)
 * - `value: -1` — downvote
 * - `value: 0` — clear an existing vote
 *
 * Uses a transaction to keep the denormalized `resonanceCount` on the post
 * doc consistent with the resonance doc state, so the archive feed can sort
 * by score without aggregating on every read.
 *
 * Returns the post's new `resonanceCount` so callers can update local state
 * without a re-fetch.
 */
export async function setResonance(
  userId: string,
  postId: string,
  value: 1 | -1 | 0
): Promise<number> {
  const resId = resonanceDocId(userId, postId);
  const resRef = doc(db, "resonances", resId).withConverter(resonanceConverter);
  const postRef = doc(db, "posts", postId).withConverter(postConverter);

  try {
    return await runTransaction(db, async (tx) => {
      const [resSnap, postSnap] = await Promise.all([
        tx.get(resRef),
        tx.get(postRef),
      ]);

      const prevValue: number = resSnap.exists() ? resSnap.data().value : 0;
      const delta = value - prevValue;
      const currentCount = postSnap.exists() ? (postSnap.data().resonanceCount ?? 0) : 0;
      const newCount = currentCount + delta;

      if (value === 0) {
        if (resSnap.exists()) tx.delete(resRef);
      } else {
        tx.set(resRef, {
          id: resId,
          userId,
          postId,
          value: value as 1 | -1,
          timestamp: Date.now(),
        });
      }

      if (delta !== 0 && postSnap.exists()) {
        tx.update(postRef, { resonanceCount: increment(delta) });
      }

      return newCount;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `resonances/${resId}`);
    throw error;
  }
}

// ============================================================================
// Chamber Membership API
// ============================================================================

/** All chambers the given user has joined. */
export async function getUserMemberships(userId: string): Promise<ChamberMembership[]> {
  try {
    const q = query(membershipsCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "chamber_memberships");
    return [];
  }
}

/** Count of members that have joined a given chamber. */
export async function getChamberMemberCount(chamberId: string): Promise<number> {
  try {
    const q = query(membershipsCollection, where("chamberId", "==", chamberId));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `chamber_memberships:${chamberId}`);
    return 0;
  }
}

export async function joinChamber(userId: string, chamberId: string): Promise<void> {
  try {
    const id = membershipDocId(userId, chamberId);
    const ref = doc(db, "chamber_memberships", id).withConverter(membershipConverter);
    await setDoc(ref, {
      id,
      userId,
      chamberId,
      joinedAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `chamber_memberships/${chamberId}`);
    throw error;
  }
}

export async function leaveChamber(userId: string, chamberId: string): Promise<void> {
  try {
    const id = membershipDocId(userId, chamberId);
    await deleteDoc(doc(db, "chamber_memberships", id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `chamber_memberships/${chamberId}`);
    throw error;
  }
}

// ============================================================================
// Save (Bookmark) API
// ============================================================================

export async function getUserSaves(userId: string): Promise<Save[]> {
  try {
    const q = query(savesCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "saves");
    return [];
  }
}

/**
 * Toggle a save for (userId, postId). Returns the new saved state.
 */
export async function toggleSave(
  userId: string,
  postId: string,
  nextSaved: boolean
): Promise<boolean> {
  try {
    const id = saveDocId(userId, postId);
    const ref = doc(db, "saves", id).withConverter(saveConverter);
    if (nextSaved) {
      await setDoc(ref, { id, userId, postId, savedAt: Date.now() });
    } else {
      await deleteDoc(ref);
    }
    return nextSaved;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `saves/${postId}`);
    throw error;
  }
}

// ============================================================================
// Initialization
// ============================================================================

export async function initializeData(): Promise<{
  posts: Post[];
  notes: KnowledgeNote[];
  config: CouncilConfig;
}> {
  try {
    const [posts, notes, config] = await Promise.all([
      getPosts(),
      getNotes(),
      getConfig(),
    ]);

    // Seed notes if empty
    if (notes.length === 0) {
      const batch = writeBatch(db);
      for (const seedNote of SEED_NOTES) {
        const noteRef = doc(notesCollection);
        batch.set(noteRef, { ...seedNote, id: noteRef.id });
        notes.push({ ...seedNote, id: noteRef.id });
      }
      await batch.commit();
    }

    return { posts, notes, config };
  } catch (error) {
    console.error("Failed to initialize data:", error);
    // Fallback to empty state
    return {
      posts: [],
      notes: SEED_NOTES.map((n, i) => ({ ...n, id: `note-${i}` })),
      config: DEFAULT_CONFIG,
    };
  }
}
