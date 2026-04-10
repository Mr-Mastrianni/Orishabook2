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
  orderBy,
  limit,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
  SnapshotOptions,
  FirestoreDataConverter,
  writeBatch,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { Post, KnowledgeNote, InteractionMode, OrishaName, CouncilConfig } from "./council/types";
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
const configDoc = doc(db, "config", "council");

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
};

export async function getConfig(): Promise<CouncilConfig> {
  try {
    const snapshot = await getDoc(configDoc);
    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        mode: data.mode || DEFAULT_CONFIG.mode,
        model: data.model || DEFAULT_CONFIG.model,
        activeMembers: data.activeMembers || DEFAULT_CONFIG.activeMembers,
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
