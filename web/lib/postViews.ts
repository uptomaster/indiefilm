import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";

const COLLECTION = "postViewCounts";

/**
 * 게시글 조회수 증가 (누구나 호출 가능)
 */
export async function incrementPostViews(postId: string): Promise<void> {
  const ref = doc(db, COLLECTION, postId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, { count: increment(1) });
  } else {
    await setDoc(ref, { count: 1 });
  }
}

/**
 * 게시글 조회수 조회 (post.views와 합산용)
 */
export async function getPostViewCount(postId: string): Promise<number> {
  const ref = doc(db, COLLECTION, postId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data()?.count ?? 0 : 0;
}
