// lib/credits.ts
import {
  collection,
  query,
  where,
  getDocs,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { Movie } from "./movies";

export interface Credit {
  role: string;
  name: string;
  profileLink?: string;
  actorId?: string; // 사이트 내 배우 ID (선택)
}

export interface CreditWithMovies extends Credit {
  movies: Movie[];
  movieCount: number;
}

/**
 * 특정 역할의 제작진 가져오기
 */
export async function getCreditsByRole(role: string): Promise<CreditWithMovies[]> {
  const moviesSnapshot = await getDocs(collection(db, "movies"));
  const creditsMap = new Map<string, CreditWithMovies>();

  moviesSnapshot.forEach((doc) => {
    const movie = { id: doc.id, ...doc.data() } as Movie;
    if (!movie.isPublished || !movie.credits) return;

    movie.credits.forEach((credit) => {
      if (credit.role.toLowerCase() === role.toLowerCase()) {
        const key = `${credit.name}_${credit.role}`;
        if (!creditsMap.has(key)) {
          creditsMap.set(key, {
            ...credit,
            movies: [],
            movieCount: 0,
          });
        }
        const creditEntry = creditsMap.get(key)!;
        creditEntry.movies.push(movie);
        creditEntry.movieCount++;
      }
    });
  });

  return Array.from(creditsMap.values()).sort((a, b) => b.movieCount - a.movieCount);
}

/**
 * 특정 이름의 제작진 가져오기
 */
export async function getCreditsByName(name: string): Promise<CreditWithMovies[]> {
  const moviesSnapshot = await getDocs(collection(db, "movies"));
  const creditsMap = new Map<string, CreditWithMovies>();

  moviesSnapshot.forEach((doc) => {
    const movie = { id: doc.id, ...doc.data() } as Movie;
    if (!movie.isPublished || !movie.credits) return;

    movie.credits.forEach((credit) => {
      if (credit.name.toLowerCase().includes(name.toLowerCase())) {
        const key = `${credit.name}_${credit.role}`;
        if (!creditsMap.has(key)) {
          creditsMap.set(key, {
            ...credit,
            movies: [],
            movieCount: 0,
          });
        }
        const creditEntry = creditsMap.get(key)!;
        creditEntry.movies.push(movie);
        creditEntry.movieCount++;
      }
    });
  });

  return Array.from(creditsMap.values()).sort((a, b) => b.movieCount - a.movieCount);
}

/**
 * 모든 제작진 가져오기 (역할별 그룹화)
 */
export async function getAllCredits(): Promise<Map<string, CreditWithMovies[]>> {
  const moviesSnapshot = await getDocs(collection(db, "movies"));
  const creditsByRole = new Map<string, Map<string, CreditWithMovies>>();

  moviesSnapshot.forEach((doc) => {
    const movie = { id: doc.id, ...doc.data() } as Movie;
    if (!movie.isPublished || !movie.credits) return;

    movie.credits.forEach((credit) => {
      const role = credit.role;
      if (!creditsByRole.has(role)) {
        creditsByRole.set(role, new Map());
      }

      const roleMap = creditsByRole.get(role)!;
      const key = credit.name;
      if (!roleMap.has(key)) {
        roleMap.set(key, {
          ...credit,
          movies: [],
          movieCount: 0,
        });
      }
      const creditEntry = roleMap.get(key)!;
      creditEntry.movies.push(movie);
      creditEntry.movieCount++;
    });
  });

  // Map을 배열로 변환하고 정렬
  const result = new Map<string, CreditWithMovies[]>();
  creditsByRole.forEach((roleMap, role) => {
    const credits = Array.from(roleMap.values()).sort(
      (a, b) => b.movieCount - a.movieCount
    );
    result.set(role, credits);
  });

  return result;
}

/**
 * 특정 배우가 참여한 영화 가져오기
 */
export async function getMoviesByActorId(actorId: string): Promise<Movie[]> {
  const moviesSnapshot = await getDocs(collection(db, "movies"));
  const movies: Movie[] = [];

  moviesSnapshot.forEach((doc) => {
    const movie = { id: doc.id, ...doc.data() } as Movie;
    if (!movie.isPublished) return;

    // credits에서 actorId로 검색
    const hasActor = movie.credits?.some(
      (credit) => credit.actorId === actorId
    );
    
    // 또는 taggedActorIds에서 검색
    const isTagged = movie.taggedActorIds?.includes(actorId);

    if (hasActor || isTagged) {
      movies.push(movie);
    }
  });

  return movies.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || a.createdAt || 0;
    const bTime = b.createdAt?.toMillis?.() || b.createdAt || 0;
    return bTime - aTime;
  });
}
