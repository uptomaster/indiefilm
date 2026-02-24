import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

function bookmarkDocId(userId: string, postId: string) {
  return `${userId}_${postId}`;
}

/**
 * 북마크 여부 확인
 */
export async function checkBookmarked(userId: string, postId: string): Promise<boolean> {
  const docRef = doc(db, "userBookmarks", bookmarkDocId(userId, postId));
  const snap = await getDoc(docRef);
  return snap.exists();
}

/**
 * 북마크 토글
 */
export async function toggleBookmark(userId: string, postId: string): Promise<boolean> {
  const docId = bookmarkDocId(userId, postId);
  const docRef = doc(db, "userBookmarks", docId);
  const snap = await getDoc(docRef);

  if (snap.exists()) {
    await deleteDoc(docRef);
    return false;
  } else {
    await setDoc(docRef, {
      userId,
      postId,
      createdAt: serverTimestamp(),
    });
    return true;
  }
}
