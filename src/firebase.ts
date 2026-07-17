import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  User
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDoc,
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp
} from "firebase/firestore";
import { Book } from "./types";

import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

// Sign in with Google
export async function loginWithGoogle() {
  googleProvider.setCustomParameters({ prompt: "select_account" });
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.warn("Google signInWithPopup failed/blocked, attempting redirect fallback...", error);
    try {
      await signInWithRedirect(auth, googleProvider);
      return null; // Page will redirect; onAuthStateChanged will handle the returned session
    } catch (redirectError: any) {
      console.error("Google signInWithRedirect also failed:", redirectError);
      throw redirectError;
    }
  }
}

// Sign in Anonymously (Demo fallback for Iframe restrictions)
export async function loginAnonymously() {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error: any) {
    console.error("Error signing in anonymously:", error);
    throw error;
  }
}

// Register with Email and Password
export async function registerWithEmail(email: string, password: string) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error: any) {
    console.error("Error registering with email/password:", error);
    throw error;
  }
}

// Login with Email and Password
export async function loginWithEmail(email: string, password: string) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error: any) {
    console.error("Error logging in with email/password:", error);
    throw error;
  }
}

// Sign out
export function logoutUser() {
  return signOut(auth);
}

// Firestore operations for Books
export async function getBooksByUserId(userId: string): Promise<Book[]> {
  try {
    const booksRef = collection(db, "books");
    const q = query(
      booksRef, 
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    const booksList: Book[] = [];
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      booksList.push({
        id: docSnap.id as any, // Cast to any to handle type overlap or update types.ts
        reader_id: 1, // Keep legacy fields compatible
        title: data.title,
        author: data.author,
        pages: data.pages,
        cover_url: data.cover_url,
        start_date: data.start_date,
        end_date: data.end_date,
        genre: data.genre,
        notes: data.notes,
        ratings: data.ratings || [],
        created_at: data.createdAt?.toDate?.()?.toISOString() || ""
      });
    });
    
    return booksList;
  } catch (error) {
    console.error("Error fetching books from Firestore:", error);
    // If order-by fails because index is compiling, fallback to query without ordering
    try {
      const booksRef = collection(db, "books");
      const q = query(booksRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const booksList: Book[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        booksList.push({
          id: docSnap.id as any,
          reader_id: 1,
          title: data.title,
          author: data.author,
          pages: data.pages,
          cover_url: data.cover_url,
          start_date: data.start_date,
          end_date: data.end_date,
          genre: data.genre,
          notes: data.notes,
          ratings: data.ratings || [],
          created_at: data.createdAt?.toDate?.()?.toISOString() || ""
        });
      });
      return booksList;
    } catch (fallbackError) {
      console.error("Fallback fetch also failed:", fallbackError);
      return [];
    }
  }
}

export async function addBook(userId: string, bookData: Omit<Book, "id">): Promise<string> {
  const booksRef = collection(db, "books");
  const docRef = await addDoc(booksRef, {
    userId,
    title: bookData.title,
    author: bookData.author,
    pages: bookData.pages ? Number(bookData.pages) : null,
    cover_url: bookData.cover_url || "",
    start_date: bookData.start_date || "",
    end_date: bookData.end_date || "",
    genre: bookData.genre || "",
    notes: bookData.notes || "",
    ratings: bookData.ratings || [],
    createdAt: Timestamp.now()
  });
  return docRef.id;
}

export async function updateBook(bookId: string, bookData: Partial<Book>): Promise<void> {
  const bookRef = doc(db, "books", bookId);
  await updateDoc(bookRef, {
    title: bookData.title,
    author: bookData.author,
    pages: bookData.pages ? Number(bookData.pages) : null,
    cover_url: bookData.cover_url || "",
    start_date: bookData.start_date || "",
    end_date: bookData.end_date || "",
    genre: bookData.genre || "",
    notes: bookData.notes || "",
    ratings: bookData.ratings || [],
    updatedAt: Timestamp.now()
  });
}

export async function deleteBook(bookId: string): Promise<void> {
  const bookRef = doc(db, "books", bookId);
  await deleteDoc(bookRef);
}

export async function getCommunityBooks(): Promise<any[]> {
  try {
    const booksRef = collection(db, "books");
    const querySnapshot = await getDocs(booksRef);
    const list: any[] = [];
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        userId: data.userId || "",
        title: data.title || "Libro sin título",
        author: data.author || "Autor Desconocido",
        cover_url: data.cover_url || "",
        genre: data.genre || "",
        start_date: data.start_date || "",
        end_date: data.end_date || "",
        notes: data.notes || "",
        ratings: data.ratings || [],
        createdAt: data.createdAt?.toDate?.() || new Date()
      });
    });
    
    // Sort in memory by createdAt descending
    list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return list;
  } catch (error) {
    console.error("Error fetching community books:", error);
    return [];
  }
}
