import {
  collection,
  query,
  where,
  getCountFromServer,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

function likeDocId(postId: string, userId: string) {
  return `${postId}_${userId}`;
}

/**
 * 게시글 좋아요 수 조회
 */
export async function getPostLikeCount(postId: string): Promise<number> {
  const q = query(
    collection(db, "postLikes"),
    where("postId", "==", postId)
  );
  const snap = await getCountFromServer(q);
  return snap.data().count;
}

/**
 * 현재 사용자가 해당 게시글을 좋아요 했는지 확인
 */
export async function checkPostLiked(postId: string, userId: string): Promise<boolean> {
  const docRef = doc(db, "postLikes", likeDocId(postId, userId));
  const snap = await getDoc(docRef);
  return snap.exists();
}

/**
 * 게시글 좋아요 토글
 */
export async function togglePostLike(postId: string, userId: string): Promise<boolean> {
  const docId = likeDocId(postId, userId);
  const docRef = doc(db, "postLikes", docId);
  const snap = await getDoc(docRef);

  if (snap.exists()) {
    await deleteDoc(docRef);
    return false;
  } else {
    await setDoc(docRef, {
      postId,
      userId,
      createdAt: serverTimestamp(),
    });
    return true;
  }
}
