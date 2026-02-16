"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getMovies, Movie, MovieGenre, getGenreLabel, getStatusLabel, getStatusColor } from "@/lib/movies";
import { getMovieRatings, getMovieAverageRating } from "@/lib/movieRatings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="min-h-screen bg-white text-gray-900">
      {/* 히어로 섹션 */}
      <div className="relative overflow-hidden border-b border-gray-200 bg-gradient-to-b from-pink-100 via-pink-50 to-white">
        <div className="film-strip absolute inset-0 opacity-10" />
        <div className="container relative mx-auto px-4 py-6 md:py-12 lg:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-2 md:mb-4 text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight film-gold px-2">
              MOVIES
            </h1>
            <p className="mb-4 md:mb-8 text-base md:text-lg lg:text-xl text-gray-700 font-medium tracking-tight px-2">
              인디 영화 제작자들의 작품을 감상하세요
            </p>

            {/* 장르 필터 */}
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              <Button
                variant={selectedGenre === null ? "default" : "outline"}
                onClick={() => setSelectedGenre(null)}
                className={
                  selectedGenre === null
                    ? "btn-primary-gradient text-white font-semibold"
                    : "border-red-300 text-red-600 hover:bg-red-50 font-medium"
                }
              >
                전체
              </Button>
              {genres.map((genre) => (
                <Button
                  key={genre}
                  variant={selectedGenre === genre ? "default" : "outline"}
                  onClick={() => setSelectedGenre(genre)}
                  className={
                    selectedGenre === genre
                      ? "bg-yellow-600 text-black hover:bg-yellow-500"
                      : "border-yellow-600/50 text-yellow-400 hover:bg-yellow-600/10"
                  }
                >
                  {getGenreLabel(genre)}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 영화 목록 */}
      <div className="container mx-auto px-4 py-4 md:py-8 lg:py-12">
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
              <div className="text-sm text-gray-400">
                총 {sortedMovies.length}개의 영화
              </div>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-[140px] bg-white border-gray-300 text-gray-900 font-medium h-9 md:h-10 text-xs md:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="latest" className="text-gray-900 hover:bg-red-50 focus:bg-red-50 cursor-pointer font-medium">최신순</SelectItem>
                  <SelectItem value="popular" className="text-gray-900 hover:bg-red-50 focus:bg-red-50 cursor-pointer font-medium">인기순</SelectItem>
                  <SelectItem value="rating" className="text-gray-900 hover:bg-red-50 focus:bg-red-50 cursor-pointer font-medium">평점순</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3 lg:gap-4">
              {sortedMovies.map((movie) => (
                <Link key={movie.id} href={`/movies/${movie.id}`}>
                  <Card className="group h-full overflow-hidden border-gray-200 bg-white transition-all hover:scale-105 hover:border-red-400 hover:shadow-xl hover:shadow-red-100">
                    <div className="relative aspect-[2/3] overflow-hidden max-h-[200px] sm:max-h-[240px] md:max-h-[280px]">
                      {movie.thumbnailUrl ? (
                        <LazyImage
                          src={movie.thumbnailUrl}
                          alt={movie.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
                          <div className="text-center">
                            <div className="mb-4 text-6xl opacity-50">🎬</div>
                            <div className="text-xl font-bold text-gray-600 line-clamp-2 px-4">
                              {movie.title}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="film-overlay absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <div className="absolute right-3 top-3 z-20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <div className="rounded-full bg-gradient-to-r from-red-600 to-pink-600 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm shadow-lg">
                          보기 →
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="mb-2 text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-red-500 transition-colors tracking-tight">
                        {movie.title}
                      </h3>
                      <div className="mb-2 flex flex-wrap gap-2 text-xs">
                        <span className={`rounded-full border px-2.5 py-1 font-semibold ${getStatusColor(movie.status || "production")}`}>
                          {getStatusLabel(movie.status || "production")}
                        </span>
                        <span className="rounded-full bg-red-500/20 px-2.5 py-1 text-red-400 font-medium">
                          {getGenreLabel(movie.genre)}
                        </span>
                        <span className="rounded-full bg-gray-800/70 px-2.5 py-1 text-gray-300">
                          {movie.runtimeMinutes}분
                        </span>
                        {movie.year && (
                          <span className="rounded-full bg-gray-800/70 px-2.5 py-1 text-gray-300">
                            {movie.year}
                          </span>
                        )}
                      </div>
                      {/* 평점 및 리뷰 수 */}
                      {(movie.averageRating > 0 || movie.reviewCount > 0) && (
                        <div className="mb-2 flex items-center gap-3 text-xs">
                          {movie.averageRating > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="text-red-400 font-semibold">
                                {movie.averageRating.toFixed(1)}
                              </span>
                              <div className="flex items-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <span
                                    key={i}
                                    className={`text-xs ${
                                      i < Math.round(movie.averageRating)
                                        ? "text-red-400"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {movie.reviewCount > 0 && (
                            <span className="text-gray-400">
                              리뷰 {movie.reviewCount}개
                            </span>
                          )}
                        </div>
                      )}
                      {movie.logline && (
                        <p className="line-clamp-2 text-sm leading-relaxed text-gray-400">
                          {movie.logline}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {hasMore && (
              <div className="mt-12 text-center">
                <Button
                  onClick={loadMore}
                  variant="outline"
                  className="border-red-300 bg-white text-red-600 hover:bg-red-50 hover:text-red-700 font-medium"
                >
                  더 보기
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
