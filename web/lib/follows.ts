import {
  collection,
  query,
  where,
  getDocs,
  getCountFromServer,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

function followDocId(followerId: string, followingId: string) {
  return `${followerId}_${followingId}`;
}

/**
 * 팔로우 여부 확인
 */
export async function checkFollowing(followerId: string, followingId: string): Promise<boolean> {
  if (followerId === followingId) return false;
  const docRef = doc(db, "follows", followDocId(followerId, followingId));
  const snap = await getDoc(docRef);
  return snap.exists();
}

/**
 * 팔로우 토글
 */
export async function toggleFollow(followerId: string, followingId: string): Promise<boolean> {
  if (followerId === followingId) return false;

  const docId = followDocId(followerId, followingId);
  const docRef = doc(db, "follows", docId);
  const snap = await getDoc(docRef);

  if (snap.exists()) {
    await deleteDoc(docRef);
    return false;
  } else {
    await setDoc(docRef, {
      followerId,
      followingId,
      createdAt: serverTimestamp(),
    });
    return true;
  }
}

/**
 * 사용자 팔로워 수 (대략적, 캐시용)
 */
export async function getFollowerCount(userId: string): Promise<number> {
  const q = query(
    collection(db, "follows"),
    where("followingId", "==", userId)
  );
  const snap = await getCountFromServer(q);
  return snap.data().count;
}
