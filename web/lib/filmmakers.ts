// lib/filmmakers.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
  query,
  where,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { Movie } from "./movies";
import { getMovies } from "./movies";

export type FilmmakerType = "individual" | "team"; // 개인 또는 팀

export interface Filmmaker {
  id: string;
  userId: string;
  type: FilmmakerType;
  name: string; // 개인 이름 또는 팀 이름
  bio?: string; // 소개
  location?: string; // 지역
  website?: string; // 웹사이트
  email?: string; // 연락처 이메일
  phone?: string; // 연락처 전화번호
  specialties?: string[]; // 전문 분야 (예: ["단편영화", "다큐멘터리"])
  equipment?: string[]; // 보유 장비
  experience?: string[]; // 경력
  mainPhotoUrl?: string; // 프로필 사진
  mainPhotoPath?: string;
  gallery?: Array<{
    url: string;
    path: string;
  }>; // 포트폴리오 갤러리
  isPublic: boolean; // 공개 여부
  createdAt: any;
  updatedAt: any;
  // 팀인 경우
  teamMembers?: Array<{
    name: string;
    role: string; // 역할 (예: "감독", "촬영감독")
    profileLink?: string;
  }>;
}

/**
 * 제작자 프로필 가져오기 (userId로)
 */
export async function getFilmmakerByUserId(
  userId: string
): Promise<Filmmaker | null> {
  const docRef = doc(db, "filmmakers", userId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    userId: data.userId || docSnap.id,
    ...data,
  } as Filmmaker;
}

/**
 * 제작자 프로필 가져오기 (ID로)
 */
export async function getFilmmakerById(
  filmmakerId: string
): Promise<Filmmaker | null> {
  const docRef = doc(db, "filmmakers", filmmakerId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    userId: data.userId || docSnap.id,
    ...data,
  } as Filmmaker;
}

/**
 * 모든 제작자 가져오기
 */
export async function getFilmmakers(options?: {
  type?: FilmmakerType;
  location?: string;
  limitCount?: number;
  lastDoc?: QueryDocumentSnapshot;
}): Promise<{
  filmmakers: Filmmaker[];
  lastDoc: QueryDocumentSnapshot | null;
}> {
  let q = query(collection(db, "filmmakers"), where("isPublic", "==", true));

  if (options?.type) {
    q = query(q, where("type", "==", options.type));
  }

  if (options?.location) {
    q = query(q, where("location", "==", options.location));
  }

  const snapshot = await getDocs(q);
  const filmmakers: Filmmaker[] = [];
  let lastDocument: QueryDocumentSnapshot | null = null;

  snapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    if (data.isPublic === true) {
      filmmakers.push({
        id: docSnapshot.id,
        userId: data.userId || docSnapshot.id,
        ...data,
      } as Filmmaker);
      lastDocument = docSnapshot;
    }
  });

  // 클라이언트 사이드에서 정렬 (최신순)
  filmmakers.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || a.createdAt || 0;
    const bTime = b.createdAt?.toMillis?.() || b.createdAt || 0;
    return bTime - aTime;
  });

  const limitedFilmmakers = options?.limitCount
    ? filmmakers.slice(0, options.limitCount)
    : filmmakers;

  return { filmmakers: limitedFilmmakers, lastDoc: null };
}

/**
 * 제작자 프로필 생성 또는 업데이트
 */
export async function createOrUpdateFilmmakerProfile(
  userId: string,
  data: Omit<Filmmaker, "id" | "userId" | "createdAt" | "updatedAt">
) {
  const filmmakerRef = doc(db, "filmmakers", userId);

  // undefined 값을 가진 필드를 제거
  const cleanedData: any = {
    userId,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };

  Object.keys(data).forEach((key) => {
    const value = (data as any)[key];
    if (value !== undefined) {
      cleanedData[key] = value;
    }
  });

  await setDoc(filmmakerRef, cleanedData, { merge: true });
}

/**
 * 제작자의 영화 목록 가져오기
 */
export async function getFilmmakerMovies(
  filmmakerId: string
): Promise<Movie[]> {
  const { movies } = await getMovies();
  return movies.filter((movie) => movie.filmmakerId === filmmakerId);
}
