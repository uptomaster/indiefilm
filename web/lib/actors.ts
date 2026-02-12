import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  getDoc,
  setDoc,
  where,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type AgeRange = "10s" | "20s" | "30s" | "40s" | "50plus";

export interface Actor {
  id: string;
  userId: string;
  stageName: string;
  ageRange: AgeRange;
  heightCm: number;
  bodyType: string;
  location: string;
  experience: string[];
  skills: string[];
  mainPhotoUrl?: string;
  mainPhotoPath?: string;
  gallery: Array<{
    url: string;
    path: string;
  }>;
  demoPlatform: "youtube" | "vimeo" | null;
  demoUrl: string | null;
  bio: string;
  email?: string; // 연락처 이메일
  phone?: string; // 연락처 전화번호
  createdAt: any;
  updatedAt: any;
  isPublic: boolean;
  // 새로 추가된 필드
  mbti?: string; // MBTI (예: "ENFP", "ISTJ")
  traits?: {
    acting: number; // 연기력 (0-100)
    appearance: number; // 외모 (0-100)
    charisma: number; // 카리스마 (0-100)
    emotion: number; // 감성 (0-100)
    humor: number; // 유머 (0-100)
    action: number; // 액션 (0-100)
  };
}

export async function getActors(options?: {
  location?: string;
  ageRange?: AgeRange;
  limitCount?: number;
  lastDoc?: QueryDocumentSnapshot;
}): Promise<{ actors: Actor[]; lastDoc: QueryDocumentSnapshot | null }> {
  // 인덱스 없이 작동하도록: isPublic만 필터링 (orderBy 제거)
  let q = query(
    collection(db, "actors"),
    where("isPublic", "==", true)
  );

  // limit을 크게 설정하여 모든 공개 프로필 가져오기 (필터링을 위해)
  // 실제로는 모든 문서를 가져온 후 클라이언트에서 필터링/정렬
  const snapshot = await getDocs(q);
  let actors: Actor[] = [];
  let lastDocument: QueryDocumentSnapshot | null = null;

  console.log("전체 문서 수:", snapshot.size);

  snapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    console.log(`문서 ${docSnapshot.id}:`, {
      isPublic: data.isPublic,
      stageName: data.stageName,
      createdAt: data.createdAt,
      userId: data.userId
    });
    
    // isPublic이 true이고 모든 필수 필드가 있는 문서만 추가
    if (data.isPublic === true && data.stageName && data.createdAt) {
      actors.push({
        id: docSnapshot.id,
        userId: data.userId || docSnapshot.id,
        ...data,
      } as Actor);
      lastDocument = docSnapshot;
    } else {
      console.log(`문서 ${docSnapshot.id} 제외됨:`, {
        isPublic: data.isPublic,
        hasStageName: !!data.stageName,
        hasCreatedAt: !!data.createdAt
      });
    }
  });

  console.log("필터링 후 배우 수:", actors.length);

  // 클라이언트 사이드에서 필터링 (인덱스 없이 작동)
  if (options?.location) {
    actors = actors.filter((actor) => actor.location === options.location);
  }

  if (options?.ageRange) {
    actors = actors.filter((actor) => actor.ageRange === options.ageRange);
  }

  // createdAt으로 정렬 (클라이언트 사이드)
  actors.sort((a, b) => {
    try {
      // Firestore Timestamp 객체 처리
      const aTime = a.createdAt?.toMillis?.() 
        || (a.createdAt?._seconds ? a.createdAt._seconds * 1000 : 0)
        || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0)
        || 0;
      const bTime = b.createdAt?.toMillis?.()
        || (b.createdAt?._seconds ? b.createdAt._seconds * 1000 : 0)
        || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0)
        || 0;
      return bTime - aTime; // 최신순
    } catch (error) {
      console.error("정렬 에러:", error);
      return 0;
    }
  });

  // 페이지네이션 (필터링 및 정렬 후)
  const limitCount = options?.limitCount || 12;
  const startIndex = 0;
  const endIndex = startIndex + limitCount;
  const paginatedActors = actors.slice(startIndex, endIndex);

  return { actors: paginatedActors, lastDoc: lastDocument };
}

export async function getActorById(actorId: string): Promise<Actor | null> {
  const docRef = doc(db, "actors", actorId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    userId: data.userId || docSnap.id,
    ...data,
  } as Actor;
}

export async function getActorByUserId(userId: string): Promise<Actor | null> {
  const docRef = doc(db, "actors", userId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    userId: data.userId || docSnap.id,
    ...data,
  } as Actor;
}

export async function createOrUpdateActorProfile(
  userId: string,
  data: Omit<Actor, "id" | "userId" | "createdAt" | "updatedAt">
) {
  const actorRef = doc(db, "actors", userId);
  
  // undefined 값을 가진 필드를 제거 (Firestore는 undefined를 허용하지 않음)
  const cleanedData: any = {
    userId,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };
  
  // undefined가 아닌 필드만 추가
  Object.keys(data).forEach((key) => {
    const value = (data as any)[key];
    if (value !== undefined) {
      cleanedData[key] = value;
    }
  });
  
  await setDoc(actorRef, cleanedData, { merge: true });
}

export function getAgeRangeLabel(ageRange: AgeRange): string {
  const labels: Record<AgeRange, string> = {
    "10s": "10대",
    "20s": "20대",
    "30s": "30대",
    "40s": "40대",
    "50plus": "50대 이상",
  };
  return labels[ageRange] || ageRange;
}

export function extractVideoId(
  url: string,
  platform: "youtube" | "vimeo"
): string | null {
  if (platform === "youtube") {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  } else if (platform === "vimeo") {
    const regExp = /(?:vimeo)\.com.*(?:videos|video|channels|)\/([\d]+)/i;
    const match = url.match(regExp);
    return match ? match[1] : null;
  }
  return null;
}
