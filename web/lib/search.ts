import { collection, query, getDocs, where, limit } from "firebase/firestore";
import { db } from "./firebase";
import { Movie } from "./movies";
import { Actor } from "./actors";
import { Filmmaker } from "./filmmakers";
import { Post } from "./posts";
import { getMovies } from "./movies";
import { getActors } from "./actors";
import { getFilmmakers } from "./filmmakers";
import { getPosts } from "./posts";

export interface SearchResult {
  movies: Movie[];
  actors: Actor[];
  filmmakers: Filmmaker[];
  posts: Post[];
}

export interface SearchOptions {
  query: string;
  types?: ("movies" | "actors" | "filmmakers" | "posts")[];
  limitCount?: number;
}

/**
 * 통합 검색
 */
export async function searchAll(options: SearchOptions): Promise<SearchResult> {
  const { query: searchQuery, types, limitCount = 20 } = options;
  const searchLower = searchQuery.toLowerCase().trim();

  if (!searchLower) {
    return {
      movies: [],
      actors: [],
      filmmakers: [],
      posts: [],
    };
  }

  const searchTypes = types || ["movies", "actors", "filmmakers", "posts"];
  const results: SearchResult = {
    movies: [],
    actors: [],
    filmmakers: [],
    posts: [],
  };

  // 병렬 검색
  const promises: Promise<void>[] = [];

  if (searchTypes.includes("movies")) {
    promises.push(
      (async () => {
        try {
          const { movies } = await getMovies({ limitCount: 100 });
          const filtered = movies.filter((movie) => {
            return (
              movie.title.toLowerCase().includes(searchLower) ||
              movie.logline?.toLowerCase().includes(searchLower) ||
              movie.description?.toLowerCase().includes(searchLower) ||
              movie.tags?.some((tag) => tag.toLowerCase().includes(searchLower)) ||
              movie.credits?.some((credit) =>
                credit.name.toLowerCase().includes(searchLower)
              )
            );
          });
          results.movies = filtered.slice(0, limitCount);
        } catch (error) {
          console.error("Error searching movies:", error);
        }
      })()
    );
  }

  if (searchTypes.includes("actors")) {
    promises.push(
      (async () => {
        try {
          const { actors } = await getActors({ limitCount: 100 });
          const filtered = actors.filter((actor) => {
            return (
              actor.stageName.toLowerCase().includes(searchLower) ||
              actor.bio?.toLowerCase().includes(searchLower) ||
              actor.skills?.some((skill) => skill.toLowerCase().includes(searchLower)) ||
              actor.experience?.some((exp) => exp.toLowerCase().includes(searchLower))
            );
          });
          results.actors = filtered.slice(0, limitCount);
        } catch (error) {
          console.error("Error searching actors:", error);
        }
      })()
    );
  }

  if (searchTypes.includes("filmmakers")) {
    promises.push(
      (async () => {
        try {
          const { filmmakers } = await getFilmmakers({ limitCount: 100 });
          const filtered = filmmakers.filter((filmmaker) => {
            return (
              filmmaker.name.toLowerCase().includes(searchLower) ||
              filmmaker.bio?.toLowerCase().includes(searchLower) ||
              filmmaker.specialties?.some((s) => s.toLowerCase().includes(searchLower))
            );
          });
          results.filmmakers = filtered.slice(0, limitCount);
        } catch (error) {
          console.error("Error searching filmmakers:", error);
        }
      })()
    );
  }

  if (searchTypes.includes("posts")) {
    promises.push(
      (async () => {
        try {
          const posts = await getPosts({ limitCount: 100 });
          const filtered = posts.filter((post) => {
            return (
              post.title.toLowerCase().includes(searchLower) ||
              post.content.toLowerCase().includes(searchLower)
            );
          });
          results.posts = filtered.slice(0, limitCount);
        } catch (error) {
          console.error("Error searching posts:", error);
        }
      })()
    );
  }

  await Promise.all(promises);

  return results;
}
