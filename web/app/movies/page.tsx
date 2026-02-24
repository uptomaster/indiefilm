"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getMovies, Movie, MovieGenre, getGenreLabel, getStatusLabel, getStatusColor } from "@/lib/movies";
import { getMovieRatings } from "@/lib/movieRatings";
import { IndiePageWrapper } from "@/components/IndiePageWrapper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MovieCardSkeleton } from "@/components/SkeletonLoader";
import { EmptyState } from "@/components/EmptyState";
import { LazyImage } from "@/components/LazyImage";
import { useToastContext } from "@/components/ToastProvider";

const genres: MovieGenre[] = ["drama", "comedy", "horror", "romance", "etc"];

type SortOption = "latest" | "popular" | "rating";

interface MovieWithRatings extends Movie {
  averageRating: number;
  reviewCount: number;
}

export default function MoviesPage() {
  const { error: showError } = useToastContext();
  const [movies, setMovies] = useState<MovieWithRatings[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<MovieGenre | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);

  useEffect(() => {
    loadMovies();
  }, [selectedGenre]);

  const loadMovies = async () => {
    try {
      setLoading(true);
      const result = await getMovies({
        genre: selectedGenre || undefined,
        limitCount: 100, // 정렬을 위해 더 많이 가져옴
      });
      
      // 각 영화의 평점 정보 가져오기
      const moviesWithRatings = await Promise.all(
        result.movies.map(async (movie) => {
          try {
            const ratings = await getMovieRatings(movie.id);
            const avgRating = ratings.length > 0
              ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
              : 0;
            
            return {
              ...movie,
              averageRating: avgRating,
              reviewCount: ratings.length,
            };
          } catch (error) {
            console.error(`Error loading ratings for movie ${movie.id}:`, error);
            return {
              ...movie,
              averageRating: 0,
              reviewCount: 0,
            };
          }
        })
      );
      
      setMovies(moviesWithRatings);
      setLastDoc(result.lastDoc);
      setHasMore(false);
    } catch (error) {
      console.error("Error loading movies:", error);
      showError("영화 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const sortedMovies = useMemo(() => {
    const sorted = [...movies];
    switch (sortBy) {
      case "latest":
        return sorted.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
          const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
          return bTime - aTime;
        });
      case "popular":
        return sorted.sort((a, b) => b.reviewCount - a.reviewCount);
      case "rating":
        return sorted.sort((a, b) => {
          if (b.averageRating !== a.averageRating) {
            return b.averageRating - a.averageRating;
          }
          return b.reviewCount - a.reviewCount;
        });
      default:
        return sorted;
    }
  }, [movies, sortBy]);

  const loadMore = async () => {
    // 인덱스 없이 작동하도록 pagination 간소화
    // 모든 영화를 이미 로드했으므로 더 이상 로드할 것이 없음
    setHasMore(false);
  };

  return (
    <IndiePageWrapper title="작품" subtitle="인디 영화 제작자들의 작품을 감상하세요" sectionNum="02">
      {/* 장르 필터 */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        <button
          onClick={() => setSelectedGenre(null)}
          className={`px-4 py-2 text-xs tracking-wider uppercase transition-all ${
            selectedGenre === null
              ? "bg-[#e8a020] text-[#0a0805] font-medium"
              : "border border-[#e8a020]/35 text-[#b8a898] hover:border-[#e8a020] hover:text-[#e8a020]"
          }`}
        >
          전체
        </button>
        {genres.map((genre) => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={`px-4 py-2 text-xs tracking-wider uppercase transition-all ${
              selectedGenre === genre
                ? "bg-[#e8a020] text-[#0a0805] font-medium"
                : "border border-[#e8a020]/35 text-[#b8a898] hover:border-[#e8a020] hover:text-[#e8a020]"
            }`}
          >
            {getGenreLabel(genre)}
          </button>
        ))}
      </div>

      {/* 영화 목록 */}
        {loading && movies.length === 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <MovieCardSkeleton key={i} />
            ))}
          </div>
        ) : sortedMovies.length === 0 ? (
          <EmptyState type="movies" />
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div className="text-sm text-[#b8a898]">
                총 {sortedMovies.length}개의 영화
              </div>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-[140px] bg-[#0d0b08] border-[#e8a020]/25 text-[#faf6f0] font-medium h-9 md:h-10 text-sm focus:border-[#e8a020] focus:ring-[#e8a020]/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0d0b08] border-[#e8a020]/25">
                  <SelectItem value="latest" className="text-[#f0e8d8] hover:bg-[#e8a020]/10 focus:bg-[#e8a020]/10 cursor-pointer">최신순</SelectItem>
                  <SelectItem value="popular" className="text-[#f0e8d8] hover:bg-[#e8a020]/10 focus:bg-[#e8a020]/10 cursor-pointer">인기순</SelectItem>
                  <SelectItem value="rating" className="text-[#f0e8d8] hover:bg-[#e8a020]/10 focus:bg-[#e8a020]/10 cursor-pointer">평점순</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {sortedMovies.map((movie) => (
                <Link key={movie.id} href={`/movies/${movie.id}`} className="group block">
                  <div className="overflow-hidden rounded border border-[#e8a020]/30 bg-[#0d0b08] transition-colors hover:border-[#e8a020]/40">
                    {/* 포스터 영역 - 박스에 맞게 꽉 채움 (2:3 비율) */}
                    <div className="relative aspect-[2/3] overflow-hidden bg-[#1a1510]">
                      {movie.thumbnailUrl ? (
                        <LazyImage
                          src={movie.thumbnailUrl}
                          alt={movie.title}
                          className="h-full w-full object-cover object-center"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1a1510] via-[#100e0a] to-[#0a0805]">
                          <div className="text-center">
                            <div className="mb-2 text-5xl opacity-50">🎬</div>
                            <div className="text-base font-bold text-[#b8a898] line-clamp-2 px-3">
                              {movie.title}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="mb-2 text-base font-bold text-[#faf6f0] line-clamp-1 group-hover:text-[#e8a020] transition-colors">
                        {movie.title}
                      </h3>
                      <div className="mb-2 flex flex-wrap gap-1.5 text-xs">
                        <span className="rounded px-2 py-0.5 bg-[#e8a020]/20 text-[#e8a020]">
                          {getGenreLabel(movie.genre)}
                        </span>
                        <span className="rounded px-2 py-0.5 bg-[#e8a020]/25 text-[#b8a898]">
                          {movie.runtimeMinutes}분
                        </span>
                        {movie.averageRating > 0 && (
                          <span className="text-[#e8a020]">★ {movie.averageRating.toFixed(1)}</span>
                        )}
                      </div>
                      {movie.logline && (
                        <p className="line-clamp-2 text-sm text-[#b8a898]">{movie.logline}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
    </IndiePageWrapper>
  );
}
