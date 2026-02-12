// lib/movieRatings.ts
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
  orderBy,
  limit,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

export interface MovieRating {
  id: string;
  userId: string;
  movieId?: string; // 사이트 영화 ID (선택사항)
  movieTitle: string; // 영화 제목 (필수)
  movieThumbnail?: string; // 포스터 URL (선택)
  movieYear?: number; // 제작 연도 (선택)
  rating: number; // 1-5점
  review?: string; // 리뷰 (선택)
  isFavorite?: boolean; // 인생영화 여부
  createdAt: any;
  updatedAt: any;
}

export interface MovieRatingWithMovie extends MovieRating {
  // 호환성을 위해 유지
}

/**
 * 사용자의 영화 평점 가져오기
 */
export async function getUserMovieRatings(
  userId: string,
  options?: {
    limitCount?: number;
    lastDoc?: QueryDocumentSnapshot;
  }
): Promise<{ ratings: MovieRating[]; lastDoc: QueryDocumentSnapshot | null }> {
  // 인덱스 없이 작동하도록 orderBy 제거하고 클라이언트에서 정렬
  let q = query(
    collection(db, "movieRatings"),
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(q);
  const ratings: MovieRating[] = [];
  let lastDocument: QueryDocumentSnapshot | null = null;

  snapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    // 삭제되지 않은 평점만 포함 (deleted 필드가 없거나 false인 경우)
    if (!data.deleted || data.deleted === false) {
      ratings.push({
        id: docSnapshot.id,
        ...data,
      } as MovieRating);
      lastDocument = docSnapshot;
    }
  });

  // 클라이언트 사이드에서 정렬 (최신순)
  ratings.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || a.createdAt || 0;
    const bTime = b.createdAt?.toMillis?.() || b.createdAt || 0;
    return bTime - aTime; // 내림차순 (최신순)
  });

  // limitCount가 있으면 제한
  const limitedRatings = options?.limitCount 
    ? ratings.slice(0, options.limitCount)
    : ratings;

  return { ratings: limitedRatings, lastDoc: lastDocument };
}

/**
 * 영화의 평점 가져오기
 */
export async function getMovieRatings(
  movieId: string
): Promise<MovieRating[]> {
  // 인덱스 없이 작동하도록 orderBy 제거하고 클라이언트에서 정렬
  const q = query(
    collection(db, "movieRatings"),
    where("movieId", "==", movieId)
  );

  const snapshot = await getDocs(q);
  const ratings: MovieRating[] = [];

  snapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    // 삭제되지 않은 평점만 포함 (deleted 필드가 없거나 false인 경우)
    if (!data.deleted || data.deleted === false) {
      ratings.push({
        id: docSnapshot.id,
        ...data,
      } as MovieRating);
    }
  });

  // 클라이언트 사이드에서 정렬 (최신순)
  ratings.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || a.createdAt || 0;
    const bTime = b.createdAt?.toMillis?.() || b.createdAt || 0;
    return bTime - aTime; // 내림차순 (최신순)
  });

  return ratings;
}

/**
 * 사용자의 특정 영화 평점 가져오기 (제목으로 검색)
 */
export async function getUserMovieRatingByTitle(
  userId: string,
  movieTitle: string
): Promise<MovieRating | null> {
  const q = query(
    collection(db, "movieRatings"),
    where("userId", "==", userId),
    where("movieTitle", "==", movieTitle),
    limit(1)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null;
  }

  const docSnapshot = snapshot.docs[0];
  const data = docSnapshot.data();
  // 삭제된 평점은 null 반환
  if (data.deleted) {
    return null;
  }

  return {
    id: docSnapshot.id,
    ...data,
  } as MovieRating;
}

/**
 * 사용자의 특정 영화 평점 가져오기 (movieId로, 사이트 영화용)
 */
export async function getUserMovieRating(
  userId: string,
  movieId: string
): Promise<MovieRating | null> {
  const q = query(
    collection(db, "movieRatings"),
    where("userId", "==", userId),
    where("movieId", "==", movieId),
    limit(1)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null;
  }

  const docSnapshot = snapshot.docs[0];
  const data = docSnapshot.data();
  // 삭제된 평점은 null 반환
  if (data.deleted) {
    return null;
  }

  return {
    id: docSnapshot.id,
    ...data,
  } as MovieRating;
}

/**
 * 영화 평점 생성 또는 업데이트 (자유 영화 추가)
 */
export async function createOrUpdateMovieRating(
  userId: string,
  data: {
    movieTitle: string;
    movieThumbnail?: string;
    movieYear?: number;
    movieId?: string; // 사이트 영화 ID (선택)
    rating: number;
    review?: string;
    isFavorite?: boolean;
  }
): Promise<void> {
  // undefined 값을 제거하는 헬퍼 함수
  const removeUndefined = (obj: any): any => {
    if (obj === null || obj === undefined) {
      return null;
    }
    if (Array.isArray(obj)) {
      return obj.map(removeUndefined).filter((item) => item !== undefined);
    }
    if (typeof obj === "object") {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = removeUndefined(value);
        }
      }
      return cleaned;
    }
    return obj;
  };

  // 기존 평점 확인
  // movieId가 있으면 먼저 movieId로 검색, 없으면 제목으로 검색
  let existingRating: MovieRating | null = null;
  
  if (data.movieId) {
    existingRating = await getUserMovieRating(userId, data.movieId);
  }
  
  if (!existingRating) {
    existingRating = await getUserMovieRatingByTitle(userId, data.movieTitle);
  }

  // 데이터 정리 (undefined 제거)
  const cleanedData = removeUndefined({
    movieTitle: data.movieTitle,
    movieThumbnail: data.movieThumbnail || null,
    movieYear: data.movieYear || null,
    movieId: data.movieId || null,
    rating: data.rating,
    review: data.review || null,
    isFavorite: data.isFavorite || false,
  });

  if (existingRating) {
    // 업데이트
    const ratingRef = doc(db, "movieRatings", existingRating.id);
    await updateDoc(ratingRef, {
      ...cleanedData,
      updatedAt: serverTimestamp(),
    });
  } else {
    // 생성
    await addDoc(collection(db, "movieRatings"), {
      userId,
      ...cleanedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

/**
 * 영화 평점 생성 또는 업데이트 (사이트 영화용, 호환성 유지)
 */
export async function createOrUpdateMovieRatingByMovieId(
  userId: string,
  movieId: string,
  data: {
    rating: number;
    review?: string;
    isFavorite?: boolean;
  }
): Promise<void> {
  // 기존 평점 확인
  const existingRating = await getUserMovieRating(userId, movieId);

  if (existingRating) {
    // 업데이트
    const ratingRef = doc(db, "movieRatings", existingRating.id);
    await updateDoc(ratingRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } else {
    // 생성 (movieTitle은 나중에 업데이트 필요)
    await addDoc(collection(db, "movieRatings"), {
      userId,
      movieId,
      movieTitle: "", // 임시값, 나중에 업데이트 필요
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

/**
 * 영화 평점 삭제
 */
export async function deleteMovieRating(ratingId: string): Promise<void> {
  const ratingRef = doc(db, "movieRatings", ratingId);
  await updateDoc(ratingRef, {
    deleted: true,
    updatedAt: serverTimestamp(),
  });
}

/**
 * 영화의 평균 평점 계산
 */
export async function getMovieAverageRating(movieId: string): Promise<number> {
  const ratings = await getMovieRatings(movieId);
  if (ratings.length === 0) {
    return 0;
  }

  const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
  return sum / ratings.length;
}
