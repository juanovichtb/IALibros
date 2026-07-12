import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously,
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

// Firebase configuration from the auto-provisioned file
const firebaseConfig = {
  apiKey: "AIzaSyBtj7thPax9t4CtTEPuQ5Ui3Z9VajGPAcU",
  authDomain: "yogic-tangent-37c1c.firebaseapp.com",
  projectId: "yogic-tangent-37c1c",
  storageBucket: "yogic-tangent-37c1c.firebasestorage.app",
  messagingSenderId: "491174110947",
  appId: "1:491174110947:web:994822ff9c7a6a3e8f87d6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Sign in with Google
export async function loginWithGoogle() {
  googleProvider.setCustomParameters({ prompt: "select_account" });
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    throw error;
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
