import { collection, query, getDocs, doc, getDoc, updateDoc, where, limit, QueryDocumentSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export type MovieGenre = "drama" | "comedy" | "horror" | "romance" | "etc";
export type MovieStatus = "production" | "planned" | "completed";

export interface Movie {
  id: string;
  title: string;
  genre: MovieGenre;
  status: MovieStatus; // 제작중, 제작예정, 제작완료
  runtimeMinutes: number;
  logline: string;
  description: string;
  videoPlatform: "youtube" | "vimeo";
  videoUrl: string;
  thumbnailUrl?: string;
  thumbnailPath?: string;
  credits: Array<{
    role: string;
    name: string;
    profileLink?: string;
    actorId?: string; // 사이트 내 배우 ID (선택)
  }>;
  filmmakerId: string;
  taggedActorIds: string[];
  isPublished: boolean;
  createdAt: any;
  updatedAt: any;
  tags?: string[];
  year?: number;
}

export async function getMovies(options?: {
  genre?: MovieGenre;
  limitCount?: number;
  lastDoc?: QueryDocumentSnapshot; // 호환성을 위해 유지하지만 사용하지 않음
}): Promise<{ movies: Movie[]; lastDoc: QueryDocumentSnapshot | null }> {
  // 인덱스 없이 작동하도록 orderBy 제거, 클라이언트 사이드에서 정렬
  let q = query(collection(db, "movies"), where("isPublished", "==", true));

  if (options?.genre) {
    q = query(q, where("genre", "==", options.genre));
  }

  // 인덱스 없이 작동하도록 limit도 제거하고 모든 영화를 가져온 후 클라이언트에서 처리
  const snapshot = await getDocs(q);
  const movies: Movie[] = [];

  snapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    // isPublished가 true이고, createdAt이 있는 영화만 추가
    if (data.isPublished === true && data.createdAt) {
      movies.push({
        id: docSnapshot.id,
        status: data.status || "production", // 기본값: 제작중
        ...data,
      } as Movie);
    }
  });

  // 클라이언트 사이드에서 정렬 (최신순)
  movies.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || a.createdAt || 0;
    const bTime = b.createdAt?.toMillis?.() || b.createdAt || 0;
    return bTime - aTime; // 내림차순 (최신순)
  });

  // limitCount가 있으면 제한
  const limitedMovies = options?.limitCount 
    ? movies.slice(0, options.limitCount)
    : movies;

  // lastDoc은 pagination을 위해 사용하지 않음 (간단화)
  return { movies: limitedMovies, lastDoc: null };
}

export async function getMovieById(movieId: string): Promise<Movie | null> {
  const docRef = doc(db, "movies", movieId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    status: data.status || "production", // 기본값: 제작중
    ...data,
  } as Movie;
}

export function getGenreLabel(genre: MovieGenre): string {
  const labels: Record<MovieGenre, string> = {
    drama: "드라마",
    comedy: "코미디",
    horror: "공포",
    romance: "로맨스",
    etc: "기타",
  };
  return labels[genre] || genre;
}

export function getStatusLabel(status: MovieStatus): string {
  const labels: Record<MovieStatus, string> = {
    production: "제작중",
    planned: "제작예정",
    completed: "제작완료",
  };
  return labels[status] || status;
}

export function getStatusColor(status: MovieStatus): string {
  const colors: Record<MovieStatus, string> = {
    production: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
    planned: "bg-blue-600/20 text-blue-400 border-blue-600/30",
    completed: "bg-green-600/20 text-green-400 border-green-600/30",
  };
  return colors[status] || "bg-gray-600/20 text-gray-400 border-gray-600/30";
}

export function extractVideoId(url: string, platform: "youtube" | "vimeo"): string | null {
  if (platform === "youtube") {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  } else if (platform === "vimeo") {
    const regExp = /(?:vimeo)\.com.*(?:videos|video|channels|)\/([\d]+)/i;
    const match = url.match(regExp);
    return match ? match[1] : null;
  }
  return null;
}

/**
 * 영화 수정
 */
export async function updateMovie(
  movieId: string,
  data: Partial<Omit<Movie, "id" | "createdAt" | "filmmakerId">>
): Promise<void> {
  const movieRef = doc(db, "movies", movieId);
  
  const updateData: any = {
    ...data,
    updatedAt: serverTimestamp(),
  };

  // undefined 값 제거
  Object.keys(updateData).forEach((key) => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  await updateDoc(movieRef, updateData);
}
