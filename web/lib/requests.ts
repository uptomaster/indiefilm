import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  orderBy,
  onSnapshot,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

export type RequestType = "movie_application" | "actor_casting";
export type RequestStatus = "pending" | "accepted" | "rejected";

export interface Request {
  id: string;
  type: RequestType;
  fromUserId: string;
  toUserId: string;
  movieId?: string;
  actorId?: string;
  message: string;
  status: RequestStatus;
  createdAt: any;
  updatedAt: any;
  read: boolean;
}

export interface ChatMessage {
  id: string;
  requestId: string;
  userId: string;
  message: string;
  fromUserId?: string; // 부모 요청의 fromUserId (권한 검사용)
  toUserId?: string; // 부모 요청의 toUserId (권한 검사용)
  createdAt: any;
}

/**
 * 받은 요청 가져오기
 */
export async function getReceivedRequests(userId: string): Promise<Request[]> {
  // 인덱스 없이 작동하도록 orderBy 제거하고 클라이언트에서 정렬
  const q = query(
    collection(db, "requests"),
    where("toUserId", "==", userId)
  );

  const snapshot = await getDocs(q);
  const requests: Request[] = [];

  snapshot.forEach((docSnapshot) => {
    requests.push({
      id: docSnapshot.id,
      ...docSnapshot.data(),
    } as Request);
  });

  // 클라이언트 사이드에서 정렬 (최신순)
  requests.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || a.createdAt || 0;
    const bTime = b.createdAt?.toMillis?.() || b.createdAt || 0;
    return bTime - aTime; // 내림차순 (최신순)
  });

  return requests;
}

/**
 * 보낸 요청 가져오기
 */
export async function getSentRequests(userId: string): Promise<Request[]> {
  // 인덱스 없이 작동하도록 orderBy 제거하고 클라이언트에서 정렬
  const q = query(
    collection(db, "requests"),
    where("fromUserId", "==", userId)
  );

  const snapshot = await getDocs(q);
  const requests: Request[] = [];

  snapshot.forEach((docSnapshot) => {
    requests.push({
      id: docSnapshot.id,
      ...docSnapshot.data(),
    } as Request);
  });

  // 클라이언트 사이드에서 정렬 (최신순)
  requests.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || a.createdAt || 0;
    const bTime = b.createdAt?.toMillis?.() || b.createdAt || 0;
    return bTime - aTime; // 내림차순 (최신순)
  });

  return requests;
}

/**
 * 요청 가져오기 (ID로)
 */
export async function getRequestById(requestId: string): Promise<Request | null> {
  const docRef = doc(db, "requests", requestId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as Request;
}

/**
 * 요청 상태 업데이트
 */
export async function updateRequestStatus(
  requestId: string,
  status: RequestStatus
): Promise<void> {
  const requestRef = doc(db, "requests", requestId);
  await updateDoc(requestRef, {
    status,
    updatedAt: serverTimestamp(),
    read: false,
  });
}

/**
 * 요청 읽음 처리
 */
export async function markRequestAsRead(requestId: string): Promise<void> {
  const requestRef = doc(db, "requests", requestId);
  await updateDoc(requestRef, {
    read: true,
  });
}

/**
 * 채팅 메시지 전송
 */
export async function sendChatMessage(
  requestId: string,
  userId: string,
  message: string
): Promise<void> {
  // 부모 요청 정보를 가져와서 메시지에 포함 (권한 검사용)
  const request = await getRequestById(requestId);
  if (!request) {
    throw new Error("요청을 찾을 수 없습니다.");
  }

  await addDoc(collection(db, "requests", requestId, "messages"), {
    userId,
    message: message.trim(),
    fromUserId: request.fromUserId,
    toUserId: request.toUserId,
    createdAt: serverTimestamp(),
  });
}

/**
 * 채팅 메시지 가져오기 (실시간)
 */
export function subscribeToChatMessages(
  requestId: string,
  callback: (messages: ChatMessage[]) => void
): () => void {
  // 인덱스 없이 작동하도록 orderBy 제거하고 클라이언트에서 정렬
  const q = collection(db, "requests", requestId, "messages");

  return onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = [];
    snapshot.forEach((docSnapshot) => {
      messages.push({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      } as ChatMessage);
    });
    // 클라이언트 사이드에서 정렬 (시간순)
    messages.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || a.createdAt || 0;
      const bTime = b.createdAt?.toMillis?.() || b.createdAt || 0;
      return aTime - bTime; // 오름차순 (시간순)
    });
    callback(messages);
  });
}

/**
 * 읽지 않은 요청 수 가져오기
 */
export async function getUnreadRequestCount(userId: string): Promise<number> {
  const q = query(
    collection(db, "requests"),
    where("toUserId", "==", userId),
    where("read", "==", false)
  );

  const snapshot = await getDocs(q);
  return snapshot.size;
}
